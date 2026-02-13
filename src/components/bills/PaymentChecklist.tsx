import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills, useMarkBillPaid, type RecurringBill } from '@/hooks/data/useRecurringBills';
import { BILL_CATEGORY_CONFIG, type BillCategory } from '@/lib/constants/bill-categories';
import { parseISO, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export function PaymentChecklist() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency } = useFormatCurrency();
  const { data: bills } = useRecurringBills();
  const markPaid = useMarkBillPaid();

  const now = new Date();
  const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) };

  // Bills due this month
  const thisMonthBills = useMemo(() => {
    if (!bills) return [];
    return bills
      .filter(b => b.status === 'active' && isWithinInterval(parseISO(b.next_due_date), monthInterval))
      .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
  }, [bills]);

  const paidCount = thisMonthBills.filter(b => {
    if (!b.last_paid_date) return false;
    const lp = parseISO(b.last_paid_date);
    return isWithinInterval(lp, monthInterval);
  }).length;

  const totalDue = thisMonthBills.reduce((s, b) => s + Number(b.amount), 0);
  const paidAmount = thisMonthBills
    .filter(b => {
      if (!b.last_paid_date) return false;
      return isWithinInterval(parseISO(b.last_paid_date), monthInterval);
    })
    .reduce((s, b) => s + Number(b.amount), 0);

  const progress = thisMonthBills.length > 0 ? (paidCount / thisMonthBills.length) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            ✅ {l ? 'Checklist del Mes' : 'Monthly Checklist'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {paidCount}/{thisMonthBills.length}
            </Badge>
            <Badge variant={progress === 100 ? 'default' : 'secondary'} className="text-xs">
              {formatCurrency(paidAmount)} / {formatCurrency(totalDue)}
            </Badge>
          </div>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-1">
        {thisMonthBills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {l ? 'No hay pagos este mes 🎉' : 'No bills this month 🎉'}
          </p>
        ) : (
          thisMonthBills.map((bill, i) => {
            const isPaid = bill.last_paid_date && isWithinInterval(parseISO(bill.last_paid_date), monthInterval);
            const cat = BILL_CATEGORY_CONFIG[bill.category as BillCategory];

            return (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${isPaid ? 'opacity-60 bg-green-500/5 border-green-500/20' : 'hover:bg-muted/50'}`}
              >
                <Checkbox
                  checked={!!isPaid}
                  onCheckedChange={() => {
                    if (!isPaid) markPaid.mutate({ billId: bill.id, amount: bill.amount });
                  }}
                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <span className="text-lg">{cat?.icon || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${isPaid ? 'line-through' : ''}`}>{bill.name}</span>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(bill.next_due_date), 'dd MMM', { locale: l ? es : undefined })}
                  </div>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(bill.amount)}</span>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
