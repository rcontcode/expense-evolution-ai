import { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryLabelByLanguage, ExpenseCategory } from '@/lib/constants/expense-categories';
import { format, startOfMonth, endOfMonth, subMonths, isSameMonth, isWithinInterval } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string | null;
}

interface MonthComparisonChartProps {
  expenses: Expense[];
  isLoading?: boolean;
}

const CATEGORIES: ExpenseCategory[] = [
  'meals', 'travel', 'fuel', 'equipment', 'software', 
  'professional_services', 'office_supplies', 'utilities', 
  'advertising', 'materials', 'other'
];

export const MonthComparisonChart = memo(({ expenses, isLoading }: MonthComparisonChartProps) => {
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  
  const { chartData, totals, monthNames } = useMemo(() => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const previousMonth = startOfMonth(subMonths(now, 1));
    
    const currentMonthEnd = endOfMonth(currentMonth);
    const previousMonthEnd = endOfMonth(previousMonth);
    
    const monthNames = {
      current: format(currentMonth, 'MMMM yyyy', { locale }),
      previous: format(previousMonth, 'MMMM yyyy', { locale })
    };
    
    // Calculate totals by category
    const categoryTotals: Record<string, { current: number; previous: number; average: number }> = {};
    
    // Initialize categories
    CATEGORIES.forEach(cat => {
      categoryTotals[cat] = { current: 0, previous: 0, average: 0 };
    });
    
    // Calculate average from last 6 months
    const sixMonthsAgo = subMonths(now, 6);
    const monthlyTotals: Record<string, number[]> = {};
    CATEGORIES.forEach(cat => {
      monthlyTotals[cat] = [];
    });
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const category = (expense.category as ExpenseCategory) || 'other';
      
      if (!CATEGORIES.includes(category)) return;
      
      // Current month
      if (isWithinInterval(date, { start: currentMonth, end: currentMonthEnd })) {
        categoryTotals[category].current += expense.amount;
      }
      
      // Previous month
      if (isWithinInterval(date, { start: previousMonth, end: previousMonthEnd })) {
        categoryTotals[category].previous += expense.amount;
      }
    });
    
    // Calculate overall average (simple average of last 2 months for now)
    CATEGORIES.forEach(cat => {
      categoryTotals[cat].average = (categoryTotals[cat].current + categoryTotals[cat].previous) / 2;
    });
    
    // Create chart data
    const chartData = CATEGORIES
      .map(category => ({
        category,
        categoryLabel: getCategoryLabelByLanguage(category, language),
        current: categoryTotals[category].current,
        previous: categoryTotals[category].previous,
        average: categoryTotals[category].average,
        change: categoryTotals[category].previous > 0 
          ? ((categoryTotals[category].current - categoryTotals[category].previous) / categoryTotals[category].previous * 100)
          : 0
      }))
      .filter(item => item.current > 0 || item.previous > 0)
      .sort((a, b) => (b.current + b.previous) - (a.current + a.previous));
    
    // Calculate overall totals
    const totals = {
      current: Object.values(categoryTotals).reduce((sum, c) => sum + c.current, 0),
      previous: Object.values(categoryTotals).reduce((sum, c) => sum + c.previous, 0),
      change: 0
    };
    totals.change = totals.previous > 0 
      ? ((totals.current - totals.previous) / totals.previous * 100)
      : 0;
    
    return { chartData, totals, monthNames };
  }, [expenses, language]);
  
  const getChangeIcon = (change: number) => {
    if (change > 5) return <ArrowUpRight className="h-3 w-3 text-red-500" />;
    if (change < -5) return <ArrowDownRight className="h-3 w-3 text-emerald-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };
  
  const getChangeBadge = (change: number) => {
    const variant = change > 5 ? "destructive" : change < -5 ? "default" : "secondary";
    return (
      <Badge variant={variant} className="text-xs">
        {change > 0 ? '+' : ''}{change.toFixed(1)}%
      </Badge>
    );
  };
  
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
          <div className="h-80 bg-muted/30 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              📈 {language === 'es' ? 'Comparativo Mes a Mes' : 'Month-to-Month Comparison'}
            </CardTitle>
            <CardDescription className="capitalize">
              {monthNames.current} vs {monthNames.previous}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {language === 'es' ? 'Cambio total:' : 'Total change:'}
            </span>
            {getChangeBadge(totals.change)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              {language === 'es' ? 'Mes actual' : 'Current month'}
            </p>
            <p className="text-lg font-bold text-primary">${totals.current.toFixed(0)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              {language === 'es' ? 'Mes anterior' : 'Previous month'}
            </p>
            <p className="text-lg font-bold">${totals.previous.toFixed(0)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              {language === 'es' ? 'Diferencia' : 'Difference'}
            </p>
            <p className={`text-lg font-bold ${totals.current > totals.previous ? 'text-red-500' : 'text-emerald-500'}`}>
              {totals.current > totals.previous ? '+' : ''}${(totals.current - totals.previous).toFixed(0)}
            </p>
          </div>
        </div>
        
        {/* Bar chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `$${value}`}
                className="text-muted-foreground"
              />
              <YAxis 
                type="category"
                dataKey="categoryLabel"
                tick={{ fontSize: 11 }}
                width={100}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
              />
              <Legend />
              <Bar 
                dataKey="current" 
                name={language === 'es' ? 'Mes actual' : 'Current'} 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]}
              />
              <Bar 
                dataKey="previous" 
                name={language === 'es' ? 'Mes anterior' : 'Previous'} 
                fill="hsl(var(--muted-foreground))" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Category changes table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium">
                    {language === 'es' ? 'Categoría' : 'Category'}
                  </th>
                  <th className="text-right p-2 font-medium">
                    {language === 'es' ? 'Actual' : 'Current'}
                  </th>
                  <th className="text-right p-2 font-medium">
                    {language === 'es' ? 'Anterior' : 'Previous'}
                  </th>
                  <th className="text-right p-2 font-medium">
                    {language === 'es' ? 'Cambio' : 'Change'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {chartData.map(item => (
                  <tr key={item.category} className="border-t hover:bg-muted/30">
                    <td className="p-2">{item.categoryLabel}</td>
                    <td className="p-2 text-right font-medium">${item.current.toFixed(0)}</td>
                    <td className="p-2 text-right text-muted-foreground">${item.previous.toFixed(0)}</td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getChangeIcon(item.change)}
                        <span className={item.change > 0 ? 'text-red-500' : item.change < 0 ? 'text-emerald-500' : ''}>
                          {item.change > 0 ? '+' : ''}{item.change.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MonthComparisonChart.displayName = 'MonthComparisonChart';
