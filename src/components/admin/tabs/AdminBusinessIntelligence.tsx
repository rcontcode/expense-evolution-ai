import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { Globe, Languages, TrendingDown, TrendingUp, AlertTriangle, Lightbulb, DollarSign, Users } from 'lucide-react';

interface Props { language: string; }

const REGION_MAP: Record<string, string> = {
  CL: 'Latam', MX: 'Latam', AR: 'Latam', CO: 'Latam', PE: 'Latam', EC: 'Latam', VE: 'Latam', BO: 'Latam',
  UY: 'Latam', PY: 'Latam', CR: 'Latam', PA: 'Latam', GT: 'Latam', HN: 'Latam', SV: 'Latam', NI: 'Latam', DO: 'Latam', CU: 'Latam', PR: 'Latam',
  US: 'North America', CA: 'North America',
  ES: 'Europe', PT: 'Europe', FR: 'Europe', DE: 'Europe', IT: 'Europe', GB: 'Europe', NL: 'Europe',
};
const EN_COUNTRIES = new Set(['US', 'CA', 'GB', 'AU', 'NZ', 'IE']);
const PLAN_PRICES: Record<string, number> = { free: 0, premium: 7.99, pro: 14.99, bundle: 19.99, pro_beta: 0 };
const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];
const COST_PER_CREDIT = 0.015;

export function AdminBusinessIntelligence({ language }: Props) {
  const isEs = language === 'es';

  // Fetch all leads
  const { data: leads = [] } = useQuery({
    queryKey: ['bi-leads'],
    queryFn: async () => {
      const { data } = await supabase.from('quiz_leads').select('id, email, country, source, converted_to_user, pipeline_stage, contacted_at, created_at');
      return data || [];
    },
  });

  // Fetch subscriptions
  const { data: subs = [] } = useQuery({
    queryKey: ['bi-subs'],
    queryFn: async () => {
      const { data } = await supabase.from('user_subscriptions').select('user_id, plan_type, is_active');
      return data || [];
    },
  });

  // Fetch profiles to cross-reference
  const { data: profiles = [] } = useQuery({
    queryKey: ['bi-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, email');
      return data || [];
    },
  });

  // Fetch AI usage for cost calculations
  const { data: aiUsage = [] } = useQuery({
    queryKey: ['bi-ai-usage'],
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data } = await supabase.from('ai_usage_logs').select('user_id, credits_used, action_type').gte('created_at', startOfMonth);
      return data || [];
    },
  });

  // Stripe analytics
  const { data: stripeData } = useQuery({
    queryKey: ['bi-stripe'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase.functions.invoke('stripe-analytics', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      return data;
    },
  });

  // Build email→profile map
  const emailToProfile = new Map(profiles.map(p => [p.email?.toLowerCase(), p]));
  const userIdToPlan = new Map(subs.map(s => [s.user_id, s.plan_type]));

  // ===== A. GEO ANALYSIS =====
  const countryStats = new Map<string, { leads: number; registered: number; paid: number }>();
  leads.forEach(lead => {
    const c = (lead.country || 'Unknown').toUpperCase().trim();
    const stat = countryStats.get(c) || { leads: 0, registered: 0, paid: 0 };
    stat.leads++;
    if (lead.converted_to_user) {
      stat.registered++;
      const profile = emailToProfile.get(lead.email?.toLowerCase());
      if (profile) {
        const plan = userIdToPlan.get(profile.id);
        if (plan && plan !== 'free' && (plan as string) !== 'pro_beta') stat.paid++;
      }
    }
    countryStats.set(c, stat);
  });

  const geoData = Array.from(countryStats.entries())
    .map(([country, s]) => ({
      country,
      ...s,
      convRate: s.leads > 0 ? Math.round((s.paid / s.leads) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  const topCountries = geoData.slice(0, 10);

  // ===== B. LANGUAGE ANALYSIS =====
  let esLeads = 0, enLeads = 0, esConverted = 0, enConverted = 0, esPaid = 0, enPaid = 0;
  leads.forEach(lead => {
    const c = (lead.country || '').toUpperCase().trim();
    const isEn = EN_COUNTRIES.has(c);
    if (isEn) { enLeads++; } else { esLeads++; }
    if (lead.converted_to_user) {
      if (isEn) enConverted++; else esConverted++;
      const profile = emailToProfile.get(lead.email?.toLowerCase());
      if (profile) {
        const plan = userIdToPlan.get(profile.id);
        if (plan && plan !== 'free' && plan !== 'pro_beta') {
          if (isEn) enPaid++; else esPaid++;
        }
      }
    }
  });

  const langData = [
    { lang: 'Español', leads: esLeads, converted: esConverted, paid: esPaid, convRate: esLeads > 0 ? Math.round((esPaid / esLeads) * 10000) / 100 : 0 },
    { lang: 'English', leads: enLeads, converted: enConverted, paid: enPaid, convRate: enLeads > 0 ? Math.round((enPaid / enLeads) * 10000) / 100 : 0 },
  ];
  const langPie = [{ name: 'Español', value: esLeads }, { name: 'English', value: enLeads }];

  // ===== C. FUNNEL =====
  const totalLeads = leads.length;
  const contacted = leads.filter(l => l.contacted_at).length;
  const registered = leads.filter(l => l.converted_to_user).length;
  const activeSubs = subs.filter(s => s.is_active).length;
  const paidSubs = subs.filter(s => s.is_active && s.plan_type !== 'free' && s.plan_type !== 'pro_beta').length;

  const funnelData = [
    { stage: isEs ? 'Leads' : 'Leads', value: totalLeads, color: COLORS[0] },
    { stage: isEs ? 'Contactados' : 'Contacted', value: contacted, color: COLORS[1] },
    { stage: isEs ? 'Registrados' : 'Registered', value: registered, color: COLORS[2] },
    { stage: isEs ? 'Activos' : 'Active', value: activeSubs, color: COLORS[3] },
    { stage: isEs ? 'Pagos' : 'Paid', value: paidSubs, color: COLORS[4] },
  ];

  // Funnel by source
  const sources = ['evofinz', 'fokuspark', 'universmind'];
  const funnelBySource = sources.map(src => {
    const srcLeads = leads.filter(l => l.source === src);
    const srcContacted = srcLeads.filter(l => l.contacted_at).length;
    const srcRegistered = srcLeads.filter(l => l.converted_to_user).length;
    return { source: src, leads: srcLeads.length, contacted: srcContacted, registered: srcRegistered };
  });

  // ===== D. PRICING SUGGESTIONS =====
  const suggestions: Array<{ priority: 'high' | 'medium' | 'low'; message: string }> = [];
  
  // AI cost by plan
  const aiCostByPlan = new Map<string, number>();
  const revenueByPlan = new Map<string, number>();
  const subsByPlan = new Map<string, number>();
  
  subs.filter(s => s.is_active).forEach(s => {
    const plan = s.plan_type || 'free';
    subsByPlan.set(plan, (subsByPlan.get(plan) || 0) + 1);
    revenueByPlan.set(plan, (revenueByPlan.get(plan) || 0) + (PLAN_PRICES[plan] || 0));
  });

  aiUsage.forEach(u => {
    const plan = userIdToPlan.get(u.user_id) || 'free';
    aiCostByPlan.set(plan, (aiCostByPlan.get(plan) || 0) + (u.credits_used || 0) * COST_PER_CREDIT);
  });

  // Generate suggestions
  ['premium', 'pro', 'bundle'].forEach(plan => {
    const rev = revenueByPlan.get(plan) || 0;
    const cost = aiCostByPlan.get(plan) || 0;
    const count = subsByPlan.get(plan) || 0;
    if (count === 0) return;
    const margin = rev > 0 ? ((rev - cost) / rev) * 100 : 0;
    
    if (margin < 20 && rev > 0) {
      suggestions.push({ priority: 'high', message: isEs 
        ? `⚠️ Plan ${plan}: margen solo ${margin.toFixed(1)}%. Considera subir precio o limitar créditos IA.`
        : `⚠️ Plan ${plan}: margin only ${margin.toFixed(1)}%. Consider raising price or limiting AI credits.` });
    }
    if (margin > 80) {
      suggestions.push({ priority: 'low', message: isEs
        ? `✨ Plan ${plan}: margen ${margin.toFixed(1)}%. Hay espacio para agregar más features premium.`
        : `✨ Plan ${plan}: margin ${margin.toFixed(1)}%. Room to add more premium features.` });
    }
  });

  const freeCost = aiCostByPlan.get('free') || 0;
  const freeCount = subsByPlan.get('free') || 0;
  if (freeCount > 0 && freeCost / freeCount > 0.5) {
    suggestions.push({ priority: 'high', message: isEs
      ? `🚨 Usuarios free cuestan $${(freeCost / freeCount).toFixed(2)}/usuario en IA. Reduce límite free o implementa trial.`
      : `🚨 Free users cost $${(freeCost / freeCount).toFixed(2)}/user in AI. Reduce free limit or implement trial.` });
  }

  const churnRate = stripeData?.churn?.churnRate30d || 0;
  if (churnRate > 5) {
    suggestions.push({ priority: 'high', message: isEs
      ? `📉 Churn ${churnRate}% > 5%. Considera descuentos anuales, features exclusivas o programa de retención.`
      : `📉 Churn ${churnRate}% > 5%. Consider annual discounts, exclusive features or retention program.` });
  }

  const totalConvRate = totalLeads > 0 ? (paidSubs / totalLeads) * 100 : 0;
  if (totalConvRate < 2 && totalLeads > 50) {
    suggestions.push({ priority: 'medium', message: isEs
      ? `🔄 Conversión lead→pago solo ${totalConvRate.toFixed(1)}%. Optimiza el funnel o mejora el onboarding.`
      : `🔄 Lead→paid conversion only ${totalConvRate.toFixed(1)}%. Optimize funnel or improve onboarding.` });
  }

  if (suggestions.length === 0) {
    suggestions.push({ priority: 'low', message: isEs ? '✅ No hay alertas críticas. Los márgenes y métricas están saludables.' : '✅ No critical alerts. Margins and metrics are healthy.' });
  }

  // ===== E. REGIONAL REVENUE =====
  const regionRevenue = new Map<string, Record<string, number>>();
  leads.forEach(lead => {
    if (!lead.converted_to_user) return;
    const c = (lead.country || '').toUpperCase().trim();
    const region = REGION_MAP[c] || (isEs ? 'Otros' : 'Other');
    const profile = emailToProfile.get(lead.email?.toLowerCase());
    if (!profile) return;
    const plan = userIdToPlan.get(profile.id) || 'free';
    const price = PLAN_PRICES[plan] || 0;
    if (!regionRevenue.has(region)) regionRevenue.set(region, {});
    const rr = regionRevenue.get(region)!;
    rr[plan] = (rr[plan] || 0) + price;
  });

  const regionData = Array.from(regionRevenue.entries()).map(([region, plans]) => ({
    region,
    ...plans,
    total: Object.values(plans).reduce((a, b) => a + b, 0),
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{isEs ? '🧠 Business Intelligence' : '🧠 Business Intelligence'}</h2>
          <p className="text-sm text-muted-foreground">{isEs ? 'Geografía, idioma, funnel y sugerencias de pricing' : 'Geography, language, funnel and pricing suggestions'}</p>
        </div>
      </div>

      {/* ===== A. GEO ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> {isEs ? 'Distribución Geográfica' : 'Geographic Distribution'}</CardTitle>
          <CardDescription>{isEs ? 'Leads, registros y pagos por país' : 'Leads, registrations and payments by country'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCountries} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="country" type="category" width={50} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" name="Leads" />
                  <Bar dataKey="registered" fill="#10b981" name={isEs ? 'Registrados' : 'Registered'} />
                  <Bar dataKey="paid" fill="#f59e0b" name={isEs ? 'Pagos' : 'Paid'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-auto max-h-72">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2">{isEs ? 'País' : 'Country'}</th>
                    <th className="text-right">Leads</th>
                    <th className="text-right">{isEs ? 'Reg.' : 'Reg.'}</th>
                    <th className="text-right">{isEs ? 'Pagos' : 'Paid'}</th>
                    <th className="text-right">{isEs ? 'Conv %' : 'Conv %'}</th>
                  </tr>
                </thead>
                <tbody>
                  {geoData.map(g => (
                    <tr key={g.country} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="py-1.5 font-medium">{g.country}</td>
                      <td className="text-right">{g.leads}</td>
                      <td className="text-right">{g.registered}</td>
                      <td className="text-right">{g.paid}</td>
                      <td className="text-right">
                        <Badge variant={g.convRate > 5 ? 'success' : g.convRate > 0 ? 'warning' : 'secondary'} className="text-[10px]">
                          {g.convRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== B. LANGUAGE ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Languages className="h-5 w-5" /> {isEs ? 'Análisis por Idioma' : 'Language Analysis'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={langPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {langPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="md:col-span-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2">{isEs ? 'Idioma' : 'Language'}</th>
                    <th className="text-right">Leads</th>
                    <th className="text-right">{isEs ? 'Convertidos' : 'Converted'}</th>
                    <th className="text-right">{isEs ? 'Pagos' : 'Paid'}</th>
                    <th className="text-right">{isEs ? 'Conv %' : 'Conv %'}</th>
                  </tr>
                </thead>
                <tbody>
                  {langData.map(l => (
                    <tr key={l.lang} className="border-b border-border/30">
                      <td className="py-2 font-medium">{l.lang}</td>
                      <td className="text-right">{l.leads}</td>
                      <td className="text-right">{l.converted}</td>
                      <td className="text-right">{l.paid}</td>
                      <td className="text-right">
                        <Badge variant={l.convRate > 3 ? 'success' : 'warning'} className="text-xs">{l.convRate}%</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {esLeads > 0 && enLeads > 0 && (
                <p className="mt-3 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                  💡 {langData[0].convRate > langData[1].convRate
                    ? (isEs ? `Los leads en español convierten ${(langData[0].convRate - langData[1].convRate).toFixed(1)}% más que los de inglés.` : `Spanish leads convert ${(langData[0].convRate - langData[1].convRate).toFixed(1)}% more than English.`)
                    : (isEs ? `Los leads en inglés convierten ${(langData[1].convRate - langData[0].convRate).toFixed(1)}% más que los de español.` : `English leads convert ${(langData[1].convRate - langData[0].convRate).toFixed(1)}% more than Spanish.`)
                  }
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== C. FUNNEL ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5" /> {isEs ? 'Funnel de Conversión' : 'Conversion Funnel'}</CardTitle>
          <CardDescription>{isEs ? 'De lead a cliente de pago' : 'From lead to paying customer'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Visual funnel */}
            <div className="space-y-2">
              {funnelData.map((stage, i) => {
                const widthPct = totalLeads > 0 ? Math.max((stage.value / totalLeads) * 100, 8) : 8;
                const dropRate = i > 0 && funnelData[i - 1].value > 0
                  ? Math.round(((funnelData[i - 1].value - stage.value) / funnelData[i - 1].value) * 100)
                  : 0;
                return (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 rounded-lg flex items-center px-3 text-xs font-bold text-white transition-all"
                        style={{ width: `${widthPct}%`, backgroundColor: stage.color, minWidth: 80 }}
                      >
                        {stage.value}
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap">{stage.stage}</span>
                      {i > 0 && dropRate > 0 && (
                        <Badge variant="destructive" className="text-[10px]">-{dropRate}%</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground mt-2">
                {isEs ? `Tasa global lead→pago: ${totalConvRate.toFixed(1)}%` : `Overall lead→paid rate: ${totalConvRate.toFixed(1)}%`}
              </p>
            </div>

            {/* By source */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{isEs ? 'Por App' : 'By App'}</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelBySource}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="leads" fill="hsl(var(--primary))" name="Leads" />
                    <Bar dataKey="contacted" fill="#10b981" name={isEs ? 'Contactados' : 'Contacted'} />
                    <Bar dataKey="registered" fill="#f59e0b" name={isEs ? 'Registrados' : 'Registered'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== D. PRICING SUGGESTIONS ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-warning" /> {isEs ? 'Sugerencias de Pricing' : 'Pricing Suggestions'}</CardTitle>
          <CardDescription>{isEs ? 'Recomendaciones basadas en márgenes reales y métricas' : 'Recommendations based on real margins and metrics'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
              s.priority === 'high' ? 'border-destructive/30 bg-destructive/5' :
              s.priority === 'medium' ? 'border-warning/30 bg-warning/5' :
              'border-border bg-muted/20'
            }`}>
              <Badge variant={s.priority === 'high' ? 'destructive' : s.priority === 'medium' ? 'warning' : 'success'} className="text-[10px] mt-0.5 shrink-0">
                {s.priority === 'high' ? (isEs ? 'URGENTE' : 'URGENT') : s.priority === 'medium' ? (isEs ? 'REVISAR' : 'REVIEW') : 'OK'}
              </Badge>
              <p className="text-sm">{s.message}</p>
            </div>
          ))}

          {/* Plan margin table */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">{isEs ? 'Margen por Plan (mes actual)' : 'Margin by Plan (current month)'}</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">Plan</th>
                  <th className="text-right">{isEs ? 'Subs' : 'Subs'}</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">{isEs ? 'Costo IA' : 'AI Cost'}</th>
                  <th className="text-right">{isEs ? 'Margen' : 'Margin'}</th>
                  <th className="text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {['free', 'premium', 'pro', 'bundle', 'pro_beta'].map(plan => {
                  const count = subsByPlan.get(plan) || 0;
                  if (count === 0) return null;
                  const rev = revenueByPlan.get(plan) || 0;
                  const cost = aiCostByPlan.get(plan) || 0;
                  const margin = rev - cost;
                  const marginPct = rev > 0 ? (margin / rev) * 100 : cost > 0 ? -100 : 0;
                  return (
                    <tr key={plan} className="border-b border-border/30">
                      <td className="py-1.5 font-medium capitalize">{plan.replace('_', ' ')}</td>
                      <td className="text-right">{count}</td>
                      <td className="text-right">${rev.toFixed(2)}</td>
                      <td className="text-right text-destructive">${cost.toFixed(2)}</td>
                      <td className="text-right font-semibold" style={{ color: margin >= 0 ? '#10b981' : '#ef4444' }}>
                        ${margin.toFixed(2)}
                      </td>
                      <td className="text-right">
                        <Badge variant={marginPct > 50 ? 'success' : marginPct > 20 ? 'warning' : 'destructive'} className="text-[10px]">
                          {marginPct.toFixed(0)}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ===== E. REGIONAL REVENUE ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> {isEs ? 'Revenue por Región' : 'Revenue by Region'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="premium" stackId="a" fill="#8b5cf6" name="Premium" />
                  <Bar dataKey="pro" stackId="a" fill="#10b981" name="Pro" />
                  <Bar dataKey="bundle" stackId="a" fill="#f59e0b" name="Bundle" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2">{isEs ? 'Región' : 'Region'}</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {regionData.map(r => {
                    const totalRev = regionData.reduce((a, b) => a + b.total, 0);
                    return (
                      <tr key={r.region} className="border-b border-border/30">
                        <td className="py-1.5 font-medium">{r.region}</td>
                        <td className="text-right">${r.total.toFixed(2)}</td>
                        <td className="text-right">{totalRev > 0 ? ((r.total / totalRev) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
