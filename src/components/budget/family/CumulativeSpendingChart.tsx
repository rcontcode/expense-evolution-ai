import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { motion } from "framer-motion";

interface CumulativeSpendingChartProps {
  data: Array<{ day: number; spent: number; ideal: number }>;
  dailyBudget: number;
  daysInMonth: number;
  daysPassed: number;
}

export function CumulativeSpendingChart({ data, dailyBudget, daysInMonth, daysPassed }: CumulativeSpendingChartProps) {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();

  if (data.length === 0 || dailyBudget <= 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="text-3xl mb-2">📈</span>
        <p className="text-sm text-muted-foreground">
          {l ? "Registra gastos y configura presupuesto para ver el ritmo" : "Log expenses and set budget to see pace"}
        </p>
      </div>
    );
  }

  // Extend ideal line to end of month
  const fullData = [...data];
  for (let d = daysPassed + 1; d <= daysInMonth; d++) {
    fullData.push({ day: d, spent: NaN, ideal: Math.round(dailyBudget * d) });
  }

  const lastSpent = data[data.length - 1]?.spent || 0;
  const lastIdeal = data[data.length - 1]?.ideal || 0;
  const diff = lastIdeal - lastSpent;
  const isOnTrack = diff >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover border border-border rounded-lg p-2.5 shadow-lg text-xs">
        <p className="font-medium mb-1">{l ? `Día ${label}` : `Day ${label}`}</p>
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
      {/* Status badge */}
      <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${
        isOnTrack ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
      }`}>
        <span>{isOnTrack ? "✅" : "⚠️"}</span>
        <span>
          {isOnTrack
            ? (l ? `${fc(diff)} por debajo del ritmo ideal` : `${fc(diff)} below ideal pace`)
            : (l ? `${fc(Math.abs(diff))} por encima del ritmo ideal` : `${fc(Math.abs(diff))} above ideal pace`)}
        </span>
      </div>

      {/* Chart */}
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fullData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isOnTrack ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isOnTrack ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(d) => d % 5 === 0 ? `${d}` : ""}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="ideal"
              name={l ? "Ideal" : "Ideal"}
              stroke="hsl(var(--muted-foreground))"
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="spent"
              name={l ? "Real" : "Actual"}
              stroke={isOnTrack ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"}
              fill="url(#spentGrad)"
              strokeWidth={2}
              connectNulls={false}
            />
            <ReferenceLine
              x={daysPassed}
              stroke="hsl(var(--primary))"
              strokeDasharray="3 3"
              label={{ value: l ? "Hoy" : "Today", position: "top", fill: "hsl(var(--primary))", fontSize: 10 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
