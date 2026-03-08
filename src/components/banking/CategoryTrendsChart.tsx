import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useExpenses } from '@/hooks/data/useExpenses';
import { CATEGORY_LABELS } from '@/hooks/data/useBankAnalysis';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

// Simple category detector from description
function detectCategory(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('electric') || desc.includes('luz') || desc.includes('energy') || desc.includes('power') || desc.includes('gas natural')) return 'utilities';
  if (desc.includes('phone') || desc.includes('mobile') || desc.includes('internet') || desc.includes('telecom') || desc.includes('celular')) return 'telecommunications';
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('subscription') || desc.includes('premium') || desc.includes('youtube') || desc.includes('hbo') || desc.includes('disney')) return 'subscriptions';
  if (desc.includes('insurance') || desc.includes('seguro')) return 'insurance';
  if (desc.includes('transfer') || desc.includes('transferencia')) return 'transfers';
  if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('walmart') || desc.includes('costco') || desc.includes('supermercado')) return 'groceries';
  if (desc.includes('restaurant') || desc.includes('food') || desc.includes('uber eats') || desc.includes('doordash') || desc.includes('rappi')) return 'restaurants';
  if (desc.includes('uber') || desc.includes('fuel') || desc.includes('parking') || desc.includes('transit') || desc.includes('gasolina')) return 'transportation';
  if (desc.includes('hospital') || desc.includes('doctor') || desc.includes('pharmacy') || desc.includes('farmacia') || desc.includes('salud')) return 'healthcare';
  return 'other';
}

export function CategoryTrendsChart() {
  const { language } = useLanguage();
  const { data: transactions } = useBankTransactions();
  const { data: expenses } = useExpenses();
  const { formatCurrency: fc } = useFormatCurrency();
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');

  const { chartData, categories, categoryTrends, momComparison } = useMemo(() => {
    // Unify data sources
    const items: { date: string; amount: number; category: string }[] = [];
    
    // Expenses with their categories
    expenses?.forEach(e => {
      if (!e.deleted_at) {
        items.push({
          date: e.date,
          amount: Math.abs(Number(e.amount)),
          category: e.category || 'other'
        });
      }
    });

    // Bank transactions not matched to expenses
    transactions?.forEach(t => {
      if (!t.matched_expense_id) {
        items.push({
          date: t.transaction_date,
          amount: Math.abs(Number(t.amount)),
          category: detectCategory(t.description || '')
        });
      }
    });

    if (items.length === 0) return { chartData: [], categories: [], categoryTrends: {}, momComparison: [] };

    // Last 6 months
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

    const monthlyData: Record<string, Record<string, number>> = {};
    const allCategories = new Set<string>();

    items.forEach(item => {
      const monthKey = format(parseISO(item.date), 'yyyy-MM');
      if (!monthlyData[monthKey]) monthlyData[monthKey] = {};
      allCategories.add(item.category);
      monthlyData[monthKey][item.category] = (monthlyData[monthKey][item.category] || 0) + item.amount;
    });

    const chartData: CategoryMonthData[] = months.map(month => {
      const data: CategoryMonthData = { month: month.key, monthLabel: month.label };
      allCategories.forEach(cat => { data[cat] = monthlyData[month.key]?.[cat] || 0; });
      return data;
    });

    // Trends
    const categoryTrends: Record<string, { trend: 'up' | 'down' | 'stable'; percentage: number }> = {};
    allCategories.forEach(cat => {
      const lastMonth = chartData[chartData.length - 1]?.[cat] as number || 0;
      const prevMonth = chartData[chartData.length - 2]?.[cat] as number || 0;
      if (prevMonth === 0) {
        categoryTrends[cat] = { trend: lastMonth > 0 ? 'up' : 'stable', percentage: 0 };
      } else {
        const change = ((lastMonth - prevMonth) / prevMonth) * 100;
        categoryTrends[cat] = { trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable', percentage: Math.abs(change) };
      }
    });

    // Top categories
    const categoryTotals = Array.from(allCategories).map(cat => ({
      category: cat,
      total: chartData.reduce((sum, d) => sum + (d[cat] as number || 0), 0),
    }));
    const topCategories = categoryTotals.sort((a, b) => b.total - a.total).slice(0, 6).map(c => c.category);

    // Month-over-month comparison (last 2 months) for top categories
    const momComparison = topCategories.map(cat => {
      const current = chartData[chartData.length - 1]?.[cat] as number || 0;
      const previous = chartData[chartData.length - 2]?.[cat] as number || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
      return { category: cat, current, previous, change };
    }).filter(c => c.current > 0 || c.previous > 0);

    return { chartData, categories: topCategories, categoryTrends, momComparison };
  }, [transactions, expenses, language]);

  if ((!transactions || transactions.length === 0) && (!expenses || expenses.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'es' ? 'Tendencias por Categoría' : 'Category Trends'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {language === 'es' ? 'Importa transacciones para ver tendencias' : 'Import transactions to see trends'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getCategoryLabel = (cat: string) => {
    const info = CATEGORY_LABELS[cat] || CATEGORY_LABELS.other;
    return `${info.icon} ${language === 'es' ? info.es : info.en}`;
  };

  const l = language === 'es';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {l ? 'Tendencias por Categoría' : 'Category Trends'}
            </CardTitle>
            <CardDescription>
              {l ? 'Gastos unificados (manual + banco) últimos 6 meses' : 'Unified spending (manual + bank) last 6 months'}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant={chartMode === 'area' ? 'default' : 'ghost'} className="h-7 w-7 p-0" onClick={() => setChartMode('area')}>
              <LineChartIcon className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant={chartMode === 'bar' ? 'default' : 'ghost'} className="h-7 w-7 p-0" onClick={() => setChartMode('bar')}>
              <BarChart3 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'area' ? (
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
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number, name: string) => [fc(value), getCategoryLabel(name)]}
                />
                {categories.map((cat, index) => (
                  <Area key={cat} type="monotone" dataKey={cat} name={cat}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    fill={`url(#gradient-${cat})`} strokeWidth={2} />
                ))}
              </AreaChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number, name: string) => [fc(value), getCategoryLabel(name)]}
                />
                {categories.map((cat, index) => (
                  <Bar key={cat} dataKey={cat} name={cat} stackId="a"
                    fill={CHART_COLORS[index % CHART_COLORS.length]} radius={index === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Month-over-month comparison table */}
        {momComparison.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {l ? 'Cambio mes a mes' : 'Month-over-month change'}
            </p>
            <div className="grid gap-1">
              {momComparison.slice(0, 4).map((item, idx) => {
                const info = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.other;
                return (
                  <div key={item.category} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{info.icon}</span>
                      <span className="text-xs font-medium">{l ? info.es : info.en}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{fc(item.current)}</span>
                      <div className={cn(
                        "flex items-center gap-0.5 text-xs font-medium min-w-[50px] justify-end",
                        item.change > 5 ? 'text-destructive' : item.change < -5 ? 'text-chart-4' : 'text-muted-foreground'
                      )}>
                        {item.change > 5 ? <TrendingUp className="h-3 w-3" /> : 
                         item.change < -5 ? <TrendingDown className="h-3 w-3" /> : 
                         <Minus className="h-3 w-3" />}
                        {Math.abs(item.change).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Badges */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, index) => {
            const trend = categoryTrends[cat];
            const info = CATEGORY_LABELS[cat] || CATEGORY_LABELS.other;
            return (
              <Badge key={cat} variant="outline" className="flex items-center gap-1 text-xs"
                style={{ borderColor: CHART_COLORS[index % CHART_COLORS.length] }}>
                <span>{info.icon}</span>
                <span>{l ? info.es : info.en}</span>
                {trend && (
                  <>
                    {trend.trend === 'up' && <TrendingUp className="h-3 w-3 text-destructive ml-1" />}
                    {trend.trend === 'down' && <TrendingDown className="h-3 w-3 text-chart-4 ml-1" />}
                    {trend.trend === 'stable' && <Minus className="h-3 w-3 text-muted-foreground ml-1" />}
                    {trend.percentage > 0 && (
                      <span className={cn('text-[10px]',
                        trend.trend === 'up' ? 'text-destructive' : trend.trend === 'down' ? 'text-chart-4' : 'text-muted-foreground'
                      )}>{trend.percentage.toFixed(0)}%</span>
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