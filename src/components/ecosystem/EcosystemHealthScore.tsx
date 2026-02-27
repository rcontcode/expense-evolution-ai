import { memo } from 'react';
import { motion } from 'framer-motion';
import { Activity, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths } from 'date-fns';
import { openFokusparkTool } from '@/lib/ecosystem/deeplinks';
import { EcosystemErrorFallback } from './EcosystemErrorFallback';

/**
 * Composite ecosystem health score (0-100) based on:
 * - Savings rate (0-30 pts)
 * - Focus consistency (0-25 pts)
 * - Worry trend declining (0-20 pts)
 * - Expense stability (0-25 pts)
 */
export const EcosystemHealthScore = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const isEs = language === 'es';

  const { data: score, isLoading, isError, refetch } = useQuery({
    queryKey: ['ecosystem-health-score', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const oneMonthAgo = subMonths(new Date(), 1).toISOString();
      const twoMonthsAgo = subMonths(new Date(), 2).toISOString();

      const [incomeRes, expenseRes, focusRes, focusOldRes, worryRes, worryOldRes] = await Promise.all([
        supabase.from('income').select('amount').eq('user_id', user.id)
          .is('deleted_at', null).gte('date', oneMonthAgo.slice(0, 10)),
        supabase.from('expenses').select('amount').eq('user_id', user.id)
          .is('deleted_at', null).gte('date', oneMonthAgo.slice(0, 10)),
        supabase.from('financial_focus_sessions').select('duration_minutes, created_at')
          .eq('user_id', user.id).gte('created_at', oneMonthAgo),
        supabase.from('financial_focus_sessions').select('duration_minutes')
          .eq('user_id', user.id).gte('created_at', twoMonthsAgo).lt('created_at', oneMonthAgo),
        supabase.from('financial_worry_entries').select('id')
          .eq('user_id', user.id).gte('created_at', oneMonthAgo),
        supabase.from('financial_worry_entries').select('id')
          .eq('user_id', user.id).gte('created_at', twoMonthsAgo).lt('created_at', oneMonthAgo),
      ]);

      const totalIncome = (incomeRes.data || []).reduce((a, i) => a + (i.amount || 0), 0);
      const totalExpenses = (expenseRes.data || []).reduce((a, e) => a + (e.amount || 0), 0);

      // Savings rate score (0-30)
      const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
      const savingsScore = Math.min(30, Math.max(0, savingsRate * 100));

      // Focus consistency (0-25) — based on sessions per week avg
      const focusSessions = (focusRes.data || []);
      const focusMinutes = focusSessions.reduce((a, s) => a + (s.duration_minutes || 0), 0);
      const focusScore = Math.min(25, (focusMinutes / 120) * 25); // 120 min/month = max

      // Worry trend (0-20) — fewer worries than last month = good
      const worriesNow = (worryRes.data || []).length;
      const worriesOld = (worryOldRes.data || []).length;
      let worryScore = 10; // neutral
      if (worriesOld > 0 && worriesNow < worriesOld) worryScore = 20;
      else if (worriesNow === 0 && worriesOld === 0) worryScore = 15;
      else if (worriesNow > worriesOld) worryScore = Math.max(0, 10 - (worriesNow - worriesOld) * 2);

      // Expense stability (0-25) — low variance = good
      const focusOldMinutes = (focusOldRes.data || []).reduce((a, s) => a + (s.duration_minutes || 0), 0);
      const expenseChange = totalExpenses > 0 && totalIncome > 0
        ? Math.abs(totalExpenses - totalIncome) / totalIncome
        : 0.5;
      const stabilityScore = Math.min(25, Math.max(0, (1 - expenseChange) * 25));

      const total = Math.round(savingsScore + focusScore + worryScore + stabilityScore);
      return Math.min(100, Math.max(0, total));
    },
    enabled: !!user?.id && hasBundleAccess,
    staleTime: 1000 * 60 * 10,
  });

  if (flagsLoading || !hasBundleAccess || !isEnabled('ecosystem_insights')) return null;
  if (isLoading || score === null || score === undefined) return null;

  const getColor = (s: number) => {
    if (s >= 75) return 'text-emerald-500';
    if (s >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getStrokeColor = (s: number) => {
    if (s >= 75) return '#10b981';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getLabel = (s: number) => {
    if (s >= 75) return isEs ? 'Excelente' : 'Excellent';
    if (s >= 50) return isEs ? 'Bueno' : 'Good';
    if (s >= 25) return isEs ? 'Regular' : 'Fair';
    return isEs ? 'Necesita atención' : 'Needs attention';
  };

  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - score / 100);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/15">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            {isEs ? 'Salud del Ecosistema' : 'Ecosystem Health'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 flex items-center gap-4">
          {/* Radial gauge */}
          <div className="relative h-20 w-20 shrink-0">
            <svg className="-rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-muted" />
              <circle
                cx="50" cy="50" r="40" fill="none" strokeWidth="8"
                stroke={getStrokeColor(score)}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${getColor(score)}`}>{score}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold ${getColor(score)}`}>{getLabel(score)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isEs
                ? 'Basado en ahorro, enfoque, estrés y estabilidad'
                : 'Based on savings, focus, stress & stability'}
            </p>
            {score < 50 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-[10px] h-6 px-2 gap-1"
                onClick={() => openFokusparkTool('breathing', 'health-score')}
              >
                <ExternalLink className="h-3 w-3" />
                {isEs ? 'Mejorar con Fokuspark' : 'Improve with Fokuspark'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

EcosystemHealthScore.displayName = 'EcosystemHealthScore';
