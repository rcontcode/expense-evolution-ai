import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, Percent, DollarSign } from 'lucide-react';
import { format, getMonth, getYear, startOfYear, endOfYear } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const translations = {
  es: {
    title: 'Año Actual vs Año Anterior',
    description: 'Comparativa de gastos entre años',
    currentYear: 'Año actual',
    previousYear: 'Año anterior',
    change: 'Cambio',
    total: 'Total',
    noData: 'Se necesitan datos de al menos 2 años',
    months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    moreSpending: 'más gasto',
    lessSpending: 'menos gasto',
    vsLastYear: 'vs año anterior'
  },
  en: {
    title: 'Current Year vs Previous Year',
    description: 'Expense comparison between years',
    currentYear: 'Current year',
    previousYear: 'Previous year',
    change: 'Change',
    total: 'Total',
    noData: 'Data from at least 2 years is needed',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    moreSpending: 'more spending',
    lessSpending: 'less spending',
    vsLastYear: 'vs last year'
  }
};

export function YearOverYearComparison() {
  const { language } = useLanguage();
  const t = translations[language];
  const locale = language === 'es' ? es : enUS;
  
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: income = [], isLoading: incomeLoading } = useIncome();

  const isLoading = expensesLoading || incomeLoading;

  const currentYear = getYear(new Date());
  const previousYear = currentYear - 1;

  const chartData = useMemo(() => {
    const months: { 
      month: string; 
      monthNum: number;
      currentYear: number; 
      previousYear: number;
      currentIncome: number;
      previousIncome: number;
    }[] = [];
    
    for (let i = 0; i < 12; i++) {
      // Current year expenses
      const currentYearExpenses = expenses
        .filter(e => {
          const date = new Date(e.date);
          return getYear(date) === currentYear && getMonth(date) === i;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      
      // Previous year expenses
      const prevYearExpenses = expenses
        .filter(e => {
          const date = new Date(e.date);
          return getYear(date) === previousYear && getMonth(date) === i;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      // Current year income
      const currentYearIncome = income
        .filter(inc => {
          const date = new Date(inc.date);
          return getYear(date) === currentYear && getMonth(date) === i;
        })
        .reduce((sum, inc) => sum + inc.amount, 0);

      // Previous year income
      const prevYearIncome = income
        .filter(inc => {
          const date = new Date(inc.date);
          return getYear(date) === previousYear && getMonth(date) === i;
        })
        .reduce((sum, inc) => sum + inc.amount, 0);
      
      months.push({
        month: t.months[i],
        monthNum: i,
        currentYear: currentYearExpenses,
        previousYear: prevYearExpenses,
        currentIncome: currentYearIncome,
        previousIncome: prevYearIncome
      });
    }
    
    return months;
  }, [expenses, income, currentYear, previousYear, t.months]);

  const stats = useMemo(() => {
    const currentMonth = getMonth(new Date());
    
    // YTD totals (up to current month)
    const currentYearTotal = chartData
      .filter(m => m.monthNum <= currentMonth)
      .reduce((sum, m) => sum + m.currentYear, 0);
    
    const previousYearTotal = chartData
      .filter(m => m.monthNum <= currentMonth)
      .reduce((sum, m) => sum + m.previousYear, 0);
    
    const difference = currentYearTotal - previousYearTotal;
    const percentChange = previousYearTotal > 0 
      ? ((difference / previousYearTotal) * 100) 
      : 0;
    
    // Income comparison
    const currentYearIncome = chartData
      .filter(m => m.monthNum <= currentMonth)
      .reduce((sum, m) => sum + m.currentIncome, 0);
    
    const previousYearIncome = chartData
      .filter(m => m.monthNum <= currentMonth)
      .reduce((sum, m) => sum + m.previousIncome, 0);
    
    const incomeChange = previousYearIncome > 0
      ? (((currentYearIncome - previousYearIncome) / previousYearIncome) * 100)
      : 0;
    
    return { 
      currentYearTotal, 
      previousYearTotal, 
      difference, 
      percentChange,
      currentYearIncome,
      previousYearIncome,
      incomeChange
    };
  }, [chartData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const current = payload.find((p: any) => p.dataKey === 'currentYear');
      const previous = payload.find((p: any) => p.dataKey === 'previousYear');
      
      const diff = (current?.value || 0) - (previous?.value || 0);
      const percentDiff = previous?.value > 0 
        ? ((diff / previous.value) * 100).toFixed(1) 
        : 'N/A';
      
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary" />
                {currentYear}
              </span>
              <span className="font-medium">{formatCurrency(current?.value || 0)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                {previousYear}
              </span>
              <span className="font-medium">{formatCurrency(previous?.value || 0)}</span>
            </div>
            {previous?.value > 0 && (
              <div className="border-t pt-1 mt-1 flex items-center justify-between gap-4">
                <span>{t.change}</span>
                <span className={`font-bold ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {diff > 0 ? '+' : ''}{percentDiff}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  const hasData = chartData.some(m => m.currentYear > 0 || m.previousYear > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t.noData}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={stats.percentChange > 0 ? 'text-red-500 border-red-500/30' : 'text-green-500 border-green-500/30'}
          >
            {stats.percentChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {stats.percentChange > 0 ? '+' : ''}{stats.percentChange.toFixed(1)}% {t.vsLastYear}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">{currentYear} (YTD)</p>
            <p className="text-lg font-bold">{formatCurrency(stats.currentYearTotal)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground mb-1">{previousYear} (YTD)</p>
            <p className="text-lg font-bold text-muted-foreground">{formatCurrency(stats.previousYearTotal)}</p>
          </div>
          <div className={`p-3 rounded-lg ${stats.difference > 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
            <p className="text-xs text-muted-foreground mb-1">{t.change}</p>
            <p className={`text-lg font-bold ${stats.difference > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {stats.difference > 0 ? '+' : ''}{formatCurrency(stats.difference)}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${stats.incomeChange >= 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Ingresos
            </p>
            <p className={`text-lg font-bold ${stats.incomeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.incomeChange >= 0 ? '+' : ''}{stats.incomeChange.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="currentYear" 
                name={`${currentYear}`}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="previousYear" 
                name={`${previousYear}`}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insight */}
        <div className={`p-3 rounded-lg border ${stats.percentChange > 5 ? 'bg-red-500/5 border-red-500/20' : stats.percentChange < -5 ? 'bg-green-500/5 border-green-500/20' : 'bg-muted'}`}>
          <div className="flex items-start gap-2">
            <Percent className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p className="text-sm">
              {language === 'es' 
                ? `Este año has gastado ${Math.abs(stats.percentChange).toFixed(1)}% ${stats.percentChange > 0 ? 'más' : 'menos'} que el año pasado en el mismo período.`
                : `This year you've spent ${Math.abs(stats.percentChange).toFixed(1)}% ${stats.percentChange > 0 ? 'more' : 'less'} than last year in the same period.`
              }
              {stats.incomeChange !== 0 && (
                <span className="ml-1">
                  {language === 'es'
                    ? `Tus ingresos ${stats.incomeChange >= 0 ? 'aumentaron' : 'disminuyeron'} ${Math.abs(stats.incomeChange).toFixed(1)}%.`
                    : `Your income ${stats.incomeChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(stats.incomeChange).toFixed(1)}%.`
                  }
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
