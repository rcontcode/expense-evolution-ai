import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, DollarSign, TrendingUp, TrendingDown, PieChart, Users, Zap, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth } from 'date-fns';

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  premium: 7.99,
  pro: 14.99,
  bundle: 19.99,
  pro_beta: 0,
};

interface AdminBusinessPnLProps {
  language: string;
}

const COST_CATEGORIES = [
  { value: 'hosting', label: { es: 'Hosting (Lovable)', en: 'Hosting (Lovable)' } },
  { value: 'domain', label: { es: 'Dominios', en: 'Domains' } },
  { value: 'email', label: { es: 'Email (Resend)', en: 'Email (Resend)' } },
  { value: 'stripe_fees', label: { es: 'Stripe Fees (~2.9%)', en: 'Stripe Fees (~2.9%)' } },
  { value: 'ai_api', label: { es: 'API de IA', en: 'AI API' } },
  { value: 'other', label: { es: 'Otros', en: 'Other' } },
];

const PIE_COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#6b7280'];

export function AdminBusinessPnL({ language }: AdminBusinessPnLProps) {
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const [addCostOpen, setAddCostOpen] = useState(false);
  const [costCategory, setCostCategory] = useState('hosting');
  const [costDesc, setCostDesc] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [costPeriod, setCostPeriod] = useState('monthly');
  const [costMonth, setCostMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Fetch Stripe revenue
  const { data: stripeData, isLoading: stripeLoading } = useQuery({
    queryKey: ['admin-stripe-revenue'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const res = await supabase.functions.invoke('stripe-revenue', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) throw res.error;
      return res.data;
    },
    staleTime: 300000,
  });

  // Fetch AI costs from ai_usage_logs
  const { data: aiCosts = [] } = useQuery({
    queryKey: ['admin-ai-costs'],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 6).toISOString();
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('credits_used, created_at, action_type')
        .gte('created_at', sixMonthsAgo)
        .eq('success', true);
      if (error) throw error;
      return data || [];
    },
    staleTime: 300000,
  });

  // Fetch AI costs by plan (join with user_subscriptions)
  const { data: aiCostsByPlan = [] } = useQuery({
    queryKey: ['admin-ai-costs-by-plan'],
    queryFn: async () => {
      const currentMonth = startOfMonth(new Date()).toISOString();
      const { data: logs, error: logsError } = await supabase
        .from('ai_usage_logs')
        .select('user_id, credits_used')
        .gte('created_at', currentMonth)
        .eq('success', true);
      if (logsError) throw logsError;

      const { data: subs, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_type');
      if (subsError) throw subsError;

      const planMap: Record<string, string> = {};
      (subs || []).forEach((s: any) => { planMap[s.user_id] = s.plan_type; });

      const result: Record<string, { plan: string; totalCredits: number; userCount: Set<string> }> = {};
      (logs || []).forEach((log: any) => {
        const plan = planMap[log.user_id] || 'free';
        if (!result[plan]) result[plan] = { plan, totalCredits: 0, userCount: new Set() };
        result[plan].totalCredits += log.credits_used || 0;
        result[plan].userCount.add(log.user_id);
      });

      return Object.values(result).map(r => ({
        plan: r.plan,
        totalCredits: r.totalCredits,
        users: r.userCount.size,
        avgPerUser: r.userCount.size > 0 ? Math.round(r.totalCredits / r.userCount.size) : 0,
        estimatedCost: Math.round(r.totalCredits * 0.01 * 100) / 100, // ~$0.01 per credit estimate
      }));
    },
    staleTime: 300000,
  });

  // Fetch operational costs
  const { data: opCosts = [] } = useQuery({
    queryKey: ['admin-operational-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_operational_costs')
        .select('*')
        .order('month', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 300000,
  });

  // Fetch AI cost by action_type (feature/app breakdown)
  const { data: aiCostsByFeature = [] } = useQuery({
    queryKey: ['admin-ai-costs-by-feature'],
    queryFn: async () => {
      const currentMonth = startOfMonth(new Date()).toISOString();
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('action_type, credits_used, user_id')
        .gte('created_at', currentMonth)
        .eq('success', true);
      if (error) throw error;

      const result: Record<string, { credits: number; users: Set<string> }> = {};
      (data || []).forEach((log: any) => {
        const key = log.action_type || 'unknown';
        if (!result[key]) result[key] = { credits: 0, users: new Set() };
        result[key].credits += log.credits_used || 0;
        result[key].users.add(log.user_id);
      });

      return Object.entries(result)
        .map(([feature, d]) => ({
          feature,
          credits: d.credits,
          users: d.users.size,
          cost: Math.round(d.credits * 0.01 * 100) / 100,
        }))
        .sort((a, b) => b.credits - a.credits);
    },
    staleTime: 300000,
  });

  // Fetch top AI consumers (per user)
  const { data: topConsumers = [] } = useQuery({
    queryKey: ['admin-top-ai-consumers'],
    queryFn: async () => {
      const currentMonth = startOfMonth(new Date()).toISOString();
      const { data: logs, error: logsErr } = await supabase
        .from('ai_usage_logs')
        .select('user_id, credits_used')
        .gte('created_at', currentMonth)
        .eq('success', true);
      if (logsErr) throw logsErr;

      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, email, full_name');
      if (profErr) throw profErr;

      const { data: subs, error: subsErr } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_type');
      if (subsErr) throw subsErr;

      const profileMap: Record<string, { email: string; name: string }> = {};
      (profiles || []).forEach((p: any) => {
        profileMap[p.id] = { email: p.email || '', name: p.full_name || '' };
      });

      const planMap: Record<string, string> = {};
      (subs || []).forEach((s: any) => { planMap[s.user_id] = s.plan_type; });

      const userCredits: Record<string, number> = {};
      (logs || []).forEach((l: any) => {
        userCredits[l.user_id] = (userCredits[l.user_id] || 0) + (l.credits_used || 0);
      });

      return Object.entries(userCredits)
        .map(([userId, credits]) => {
          const plan = planMap[userId] || 'free';
          const price = PLAN_PRICES[plan] ?? 0;
          const aiCost = Math.round(credits * 0.01 * 100) / 100;
          const roi = Math.round((price - aiCost) * 100) / 100;
          const profile = profileMap[userId];
          const displayName = profile?.name || profile?.email?.split('@')[0] || userId.substring(0, 8);
          return { userId, displayName, plan, price, credits, aiCost, roi };
        })
        .sort((a, b) => b.credits - a.credits)
        .slice(0, 15);
    },
    staleTime: 300000,
  });

  // Add cost mutation
  const addCost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('admin_operational_costs').insert({
        category: costCategory,
        description: costDesc.trim() || null,
        amount_usd: parseFloat(costAmount),
        period: costPeriod,
        month: `${costMonth}-01`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-operational-costs'] });
      setAddCostOpen(false);
      setCostDesc('');
      setCostAmount('');
      toast.success(isEs ? '✅ Costo agregado' : '✅ Cost added');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteCost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_operational_costs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-operational-costs'] });
      toast.success(isEs ? 'Eliminado' : 'Deleted');
    },
  });

  // Calculate totals
  const mrr = stripeData?.mrr || 0;
  const arr = stripeData?.arr || 0;
  const revenue30d = stripeData?.revenue30d || 0;

  const totalMonthlyOpCosts = opCosts
    .filter((c: any) => c.period === 'monthly')
    .reduce((sum: number, c: any) => sum + Number(c.amount_usd), 0)
    + opCosts
      .filter((c: any) => c.period === 'annual')
      .reduce((sum: number, c: any) => sum + Number(c.amount_usd) / 12, 0);

  const totalAICostMonth = aiCostsByPlan.reduce((s, p) => s + p.estimatedCost, 0);
  const totalCosts = totalMonthlyOpCosts + totalAICostMonth;
  const netMargin = mrr - totalCosts;
  const marginPercent = mrr > 0 ? Math.round((netMargin / mrr) * 100) : 0;
  const globalROI = totalCosts > 0 ? Math.round(((mrr - totalCosts) / totalCosts) * 100) : mrr > 0 ? 999 : 0;

  // Build P&L by plan
  const pnlByPlan = aiCostsByPlan.map(row => {
    const price = PLAN_PRICES[row.plan] ?? 0;
    const revenue = price * row.users;
    const profit = revenue - row.estimatedCost;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : row.estimatedCost > 0 ? -100 : 0;
    return { plan: row.plan, subscribers: row.users, price, revenue: Math.round(revenue * 100) / 100, aiCost: row.estimatedCost, profit: Math.round(profit * 100) / 100, margin };
  });
  const pnlTotals = pnlByPlan.reduce((acc, r) => ({
    subscribers: acc.subscribers + r.subscribers,
    revenue: acc.revenue + r.revenue,
    aiCost: acc.aiCost + r.aiCost,
    profit: acc.profit + r.profit,
  }), { subscribers: 0, revenue: 0, aiCost: 0, profit: 0 });

  // Build 6-month trend data
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const monthKey = format(month, 'yyyy-MM');
    const monthLabel = format(month, 'MMM');

    const aiCreditsMonth = aiCosts
      .filter((l: any) => l.created_at?.startsWith(monthKey))
      .reduce((s: number, l: any) => s + (l.credits_used || 0), 0);

    const opCostMonth = opCosts
      .filter((c: any) => c.month?.startsWith(monthKey) && c.period === 'monthly')
      .reduce((s: number, c: any) => s + Number(c.amount_usd), 0)
      + opCosts
        .filter((c: any) => c.period === 'annual')
        .reduce((s: number, c: any) => s + Number(c.amount_usd) / 12, 0);

    const costTotal = aiCreditsMonth * 0.01 + opCostMonth;

    return {
      month: monthLabel,
      revenue: Math.round(mrr * 100) / 100, // simplified: use current MRR
      costs: Math.round(costTotal * 100) / 100,
      margin: Math.round((mrr - costTotal) * 100) / 100,
    };
  });

  // Pie chart data
  const pieData = [
    { name: isEs ? 'IA' : 'AI', value: Math.round(totalAICostMonth * 100) / 100 },
    ...COST_CATEGORIES.filter(c => c.value !== 'ai_api').map(cat => ({
      name: cat.label[isEs ? 'es' : 'en'],
      value: Math.round(
        opCosts
          .filter((c: any) => c.category === cat.value && c.period === 'monthly')
          .reduce((s: number, c: any) => s + Number(c.amount_usd), 0) * 100
      ) / 100,
    })).filter(d => d.value > 0),
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 text-white">
              <p className="text-xs text-white/80">MRR</p>
              <p className="text-2xl font-black">${mrr.toFixed(2)}</p>
              <p className="text-[10px] text-white/70">ARR: ${arr.toFixed(0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <p className="text-xs text-white/80">{isEs ? 'Revenue 30d' : 'Revenue 30d'}</p>
              <p className="text-2xl font-black">${revenue30d.toFixed(2)}</p>
              {stripeData?.revenueGrowth !== undefined && (
                <p className="text-[10px] text-white/70 flex items-center gap-1">
                  {stripeData.revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stripeData.revenueGrowth}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 bg-gradient-to-br from-red-500 to-orange-500 text-white">
              <p className="text-xs text-white/80">{isEs ? 'Costos/mes' : 'Costs/mo'}</p>
              <p className="text-2xl font-black">${totalCosts.toFixed(2)}</p>
              <p className="text-[10px] text-white/70">IA: ${totalAICostMonth.toFixed(2)} | Op: ${totalMonthlyOpCosts.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className={`p-4 bg-gradient-to-br ${netMargin >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-600 to-rose-700'} text-white`}>
              <p className="text-xs text-white/80">{isEs ? 'Margen Neto' : 'Net Margin'}</p>
              <p className="text-2xl font-black">${netMargin.toFixed(2)}</p>
              <p className="text-[10px] text-white/70">{marginPercent}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className={`p-4 bg-gradient-to-br ${globalROI >= 0 ? 'from-violet-500 to-purple-600' : 'from-rose-600 to-red-700'} text-white`}>
              <p className="text-xs text-white/80">ROI</p>
              <p className="text-2xl font-black">{globalROI}%</p>
              <p className="text-[10px] text-white/70">{isEs ? 'Retorno s/ inversión' : 'Return on investment'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              {isEs ? 'Tendencia Ingresos vs Costos' : 'Revenue vs Costs Trend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name={isEs ? 'Ingresos' : 'Revenue'} />
                <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} name={isEs ? 'Costos' : 'Costs'} />
                <Line type="monotone" dataKey="margin" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name={isEs ? 'Margen' : 'Margin'} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-violet-500" />
              {isEs ? 'Distribución de Costos' : 'Cost Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: $${value}`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">{isEs ? 'Sin datos de costos' : 'No cost data'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Cost by Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{isEs ? '🤖 Costo de IA por Plan (mes actual)' : '🤖 AI Cost by Plan (current month)'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 font-medium">{isEs ? 'Usuarios' : 'Users'}</th>
                  <th className="pb-2 font-medium">{isEs ? 'Créditos Total' : 'Total Credits'}</th>
                  <th className="pb-2 font-medium">{isEs ? 'Prom/Usuario' : 'Avg/User'}</th>
                  <th className="pb-2 font-medium">{isEs ? 'Costo Est.' : 'Est. Cost'}</th>
                </tr>
              </thead>
              <tbody>
                {aiCostsByPlan.map((row) => (
                  <tr key={row.plan} className="border-b last:border-0">
                    <td className="py-2"><Badge variant="outline" className="capitalize">{row.plan}</Badge></td>
                    <td className="py-2">{row.users}</td>
                    <td className="py-2">{row.totalCredits}</td>
                    <td className="py-2">{row.avgPerUser}</td>
                    <td className="py-2 font-semibold">${row.estimatedCost.toFixed(2)}</td>
                  </tr>
                ))}
                {aiCostsByPlan.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">{isEs ? 'Sin datos' : 'No data'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Operational Costs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">{isEs ? '📋 Costos Operativos' : '📋 Operational Costs'}</CardTitle>
            <CardDescription>{isEs ? 'Costos fijos y variables del negocio' : 'Fixed and variable business costs'}</CardDescription>
          </div>
          <Button size="sm" onClick={() => setAddCostOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {isEs ? 'Agregar' : 'Add'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">{isEs ? 'Categoría' : 'Category'}</th>
                  <th className="pb-2 font-medium">{isEs ? 'Descripción' : 'Description'}</th>
                  <th className="pb-2 font-medium">{isEs ? 'Monto' : 'Amount'}</th>
                  <th className="pb-2 font-medium">{isEs ? 'Periodo' : 'Period'}</th>
                  <th className="pb-2 font-medium">{isEs ? 'Mes' : 'Month'}</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {opCosts.map((c: any) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2"><Badge variant="outline" className="capitalize">{c.category}</Badge></td>
                    <td className="py-2 text-muted-foreground">{c.description || '—'}</td>
                    <td className="py-2 font-semibold">${Number(c.amount_usd).toFixed(2)}</td>
                    <td className="py-2">{c.period}</td>
                    <td className="py-2">{c.month?.substring(0, 7)}</td>
                    <td className="py-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCost.mutate(c.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {opCosts.length === 0 && (
                  <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">{isEs ? 'Sin costos registrados' : 'No costs registered'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Cost Dialog */}
      <Dialog open={addCostOpen} onOpenChange={setAddCostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEs ? 'Agregar Costo Operativo' : 'Add Operational Cost'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isEs ? 'Categoría' : 'Category'}</Label>
              <Select value={costCategory} onValueChange={setCostCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COST_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label[isEs ? 'es' : 'en']}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isEs ? 'Descripción' : 'Description'}</Label>
              <Input value={costDesc} onChange={e => setCostDesc(e.target.value)} placeholder={isEs ? 'Ej: Plan Pro Lovable' : 'E.g.: Lovable Pro Plan'} />
            </div>
            <div>
              <Label>{isEs ? 'Monto (USD)' : 'Amount (USD)'}</Label>
              <Input type="number" step="0.01" value={costAmount} onChange={e => setCostAmount(e.target.value)} placeholder="29.99" />
            </div>
            <div>
              <Label>{isEs ? 'Periodo' : 'Period'}</Label>
              <Select value={costPeriod} onValueChange={setCostPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{isEs ? 'Mensual' : 'Monthly'}</SelectItem>
                  <SelectItem value="annual">{isEs ? 'Anual' : 'Annual'}</SelectItem>
                  <SelectItem value="one_time">{isEs ? 'Único' : 'One-time'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isEs ? 'Mes' : 'Month'}</Label>
              <Input type="month" value={costMonth} onChange={e => setCostMonth(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => addCost.mutate()} disabled={!costAmount || addCost.isPending}>
              {addCost.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {isEs ? 'Guardar' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
