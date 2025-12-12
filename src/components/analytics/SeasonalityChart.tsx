import { memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth, subYears } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string | null;
}

interface SeasonalityChartProps {
  expenses: Expense[];
  isLoading?: boolean;
}

const MONTH_NAMES = {
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};

export const SeasonalityChart = memo(({ expenses, isLoading }: SeasonalityChartProps) => {
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  
  const { chartData, insights, currentYear, previousYear } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;
    
    const months = MONTH_NAMES[language] || MONTH_NAMES.es;
    
    // Initialize data structure
    const monthlyData: { month: string; monthIndex: number; currentYear: number; previousYear: number }[] = 
      months.map((month, index) => ({
        month,
        monthIndex: index,
        currentYear: 0,
        previousYear: 0
      }));
    
    // Aggregate expenses by month and year
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      
      if (year === currentYear) {
        monthlyData[monthIndex].currentYear += expense.amount;
      } else if (year === previousYear) {
        monthlyData[monthIndex].previousYear += expense.amount;
      }
    });
    
    // Calculate insights
    const currentMonthIndex = now.getMonth();
    const currentMonthSpending = monthlyData[currentMonthIndex]?.currentYear || 0;
    const previousYearSameMonth = monthlyData[currentMonthIndex]?.previousYear || 0;
    
    // Find highest spending months historically
    const avgByMonth = monthlyData.map((m, idx) => ({
      month: m.month,
      avg: (m.currentYear + m.previousYear) / 2,
      index: idx
    })).sort((a, b) => b.avg - a.avg);
    
    const highestMonths = avgByMonth.slice(0, 3);
    
    // Predict next month based on historical pattern
    const nextMonthIndex = (currentMonthIndex + 1) % 12;
    const nextMonthPrediction = monthlyData[nextMonthIndex]?.previousYear || 0;
    
    const insights = {
      yoyChange: previousYearSameMonth > 0 
        ? ((currentMonthSpending - previousYearSameMonth) / previousYearSameMonth * 100) 
        : 0,
      highestMonths,
      nextMonthPrediction,
      currentMonthSpending
    };
    
    return { 
      chartData: monthlyData, 
      insights,
      currentYear,
      previousYear
    };
  }, [expenses, language]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-muted animate-pulse" />
            <div className="h-5 w-48 bg-muted animate-pulse rounded" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 bg-muted/30 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              📊 {language === 'es' ? 'Análisis de Estacionalidad' : 'Seasonality Analysis'}
            </CardTitle>
            <CardDescription>
              {language === 'es' 
                ? `Comparación ${currentYear} vs ${previousYear}` 
                : `Comparing ${currentYear} vs ${previousYear}`}
            </CardDescription>
          </div>
          {insights.yoyChange !== 0 && (
            <Badge variant={insights.yoyChange > 0 ? "destructive" : "default"} className="flex items-center gap-1">
              {insights.yoyChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {insights.yoyChange > 0 ? '+' : ''}{insights.yoyChange.toFixed(1)}% YoY
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                labelFormatter={(label) => label}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="currentYear" 
                name={String(currentYear)}
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="previousYear" 
                name={String(previousYear)}
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--muted-foreground))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">
                {language === 'es' ? 'Meses con más gasto' : 'Highest Spending Months'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {insights.highestMonths.map((m, idx) => (
                <Badge key={m.month} variant="secondary">
                  {m.month}: ${m.avg.toFixed(0)}
                </Badge>
              ))}
            </div>
          </div>
          
          {insights.nextMonthPrediction > 0 && (
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {language === 'es' ? 'Predicción próximo mes' : 'Next Month Prediction'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'es' 
                  ? `Basado en el historial, prepárate para ~$${insights.nextMonthPrediction.toFixed(0)} en gastos`
                  : `Based on history, expect ~$${insights.nextMonthPrediction.toFixed(0)} in expenses`}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

SeasonalityChart.displayName = 'SeasonalityChart';
