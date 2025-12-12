import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { CATEGORY_LABELS } from '@/hooks/data/useBankAnalysis';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface CategoryMonthData {
  month: string;
  monthLabel: string;
  [category: string]: number | string;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(210, 80%, 55%)',
  'hsl(170, 70%, 45%)',
  'hsl(340, 75%, 55%)',
];

export function CategoryTrendsChart() {
  const { language } = useLanguage();
  const { data: transactions } = useBankTransactions();

  const { chartData, categories, categoryTrends } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { chartData: [], categories: [], categoryTrends: {} };
    }

    // Get last 6 months
    const months: { start: Date; end: Date; label: string; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        start: startOfMonth(date),
        end: endOfMonth(date),
        label: format(date, 'MMM', { locale: language === 'es' ? es : undefined }),
        key: format(date, 'yyyy-MM'),
      });
    }

    // Group transactions by month and category
    const monthlyData: Record<string, Record<string, number>> = {};
    const allCategories = new Set<string>();

    transactions.forEach((t) => {
      const txDate = parseISO(t.transaction_date);
      const monthKey = format(txDate, 'yyyy-MM');
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }

      // Try to detect category from description
      const description = (t.description || '').toLowerCase();
      let category = 'other';

      if (description.includes('electric') || description.includes('luz') || description.includes('energy') || description.includes('power')) {
        category = 'utilities';
      } else if (description.includes('phone') || description.includes('mobile') || description.includes('internet') || description.includes('telecom') || description.includes('celular')) {
        category = 'telecommunications';
      } else if (description.includes('netflix') || description.includes('spotify') || description.includes('subscription') || description.includes('premium') || description.includes('youtube')) {
        category = 'subscriptions';
      } else if (description.includes('insurance') || description.includes('seguro')) {
        category = 'insurance';
      } else if (description.includes('transfer') || description.includes('transferencia')) {
        category = 'transfers';
      } else if (description.includes('grocery') || description.includes('supermarket') || description.includes('walmart') || description.includes('costco')) {
        category = 'groceries';
      } else if (description.includes('restaurant') || description.includes('food') || description.includes('uber eats') || description.includes('doordash')) {
        category = 'restaurants';
      } else if (description.includes('gas') || description.includes('fuel') || description.includes('parking') || description.includes('uber') || description.includes('transit')) {
        category = 'transportation';
      }

      allCategories.add(category);
      monthlyData[monthKey] = monthlyData[monthKey] || {};
      monthlyData[monthKey][category] = (monthlyData[monthKey][category] || 0) + Math.abs(Number(t.amount));
    });

    // Build chart data
    const chartData: CategoryMonthData[] = months.map((month) => {
      const data: CategoryMonthData = {
        month: month.key,
        monthLabel: month.label,
      };
      
      allCategories.forEach((cat) => {
        data[cat] = monthlyData[month.key]?.[cat] || 0;
      });
      
      return data;
    });

    // Calculate trends (compare last month to previous)
    const categoryTrends: Record<string, { trend: 'up' | 'down' | 'stable'; percentage: number }> = {};
    
    allCategories.forEach((cat) => {
      const lastMonth = chartData[chartData.length - 1]?.[cat] as number || 0;
      const prevMonth = chartData[chartData.length - 2]?.[cat] as number || 0;
      
      if (prevMonth === 0) {
        categoryTrends[cat] = { trend: lastMonth > 0 ? 'up' : 'stable', percentage: 0 };
      } else {
        const change = ((lastMonth - prevMonth) / prevMonth) * 100;
        categoryTrends[cat] = {
          trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
          percentage: Math.abs(change),
        };
      }
    });

    // Filter to top categories by total spending
    const categoryTotals = Array.from(allCategories).map((cat) => ({
      category: cat,
      total: chartData.reduce((sum, d) => sum + (d[cat] as number || 0), 0),
    }));
    
    const topCategories = categoryTotals
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map((c) => c.category);

    return { chartData, categories: topCategories, categoryTrends };
  }, [transactions, language]);

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'es' ? 'Tendencias por Categoría' : 'Category Trends'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {language === 'es' 
              ? 'Importa transacciones para ver tendencias'
              : 'Import transactions to see trends'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getCategoryLabel = (cat: string) => {
    const info = CATEGORY_LABELS[cat] || CATEGORY_LABELS.other;
    return `${info.icon} ${language === 'es' ? info.es : info.en}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {language === 'es' ? 'Tendencias por Categoría' : 'Category Trends'}
        </CardTitle>
        <CardDescription>
          {language === 'es' 
            ? 'Evolución de gastos en los últimos 6 meses'
            : 'Spending evolution over the last 6 months'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                {categories.map((cat, index) => (
                  <linearGradient key={cat} id={`gradient-${cat}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(2)}`,
                  getCategoryLabel(name),
                ]}
              />
              {categories.map((cat, index) => (
                <Area
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  name={cat}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  fill={`url(#gradient-${cat})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Badges with Trends */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, index) => {
            const trend = categoryTrends[cat];
            const info = CATEGORY_LABELS[cat] || CATEGORY_LABELS.other;
            
            return (
              <Badge
                key={cat}
                variant="outline"
                className="flex items-center gap-1 text-xs"
                style={{ borderColor: CHART_COLORS[index % CHART_COLORS.length] }}
              >
                <span>{info.icon}</span>
                <span>{language === 'es' ? info.es : info.en}</span>
                {trend && (
                  <>
                    {trend.trend === 'up' && (
                      <TrendingUp className="h-3 w-3 text-destructive ml-1" />
                    )}
                    {trend.trend === 'down' && (
                      <TrendingDown className="h-3 w-3 text-success ml-1" />
                    )}
                    {trend.trend === 'stable' && (
                      <Minus className="h-3 w-3 text-muted-foreground ml-1" />
                    )}
                    {trend.percentage > 0 && (
                      <span className={`text-[10px] ${
                        trend.trend === 'up' ? 'text-destructive' : 
                        trend.trend === 'down' ? 'text-success' : 'text-muted-foreground'
                      }`}>
                        {trend.percentage.toFixed(0)}%
                      </span>
                    )}
                  </>
                )}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
