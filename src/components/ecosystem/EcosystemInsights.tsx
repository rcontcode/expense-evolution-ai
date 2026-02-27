import { memo } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Clock, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { EcosystemErrorFallback } from './EcosystemErrorFallback';
import { startOfMonth, subMonths, format } from 'date-fns';

/**
 * Cross-app correlation dashboard for Bundle users.
 * Shows focus sessions vs expense data over recent months.
 */
export const EcosystemInsights = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const isEs = language === 'es';

  const { data, isLoading } = useQuery({
    queryKey: ['ecosystem-insights', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString();

      const [focusRes, worryRes, expenseRes] = await Promise.all([
        supabase
          .from('financial_focus_sessions')
          .select('created_at, duration_minutes')
          .eq('user_id', user.id)
          .gte('created_at', sixMonthsAgo),
        supabase
          .from('financial_worry_entries')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', sixMonthsAgo),
        supabase
          .from('expenses')
          .select('date, amount')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .gte('date', sixMonthsAgo.slice(0, 10)),
      ]);

      // Aggregate by month
      const months: Record<string, { focus: number; worries: number; expenses: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const key = format(subMonths(new Date(), i), 'yyyy-MM');
        months[key] = { focus: 0, worries: 0, expenses: 0 };
      }

      (focusRes.data || []).forEach(s => {
        const key = (s.created_at || '').slice(0, 7);
        if (months[key]) months[key].focus += s.duration_minutes || 0;
      });
      (worryRes.data || []).forEach(w => {
        const key = (w.created_at || '').slice(0, 7);
        if (months[key]) months[key].worries += 1;
      });
      (expenseRes.data || []).forEach(e => {
        const key = (e.date || '').slice(0, 7);
        if (months[key]) months[key].expenses += e.amount || 0;
      });

      const totalFocus = Object.values(months).reduce((a, b) => a + b.focus, 0);
      const totalWorries = Object.values(months).reduce((a, b) => a + b.worries, 0);

      const chartData = Object.entries(months).map(([key, v]) => ({
        month: format(new Date(key + '-01'), 'MMM'),
        [isEs ? 'Enfoque (min)' : 'Focus (min)']: v.focus,
        [isEs ? 'Gastos ($)' : 'Expenses ($)']: Math.round(v.expenses),
      }));

      return { totalFocus, totalWorries, chartData };
    },
    enabled: !!user?.id && hasBundleAccess,
    staleTime: 1000 * 60 * 5,
  });

  if (flagsLoading || !isEnabled('ecosystem_insights')) return null;

  // Non-bundle: upgrade prompt
  if (!hasBundleAccess) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-4 flex items-center gap-3 text-muted-foreground">
          <Lock className="h-5 w-5 shrink-0" />
          <p className="text-xs">
            {isEs
              ? 'Activa el Evo Bundle para ver insights cruzados entre enfoque y finanzas.'
              : 'Activate the Evo Bundle to see cross-app insights between focus and finances.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/15 overflow-hidden">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {isEs ? 'Ecosistema Insights' : 'Ecosystem Insights'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : data ? (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{data.totalFocus} min</p>
                    <p className="text-[10px] text-muted-foreground">
                      {isEs ? 'Enfoque total' : 'Total focus'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/5">
                  <AlertTriangle className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{data.totalWorries}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {isEs ? 'Preocupaciones' : 'Worry entries'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              {data.chartData.length > 0 && (
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData} barGap={2}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      />
                      <Bar
                        dataKey={isEs ? 'Enfoque (min)' : 'Focus (min)'}
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />
                      <Bar
                        dataKey={isEs ? 'Gastos ($)' : 'Expenses ($)'}
                        fill="hsl(var(--muted-foreground))"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                        opacity={0.4}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground text-center">
                {isEs
                  ? 'Correlación entre enfoque y gastos (últimos 6 meses)'
                  : 'Focus vs expenses correlation (last 6 months)'}
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
});

EcosystemInsights.displayName = 'EcosystemInsights';
