import { useMemo, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { cn } from '@/lib/utils';

const LEGEND_KEY = 'simple_sparkline_legend_seen';

interface MonthlyTrend {
  month: string;
  total: number;
}

interface SimpleSparklineProps {
  trends: MonthlyTrend[];
  language: 'es' | 'en';
}

/**
 * Ultra-minimal sparkline for Simple Mode.
 * Shows last 6 months of spending as a smooth area + month-over-month delta chip.
 * No external chart libraries — pure SVG.
 */
export function SimpleSparkline({ trends, language }: SimpleSparklineProps) {
  const { formatCurrency } = useFormatCurrency();
  const [legendDismissed, setLegendDismissed] = useState(true);

  useEffect(() => {
    setLegendDismissed(localStorage.getItem(LEGEND_KEY) === '1');
  }, []);

  const dismissLegend = () => {
    localStorage.setItem(LEGEND_KEY, '1');
    setLegendDismissed(true);
  };

  const { path, areaPath, points, max, min, current, previous, deltaPct, trendDir } = useMemo(() => {
    const W = 100;
    const H = 28;
    const totals = trends.map((t) => t.total);
    const maxV = Math.max(...totals, 1);
    const minV = Math.min(...totals, 0);
    const range = Math.max(maxV - minV, 1);
    const stepX = trends.length > 1 ? W / (trends.length - 1) : W;

    const pts = trends.map((t, i) => ({
      x: i * stepX,
      y: H - ((t.total - minV) / range) * H,
      total: t.total,
      month: t.month,
    }));

    const linePath = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');

    const area = `${linePath} L${W},${H} L0,${H} Z`;

    const cur = totals[totals.length - 1] ?? 0;
    const prev = totals[totals.length - 2] ?? 0;
    let pct = 0;
    let dir: 'up' | 'down' | 'flat' = 'flat';
    if (prev > 0) {
      pct = ((cur - prev) / prev) * 100;
      if (Math.abs(pct) < 1) dir = 'flat';
      else dir = pct > 0 ? 'up' : 'down';
    } else if (cur > 0) {
      dir = 'up';
      pct = 100;
    }

    return {
      path: linePath,
      areaPath: area,
      points: pts,
      max: maxV,
      min: minV,
      current: cur,
      previous: prev,
      deltaPct: pct,
      trendDir: dir,
    };
  }, [trends]);

  // For spending, "down" is good (less spent), "up" is bad (more spent)
  const isPositiveTrend = trendDir === 'down' || trendDir === 'flat';
  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;

  const absPct = Math.abs(deltaPct).toFixed(0);
  const deltaText =
    trendDir === 'up'
      ? language === 'es'
        ? `${absPct}% más que el mes pasado`
        : `${absPct}% more than last month`
      : trendDir === 'down'
        ? language === 'es'
          ? `${absPct}% menos · ahorraste`
          : `${absPct}% less · you saved`
        : '';

  return (
    <div className="pt-3 px-4 space-y-1.5 text-left">
      <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
        <span className="text-muted-foreground font-medium">
          {language === 'es' ? 'Gastos · últimos 6 meses' : 'Spending · last 6 months'}
        </span>
        {trendDir !== 'flat' && previous > 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px]',
              isPositiveTrend
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                : 'text-rose-700 dark:text-rose-400 bg-rose-500/10',
            )}
            title={
              language === 'es'
                ? `Mes anterior: ${formatCurrency(previous)}`
                : `Previous month: ${formatCurrency(previous)}`
            }
          >
            <TrendIcon className="h-3 w-3" />
            <span className="tabular-nums">{deltaText}</span>
          </span>
        )}
      </div>

      <div className="relative">
        <svg
          viewBox="0 0 100 28"
          preserveAspectRatio="none"
          className="w-full h-10 overflow-visible"
          aria-label={language === 'es' ? 'Tendencia de gastos' : 'Spending trend'}
        >
          <defs>
            <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#sparkGradient)" />
          <path
            d={path}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Highlight last point */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="2"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground capitalize">
        {points.map((p, i) => (
          <span
            key={`${p.month}-${i}`}
            className={cn(
              'tabular-nums',
              i === points.length - 1 && 'font-bold text-foreground',
            )}
          >
            {p.month}
          </span>
        ))}
      </div>
    </div>
  );
}
