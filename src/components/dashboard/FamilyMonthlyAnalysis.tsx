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
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Trophy,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
  ReferenceLine
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
  
  // Date ranges
  const dateRange = useMemo(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
  }, [year, month]);
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  
  // Fetch data
  const { data: expenses } = useExpenses({ dateRange });
  const { data: income } = useIncome({ year, month: month + 1 });
  
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
  
  // Analytics & Insights
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
    
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    
    // Weekend vs weekday spending
    let weekendSpending = 0;
    let weekdaySpending = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(year, month, d).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendSpending += dailyData[d].total;
      } else {
        weekdaySpending += dailyData[d].total;
      }
    }
    
    // High spending days
    const highSpendingDays = Object.entries(dailyData)
      .filter(([_, data]) => data.total > avgDailyExpense * 2)
      .map(([day]) => parseInt(day));
    
    // Best saving day (high income, low expense)
    const savingsPerDay = Object.entries(dailyData)
      .map(([day, data]) => ({ day: parseInt(day), savings: data.income - data.total }))
      .filter(d => d.savings > 0)
      .sort((a, b) => b.savings - a.savings);
    
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
    
    return {
      totalExpenses,
      totalIncome,
      avgDailyExpense,
      topCategory,
      weekendSpending,
      weekdaySpending,
      highSpendingDays,
      bestSavingDay: savingsPerDay[0]?.day,
      bestStreak,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0,
    };
  }, [expenses, income, dailyData, daysInMonth, year, month]);
  
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
        projected: (insights.avgDailyExpense * d.day),
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
      <div className="bg-popover/95 backdrop-blur-sm border rounded-xl p-3 shadow-xl min-w-[200px]">
        <p className="font-bold text-sm mb-2">{dayOfWeek}, {label}</p>
        
        {dayData.income > 0 && (
          <div className="flex items-center gap-2 text-success mb-1">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs">{language === 'es' ? 'Ingreso' : 'Income'}</span>
            <span className="ml-auto font-semibold">{formatCurrency(dayData.income)}</span>
          </div>
        )}
        
        {Object.entries(dayData.expenses).map(([cat, amount]) => (
          <div key={cat} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other }}
            />
            <span className="truncate">{getCategoryLabelByLanguage(cat as ExpenseCategory, language as 'es' | 'en')}</span>
            <span className="ml-auto font-medium">{formatCurrency(amount as number)}</span>
          </div>
        ))}
        
        {dayData.total > 0 && (
          <div className="mt-2 pt-2 border-t flex justify-between text-sm font-bold text-destructive">
            <span>Total</span>
            <span>{formatCurrency(dayData.total)}</span>
          </div>
        )}
      </div>
    );
  };
  
  const monthNames = language === 'es'
    ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-lg shadow-emerald-500/30"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Calendar className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                👨‍👩‍👧 {language === 'es' ? 'Análisis Diario Familiar' : 'Family Daily Analysis'}
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px]">
                  {monthNames[month]}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {language === 'es' ? 'Vista detallada día por día' : 'Detailed day-by-day view'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={showTrends ? "default" : "outline"}
              onClick={() => setShowTrends(!showTrends)}
              className="gap-1"
            >
              <BarChart3 className="h-4 w-4" />
              {language === 'es' ? 'Tendencias' : 'Trends'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Week Summary Bar */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weekSummaries.map((week, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "flex-1 min-w-[80px] p-2 rounded-lg text-center text-xs border",
                week.income > week.expenses 
                  ? "bg-success/10 border-success/30" 
                  : "bg-destructive/10 border-destructive/30"
              )}
            >
              <p className="font-bold text-muted-foreground">
                {language === 'es' ? 'Sem' : 'Wk'} {week.weekNum}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {week.startDay}-{week.endDay}
              </p>
              <p className={cn(
                "font-semibold text-xs mt-1",
                week.income > week.expenses ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(week.income - week.expenses)}
              </p>
            </motion.div>
          ))}
        </div>
        
        {/* Daily Stacked Bar Chart */}
        <div className="h-[200px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="15%">
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10 }}
                tickFormatter={(v, i) => {
                  const item = chartData[i];
                  return item?.isWeekStart ? `S${Math.ceil(v / 7)}` : v;
                }}
              />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v/1000}k`} />
              <RechartsTooltip content={<CustomTooltip />} />
              
              {/* Week separators */}
              {chartData.filter(d => d.isWeekStart && d.day > 1).map(d => (
                <ReferenceLine 
                  key={d.day} 
                  x={d.day} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="3 3"
                  strokeOpacity={0.3}
                />
              ))}
              
              {/* Income bar */}
              <Bar dataKey="income" stackId="pos" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`income-${index}`} 
                    fill={CATEGORY_COLORS.income}
                    fillOpacity={entry.isWeekend ? 0.7 : 1}
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
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`${cat}-${index}`} 
                      fill={CATEGORY_COLORS[cat] || CATEGORY_COLORS.other}
                      fillOpacity={entry.isWeekend ? 0.7 : 1}
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS.income }} />
              <span className="text-[10px]">{language === 'es' ? 'Ingresos' : 'Income'}</span>
            </div>
            {allCategories.slice(0, 5).map(cat => (
              <div key={cat} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other }} />
                <span className="text-[10px]">{getCategoryLabelByLanguage(cat as ExpenseCategory, language as 'es' | 'en')}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Trends Chart */}
        <AnimatePresence>
          {showTrends && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{language === 'es' ? 'Tendencia Acumulada' : 'Cumulative Trend'}</span>
              </div>
              
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v/1000}k`} />
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `${language === 'es' ? 'Día' : 'Day'} ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativeIncome" 
                      stroke="#22c55e" 
                      fill="url(#colorIncome)"
                      name={language === 'es' ? 'Ingreso Acumulado' : 'Cumulative Income'}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#ef4444" 
                      fill="url(#colorExpense)"
                      name={language === 'es' ? 'Gasto Acumulado' : 'Cumulative Expense'}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projected" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      dot={false}
                      name={language === 'es' ? 'Proyección' : 'Projection'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* AI Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
                <span className="text-xs font-medium text-amber-600">
                  {language === 'es' ? 'Mayor Gasto' : 'Top Spending'}
                </span>
              </div>
              <p className="font-bold text-sm">{getCategoryLabelByLanguage(insights.topCategory[0] as ExpenseCategory, language as 'es' | 'en')}</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(insights.topCategory[1])}</p>
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
              <span className="text-xs font-medium">
                {language === 'es' ? 'Tasa de Ahorro' : 'Savings Rate'}
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
                ? (language === 'es' ? '🎉 ¡Excelente!' : '🎉 Excellent!')
                : insights.savingsRate >= 10 
                  ? (language === 'es' ? '👍 Buen ritmo' : '👍 Good pace')
                  : (language === 'es' ? '⚠️ Ajustar gastos' : '⚠️ Adjust spending')
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
              <span className="text-xs font-medium text-blue-600">
                {language === 'es' ? 'Fin de Semana' : 'Weekend'}
              </span>
            </div>
            <p className="font-bold text-blue-600">{formatCurrency(insights.weekendSpending)}</p>
            <p className="text-[10px] text-muted-foreground">
              vs {formatCurrency(insights.weekdaySpending)} {language === 'es' ? 'entre semana' : 'weekdays'}
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
              <span className="text-xs font-medium text-purple-600">
                {language === 'es' ? 'Mejor Racha' : 'Best Streak'}
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {insights.bestStreak} {language === 'es' ? 'días' : 'days'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {language === 'es' ? 'bajo promedio diario' : 'below daily average'}
            </p>
          </motion.div>
        </div>
        
        {/* Recommendations */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lightbulb className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="font-bold text-sm">
              {language === 'es' ? '💡 Recomendaciones Inteligentes' : '💡 Smart Recommendations'}
            </span>
          </div>
          
          <div className="space-y-2">
            {insights.highSpendingDays.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p>
                  {language === 'es' 
                    ? `Los días ${insights.highSpendingDays.slice(0, 3).join(', ')} tuvieron gastos inusualmente altos. Revisa qué pasó.`
                    : `Days ${insights.highSpendingDays.slice(0, 3).join(', ')} had unusually high spending. Review what happened.`
                  }
                </p>
              </div>
            )}
            
            {insights.weekendSpending > insights.weekdaySpending * 0.5 && (
              <div className="flex items-start gap-2 text-sm">
                <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p>
                  {language === 'es' 
                    ? `Tu gasto de fin de semana representa ${((insights.weekendSpending / (insights.weekendSpending + insights.weekdaySpending)) * 100).toFixed(0)}% del total. Considera actividades más económicas.`
                    : `Your weekend spending is ${((insights.weekendSpending / (insights.weekendSpending + insights.weekdaySpending)) * 100).toFixed(0)}% of total. Consider more affordable activities.`
                  }
                </p>
              </div>
            )}
            
            {insights.topCategory && insights.topCategory[1] > insights.totalExpenses * 0.4 && (
              <div className="flex items-start gap-2 text-sm">
                <TrendingDown className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p>
                  {language === 'es' 
                    ? `"${getCategoryLabelByLanguage(insights.topCategory[0] as ExpenseCategory, 'es')}" consume más del 40% de tus gastos. Busca alternativas.`
                    : `"${getCategoryLabelByLanguage(insights.topCategory[0] as ExpenseCategory, 'en')}" consumes over 40% of expenses. Look for alternatives.`
                  }
                </p>
              </div>
            )}
            
            {insights.savingsRate < 10 && (
              <div className="flex items-start gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p>
                  {language === 'es' 
                    ? `Tu tasa de ahorro está por debajo del 10%. Intenta automatizar un ahorro del 10-20% de tus ingresos.`
                    : `Your savings rate is below 10%. Try automating a 10-20% savings from your income.`
                  }
                </p>
              </div>
            )}
            
            {insights.bestStreak >= 5 && (
              <div className="flex items-start gap-2 text-sm text-success">
                <Trophy className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  {language === 'es' 
                    ? `¡Increíble! Mantuviste ${insights.bestStreak} días seguidos con gastos controlados. ¡Sigue así!`
                    : `Amazing! You maintained ${insights.bestStreak} consecutive days with controlled spending. Keep it up!`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
