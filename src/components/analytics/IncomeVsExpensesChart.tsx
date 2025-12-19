import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Minus } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const translations = {
  es: {
    title: 'Ingresos vs Gastos',
    description: 'Comparativa mensual de flujo de dinero',
    income: 'Ingresos',
    expenses: 'Gastos',
    balance: 'Balance',
    avgIncome: 'Promedio ingresos',
    avgExpenses: 'Promedio gastos',
    savingsRate: 'Tasa de ahorro',
    noData: 'Agrega ingresos y gastos para ver la comparativa'
  },
  en: {
    title: 'Income vs Expenses',
    description: 'Monthly cash flow comparison',
    income: 'Income',
    expenses: 'Expenses',
    balance: 'Balance',
    avgIncome: 'Avg income',
    avgExpenses: 'Avg expenses',
    savingsRate: 'Savings rate',
    noData: 'Add income and expenses to see the comparison'
  }
};

export function IncomeVsExpensesChart() {
  const { language } = useLanguage();
  const t = translations[language];
  const locale = language === 'es' ? es : enUS;
  
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: income = [], isLoading: incomeLoading } = useIncome();

  const isLoading = expensesLoading || incomeLoading;

  const chartData = useMemo(() => {
    const months: { month: string; date: Date; income: number; expenses: number; balance: number }[] = [];
    
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthIncome = income
        .filter(inc => {
          const incDate = new Date(inc.date);
          return incDate >= monthStart && incDate <= monthEnd;
        })
        .reduce((sum, inc) => sum + inc.amount, 0);
      
      const monthExpenses = expenses
        .filter(exp => {
          const expDate = new Date(exp.date);
          return expDate >= monthStart && expDate <= monthEnd;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      months.push({
        month: format(date, 'MMM yyyy', { locale }),
        date,
        income: monthIncome,
        expenses: monthExpenses,
        balance: monthIncome - monthExpenses
      });
    }
    
    return months;
  }, [income, expenses, locale]);

  const stats = useMemo(() => {
    const totalIncome = chartData.reduce((sum, m) => sum + m.income, 0);
    const totalExpenses = chartData.reduce((sum, m) => sum + m.expenses, 0);
    const avgIncome = totalIncome / chartData.length || 0;
    const avgExpenses = totalExpenses / chartData.length || 0;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    
    return { totalIncome, totalExpenses, avgIncome, avgExpenses, savingsRate };
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
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                {t.income}
              </span>
              <span className="font-medium text-green-500">{formatCurrency(data.income)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                {t.expenses}
              </span>
              <span className="font-medium text-red-500">{formatCurrency(data.expenses)}</span>
            </div>
            <div className="border-t pt-1 mt-1 flex items-center justify-between gap-4">
              <span>{t.balance}</span>
              <span className={`font-bold ${data.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(data.balance)}
              </span>
            </div>
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

  const hasData = chartData.some(m => m.income > 0 || m.expenses > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
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
              <TrendingUp className="h-5 w-5 text-primary" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-green-500 border-green-500/30">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {t.avgIncome}: {formatCurrency(stats.avgIncome)}
            </Badge>
            <Badge variant="outline" className="text-red-500 border-red-500/30">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              {t.avgExpenses}: {formatCurrency(stats.avgExpenses)}
            </Badge>
            <Badge 
              variant="outline" 
              className={stats.savingsRate >= 0 ? 'text-blue-500 border-blue-500/30' : 'text-orange-500 border-orange-500/30'}
            >
              {stats.savingsRate >= 20 ? <TrendingUp className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
              {t.savingsRate}: {stats.savingsRate.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={stats.avgIncome} stroke="hsl(var(--primary))" strokeDasharray="5 5" strokeOpacity={0.5} />
              <Bar 
                dataKey="income" 
                name={t.income}
                fill="hsl(142, 76%, 36%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="expenses" 
                name={t.expenses}
                fill="hsl(0, 84%, 60%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Monthly Balance Indicators */}
        <div className="mt-4 pt-4 border-t flex flex-wrap justify-center gap-2">
          {chartData.map((month, idx) => (
            <Badge 
              key={idx}
              variant="outline"
              className={month.balance >= 0 ? 'text-green-600 border-green-600/30' : 'text-red-600 border-red-600/30'}
            >
              {format(month.date, 'MMM', { locale })}: {month.balance >= 0 ? '+' : ''}{formatCurrency(month.balance)}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
