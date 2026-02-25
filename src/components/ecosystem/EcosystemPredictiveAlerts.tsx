import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ExternalLink, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/data/useFeatureFlags';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format, getDay } from 'date-fns';
import { openFokusparkTool } from '@/lib/ecosystem/deeplinks';

const DISMISS_KEY = 'ecosystem-predictive-dismissed';
const DAY_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface PredictiveAlert {
  type: 'high-spend-day' | 'streak-risk' | 'pattern';
  titleEs: string;
  titleEn: string;
  messageEs: string;
  messageEn: string;
  emoji: string;
}

export const EcosystemPredictiveAlerts = memo(() => {
  const { language } = useLanguage();
  const { hasBundleAccess, isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const isEs = language === 'es';

  const [dismissed, setDismissed] = useState(() => {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (!stored) return false;
    // Reset daily
    const today = format(new Date(), 'yyyy-MM-dd');
    return stored === today;
  });

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['ecosystem-predictive-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const threeMonthsAgo = subMonths(new Date(), 3).toISOString();
      const oneMonthAgo = subMonths(new Date(), 1).toISOString();

      const [expensesRes, focusRes] = await Promise.all([
        supabase.from('expenses').select('amount, date')
          .eq('user_id', user.id).is('deleted_at', null)
          .gte('date', threeMonthsAgo.slice(0, 10)),
        supabase.from('financial_focus_sessions').select('created_at, duration_minutes')
          .eq('user_id', user.id).gte('created_at', oneMonthAgo),
      ]);

      const expenses = expensesRes.data || [];
      const focusSessions = focusRes.data || [];
      const result: PredictiveAlert[] = [];

      // 1. Day-of-week spending pattern
      const dayTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
      const dayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
      for (const e of expenses) {
        const day = getDay(new Date(e.date));
        dayTotals[day] += e.amount || 0;
        dayCounts[day]++;
      }
      const dayAvgs = dayTotals.map((t, i) => dayCounts[i] > 0 ? t / dayCounts[i] : 0);
      const overallAvg = dayAvgs.reduce((a, b) => a + b, 0) / 7;
      const today = getDay(new Date());
      const todayAvg = dayAvgs[today];

      if (overallAvg > 0 && todayAvg > overallAvg * 1.4) {
        const dayName = isEs ? DAY_NAMES_ES[today] : DAY_NAMES_EN[today];
        result.push({
          type: 'high-spend-day',
          emoji: '📊',
          titleEs: `Los ${dayName} gastas más`,
          titleEn: `You spend more on ${dayName}s`,
          messageEs: `Tu gasto promedio los ${dayName} es ${Math.round(((todayAvg / overallAvg) - 1) * 100)}% mayor. Considera una sesión de enfoque antes de hacer compras hoy.`,
          messageEn: `Your average ${dayName} spending is ${Math.round(((todayAvg / overallAvg) - 1) * 100)}% higher. Consider a focus session before making purchases today.`,
        });
      }

      // 2. Focus streak at risk
      const recentFocus = focusSessions
        .map(s => format(new Date(s.created_at), 'yyyy-MM-dd'))
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort()
        .reverse();

      if (recentFocus.length >= 3) {
        const lastSession = recentFocus[0];
        const daysSince = Math.floor((Date.now() - new Date(lastSession).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince >= 2 && daysSince <= 4) {
          result.push({
            type: 'streak-risk',
            emoji: '🔥',
            titleEs: 'Tu racha de enfoque está en riesgo',
            titleEn: 'Your focus streak is at risk',
            messageEs: `Llevas ${daysSince} días sin sesión de enfoque. ¡No pierdas tu racha!`,
            messageEn: `It's been ${daysSince} days since your last focus session. Don't lose your streak!`,
          });
        }
      }

      // 3. Positive pattern recognition
      const totalFocusMinutes = focusSessions.reduce((a, s) => a + (s.duration_minutes || 0), 0);
      const recentExpenseTotal = expenses
        .filter(e => e.date >= oneMonthAgo.slice(0, 10))
        .reduce((a, e) => a + (e.amount || 0), 0);
      const olderExpenseTotal = expenses
        .filter(e => e.date < oneMonthAgo.slice(0, 10))
        .reduce((a, e) => a + (e.amount || 0), 0);

      if (totalFocusMinutes > 60 && recentExpenseTotal < olderExpenseTotal * 0.5 && olderExpenseTotal > 0) {
        result.push({
          type: 'pattern',
          emoji: '🌟',
          titleEs: 'Patrón positivo detectado',
          titleEn: 'Positive pattern detected',
          messageEs: 'Tu enfoque ha aumentado y tus gastos han bajado. ¡El bienestar mental impacta tus finanzas!',
          messageEn: 'Your focus increased and spending decreased. Mental wellness impacts your finances!',
        });
      }

      return result;
    },
    enabled: !!user?.id && hasBundleAccess && !dismissed,
    staleTime: 1000 * 60 * 30,
  });

  if (flagsLoading || !hasBundleAccess || !isEnabled('ecosystem_insights') || dismissed) return null;
  if (isLoading || !alerts || alerts.length === 0) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, format(new Date(), 'yyyy-MM-dd'));
    setDismissed(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardHeader className="pb-1 pt-3 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            {isEs ? 'Alertas Predictivas' : 'Predictive Alerts'}
          </CardTitle>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {alerts.map((alert, i) => (
            <div key={alert.type} className="flex items-start gap-2 p-2 rounded-lg bg-background/60">
              <span className="text-base shrink-0">{alert.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-foreground">
                  {isEs ? alert.titleEs : alert.titleEn}
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                  {isEs ? alert.messageEs : alert.messageEn}
                </p>
              </div>
              {(alert.type === 'high-spend-day' || alert.type === 'streak-risk') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-[10px] h-6 px-2 gap-1 mt-0.5"
                  onClick={() => openFokusparkTool(
                    alert.type === 'high-spend-day' ? 'breathing' : 'focus-timer',
                    'predictive-alert'
                  )}
                >
                  <ExternalLink className="h-3 w-3" />
                  {isEs ? 'Ir' : 'Go'}
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
});

EcosystemPredictiveAlerts.displayName = 'EcosystemPredictiveAlerts';
