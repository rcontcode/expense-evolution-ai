import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { BILL_CATEGORY_CONFIG, type BillCategory, getMonthlyEquivalent } from '@/lib/constants/bill-categories';
import { differenceInDays, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Receipt, AlertTriangle, CheckCircle2, ArrowRight, Wallet, TrendingDown } from 'lucide-react';
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
    const netAfterBills = monthlyIncome - monthlyTotal;

    const paidAmount = paidThisMonth.reduce((s, b) => s + Number(b.amount), 0);
    const pendingAmount = thisMonth.reduce((s, b) => s + Number(b.amount), 0) - paidAmount;
    const progress = thisMonth.length > 0 ? (paidThisMonth.length / thisMonth.length) * 100 : 0;

    return {
      monthlyTotal,
      monthlyIncome,
      netAfterBills,
      totalThisMonth: thisMonth.length,
      paidCount: paidThisMonth.length,
      overdueCount: overdue.length,
      dueSoonCount: dueSoon.length,
      paidAmount,
      pendingAmount,
      progress,
      topUpcoming: dueSoon.slice(0, 3),
      topOverdue: overdue.slice(0, 2),
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

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            {l ? 'Pagos del Mes' : 'Monthly Bills'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-primary"
            onClick={() => navigate('/budget?tab=bills')}
          >
            {l ? 'Ver todo' : 'View all'}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {analysis.paidCount}/{analysis.totalThisMonth} {l ? 'pagados' : 'paid'}
            </span>
            <span className="font-medium">
              {formatCurrency(analysis.paidAmount)} / {formatCurrency(analysis.paidAmount + analysis.pendingAmount)}
            </span>
          </div>
          <Progress value={analysis.progress} className="h-2" />
        </div>

        {/* Net balance compact */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
            <p className="text-[10px] text-muted-foreground">{l ? 'Ingreso' : 'Income'}</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(analysis.monthlyIncome)}
            </p>
          </div>
          <div className={`p-2 rounded-lg text-center ${analysis.netAfterBills >= 0 ? 'bg-blue-500/10' : 'bg-destructive/10'}`}>
            <p className="text-[10px] text-muted-foreground">{l ? 'Después de pagos' : 'After bills'}</p>
            <p className={`text-sm font-bold ${analysis.netAfterBills >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-destructive'}`}>
              {formatCurrency(analysis.netAfterBills)}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {analysis.overdueCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20"
          >
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-destructive">
                {analysis.overdueCount} {l ? 'pago(s) vencido(s)' : 'overdue payment(s)'}
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
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2 py-1"
                >
                  <span className="text-sm">{cat?.icon || '📋'}</span>
                  <span className="text-xs flex-1 truncate">{bill.name}</span>
                  <Badge variant="outline" className="text-[10px] h-4 shrink-0">
                    {days === 0 ? (l ? 'Hoy' : 'Today') : `${days}d`}
                  </Badge>
                  <span className="text-xs font-semibold">{formatCurrency(bill.amount)}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* All paid celebration */}
        {analysis.progress === 100 && analysis.totalThisMonth > 0 && (
          <div className="text-center py-2">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {l ? '¡Todos los pagos del mes están al día! 🎉' : 'All monthly bills are paid! 🎉'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
