import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";

interface CategoryData {
  category: string;
  label: string;
  icon: string;
  spent: number;
  budget: number;
  percentage: number;
}

interface BudgetVsActualChartProps {
  categories: CategoryData[];
}

export function BudgetVsActualChart({ categories }: BudgetVsActualChartProps) {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();

  const { formatCompact } = useFormatCurrency();
  const withBudget = categories.filter(c => c.budget > 0);

  if (withBudget.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-sm text-muted-foreground">
          {l ? "Asigna presupuesto a categorías para ver la comparación" : "Set category budgets to see the comparison"}
        </p>
      </div>
    );
  }

  const chartData = withBudget.slice(0, 8).map(c => ({
    name: `${c.icon} ${c.label}`,
    shortName: `${c.icon} ${c.label.length > 8 ? c.label.slice(0, 8) + "…" : c.label}`,
    spent: c.spent,
    budget: c.budget,
    percentage: c.percentage,
    isOver: c.percentage > 100,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-2.5 shadow-lg text-xs">
        <p className="font-medium mb-1">{d.name}</p>
        <p>{l ? "Gastado" : "Spent"}: <strong>{fc(d.spent)}</strong></p>
        <p>{l ? "Presupuesto" : "Budget"}: <strong>{fc(d.budget)}</strong></p>
        <p className={d.isOver ? "text-red-500 font-semibold" : "text-emerald-500"}>
          {d.percentage.toFixed(0)}% {d.isOver ? (l ? "excedido" : "over") : (l ? "usado" : "used")}
        </p>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => formatCompact(v)}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="budget" fill="hsl(var(--muted-foreground) / 0.3)" stroke="hsl(var(--muted-foreground) / 0.5)" strokeWidth={1} radius={[0, 4, 4, 0]} barSize={14} name={l ? "Presupuesto" : "Budget"} />
            <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={14} name={l ? "Gastado" : "Spent"}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.isOver ? "hsl(var(--destructive))" : "hsl(var(--chart-2))"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-muted" /> {l ? "Presupuesto" : "Budget"}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--chart-2))" }} /> {l ? "Gastado" : "Spent"}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--destructive))" }} /> {l ? "Excedido" : "Over"}</span>
      </div>
    </motion.div>
  );
}
