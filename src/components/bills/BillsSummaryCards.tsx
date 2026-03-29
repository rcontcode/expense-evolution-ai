import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useIncomeSummary } from '@/hooks/data/useIncome';
import { BILL_CATEGORY_CONFIG, type BillCategory, getMonthlyEquivalent } from '@/lib/constants/bill-categories';
import { differenceInDays, parseISO, startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Wallet, TrendingUp, AlertTriangle, CheckCircle, Zap, Clock, CalendarDays, DollarSign, ShieldCheck } from 'lucide-react';

interface BillsSummaryCardsProps {
  selectedMonth: Date;
}

export function BillsSummaryCards({ selectedMonth }: BillsSummaryCardsProps) {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency } = useFormatCurrency();
  const { data: bills } = useRecurringBills();
  const { data: incomeSummary } = useIncomeSummary();

  const now = new Date();
  const monthInterval = { start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) };

  const stats = useMemo(() => {
    if (!bills || bills.length === 0)
      return {
        monthlyTotal: 0, annualTotal: 0, dailyCost: 0,
        overdue: 0, dueSoon: 0, totalBills: 0,
        autopayCount: 0, autopayTotal: 0,
        paidThisMonth: 0, totalThisMonth: 0,
        nextBillName: '', nextBillDays: 0, nextBillAmount: 0,
        byCategory: {} as Record<string, number>,
        incomeRatio: 0,
      };

    const active = bills.filter(b => b.status === 'active');

    let monthlyTotal = 0;
    let overdue = 0;
    let dueSoon = 0;
    let autopayCount = 0;
    let autopayTotal = 0;
    const byCategory: Record<string, number> = {};

    active.forEach(b => {
      const monthly = getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined);
      monthlyTotal += monthly;
      byCategory[b.category] = (byCategory[b.category] || 0) + monthly;

      if (b.auto_pay) {
        autopayCount++;
        autopayTotal += monthly;
      }

      const days = differenceInDays(parseISO(b.next_due_date), now);
      if (days < 0) overdue++;
      else if (days <= 7) dueSoon++;
    });

    // Monthly payment progress
    const thisMonthBills = active.filter(b =>
      isWithinInterval(parseISO(b.next_due_date), monthInterval)
    );
    const paidThisMonth = thisMonthBills.filter(b => {
      if (!b.last_paid_date) return false;
      return isWithinInterval(parseISO(b.last_paid_date), monthInterval);
    }).length;

    // Next bill
    const nextBill = active
      .filter(b => differenceInDays(parseISO(b.next_due_date), now) >= 0)
      .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))[0];
    const nextBillDays = nextBill ? differenceInDays(parseISO(nextBill.next_due_date), now) : 0;

    // Income ratio
    const currentMonthKey = format(now, 'yyyy-MM');
    const monthKeys = Object.keys(incomeSummary?.byMonth || {}).sort().slice(-6);
    const avgIncome = monthKeys.length > 0
      ? monthKeys.reduce((s, k) => s + (incomeSummary?.byMonth?.[k] || 0), 0) / monthKeys.length
      : incomeSummary?.byMonth?.[currentMonthKey] || 0;
    const incomeRatio = avgIncome > 0 ? (monthlyTotal / avgIncome) * 100 : 0;

    return {
      monthlyTotal,
      annualTotal: monthlyTotal * 12,
      dailyCost: monthlyTotal / 30,
      overdue,
      dueSoon,
      totalBills: active.length,
      autopayCount,
      autopayTotal,
      paidThisMonth,
      totalThisMonth: thisMonthBills.length,
      nextBillName: nextBill?.name || '',
      nextBillDays,
      nextBillAmount: nextBill ? Number(nextBill.amount) : 0,
      byCategory,
      incomeRatio,
    };
  }, [bills, incomeSummary]);

  const summaryCards = [
    {
      icon: <Wallet className="h-5 w-5" />,
      label: l ? 'Gasto Mensual Fijo' : 'Fixed Monthly Cost',
      value: formatCurrency(stats.monthlyTotal),
      sub: `${formatCurrency(stats.annualTotal)}/${l ? 'año' : 'yr'} · ${formatCurrency(stats.dailyCost)}/${l ? 'día' : 'day'}`,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: l ? 'Pagos Activos' : 'Active Bills',
      value: stats.totalBills.toString(),
      sub: `${stats.autopayCount} ${l ? 'automáticos' : 'autopay'} · ${stats.totalBills - stats.autopayCount} ${l ? 'manuales' : 'manual'}`,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: stats.overdue > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />,
      label: l ? 'Estado del Mes' : 'Month Status',
      value: `${stats.paidThisMonth}/${stats.totalThisMonth}`,
      sub: stats.overdue > 0
        ? `🚨 ${stats.overdue} ${l ? 'vencidos' : 'overdue'}`
        : stats.dueSoon > 0
          ? `⏰ ${stats.dueSoon} ${l ? 'próximos' : 'due soon'}`
          : (l ? '✅ Al día' : '✅ On track'),
      color: stats.overdue > 0 ? 'text-destructive' : stats.dueSoon > 0 ? 'text-amber-500' : 'text-emerald-500',
      bg: stats.overdue > 0 ? 'bg-destructive/10' : stats.dueSoon > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: l ? 'Próximo Pago' : 'Next Payment',
      value: stats.nextBillDays === 0 ? (l ? '¡Hoy!' : 'Today!') : `${stats.nextBillDays}d`,
      sub: stats.nextBillName
        ? `${stats.nextBillName} · ${formatCurrency(stats.nextBillAmount)}`
        : (l ? 'Sin pagos pendientes' : 'No pending payments'),
      color: stats.nextBillDays <= 2 ? 'text-amber-500' : 'text-muted-foreground',
      bg: stats.nextBillDays <= 2 ? 'bg-amber-500/10' : 'bg-muted/50',
    },
  ];

  // Top categories
  const topCats = Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}>
            <Card className="overflow-hidden h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${card.bg} ${card.color} shrink-0`}>{card.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-lg font-bold leading-tight">{card.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{card.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Income ratio + Autopay coverage row */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {l ? '% del Ingreso' : '% of Income'}
              </span>
              <Badge variant={stats.incomeRatio < 50 ? 'default' : stats.incomeRatio < 70 ? 'secondary' : 'destructive'} className="text-[10px] h-5">
                {stats.incomeRatio.toFixed(0)}%
              </Badge>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(stats.incomeRatio, 100)}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${stats.incomeRatio < 50 ? 'bg-emerald-500' : stats.incomeRatio < 70 ? 'bg-amber-500' : 'bg-destructive'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {l ? 'Cobertura Autopay' : 'Autopay Coverage'}
              </span>
              <Badge variant="outline" className="text-[10px] h-5">
                {stats.autopayCount}/{stats.totalBills}
              </Badge>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div initial={{ width: 0 }}
                animate={{ width: `${stats.totalBills > 0 ? (stats.autopayCount / stats.totalBills) * 100 : 0}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      {topCats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{l ? 'Distribución por Categoría' : 'Category Breakdown'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topCats.map(([cat, amount]) => {
              const cfg = BILL_CATEGORY_CONFIG[cat as BillCategory];
              const pct = stats.monthlyTotal > 0 ? (amount / stats.monthlyTotal) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{cfg?.icon || '📋'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>{cfg?.[l ? 'es' : 'en'] || cat}</span>
                      <div className="text-right">
                        <span className="font-medium">{formatCurrency(amount)}<span className="text-xs text-muted-foreground">/{l ? 'mes' : 'mo'}</span></span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
                        className="h-full rounded-full" style={{ backgroundColor: cfg?.color || 'hsl(var(--primary))' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
