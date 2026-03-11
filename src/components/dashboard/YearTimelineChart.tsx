import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEntity } from '@/contexts/EntityContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { cn } from '@/lib/utils';
import { getCategoryLabelByLanguage } from '@/lib/constants/expense-categories';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Award,
  BarChart3,
  PiggyBank,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

// Hook to detect touch devices
const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    const check = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobile = window.innerWidth < 768;
      setIsTouch(hasTouch && isMobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  return isTouch;
};

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
  const { currentCurrency } = useEntity();
  const isTouchDevice = useIsTouchDevice();
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  
  // Fetch data for the selected year
  const { data: expenses, isLoading: expensesLoading } = useExpenses({
    dateRange: {
      start: new Date(selectedYear, 0, 1),
      end: new Date(selectedYear, 11, 31),
    },
  });
  
  const { data: income, isLoading: incomeLoading } = useIncome({ year: selectedYear });
  
  // Previous year for comparison
  const { data: prevExpenses } = useExpenses({
    dateRange: {
      start: new Date(selectedYear - 1, 0, 1),
      end: new Date(selectedYear - 1, 11, 31),
    },
  });
  const { data: prevIncome } = useIncome({ year: selectedYear - 1 });
  
  const isLoading = expensesLoading || incomeLoading;
  
  // Calculate monthly data
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      income: 0,
      expenses: 0,
      balance: 0,
    }));
    
    expenses?.forEach((expense) => {
      const date = new Date(expense.date);
      if (date.getFullYear() === selectedYear) {
        months[date.getMonth()].expenses += Number(expense.amount);
      }
    });
    
    income?.forEach((inc) => {
      const date = new Date(inc.date);
      if (date.getFullYear() === selectedYear) {
        months[date.getMonth()].income += Number(inc.amount);
      }
    });
    
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
  
  // Calculate yearly totals + deep analytics
  const analytics = useMemo(() => {
    const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
    const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
    const totalBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalBalance / totalIncome) * 100) : 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const activeMonths = selectedYear === currentYear ? currentMonth + 1 : 12;
    
    const avgMonthlyIncome = totalIncome / activeMonths;
    const avgMonthlyExpenses = totalExpenses / activeMonths;
    
    // Best/worst months
    let bestMonth = 0, worstMonth = 0;
    let bestBalance = -Infinity, worstBalance = Infinity;
    monthlyData.forEach((m, i) => {
      if (i < activeMonths && (m.income > 0 || m.expenses > 0)) {
        if (m.balance > bestBalance) { bestBalance = m.balance; bestMonth = i; }
        if (m.balance < worstBalance) { worstBalance = m.balance; worstMonth = i; }
      }
    });
    
    // Consistency: months with positive balance
    const positiveMonths = monthlyData.filter((m, i) => i < activeMonths && m.balance > 0).length;
    const consistencyRate = activeMonths > 0 ? (positiveMonths / activeMonths) * 100 : 0;
    
    // Spending trend (last 3 months vs first 3 months)
    const first3 = monthlyData.slice(0, Math.min(3, activeMonths)).reduce((s, m) => s + m.expenses, 0);
    const last3Start = Math.max(0, activeMonths - 3);
    const last3 = monthlyData.slice(last3Start, activeMonths).reduce((s, m) => s + m.expenses, 0);
    const spendingTrend = first3 > 0 ? ((last3 - first3) / first3) * 100 : 0;
    
    // Income trend
    const first3Inc = monthlyData.slice(0, Math.min(3, activeMonths)).reduce((s, m) => s + m.income, 0);
    const last3Inc = monthlyData.slice(last3Start, activeMonths).reduce((s, m) => s + m.income, 0);
    const incomeTrend = first3Inc > 0 ? ((last3Inc - first3Inc) / first3Inc) * 100 : 0;
    
    // Biggest expense month
    let biggestExpenseMonth = 0;
    let biggestExpenseAmount = 0;
    monthlyData.forEach((m, i) => {
      if (m.expenses > biggestExpenseAmount) {
        biggestExpenseAmount = m.expenses;
        biggestExpenseMonth = i;
      }
    });
    
    // Year-over-year comparison
    const prevTotalIncome = prevIncome?.reduce((s, inc) => s + Number(inc.amount), 0) || 0;
    const prevTotalExpenses = prevExpenses?.reduce((s, exp) => s + Number(exp.amount), 0) || 0;
    const yoyIncomeChange = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0;
    const yoyExpenseChange = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0;
    
    // Projection (annualized from active months)
    const projectedIncome = avgMonthlyIncome * 12;
    const projectedExpenses = avgMonthlyExpenses * 12;
    const projectedBalance = projectedIncome - projectedExpenses;
    
    // Top expense categories
    const categoryMap: Record<string, number> = {};
    expenses?.forEach(exp => {
      const cat = exp.category || 'other';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(exp.amount);
    });
    const topCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([key, amount]) => ({ name: getCategoryLabelByLanguage(key, language), amount, pct: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0 }));
    
    // Income sources diversity
    const sourceMap: Record<string, number> = {};
    income?.forEach(inc => {
      const src = inc.income_type || (language === 'es' ? 'Otro' : 'Other');
      sourceMap[src] = (sourceMap[src] || 0) + Number(inc.amount);
    });
    const incomeSources = Object.entries(sourceMap).length;
    
    // Achievements - only award savings achievements when expenses actually exist
    const achievements: { emoji: string; text: string }[] = [];
    const hasExpenseData = totalExpenses > 0;
    if (totalIncome > 0 && !hasExpenseData) {
      achievements.push({ emoji: '📝', text: language === 'es' ? 'Registra gastos para ver logros reales' : 'Add expenses to see real achievements' });
    }
    if (savingsRate >= 50 && hasExpenseData) achievements.push({ emoji: '🏆', text: language === 'es' ? 'Ahorro excepcional (+50%)' : 'Exceptional savings (+50%)' });
    else if (savingsRate >= 20 && hasExpenseData) achievements.push({ emoji: '🎯', text: language === 'es' ? 'Buen ahorrador (+20%)' : 'Good saver (+20%)' });
    if (consistencyRate >= 80 && hasExpenseData) achievements.push({ emoji: '🔥', text: language === 'es' ? 'Consistencia financiera' : 'Financial consistency' });
    if (incomeTrend > 10) achievements.push({ emoji: '📈', text: language === 'es' ? 'Ingresos en crecimiento' : 'Growing income' });
    if (spendingTrend < -10 && hasExpenseData) achievements.push({ emoji: '💪', text: language === 'es' ? 'Reducción de gastos' : 'Expense reduction' });
    if (incomeSources >= 3) achievements.push({ emoji: '🌐', text: language === 'es' ? 'Ingresos diversificados' : 'Diversified income' });
    if (positiveMonths >= activeMonths && activeMonths >= 3 && hasExpenseData) achievements.push({ emoji: '✨', text: language === 'es' ? 'Balance siempre positivo' : 'Always positive balance' });
    
    // Smart tip
    let tip = '';
    if (totalIncome > 0 && !hasExpenseData) {
      tip = language === 'es' ? 'Registra tus gastos para ver análisis de ahorro y tendencias reales.' : 'Add your expenses to see real savings analysis and trends.';
    } else if (savingsRate < 10 && totalIncome > 0 && hasExpenseData) {
      tip = language === 'es' ? 'Tu tasa de ahorro es baja. Intenta automatizar un 10% de cada ingreso.' : 'Your savings rate is low. Try automating 10% of each income.';
    } else if (spendingTrend > 20 && hasExpenseData) {
      tip = language === 'es' ? 'Tus gastos están aumentando rápidamente. Revisa las últimas categorías.' : 'Your spending is increasing rapidly. Review recent categories.';
    } else if (consistencyRate < 50 && hasExpenseData) {
      tip = language === 'es' ? 'Tienes meses irregulares. Un presupuesto mensual podría estabilizar tus finanzas.' : 'You have irregular months. A monthly budget could stabilize your finances.';
    } else if (savingsRate >= 30 && hasExpenseData) {
      tip = language === 'es' ? '¡Excelente ahorro! Considera invertir el excedente para generar rendimientos.' : 'Excellent savings! Consider investing the surplus for returns.';
    } else {
      tip = language === 'es' ? 'Vas por buen camino. Mantén el ritmo y revisa tus metas trimestralmente.' : 'You\'re on track. Keep the pace and review goals quarterly.';
    }
    
    return {
      totalIncome, totalExpenses, totalBalance, savingsRate,
      avgMonthlyIncome, avgMonthlyExpenses,
      bestMonth, worstMonth, bestBalance, worstBalance,
      positiveMonths, activeMonths, consistencyRate,
      spendingTrend, incomeTrend,
      biggestExpenseMonth, biggestExpenseAmount,
      yoyIncomeChange, yoyExpenseChange, prevTotalIncome, prevTotalExpenses,
      projectedIncome, projectedExpenses, projectedBalance,
      topCategories, incomeSources, achievements, tip,
    };
  }, [monthlyData, expenses, income, prevExpenses, prevIncome, selectedYear, language]);
  
  const formatCurrency = (amount: number, compact = false) => {
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currentCurrency,
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
  
  const currentMonthIdx = new Date().getMonth();
  const currentYearVal = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYearVal - i);

  const hasData = !isLoading && (analytics.totalIncome > 0 || analytics.totalExpenses > 0);

  const TrendBadge = ({ value, invert = false }: { value: number; invert?: boolean }) => {
    const isGood = invert ? value < 0 : value > 0;
    if (Math.abs(value) < 0.5) return null;
    return (
      <span className={cn(
        "text-[10px] font-semibold",
        isGood ? "text-success" : "text-destructive"
      )}>
        {value > 0 ? '↑' : '↓'}{Math.abs(value).toFixed(0)}%
      </span>
    );
  };

  return (
    <Card className="border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">
              {language === 'es' ? 'Resumen del Año' : 'Year Overview'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onYearChange(selectedYear - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={String(selectedYear)} onValueChange={(v) => onYearChange(Number(v))}>
              <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onYearChange(selectedYear + 1)} disabled={selectedYear >= currentYearVal}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-1 flex flex-col overflow-y-auto">
        {/* Mobile: Selected Month Info Banner */}
        {isTouchDevice && (
          <div className="sm:hidden p-3 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-primary">
                {fullMonthNames[selectedMonth]} {selectedYear}
              </span>
              <Badge variant="outline" className={cn(
                "text-[10px]",
                monthlyData[selectedMonth]?.balance >= 0 
                  ? "border-success/30 text-success" 
                  : "border-destructive/30 text-destructive"
              )}>
                {monthlyData[selectedMonth]?.balance >= 0 ? '+' : ''}
                {formatCurrency(monthlyData[selectedMonth]?.balance || 0, true)}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-1.5 rounded-lg bg-success/10">
                <ArrowUpRight className="h-3 w-3 text-success mx-auto mb-0.5" />
                <p className="text-[10px] text-muted-foreground">{language === 'es' ? 'Ingreso' : 'Income'}</p>
                <p className="text-xs font-bold text-success">{formatCurrency(monthlyData[selectedMonth]?.income || 0, true)}</p>
              </div>
              <div className="p-1.5 rounded-lg bg-destructive/10">
                <ArrowDownRight className="h-3 w-3 text-destructive mx-auto mb-0.5" />
                <p className="text-[10px] text-muted-foreground">{language === 'es' ? 'Gasto' : 'Expense'}</p>
                <p className="text-xs font-bold text-destructive">{formatCurrency(monthlyData[selectedMonth]?.expenses || 0, true)}</p>
              </div>
              <div className={cn("p-1.5 rounded-lg", monthlyData[selectedMonth]?.balance >= 0 ? "bg-success/10" : "bg-destructive/10")}>
                <TrendingUp className={cn("h-3 w-3 mx-auto mb-0.5", monthlyData[selectedMonth]?.balance >= 0 ? "text-success" : "text-destructive rotate-180")} />
                <p className="text-[10px] text-muted-foreground">Balance</p>
                <p className={cn("text-xs font-bold", monthlyData[selectedMonth]?.balance >= 0 ? "text-success" : "text-destructive")}>
                  {formatCurrency(monthlyData[selectedMonth]?.balance || 0, true)}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              👆 {language === 'es' ? 'Toca un mes para ver sus detalles' : 'Tap a month to see details'}
            </p>
          </div>
        )}

        {/* Timeline bars */}
        <div className="grid grid-cols-12 gap-0.5 sm:gap-1.5 overflow-hidden">
          {monthlyData.map((data, index) => {
            const isSelected = index === selectedMonth;
            const isCurrent = index === currentMonthIdx && selectedYear === currentYearVal;
            const isPositive = data.balance >= 0;
            const incomeHeight = maxValue > 0 ? (data.income / maxValue) * 100 : 0;
            const expenseHeight = maxValue > 0 ? (data.expenses / maxValue) * 100 : 0;
            const isFuture = selectedYear === currentYearVal && index > currentMonthIdx;
            
            const monthButton = (
              <button
                onClick={() => !isFuture && onMonthSelect(index)}
                onMouseEnter={() => !isTouchDevice && setHoveredMonth(index)}
                onMouseLeave={() => !isTouchDevice && setHoveredMonth(null)}
                disabled={isFuture}
                className={cn(
                  "relative flex flex-col items-center p-1 sm:p-1.5 rounded-lg transition-all duration-200 min-w-0",
                  "hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isSelected && "bg-primary/15 border-2 border-primary shadow-md",
                  isCurrent && !isSelected && "border border-primary/40",
                  !isSelected && !isCurrent && "border border-transparent",
                  isFuture && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className="relative w-full h-12 sm:h-16 lg:h-20 flex items-end justify-center gap-0.5">
                  <div className="w-1.5 sm:w-2.5 rounded-t transition-all duration-300 bg-gradient-to-t from-success/80 to-success/50"
                    style={{ height: `${Math.max(incomeHeight, 4)}%` }} />
                  <div className="w-1.5 sm:w-2.5 rounded-t transition-all duration-300 bg-gradient-to-t from-destructive/80 to-destructive/50"
                    style={{ height: `${Math.max(expenseHeight, 4)}%` }} />
                </div>
                <span className={cn(
                  "text-[9px] sm:text-[11px] font-medium mt-1 truncate w-full text-center",
                  isSelected ? "text-primary font-semibold" : "text-muted-foreground",
                  isCurrent && !isSelected && "text-primary/70"
                )}>{monthNames[index]}</span>
                <div className={cn(
                  "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-0.5 shrink-0",
                  data.income === 0 && data.expenses === 0 ? "bg-muted" : isPositive ? "bg-success" : "bg-destructive"
                )} />
                {isCurrent && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2">
                    <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary animate-pulse" />
                  </div>
                )}
              </button>
            );
            
            if (isTouchDevice) return <div key={index}>{monthButton}</div>;
            
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>{monthButton}</TooltipTrigger>
                <TooltipContent side="top" className="text-xs z-50">
                  <div className="space-y-1">
                    <p className="font-semibold">{fullMonthNames[index]} {selectedYear}</p>
                    <p className="text-success">{language === 'es' ? 'Ingresos' : 'Income'}: {formatCurrency(data.income)}</p>
                    <p className="text-destructive">{language === 'es' ? 'Gastos' : 'Expenses'}: {formatCurrency(data.expenses)}</p>
                    <p className={cn("font-semibold", isPositive ? "text-success" : "text-destructive")}>Balance: {formatCurrency(data.balance)}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="hidden sm:flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-t from-success/80 to-success/50" />
            <span>{language === 'es' ? 'Ingresos' : 'Income'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-t from-destructive/80 to-destructive/50" />
            <span>{language === 'es' ? 'Gastos' : 'Expenses'}</span>
          </div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success" /><span>{language === 'es' ? 'Positivo' : 'Positive'}</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive" /><span>{language === 'es' ? 'Negativo' : 'Negative'}</span></div>
        </div>
        <div className="flex sm:hidden items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-gradient-to-t from-success/80 to-success/50" /><span>{language === 'es' ? 'Ingr.' : 'Inc.'}</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-gradient-to-t from-destructive/80 to-destructive/50" /><span>{language === 'es' ? 'Gast.' : 'Exp.'}</span></div>
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-success" /><span>+</span></div>
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-destructive" /><span>-</span></div>
        </div>
        
        {/* ==================== ENRICHED ANALYTICS SECTION ==================== */}
        
        {/* Core KPIs - 2x3 grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-border/50">
          <div className="text-center p-2 rounded-lg bg-success/5">
            <p className="text-[10px] text-muted-foreground">{language === 'es' ? 'Ingresos Totales' : 'Total Income'}</p>
            <p className="text-sm font-bold text-success">{isLoading ? '...' : formatCurrency(analytics.totalIncome, true)}</p>
            {hasData && analytics.prevTotalIncome > 0 && <TrendBadge value={analytics.yoyIncomeChange} />}
          </div>
          <div className="text-center p-2 rounded-lg bg-destructive/5">
            <p className="text-[10px] text-muted-foreground">{language === 'es' ? 'Gastos Totales' : 'Total Expenses'}</p>
            <p className="text-sm font-bold text-destructive">{isLoading ? '...' : formatCurrency(analytics.totalExpenses, true)}</p>
            {hasData && analytics.prevTotalExpenses > 0 && <TrendBadge value={analytics.yoyExpenseChange} invert />}
          </div>
          <div className={cn("text-center p-2 rounded-lg", analytics.totalBalance >= 0 ? "bg-success/5" : "bg-destructive/5")}>
            <p className="text-[10px] text-muted-foreground">Balance</p>
            <p className={cn("text-sm font-bold", analytics.totalBalance >= 0 ? "text-success" : "text-destructive")}>
              {isLoading ? '...' : formatCurrency(analytics.totalBalance, true)}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-primary/5">
            <PiggyBank className="h-3.5 w-3.5 text-primary mx-auto mb-0.5" />
            <p className="text-[10px] text-muted-foreground">{language === 'es' ? 'Tasa Ahorro' : 'Savings Rate'}</p>
            <p className={cn("text-sm font-bold", analytics.savingsRate >= 20 ? "text-primary" : analytics.savingsRate >= 0 ? "text-warning" : "text-destructive")}>
              {isLoading ? '...' : `${analytics.savingsRate.toFixed(0)}%`}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-accent/30">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
            <p className="text-[10px] text-muted-foreground">{language === 'es' ? 'Prom. Ingreso/Mes' : 'Avg Income/Mo'}</p>
            <p className="text-sm font-bold text-foreground">{isLoading ? '...' : formatCurrency(analytics.avgMonthlyIncome, true)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-accent/30">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
            <p className="text-[10px] text-muted-foreground">{language === 'es' ? 'Prom. Gasto/Mes' : 'Avg Expense/Mo'}</p>
            <p className="text-sm font-bold text-foreground">{isLoading ? '...' : formatCurrency(analytics.avgMonthlyExpenses, true)}</p>
          </div>
        </div>

        {/* Consistency & Trends */}
        {hasData && (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-accent/20 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-semibold text-foreground">
                  {language === 'es' ? 'Consistencia' : 'Consistency'}
                </span>
              </div>
              <Progress value={analytics.consistencyRate} className="h-1.5 mb-1" />
              <p className="text-[10px] text-muted-foreground">
                {analytics.positiveMonths}/{analytics.activeMonths} {language === 'es' ? 'meses positivos' : 'positive months'}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-accent/20 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-semibold text-foreground">
                  {language === 'es' ? 'Tendencias' : 'Trends'}
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{language === 'es' ? 'Gastos' : 'Spending'}</span>
                  <TrendBadge value={analytics.spendingTrend} invert />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{language === 'es' ? 'Ingresos' : 'Income'}</span>
                  <TrendBadge value={analytics.incomeTrend} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Top Spending Categories */}
        {hasData && analytics.topCategories.length > 0 && (
          <div className="p-2.5 rounded-lg bg-accent/20 border border-border/30">
            <p className="text-[10px] font-semibold text-foreground mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              {language === 'es' ? 'Top Gastos por Categoría' : 'Top Spending Categories'}
            </p>
            <div className="space-y-1.5">
              {analytics.topCategories.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="text-foreground truncate">{cat.name}</span>
                      <span className="text-muted-foreground ml-1 shrink-0">{cat.pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-destructive/60 to-destructive/90 transition-all"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-foreground shrink-0">{formatCurrency(cat.amount, true)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Year-End Projection */}
        {hasData && selectedYear === currentYearVal && analytics.activeMonths < 12 && (
          <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary" />
              {language === 'es' ? `Proyección a Dic ${selectedYear}` : `Projection to Dec ${selectedYear}`}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] text-muted-foreground">{language === 'es' ? 'Ingreso Est.' : 'Est. Income'}</p>
                <p className="text-xs font-bold text-success">{formatCurrency(analytics.projectedIncome, true)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground">{language === 'es' ? 'Gasto Est.' : 'Est. Expense'}</p>
                <p className="text-xs font-bold text-destructive">{formatCurrency(analytics.projectedExpenses, true)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground">{language === 'es' ? 'Balance Est.' : 'Est. Balance'}</p>
                <p className={cn("text-xs font-bold", analytics.projectedBalance >= 0 ? "text-success" : "text-destructive")}>
                  {formatCurrency(analytics.projectedBalance, true)}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Achievements */}
        {hasData && analytics.achievements.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {analytics.achievements.map((ach, i) => (
              <Badge key={i} variant="outline" className="bg-primary/5 border-primary/20 text-foreground text-[10px] gap-1">
                {ach.emoji} {ach.text}
              </Badge>
            ))}
          </div>
        )}

        {/* Best/Worst month badges */}
        {hasData && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge 
              variant="outline" 
              className="bg-success/10 border-success/30 text-success cursor-pointer hover:bg-success/20 transition-all hover:scale-105"
              onClick={() => onMonthSelect(analytics.bestMonth)}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              🏆 {language === 'es' ? 'Mejor' : 'Best'}: {fullMonthNames[analytics.bestMonth]}
            </Badge>
            <Badge 
              variant="outline" 
              className="bg-destructive/10 border-destructive/30 text-destructive cursor-pointer hover:bg-destructive/20 transition-all hover:scale-105"
              onClick={() => onMonthSelect(analytics.worstMonth)}
            >
              <TrendingDown className="h-3 w-3 mr-1" />
              ⚠️ {language === 'es' ? 'Peor' : 'Worst'}: {fullMonthNames[analytics.worstMonth]}
            </Badge>
          </div>
        )}

        {/* Smart Tip */}
        {hasData && analytics.tip && (
          <div className="p-2.5 rounded-lg bg-gradient-to-r from-primary/5 to-accent/20 border border-primary/10 mt-auto">
            <p className="text-[10px] text-foreground flex items-start gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>{analytics.tip}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
