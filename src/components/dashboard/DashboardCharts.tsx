import { memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface CategoryStats {
  category: string;
  total: number;
}

interface ClientStats {
  client_name: string;
  total: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
}

interface DashboardChartsProps {
  categoryBreakdown: CategoryStats[];
  clientBreakdown: ClientStats[];
  monthlyTrends: MonthlyTrend[];
  isLoading: boolean;
}

export const DashboardCharts = memo(({ 
  categoryBreakdown, 
  clientBreakdown, 
  monthlyTrends, 
  isLoading 
}: DashboardChartsProps) => {
  const { t, language } = useLanguage();

  const totalLabel = language === 'es' ? 'Total' : 'Total';

  const categoryChartConfig = useMemo(() => ({
    total: { label: totalLabel },
  } satisfies ChartConfig), [totalLabel]);

  const clientChartConfig = useMemo(() => ({
    total: { label: totalLabel, color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig), [totalLabel]);

  const trendChartConfig = useMemo(() => ({
    total: { label: totalLabel, color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig), [totalLabel]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.expensesByCategory')}</CardTitle>
            <CardDescription>{t('taxAnalysis.top5Categories')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : categoryBreakdown.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t('taxAnalysis.noDataAvailable')}
              </div>
            ) : (
              <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.expensesByClient')}</CardTitle>
            <CardDescription>{t('taxAnalysis.top5Clients')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : clientBreakdown.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t('taxAnalysis.noDataAvailable')}
              </div>
            ) : (
              <ChartContainer config={clientChartConfig} className="h-[300px] w-full">
                <BarChart data={clientBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="client_name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.monthlyTrends')}</CardTitle>
          <CardDescription>{t('taxAnalysis.last6Months')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--chart-1))" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

DashboardCharts.displayName = 'DashboardCharts';
