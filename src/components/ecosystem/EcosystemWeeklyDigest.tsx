import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Brain, CloudRain, TrendingDown, TrendingUp, X, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, subWeeks, format } from 'date-fns';

const DISMISS_KEY = 'ecosystem-weekly-digest-dismissed';

function getDismissedWeek(): string | null {
  return localStorage.getItem(DISMISS_KEY);
}

function getCurrentWeekKey(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export const EcosystemWeeklyDigest = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const isEs = language === 'es';
  const currentWeek = getCurrentWeekKey();

  const [dismissed, setDismissed] = useState(() => getDismissedWeek() === currentWeek);

  const { data, isLoading } = useQuery({
    queryKey: ['ecosystem-weekly-digest', user?.id, currentWeek],
    queryFn: async () => {
      if (!user?.id) return null;

      const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
      const lastWeekStart = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1).toISOString();
      const lastWeekEnd = thisWeekStart;

      const [focusThis, focusLast, worriesThis, expensesThis, expensesLast] = await Promise.all([
        supabase.from('financial_focus_sessions').select('duration_minutes')
          .eq('user_id', user.id).gte('created_at', thisWeekStart),
        supabase.from('financial_focus_sessions').select('duration_minutes')
          .eq('user_id', user.id).gte('created_at', lastWeekStart).lt('created_at', lastWeekEnd),
        supabase.from('financial_worry_entries').select('id')
          .eq('user_id', user.id).gte('created_at', thisWeekStart),
        supabase.from('expenses').select('amount')
          .eq('user_id', user.id).is('deleted_at', null).gte('date', thisWeekStart.slice(0, 10)),
        supabase.from('expenses').select('amount')
          .eq('user_id', user.id).is('deleted_at', null)
          .gte('date', lastWeekStart.slice(0, 10)).lt('date', lastWeekEnd.slice(0, 10)),
      ]);

      const focusMinutes = (focusThis.data || []).reduce((a, s) => a + (s.duration_minutes || 0), 0);
      const focusMinutesLast = (focusLast.data || []).reduce((a, s) => a + (s.duration_minutes || 0), 0);
      const worryCount = (worriesThis.data || []).length;
      const spendingThis = (expensesThis.data || []).reduce((a, e) => a + (e.amount || 0), 0);
      const spendingLast = (expensesLast.data || []).reduce((a, e) => a + (e.amount || 0), 0);
      const spendingDelta = spendingLast > 0 ? ((spendingThis - spendingLast) / spendingLast) * 100 : 0;

      return { focusMinutes, focusMinutesLast, worryCount, spendingThis, spendingDelta };
    },
    enabled: !!user?.id && hasBundleAccess && !dismissed,
    staleTime: 1000 * 60 * 10,
  });

  if (flagsLoading || !hasBundleAccess || !isEnabled('ecosystem_insights') || dismissed) return null;
  if (isLoading || !data) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, currentWeek);
    setDismissed(true);
  };

  const SpendingIcon = data.spendingDelta > 5 ? TrendingUp : data.spendingDelta < -5 ? TrendingDown : Minus;
  const spendingColor = data.spendingDelta > 5 ? 'text-rose-500' : data.spendingDelta < -5 ? 'text-emerald-500' : 'text-muted-foreground';

  // Generate smart insight
  const getInsight = () => {
    if (data.worryCount >= 3 && data.spendingDelta > 10) {
      return isEs
        ? '⚠️ Tus preocupaciones y gastos aumentaron esta semana. Prueba una sesión de enfoque antes de tu próxima compra.'
        : '⚠️ Your worries and spending both increased this week. Try a focus session before your next purchase.';
    }
    if (data.focusMinutes > data.focusMinutesLast && data.spendingDelta < 0) {
      return isEs
        ? '🎯 Más enfoque, menos gastos — ¡excelente semana!'
        : '🎯 More focus, less spending — great week!';
    }
    if (data.focusMinutes === 0) {
      return isEs
        ? '💡 No has tenido sesiones de enfoque esta semana. ¡Intenta una de 15 minutos!'
        : "💡 No focus sessions this week yet. Try a quick 15-minute one!";
    }
    return isEs
      ? '📊 Tu semana va bien. Mantén el enfoque para mejores decisiones financieras.'
      : '📊 Your week is going well. Stay focused for better financial decisions.';
  };

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
          {/* Stats row */}
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
                <p className="text-[9px] text-muted-foreground">{isEs ? 'Worries' : 'Worries'}</p>
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

          {/* Smart insight */}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {getInsight()}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
});

EcosystemWeeklyDigest.displayName = 'EcosystemWeeklyDigest';
