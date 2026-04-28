import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useEcosystemData } from '@/contexts/EcosystemContext';
import { openFokusparkTool } from '@/lib/ecosystem/deeplinks';
import { EcosystemErrorFallback } from './EcosystemErrorFallback';
import { useMemo } from 'react';

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

export const EcosystemCoaching = memo(() => {
  const { language } = useLanguage();
  const { isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { data: dashData, isLoading, isError, refetch } = useEcosystemData();
  const isEs = language === 'es';
  const [expanded, setExpanded] = useState(true);

  const insights = useMemo((): CoachingInsight[] => {
    if (!dashData) return [];

    const { totalExpenses, totalIncome, savingsRate, focusMinutes, focusMinutesOlder, worryCount, journalCount, habitsThisWeek, spendingChange, topCategories } = dashData;
    const topCat = topCategories[0];
    const result: CoachingInsight[] = [];

    if (savingsRate < 10 && totalIncome > 0) {
      result.push({ id: 'low-savings', emoji: '💰', titleEs: 'Tu tasa de ahorro necesita atención', titleEn: 'Your savings rate needs attention', adviceEs: `Estás ahorrando solo ${savingsRate.toFixed(0)}% de tus ingresos. Intenta reducir gastos en "${topCat?.category || 'general'}" que es tu categoría más alta.`, adviceEn: `You're saving only ${savingsRate.toFixed(0)}% of income. Try reducing "${topCat?.category || 'general'}" — your top spending category.`, priority: 1 });
    } else if (savingsRate > 30) {
      result.push({ id: 'great-savings', emoji: '🌟', titleEs: '¡Excelente disciplina de ahorro!', titleEn: 'Excellent savings discipline!', adviceEs: `Estás ahorrando ${savingsRate.toFixed(0)}% — muy por encima del promedio.`, adviceEn: `You're saving ${savingsRate.toFixed(0)}% — well above average.`, priority: 5 });
    }

    if (focusMinutes > focusMinutesOlder && spendingChange < -5) {
      result.push({ id: 'focus-helps', emoji: '🧠', titleEs: 'El enfoque impacta tus finanzas', titleEn: 'Focus impacts your finances', adviceEs: `Más enfoque y tus gastos bajaron ${Math.abs(spendingChange).toFixed(0)}%. La correlación es clara.`, adviceEn: `More focus and spending dropped ${Math.abs(spendingChange).toFixed(0)}%. The correlation is clear.`, priority: 2 });
    } else if (focusMinutes < 30 && spendingChange > 10) {
      result.push({ id: 'need-focus', emoji: '⏱️', titleEs: 'Más enfoque podría frenar tus gastos', titleEn: 'More focus could curb spending', adviceEs: `Solo ${focusMinutes} min de enfoque este mes y gastos +${spendingChange.toFixed(0)}%.`, adviceEn: `Only ${focusMinutes} min focus this month and spending up ${spendingChange.toFixed(0)}%.`, priority: 1, action: { tool: 'focus-timer', labelEs: 'Iniciar sesión', labelEn: 'Start session' } });
    }

    if (worryCount >= 5 && spendingChange > 5) {
      result.push({ id: 'worry-spending', emoji: '🌧️', titleEs: 'Estrés y gastos vinculados', titleEn: 'Stress and spending linked', adviceEs: `${worryCount} preocupaciones con gastos al alza.`, adviceEn: `${worryCount} worries with spending rising.`, priority: 1, action: { tool: 'breathing', labelEs: 'Respirar', labelEn: 'Breathe' } });
    }

    if (journalCount === 0) {
      result.push({ id: 'start-journal', emoji: '📓', titleEs: 'Reflexiona para decidir mejor', titleEn: 'Reflect to decide better', adviceEs: 'No has escrito en tu diario financiero este mes.', adviceEn: "You haven't journaled this month.", priority: 3, action: { tool: 'journal', labelEs: 'Escribir', labelEn: 'Write' } });
    }

    if (habitsThisWeek >= 3 && focusMinutes >= 60 && savingsRate >= 15) {
      result.push({ id: 'consistency', emoji: '🏆', titleEs: 'Consistencia ejemplar', titleEn: 'Exemplary consistency', adviceEs: 'Hábitos, enfoque y ahorro están alineados.', adviceEn: 'Habits, focus, and savings are aligned.', priority: 4 });
    }

    return result.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }, [dashData]);

  if (flagsLoading || !isEnabled('ecosystem_insights')) return null;
  if (isError) return <EcosystemErrorFallback onRetry={refetch} />;
  if (isLoading || !dashData || insights.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
            {isEs ? 'Coaching Financiero' : 'Financial Coaching'}
            <span className="text-[10px] font-normal text-muted-foreground bg-indigo-500/10 px-1.5 py-0.5 rounded-full ml-1">Smart</span>
            {expanded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
          </CardTitle>
        </CardHeader>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <CardContent className="px-4 pb-3 space-y-2">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-2.5 rounded-lg bg-background/60 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-base shrink-0">{insight.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-foreground">{isEs ? insight.titleEs : insight.titleEn}</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{isEs ? insight.adviceEs : insight.adviceEn}</p>
                      </div>
                    </div>
                    {insight.action && (
                      <Button variant="ghost" size="sm" className="w-full text-[10px] h-6 gap-1 mt-1 bg-indigo-500/5 hover:bg-indigo-500/10" onClick={() => openFokusparkTool(insight.action!.tool as any, 'coaching')}>
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
