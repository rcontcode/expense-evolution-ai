import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calculator, Users, Layers, TrendingUp } from 'lucide-react';
import { startOfMonth } from 'date-fns';

interface AdminCostSimulatorProps {
  language: string;
}

const DEFAULT_PRICES = { free: 0, premium: 7.99, pro: 14.99, bundle: 19.99 };
const DEFAULT_LIMITS = {
  free: { ocr: 3, voice: 2, ai: 5, expenses: 15 },
  premium: { ocr: 30, voice: 15, ai: 50, expenses: 999 },
  pro: { ocr: 100, voice: 60, ai: 200, expenses: 999 },
};

export function AdminCostSimulator({ language }: AdminCostSimulatorProps) {
  const isEs = language === 'es';

  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [conversionRate, setConversionRate] = useState(5); // % of free → premium
  const [proUpgradeRate, setProUpgradeRate] = useState(2); // % of free → pro

  // AI costs by plan (real data)
  const { data: aiStats = {} as Record<string, { totalCredits: number; users: number }> } = useQuery({
    queryKey: ['sim-ai-stats'],
    queryFn: async () => {
      const currentMonth = startOfMonth(new Date()).toISOString();
      const { data: logs } = await supabase
        .from('ai_usage_logs')
        .select('user_id, credits_used')
        .gte('created_at', currentMonth)
        .eq('success', true);

      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_type');

      const planMap: Record<string, string> = {};
      (subs || []).forEach((s: any) => { planMap[s.user_id] = s.plan_type; });

      const result: Record<string, { totalCredits: number; users: Set<string> }> = {};
      (logs || []).forEach((l: any) => {
        const plan = planMap[l.user_id] || 'free';
        if (!result[plan]) result[plan] = { totalCredits: 0, users: new Set() };
        result[plan].totalCredits += l.credits_used || 0;
        result[plan].users.add(l.user_id);
      });

      const final: Record<string, { totalCredits: number; users: number }> = {};
      Object.entries(result).forEach(([k, v]) => {
        final[k] = { totalCredits: v.totalCredits, users: v.users.size };
      });
      return final;
    },
    staleTime: 300000,
  });

  // Subscription counts
  const { data: subCounts = {} as Record<string, number> } = useQuery({
    queryKey: ['sim-sub-counts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('plan_type');

      const counts: Record<string, number> = {};
      (data || []).forEach((s: any) => {
        counts[s.plan_type] = (counts[s.plan_type] || 0) + 1;
      });
      return counts;
    },
    staleTime: 300000,
  });

  // Multi-app adoption
  const { data: multiAppData = [] } = useQuery({
    queryKey: ['sim-multi-app'],
    queryFn: async () => {
      const { data } = await supabase
        .from('feature_usage_logs')
        .select('user_id, metadata');

      const userApps: Record<string, Set<string>> = {};
      (data || []).forEach((l: any) => {
        const app = (l.metadata as any)?.app || 'evofinz';
        if (!userApps[l.user_id]) userApps[l.user_id] = new Set();
        userApps[l.user_id].add(app);
      });

      const distribution = { 1: 0, 2: 0, 3: 0 };
      Object.values(userApps).forEach(apps => {
        const count = Math.min(apps.size, 3) as 1 | 2 | 3;
        distribution[count]++;
      });

      return [
        { apps: '1 app', count: distribution[1] },
        { apps: '2 apps', count: distribution[2] },
        { apps: '3 apps', count: distribution[3] },
      ];
    },
    staleTime: 300000,
  });

  // Calculations
  const COST_PER_CREDIT = 0.01; // estimated

  const freeUsers = subCounts['free'] || 0;
  const premiumUsers = subCounts['premium'] || 0;
  const proUsers = subCounts['pro'] || 0;
  const bundleUsers = subCounts['bundle'] || 0;

  const avgCostPerPlan = (plan: string) => {
    const stats = aiStats[plan];
    if (!stats || stats.users === 0) return 0;
    return (stats.totalCredits / stats.users) * COST_PER_CREDIT;
  };

  const marginPerUser = (plan: string) => {
    const price = prices[plan as keyof typeof prices] || 0;
    return price - avgCostPerPlan(plan);
  };

  const currentMRR = premiumUsers * prices.premium + proUsers * prices.pro + bundleUsers * prices.bundle;
  const projectedNewPremium = Math.round(freeUsers * (conversionRate / 100));
  const projectedNewPro = Math.round(freeUsers * (proUpgradeRate / 100));
  const projectedMRR = currentMRR + projectedNewPremium * prices.premium + projectedNewPro * prices.pro;

  const totalAICost = Object.entries(aiStats).reduce((s, [, v]) => s + v.totalCredits * COST_PER_CREDIT, 0);
  const breakEvenUsers = totalAICost > 0 ? Math.ceil(totalAICost / ((prices.premium + prices.pro) / 2)) : 0;

  const plans = ['free', 'premium', 'pro', 'bundle'];

  return (
    <div className="space-y-6">
      {/* Pricing Simulator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4 text-violet-500" />
            {isEs ? '💰 Simulador de Precios' : '💰 Pricing Simulator'}
          </CardTitle>
          <CardDescription>{isEs ? 'Ajusta precios y ve el impacto en tu margen' : 'Adjust prices and see the impact on your margin'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {plans.map(plan => (
              <div key={plan} className="space-y-2">
                <Label className="capitalize font-semibold">{plan}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={prices[plan as keyof typeof prices]}
                  onChange={e => setPrices(p => ({ ...p, [plan]: parseFloat(e.target.value) || 0 }))}
                  className="text-center font-bold"
                />
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <p>{isEs ? 'Usuarios' : 'Users'}: {subCounts[plan] || 0}</p>
                  <p>{isEs ? 'Costo IA/u' : 'AI cost/u'}: ${avgCostPerPlan(plan).toFixed(3)}</p>
                  <p className={marginPerUser(plan) >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {isEs ? 'Margen/u' : 'Margin/u'}: ${marginPerUser(plan).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Projection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            {isEs ? '📊 Proyección de Conversión' : '📊 Conversion Projection'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label>{isEs ? `Free → Premium: ${conversionRate}%` : `Free → Premium: ${conversionRate}%`}</Label>
              <Slider value={[conversionRate]} onValueChange={([v]) => setConversionRate(v)} min={0} max={30} step={1} />
              <p className="text-xs text-muted-foreground">
                {projectedNewPremium} {isEs ? 'nuevos premium' : 'new premium'} ({freeUsers} free × {conversionRate}%)
              </p>
            </div>
            <div className="space-y-3">
              <Label>{isEs ? `Free → Pro: ${proUpgradeRate}%` : `Free → Pro: ${proUpgradeRate}%`}</Label>
              <Slider value={[proUpgradeRate]} onValueChange={([v]) => setProUpgradeRate(v)} min={0} max={20} step={1} />
              <p className="text-xs text-muted-foreground">
                {projectedNewPro} {isEs ? 'nuevos pro' : 'new pro'} ({freeUsers} free × {proUpgradeRate}%)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-center">
                  <p className="text-[10px] text-white/80">MRR {isEs ? 'Actual' : 'Current'}</p>
                  <p className="text-xl font-black">${currentMRR.toFixed(0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 text-white text-center">
                  <p className="text-[10px] text-white/80">MRR {isEs ? 'Proyectado' : 'Projected'}</p>
                  <p className="text-xl font-black">${projectedMRR.toFixed(0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 text-white text-center">
                  <p className="text-[10px] text-white/80">Break-even</p>
                  <p className="text-xl font-black">{breakEvenUsers} {isEs ? 'pagos' : 'paid'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Margin per Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{isEs ? '💵 Margen por Plan' : '💵 Margin per Plan'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Plan</th>
                    <th className="pb-2">{isEs ? 'Precio' : 'Price'}</th>
                    <th className="pb-2">{isEs ? 'Costo IA' : 'AI Cost'}</th>
                    <th className="pb-2">{isEs ? 'Margen' : 'Margin'}</th>
                    <th className="pb-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => {
                    const price = prices[plan as keyof typeof prices];
                    const cost = avgCostPerPlan(plan);
                    const margin = price - cost;
                    const pct = price > 0 ? Math.round((margin / price) * 100) : 0;
                    return (
                      <tr key={plan} className="border-b last:border-0">
                        <td className="py-2"><Badge variant="outline" className="capitalize">{plan}</Badge></td>
                        <td className="py-2">${price.toFixed(2)}</td>
                        <td className="py-2 text-red-500">${cost.toFixed(3)}</td>
                        <td className={`py-2 font-bold ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${margin.toFixed(2)}</td>
                        <td className="py-2">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Multi-App Adoption */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-500" />
              {isEs ? '📱 Adopción Multi-App' : '📱 Multi-App Adoption'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {multiAppData.map((item) => {
                const total = multiAppData.reduce((s, d) => s + d.count, 0) || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.apps} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.apps}</span>
                      <span className="text-muted-foreground">{item.count} {isEs ? 'usuarios' : 'users'} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {multiAppData.every(d => d.count === 0) && (
                <p className="text-center text-muted-foreground py-4">{isEs ? 'Sin datos de adopción' : 'No adoption data'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
