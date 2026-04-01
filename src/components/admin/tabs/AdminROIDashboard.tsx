import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, DollarSign, TrendingUp, Users, Target, ArrowRight, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Props {
  language: 'es' | 'en';
}

interface QuizLead {
  id: string;
  name: string;
  email: string;
  source: string | null;
  priority: string | null;
  lead_score: number | null;
  converted_to_user: boolean | null;
  converted_at: string | null;
  created_at: string;
}

interface Subscription {
  user_id: string;
  plan_type: string;
  billing_period: string | null;
  is_active: boolean;
  started_at: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
}

const PLAN_VALUES: Record<string, number> = {
  premium: 14.99,
  pro: 9.99,
  free: 0,
};

const BILLING_MULTIPLIER: Record<string, number> = {
  monthly: 1,
  annual: 12,
  yearly: 12,
};

const PIE_COLORS = ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(0, 84%, 60%)', 'hsl(280, 67%, 51%)'];

const SOURCE_COLORS: Record<string, string> = {
  evofinz: '#10b981',
  fokuspark: '#8b5cf6',
  universmind: '#7c3aed',
};

const SOURCE_LABELS: Record<string, string> = {
  evofinz: '💰 EvoFinz',
  fokuspark: '🧠 Fokuspark',
  universmind: '🌌 UniversMind',
};

const getSourceKey = (source: string) => {
  const s = (source || 'evofinz').toLowerCase();
  if (s.includes('fokus')) return 'fokuspark';
  if (s.includes('univers')) return 'universmind';
  return 'evofinz';
};

export function AdminROIDashboard({ language }: Props) {
  const isEs = language === 'es';

  // Fetch leads
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['roi-quiz-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('id, name, email, source, priority, lead_score, converted_to_user, converted_at, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as QuizLead[];
    },
  });

  // Fetch profiles (for email mapping)
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['roi-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email');
      if (error) throw error;
      return (data || []) as Profile[];
    },
  });

  // Fetch subscriptions
  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ['roi-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_type, billing_period, is_active, started_at, created_at');
      if (error) throw error;
      return (data || []) as Subscription[];
    },
  });

  const isLoading = leadsLoading || profilesLoading || subsLoading;

  // Build analytics
  const analytics = useMemo(() => {
    if (!leads.length) return null;

    // Map user_id → email
    const userEmailMap = new Map<string, string>();
    profiles.forEach(p => { if (p.email) userEmailMap.set(p.id, p.email.toLowerCase()); });

    // Map email → subscription
    const emailSubMap = new Map<string, Subscription>();
    subscriptions.forEach(sub => {
      const email = userEmailMap.get(sub.user_id);
      if (email) emailSubMap.set(email, sub);
    });

    // DEDUPLICATION: Group leads by unique email
    const emailLeadMap = new Map<string, QuizLead>();
    leads.forEach(lead => {
      if (!lead.email) return;
      const emailKey = lead.email.toLowerCase();
      if (!emailLeadMap.has(emailKey)) {
        emailLeadMap.set(emailKey, lead);
      }
    });
    const uniqueLeads = Array.from(emailLeadMap.values());

    const totalLeads = uniqueLeads.length;
    const convertedLeads = uniqueLeads.filter(l => l.converted_to_user);
    const registeredCount = convertedLeads.length;

    // Leads that became paying subscribers (deduplicated by email)
    const payingLeads: Array<QuizLead & { subscription: Subscription; mrr: number }> = [];
    let totalMRR = 0;

    uniqueLeads.forEach(lead => {
      if (!lead.email) return;
      const sub = emailSubMap.get(lead.email.toLowerCase());
      if (sub && sub.is_active && sub.plan_type !== 'free') {
        const monthlyValue = PLAN_VALUES[sub.plan_type] || 9.99;
        payingLeads.push({ ...lead, subscription: sub, mrr: monthlyValue });
        totalMRR += monthlyValue;
      }
    });

    // By source (deduplicated) — normalized to app keys
    const sourceMap = new Map<string, { leads: number; converted: number; paying: number; mrr: number; convertDays: number[] }>();
    uniqueLeads.forEach(lead => {
      const src = getSourceKey(lead.source || 'evofinz');
      if (!sourceMap.has(src)) sourceMap.set(src, { leads: 0, converted: 0, paying: 0, mrr: 0, convertDays: [] });
      const entry = sourceMap.get(src)!;
      entry.leads++;
      if (lead.converted_to_user) {
        entry.converted++;
        // Calculate time-to-convert
        if (lead.converted_at) {
          const days = Math.max(0, Math.round((new Date(lead.converted_at).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)));
          entry.convertDays.push(days);
        }
      }
    });
    payingLeads.forEach(pl => {
      const src = getSourceKey(pl.source || 'evofinz');
      const entry = sourceMap.get(src);
      if (entry) {
        entry.paying++;
        entry.mrr += pl.mrr;
      }
    });

    const bySource = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        label: SOURCE_LABELS[source] || source,
        color: SOURCE_COLORS[source] || '#6b7280',
        ...data,
        conversionRate: data.leads > 0 ? (data.converted / data.leads * 100) : 0,
        payingRate: data.leads > 0 ? (data.paying / data.leads * 100) : 0,
        avgConvertDays: data.convertDays.length > 0
          ? Math.round(data.convertDays.reduce((a, b) => a + b, 0) / data.convertDays.length)
          : null,
        cpa: data.paying > 0 && data.mrr > 0
          ? (data.mrr / data.paying).toFixed(2)
          : null,
      }))
      .sort((a, b) => b.mrr - a.mrr);

    // Funnel: Lead → Registered → Paying
    const conversionQuizToReg = totalLeads > 0 ? (registeredCount / totalLeads * 100) : 0;
    const conversionRegToPay = registeredCount > 0 ? (payingLeads.length / registeredCount * 100) : 0;
    const conversionOverall = totalLeads > 0 ? (payingLeads.length / totalLeads * 100) : 0;

    // Global avg time-to-convert
    const allConvertDays = bySource.flatMap(s => s.convertDays);
    const avgTimeToConvert = allConvertDays.length > 0
      ? Math.round(allConvertDays.reduce((a, b) => a + b, 0) / allConvertDays.length)
      : null;

    return {
      totalLeads,
      registeredCount,
      payingCount: payingLeads.length,
      totalMRR,
      totalARR: totalMRR * 12,
      conversionQuizToReg,
      conversionRegToPay,
      conversionOverall,
      avgTimeToConvert,
      bySource,
      payingLeads: payingLeads.slice(0, 20),
    };
  }, [leads, profiles, subscriptions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{isEs ? 'Calculando ROI...' : 'Calculating ROI...'}</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        {isEs ? 'No hay datos de leads disponibles' : 'No lead data available'}
      </div>
    );
  }

  const funnelData = [
    { name: isEs ? 'Leads Quiz' : 'Quiz Leads', value: analytics.totalLeads, color: 'hsl(217, 91%, 60%)' },
    { name: isEs ? 'Registrados' : 'Registered', value: analytics.registeredCount, color: 'hsl(45, 93%, 47%)' },
    { name: isEs ? 'Pagando' : 'Paying', value: analytics.payingCount, color: 'hsl(142, 76%, 36%)' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <p className="text-xs text-white/80">MRR {isEs ? 'de Leads' : 'from Leads'}</p>
                <p className="text-2xl font-black mt-1">${analytics.totalMRR.toFixed(2)}</p>
                <p className="text-[10px] text-white/70 mt-0.5">ARR: ${analytics.totalARR.toFixed(0)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <p className="text-xs text-white/80">{isEs ? 'Conversión Total' : 'Overall Conversion'}</p>
                <p className="text-2xl font-black mt-1">{analytics.conversionOverall.toFixed(1)}%</p>
                <p className="text-[10px] text-white/70 mt-0.5">Quiz → 💳</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <p className="text-xs text-white/80">{isEs ? 'Leads Pagando' : 'Paying Leads'}</p>
                <p className="text-2xl font-black mt-1">{analytics.payingCount}</p>
                <p className="text-[10px] text-white/70 mt-0.5">{isEs ? 'de' : 'of'} {analytics.totalLeads} leads</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <p className="text-xs text-white/80">{isEs ? 'Valor por Lead' : 'Value per Lead'}</p>
                <p className="text-2xl font-black mt-1">
                  ${analytics.totalLeads > 0 ? (analytics.totalMRR / analytics.totalLeads).toFixed(2) : '0'}
                </p>
                <p className="text-[10px] text-white/70 mt-0.5">MRR / lead</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                <p className="text-xs text-white/80">{isEs ? 'Tiempo a Conversión' : 'Time to Convert'}</p>
                <p className="text-2xl font-black mt-1">
                  {analytics.avgTimeToConvert !== null ? `${analytics.avgTimeToConvert}d` : '—'}
                </p>
                <p className="text-[10px] text-white/70 mt-0.5">{isEs ? 'Promedio días' : 'Avg days'}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isEs ? 'Embudo de Conversión' : 'Conversion Funnel'}
          </CardTitle>
          <CardDescription className="text-xs">
            Quiz → {isEs ? 'Registro' : 'Register'} → {isEs ? 'Suscripción' : 'Subscription'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 md:gap-4 py-4">
            {funnelData.map((step, i) => (
              <div key={step.name} className="flex items-center gap-2 md:gap-4">
                <div className="text-center">
                  <div
                    className="mx-auto rounded-xl flex items-center justify-center font-black text-white text-lg md:text-2xl"
                    style={{
                      backgroundColor: step.color,
                      width: `${Math.max(60, 120 - i * 25)}px`,
                      height: `${Math.max(60, 120 - i * 25)}px`,
                    }}
                  >
                    {step.value}
                  </div>
                  <p className="text-xs font-medium mt-2 text-muted-foreground">{step.name}</p>
                  {i === 1 && (
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {analytics.conversionQuizToReg.toFixed(1)}%
                    </Badge>
                  )}
                  {i === 2 && (
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {analytics.conversionRegToPay.toFixed(1)}%
                    </Badge>
                  )}
                </div>
                {i < funnelData.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Source */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              MRR {isEs ? 'por Fuente' : 'by Source'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.bySource.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.bySource}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'MRR']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="mrr" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isEs ? 'Sin datos de revenue por fuente' : 'No revenue data by source'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="h-4 w-4 text-blue-500" />
              {isEs ? 'Conversión por Fuente' : 'Conversion by Source'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.bySource.map((src) => (
                <div key={src.source} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: src.color }} />
                      <span className="font-bold">{src.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{src.leads} leads</span>
                      <span>{src.converted} reg</span>
                      <span className="font-semibold text-foreground">{src.paying} 💳</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, src.payingRate)}%`,
                        backgroundColor: src.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Quiz→Reg: {src.conversionRate.toFixed(1)}%</span>
                    <span>Quiz→💳: {src.payingRate.toFixed(1)}%</span>
                    <span>MRR: ${src.mrr.toFixed(2)}</span>
                    {src.avgConvertDays !== null && (
                      <span>⏱ {src.avgConvertDays}d avg</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Paying leads table */}
      {analytics.payingLeads.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              {isEs ? 'Leads Convertidos a Suscripción' : 'Leads Converted to Subscription'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isEs ? 'Top 20 leads que se convirtieron en suscriptores pagos' : 'Top 20 leads that became paying subscribers'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isEs ? 'Nombre' : 'Name'}</TableHead>
                    <TableHead>{isEs ? 'Fuente' : 'Source'}</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>{isEs ? 'Lead Score' : 'Lead Score'}</TableHead>
                    <TableHead>{isEs ? 'Fecha Lead' : 'Lead Date'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.payingLeads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {lead.source || 'evofinz'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="text-xs capitalize">
                          {lead.subscription.plan_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-600">
                        ${lead.mrr.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{lead.lead_score || '—'}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(lead.created_at), 'dd MMM yyyy', { locale: esLocale })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
