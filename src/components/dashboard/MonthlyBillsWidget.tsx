import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { BILL_CATEGORY_CONFIG, type BillCategory, getMonthlyEquivalent } from '@/lib/constants/bill-categories';
import { differenceInDays, parseISO, startOfMonth, endOfMonth, isWithinInterval, getDaysInMonth, getDate, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Receipt, AlertTriangle, CheckCircle2, ArrowRight, Wallet,
  Clock, Zap, CalendarDays, PiggyBank, TrendingDown, ShieldCheck, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MonthlyBillsWidget({ className }: { className?: string }) {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency } = useFormatCurrency();
  const { data: bills } = useRecurringBills();
  const { data: stats } = useDashboardStats({});
  const navigate = useNavigate();

  const now = new Date();
  const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) };
  const daysInMonth = getDaysInMonth(now);
  const dayOfMonth = getDate(now);
  const monthPctElapsed = (dayOfMonth / daysInMonth) * 100;

  const analysis = useMemo(() => {
    if (!bills || bills.length === 0) return null;

    const active = bills.filter(b => b.status === 'active');

    // Monthly total
    const monthlyTotal = active.reduce((sum, b) => {
      return sum + getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined);
    }, 0);

    // Bills due this month
    const thisMonth = active.filter(b =>
      isWithinInterval(parseISO(b.next_due_date), monthInterval)
    ).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));

    // Paid this month
    const paidThisMonth = thisMonth.filter(b => {
      if (!b.last_paid_date) return false;
      return isWithinInterval(parseISO(b.last_paid_date), monthInterval);
    });

    // Overdue
    const overdue = active.filter(b => differenceInDays(parseISO(b.next_due_date), now) < 0);

    // Due in next 7 days
    const dueSoon = active.filter(b => {
      const days = differenceInDays(parseISO(b.next_due_date), now);
      return days >= 0 && days <= 7;
    });

    // Income vs bills
    const monthlyIncome = stats?.monthlyIncome || 0;
    const variableExpenses = stats?.monthlyTotal || 0;
    const netAfterBills = monthlyIncome - monthlyTotal;
    const netAfterAll = monthlyIncome - monthlyTotal - variableExpenses;

    const paidAmount = paidThisMonth.reduce((s, b) => s + Number(b.amount), 0);
    const pendingAmount = thisMonth.reduce((s, b) => s + Number(b.amount), 0) - paidAmount;
    const progress = thisMonth.length > 0 ? (paidThisMonth.length / thisMonth.length) * 100 : 100;

    // Autopay stats
    const autopayCount = active.filter(b => b.auto_pay).length;

    // Category breakdown (top 3)
    const catMap: Record<string, number> = {};
    active.forEach(b => {
      const monthly = getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined);
      catMap[b.category] = (catMap[b.category] || 0) + monthly;
    });
    const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

    // Next payment
    const nextBill = active
      .filter(b => differenceInDays(parseISO(b.next_due_date), now) >= 0)
      .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))[0] || null;
    const daysToNext = nextBill ? differenceInDays(parseISO(nextBill.next_due_date), now) : null;

    return {
      monthlyTotal,
      monthlyIncome,
      variableExpenses,
      netAfterBills,
      netAfterAll,
      totalThisMonth: thisMonth.length,
      paidCount: paidThisMonth.length,
      overdueCount: overdue.length,
      dueSoonCount: dueSoon.length,
      paidAmount,
      pendingAmount,
      progress,
      topUpcoming: dueSoon.slice(0, 3),
      topOverdue: overdue.slice(0, 2),
      autopayCount,
      totalActive: active.length,
      topCategories,
      nextBill,
      daysToNext,
    };
  }, [bills, stats, now]);

  if (!analysis) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Receipt className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            {l ? 'Sin pagos recurrentes configurados' : 'No recurring bills configured'}
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate('/budget?tab=bills')}>
            {l ? 'Configurar Pagos' : 'Set Up Bills'}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Is payment pace ahead or behind?
  const paymentPctDone = analysis.progress;
  const paceStatus = paymentPctDone >= monthPctElapsed ? 'ahead' : 'behind';

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            {l ? 'Pagos del Mes' : 'Monthly Bills'}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {analysis.nextBill && (
              <Badge variant="outline" className="text-[10px] gap-0.5">
                <Clock className="h-3 w-3" />
                {analysis.daysToNext === 0 ? (l ? 'Hoy' : 'Today') : `${analysis.daysToNext}d`}
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-primary"
              onClick={() => navigate('/budget?tab=bills')}>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress with pace comparison */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {analysis.paidCount}/{analysis.totalThisMonth} {l ? 'pagados' : 'paid'}
              <span className={`ml-1 text-[10px] ${paceStatus === 'ahead' ? 'text-emerald-500' : 'text-amber-500'}`}>
                {paceStatus === 'ahead' ? (l ? '• Al día' : '• On track') : (l ? '• Atrasado' : '• Behind')}
              </span>
            </span>
            <span className="font-medium text-xs">
              {formatCurrency(analysis.paidAmount)} / {formatCurrency(analysis.paidAmount + analysis.pendingAmount)}
            </span>
          </div>
          <div className="relative">
            <Progress value={analysis.progress} className="h-2.5" />
            {/* Month elapsed marker */}
            <div
              className="absolute top-0 h-2.5 w-0.5 bg-foreground/40 rounded"
              style={{ left: `${monthPctElapsed}%` }}
              title={l ? `Día ${dayOfMonth} de ${daysInMonth}` : `Day ${dayOfMonth} of ${daysInMonth}`}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {l ? `Día ${dayOfMonth}/${daysInMonth} del mes` : `Day ${dayOfMonth}/${daysInMonth} of month`}
            {' · '}
            {analysis.pendingAmount > 0
              ? (l ? `${formatCurrency(analysis.pendingAmount)} pendiente` : `${formatCurrency(analysis.pendingAmount)} pending`)
              : (l ? '¡Todo pagado!' : 'All paid!')}
          </p>
        </div>

        {/* Net balance: 3-column compact */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-center">
            <p className="text-[9px] text-muted-foreground">{l ? 'Ingreso' : 'Income'}</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(analysis.monthlyIncome)}</p>
          </div>
          <div className="p-1.5 rounded-lg bg-red-500/10 text-center">
            <p className="text-[9px] text-muted-foreground">{l ? 'Fijos' : 'Fixed'}</p>
            <p className="text-xs font-bold text-red-600 dark:text-red-400">{formatCurrency(analysis.monthlyTotal)}</p>
          </div>
          <div className={`p-1.5 rounded-lg text-center ${analysis.netAfterBills >= 0 ? 'bg-blue-500/10' : 'bg-destructive/10'}`}>
            <p className="text-[9px] text-muted-foreground">{l ? 'Libre' : 'Free'}</p>
            <p className={`text-xs font-bold ${analysis.netAfterBills >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-destructive'}`}>
              {formatCurrency(analysis.netAfterBills)}
            </p>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" /> {analysis.totalActive} {l ? 'activos' : 'active'}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" /> {analysis.autopayCount} {l ? 'auto' : 'autopay'}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" /> {analysis.dueSoonCount} {l ? 'próximos' : 'upcoming'}
          </span>
        </div>

        {/* Alerts: Overdue */}
        {analysis.overdueCount > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-destructive">
                {analysis.overdueCount} {l ? 'vencido(s)' : 'overdue'}
              </p>
              <div className="flex gap-1 mt-0.5 flex-wrap">
                {analysis.topOverdue.map(b => (
                  <Badge key={b.id} variant="destructive" className="text-[10px] h-4">
                    {BILL_CATEGORY_CONFIG[b.category as BillCategory]?.icon} {b.name}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Upcoming bills */}
        {analysis.topUpcoming.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              {l ? 'Próximos 7 días' : 'Next 7 days'}
            </p>
            {analysis.topUpcoming.map((bill, i) => {
              const cat = BILL_CATEGORY_CONFIG[bill.category as BillCategory];
              const days = differenceInDays(parseISO(bill.next_due_date), now);
              return (
                <motion.div key={bill.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }} className="flex items-center gap-2 py-1">
                  <span className="text-sm">{cat?.icon || '📋'}</span>
                  <span className="text-xs flex-1 truncate">{bill.name}</span>
                  <Badge variant={days === 0 ? 'default' : 'outline'} className="text-[10px] h-4 shrink-0">
                    {days === 0 ? (l ? '¡Hoy!' : 'Today!') : `${days}d`}
                  </Badge>
                  <span className="text-xs font-semibold">{formatCurrency(bill.amount)}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Top categories mini */}
        {analysis.topCategories.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              {l ? 'Top categorías' : 'Top categories'}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {analysis.topCategories.map(([cat, amount]) => {
                const cfg = BILL_CATEGORY_CONFIG[cat as BillCategory];
                return (
                  <Badge key={cat} variant="secondary" className="text-[10px] gap-1">
                    {cfg?.icon} {cfg?.[l ? 'es' : 'en'] || cat}: {formatCurrency(amount)}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* All paid celebration */}
        {analysis.progress === 100 && analysis.totalThisMonth > 0 && (
          <div className="text-center py-1.5 rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500 mb-0.5" />
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {l ? '¡Todos los pagos al día! 🎉' : 'All bills paid! 🎉'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
