import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, parseISO, startOfMonth, getMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { MileageWithClient, calculateMileageDeduction } from '@/hooks/data/useMileage';
import { BarChart3 } from 'lucide-react';

interface MileageMonthlyChartProps {
  data: MileageWithClient[];
  year: number;
}

const chartConfig = {
  kilometers: {
    label: 'Kilómetros',
    color: 'hsl(var(--primary))',
  },
  deduction: {
    label: 'Deducción ($)',
    color: 'hsl(var(--chart-2))',
  },
};

export function MileageMonthlyChart({ data, year }: MileageMonthlyChartProps) {
  const { t, language } = useLanguage();
  const locale = language === 'es' ? es : enUS;

  const monthlyData = useMemo(() => {
    // Initialize all months
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      monthName: format(new Date(year, i, 1), 'MMM', { locale }),
      kilometers: 0,
      deduction: 0,
      trips: 0,
    }));

    // Group data by month
    let yearToDateKm = 0;
    
    // Sort data by date to calculate deductions properly
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedData.forEach((record) => {
      const date = parseISO(record.date);
      const monthIndex = getMonth(date);
      
      months[monthIndex].kilometers += record.kilometers;
      months[monthIndex].trips += 1;
      
      // Calculate deduction using CRA rates
      const { deductible } = calculateMileageDeduction(record.kilometers, yearToDateKm);
      months[monthIndex].deduction += deductible;
      yearToDateKm += record.kilometers;
    });

    // Round values for display
    return months.map(m => ({
      ...m,
      kilometers: Math.round(m.kilometers * 10) / 10,
      deduction: Math.round(m.deduction * 100) / 100,
    }));
  }, [data, year, locale]);

  const totals = useMemo(() => {
    return monthlyData.reduce(
      (acc, m) => ({
        kilometers: acc.kilometers + m.kilometers,
        deduction: acc.deduction + m.deduction,
        trips: acc.trips + m.trips,
      }),
      { kilometers: 0, deduction: 0, trips: 0 }
    );
  }, [monthlyData]);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          {language === 'es' ? 'Comparación Mensual' : 'Monthly Comparison'} - {year}
        </CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{totals.trips} {language === 'es' ? 'viajes' : 'trips'}</span>
          <span>{totals.kilometers.toLocaleString()} km</span>
          <span className="text-primary font-medium">${totals.deduction.toLocaleString()}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="monthName" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} km`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (name === 'kilometers') return [`${value} km`, language === 'es' ? 'Kilómetros' : 'Kilometers'];
                      if (name === 'deduction') return [`$${value}`, language === 'es' ? 'Deducción' : 'Deduction'];
                      return [value, name];
                    }}
                  />
                }
              />
              <Legend 
                formatter={(value) => {
                  if (value === 'kilometers') return language === 'es' ? 'Kilómetros' : 'Kilometers';
                  if (value === 'deduction') return language === 'es' ? 'Deducción' : 'Deduction';
                  return value;
                }}
              />
              <Bar 
                yAxisId="left"
                dataKey="kilometers" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="kilometers"
              />
              <Bar 
                yAxisId="right"
                dataKey="deduction" 
                fill="hsl(var(--chart-2))" 
                radius={[4, 4, 0, 0]}
                name="deduction"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
