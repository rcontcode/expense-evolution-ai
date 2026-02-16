import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useExpenses } from "@/hooks/data/useExpenses";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { startOfMonth, endOfMonth, subMonths, subYears, format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function YearComparisonChart() {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();
  const now = new Date();

  // Get last 6 months of current year and same months last year
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return {
      month: d.getMonth(),
      year: d.getFullYear(),
      label: format(d, "MMM", { locale: l ? es : enUS }),
      start: startOfMonth(d),
      end: endOfMonth(d),
      prevStart: startOfMonth(subYears(d, 1)),
      prevEnd: endOfMonth(subYears(d, 1)),
    };
  });

  const overallStart = months[0].prevStart;
  const overallEnd = months[months.length - 1].end;
  const { data: allExpenses } = useExpenses({ dateRange: { start: overallStart, end: overallEnd } });

  const chartData = useMemo(() => {
    if (!allExpenses) return [];
    const familyExp = allExpenses.filter(e => !e.entity_id);

    return months.map(m => {
      const thisYear = familyExp
        .filter(e => {
          const d = new Date(e.date);
          return d >= m.start && d <= m.end;
        })
        .reduce((s, e) => s + Number(e.amount), 0);

      const lastYear = familyExp
        .filter(e => {
          const d = new Date(e.date);
          return d >= m.prevStart && d <= m.prevEnd;
        })
        .reduce((s, e) => s + Number(e.amount), 0);

      return {
        name: m.label,
        thisYear,
        lastYear,
        change: lastYear > 0 ? ((thisYear - lastYear) / lastYear) * 100 : 0,
      };
    });
  }, [allExpenses, months]);

  const totalThis = chartData.reduce((s, d) => s + d.thisYear, 0);
  const totalLast = chartData.reduce((s, d) => s + d.lastYear, 0);
  const overallChange = totalLast > 0 ? ((totalThis - totalLast) / totalLast) * 100 : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-2.5 shadow-lg text-xs">
        <p className="font-medium mb-1">{d.name}</p>
        <p>{l ? "Este año" : "This year"}: <strong>{fc(d.thisYear)}</strong></p>
        <p>{l ? "Año anterior" : "Last year"}: <strong>{fc(d.lastYear)}</strong></p>
        {d.lastYear > 0 && (
          <p className={cn(d.change > 0 ? "text-red-500" : "text-emerald-500", "font-semibold")}>
            {d.change > 0 ? "+" : ""}{d.change.toFixed(0)}%
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {l
          ? '📊 Compara tus gastos de los últimos 6 meses contra el mismo período del año anterior. El porcentaje indica si estás gastando más (+) o menos (-) que antes.'
          : '📊 Compare your spending for the last 6 months against the same period last year. The percentage shows if you\'re spending more (+) or less (-) than before.'}
      </p>
      {/* Summary */}
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
        <div className="text-xs text-muted-foreground">
          {l ? "Variación 6 meses" : "6-month change"}
        </div>
        <div className={cn("flex items-center gap-1 text-sm font-semibold",
          overallChange > 5 ? "text-red-500" : overallChange < -5 ? "text-emerald-500" : "text-muted-foreground"
        )}>
          {overallChange > 5 ? <TrendingUp className="h-3.5 w-3.5" /> :
           overallChange < -5 ? <TrendingDown className="h-3.5 w-3.5" /> :
           <Minus className="h-3.5 w-3.5" />}
          {overallChange > 0 ? "+" : ""}{overallChange.toFixed(0)}%
        </div>
      </div>

      {/* Chart */}
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={45} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="lastYear" fill="hsl(var(--muted))" radius={[2, 2, 0, 0]} barSize={12} name={l ? "Año anterior" : "Last year"} />
            <Bar dataKey="thisYear" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} barSize={12} name={l ? "Este año" : "This year"} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-muted" /> {l ? "Año anterior" : "Last year"}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary" /> {l ? "Este año" : "This year"}</span>
      </div>
    </div>
  );
}
