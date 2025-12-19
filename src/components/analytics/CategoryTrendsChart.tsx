import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExpenses } from "@/hooks/data/useExpenses";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus, Filter } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, getMonth, getYear } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryLabelByLanguage, ExpenseCategory } from "@/lib/constants/expense-categories";

const translations = {
  es: {
    title: "Tendencias por Categoría",
    description: "Evolución de gastos por categoría en los últimos 6 meses",
    noData: "Agrega gastos para ver tendencias",
    topCategories: "Top categorías",
    showAll: "Ver todas",
    showLess: "Ver menos",
    avgMonthly: "Promedio mensual",
    trend: "Tendencia"
  },
  en: {
    title: "Category Trends",
    description: "Expense evolution by category over the last 6 months",
    noData: "Add expenses to see trends",
    topCategories: "Top categories",
    showAll: "Show all",
    showLess: "Show less",
    avgMonthly: "Monthly average",
    trend: "Trend"
  }
};

const CATEGORY_COLORS: Record<string, string> = {
  meals: "#f59e0b",
  travel: "#3b82f6",
  fuel: "#ef4444",
  equipment: "#8b5cf6",
  software: "#06b6d4",
  professional_services: "#10b981",
  office_supplies: "#f97316",
  utilities: "#6366f1",
  advertising: "#ec4899",
  materials: "#14b8a6",
  other: "#6b7280"
};

export function CategoryTrendsChart() {
  const { language } = useLanguage();
  const t = translations[language];
  const locale = language === 'es' ? es : enUS;
  const [showAll, setShowAll] = useState(false);
  
  const { data: expenses = [], isLoading } = useExpenses();

  const { chartData, categoryStats, topCategories } = useMemo(() => {
    const months: { month: string; [key: string]: number | string }[] = [];
    const categoryTotals: Record<string, number[]> = {};
    
    // Initialize for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthLabel = format(date, "MMM", { locale });
      
      const monthData: { month: string; [key: string]: number | string } = { month: monthLabel };
      
      // Group expenses by category for this month
      const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= monthStart && expDate <= monthEnd;
      });
      
      // Calculate totals per category
      const categoryMonthTotals: Record<string, number> = {};
      monthExpenses.forEach(exp => {
        const cat = exp.category || "other";
        categoryMonthTotals[cat] = (categoryMonthTotals[cat] || 0) + exp.amount;
      });
      
      // Add to monthly data and track totals
      Object.entries(categoryMonthTotals).forEach(([cat, amount]) => {
        monthData[cat] = amount;
        if (!categoryTotals[cat]) categoryTotals[cat] = [];
        categoryTotals[cat].push(amount);
      });
      
      months.push(monthData);
    }
    
    // Calculate category statistics
    const categoryStats = Object.entries(categoryTotals).map(([category, amounts]) => {
      const total = amounts.reduce((sum, a) => sum + a, 0);
      const avg = total / amounts.length;
      
      // Calculate trend (comparing first half to second half)
      const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
      const secondHalf = amounts.slice(Math.floor(amounts.length / 2));
      const firstAvg = firstHalf.reduce((s, a) => s + a, 0) / (firstHalf.length || 1);
      const secondAvg = secondHalf.reduce((s, a) => s + a, 0) / (secondHalf.length || 1);
      const trendPercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
      
      return {
        category,
        label: getCategoryLabelByLanguage(category as ExpenseCategory, language),
        total,
        avg,
        trend: trendPercent,
        color: CATEGORY_COLORS[category] || "#6b7280"
      };
    }).sort((a, b) => b.total - a.total);
    
    const topCategories = categoryStats.slice(0, 5);
    
    return { chartData: months, categoryStats, topCategories };
  }, [expenses, language, locale]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === "es" ? "es-CA" : "en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (trend < -5) return <TrendingDown className="h-3 w-3 text-green-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="truncate max-w-[100px]">{entry.name}</span>
                </span>
                <span className="font-medium">{formatCurrency(entry.value)}</span>
              </div>
            ))}
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

  const hasData = categoryStats.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
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

  const displayCategories = showAll ? categoryStats : topCategories;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          {categoryStats.length > 5 && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>
              {showAll ? t.showLess : t.showAll}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Line Chart */}
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {displayCategories.map(cat => (
                <Line
                  key={cat.category}
                  type="monotone"
                  dataKey={cat.category}
                  name={cat.label}
                  stroke={cat.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t">
          {displayCategories.map(cat => (
            <div 
              key={cat.category}
              className="p-3 rounded-lg bg-muted/50 space-y-1"
              style={{ borderLeft: `3px solid ${cat.color}` }}
            >
              <p className="text-xs font-medium truncate">{cat.label}</p>
              <p className="text-sm font-bold">{formatCurrency(cat.avg)}</p>
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon(cat.trend)}
                <span className={cat.trend > 0 ? "text-red-500" : cat.trend < 0 ? "text-green-500" : "text-muted-foreground"}>
                  {cat.trend > 0 ? "+" : ""}{cat.trend.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
