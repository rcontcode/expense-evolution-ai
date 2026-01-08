import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface YearTimelineChartProps {
  selectedMonth: number;
  onMonthSelect: (month: number) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export function YearTimelineChart({
  selectedMonth,
  onMonthSelect,
  selectedYear,
  onYearChange,
}: YearTimelineChartProps) {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  
  // Fetch data for the selected year
  const { data: expenses, isLoading: expensesLoading } = useExpenses({
    dateRange: {
      start: new Date(selectedYear, 0, 1),
      end: new Date(selectedYear, 11, 31),
    },
  });
  
  const { data: income, isLoading: incomeLoading } = useIncome({ year: selectedYear });
  
  const isLoading = expensesLoading || incomeLoading;
  
  // Calculate monthly data
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      income: 0,
      expenses: 0,
      balance: 0,
    }));
    
    // Aggregate expenses by month
    expenses?.forEach((expense) => {
      const date = new Date(expense.date);
      if (date.getFullYear() === selectedYear) {
        months[date.getMonth()].expenses += Number(expense.amount);
      }
    });
    
    // Aggregate income by month
    income?.forEach((inc) => {
      const date = new Date(inc.date);
      if (date.getFullYear() === selectedYear) {
        months[date.getMonth()].income += Number(inc.amount);
      }
    });
    
    // Calculate balance
    months.forEach((m) => {
      m.balance = m.income - m.expenses;
    });
    
    return months;
  }, [expenses, income, selectedYear]);
  
  // Find max value for scaling bars
  const maxValue = useMemo(() => {
    let max = 0;
    monthlyData.forEach((m) => {
      max = Math.max(max, m.income, m.expenses);
    });
    return max || 1;
  }, [monthlyData]);
  
  // Calculate yearly totals
  const yearlyTotals = useMemo(() => {
    const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
    const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
    const totalBalance = totalIncome - totalExpenses;
    const avgMonthlyIncome = totalIncome / 12;
    const avgMonthlyExpenses = totalExpenses / 12;
    const savingsRate = totalIncome > 0 ? ((totalBalance / totalIncome) * 100) : 0;
    
    // Find best and worst months
    let bestMonth = 0;
    let worstMonth = 0;
    let bestBalance = monthlyData[0]?.balance || 0;
    let worstBalance = monthlyData[0]?.balance || 0;
    
    monthlyData.forEach((m, i) => {
      if (m.balance > bestBalance) {
        bestBalance = m.balance;
        bestMonth = i;
      }
      if (m.balance < worstBalance) {
        worstBalance = m.balance;
        worstMonth = i;
      }
    });
    
    return {
      totalIncome,
      totalExpenses,
      totalBalance,
      avgMonthlyIncome,
      avgMonthlyExpenses,
      savingsRate,
      bestMonth,
      worstMonth,
    };
  }, [monthlyData]);
  
  const formatCurrency = (amount: number, compact = false) => {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: profile?.country === 'CL' ? 'CLP' : 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };
    
    if (compact && Math.abs(amount) >= 1000) {
      options.notation = 'compact';
    }
    
    return new Intl.NumberFormat(language === 'es' ? 'es-CL' : 'en-CA', options).format(amount);
  };
  
  const monthNames = language === 'es'
    ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const fullMonthNames = language === 'es'
    ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Generate year options (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Card className="border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">
              {language === 'es' ? 'Resumen del Año' : 'Year Overview'}
            </CardTitle>
          </div>
          
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onYearChange(selectedYear - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => onYearChange(Number(v))}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onYearChange(selectedYear + 1)}
              disabled={selectedYear >= currentYear}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Timeline bars */}
        <div className="grid grid-cols-12 gap-1 sm:gap-2">
          {monthlyData.map((data, index) => {
            const isSelected = index === selectedMonth;
            const isCurrent = index === currentMonth && selectedYear === currentYear;
            const isPositive = data.balance >= 0;
            const incomeHeight = maxValue > 0 ? (data.income / maxValue) * 100 : 0;
            const expenseHeight = maxValue > 0 ? (data.expenses / maxValue) * 100 : 0;
            const isFuture = selectedYear === currentYear && index > currentMonth;
            
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !isFuture && onMonthSelect(index)}
                    disabled={isFuture}
                    className={cn(
                      "relative flex flex-col items-center p-1 rounded-lg transition-all duration-200",
                      "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
                      isSelected && "bg-primary/10 ring-2 ring-primary shadow-lg shadow-primary/20",
                      isCurrent && !isSelected && "ring-1 ring-primary/50",
                      isFuture && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {/* Bars container */}
                    <div className="relative w-full h-16 sm:h-20 flex items-end justify-center gap-0.5">
                      {/* Income bar */}
                      <div
                        className={cn(
                          "w-2 sm:w-3 rounded-t transition-all duration-300",
                          "bg-gradient-to-t from-success/80 to-success/50"
                        )}
                        style={{ height: `${Math.max(incomeHeight, 4)}%` }}
                      />
                      {/* Expense bar */}
                      <div
                        className={cn(
                          "w-2 sm:w-3 rounded-t transition-all duration-300",
                          "bg-gradient-to-t from-destructive/80 to-destructive/50"
                        )}
                        style={{ height: `${Math.max(expenseHeight, 4)}%` }}
                      />
                    </div>
                    
                    {/* Month label */}
                    <span className={cn(
                      "text-[10px] sm:text-xs font-medium mt-1",
                      isSelected ? "text-primary" : "text-muted-foreground",
                      isCurrent && !isSelected && "text-primary/70"
                    )}>
                      {monthNames[index]}
                    </span>
                    
                    {/* Balance indicator */}
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-0.5",
                      data.income === 0 && data.expenses === 0
                        ? "bg-muted"
                        : isPositive ? "bg-success" : "bg-destructive"
                    )} />
                    
                    {/* Current month indicator */}
                    {isCurrent && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                        <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">{fullMonthNames[index]} {selectedYear}</p>
                    <p className="text-success">
                      {language === 'es' ? 'Ingresos' : 'Income'}: {formatCurrency(data.income)}
                    </p>
                    <p className="text-destructive">
                      {language === 'es' ? 'Gastos' : 'Expenses'}: {formatCurrency(data.expenses)}
                    </p>
                    <p className={cn("font-semibold", isPositive ? "text-success" : "text-destructive")}>
                      Balance: {formatCurrency(data.balance)}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-t from-success/80 to-success/50" />
            <span>{language === 'es' ? 'Ingresos' : 'Income'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-t from-destructive/80 to-destructive/50" />
            <span>{language === 'es' ? 'Gastos' : 'Expenses'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span>{language === 'es' ? 'Positivo' : 'Positive'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span>{language === 'es' ? 'Negativo' : 'Negative'}</span>
          </div>
        </div>
        
        {/* Year summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50">
          <div className="text-center p-2 rounded-lg bg-success/5">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {language === 'es' ? 'Total Ingresos' : 'Total Income'}
            </p>
            <p className="text-sm sm:text-base font-bold text-success">
              {isLoading ? '...' : formatCurrency(yearlyTotals.totalIncome, true)}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-destructive/5">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {language === 'es' ? 'Total Gastos' : 'Total Expenses'}
            </p>
            <p className="text-sm sm:text-base font-bold text-destructive">
              {isLoading ? '...' : formatCurrency(yearlyTotals.totalExpenses, true)}
            </p>
          </div>
          <div className={cn(
            "text-center p-2 rounded-lg",
            yearlyTotals.totalBalance >= 0 ? "bg-success/5" : "bg-destructive/5"
          )}>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {language === 'es' ? 'Balance Anual' : 'Year Balance'}
            </p>
            <p className={cn(
              "text-sm sm:text-base font-bold",
              yearlyTotals.totalBalance >= 0 ? "text-success" : "text-destructive"
            )}>
              {isLoading ? '...' : formatCurrency(yearlyTotals.totalBalance, true)}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-primary/5">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {language === 'es' ? 'Tasa Ahorro' : 'Savings Rate'}
            </p>
            <p className={cn(
              "text-sm sm:text-base font-bold",
              yearlyTotals.savingsRate >= 0 ? "text-primary" : "text-destructive"
            )}>
              {isLoading ? '...' : `${yearlyTotals.savingsRate.toFixed(1)}%`}
            </p>
          </div>
        </div>
        
        {/* Best/Worst month badges */}
        {!isLoading && (yearlyTotals.totalIncome > 0 || yearlyTotals.totalExpenses > 0) && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Badge 
              variant="outline" 
              className="bg-success/10 border-success/30 text-success cursor-pointer hover:bg-success/20"
              onClick={() => onMonthSelect(yearlyTotals.bestMonth)}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {language === 'es' ? 'Mejor' : 'Best'}: {fullMonthNames[yearlyTotals.bestMonth]}
            </Badge>
            <Badge 
              variant="outline" 
              className="bg-destructive/10 border-destructive/30 text-destructive cursor-pointer hover:bg-destructive/20"
              onClick={() => onMonthSelect(yearlyTotals.worstMonth)}
            >
              <TrendingDown className="h-3 w-3 mr-1" />
              {language === 'es' ? 'Peor' : 'Worst'}: {fullMonthNames[yearlyTotals.worstMonth]}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
