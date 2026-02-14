import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { BILL_CATEGORY_CONFIG, BILL_PRIORITIES, type BillCategory, getMonthlyEquivalent } from '@/lib/constants/bill-categories';
import { differenceInDays, parseISO } from 'date-fns';
import { Wallet, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export function BillsSummaryCards() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency } = useFormatCurrency();
  const { data: bills } = useRecurringBills();

  const stats = useMemo(() => {
    if (!bills || bills.length === 0)
      return { monthlyTotal: 0, overdue: 0, dueSoon: 0, totalBills: 0, byCategory: {} as Record<string, number> };

    const active = bills.filter(b => b.status === 'active');
    const now = new Date();

    let monthlyTotal = 0;
    let overdue = 0;
    let dueSoon = 0;
    const byCategory: Record<string, number> = {};

    active.forEach(b => {
      const monthly = getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined);
      monthlyTotal += monthly;
      byCategory[b.category] = (byCategory[b.category] || 0) + monthly;

      const days = differenceInDays(parseISO(b.next_due_date), now);
      if (days < 0) overdue++;
      else if (days <= 7) dueSoon++;
    });

    return { monthlyTotal, overdue, dueSoon, totalBills: active.length, byCategory };
  }, [bills]);

  const summaryCards = [
    {
      icon: <Wallet className="h-5 w-5" />,
      label: l ? 'Gasto Mensual Fijo' : 'Fixed Monthly Cost',
      value: formatCurrency(stats.monthlyTotal),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: l ? 'Pagos Activos' : 'Active Bills',
      value: stats.totalBills.toString(),
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      label: l ? 'Vencidos' : 'Overdue',
      value: stats.overdue.toString(),
      color: stats.overdue > 0 ? 'text-destructive' : 'text-green-500',
      bg: stats.overdue > 0 ? 'bg-destructive/10' : 'bg-green-500/10',
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      label: l ? 'Próximos (7d)' : 'Due Soon (7d)',
      value: stats.dueSoon.toString(),
      color: stats.dueSoon > 0 ? 'text-orange-500' : 'text-muted-foreground',
      bg: stats.dueSoon > 0 ? 'bg-orange-500/10' : 'bg-muted/50',
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
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>{card.icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-lg font-bold">{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
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
                      <span className="font-medium">{formatCurrency(amount)}<span className="text-xs text-muted-foreground">/{l ? 'mes' : 'mo'}</span></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cfg?.color || 'hsl(var(--primary))' }}
                      />
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
