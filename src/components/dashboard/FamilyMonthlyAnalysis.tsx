import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Zap,
  Target,
  Flame,
  Trophy,
  Clock,
  Brain,
  Eye,
  ChevronDown,
  ChevronUp,
  Activity,
  Percent,
  DollarSign,
  CalendarDays,
  Sun,
  Moon,
  Coffee,
  Utensils,
  ShoppingBag,
  Waves
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  ReferenceLine,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { getCategoryLabelByLanguage, ExpenseCategory } from '@/lib/constants/expense-categories';

// Category color palette - vibrant 3D-like colors
const CATEGORY_COLORS: Record<string, string> = {
  meals: '#f97316',
  travel: '#3b82f6',
  equipment: '#8b5cf6',
  software: '#06b6d4',
  fuel: '#ef4444',
  home_office: '#10b981',
  professional_services: '#6366f1',
  office_supplies: '#f59e0b',
  utilities: '#14b8a6',
  advertising: '#ec4899',
  materials: '#84cc16',
  other: '#64748b',
  income: '#22c55e',
};

interface FamilyMonthlyAnalysisProps {
  year: number;
  month: number;
}

export function FamilyMonthlyAnalysis({ year, month }: FamilyMonthlyAnalysisProps) {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showTrends, setShowTrends] = useState(true);
  const [showPatterns, setShowPatterns] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState(false);
  
  // Previous month date range for comparison
  const prevMonthRange = useMemo(() => {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const start = new Date(prevYear, prevMonth, 1);
    const end = new Date(prevYear, prevMonth + 1, 0);
    return { start, end, month: prevMonth, year: prevYear };
  }, [year, month]);
  
  // Date ranges
  const dateRange = useMemo(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
  }, [year, month]);
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Fetch data
  const { data: expenses } = useExpenses({ dateRange });
  const { data: income } = useIncome({ year, month: month + 1 });
  const { data: prevExpenses } = useExpenses({ dateRange: { start: prevMonthRange.start, end: prevMonthRange.end } });
  const { data: prevIncome } = useIncome({ year: prevMonthRange.year, month: prevMonthRange.month + 1 });
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CL' : 'en-CA', {
      style: 'currency',
      currency: profile?.country === 'CL' ? 'CLP' : 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Process daily data
  const dailyData = useMemo(() => {
    const data: Record<number, { 
      expenses: Record<string, number>; 
      income: number; 
      total: number;
      items: any[];
    }> = {};
    
    // Initialize all days
    for (let d = 1; d <= daysInMonth; d++) {
      data[d] = { expenses: {}, income: 0, total: 0, items: [] };
    }
    
    // Add expenses
    expenses?.forEach(expense => {
      const day = new Date(expense.date).getDate();
      const cat = expense.category || 'other';
      if (data[day]) {
        data[day].expenses[cat] = (data[day].expenses[cat] || 0) + Number(expense.amount);
        data[day].total += Number(expense.amount);
        data[day].items.push({ type: 'expense', ...expense });
      }
    });
    
    // Add income
    income?.forEach(inc => {
      const day = new Date(inc.date).getDate();
      if (data[day]) {
        data[day].income += Number(inc.amount);
        data[day].items.push({ type: 'income', ...inc });
      }
    });
    
    return data;
  }, [expenses, income, daysInMonth]);
  
  // Chart data with stacked categories
  const chartData = useMemo(() => {
    const categories = new Set<string>();
    expenses?.forEach(e => categories.add(e.category || 'other'));
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayData = dailyData[day];
      const weekDay = new Date(year, month, day).getDay();
      const isWeekend = weekDay === 0 || weekDay === 6;
      
      return {
        day,
        dayLabel: day.toString(),
        isWeekend,
        isWeekStart: weekDay === 1,
        income: dayData.income,
        totalExpense: dayData.total,
        net: dayData.income - dayData.total,
        ...dayData.expenses,
      };
    });
  }, [dailyData, daysInMonth, year, month]);
  
  // Get all unique categories
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    expenses?.forEach(e => cats.add(e.category || 'other'));
    return Array.from(cats);
  }, [expenses]);
  
  // Calculate week summaries
  const weekSummaries = useMemo(() => {
    const weeks: { weekNum: number; startDay: number; endDay: number; expenses: number; income: number }[] = [];
    let currentWeek = 1;
    let weekStart = 1;
    let weekExpenses = 0;
    let weekIncome = 0;
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(year, month, d).getDay();
      weekExpenses += dailyData[d].total;
      weekIncome += dailyData[d].income;
      
      if (dayOfWeek === 0 || d === daysInMonth) {
        weeks.push({
          weekNum: currentWeek,
          startDay: weekStart,
          endDay: d,
          expenses: weekExpenses,
          income: weekIncome,
        });
        currentWeek++;
        weekStart = d + 1;
        weekExpenses = 0;
        weekIncome = 0;
      }
    }
    
    return weeks;
  }, [dailyData, daysInMonth, year, month]);
  
  // Heatmap data (7x5 grid for week days)
  const heatmapData = useMemo(() => {
    const grid: { day: number; weekDay: number; week: number; amount: number; intensity: number }[] = [];
    const maxAmount = Math.max(...Object.values(dailyData).map(d => d.total), 1);
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const weekDay = date.getDay();
      const week = Math.ceil((d + new Date(year, month, 1).getDay()) / 7);
      grid.push({
        day: d,
        weekDay,
        week,
        amount: dailyData[d].total,
        intensity: dailyData[d].total / maxAmount,
      });
    }
    
    return grid;
  }, [dailyData, daysInMonth, year, month]);
  
  // Time-of-day patterns (mock based on categories - in real app would use time data)
  const timePatterns = useMemo(() => {
    const patterns = {
      morning: { amount: 0, categories: {} as Record<string, number> },
      afternoon: { amount: 0, categories: {} as Record<string, number> },
      evening: { amount: 0, categories: {} as Record<string, number> },
    };
    
    // Simulate time patterns based on categories
    expenses?.forEach(e => {
      const cat = e.category || 'other';
      const amount = Number(e.amount);
      
      // Heuristic: meals in morning/evening, travel in morning, etc.
      if (cat === 'meals') {
        patterns.morning.amount += amount * 0.3;
        patterns.evening.amount += amount * 0.7;
        patterns.morning.categories[cat] = (patterns.morning.categories[cat] || 0) + amount * 0.3;
        patterns.evening.categories[cat] = (patterns.evening.categories[cat] || 0) + amount * 0.7;
      } else if (cat === 'fuel' || cat === 'travel') {
        patterns.morning.amount += amount * 0.6;
        patterns.afternoon.amount += amount * 0.4;
        patterns.morning.categories[cat] = (patterns.morning.categories[cat] || 0) + amount * 0.6;
        patterns.afternoon.categories[cat] = (patterns.afternoon.categories[cat] || 0) + amount * 0.4;
      } else {
        patterns.afternoon.amount += amount;
        patterns.afternoon.categories[cat] = (patterns.afternoon.categories[cat] || 0) + amount;
      }
    });
    
    return patterns;
  }, [expenses]);
  
  // Previous month comparison
  const monthComparison = useMemo(() => {
    const currentTotal = expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;
    const prevTotal = prevExpenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;
    const currentIncome = income?.reduce((s, i) => s + Number(i.amount), 0) || 0;
    const prevIncomeTotal = prevIncome?.reduce((s, i) => s + Number(i.amount), 0) || 0;
    
    const expenseChange = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
    const incomeChange = prevIncomeTotal > 0 ? ((currentIncome - prevIncomeTotal) / prevIncomeTotal) * 100 : 0;
    
    // Category comparison
    const currentCats: Record<string, number> = {};
    const prevCats: Record<string, number> = {};
    
    expenses?.forEach(e => {
      const cat = e.category || 'other';
      currentCats[cat] = (currentCats[cat] || 0) + Number(e.amount);
    });
    
    prevExpenses?.forEach(e => {
      const cat = e.category || 'other';
      prevCats[cat] = (prevCats[cat] || 0) + Number(e.amount);
    });
    
    const categoryChanges = Object.keys({ ...currentCats, ...prevCats }).map(cat => ({
      category: cat,
      current: currentCats[cat] || 0,
      previous: prevCats[cat] || 0,
      change: prevCats[cat] ? ((currentCats[cat] || 0) - prevCats[cat]) / prevCats[cat] * 100 : 100,
    })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    
    return {
      expenseChange,
      incomeChange,
      categoryChanges,
      currentTotal,
      prevTotal,
      currentIncome,
      prevIncomeTotal,
    };
  }, [expenses, prevExpenses, income, prevIncome]);
  
  // Analytics & Insights (enhanced)
  const insights = useMemo(() => {
    const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;
    const totalIncome = income?.reduce((s, i) => s + Number(i.amount), 0) || 0;
    const avgDailyExpense = totalExpenses / daysInMonth;
    
    // Find spending patterns
    const categoryTotals: Record<string, number> = {};
    expenses?.forEach(e => {
      const cat = e.category || 'other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount);
    });
    
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0];
    const bottomCategories = sortedCategories.slice(-3);
    
    // Weekend vs weekday spending
    let weekendSpending = 0;
    let weekdaySpending = 0;
    let weekendDays = 0;
    let weekdayDaysCount = 0;
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(year, month, d).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendSpending += dailyData[d].total;
        weekendDays++;
      } else {
        weekdaySpending += dailyData[d].total;
        weekdayDaysCount++;
      }
    }
    
    const avgWeekendSpending = weekendDays > 0 ? weekendSpending / weekendDays : 0;
    const avgWeekdaySpending = weekdayDaysCount > 0 ? weekdaySpending / weekdayDaysCount : 0;
    
    // High spending days
    const highSpendingDays = Object.entries(dailyData)
      .filter(([_, data]) => data.total > avgDailyExpense * 2)
      .map(([day]) => parseInt(day));
    
    // Zero spending days
    const zeroSpendingDays = Object.entries(dailyData)
      .filter(([_, data]) => data.total === 0)
      .map(([day]) => parseInt(day));
    
    // Streak analysis
    let currentStreak = 0;
    let bestStreak = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (dailyData[d].total <= avgDailyExpense) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    // Spending velocity (how fast money is being spent)
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;
    const spentSoFar = Object.entries(dailyData)
      .filter(([day]) => parseInt(day) <= currentDay)
      .reduce((sum, [_, data]) => sum + data.total, 0);
    const projectedTotal = (spentSoFar / currentDay) * daysInMonth;
    
    // Category diversity score (how spread out spending is)
    const totalCats = Object.keys(categoryTotals).length;
    const maxCatPct = topCategory ? (topCategory[1] / totalExpenses) * 100 : 0;
    const diversityScore = totalCats > 0 ? Math.round((1 - (maxCatPct / 100)) * totalCats * 10) : 0;
    
    return {
      totalExpenses,
      totalIncome,
      avgDailyExpense,
      topCategory,
      bottomCategories,
      weekendSpending,
      weekdaySpending,
      avgWeekendSpending,
      avgWeekdaySpending,
      highSpendingDays,
      zeroSpendingDays,
      bestStreak,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0,
      projectedTotal,
      diversityScore,
      categoryCount: totalCats,
    };
  }, [expenses, income, dailyData, daysInMonth, year, month]);
  
  // Radar chart data for spending patterns
  const radarData = useMemo(() => {
    const categories = ['meals', 'travel', 'fuel', 'utilities', 'software', 'equipment'];
    return categories.map(cat => ({
      category: getCategoryLabelByLanguage(cat as ExpenseCategory, language as 'es' | 'en'),
      current: allCategories.includes(cat) ? (chartData.reduce((s, d) => s + (d[cat] || 0), 0)) : 0,
      fullMark: insights.totalExpenses * 0.4,
    }));
  }, [chartData, allCategories, insights.totalExpenses, language]);
  
  // Pie chart data for category distribution
  const pieData = useMemo(() => {
    return allCategories.map(cat => ({
      name: getCategoryLabelByLanguage(cat as ExpenseCategory, language as 'es' | 'en'),
      value: chartData.reduce((s, d) => s + (d[cat] || 0), 0),
      color: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other,
    })).filter(d => d.value > 0);
  }, [chartData, allCategories, language]);
  
  // Trend data for the month
  const trendData = useMemo(() => {
    let cumulative = 0;
    let cumulativeIncome = 0;
    
    return chartData.map(d => {
      cumulative += d.totalExpense;
      cumulativeIncome += d.income;
      return {
        day: d.day,
        cumulative,
        cumulativeIncome,
        net: cumulativeIncome - cumulative,
        projected: (insights.avgDailyExpense * d.day),
        isWeekend: d.isWeekend,
      };
    });
  }, [chartData, insights.avgDailyExpense]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    
    const dayData = dailyData[parseInt(label)];
    if (!dayData) return null;
    
    const dayOfWeek = new Date(year, month, parseInt(label)).toLocaleDateString(
      language === 'es' ? 'es-ES' : 'en-US', 
      { weekday: 'long' }
    );
    
    return (
      <div className="bg-popover/95 backdrop-blur-sm border rounded-xl p-3 shadow-xl min-w-[220px]">
        <p className="font-bold text-sm mb-2 flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {dayOfWeek}, {label}
        </p>
        
        {dayData.income > 0 && (
          <div className="flex items-center gap-2 text-success mb-2 p-1.5 rounded-lg bg-success/10">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium">{language === 'es' ? 'Ingreso' : 'Income'}</span>
            <span className="ml-auto font-bold">{formatCurrency(dayData.income)}</span>
          </div>
        )}
        
        {Object.entries(dayData.expenses).length > 0 && (
          <div className="space-y-1">
            {Object.entries(dayData.expenses).map(([cat, amount]) => (
              <div key={cat} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other }}
                />
                <span className="truncate">{getCategoryLabelByLanguage(cat as ExpenseCategory, language as 'es' | 'en')}</span>
                <span className="ml-auto font-medium">{formatCurrency(amount as number)}</span>
              </div>
            ))}
          </div>
        )}
        
        {dayData.total > 0 && (
          <div className="mt-2 pt-2 border-t flex justify-between text-sm font-bold">
            <span className="text-muted-foreground">{language === 'es' ? 'Total Gastos' : 'Total Expenses'}</span>
            <span className="text-destructive">{formatCurrency(dayData.total)}</span>
          </div>
        )}
        
        <div className="mt-1 pt-1 border-t flex justify-between text-sm font-bold">
          <span className="text-muted-foreground">{language === 'es' ? 'Neto' : 'Net'}</span>
          <span className={dayData.income - dayData.total >= 0 ? 'text-success' : 'text-destructive'}>
            {formatCurrency(dayData.income - dayData.total)}
          </span>
        </div>
      </div>
    );
  };
  
  const monthNames = language === 'es'
    ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const weekDayNames = language === 'es'
    ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-lg shadow-emerald-500/30"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Calendar className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 flex-wrap">
                👨‍👩‍👧 {language === 'es' ? 'Análisis Familiar Completo' : 'Complete Family Analysis'}
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px]">
                  {monthNames[month]}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {language === 'es' ? 'IA analiza patrones, tendencias y oportunidades' : 'AI analyzes patterns, trends and opportunities'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant={showTrends ? "default" : "outline"}
              onClick={() => setShowTrends(!showTrends)}
              className="gap-1 text-xs h-8"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {language === 'es' ? 'Tendencias' : 'Trends'}
            </Button>
            <Button
              size="sm"
              variant={showHeatmap ? "default" : "outline"}
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="gap-1 text-xs h-8"
            >
              <Waves className="h-3.5 w-3.5" />
              Heatmap
            </Button>
            <Button
              size="sm"
              variant={showPatterns ? "default" : "outline"}
              onClick={() => setShowPatterns(!showPatterns)}
              className="gap-1 text-xs h-8"
            >
              <Brain className="h-3.5 w-3.5" />
              {language === 'es' ? 'Patrones' : 'Patterns'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Month Comparison Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 p-3 rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-primary/10 border border-primary/20"
        >
          <div className="flex-1 min-w-[120px]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {language === 'es' ? 'vs Mes Anterior' : 'vs Previous Month'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-lg font-bold flex items-center gap-1",
                monthComparison.expenseChange <= 0 ? "text-success" : "text-destructive"
              )}>
                {monthComparison.expenseChange <= 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                {Math.abs(monthComparison.expenseChange).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {language === 'es' ? 'gastos' : 'expenses'}
              </span>
            </div>
          </div>
          
          <div className="w-px bg-border" />
          
          <div className="flex-1 min-w-[120px]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {language === 'es' ? 'Proyección Mes' : 'Month Projection'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold">{formatCurrency(insights.projectedTotal)}</span>
              {insights.projectedTotal > insights.totalIncome && (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
          </div>
          
          <div className="w-px bg-border" />
          
          <div className="flex-1 min-w-[120px]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {language === 'es' ? 'Diversidad Gasto' : 'Spending Diversity'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold">{insights.diversityScore}/10</span>
              <span className="text-xs text-muted-foreground">
                {insights.categoryCount} {language === 'es' ? 'categorías' : 'categories'}
              </span>
            </div>
          </div>
        </motion.div>
        
        {/* Week Summary Bar */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weekSummaries.map((week, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "flex-1 min-w-[85px] p-2.5 rounded-xl text-center text-xs border transition-all cursor-pointer hover:scale-105",
                week.income > week.expenses 
                  ? "bg-gradient-to-br from-success/10 to-emerald-500/10 border-success/30 hover:shadow-lg hover:shadow-success/20" 
                  : "bg-gradient-to-br from-destructive/10 to-red-500/10 border-destructive/30 hover:shadow-lg hover:shadow-destructive/20"
              )}
            >
              <p className="font-bold">
                {language === 'es' ? 'Semana' : 'Week'} {week.weekNum}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {week.startDay}-{week.endDay} {monthNames[month].slice(0, 3)}
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-success text-[10px]">+{formatCurrency(week.income)}</p>
                <p className="text-destructive text-[10px]">-{formatCurrency(week.expenses)}</p>
              </div>
              <p className={cn(
                "font-bold text-sm mt-1 pt-1 border-t",
                week.income > week.expenses ? "text-success border-success/30" : "text-destructive border-destructive/30"
              )}>
                {formatCurrency(week.income - week.expenses)}
              </p>
            </motion.div>
          ))}
        </div>
        
        {/* Daily Stacked Bar Chart with Net Line */}
        <div className="h-[220px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} barCategoryGap="10%">
              <defs>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 9 }}
                tickFormatter={(v, i) => {
                  const item = chartData[i];
                  if (item?.isWeekStart && v > 1) return `📅${v}`;
                  return item?.isWeekend ? `🌙${v}` : v;
                }}
              />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <RechartsTooltip content={<CustomTooltip />} />
              
              {/* Week separators */}
              {chartData.filter(d => d.isWeekStart && d.day > 1).map(d => (
                <ReferenceLine 
                  key={d.day} 
                  x={d.day} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                  strokeWidth={2}
                />
              ))}
              
              {/* Income bar */}
              <Bar dataKey="income" stackId="pos" radius={[4, 4, 0, 0]} name={language === 'es' ? 'Ingresos' : 'Income'}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`income-${index}`} 
                    fill={CATEGORY_COLORS.income}
                    fillOpacity={entry.isWeekend ? 0.6 : 1}
                    className="drop-shadow-sm"
                  />
                ))}
              </Bar>
              
              {/* Category expense bars */}
              {allCategories.map((cat, catIndex) => (
                <Bar 
                  key={cat} 
                  dataKey={cat} 
                  stackId="neg" 
                  radius={catIndex === allCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  name={getCategoryLabelByLanguage(cat as ExpenseCategory, language as 'es' | 'en')}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`${cat}-${index}`} 
                      fill={CATEGORY_COLORS[cat] || CATEGORY_COLORS.other}
                      fillOpacity={entry.isWeekend ? 0.6 : 1}
                      className="drop-shadow-sm"
                    />
                  ))}
                </Bar>
              ))}
              
              {/* Net balance line */}
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="url(#netGradient)" 
                strokeWidth={2}
                dot={false}
                name={language === 'es' ? 'Balance Neto' : 'Net Balance'}
              />
            </ComposedChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CATEGORY_COLORS.income }} />
              <span className="text-[10px] font-medium">{language === 'es' ? 'Ingresos' : 'Income'}</span>
            </div>
            {allCategories.slice(0, 6).map(cat => (
              <div key={cat} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other }} />
                <span className="text-[10px]">{getCategoryLabelByLanguage(cat as ExpenseCategory, language as 'es' | 'en')}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Heatmap View */}
        <AnimatePresence>
          {showHeatmap && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{language === 'es' ? 'Mapa de Calor Semanal' : 'Weekly Heatmap'}</span>
              </div>
              
              <div className="p-4 rounded-xl bg-muted/30 border">
                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDayNames.map((day, i) => (
                    <div key={i} className="text-center text-[10px] font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Heatmap grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square rounded-lg bg-transparent" />
                  ))}
                  
                  {/* Day cells */}
                  {heatmapData.map((cell) => (
                    <Tooltip key={cell.day}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: cell.day * 0.02 }}
                          className={cn(
                            "aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-110 hover:z-10",
                            cell.intensity === 0 
                              ? "bg-success/20 border border-success/30"
                              : cell.intensity < 0.3 
                                ? "bg-emerald-500/30" 
                                : cell.intensity < 0.6 
                                  ? "bg-amber-500/40"
                                  : cell.intensity < 0.8 
                                    ? "bg-orange-500/50"
                                    : "bg-red-500/60 animate-pulse"
                          )}
                          onClick={() => setSelectedDay(cell.day === selectedDay ? null : cell.day)}
                        >
                          <span className="text-[10px] font-bold">{cell.day}</span>
                          {cell.amount > 0 && (
                            <span className="text-[8px] font-medium">
                              ${Math.round(cell.amount / 1000)}k
                            </span>
                          )}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-bold">{language === 'es' ? 'Día' : 'Day'} {cell.day}</p>
                        <p>{formatCurrency(cell.amount)}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                
                {/* Heatmap legend */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="text-[10px] text-muted-foreground">{language === 'es' ? 'Menos' : 'Less'}</span>
                  <div className="flex gap-0.5">
                    <div className="w-4 h-4 rounded bg-success/20" />
                    <div className="w-4 h-4 rounded bg-emerald-500/30" />
                    <div className="w-4 h-4 rounded bg-amber-500/40" />
                    <div className="w-4 h-4 rounded bg-orange-500/50" />
                    <div className="w-4 h-4 rounded bg-red-500/60" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{language === 'es' ? 'Más' : 'More'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Trends Chart */}
        <AnimatePresence>
          {showTrends && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{language === 'es' ? 'Tendencia Acumulada con Balance Neto' : 'Cumulative Trend with Net Balance'}</span>
              </div>
              
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      labelFormatter={(label) => `${language === 'es' ? 'Día' : 'Day'} ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativeIncome" 
                      stroke="#22c55e" 
                      fill="url(#colorIncome)"
                      strokeWidth={2}
                      name={language === 'es' ? 'Ingreso Acumulado' : 'Cumulative Income'}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#ef4444" 
                      fill="url(#colorExpense)"
                      strokeWidth={2}
                      name={language === 'es' ? 'Gasto Acumulado' : 'Cumulative Expense'}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#3b82f6" 
                      fill="url(#colorNet)"
                      strokeWidth={2}
                      name={language === 'es' ? 'Balance Neto' : 'Net Balance'}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projected" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      dot={false}
                      strokeWidth={1.5}
                      name={language === 'es' ? 'Proyección' : 'Projection'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pattern Analysis */}
        <AnimatePresence>
          {showPatterns && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{language === 'es' ? 'Análisis de Patrones IA' : 'AI Pattern Analysis'}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Time of Day Patterns */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {language === 'es' ? 'Patrones por Horario' : 'Time Patterns'}
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <Sun className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{language === 'es' ? 'Mañana' : 'Morning'}</p>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(timePatterns.morning.amount / Math.max(timePatterns.morning.amount, timePatterns.afternoon.amount, timePatterns.evening.amount, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold">{formatCurrency(timePatterns.morning.amount)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Coffee className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{language === 'es' ? 'Tarde' : 'Afternoon'}</p>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-blue-400 to-cyan-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(timePatterns.afternoon.amount / Math.max(timePatterns.morning.amount, timePatterns.afternoon.amount, timePatterns.evening.amount, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold">{formatCurrency(timePatterns.afternoon.amount)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Moon className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{language === 'es' ? 'Noche' : 'Evening'}</p>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-purple-400 to-pink-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(timePatterns.evening.amount / Math.max(timePatterns.morning.amount, timePatterns.afternoon.amount, timePatterns.evening.amount, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold">{formatCurrency(timePatterns.evening.amount)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Category Radar */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {language === 'es' ? 'Perfil de Gastos' : 'Spending Profile'}
                  </h4>
                  
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 8 }} />
                        <PolarRadiusAxis tick={{ fontSize: 8 }} />
                        <Radar 
                          name={language === 'es' ? 'Gasto' : 'Spending'} 
                          dataKey="current" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf6" 
                          fillOpacity={0.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Category Distribution Pie */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  {language === 'es' ? 'Distribución de Categorías' : 'Category Distribution'}
                </h4>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-[140px] w-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {pieData.slice(0, 6).map((cat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                        <span className="text-[10px] truncate flex-1">{cat.name}</span>
                        <span className="text-[10px] font-bold">{((cat.value / insights.totalExpenses) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Month-over-Month Category Changes */}
              {monthComparison.categoryChanges.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {language === 'es' ? 'Cambios vs Mes Anterior' : 'Changes vs Previous Month'}
                  </h4>
                  
                  <div className="space-y-2">
                    {monthComparison.categoryChanges.slice(0, 5).map((cat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.other }} 
                        />
                        <span className="text-xs flex-1 truncate">
                          {getCategoryLabelByLanguage(cat.category as ExpenseCategory, language as 'es' | 'en')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(cat.previous)} → {formatCurrency(cat.current)}
                        </span>
                        <Badge 
                          className={cn(
                            "text-[10px]",
                            cat.change <= 0 
                              ? "bg-success/20 text-success" 
                              : cat.change > 50 
                                ? "bg-destructive/20 text-destructive"
                                : "bg-amber-500/20 text-amber-600"
                          )}
                        >
                          {cat.change > 0 ? '+' : ''}{cat.change.toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* AI Insights Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Top Category */}
          {insights.topCategory && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20">
                  <Flame className="h-4 w-4 text-amber-500" />
                </div>
                <span className="text-[10px] font-medium text-amber-600 uppercase tracking-wider">
                  {language === 'es' ? 'Mayor Gasto' : 'Top Spending'}
                </span>
              </div>
              <p className="font-bold text-xs truncate">{getCategoryLabelByLanguage(insights.topCategory[0] as ExpenseCategory, language as 'es' | 'en')}</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(insights.topCategory[1])}</p>
              <p className="text-[10px] text-muted-foreground">
                {((insights.topCategory[1] / insights.totalExpenses) * 100).toFixed(0)}% {language === 'es' ? 'del total' : 'of total'}
              </p>
            </motion.div>
          )}
          
          {/* Savings Rate */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "p-3 rounded-xl border",
              insights.savingsRate >= 20 
                ? "bg-gradient-to-br from-success/10 to-emerald-500/10 border-success/30"
                : insights.savingsRate >= 0
                  ? "bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30"
                  : "bg-gradient-to-br from-destructive/10 to-red-500/10 border-destructive/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "p-1.5 rounded-lg",
                insights.savingsRate >= 20 ? "bg-success/20" : insights.savingsRate >= 0 ? "bg-amber-500/20" : "bg-destructive/20"
              )}>
                <Target className={cn(
                  "h-4 w-4",
                  insights.savingsRate >= 20 ? "text-success" : insights.savingsRate >= 0 ? "text-amber-500" : "text-destructive"
                )} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {language === 'es' ? 'Tasa Ahorro' : 'Savings Rate'}
              </span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              insights.savingsRate >= 20 ? "text-success" : insights.savingsRate >= 0 ? "text-amber-600" : "text-destructive"
            )}>
              {insights.savingsRate.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">
              {insights.savingsRate >= 20 
                ? '🎉 ¡Excelente!'
                : insights.savingsRate >= 10 
                  ? '👍 Buen ritmo'
                  : insights.savingsRate >= 0
                    ? '⚠️ Ajustar'
                    : '🚨 Déficit'
              }
            </p>
          </motion.div>
          
          {/* Weekend vs Weekday */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">
                {language === 'es' ? 'Fin Semana' : 'Weekend'}
              </span>
            </div>
            <p className="font-bold text-lg text-blue-600">{formatCurrency(insights.weekendSpending)}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatCurrency(insights.avgWeekendSpending)}/{language === 'es' ? 'día' : 'day'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              vs {formatCurrency(insights.avgWeekdaySpending)}/{language === 'es' ? 'día lab' : 'weekday'}
            </p>
          </motion.div>
          
          {/* Best Streak */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20">
                <Trophy className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-[10px] font-medium text-purple-600 uppercase tracking-wider">
                {language === 'es' ? 'Mejor Racha' : 'Best Streak'}
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {insights.bestStreak}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {language === 'es' ? 'días controlados' : 'controlled days'}
            </p>
            {insights.zeroSpendingDays.length > 0 && (
              <p className="text-[10px] text-success mt-1">
                🌟 {insights.zeroSpendingDays.length} {language === 'es' ? 'sin gastos' : 'zero spend'}
              </p>
            )}
          </motion.div>
        </div>
        
        {/* Expandable Deep Insights */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <button 
            onClick={() => setExpandedInsights(!expandedInsights)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Lightbulb className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="font-bold text-sm">
                {language === 'es' ? '💡 Recomendaciones IA Personalizadas' : '💡 Personalized AI Recommendations'}
              </span>
            </div>
            {expandedInsights ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedInsights && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-4 overflow-hidden"
              >
                {insights.highSpendingDays.length > 0 && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-start gap-2 text-sm p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-600">
                        {language === 'es' ? 'Días con gastos elevados detectados' : 'High spending days detected'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'es' 
                          ? `Los días ${insights.highSpendingDays.slice(0, 5).join(', ')} superaron el doble de tu promedio diario. Revisa qué ocasionó estos picos.`
                          : `Days ${insights.highSpendingDays.slice(0, 5).join(', ')} exceeded double your daily average. Review what caused these spikes.`
                        }
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {insights.avgWeekendSpending > insights.avgWeekdaySpending * 1.5 && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-start gap-2 text-sm p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
                  >
                    <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-600">
                        {language === 'es' ? 'Patrón de gasto de fin de semana' : 'Weekend spending pattern'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'es' 
                          ? `Gastas ${((insights.avgWeekendSpending / insights.avgWeekdaySpending) * 100 - 100).toFixed(0)}% más los fines de semana. Considera planificar actividades más económicas.`
                          : `You spend ${((insights.avgWeekendSpending / insights.avgWeekdaySpending) * 100 - 100).toFixed(0)}% more on weekends. Consider planning more affordable activities.`
                        }
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {insights.topCategory && insights.topCategory[1] > insights.totalExpenses * 0.4 && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-start gap-2 text-sm p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <TrendingDown className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-destructive">
                        {language === 'es' ? 'Concentración de gastos' : 'Spending concentration'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'es' 
                          ? `"${getCategoryLabelByLanguage(insights.topCategory[0] as ExpenseCategory, 'es')}" representa el ${((insights.topCategory[1] / insights.totalExpenses) * 100).toFixed(0)}% de tus gastos. Busca alternativas para diversificar.`
                          : `"${getCategoryLabelByLanguage(insights.topCategory[0] as ExpenseCategory, 'en')}" represents ${((insights.topCategory[1] / insights.totalExpenses) * 100).toFixed(0)}% of your expenses. Look for alternatives to diversify.`
                        }
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {monthComparison.expenseChange > 20 && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start gap-2 text-sm p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
                  >
                    <TrendingUp className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-orange-600">
                        {language === 'es' ? 'Incremento vs mes anterior' : 'Increase vs previous month'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'es' 
                          ? `Tus gastos subieron ${monthComparison.expenseChange.toFixed(0)}% comparado con el mes anterior. Revisa las categorías que más aumentaron.`
                          : `Your expenses increased ${monthComparison.expenseChange.toFixed(0)}% compared to last month. Review the categories that increased the most.`
                        }
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {insights.savingsRate < 10 && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-start gap-2 text-sm p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">
                        {language === 'es' ? 'Oportunidad de ahorro' : 'Savings opportunity'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'es' 
                          ? `Tu tasa de ahorro está en ${insights.savingsRate.toFixed(1)}%. Intenta automatizar un ahorro del 10-20% de tus ingresos antes de gastar.`
                          : `Your savings rate is at ${insights.savingsRate.toFixed(1)}%. Try automating 10-20% savings from your income before spending.`
                        }
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {insights.bestStreak >= 5 && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-start gap-2 text-sm p-3 rounded-lg bg-success/10 border border-success/20"
                  >
                    <Trophy className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-success">
                        {language === 'es' ? '¡Felicitaciones!' : 'Congratulations!'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'es' 
                          ? `Lograste ${insights.bestStreak} días consecutivos con gastos controlados. ¡Sigue así para alcanzar tus metas financieras!`
                          : `You achieved ${insights.bestStreak} consecutive days with controlled spending. Keep it up to reach your financial goals!`
                        }
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {insights.zeroSpendingDays.length >= 3 && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-start gap-2 text-sm p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <DollarSign className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-emerald-600">
                        {language === 'es' ? 'Días sin gastos' : 'Zero spending days'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'es' 
                          ? `¡Increíble! Tuviste ${insights.zeroSpendingDays.length} días sin ningún gasto. Esta disciplina te acerca a la libertad financiera.`
                          : `Amazing! You had ${insights.zeroSpendingDays.length} days with zero spending. This discipline brings you closer to financial freedom.`
                        }
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {!expandedInsights && (
            <p className="text-xs text-muted-foreground mt-2">
              {language === 'es' ? 'Haz clic para ver análisis detallado y recomendaciones personalizadas' : 'Click to see detailed analysis and personalized recommendations'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
