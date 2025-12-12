import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { NetWorthSnapshot } from '@/hooks/data/useNetWorth';
import { format, parseISO, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, ArrowUpRight, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NetWorthChartProps {
  snapshots: NetWorthSnapshot[];
  currentNetWorth: number;
  currentAssets: number;
  currentLiabilities: number;
}

export function NetWorthChart({ snapshots, currentNetWorth, currentAssets, currentLiabilities }: NetWorthChartProps) {
  const { chartData, projectionData, stats } = useMemo(() => {
    const data: Array<{
      date: string;
      assets: number;
      liabilities: number;
      netWorth: number;
      isProjection?: boolean;
    }> = snapshots.map(s => ({
      date: format(parseISO(s.snapshot_date), 'MMM yyyy', { locale: es }),
      assets: s.total_assets,
      liabilities: s.total_liabilities,
      netWorth: s.net_worth,
      isProjection: false,
    }));

    // Add current values as the latest data point
    const today = new Date();
    const todayFormatted = format(today, 'MMM yyyy', { locale: es });
    const lastEntry = data[data.length - 1];
    
    if (!lastEntry || lastEntry.date !== todayFormatted) {
      data.push({
        date: todayFormatted,
        assets: currentAssets,
        liabilities: currentLiabilities,
        netWorth: currentNetWorth,
        isProjection: false,
      });
    }

    // Calculate monthly growth rate from historical data
    let monthlyGrowthRate = 0.02; // Default 2% monthly growth
    if (data.length >= 2) {
      const firstValue = data[0].netWorth;
      const lastValue = data[data.length - 1].netWorth;
      const months = data.length;
      if (firstValue > 0 && lastValue > firstValue) {
        monthlyGrowthRate = Math.pow(lastValue / firstValue, 1 / months) - 1;
      }
    }

    // Generate 6-month projection
    const projection: typeof data = [];
    const lastData = data[data.length - 1];
    for (let i = 1; i <= 6; i++) {
      const projDate = addMonths(today, i);
      const growthFactor = Math.pow(1 + monthlyGrowthRate, i);
      projection.push({
        date: format(projDate, 'MMM yyyy', { locale: es }),
        assets: Math.round(lastData.assets * growthFactor),
        liabilities: Math.round(lastData.liabilities * (1 - monthlyGrowthRate * 0.3 * i)), // Liabilities decrease slower
        netWorth: Math.round(lastData.netWorth * growthFactor),
        isProjection: true,
      });
    }

    // Calculate stats
    const firstNetWorth = data[0]?.netWorth || currentNetWorth;
    const totalChange = currentNetWorth - firstNetWorth;
    const percentChange = firstNetWorth > 0 ? ((currentNetWorth - firstNetWorth) / firstNetWorth) * 100 : 0;
    const projectedNetWorth = projection[projection.length - 1]?.netWorth || currentNetWorth;
    const projectedGrowth = projectedNetWorth - currentNetWorth;

    return {
      chartData: data,
      projectionData: [...data, ...projection],
      stats: {
        monthlyGrowthRate: monthlyGrowthRate * 100,
        totalChange,
        percentChange,
        projectedNetWorth,
        projectedGrowth,
      },
    };
  }, [snapshots, currentNetWorth, currentAssets, currentLiabilities]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isProjection = payload[0]?.payload?.isProjection;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-medium">{label}</p>
            {isProjection && (
              <Badge variant="outline" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                Proyección
              </Badge>
            )}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasEnoughData = chartData.length >= 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolución del Patrimonio
          </CardTitle>
          {hasEnoughData && stats.percentChange !== 0 && (
            <div className="flex items-center gap-2">
              <Badge 
                variant={stats.percentChange >= 0 ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                <ArrowUpRight className={`h-3 w-3 ${stats.percentChange < 0 ? 'rotate-90' : ''}`} />
                {stats.percentChange >= 0 ? '+' : ''}{stats.percentChange.toFixed(1)}%
              </Badge>
              <span className="text-xs text-muted-foreground">histórico</span>
            </div>
          )}
        </div>
        {hasEnoughData && (
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>
              Proyección 6 meses: <span className="font-semibold text-primary">{formatCurrency(stats.projectedNetWorth)}</span>
            </span>
            <span className="text-green-600">
              (+{formatCurrency(stats.projectedGrowth)})
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {hasEnoughData ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLiabilities" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProjection" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis 
                className="text-xs" 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine 
                x={chartData[chartData.length - 1]?.date} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                label={{ value: 'Hoy', position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="assets"
                name="Activos"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorAssets)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="liabilities"
                name="Pasivos"
                stroke="hsl(var(--destructive))"
                fillOpacity={1}
                fill="url(#colorLiabilities)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                name="Patrimonio Neto"
                stroke="hsl(142, 76%, 36%)"
                fillOpacity={1}
                fill="url(#colorNetWorth)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>Agrega activos y pasivos para ver la evolución de tu patrimonio</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
