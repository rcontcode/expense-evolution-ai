import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Clock, Zap, CalendarDays, PiggyBank, Target, TrendingDown, ShieldAlert, BanknoteIcon
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

    // Due in next 7 days (not overdue)
    const dueSoon = active.filter(b => {
      const days = differenceInDays(parseISO(b.next_due_date), now);
      return days >= 0 && days <= 7;
    }).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));

    // Due today
    const dueToday = active.filter(b => {
      const days = differenceInDays(parseISO(b.next_due_date), now);
      return days === 0;
    });

    // Bills within their reminder window (reminder_days_before)
    const inReminderWindow = active.filter(b => {
      const days = differenceInDays(parseISO(b.next_due_date), now);
      const reminderDays = b.reminder_days_before || 3;
      return days > 0 && days <= reminderDays && !dueToday.some(d => d.id === b.id);
    }).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));

    // Income vs bills
    const monthlyIncome = stats?.monthlyIncome || 0;
    const variableExpenses = stats?.monthlyTotal || 0;
    const netAfterBills = monthlyIncome - monthlyTotal;
    const netAfterAll = monthlyIncome - monthlyTotal - variableExpenses;

    const paidAmount = paidThisMonth.reduce((s, b) => s + Number(b.amount), 0);
    const pendingAmount = thisMonth.reduce((s, b) => s + Number(b.amount), 0) - paidAmount;
    const overdueAmount = overdue.reduce((s, b) => s + Number(b.amount), 0);
    const progress = thisMonth.length > 0 ? (paidThisMonth.length / thisMonth.length) * 100 : 100;

    // Autopay stats
    const autopayCount = active.filter(b => b.auto_pay).length;
    const manualCount = active.length - autopayCount;

    // Projected balance after each upcoming payment
    let runningBalance = netAfterBills;
    const upcomingWithBalance = dueSoon.slice(0, 5).map(bill => {
      const amount = Number(bill.amount);
      runningBalance -= amount;
      return {
        ...bill,
        balanceAfter: runningBalance + amount, // balance BEFORE this payment (net minus previous)
        balanceAfterPayment: runningBalance,
      };
    });

    // Severity level for the whole widget
    const severity: 'critical' | 'warning' | 'ok' | 'perfect' =
      overdue.length > 0 ? 'critical' :
      dueToday.length > 0 ? 'warning' :
      progress === 100 && thisMonth.length > 0 ? 'perfect' : 'ok';

    return {
      monthlyTotal,
      monthlyIncome,
      variableExpenses,
      netAfterBills,
      netAfterAll,
      totalThisMonth: thisMonth.length,
      paidCount: paidThisMonth.length,
      overdueCount: overdue.length,
      overdueAmount,
      dueSoonCount: dueSoon.length,
      dueTodayCount: dueToday.length,
      dueToday,
      inReminderWindow,
      paidAmount,
      pendingAmount,
      progress,
      topUpcoming: upcomingWithBalance,
      topOverdue: overdue.slice(0, 3),
      autopayCount,
      manualCount,
      totalActive: active.length,
      severity,
      // Commitment health score: bills as % of income
      commitmentRatio: monthlyIncome > 0 ? (monthlyTotal / monthlyIncome) * 100 : 0,
    };
  }, [bills, stats]);


  if (!analysis) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Receipt className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            {l ? 'Sin pagos recurrentes configurados' : 'No recurring bills configured'}
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate('/bills')}>
            {l ? 'Configurar Pagos' : 'Set Up Bills'}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const severityStyles = {
    critical: 'border-destructive/50 shadow-destructive/20 shadow-md',
    warning: 'border-amber-500/50 shadow-amber-500/10 shadow-sm',
    ok: '',
    perfect: 'border-emerald-500/30',
  };

  const paceStatus = analysis.progress >= monthPctElapsed ? 'ahead' : 'behind';

  return (
    <Card className={`${className} transition-all ${severityStyles[analysis.severity]}`}>
      {/* ═══ CRITICAL BANNER: Overdue ═══ */}
      <AnimatePresence>
        {analysis.severity === 'critical' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-destructive text-destructive-foreground"
          >
            <motion.div
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-2 px-4 py-2.5"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold">
                  🚨 {analysis.overdueCount} {l ? 'pago(s) vencido(s)' : 'overdue payment(s)'}
                  {' · '}{formatCurrency(analysis.overdueAmount)}
                </p>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {analysis.topOverdue.map(b => (
                    <span key={b.id} className="text-[10px] opacity-90">
                      {BILL_CATEGORY_CONFIG[b.category as BillCategory]?.icon} {b.name} ({formatCurrency(b.amount)})
                    </span>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="secondary" className="h-6 text-[10px] shrink-0"
                onClick={() => navigate('/bills')}>
                {l ? 'Pagar' : 'Pay'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ TODAY'S PAYMENTS BANNER ═══ */}
      <AnimatePresence>
        {analysis.dueTodayCount > 0 && analysis.severity !== 'critical' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/15 border-b border-amber-500/20"
          >
            <motion.div
              animate={{ scale: [1, 1.01, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="flex items-center gap-2 px-4 py-2"
            >
              <Clock className="h-4 w-4 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {l ? `¡${analysis.dueTodayCount} pago(s) vence(n) HOY!` : `${analysis.dueTodayCount} payment(s) due TODAY!`}
                </p>
                <div className="flex gap-1.5 mt-0.5 flex-wrap">
                  {analysis.dueToday.map(b => (
                    <Badge key={b.id} className="text-[10px] h-4 bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
                      {BILL_CATEGORY_CONFIG[b.category as BillCategory]?.icon} {b.name}: {formatCurrency(b.amount)}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REMINDER WINDOW BANNER ═══ */}
      <AnimatePresence>
        {analysis.inReminderWindow.length > 0 && analysis.severity !== 'critical' && analysis.dueTodayCount === 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-500/10 border-b border-blue-500/20"
          >
            <div className="flex items-center gap-2 px-4 py-2">
              <PiggyBank className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  🔔 {analysis.inReminderWindow.length} {l ? 'pago(s) próximo(s) dentro del periodo de recordatorio' : 'payment(s) within reminder window'}
                </p>
                <div className="flex gap-1.5 mt-0.5 flex-wrap">
                  {analysis.inReminderWindow.slice(0, 3).map(b => {
                    const days = differenceInDays(parseISO(b.next_due_date), now);
                    return (
                      <Badge key={b.id} className="text-[10px] h-4 bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">
                        {BILL_CATEGORY_CONFIG[b.category as BillCategory]?.icon} {b.name}: {days}d
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            {l ? 'Pagos del Mes' : 'Monthly Bills'}
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-primary"
            onClick={() => navigate('/bills')}>
            {l ? 'Ver todo' : 'View all'} <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* ═══ PROGRESS WITH PACE ═══ */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {analysis.paidCount}/{analysis.totalThisMonth} {l ? 'pagados' : 'paid'}
              <span className={`ml-1 text-[10px] font-medium ${paceStatus === 'ahead' ? 'text-emerald-500' : 'text-amber-500'}`}>
                {paceStatus === 'ahead' ? (l ? '• Al día ✓' : '• On track ✓') : (l ? '• Atrasado ⚠' : '• Behind ⚠')}
              </span>
            </span>
            <span className="font-medium text-xs">
              {formatCurrency(analysis.paidAmount)} / {formatCurrency(analysis.paidAmount + analysis.pendingAmount)}
            </span>
          </div>
          <div className="relative">
            <Progress value={analysis.progress} className="h-2.5" />
            <div
              className="absolute top-0 h-2.5 w-0.5 bg-foreground/50 rounded"
              style={{ left: `${monthPctElapsed}%` }}
              title={l ? `Día ${dayOfMonth}/${daysInMonth}` : `Day ${dayOfMonth}/${daysInMonth}`}
            />
          </div>
        </div>

        {/* ═══ NET BALANCE: 3 COLUMNS ═══ */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">{l ? 'Ingreso' : 'Income'}</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(analysis.monthlyIncome)}</p>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">{l ? 'Fijos' : 'Fixed'}</p>
            <p className="text-xs font-bold text-red-600 dark:text-red-400">{formatCurrency(analysis.monthlyTotal)}</p>
          </div>
          <div className={`p-2 rounded-lg text-center ${analysis.netAfterBills >= 0 ? 'bg-blue-500/10' : 'bg-destructive/10'}`}>
            <p className="text-[9px] text-muted-foreground uppercase">{l ? 'Libre' : 'Free'}</p>
            <p className={`text-xs font-bold ${analysis.netAfterBills >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-destructive'}`}>
              {formatCurrency(analysis.netAfterBills)}
            </p>
          </div>
        </div>

        {/* ═══ QUICK STATS ═══ */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" /> {analysis.totalActive} {l ? 'activos' : 'active'}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" /> {analysis.autopayCount} auto / {analysis.manualCount} {l ? 'manual' : 'manual'}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" /> {l ? `Día ${dayOfMonth}/${daysInMonth}` : `Day ${dayOfMonth}/${daysInMonth}`}
          </span>
        </div>

        {/* ═══ COMMITMENT HEALTH SCORE ═══ */}
        {analysis.commitmentRatio > 0 && (
          <div className="p-2.5 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                {l ? 'Ratio Compromisos/Ingreso' : 'Commitment/Income Ratio'}
              </span>
              <Badge 
                variant={analysis.commitmentRatio < 30 ? 'default' : analysis.commitmentRatio < 50 ? 'secondary' : 'destructive'} 
                className="text-[10px] h-4"
              >
                {analysis.commitmentRatio.toFixed(0)}%
              </Badge>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${Math.min(analysis.commitmentRatio, 100)}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${
                  analysis.commitmentRatio < 30 ? 'bg-emerald-500' : 
                  analysis.commitmentRatio < 50 ? 'bg-amber-500' : 'bg-destructive'
                }`} 
              />
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">
              {analysis.commitmentRatio < 30
                ? (l ? '✅ Excelente — tus compromisos fijos son bajos' : '✅ Excellent — low fixed commitments')
                : analysis.commitmentRatio < 50
                  ? (l ? '⚡ Moderado — espacio razonable para gastos variables' : '⚡ Moderate — reasonable room for variable expenses')
                  : (l ? '⚠️ Alto — más del 50% de tu ingreso va a pagos fijos' : '⚠️ High — over 50% of income goes to fixed bills')}
            </p>
          </div>
        )}

        <Separator />

        {/* ═══ UPCOMING WITH PROJECTED BALANCE ═══ */}
        {analysis.topUpcoming.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              {l ? 'Próximos pagos y saldo proyectado' : 'Upcoming payments & projected balance'}
            </p>
            {analysis.topUpcoming.map((bill, i) => {
              const cat = BILL_CATEGORY_CONFIG[bill.category as BillCategory];
              const days = differenceInDays(parseISO(bill.next_due_date), now);
              const isToday = days === 0;
              const isTomorrow = days === 1;
              const balanceNegative = bill.balanceAfterPayment < 0;

              return (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    isToday ? 'bg-amber-500/10 border-amber-500/30' :
                    isTomorrow ? 'bg-amber-500/5 border-amber-500/15' :
                    'bg-muted/30 border-transparent'
                  }`}
                >
                  <span className="text-base">{cat?.icon || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate">{bill.name}</span>
                      {bill.auto_pay && (
                        <Badge variant="outline" className="text-[8px] h-3.5 px-1">
                          <Zap className="h-2 w-2 mr-0.5" />Auto
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>{format(parseISO(bill.next_due_date), 'dd MMM', { locale: l ? es : undefined })}</span>
                      <span>·</span>
                      <Badge variant={isToday ? 'default' : 'outline'} className="text-[9px] h-3.5 px-1">
                        {isToday ? (l ? '¡HOY!' : 'TODAY!') : isTomorrow ? (l ? 'Mañana' : 'Tomorrow') : `${days}d`}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold">-{formatCurrency(bill.amount)}</p>
                    <p className={`text-[9px] flex items-center gap-0.5 justify-end ${balanceNegative ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                      <BanknoteIcon className="h-2.5 w-2.5" />
                      {l ? 'Saldo:' : 'Bal:'} {formatCurrency(bill.balanceAfterPayment)}
                      {balanceNegative && ' ⚠️'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ═══ ALL PAID CELEBRATION ═══ */}
        {analysis.severity === 'perfect' && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-500 mb-1" />
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {l ? '¡Todos los pagos al día! 🎉' : 'All bills paid! 🎉'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {l ? `Próximo ciclo: ${formatCurrency(analysis.monthlyTotal)}` : `Next cycle: ${formatCurrency(analysis.monthlyTotal)}`}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}