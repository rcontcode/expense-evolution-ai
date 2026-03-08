import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { motion } from 'framer-motion';
import { parseISO, format, startOfYear, endOfYear, eachDayOfInterval, getDay, startOfWeek, addDays, getWeek, isSameDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, Flame, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayData {
  date: Date;
  dateStr: string;
  expenses: number;
  income: number;
  net: number;
  count: number;
}

const INTENSITY_COLORS = [
  'bg-muted/30',           // No activity
  'bg-emerald-200 dark:bg-emerald-900/60',   // Net positive (low)
  'bg-emerald-400 dark:bg-emerald-700/80',   // Net positive (high)
  'bg-amber-200 dark:bg-amber-900/60',       // Net negative (low)
  'bg-orange-300 dark:bg-orange-800/70',      // Net negative (medium)
  'bg-red-400 dark:bg-red-700/80',            // Net negative (high)
];

function getIntensityClass(day: DayData, maxExpense: number): string {
  if (day.count === 0) return INTENSITY_COLORS[0];
  if (day.net >= 0) return day.income > 0 ? INTENSITY_COLORS[2] : INTENSITY_COLORS[1];
  const ratio = Math.abs(day.expenses) / (maxExpense || 1);
  if (ratio > 0.6) return INTENSITY_COLORS[5];
  if (ratio > 0.3) return INTENSITY_COLORS[4];
  return INTENSITY_COLORS[3];
}

const MONTH_LABELS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTH_LABELS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS_ES = ['', 'L', '', 'M', '', 'V', ''];
const DAY_LABELS_EN = ['', 'M', '', 'W', '', 'F', ''];

export function MoneyCalendarHeatmap() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();

  const { grid, maxExpense, stats, monthPositions } = useMemo(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

    // Build lookup maps
    const expenseMap: Record<string, number> = {};
    const expenseCountMap: Record<string, number> = {};
    const incomeMap: Record<string, number> = {};

    (expenses || []).forEach((e: any) => {
      if (e.deleted_at) return;
      const d = e.date;
      const yr = parseInt(d.substring(0, 4));
      if (yr !== year) return;
      expenseMap[d] = (expenseMap[d] || 0) + Math.abs(Number(e.amount));
      expenseCountMap[d] = (expenseCountMap[d] || 0) + 1;
    });

    (income || []).forEach((i: any) => {
      const d = i.date;
      const yr = parseInt(d.substring(0, 4));
      if (yr !== year) return;
      incomeMap[d] = (incomeMap[d] || 0) + Math.abs(Number(i.amount));
    });

    let maxExp = 0;
    let totalExpenses = 0;
    let totalIncome = 0;
    let activeDays = 0;
    let streakCurrent = 0;
    let streakBest = 0;

    const dayData: DayData[] = allDays.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const exp = expenseMap[dateStr] || 0;
      const inc = incomeMap[dateStr] || 0;
      const count = (expenseCountMap[dateStr] || 0) + (inc > 0 ? 1 : 0);

      if (exp > maxExp) maxExp = exp;
      totalExpenses += exp;
      totalIncome += inc;
      if (count > 0) {
        activeDays++;
        streakCurrent++;
        if (streakCurrent > streakBest) streakBest = streakCurrent;
      } else {
        streakCurrent = 0;
      }

      return { date, dateStr, expenses: exp, income: inc, net: inc - exp, count };
    });

    // Build grid: 7 rows (days) x ~53 cols (weeks)
    const firstDay = yearStart;
    const startDow = getDay(firstDay); // 0=Sun
    const gridCells: (DayData | null)[][] = Array.from({ length: 7 }, () => []);
    const monthPos: { label: string; col: number }[] = [];
    let currentMonth = -1;

    // Pad first week
    for (let d = 0; d < startDow; d++) {
      gridCells[d].push(null);
    }

    dayData.forEach((day, idx) => {
      const dow = getDay(day.date);
      gridCells[dow].push(day);

      const month = day.date.getMonth();
      if (month !== currentMonth) {
        currentMonth = month;
        const col = gridCells[dow].length - 1;
        monthPos.push({
          label: l ? MONTH_LABELS_ES[month] : MONTH_LABELS_EN[month],
          col,
        });
      }
    });

    return {
      grid: gridCells,
      maxExpense: maxExp,
      stats: { totalExpenses, totalIncome, activeDays, bestStreak: streakBest },
      monthPositions: monthPos,
    };
  }, [expenses, income, year, l]);

  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" />
            {l ? 'Calendario Financiero' : 'Money Calendar'}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYear(y => y - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm font-semibold w-12 text-center">{year}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYear(y => y + 1)} disabled={year >= currentYear}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-muted-foreground">{l ? 'Mejor racha:' : 'Best streak:'}</span>
            <span className="font-bold">{stats.bestStreak} {l ? 'días' : 'days'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            <span className="text-muted-foreground">{l ? 'Gastos:' : 'Expenses:'}</span>
            <span className="font-bold">{fc(stats.totalExpenses)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground">{l ? 'Ingresos:' : 'Income:'}</span>
            <span className="font-bold">{fc(stats.totalIncome)}</span>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {stats.activeDays} {l ? 'días activos' : 'active days'}
          </Badge>
        </div>

        {/* Heatmap */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Month labels */}
            <div className="flex ml-6 mb-1">
              {monthPositions.map((mp, i) => (
                <div
                  key={i}
                  className="text-[9px] text-muted-foreground absolute"
                  style={{ marginLeft: `${mp.col * 13}px` }}
                >
                  {mp.label}
                </div>
              ))}
            </div>
            <div className="h-3" />

            {/* Grid */}
            <TooltipProvider delayDuration={100}>
              <div className="flex gap-0">
                {/* Day labels */}
                <div className="flex flex-col gap-[2px] mr-1 mt-0">
                  {(l ? DAY_LABELS_ES : DAY_LABELS_EN).map((label, i) => (
                    <div key={i} className="h-[11px] w-4 text-[8px] text-muted-foreground flex items-center justify-end pr-0.5">
                      {label}
                    </div>
                  ))}
                </div>

                {/* Cells */}
                <div className="flex flex-col gap-[2px]">
                  {grid.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex gap-[2px]">
                      {row.map((cell, colIdx) => {
                        if (!cell) {
                          return <div key={colIdx} className="w-[11px] h-[11px]" />;
                        }
                        const intensityClass = getIntensityClass(cell, maxExpense);
                        const isToday = isSameDay(cell.date, new Date());
                        return (
                          <Tooltip key={colIdx}>
                            <TooltipTrigger asChild>
                              <motion.div
                                className={cn(
                                  "w-[11px] h-[11px] rounded-[2px] cursor-pointer transition-all",
                                  intensityClass,
                                  isToday && "ring-1 ring-primary ring-offset-1 ring-offset-background",
                                  "hover:ring-1 hover:ring-foreground/30"
                                )}
                                whileHover={{ scale: 1.4 }}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs max-w-[200px]">
                              <p className="font-semibold">{format(cell.date, 'PP', { locale: l ? es : enUS })}</p>
                              {cell.count > 0 ? (
                                <div className="space-y-0.5 mt-1">
                                  {cell.expenses > 0 && <p className="text-destructive">↓ {fc(cell.expenses)}</p>}
                                  {cell.income > 0 && <p className="text-emerald-500">↑ {fc(cell.income)}</p>}
                                  <p className={cell.net >= 0 ? 'text-emerald-500 font-bold' : 'text-destructive font-bold'}>
                                    {l ? 'Neto:' : 'Net:'} {fc(cell.net)}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-muted-foreground">{l ? 'Sin actividad' : 'No activity'}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </TooltipProvider>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground pt-1">
          <span>{l ? 'Menos gasto' : 'Less spending'}</span>
          <div className="flex gap-[2px]">
            {INTENSITY_COLORS.map((c, i) => (
              <div key={i} className={cn("w-[10px] h-[10px] rounded-[2px]", c)} />
            ))}
          </div>
          <span>{l ? 'Más gasto' : 'More spending'}</span>
          <span className="ml-2">🟢 = {l ? 'Ingreso neto positivo' : 'Net income positive'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
