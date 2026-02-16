import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(199, 89%, 48%)",
  "hsl(330, 81%, 60%)",
  "hsl(25, 95%, 53%)",
];

interface SpendingDonutProps {
  categories: { cat: string; spent: number; icon: string; label: string }[];
  total: number;
  freeLabel: string;
  freeMoney: number;
}

export function SpendingDonut({ categories, total, freeLabel, freeMoney }: SpendingDonutProps) {
  const { formatCurrency: fc } = useFormatCurrency();

  const data = categories.slice(0, 7).map((c) => ({
    name: c.label,
    value: c.spent,
    icon: c.icon,
  }));

  if (freeMoney > 0) {
    data.push({ name: freeLabel, value: freeMoney, icon: "🐷" });
  }

  if (data.length === 0) return null;

  return (
    <div className="relative">
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number) => fc(val)}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-bold">{fc(total)}</p>
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        {data.map((entry, i) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
          return (
            <span key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              {entry.icon} {entry.name} ({pct}%)
            </span>
          );
        })}
      </div>
    </div>
  );
}
