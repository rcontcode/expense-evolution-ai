import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { NetWorthSnapshot } from '@/hooks/data/useNetWorth';
import { format, parseISO, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, ArrowUpRight, Target, Info, Calculator, ChevronDown, ChevronUp, Lightbulb, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface NetWorthChartProps {
  snapshots: NetWorthSnapshot[];
  currentNetWorth: number;
  currentAssets: number;
  currentLiabilities: number;
}

export function NetWorthChart({ snapshots, currentNetWorth, currentAssets, currentLiabilities }: NetWorthChartProps) {
  const [showExplanation, setShowExplanation] = useState(false);

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
    let hasHistoricalData = false;
    if (data.length >= 2) {
      const firstValue = data[0].netWorth;
      const lastValue = data[data.length - 1].netWorth;
      const months = data.length;
      if (firstValue > 0 && lastValue > firstValue) {
        monthlyGrowthRate = Math.pow(lastValue / firstValue, 1 / months) - 1;
        hasHistoricalData = true;
      } else if (firstValue > 0) {
        // If net worth decreased, use a modest growth projection
        monthlyGrowthRate = 0.015;
      }
    }

    // Limit growth rate to reasonable bounds
    monthlyGrowthRate = Math.max(-0.05, Math.min(0.15, monthlyGrowthRate));

    // Generate 6-month projection
    const projection: typeof data = [];
    const lastData = data[data.length - 1];
    for (let i = 1; i <= 6; i++) {
      const projDate = addMonths(today, i);
      const growthFactor = Math.pow(1 + monthlyGrowthRate, i);
      // Liabilities decrease at 30% the rate of asset growth (debt paydown assumption)
      const liabilityFactor = Math.pow(1 - (monthlyGrowthRate * 0.3), i);
      projection.push({
        date: format(projDate, 'MMM yyyy', { locale: es }),
        assets: Math.round(lastData.assets * growthFactor),
        liabilities: Math.max(0, Math.round(lastData.liabilities * liabilityFactor)),
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
        hasHistoricalData,
        dataPoints: data.length,
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
              <Badge variant="outline" className="text-xs bg-primary/10">
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
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolución del Patrimonio
            </CardTitle>
            <CardDescription className="mt-1">
              Histórico y proyección basada en tu tendencia actual
            </CardDescription>
          </div>
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
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Proyección 6 meses:</span>
              <span className="font-bold text-primary">{formatCurrency(stats.projectedNetWorth)}</span>
              <Badge variant="outline" className="text-xs text-green-600 bg-green-500/10">
                +{formatCurrency(stats.projectedGrowth)}
              </Badge>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {hasEnoughData ? (
          <>
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

            {/* Projection Explanation Section */}
            <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-sm text-muted-foreground hover:text-foreground">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    <span>¿Cómo se calcula la proyección?</span>
                  </div>
                  {showExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Metodología de Proyección</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        La proyección se calcula usando tu <strong>tasa de crecimiento histórica</strong>, 
                        derivada de la comparación entre tu primer registro y tu patrimonio actual.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Puntos de datos históricos:</span>
                      <Badge variant="outline">{stats.dataPoints} registro(s)</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tasa de crecimiento mensual calculada:</span>
                      <Badge variant={stats.monthlyGrowthRate >= 0 ? "default" : "destructive"}>
                        {stats.monthlyGrowthRate >= 0 ? '+' : ''}{stats.monthlyGrowthRate.toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Basado en datos reales:</span>
                      <Badge variant={stats.hasHistoricalData ? "default" : "secondary"}>
                        {stats.hasHistoricalData ? 'Sí' : 'No (usando 2% predeterminado)'}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h5 className="font-medium text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Fórmula utilizada:
                    </h5>
                    <div className="p-3 rounded-lg bg-background border text-xs font-mono">
                      <p>Patrimonio Futuro = Patrimonio Actual × (1 + Tasa)^meses</p>
                      <p className="mt-2 text-muted-foreground">
                        = {formatCurrency(currentNetWorth)} × (1 + {(stats.monthlyGrowthRate/100).toFixed(4)})^6
                      </p>
                      <p className="mt-1 text-primary font-semibold">
                        = {formatCurrency(stats.projectedNetWorth)}
                      </p>
                    </div>
                  </div>

                  <Alert className="bg-blue-500/5 border-blue-500/20">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-xs">
                      <strong>Supuestos de la proyección:</strong>
                      <ul className="list-disc ml-4 mt-1 space-y-1">
                        <li>Activos crecen al {stats.monthlyGrowthRate.toFixed(1)}% mensual</li>
                        <li>Pasivos disminuyen al {(stats.monthlyGrowthRate * 0.3).toFixed(1)}% mensual (asumiendo pagos de deuda)</li>
                        <li>Comportamiento de ahorro e inversión se mantiene constante</li>
                        <li>No considera eventos extraordinarios ni cambios en ingresos</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <p className="text-xs text-muted-foreground italic">
                    💡 Tip: Agrega más registros mensuales para mejorar la precisión de la proyección. 
                    La tasa se recalcula automáticamente con cada nuevo dato.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>Agrega activos y pasivos para ver la evolución de tu patrimonio</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
