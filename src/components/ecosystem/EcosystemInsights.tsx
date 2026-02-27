import { memo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Clock, AlertTriangle, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useEcosystemData } from '@/contexts/EcosystemContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { EcosystemErrorFallback } from './EcosystemErrorFallback';
import { format } from 'date-fns';

export const EcosystemInsights = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { data: dashData, isLoading, isError, refetch } = useEcosystemData();
  const isEs = language === 'es';

  if (flagsLoading || !isEnabled('ecosystem_insights')) return null;

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

  const insights = dashData?.insights;

  // Build chart data with localized labels
  const chartData = insights?.chartData?.map(d => ({
    month: format(new Date(d.month + '-01'), 'MMM'),
    [isEs ? 'Enfoque (min)' : 'Focus (min)']: d.focus,
    [isEs ? 'Gastos ($)' : 'Expenses ($)']: d.expenses,
  })) || [];

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
          {isError ? (
            <EcosystemErrorFallback onRetry={refetch} compact />
          ) : isLoading || !insights ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{insights.totalFocus} min</p>
                    <p className="text-[10px] text-muted-foreground">{isEs ? 'Enfoque total' : 'Total focus'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/5">
                  <AlertTriangle className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{insights.totalWorries}</p>
                    <p className="text-[10px] text-muted-foreground">{isEs ? 'Preocupaciones' : 'Worry entries'}</p>
                  </div>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={2}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Bar dataKey={isEs ? 'Enfoque (min)' : 'Focus (min)'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey={isEs ? 'Gastos ($)' : 'Expenses ($)'} fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} maxBarSize={24} opacity={0.4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground text-center">
                {isEs ? 'Correlación entre enfoque y gastos (últimos 6 meses)' : 'Focus vs expenses correlation (last 6 months)'}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

EcosystemInsights.displayName = 'EcosystemInsights';
