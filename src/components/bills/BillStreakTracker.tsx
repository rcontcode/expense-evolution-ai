import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecurringBills, useBillPayments } from '@/hooks/data/useRecurringBills';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Flame, Trophy, Star, Calendar, Sparkles } from 'lucide-react';

export function BillStreakTracker() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { data: bills } = useRecurringBills();
  const { data: payments } = useBillPayments();

  const streakData = useMemo(() => {
    const active = bills?.filter(b => b.status === 'active') || [];
    if (active.length === 0 || !payments) return null;

    const now = new Date();

    // Check last 6 months for "perfect months" (all bills paid on time)
    const months: { key: string; label: string; perfect: boolean; paidCount: number; totalCount: number }[] = [];
    let consecutivePerfect = 0;
    let bestStreak = 0;
    let currentStreak = 0;

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const interval = { start: startOfMonth(monthDate), end: endOfMonth(monthDate) };
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMM', { locale: l ? es : undefined });

      // Bills due that month
      const dueThisMonth = active.filter(b => {
        // Simplified: check if bill existed by that month
        return parseISO(b.created_at) <= interval.end;
      });

      // Payments in that month
      const paidThisMonth = payments.filter(p =>
        isWithinInterval(parseISO(p.paid_date), interval)
      );

      const perfect = dueThisMonth.length > 0 && paidThisMonth.length >= Math.min(dueThisMonth.length, paidThisMonth.length);

      months.push({
        key: monthKey,
        label: monthLabel,
        perfect: paidThisMonth.length > 0,
        paidCount: paidThisMonth.length,
        totalCount: dueThisMonth.length,
      });

      if (paidThisMonth.length > 0) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else if (i > 0) {
        currentStreak = 0;
      }
    }

    // Total stats
    const totalPayments = payments.length;
    const perfectMonths = months.filter(m => m.perfect).length;

    // Achievement level
    const level = totalPayments >= 50 ? { label: l ? '💎 Diamante' : '💎 Diamond', tier: 4 }
      : totalPayments >= 30 ? { label: l ? '🥇 Oro' : '🥇 Gold', tier: 3 }
      : totalPayments >= 15 ? { label: l ? '🥈 Plata' : '🥈 Silver', tier: 2 }
      : totalPayments >= 5 ? { label: l ? '🥉 Bronce' : '🥉 Bronze', tier: 1 }
      : { label: l ? '🌱 Novato' : '🌱 Rookie', tier: 0 };

    return {
      months,
      currentStreak,
      bestStreak,
      totalPayments,
      perfectMonths,
      level,
    };
  }, [bills, payments, l]);

  if (!streakData) return null;

  return (
    <Card className="overflow-hidden border-2 border-amber-500/15 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15">
              <Flame className="h-4 w-4 text-amber-500" />
            </div>
            <span className="text-sm font-bold">{l ? 'Racha de Pagos' : 'Payment Streak'}</span>
          </div>
          <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] h-5">
            {streakData.level.label}
          </Badge>
        </div>

        {/* Streak counter */}
        <div className="flex items-center justify-center gap-6 mb-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="text-center">
            <div className="flex items-center gap-1">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-3xl font-black">{streakData.currentStreak}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {l ? 'meses activos' : 'active months'}
            </p>
          </motion.div>

          <div className="h-10 w-px bg-border" />

          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}
            className="text-center">
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-xl font-bold">{streakData.bestStreak}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {l ? 'mejor racha' : 'best streak'}
            </p>
          </motion.div>

          <div className="h-10 w-px bg-border" />

          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.4 }}
            className="text-center">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-xl font-bold">{streakData.totalPayments}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {l ? 'pagos totales' : 'total payments'}
            </p>
          </motion.div>
        </div>

        {/* Monthly timeline */}
        <div className="flex items-center justify-between gap-1">
          {streakData.months.map((month, i) => (
            <motion.div
              key={month.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="flex-1 text-center"
            >
              <div className={`mx-auto w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                month.perfect
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-muted/60 text-muted-foreground'
              }`}>
                {month.perfect ? '✓' : '·'}
              </div>
              <p className="text-[9px] text-muted-foreground mt-1 uppercase">{month.label}</p>
              <p className="text-[8px] text-muted-foreground">{month.paidCount}</p>
            </motion.div>
          ))}
        </div>

        {/* Next milestone */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="mt-3 text-center">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            {streakData.level.tier < 4
              ? (l
                  ? `${[5, 15, 30, 50][streakData.level.tier] - streakData.totalPayments} pagos más para el siguiente nivel`
                  : `${[5, 15, 30, 50][streakData.level.tier] - streakData.totalPayments} more payments to next level`)
              : (l ? '¡Nivel máximo alcanzado! 💎' : 'Max level reached! 💎')}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}
