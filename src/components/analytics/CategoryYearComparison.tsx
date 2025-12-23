import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExpenses } from "@/hooks/data/useExpenses";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalendarDays, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { subYears, startOfYear, endOfYear, getYear } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryLabelByLanguage, ExpenseCategory, EXPENSE_CATEGORIES } from "@/lib/constants/expense-categories";

const translations = {
  es: {
    title: "Comparación Anual por Categoría",
    description: "Gastos por categoría: año actual vs año anterior",
    noData: "Agrega gastos para ver la comparación",
    topCategories: "Top 5",
    showAll: "Ver todas",
    currentYear: "Año actual",
    previousYear: "Año anterior",
    increase: "Mayor aumento",
    decrease: "Mayor reducción",
    totalChange: "Cambio total"
  },
  en: {
    title: "Year-over-Year by Category",
    description: "Expenses by category: current year vs previous year",
    noData: "Add expenses to see comparison",
    topCategories: "Top 5",
    showAll: "Show all",
    currentYear: "Current year",
    previousYear: "Previous year",
    increase: "Biggest increase",
    decrease: "Biggest decrease",
    totalChange: "Total change"
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

export function CategoryYearComparison() {
  const { language } = useLanguage();
  const t = translations[language];
  const [showTopOnly, setShowTopOnly] = useState(true);
  
  const now = new Date();
  const currentYear = getYear(now);
  const previousYear = currentYear - 1;
  
  const currentYearStart = startOfYear(now);
  const currentYearEnd = endOfYear(now);
  const previousYearStart = startOfYear(subYears(now, 1));
  const previousYearEnd = endOfYear(subYears(now, 1));
  
  const { data: currentExpenses = [], isLoading: loadingCurrent } = useExpenses({
    dateRange: { start: currentYearStart, end: currentYearEnd }
  });
  
  const { data: previousExpenses = [], isLoading: loadingPrevious } = useExpenses({
    dateRange: { start: previousYearStart, end: previousYearEnd }
  });
  
  const isLoading = loadingCurrent || loadingPrevious;

  const { chartData, stats } = useMemo(() => {
    const currentByCategory: Record<string, number> = {};
    const previousByCategory: Record<string, number> = {};
    
    currentExpenses.forEach(exp => {
      const cat = exp.category || "other";
      currentByCategory[cat] = (currentByCategory[cat] || 0) + Number(exp.amount);
    });
    
    previousExpenses.forEach(exp => {
      const cat = exp.category || "other";
      previousByCategory[cat] = (previousByCategory[cat] || 0) + Number(exp.amount);
    });
    
    // Get all categories that have data
    const allCategories = new Set([
      ...Object.keys(currentByCategory),
      ...Object.keys(previousByCategory)
    ]);
    
    const data = Array.from(allCategories).map(category => {
      const current = currentByCategory[category] || 0;
      const previous = previousByCategory[category] || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
      
      return {
        category,
        label: getCategoryLabelByLanguage(category as ExpenseCategory, language),
        current,
        previous,
        change,
        color: CATEGORY_COLORS[category] || "#6b7280"
      };
    }).sort((a, b) => (b.current + b.previous) - (a.current + a.previous));
    
    // Calculate stats
    const totalCurrent = Object.values(currentByCategory).reduce((sum, v) => sum + v, 0);
    const totalPrevious = Object.values(previousByCategory).reduce((sum, v) => sum + v, 0);
    const totalChange = totalPrevious > 0 ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 : 0;
    
    const biggestIncrease = data.filter(d => d.change > 0).sort((a, b) => b.change - a.change)[0];
    const biggestDecrease = data.filter(d => d.change < 0).sort((a, b) => a.change - b.change)[0];
    
    return {
      chartData: showTopOnly ? data.slice(0, 5) : data,
      stats: {
        totalChange,
        biggestIncrease,
        biggestDecrease
      }
    };
  }, [currentExpenses, previousExpenses, language, showTopOnly]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === "es" ? "es-CA" : "en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const current = payload.find((p: any) => p.dataKey === "current")?.value || 0;
      const previous = payload.find((p: any) => p.dataKey === "previous")?.value || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-primary">{currentYear}:</span>
              <span className="font-medium">{formatCurrency(current)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{previousYear}:</span>
              <span className="font-medium">{formatCurrency(previous)}</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t">
              <span>Cambio:</span>
              <span className={change > 0 ? "text-red-500" : change < 0 ? "text-green-500" : ""}>
                {change > 0 ? "+" : ""}{change.toFixed(1)}%
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
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  const hasData = chartData.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
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
              <CalendarDays className="h-5 w-5 text-primary" />
              {t.title}
            </CardTitle>
            <CardDescription>{`${previousYear} vs ${currentYear}`}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="top5" className="text-sm">{t.topCategories}</Label>
            <Switch id="top5" checked={showTopOnly} onCheckedChange={setShowTopOnly} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {stats.biggestIncrease && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3 text-red-500" />
                {t.increase}
              </div>
              <p className="font-medium text-sm truncate">{stats.biggestIncrease.label}</p>
              <p className="text-red-500 text-sm">+{stats.biggestIncrease.change.toFixed(0)}%</p>
            </div>
          )}
          {stats.biggestDecrease && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <TrendingDown className="h-3 w-3 text-green-500" />
                {t.decrease}
              </div>
              <p className="font-medium text-sm truncate">{stats.biggestDecrease.label}</p>
              <p className="text-green-500 text-sm">{stats.biggestDecrease.change.toFixed(0)}%</p>
            </div>
          )}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              {stats.totalChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : stats.totalChange < 0 ? (
                <TrendingDown className="h-3 w-3 text-green-500" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {t.totalChange}
            </div>
            <p className="font-medium text-sm">Total Gastos</p>
            <p className={stats.totalChange > 0 ? "text-red-500 text-sm" : stats.totalChange < 0 ? "text-green-500 text-sm" : "text-sm"}>
              {stats.totalChange > 0 ? "+" : ""}{stats.totalChange.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
              <XAxis 
                type="number"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="previous" 
                name={previousYear.toString()} 
                fill="hsl(var(--muted-foreground))" 
                radius={[0, 4, 4, 0]}
                opacity={0.6}
              />
              <Bar 
                dataKey="current" 
                name={currentYear.toString()} 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
