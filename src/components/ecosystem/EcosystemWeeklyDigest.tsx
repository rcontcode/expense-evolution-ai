import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Brain, CloudRain, TrendingDown, TrendingUp, X, Minus, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useEcosystemData } from '@/contexts/EcosystemContext';
import { startOfWeek, format } from 'date-fns';
import { openFokusparkTool, type FokusparkTool } from '@/lib/ecosystem/deeplinks';
import { EcosystemErrorFallback } from './EcosystemErrorFallback';

const DISMISS_KEY = 'ecosystem-weekly-digest-dismissed';

function getCurrentWeekKey(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export const EcosystemWeeklyDigest = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { data: dashData, isLoading, isError, refetch } = useEcosystemData();
  const isEs = language === 'es';
  const currentWeek = getCurrentWeekKey();

  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === currentWeek);

  if (flagsLoading || !hasBundleAccess || !isEnabled('ecosystem_insights') || dismissed) return null;
  if (isError) return <EcosystemErrorFallback onRetry={refetch} compact />;
  if (isLoading || !dashData) return null;

  const data = dashData.weeklyDigest;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, currentWeek);
    setDismissed(true);
  };

  const SpendingIcon = data.spendingDelta > 5 ? TrendingUp : data.spendingDelta < -5 ? TrendingDown : Minus;
  const spendingColor = data.spendingDelta > 5 ? 'text-rose-500' : data.spendingDelta < -5 ? 'text-emerald-500' : 'text-muted-foreground';

  const getInsight = (): { text: string; cta?: { label: string; tool: FokusparkTool } } => {
    if (data.worryCount >= 3 && data.spendingDelta > 10) {
      return { text: isEs ? '⚠️ Tus preocupaciones y gastos aumentaron esta semana.' : '⚠️ Your worries and spending both increased this week.', cta: { label: isEs ? 'Sesión de enfoque' : 'Focus session', tool: 'breathing' } };
    }
    if (data.focusMinutes > data.focusMinutesLast && data.spendingDelta < 0) {
      return { text: isEs ? '🎯 Más enfoque, menos gastos — ¡excelente semana!' : '🎯 More focus, less spending — great week!' };
    }
    if (data.focusMinutes === 0) {
      return { text: isEs ? '💡 No has tenido sesiones de enfoque esta semana.' : "💡 No focus sessions this week yet.", cta: { label: isEs ? 'Iniciar en Fokuspark' : 'Start on Fokuspark', tool: 'focus-timer' } };
    }
    return { text: isEs ? '📊 Tu semana va bien. Mantén el enfoque.' : '📊 Your week is going well. Stay focused.' };
  };

  const insight = getInsight();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/15 overflow-hidden">
        <CardHeader className="pb-1 pt-3 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {isEs ? 'Resumen Semanal' : 'Weekly Digest'}
          </CardTitle>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-primary/5">
              <Brain className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="text-xs font-bold text-foreground">{data.focusMinutes}m</p>
                <p className="text-[9px] text-muted-foreground">{isEs ? 'Enfoque' : 'Focus'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-accent/5">
              <CloudRain className="h-3.5 w-3.5 text-accent" />
              <div>
                <p className="text-xs font-bold text-foreground">{data.worryCount}</p>
                <p className="text-[9px] text-muted-foreground">Worries</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/50">
              <SpendingIcon className={`h-3.5 w-3.5 ${spendingColor}`} />
              <div>
                <p className={`text-xs font-bold ${spendingColor}`}>
                  {data.spendingDelta > 0 ? '+' : ''}{data.spendingDelta.toFixed(0)}%
                </p>
                <p className="text-[9px] text-muted-foreground">{isEs ? 'Gastos' : 'Spending'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">{insight.text}</p>
            {insight.cta && (
              <Button variant="ghost" size="sm" className="shrink-0 text-[10px] h-6 px-2 gap-1" onClick={() => openFokusparkTool(insight.cta!.tool, 'weekly-digest')}>
                <ExternalLink className="h-3 w-3" />
                {insight.cta.label}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

EcosystemWeeklyDigest.displayName = 'EcosystemWeeklyDigest';
