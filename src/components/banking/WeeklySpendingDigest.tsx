import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useExpenses } from '@/hooks/data/useExpenses';
import { motion } from 'framer-motion';
import { parseISO, startOfWeek, endOfWeek, subWeeks, format, differenceInDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar, TrendingUp, TrendingDown, ShoppingBag, CreditCard, Star, ArrowRight } from 'lucide-react';

interface WeeklyDigest {
  weekTotal: number;
  prevWeekTotal: number;
  percentChange: number;
  transactionCount: number;
  avgTransaction: number;
  topMerchant: { name: string; total: number; count: number } | null;
  biggestExpense: { vendor: string; amount: number; date: string } | null;
  dailyBreakdown: { day: string; amount: number }[];
  streakDays: number; // days with no spending
}

export function WeeklySpendingDigest() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: transactions } = useBankTransactions();
  const { data: expenses } = useExpenses();

  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const digest = useMemo<WeeklyDigest | null>(() => {
    // Unify data sources
    const items: { date: string; amount: number; vendor: string }[] = [];
    const matchedIds = new Set(transactions?.filter(t => t.matched_expense_id).map(t => t.matched_expense_id) || []);

    (expenses || []).forEach(e => {
      if (!e.deleted_at) items.push({ date: e.date, amount: Math.abs(Number(e.amount)), vendor: e.vendor || e.description || 'Unknown' });
    });
    (transactions || []).forEach(t => {
      if (!t.matched_expense_id) items.push({ date: t.transaction_date, amount: Math.abs(Number(t.amount)), vendor: t.description || 'Unknown' });
    });

    if (items.length === 0) return null;

    // This week
    const weekItems = items.filter(i => {
      const d = parseISO(i.date);
      return d >= currentWeekStart && d <= currentWeekEnd;
    });
    const weekTotal = weekItems.reduce((s, i) => s + i.amount, 0);

    // Previous week
    const prevItems = items.filter(i => {
      const d = parseISO(i.date);
      return d >= prevWeekStart && d <= prevWeekEnd;
    });
    const prevWeekTotal = prevItems.reduce((s, i) => s + i.amount, 0);

    const percentChange = prevWeekTotal > 0 ? ((weekTotal - prevWeekTotal) / prevWeekTotal) * 100 : 0;

    // Top merchant this week
    const merchantMap: Record<string, { total: number; count: number }> = {};
    weekItems.forEach(i => {
      const key = i.vendor.toLowerCase().trim();
      if (!merchantMap[key]) merchantMap[key] = { total: 0, count: 0 };
      merchantMap[key].total += i.amount;
      merchantMap[key].count++;
    });
    const topMerchantEntry = Object.entries(merchantMap).sort((a, b) => b[1].total - a[1].total)[0];
    const topMerchant = topMerchantEntry
      ? { name: topMerchantEntry[0], total: topMerchantEntry[1].total, count: topMerchantEntry[1].count }
      : null;

    // Biggest single expense
    const biggestExpense = weekItems.length > 0
      ? weekItems.reduce((max, i) => i.amount > max.amount ? i : max, weekItems[0])
      : null;

    // Daily breakdown (Mon-Sun)
    const dayNames = l
      ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const dailyBreakdown = dayNames.map((day, i) => {
      const dayDate = new Date(currentWeekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dayStr = format(dayDate, 'yyyy-MM-dd');
      const dayTotal = weekItems.filter(item => item.date === dayStr).reduce((s, item) => s + item.amount, 0);
      return { day, amount: dayTotal };
    });

    // No-spend streak (consecutive days with 0 spending ending today)
    let streakDays = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const dayTotal = items.filter(item => item.date === dateStr).reduce((s, item) => s + item.amount, 0);
      if (dayTotal === 0) streakDays++;
      else break;
    }

    return {
      weekTotal,
      prevWeekTotal,
      percentChange,
      transactionCount: weekItems.length,
      avgTransaction: weekItems.length > 0 ? weekTotal / weekItems.length : 0,
      topMerchant,
      biggestExpense: biggestExpense ? { vendor: biggestExpense.vendor, amount: biggestExpense.amount, date: biggestExpense.date } : null,
      dailyBreakdown,
      streakDays,
    };
  }, [transactions, expenses, currentWeekStart, currentWeekEnd, prevWeekStart, prevWeekEnd, now, l]);

  if (!digest) return null;

  const maxDay = Math.max(...digest.dailyBreakdown.map(d => d.amount), 1);
  const isDown = digest.percentChange < -5;
  const isUp = digest.percentChange > 5;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">
                {l ? '📊 Resumen Semanal' : '📊 Weekly Digest'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {format(currentWeekStart, 'MMM dd', { locale: l ? es : enUS })} — {format(currentWeekEnd, 'MMM dd', { locale: l ? es : enUS })}
              </p>
            </div>
          </div>
          <Badge variant={isDown ? 'default' : isUp ? 'destructive' : 'outline'} className="text-xs">
            {isDown ? <TrendingDown className="h-3 w-3 mr-1" /> : isUp ? <TrendingUp className="h-3 w-3 mr-1" /> : null}
            {digest.percentChange > 0 ? '+' : ''}{digest.percentChange.toFixed(0)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {/* Total & comparison */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">{fc(digest.weekTotal)}</p>
            <p className="text-xs text-muted-foreground">
              {digest.transactionCount} {l ? 'transacciones' : 'transactions'} · {fc(digest.avgTransaction)} {l ? 'promedio' : 'avg'}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{l ? 'Semana anterior' : 'Previous week'}</p>
            <p className="font-medium">{fc(digest.prevWeekTotal)}</p>
          </div>
        </div>

        {/* Daily bar chart */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{l ? 'Gasto por día' : 'Spending by day'}</p>
          <div className="flex items-end gap-1.5 h-16">
            {digest.dailyBreakdown.map((day, i) => {
              const pct = maxDay > 0 ? (day.amount / maxDay) * 100 : 0;
              const isToday = i === (now.getDay() === 0 ? 6 : now.getDay() - 1);
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pct, 4)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className={cn(
                      "w-full rounded-t-sm min-h-[2px]",
                      isToday ? "bg-primary" : day.amount > 0 ? "bg-primary/40" : "bg-muted"
                    )}
                  />
                  <span className={cn("text-[9px]", isToday ? "font-bold text-primary" : "text-muted-foreground")}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 gap-2">
          {digest.topMerchant && (
            <div className="p-2.5 rounded-lg bg-muted/40 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                <ShoppingBag className="h-3 w-3" />
                {l ? 'Top comercio' : 'Top merchant'}
              </div>
              <p className="text-sm font-semibold truncate capitalize">{digest.topMerchant.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {fc(digest.topMerchant.total)} · {digest.topMerchant.count}x
              </p>
            </div>
          )}

          {digest.biggestExpense && (
            <div className="p-2.5 rounded-lg bg-muted/40 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                <CreditCard className="h-3 w-3" />
                {l ? 'Mayor gasto' : 'Biggest expense'}
              </div>
              <p className="text-sm font-semibold truncate capitalize">{digest.biggestExpense.vendor}</p>
              <p className="text-[10px] text-muted-foreground">
                {fc(digest.biggestExpense.amount)} · {format(parseISO(digest.biggestExpense.date), 'EEE dd', { locale: l ? es : enUS })}
              </p>
            </div>
          )}
        </div>

        {/* No-spend streak */}
        {digest.streakDays > 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Star className="h-4 w-4 text-emerald-500" />
            <p className="text-xs">
              {l
                ? `🔥 ${digest.streakDays} ${digest.streakDays === 1 ? 'día' : 'días'} sin gastar — ¡sigue la racha!`
                : `🔥 ${digest.streakDays} no-spend ${digest.streakDays === 1 ? 'day' : 'days'} — keep the streak!`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
