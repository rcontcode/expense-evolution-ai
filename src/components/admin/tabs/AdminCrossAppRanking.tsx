import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Funnel } from 'recharts';
import { calculateLeadScore, getLeadPriority } from '@/hooks/admin/useLeadScoring';
import { Trophy, TrendingUp, Target, ArrowRight, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  language: 'es' | 'en';
}

const APP_COLORS_MAP: Record<string, string> = {
  evofinz: '#10b981',
  fokuspark: '#8b5cf6',
  universmind: '#7c3aed',
  default: '#6b7280',
};

const APP_LABELS: Record<string, string> = {
  evofinz: 'EvoFinz 🔥',
  fokuspark: 'Fokuspark 🧠',
  universmind: 'UniversMind 🌌',
};

const getAppColor = (source: string) => {
  const key = source.toLowerCase();
  return APP_COLORS_MAP[key] || `hsl(${Math.abs(hashCode(key)) % 360}, 70%, 50%)`;
};

const hashCode = (s: string) => s.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);

export const AdminCrossAppRanking = ({ language }: Props) => {
  const isEs = language === 'es';

  const { data: allLeads = [] } = useQuery({
    queryKey: ['cross-app-all-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const appStats = useMemo(() => {
    const byApp: Record<string, {
      source: string;
      total: number;
      contacted: number;
      converted: number;
      hot: number;
      warm: number;
      cool: number;
      cold: number;
      avgScore: number;
      totalScore: number;
      withComments: number;
      recentLeads: number; // last 7 days
    }> = {};

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    allLeads.forEach((lead: any) => {
      const src = lead.source || 'evofinz';
      if (!byApp[src]) {
        byApp[src] = { source: src, total: 0, contacted: 0, converted: 0, hot: 0, warm: 0, cool: 0, cold: 0, avgScore: 0, totalScore: 0, withComments: 0, recentLeads: 0 };
      }
      const app = byApp[src];
      app.total++;
      if (lead.contacted_at && !lead.contact_notes?.startsWith('[AUTO]')) app.contacted++;
      if (lead.converted_to_user) app.converted++;
      if (lead.comments) app.withComments++;
      if (new Date(lead.created_at) > sevenDaysAgo) app.recentLeads++;

      const score = calculateLeadScore(lead);
      app.totalScore += score;
      const priority = getLeadPriority(score);
      app[priority]++;
    });

    return Object.values(byApp)
      .map((app) => ({
        ...app,
        avgScore: app.total > 0 ? Math.round(app.totalScore / app.total) : 0,
        conversionRate: app.total > 0 ? Math.round((app.converted / app.total) * 100) : 0,
        contactRate: app.total > 0 ? Math.round((app.contacted / app.total) * 100) : 0,
        hotPercent: app.total > 0 ? Math.round((app.hot / app.total) * 100) : 0,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [allLeads]);

  // Funnel data
  const funnelData = useMemo(() => {
    const total = allLeads.length;
    const contacted = allLeads.filter((l: any) => l.contacted_at && !l.contact_notes?.startsWith('[AUTO]')).length;
    const converted = allLeads.filter((l: any) => l.converted_to_user).length;
    return [
      { name: isEs ? 'Total Leads' : 'Total Leads', value: total, fill: '#6366f1' },
      { name: isEs ? 'Contactados' : 'Contacted', value: contacted, fill: '#f59e0b' },
      { name: isEs ? 'Convertidos' : 'Converted', value: converted, fill: '#10b981' },
    ];
  }, [allLeads, isEs]);

  // Chart data for comparison
  const chartData = useMemo(() => {
    return appStats.map((app) => ({
      name: app.source,
      leads: app.total,
      score: app.avgScore,
      conversion: app.conversionRate,
      hot: app.hot,
    }));
  }, [appStats]);

  if (allLeads.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Conversion Funnel */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-500" />
            {isEs ? '🎯 Funnel de conversión global' : '🎯 Global conversion funnel'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center gap-0">
            {funnelData.map((step, i) => {
              const widthPercent = funnelData[0].value > 0
                ? Math.max(20, (step.value / funnelData[0].value) * 100)
                : 33;
              const rate = i > 0 && funnelData[i - 1].value > 0
                ? Math.round((step.value / funnelData[i - 1].value) * 100)
                : 100;

              return (
                <div key={step.name} className="flex items-center gap-0">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.15 }}
                    className="text-center"
                    style={{ minWidth: 120 }}
                  >
                    <div
                      className="mx-auto rounded-xl flex flex-col items-center justify-center transition-all"
                      style={{
                        width: `${widthPercent}%`,
                        minWidth: 100,
                        maxWidth: 200,
                        backgroundColor: step.fill,
                        padding: '16px 12px',
                      }}
                    >
                      <span className="text-2xl font-black text-white">{step.value}</span>
                    </div>
                    <p className="text-xs font-bold mt-2">{step.name}</p>
                    {i > 0 && (
                      <p className="text-[10px] text-muted-foreground">{rate}% {isEs ? 'del anterior' : 'of previous'}</p>
                    )}
                  </motion.div>
                  {i < funnelData.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground/40 flex-shrink-0 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cross-app comparison chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              {isEs ? '📊 Comparación entre Apps' : '📊 Cross-App Comparison'}
            </CardTitle>
            <CardDescription>
              {isEs ? 'Leads y score promedio por aplicación' : 'Leads and average score by application'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
                  />
                  <Bar dataKey="leads" name={isEs ? 'Total leads' : 'Total leads'} radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={getAppColor(entry.name)} />
                    ))}
                  </Bar>
                  <Bar dataKey="hot" name="HOT" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* App Ranking Cards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            {isEs ? '🏆 Ranking por App' : '🏆 App Ranking'}
          </CardTitle>
          <CardDescription>
            {isEs ? 'Ordenado por score promedio de leads' : 'Sorted by average lead score'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {appStats.map((app, i) => (
            <motion.div
              key={app.source}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-xl border bg-card hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
                    style={{ backgroundColor: getAppColor(app.source) }}
                  >
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{APP_LABELS[app.source.toLowerCase()] || app.source}</p>
                    <p className="text-xs text-muted-foreground">
                      {app.total} leads • {app.recentLeads} {isEs ? 'esta semana' : 'this week'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                    Ø {app.avgScore}pts
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mt-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">{app.hot}</p>
                  <p className="text-[10px] text-muted-foreground">🔥 HOT</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-600">{app.warm}</p>
                  <p className="text-[10px] text-muted-foreground">🌡️ WARM</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{app.contactRate}%</p>
                  <p className="text-[10px] text-muted-foreground">📞 {isEs ? 'Contact.' : 'Contact.'}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600">{app.conversionRate}%</p>
                  <p className="text-[10px] text-muted-foreground">✅ Conv.</p>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-1.5 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-16">{isEs ? 'Contacto' : 'Contact'}</span>
                  <Progress value={app.contactRate} className="h-1.5 flex-1" />
                  <span className="text-[10px] font-medium w-8 text-right">{app.contactRate}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-16">{isEs ? 'Conversión' : 'Conversion'}</span>
                  <Progress value={app.conversionRate} className="h-1.5 flex-1" />
                  <span className="text-[10px] font-medium w-8 text-right">{app.conversionRate}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
