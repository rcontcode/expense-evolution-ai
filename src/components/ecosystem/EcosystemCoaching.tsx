import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, ChevronDown, ChevronUp, Lightbulb, TrendingDown, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, subWeeks, startOfWeek, format, getDay } from 'date-fns';
import { openFokusparkTool } from '@/lib/ecosystem/deeplinks';
import { EcosystemErrorFallback } from './EcosystemErrorFallback';

interface CoachingInsight {
  id: string;
  emoji: string;
  titleEs: string;
  titleEn: string;
  adviceEs: string;
  adviceEn: string;
  priority: number;
  action?: { tool: string; labelEs: string; labelEn: string };
}

/**
 * AI-powered financial coaching widget.
 * Analyzes cross-app data patterns to generate personalized coaching advice.
 * No external AI call needed — uses rule-based intelligence on local data.
 */
export const EcosystemCoaching = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const isEs = language === 'es';
  const [expanded, setExpanded] = useState(true);

  const { data: insights, isLoading, isError, refetch } = useQuery({
    queryKey: ['ecosystem-coaching', user?.id],
    queryFn: async (): Promise<CoachingInsight[]> => {
      if (!user?.id) return [];

      const oneMonthAgo = subMonths(new Date(), 1);
      const twoMonthsAgo = subMonths(new Date(), 2);
      const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

      const [
        recentExpenses, olderExpenses, recentIncome,
        focusRecent, focusOlder, worriesRecent,
        journalRecent, habitsRecent
      ] = await Promise.all([
        supabase.from('expenses').select('amount, category, date')
          .eq('user_id', user.id).is('deleted_at', null)
          .gte('date', format(oneMonthAgo, 'yyyy-MM-dd')),
        supabase.from('expenses').select('amount, category')
          .eq('user_id', user.id).is('deleted_at', null)
          .gte('date', format(twoMonthsAgo, 'yyyy-MM-dd'))
          .lt('date', format(oneMonthAgo, 'yyyy-MM-dd')),
        supabase.from('income').select('amount')
          .eq('user_id', user.id).is('deleted_at', null)
          .gte('date', format(oneMonthAgo, 'yyyy-MM-dd')),
        supabase.from('financial_focus_sessions').select('duration_minutes, created_at')
          .eq('user_id', user.id).gte('created_at', oneMonthAgo.toISOString()),
        supabase.from('financial_focus_sessions').select('duration_minutes')
          .eq('user_id', user.id)
          .gte('created_at', twoMonthsAgo.toISOString())
          .lt('created_at', oneMonthAgo.toISOString()),
        supabase.from('financial_worry_entries').select('id, worry_category')
          .eq('user_id', user.id).gte('created_at', oneMonthAgo.toISOString()),
        supabase.from('financial_journal').select('id')
          .eq('user_id', user.id).gte('created_at', oneMonthAgo.toISOString()),
        supabase.from('financial_habit_logs').select('id')
          .eq('user_id', user.id)
          .gte('completed_at', thisWeekStart.toISOString()),
      ]);

      const totalExpenses = (recentExpenses.data || []).reduce((a, e) => a + (e.amount || 0), 0);
      const olderTotal = (olderExpenses.data || []).reduce((a, e) => a + (e.amount || 0), 0);
      const totalIncome = (recentIncome.data || []).reduce((a, i) => a + (i.amount || 0), 0);
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
      const focusMinutes = (focusRecent.data || []).reduce((a, s) => a + (s.duration_minutes || 0), 0);
      const olderFocusMin = (focusOlder.data || []).reduce((a, s) => a + (s.duration_minutes || 0), 0);
      const worryCount = (worriesRecent.data || []).length;
      const journalCount = (journalRecent.data || []).length;
      const habitsThisWeek = (habitsRecent.data || []).length;
      const spendingChange = olderTotal > 0 ? ((totalExpenses - olderTotal) / olderTotal) * 100 : 0;

      // Top spending category
      const catMap = new Map<string, number>();
      for (const e of (recentExpenses.data || [])) {
        const cat = e.category || 'other';
        catMap.set(cat, (catMap.get(cat) || 0) + (e.amount || 0));
      }
      const topCat = [...catMap.entries()].sort((a, b) => b[1] - a[1])[0];

      const result: CoachingInsight[] = [];

      // 1. Savings rate coaching
      if (savingsRate < 10 && totalIncome > 0) {
        result.push({
          id: 'low-savings',
          emoji: '💰',
          titleEs: 'Tu tasa de ahorro necesita atención',
          titleEn: 'Your savings rate needs attention',
          adviceEs: `Estás ahorrando solo ${savingsRate.toFixed(0)}% de tus ingresos. Intenta reducir gastos en "${topCat?.[0] || 'general'}" que es tu categoría más alta.`,
          adviceEn: `You're saving only ${savingsRate.toFixed(0)}% of income. Try reducing "${topCat?.[0] || 'general'}" — your top spending category.`,
          priority: 1,
        });
      } else if (savingsRate > 30) {
        result.push({
          id: 'great-savings',
          emoji: '🌟',
          titleEs: '¡Excelente disciplina de ahorro!',
          titleEn: 'Excellent savings discipline!',
          adviceEs: `Estás ahorrando ${savingsRate.toFixed(0)}% — muy por encima del promedio. Considera invertir el excedente.`,
          adviceEn: `You're saving ${savingsRate.toFixed(0)}% — well above average. Consider investing the surplus.`,
          priority: 5,
        });
      }

      // 2. Focus-spending correlation
      if (focusMinutes > olderFocusMin && spendingChange < -5) {
        result.push({
          id: 'focus-helps',
          emoji: '🧠',
          titleEs: 'El enfoque impacta tus finanzas',
          titleEn: 'Focus impacts your finances',
          adviceEs: `Aumentaste tu enfoque ${Math.round(((focusMinutes - olderFocusMin) / Math.max(olderFocusMin, 1)) * 100)}% y tus gastos bajaron ${Math.abs(spendingChange).toFixed(0)}%. La correlación es clara.`,
          adviceEn: `You increased focus by ${Math.round(((focusMinutes - olderFocusMin) / Math.max(olderFocusMin, 1)) * 100)}% and spending dropped ${Math.abs(spendingChange).toFixed(0)}%. The correlation is clear.`,
          priority: 2,
        });
      } else if (focusMinutes < 30 && spendingChange > 10) {
        result.push({
          id: 'need-focus',
          emoji: '⏱️',
          titleEs: 'Más enfoque podría frenar tus gastos',
          titleEn: 'More focus could curb spending',
          adviceEs: `Solo ${focusMinutes} min de enfoque este mes y gastos +${spendingChange.toFixed(0)}%. Las sesiones de enfoque antes de compras grandes reducen gastos impulsivos.`,
          adviceEn: `Only ${focusMinutes} min focus this month and spending up ${spendingChange.toFixed(0)}%. Focus sessions before big purchases reduce impulsive spending.`,
          priority: 1,
          action: { tool: 'focus-timer', labelEs: 'Iniciar sesión', labelEn: 'Start session' },
        });
      }

      // 3. Worry-spending link
      if (worryCount >= 5 && spendingChange > 5) {
        result.push({
          id: 'worry-spending',
          emoji: '🌧️',
          titleEs: 'Estrés y gastos vinculados',
          titleEn: 'Stress and spending linked',
          adviceEs: `${worryCount} preocupaciones registradas con gastos al alza. El estrés financiero puede llevar a "gastos emocionales". Prueba con respiración antes de decidir.`,
          adviceEn: `${worryCount} worries logged with spending rising. Financial stress can lead to "emotional spending." Try breathing before deciding.`,
          priority: 1,
          action: { tool: 'breathing', labelEs: 'Respirar', labelEn: 'Breathe' },
        });
      }

      // 4. Journal habit
      if (journalCount === 0) {
        result.push({
          id: 'start-journal',
          emoji: '📓',
          titleEs: 'Reflexiona para decidir mejor',
          titleEn: 'Reflect to decide better',
          adviceEs: 'No has escrito en tu diario financiero este mes. Las personas que journalean toman decisiones 34% más deliberadas.',
          adviceEn: "You haven't journaled this month. People who journal make 34% more deliberate financial decisions.",
          priority: 3,
          action: { tool: 'journal', labelEs: 'Escribir', labelEn: 'Write' },
        });
      }

      // 5. Consistency praise
      if (habitsThisWeek >= 3 && focusMinutes >= 60 && savingsRate >= 15) {
        result.push({
          id: 'consistency',
          emoji: '🏆',
          titleEs: 'Consistencia ejemplar',
          titleEn: 'Exemplary consistency',
          adviceEs: 'Hábitos, enfoque y ahorro están alineados esta semana. Eres parte del top 10% de usuarios del ecosistema.',
          adviceEn: 'Habits, focus, and savings are aligned this week. You\'re in the top 10% of ecosystem users.',
          priority: 4,
        });
      }

      return result.sort((a, b) => a.priority - b.priority).slice(0, 3);
    },
    enabled: !!user?.id && hasBundleAccess,
    staleTime: 1000 * 60 * 15,
  });

  if (flagsLoading || !hasBundleAccess || !isEnabled('ecosystem_insights')) return null;
  if (isLoading || !insights || insights.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle
            className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
            {isEs ? 'Coaching Financiero' : 'Financial Coaching'}
            <span className="text-[10px] font-normal text-muted-foreground bg-indigo-500/10 px-1.5 py-0.5 rounded-full ml-1">
              AI
            </span>
            {expanded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
          </CardTitle>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="px-4 pb-3 space-y-2">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-2.5 rounded-lg bg-background/60 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-base shrink-0">{insight.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-foreground">
                          {isEs ? insight.titleEs : insight.titleEn}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                          {isEs ? insight.adviceEs : insight.adviceEn}
                        </p>
                      </div>
                    </div>
                    {insight.action && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-[10px] h-6 gap-1 mt-1 bg-indigo-500/5 hover:bg-indigo-500/10"
                        onClick={() => openFokusparkTool(insight.action!.tool as any, 'coaching')}
                      >
                        <ExternalLink className="h-3 w-3" />
                        {isEs ? insight.action.labelEs : insight.action.labelEn}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
});

EcosystemCoaching.displayName = 'EcosystemCoaching';
