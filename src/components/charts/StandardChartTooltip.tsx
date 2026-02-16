import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";

interface StandardChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  /** Optional custom formatter per dataKey */
  formatters?: Record<string, (value: number) => string>;
}

export function StandardChartTooltip({ active, payload, label, formatters }: StandardChartTooltipProps) {
  const { formatCurrency: fc } = useFormatCurrency();

  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover border border-border rounded-lg p-2.5 shadow-lg text-xs min-w-[140px]">
      {label && <p className="font-semibold mb-1.5 text-foreground">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry: any, i: number) => {
          if (entry.value == null || isNaN(entry.value)) return null;
          const formatted = formatters?.[entry.dataKey]
            ? formatters[entry.dataKey](entry.value)
            : fc(entry.value);
          return (
            <div key={i} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{entry.name}</span>
              </span>
              <span className="font-medium text-foreground">{formatted}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
