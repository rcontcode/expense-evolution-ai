import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useUserSettings, UserPreferences } from '@/hooks/data/useUserSettings';
import { motion } from 'framer-motion';
import { startOfMonth, endOfMonth, subDays, parseISO, differenceInDays, getDaysInMonth, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { Gauge, Zap, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';

export function SpendingVelocityMonitor() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: settings } = useUserSettings();
  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const dayOfMonth = now.getDate();
  const daysInMonth = getDaysInMonth(now);

  const { data: expenses } = useExpenses({ dateRange: { start: monthStart, end: monthEnd } });
  const { data: transactions } = useBankTransactions();

  const velocity = useMemo(() => {
    // Unify expenses + unmatched bank transactions
    const items: { date: string; amount: number }[] = [];
    const matchedIds = new Set(transactions?.filter(t => t.matched_expense_id).map(t => t.matched_expense_id) || []);

    (expenses || []).forEach(e => {
      if (!e.deleted_at) items.push({ date: e.date, amount: Math.abs(Number(e.amount)) });
    });
    (transactions || []).forEach(t => {
      if (!t.matched_expense_id) items.push({ date: t.transaction_date, amount: Math.abs(Number(t.amount)) });
    });

    if (items.length === 0) return null;

    // Current month total
    const monthItems = items.filter(i => {
      const d = parseISO(i.date);
      return d >= monthStart && d <= now;
    });
    const monthTotal = monthItems.reduce((s, i) => s + i.amount, 0);

    // Last 7 days
    const sevenDaysAgo = subDays(now, 7);
    const last7 = items.filter(i => {
      const d = parseISO(i.date);
      return d >= sevenDaysAgo && d <= now;
    });
    const last7Total = last7.reduce((s, i) => s + i.amount, 0);
    const dailyAvg7 = last7Total / 7;

    // Previous 7 days (8-14 days ago)
    const fourteenDaysAgo = subDays(now, 14);
    const prev7 = items.filter(i => {
      const d = parseISO(i.date);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    });
    const prev7Total = prev7.reduce((s, i) => s + i.amount, 0);
    const dailyAvgPrev7 = prev7Total / 7;

    // Acceleration: are you spending faster or slower?
    const acceleration = dailyAvgPrev7 > 0
      ? ((dailyAvg7 - dailyAvgPrev7) / dailyAvgPrev7) * 100
      : 0;

    // Burn rate: days until budget exhausted
    const remaining = globalBudget > 0 ? globalBudget - monthTotal : 0;
    const daysUntilExhausted = dailyAvg7 > 0 ? remaining / dailyAvg7 : Infinity;
    const daysLeft = daysInMonth - dayOfMonth;

    // Ideal pace
    const idealDailySpend = globalBudget > 0 ? globalBudget / daysInMonth : 0;
    const idealToDate = idealDailySpend * dayOfMonth;
    const paceRatio = idealToDate > 0 ? (monthTotal / idealToDate) * 100 : 0;

    // Today's spending
    const todayStr = now.toISOString().split('T')[0];
    const todayTotal = items.filter(i => i.date === todayStr).reduce((s, i) => s + i.amount, 0);

    // This week
    const weekItems = items.filter(i => {
      const d = parseISO(i.date);
      return d >= weekStart && d <= now;
    });
    const weekTotal = weekItems.reduce((s, i) => s + i.amount, 0);

    return {
      monthTotal,
      dailyAvg7,
      dailyAvgPrev7,
      acceleration,
      daysUntilExhausted,
      daysLeft,
      paceRatio,
      todayTotal,
      weekTotal,
      remaining,
      idealDailySpend,
    };
  }, [expenses, transactions, globalBudget, now, monthStart, weekStart, dayOfMonth, daysInMonth]);

  if (!velocity) return null;

  const isAccelerating = velocity.acceleration > 10;
  const isDecelerating = velocity.acceleration < -10;
  const isCritical = velocity.paceRatio > 120;
  const isGood = velocity.paceRatio <= 90;
  const burnRisk = velocity.daysUntilExhausted < velocity.daysLeft && globalBudget > 0;

  // Velocity gauge (0-100 where 50 is ideal)
  const gaugeValue = Math.min(100, Math.max(0, velocity.paceRatio));

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-destructive/5" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isAccelerating ? [0, 5, -5, 0] : [0, 0, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={cn(
                "p-2.5 rounded-xl shadow-lg",
                isCritical
                  ? "bg-gradient-to-br from-destructive to-amber-500 shadow-destructive/25"
                  : isGood
                  ? "bg-gradient-to-br from-emerald-500 to-chart-4 shadow-emerald-500/25"
                  : "bg-gradient-to-br from-amber-500 to-chart-1 shadow-amber-500/25"
              )}
            >
              <Gauge className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-base">
                {l ? '⚡ Velocidad de Gasto' : '⚡ Spending Velocity'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {l ? 'Ritmo en tiempo real' : 'Real-time spending pace'}
              </p>
            </div>
          </div>
          <Badge variant={isCritical ? 'destructive' : isGood ? 'default' : 'outline'} className="text-xs">
            {isCritical
              ? (l ? '🔥 Rápido' : '🔥 Fast')
              : isGood
              ? (l ? '✅ En meta' : '✅ On track')
              : (l ? '⚠️ Cuidado' : '⚠️ Caution')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {/* Velocity gauge bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{l ? 'Ritmo vs ideal' : 'Pace vs ideal'}</span>
            <span className={cn("font-semibold", isCritical ? "text-destructive" : isGood ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600")}>
              {velocity.paceRatio.toFixed(0)}%
            </span>
          </div>
          <div className="relative h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(gaugeValue, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={cn(
                "h-full rounded-full",
                gaugeValue <= 90 ? "bg-emerald-500" :
                gaugeValue <= 110 ? "bg-amber-500" : "bg-destructive"
              )}
            />
            {/* Ideal marker at 100% of ideal = dayOfMonth/daysInMonth position */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
              style={{ left: '100%', transform: 'translateX(-100%)' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0%</span>
            <span className="font-medium">← {l ? 'Ideal' : 'Ideal'} →</span>
            <span>150%+</span>
          </div>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-muted/40 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{l ? 'Hoy' : 'Today'}</p>
            <p className="text-lg font-bold">{fc(velocity.todayTotal)}</p>
            {velocity.idealDailySpend > 0 && (
              <p className={cn("text-[10px]",
                velocity.todayTotal <= velocity.idealDailySpend ? "text-emerald-600" : "text-destructive"
              )}>
                {velocity.todayTotal <= velocity.idealDailySpend ? '✓' : '⚠'} {l ? 'Límite:' : 'Limit:'} {fc(velocity.idealDailySpend)}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-muted/40 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{l ? 'Esta semana' : 'This week'}</p>
            <p className="text-lg font-bold">{fc(velocity.weekTotal)}</p>
            {velocity.idealDailySpend > 0 && (
              <p className="text-[10px] text-muted-foreground">
                ~{fc(velocity.idealDailySpend * 7)}/{l ? 'semana ideal' : 'week ideal'}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-muted/40 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{l ? 'Promedio 7d' : '7-day avg'}</p>
            <p className="text-lg font-bold">{fc(velocity.dailyAvg7)}<span className="text-xs font-normal text-muted-foreground">/{l ? 'día' : 'day'}</span></p>
            {velocity.acceleration !== 0 && (
              <div className={cn("flex items-center gap-1 text-[10px]",
                isAccelerating ? "text-destructive" : isDecelerating ? "text-emerald-600" : "text-muted-foreground"
              )}>
                {isAccelerating ? <TrendingUp className="h-3 w-3" /> : isDecelerating ? <TrendingDown className="h-3 w-3" /> : null}
                {velocity.acceleration > 0 ? '+' : ''}{velocity.acceleration.toFixed(0)}% {l ? 'vs semana ant.' : 'vs prev week'}
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-muted/40 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{l ? 'Disponible' : 'Remaining'}</p>
            <p className={cn("text-lg font-bold", velocity.remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
              {fc(Math.max(0, velocity.remaining))}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {velocity.daysLeft} {l ? 'días restantes' : 'days left'}
            </p>
          </div>
        </div>

        {/* Burn rate warning */}
        {burnRisk && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20"
          >
            <Flame className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                {l ? '🔥 Burn Rate Alert' : '🔥 Burn Rate Alert'}
              </p>
              <p className="text-xs text-muted-foreground">
                {l
                  ? `A este ritmo, tu presupuesto se agota en ${Math.max(0, Math.floor(velocity.daysUntilExhausted))} días, pero quedan ${velocity.daysLeft} días del mes.`
                  : `At this pace, your budget runs out in ${Math.max(0, Math.floor(velocity.daysUntilExhausted))} days, but ${velocity.daysLeft} days remain.`}
              </p>
              <p className="text-xs font-medium mt-1">
                {l
                  ? `💡 Reduce a ${fc(velocity.remaining / velocity.daysLeft)}/día para llegar al final del mes.`
                  : `💡 Reduce to ${fc(velocity.remaining / velocity.daysLeft)}/day to make it through the month.`}
              </p>
            </div>
          </motion.div>
        )}

        {isAccelerating && !burnRisk && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-xs text-muted-foreground">
              {l
                ? `Tu gasto diario aumentó ${velocity.acceleration.toFixed(0)}% esta semana vs la anterior.`
                : `Your daily spending increased ${velocity.acceleration.toFixed(0)}% this week vs last.`}
            </p>
          </div>
        )}

        {isGood && !isAccelerating && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-xs text-muted-foreground">
              {l ? 'Tu ritmo de gasto está controlado. ¡Sigue así!' : 'Your spending pace is controlled. Keep it up!'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
