import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills, useMarkBillPaid, type RecurringBill } from '@/hooks/data/useRecurringBills';
import { BILL_CATEGORY_CONFIG, type BillCategory, getBillFrequencyLabel } from '@/lib/constants/bill-categories';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type KanbanStatus = 'overdue' | 'due_soon' | 'upcoming' | 'paid';

const COLUMNS: Record<KanbanStatus, { es: string; en: string; color: string }> = {
  overdue:  { es: '⚠️ Vencidos',     en: '⚠️ Overdue',     color: 'border-t-destructive' },
  due_soon: { es: '⏰ Próximos (7d)', en: '⏰ Due Soon (7d)', color: 'border-t-orange-500' },
  upcoming: { es: '📅 Por Venir',     en: '📅 Upcoming',     color: 'border-t-blue-500' },
  paid:     { es: '✅ Pagados',       en: '✅ Paid',         color: 'border-t-green-500' },
};

export function BillsKanban() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency } = useFormatCurrency();
  const { data: bills } = useRecurringBills();
  const markPaid = useMarkBillPaid();

  const columns = useMemo(() => {
    const cols: Record<KanbanStatus, RecurringBill[]> = {
      overdue: [], due_soon: [], upcoming: [], paid: [],
    };
    if (!bills) return cols;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    bills.filter(b => b.status === 'active').forEach(bill => {
      const due = parseISO(bill.next_due_date);
      const days = differenceInDays(due, now);
      const lastPaid = bill.last_paid_date ? parseISO(bill.last_paid_date) : null;
      const paidThisMonth = lastPaid && lastPaid.getMonth() === thisMonth && lastPaid.getFullYear() === thisYear;

      if (paidThisMonth && days > 7) {
        cols.paid.push(bill);
      } else if (days < 0) {
        cols.overdue.push(bill);
      } else if (days <= 7) {
        cols.due_soon.push(bill);
      } else {
        cols.upcoming.push(bill);
      }
    });
    return cols;
  }, [bills]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {(Object.entries(COLUMNS) as [KanbanStatus, typeof COLUMNS[KanbanStatus]][]).map(([status, cfg]) => (
        <Card key={status} className={cn('border-t-4', cfg.color)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              {cfg[l ? 'es' : 'en']}
              <Badge variant="secondary" className="text-xs">{columns[status].length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[120px]">
            <AnimatePresence>
              {columns[status].length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {l ? 'Sin pagos' : 'No bills'}
                </p>
              ) : (
                columns[status].map(bill => {
                  const cat = BILL_CATEGORY_CONFIG[bill.category as BillCategory];
                  const days = differenceInDays(parseISO(bill.next_due_date), new Date());
                  return (
                    <motion.div
                      key={bill.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="p-2.5 rounded-lg border bg-background/50 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          {cat?.icon} {bill.name}
                        </span>
                        {status !== 'paid' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-600 hover:bg-green-500/10"
                            onClick={() => markPaid.mutate({ billId: bill.id, amount: bill.amount })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{formatCurrency(bill.amount)}</span>
                        <span>{format(parseISO(bill.next_due_date), 'dd MMM', { locale: l ? es : undefined })}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {getBillFrequencyLabel(bill.frequency, l ? 'es' : 'en')}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
