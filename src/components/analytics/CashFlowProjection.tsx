import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useIncome } from '@/hooks/data/useIncome';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Calendar, DollarSign, 
  AlertTriangle, CheckCircle, Target, Sparkles
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ProjectionData {
  month: string;
  monthLabel: string;
  projectedIncome: number;
  projectedExpenses: number;
  netCashFlow: number;
  cumulativeBalance: number;
  isProjected: boolean;
  confidence: number;
}

export function CashFlowProjection() {
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  
  const { data: allIncome, isLoading: incomeLoading } = useIncome();
  const { data: allExpenses, isLoading: expensesLoading } = useExpenses();
  
  const isLoading = incomeLoading || expensesLoading;
  
  const { projectionData, insights, historicalMonths } = useMemo(() => {
    if (!allIncome || !allExpenses) {
      return { projectionData: [], insights: null, historicalMonths: 0 };
    }
    
    const now = new Date();
    const currentMonth = startOfMonth(now);
    
    // Get historical data (last 6 months)
    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(currentMonth, i);
      const key = format(month, 'yyyy-MM');
      monthlyData[key] = { income: 0, expenses: 0 };
    }
    
    // Aggregate historical income
    allIncome.forEach(income => {
      const key = income.date.substring(0, 7);
      if (monthlyData[key]) {
        monthlyData[key].income += Number(income.amount);
      }
    });
    
    // Aggregate historical expenses
    allExpenses.forEach(expense => {
      const key = expense.date.substring(0, 7);
      if (monthlyData[key]) {
        monthlyData[key].expenses += Number(expense.amount);
      }
    });
    
    // Calculate averages and trends
    const historicalData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
    
    const validMonths = historicalData.filter(d => d.income > 0 || d.expenses > 0);
    const historicalCount = validMonths.length;
    
    const avgIncome = validMonths.length > 0 
      ? validMonths.reduce((sum, d) => sum + d.income, 0) / validMonths.length 
      : 0;
    const avgExpenses = validMonths.length > 0 
      ? validMonths.reduce((sum, d) => sum + d.expenses, 0) / validMonths.length 
      : 0;
    
    // Calculate trend (simple linear regression)
    let incomeTrend = 0;
    let expenseTrend = 0;
    
    if (validMonths.length >= 3) {
      const n = validMonths.length;
      const xMean = (n - 1) / 2;
      
      let incomeNumerator = 0;
      let expenseNumerator = 0;
      let denominator = 0;
      
      validMonths.forEach((d, i) => {
        const xDiff = i - xMean;
        incomeNumerator += xDiff * (d.income - avgIncome);
        expenseNumerator += xDiff * (d.expenses - avgExpenses);
        denominator += xDiff * xDiff;
      });
      
      if (denominator > 0) {
        incomeTrend = incomeNumerator / denominator;
        expenseTrend = expenseNumerator / denominator;
      }
    }
    
    // Get recurring income for projections
    const recurringIncome = allIncome.filter(i => 
      i.recurrence && i.recurrence !== 'one_time'
    );
    
    // Calculate monthly recurring income
    const getMonthlyRecurringAmount = (recurrence: string, amount: number) => {
      switch (recurrence) {
        case 'daily': return amount * 30;
        case 'weekly': return amount * 4.33;
        case 'biweekly': return amount * 2.17;
        case 'monthly': return amount;
        case 'quarterly': return amount / 3;
        case 'yearly': return amount / 12;
        default: return 0;
      }
    };
    
    const baseRecurringIncome = recurringIncome.reduce((sum, i) => {
      const endDate = i.recurrence_end_date ? new Date(i.recurrence_end_date) : null;
      if (endDate && endDate < now) return sum;
      return sum + getMonthlyRecurringAmount(i.recurrence!, Number(i.amount));
    }, 0);
    
    // Build projection data
    const data: ProjectionData[] = [];
    let cumulativeBalance = 0;
    
    // Add historical months
    historicalData.forEach((d, index) => {
      const monthDate = new Date(d.month + '-01');
      const netCashFlow = d.income - d.expenses;
      cumulativeBalance += netCashFlow;
      
      data.push({
        month: d.month,
        monthLabel: format(monthDate, 'MMM yy', { locale }),
        projectedIncome: d.income,
        projectedExpenses: d.expenses,
        netCashFlow,
        cumulativeBalance,
        isProjected: false,
        confidence: 100
      });
    });
    
    // Project future months
    for (let i = 1; i <= 12; i++) {
      const futureMonth = addMonths(currentMonth, i);
      const monthKey = format(futureMonth, 'yyyy-MM');
      
      // Apply trends with dampening for further months
      const trendDampening = Math.max(0.5, 1 - (i * 0.03));
      const projectedIncome = Math.max(0, 
        avgIncome + (baseRecurringIncome * 0.3) + (incomeTrend * i * trendDampening)
      );
      const projectedExpenses = Math.max(0, 
        avgExpenses + (expenseTrend * i * trendDampening)
      );
      
      const netCashFlow = projectedIncome - projectedExpenses;
      cumulativeBalance += netCashFlow;
      
      // Confidence decreases for further projections
      const confidence = Math.max(40, 95 - (i * 4));
      
      data.push({
        month: monthKey,
        monthLabel: format(futureMonth, 'MMM yy', { locale }),
        projectedIncome,
        projectedExpenses,
        netCashFlow,
        cumulativeBalance,
        isProjected: true,
        confidence
      });
    }
    
    // Calculate insights
    const projectedMonths = data.filter(d => d.isProjected);
    const totalProjectedIncome = projectedMonths.reduce((sum, d) => sum + d.projectedIncome, 0);
    const totalProjectedExpenses = projectedMonths.reduce((sum, d) => sum + d.projectedExpenses, 0);
    const avgMonthlySavings = (totalProjectedIncome - totalProjectedExpenses) / 12;
    const savingsRate = totalProjectedIncome > 0 
      ? ((totalProjectedIncome - totalProjectedExpenses) / totalProjectedIncome) * 100 
      : 0;
    
    const negativeMonths = projectedMonths.filter(d => d.netCashFlow < 0);
    const lowestBalance = Math.min(...projectedMonths.map(d => d.cumulativeBalance));
    const highestBalance = Math.max(...projectedMonths.map(d => d.cumulativeBalance));
    
    const endOfYearBalance = projectedMonths[11]?.cumulativeBalance || 0;
    
    return {
      projectionData: data,
      insights: {
        totalProjectedIncome,
        totalProjectedExpenses,
        avgMonthlySavings,
        savingsRate,
        negativeMonthsCount: negativeMonths.length,
        lowestBalance,
        highestBalance,
        endOfYearBalance,
        incomeTrend: incomeTrend > 50 ? 'up' : incomeTrend < -50 ? 'down' : 'stable',
        expenseTrend: expenseTrend > 50 ? 'up' : expenseTrend < -50 ? 'down' : 'stable'
      },
      historicalMonths: historicalCount
    };
  }, [allIncome, allExpenses, locale]);
  
  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const labels = {
    title: language === 'es' ? 'Proyección de Flujo de Caja' : 'Cash Flow Projection',
    subtitle: language === 'es' 
      ? 'Pronóstico a 12 meses basado en patrones históricos' 
      : '12-month forecast based on historical patterns',
    income: language === 'es' ? 'Ingresos' : 'Income',
    expenses: language === 'es' ? 'Gastos' : 'Expenses',
    balance: language === 'es' ? 'Balance Acumulado' : 'Cumulative Balance',
    projected: language === 'es' ? 'Proyectado' : 'Projected',
    historical: language === 'es' ? 'Histórico' : 'Historical',
    yearEndBalance: language === 'es' ? 'Balance a fin de año' : 'Year-end Balance',
    avgSavings: language === 'es' ? 'Ahorro Mensual Prom.' : 'Avg. Monthly Savings',
    savingsRate: language === 'es' ? 'Tasa de Ahorro' : 'Savings Rate',
    riskMonths: language === 'es' ? 'Meses en Riesgo' : 'Risk Months',
    incomeTrend: language === 'es' ? 'Tendencia Ingresos' : 'Income Trend',
    expenseTrend: language === 'es' ? 'Tendencia Gastos' : 'Expense Trend',
    confidence: language === 'es' ? 'Confianza' : 'Confidence',
    noData: language === 'es' 
      ? 'Agrega ingresos y gastos para ver proyecciones' 
      : 'Add income and expenses to see projections'
  };
  
  if (historicalMonths < 2) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {labels.title}
          </CardTitle>
          <CardDescription>{labels.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-center">{labels.noData}</p>
        </CardContent>
      </Card>
    );
  }
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0]?.payload as ProjectionData;
    
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">{label}</span>
          {data.isProjected && (
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              {labels.projected}
            </Badge>
          )}
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-emerald-500">{labels.income}:</span>
            <span className="font-medium">{formatCurrency(data.projectedIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-rose-500">{labels.expenses}:</span>
            <span className="font-medium">{formatCurrency(data.projectedExpenses)}</span>
          </div>
          <div className="border-t border-border pt-1 mt-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{labels.balance}:</span>
              <span className={`font-bold ${data.cumulativeBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatCurrency(data.cumulativeBalance)}
              </span>
            </div>
          </div>
          {data.isProjected && (
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>{labels.confidence}:</span>
              <span>{data.confidence}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const getTrendBadge = (trend: string, type: 'income' | 'expense') => {
    if (trend === 'up') {
      return type === 'income' ? (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          <TrendingUp className="h-3 w-3 mr-1" /> +
        </Badge>
      ) : (
        <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">
          <TrendingUp className="h-3 w-3 mr-1" /> +
        </Badge>
      );
    }
    if (trend === 'down') {
      return type === 'income' ? (
        <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">
          <TrendingDown className="h-3 w-3 mr-1" /> -
        </Badge>
      ) : (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          <TrendingDown className="h-3 w-3 mr-1" /> -
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        ≈
      </Badge>
    );
  };
  
  // Find the index where projection starts
  const projectionStartIndex = projectionData.findIndex(d => d.isProjected);
  
  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {labels.title}
            </CardTitle>
            <CardDescription>{labels.subtitle}</CardDescription>
          </div>
        </div>
        
        {/* Insight Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{labels.yearEndBalance}</div>
            <div className={`text-lg font-bold ${insights!.endOfYearBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatCurrency(insights!.endOfYearBalance)}
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{labels.avgSavings}</div>
            <div className={`text-lg font-bold ${insights!.avgMonthlySavings >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatCurrency(insights!.avgMonthlySavings)}
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{labels.savingsRate}</div>
            <div className={`text-lg font-bold ${insights!.savingsRate >= 20 ? 'text-emerald-500' : insights!.savingsRate >= 10 ? 'text-amber-500' : 'text-rose-500'}`}>
              {insights!.savingsRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{labels.riskMonths}</div>
            <div className="flex items-center gap-2">
              {insights!.negativeMonthsCount === 0 ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              <span className={`text-lg font-bold ${insights!.negativeMonthsCount === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {insights!.negativeMonthsCount}
              </span>
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{labels.incomeTrend}</div>
            {getTrendBadge(insights!.incomeTrend, 'income')}
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">{labels.expenseTrend}</div>
            {getTrendBadge(insights!.expenseTrend, 'expense')}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Projection start reference line */}
              {projectionStartIndex > 0 && (
                <ReferenceLine 
                  x={projectionData[projectionStartIndex]?.monthLabel}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="5 5"
                  label={{ 
                    value: labels.projected, 
                    position: 'top',
                    fontSize: 10,
                    fill: 'hsl(var(--primary))'
                  }}
                />
              )}
              
              <Area
                type="monotone"
                dataKey="projectedIncome"
                name={labels.income}
                stroke="hsl(var(--chart-2))"
                fill="url(#incomeGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="projectedExpenses"
                name={labels.expenses}
                stroke="hsl(var(--chart-1))"
                fill="url(#expenseGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="cumulativeBalance"
                name={labels.balance}
                stroke="hsl(var(--primary))"
                fill="url(#balanceGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend with projection indicator */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 bg-primary" />
            <span>{labels.historical}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 bg-primary" style={{ 
              background: 'repeating-linear-gradient(90deg, hsl(var(--primary)) 0px, hsl(var(--primary)) 4px, transparent 4px, transparent 8px)' 
            }} />
            <span>{labels.projected}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
