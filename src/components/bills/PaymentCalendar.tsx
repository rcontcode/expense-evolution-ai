import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills, type RecurringBill } from '@/hooks/data/useRecurringBills';
import { BILL_CATEGORY_CONFIG, type BillCategory } from '@/lib/constants/bill-categories';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO, isToday, isBefore, addMonths, subMonths, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function PaymentCalendar() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency } = useFormatCurrency();
  const { data: bills } = useRecurringBills();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const now = new Date();
  const isCurrentMonth = isSameMonth(currentMonth, now);

  // Map bills to their due dates within the selected month
  const billsByDay = useMemo(() => {
    const map = new Map<string, RecurringBill[]>();
    if (!bills) return map;
    bills.filter(b => b.status === 'active').forEach(bill => {
      const dueDate = parseISO(bill.next_due_date);
      if (dueDate >= monthStart && dueDate <= monthEnd) {
        const key = format(dueDate, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(bill);
      }
    });
    return map;
  }, [bills, monthStart, monthEnd]);

  const monthTotal = useMemo(() => {
    let total = 0;
    billsByDay.forEach(dayBills => {
      dayBills.forEach(b => { total += Number(b.amount); });
    });
    return total;
  }, [billsByDay]);

  const dayNames = l
    ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const startDay = (monthStart.getDay() + 6) % 7;
  const paddedDays = [...Array(startDay).fill(null), ...days];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-base flex items-center gap-2">
              📅 {format(currentMonth, 'MMMM yyyy', { locale: l ? es : undefined })}
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isCurrentMonth && (
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setCurrentMonth(new Date())}>
                {l ? 'Hoy' : 'Today'}
              </Button>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {l ? 'Total:' : 'Total:'} {formatCurrency(monthTotal)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {paddedDays.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} />;
            const key = format(day, 'yyyy-MM-dd');
            const dayBills = billsByDay.get(key) || [];
            const hasOverdue = dayBills.some(b => isBefore(parseISO(b.next_due_date), now) && !b.last_paid_date);
            const dayTotal = dayBills.reduce((s, b) => s + Number(b.amount), 0);

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.008 }}
                className={cn(
                  'relative rounded-md border p-1 min-h-[60px] text-xs transition-all',
                  isToday(day) && 'ring-2 ring-primary bg-primary/5',
                  dayBills.length > 0 && !hasOverdue && 'bg-amber-500/5 border-amber-500/20',
                  hasOverdue && 'bg-destructive/5 border-destructive/30',
                  isBefore(day, now) && !isToday(day) && dayBills.length === 0 && 'opacity-50'
                )}
              >
                <div className={cn(
                  'font-medium mb-0.5',
                  isToday(day) && 'text-primary font-bold'
                )}>
                  {format(day, 'd')}
                </div>
                {dayBills.slice(0, 2).map(bill => {
                  const cfg = BILL_CATEGORY_CONFIG[bill.category as BillCategory];
                  return (
                    <div
                      key={bill.id}
                      className="truncate text-[10px] leading-tight"
                      title={`${bill.name}: ${formatCurrency(bill.amount)}`}
                    >
                      {cfg?.icon} {bill.name}
                    </div>
                  );
                })}
                {dayBills.length > 2 && (
                  <div className="text-[10px] text-muted-foreground">+{dayBills.length - 2}</div>
                )}
                {dayTotal > 0 && (
                  <div className="absolute bottom-0.5 right-1 text-[9px] font-semibold text-amber-600">
                    {formatCurrency(dayTotal)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
