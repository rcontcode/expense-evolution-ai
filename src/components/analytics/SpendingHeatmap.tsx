import { memo, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subMonths,
  addMonths,
  isSameDay,
  isToday,
} from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string | null;
}

interface SpendingHeatmapProps {
  expenses: Expense[];
  isLoading?: boolean;
}

const DAY_LABELS = {
  es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

export const SpendingHeatmap = memo(({ expenses, isLoading }: SpendingHeatmapProps) => {
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Monday-based: 0=Mon...6=Sun
  const getMonOffset = (date: Date) => {
    const d = getDay(date); // 0=Sun
    return d === 0 ? 6 : d - 1;
  };

  const startOffset = getMonOffset(monthStart);

  const { dailyTotals, maxDaily, monthTotal, dayCount } = useMemo(() => {
    const totals: Record<string, { total: number; expenses: Expense[] }> = {};
    let monthTotal = 0;
    let dayCount = 0;

    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      if (d >= monthStart && d <= monthEnd) {
        const key = format(d, 'yyyy-MM-dd');
        if (!totals[key]) totals[key] = { total: 0, expenses: [] };
        totals[key].total += exp.amount;
        totals[key].expenses.push(exp);
        monthTotal += exp.amount;
      }
    });

    dayCount = Object.keys(totals).length;
    const maxDaily = Math.max(...Object.values(totals).map((t) => t.total), 1);

    return { dailyTotals: totals, maxDaily, monthTotal, dayCount };
  }, [expenses, monthStart, monthEnd]);

  const getIntensityClass = (amount: number) => {
    if (amount === 0) return '';
    const ratio = amount / maxDaily;
    if (ratio < 0.15) return 'bg-emerald-500/20 dark:bg-emerald-500/25';
    if (ratio < 0.3) return 'bg-emerald-500/35 dark:bg-emerald-500/40';
    if (ratio < 0.5) return 'bg-amber-500/35 dark:bg-amber-500/40';
    if (ratio < 0.75) return 'bg-orange-500/40 dark:bg-orange-500/45';
    return 'bg-red-500/50 dark:bg-red-500/55';
  };

  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null;
    const key = format(selectedDay, 'yyyy-MM-dd');
    return dailyTotals[key] || null;
  }, [selectedDay, dailyTotals]);

  const dayLabels = DAY_LABELS[language] || DAY_LABELS.es;

  const { formatCompact: formatCurrency } = useFormatCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-muted animate-pulse" />
            <div className="h-5 w-40 bg-muted animate-pulse rounded" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/30 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5" />
            {language === 'es' ? 'Calendario de Gastos' : 'Spending Calendar'}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold capitalize min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale })}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Month summary */}
        <div className="flex gap-3">
          <div className="flex-1 p-2 rounded-lg bg-muted/40 text-center">
            <p className="text-[10px] text-muted-foreground">{language === 'es' ? 'Total mes' : 'Month total'}</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(monthTotal)}</p>
          </div>
          <div className="flex-1 p-2 rounded-lg bg-muted/40 text-center">
            <p className="text-[10px] text-muted-foreground">{language === 'es' ? 'Días con gasto' : 'Days with spending'}</p>
            <p className="text-sm font-bold text-foreground">{dayCount} / {daysInMonth.length}</p>
          </div>
          <div className="flex-1 p-2 rounded-lg bg-muted/40 text-center">
            <p className="text-[10px] text-muted-foreground">{language === 'es' ? 'Promedio diario' : 'Daily avg'}</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(dayCount > 0 ? monthTotal / dayCount : 0)}</p>
          </div>
        </div>

        {/* Calendar grid */}
        <div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayLabels.map((d) => (
              <div key={d} className="text-[10px] font-medium text-muted-foreground text-center py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty offset cells */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {daysInMonth.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const data = dailyTotals[key];
              const amount = data?.total || 0;
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const today = isToday(day);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    'aspect-square rounded-md flex flex-col items-center justify-center p-0.5 transition-all duration-150 relative',
                    'border border-transparent',
                    'hover:border-primary/40 active:scale-95',
                    amount > 0 ? getIntensityClass(amount) : 'bg-muted/20',
                    isSelected && 'ring-2 ring-primary border-primary',
                    today && !isSelected && 'border-primary/30',
                  )}
                >
                  <span className={cn(
                    'text-[10px] leading-none',
                    today ? 'font-bold text-primary' : 'text-muted-foreground',
                    amount > 0 && 'text-foreground font-medium',
                  )}>
                    {format(day, 'd')}
                  </span>
                  {amount > 0 && (
                    <span className="text-[8px] font-semibold text-foreground leading-none mt-0.5 truncate w-full text-center">
                      ${amount >= 1000 ? `${(amount / 1000).toFixed(0)}K` : amount.toFixed(0)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold capitalize">
                    {format(selectedDay, 'EEEE d MMMM', { locale })}
                  </p>
                  {selectedDayData && (
                    <Badge variant="secondary" className="text-xs font-bold">
                      {formatCurrency(selectedDayData.total)}
                    </Badge>
                  )}
                </div>
                {selectedDayData && selectedDayData.expenses.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedDayData.expenses
                      .sort((a, b) => b.amount - a.amount)
                      .map((exp) => (
                        <div key={exp.id} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                          <span className="text-muted-foreground truncate flex-1 mr-2">
                            {exp.category
                              ? (language === 'es' ? exp.category : exp.category).replace(/_/g, ' ')
                              : (language === 'es' ? 'Sin categoría' : 'Uncategorized')}
                          </span>
                          <span className="font-semibold text-foreground shrink-0">{formatCurrency(exp.amount)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Sin gastos este día' : 'No expenses this day'}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            {language === 'es' ? 'Toca un día para ver detalles' : 'Tap a day for details'}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{language === 'es' ? 'Menos' : 'Less'}</span>
            <div className="w-3 h-3 rounded-sm bg-muted/20 border border-border/30" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500/25" />
            <div className="w-3 h-3 rounded-sm bg-amber-500/35" />
            <div className="w-3 h-3 rounded-sm bg-orange-500/40" />
            <div className="w-3 h-3 rounded-sm bg-red-500/50" />
            <span className="text-[10px] text-muted-foreground">{language === 'es' ? 'Más' : 'More'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SpendingHeatmap.displayName = 'SpendingHeatmap';
