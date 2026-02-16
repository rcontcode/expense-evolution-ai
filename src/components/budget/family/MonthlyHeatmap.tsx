import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { cn } from "@/lib/utils";
import { startOfMonth, endOfMonth, getDay, getDaysInMonth, format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DayData {
  day: number;
  spent: number;
}

interface MonthlyHeatmapProps {
  data: DayData[];
  dailyBudget: number;
  currentDay: number;
}

export function MonthlyHeatmap({ data, dailyBudget, currentDay }: MonthlyHeatmapProps) {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();

  const now = new Date();
  const totalDays = getDaysInMonth(now);
  const firstDayOfWeek = getDay(startOfMonth(now)); // 0=Sun

  const dayLabels = l ? ["L", "M", "X", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"];

  const maxSpent = Math.max(...data.map(d => d.spent), dailyBudget || 1);

  const getIntensity = (spent: number) => {
    if (spent === 0) return "bg-muted/30";
    const ratio = spent / maxSpent;
    if (ratio <= 0.25) return "bg-emerald-400/40 dark:bg-emerald-500/30";
    if (ratio <= 0.5) return "bg-emerald-500/60 dark:bg-emerald-500/50";
    if (ratio <= 0.75) return "bg-amber-400/60 dark:bg-amber-500/50";
    if (ratio <= 1) return "bg-amber-500/80 dark:bg-amber-500/70";
    return "bg-red-500/80 dark:bg-red-500/70";
  };

  // Build grid: 7 columns (Mon-Sun), adjust for first day offset
  // Convert Sunday=0 to Monday-first: Mon=0, Tue=1, ..., Sun=6
  const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const cells: (DayData & { dayNum: number } | null)[] = [];
  for (let i = 0; i < mondayOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const dayData = data.find(dd => dd.day === d);
    cells.push({ dayNum: d, day: d, spent: dayData?.spent || 0 });
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-2">
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground justify-between">
          <span>{format(now, "MMMM yyyy", { locale: l ? es : enUS })}</span>
          <div className="flex items-center gap-1">
            <span>{l ? "Poco" : "Low"}</span>
            <div className="w-3 h-3 rounded-sm bg-emerald-400/40" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
            <div className="w-3 h-3 rounded-sm bg-amber-400/60" />
            <div className="w-3 h-3 rounded-sm bg-amber-500/80" />
            <div className="w-3 h-3 rounded-sm bg-red-500/80" />
            <span>{l ? "Mucho" : "High"}</span>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1">
          {dayLabels.map((d, i) => (
            <div key={i} className="text-[9px] text-muted-foreground text-center font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((cell, ci) => {
                if (!cell) return <div key={ci} className="aspect-square" />;
                const isFuture = cell.dayNum > currentDay;
                const isToday = cell.dayNum === currentDay;
                return (
                  <Tooltip key={ci}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "aspect-square rounded-sm flex items-center justify-center text-[9px] font-medium transition-all cursor-default",
                          isFuture
                            ? "bg-muted/20 text-muted-foreground/40"
                            : getIntensity(cell.spent),
                          isToday && "ring-1 ring-primary ring-offset-1 ring-offset-background",
                          !isFuture && cell.spent > 0 && "text-foreground/80"
                        )}
                      >
                        {cell.dayNum}
                      </div>
                    </TooltipTrigger>
                    {!isFuture && (
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-semibold">{format(new Date(now.getFullYear(), now.getMonth(), cell.dayNum), "EEEE d", { locale: l ? es : enUS })}</p>
                        <p>{fc(cell.spent)}</p>
                        {dailyBudget > 0 && (
                          <p className={cn(
                            "text-[10px]",
                            cell.spent <= dailyBudget ? "text-emerald-500" : "text-red-500"
                          )}>
                            {cell.spent <= dailyBudget
                              ? `✅ ${l ? "Dentro del límite" : "Within budget"}`
                              : `⚠️ ${l ? "Sobre el límite" : "Over budget"} (+${fc(cell.spent - dailyBudget)})`
                            }
                          </p>
                        )}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
