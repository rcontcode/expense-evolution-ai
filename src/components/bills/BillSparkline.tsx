import { useMemo } from 'react';
import { useBillPayments } from '@/hooks/data/useRecurringBills';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BillSparklineProps {
  billId: string;
  currentAmount: number;
}

export function BillSparkline({ billId, currentAmount }: BillSparklineProps) {
  const { data: payments } = useBillPayments(billId);
  const { formatCurrency } = useFormatCurrency();
  const { language } = useLanguage();
  const l = language === 'es';

  const sparkData = useMemo(() => {
    if (!payments || payments.length < 2) return null;

    const recent = payments.slice(0, 6).reverse(); // oldest first, max 6
    const amounts = recent.map(p => Number(p.amount_paid));
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const range = max - min || 1;
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;

    // Trend: compare last 2 vs first 2
    const firstHalf = amounts.slice(0, Math.ceil(amounts.length / 2));
    const secondHalf = amounts.slice(Math.ceil(amounts.length / 2));
    const firstAvg = firstHalf.reduce((s, a) => s + a, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, a) => s + a, 0) / secondHalf.length;
    const trendPct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    return { amounts, min, max, range, avg, trendPct, count: recent.length };
  }, [payments]);

  if (!sparkData) return null;

  const { amounts, min, range, trendPct, avg, count } = sparkData;
  const width = 60;
  const height = 20;
  const points = amounts.map((a, i) => {
    const x = (i / (amounts.length - 1)) * width;
    const y = height - ((a - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  }).join(' ');

  const TrendIcon = trendPct > 3 ? TrendingUp : trendPct < -3 ? TrendingDown : Minus;
  const trendColor = trendPct > 3 ? 'text-destructive' : trendPct < -3 ? 'text-emerald-500' : 'text-muted-foreground';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 cursor-help">
          <svg width={width} height={height} className="shrink-0">
            <polyline
              points={points}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <TrendIcon className={`h-3 w-3 ${trendColor}`} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs space-y-0.5">
        <p className="font-medium">
          {l ? `Tendencia de ${count} pagos` : `Trend over ${count} payments`}
        </p>
        <p>{l ? 'Promedio' : 'Average'}: {formatCurrency(avg)}</p>
        <p>{l ? 'Rango' : 'Range'}: {formatCurrency(sparkData.min)} — {formatCurrency(sparkData.max)}</p>
        <p className={trendColor}>
          {trendPct > 3
            ? (l ? `📈 Subiendo ${trendPct.toFixed(0)}%` : `📈 Rising ${trendPct.toFixed(0)}%`)
            : trendPct < -3
              ? (l ? `📉 Bajando ${Math.abs(trendPct).toFixed(0)}%` : `📉 Falling ${Math.abs(trendPct).toFixed(0)}%`)
              : (l ? '➖ Estable' : '➖ Stable')}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
