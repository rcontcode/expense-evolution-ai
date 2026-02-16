import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useIncome } from "@/hooks/data/useIncome";
import { useBudgetEntity } from "@/contexts/BudgetEntityContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export function MonthComparisonChart() {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc, formatCompact } = useFormatCurrency();
  const locale = l ? es : enUS;
  const entityId = useBudgetEntity();

  const now = new Date();
  const months = [2, 1, 0].map(i => {
    const d = subMonths(now, i);
    return {
      start: startOfMonth(d),
      end: endOfMonth(d),
      label: format(d, "MMM", { locale }),
      isCurrent: i === 0,
    };
  });

  // Filter by entity when in separated mode
  const entityFilter = entityId !== undefined ? { entityId: entityId ?? undefined, showAllEntities: entityId === undefined } : {};

  const { data: exp0 } = useExpenses({ dateRange: { start: months[0].start, end: months[0].end }, ...entityFilter });
  const { data: exp1 } = useExpenses({ dateRange: { start: months[1].start, end: months[1].end }, ...entityFilter });
  const { data: exp2 } = useExpenses({ dateRange: { start: months[2].start, end: months[2].end }, ...entityFilter });

  const { data: inc0 } = useIncome({ year: months[0].start.getFullYear(), month: months[0].start.getMonth() + 1, ...entityFilter });
  const { data: inc1 } = useIncome({ year: months[1].start.getFullYear(), month: months[1].start.getMonth() + 1, ...entityFilter });
  const { data: inc2 } = useIncome({ year: now.getFullYear(), month: now.getMonth() + 1, ...entityFilter });

  const chartData = useMemo(() => {
    const sum = (arr: any[] | undefined) => (arr || []).reduce((s, e) => s + Number(e.amount), 0);
    return [
      { month: months[0].label, income: sum(inc0), expenses: sum(exp0), isCurrent: false },
      { month: months[1].label, income: sum(inc1), expenses: sum(exp1), isCurrent: false },
      { month: months[2].label, income: sum(inc2), expenses: sum(exp2), isCurrent: true },
    ];
  }, [exp0, exp1, exp2, inc0, inc1, inc2]);

  const lastMonth = chartData[1];
  const thisMonth = chartData[2];
  const expDiff = lastMonth.expenses > 0
    ? ((thisMonth.expenses - lastMonth.expenses) / lastMonth.expenses) * 100
    : 0;
  const incDiff = lastMonth.income > 0
    ? ((thisMonth.income - lastMonth.income) / lastMonth.income) * 100
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover border border-border rounded-lg p-2.5 shadow-lg text-xs">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}: <strong>{fc(entry.value)}</strong></span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {/* Trend badges */}
      <div className="flex gap-2">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
          expDiff < 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
          expDiff > 5 ? "bg-red-500/15 text-red-600 dark:text-red-400" :
          "bg-muted text-muted-foreground"
        }`}>
          {expDiff < 0 ? <TrendingDown className="h-3 w-3" /> : expDiff > 5 ? <TrendingUp className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {l ? "Gastos" : "Expenses"} {expDiff > 0 ? "+" : ""}{expDiff.toFixed(0)}%
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
          incDiff > 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
          incDiff < -5 ? "bg-red-500/15 text-red-600 dark:text-red-400" :
          "bg-muted text-muted-foreground"
        }`}>
          {incDiff > 0 ? <TrendingUp className="h-3 w-3" /> : incDiff < -5 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {l ? "Ingresos" : "Income"} {incDiff > 0 ? "+" : ""}{incDiff.toFixed(0)}%
        </div>
      </div>

      {/* Chart */}
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => formatCompact(v)} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="income" name={l ? "Ingresos" : "Income"} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="expenses" name={l ? "Gastos" : "Expenses"} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
