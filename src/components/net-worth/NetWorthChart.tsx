import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { NetWorthSnapshot } from '@/hooks/data/useNetWorth';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp } from 'lucide-react';

interface NetWorthChartProps {
  snapshots: NetWorthSnapshot[];
  currentNetWorth: number;
  currentAssets: number;
  currentLiabilities: number;
}

export function NetWorthChart({ snapshots, currentNetWorth, currentAssets, currentLiabilities }: NetWorthChartProps) {
  const chartData = useMemo(() => {
    const data = snapshots.map(s => ({
      date: format(parseISO(s.snapshot_date), 'MMM yyyy', { locale: es }),
      assets: s.total_assets,
      liabilities: s.total_liabilities,
      netWorth: s.net_worth,
    }));

    // Add current values as the latest data point
    const today = format(new Date(), 'MMM yyyy', { locale: es });
    const lastEntry = data[data.length - 1];
    
    if (!lastEntry || lastEntry.date !== today) {
      data.push({
        date: today,
        assets: currentAssets,
        liabilities: currentLiabilities,
        netWorth: currentNetWorth,
      });
    }

    return data;
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
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label}</p>
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Evolución del Patrimonio
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
