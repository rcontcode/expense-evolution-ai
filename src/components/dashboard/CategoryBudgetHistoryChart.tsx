import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useCategoryBudgets } from "@/hooks/data/useCategoryBudgets";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { BarChart3, CheckCircle, AlertTriangle } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryLabel, ExpenseCategory } from "@/lib/constants/expense-categories";

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

export function CategoryBudgetHistoryChart() {
  const [onlyWithBudget, setOnlyWithBudget] = useState(true);
  
  const { data: budgets, isLoading: loadingBudgets } = useCategoryBudgets();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses();
  
  const isLoading = loadingBudgets || loadingExpenses;
  
  const budgetedCategories = useMemo(() => {
    return budgets?.map(b => ({
      category: b.category,
      budget: b.monthly_budget,
      label: getCategoryLabel(b.category as ExpenseCategory),
      color: CATEGORY_COLORS[b.category] || "#6b7280"
    })) || [];
  }, [budgets]);

  const { chartData, categoryStats } = useMemo(() => {
    const months: { month: string; [key: string]: number | string }[] = [];
    const categoryMonthlyData: Record<string, number[]> = {};
    
    // Initialize for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthLabel = format(date, "MMM", { locale: es });
      
      const monthData: { month: string; [key: string]: number | string } = { month: monthLabel };
      
      // Filter expenses for this month
      const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= monthStart && expDate <= monthEnd;
      });
      
      // Calculate totals per budgeted category
      budgetedCategories.forEach(({ category }) => {
        const total = monthExpenses
          .filter(exp => exp.category === category)
          .reduce((sum, exp) => sum + Number(exp.amount), 0);
        
        monthData[category] = total;
        
        if (!categoryMonthlyData[category]) {
          categoryMonthlyData[category] = [];
        }
        categoryMonthlyData[category].push(total);
      });
      
      months.push(monthData);
    }
    
    // Calculate stats for each category
    const stats = budgetedCategories.map(({ category, budget, label, color }) => {
      const monthlyAmounts = categoryMonthlyData[category] || [];
      const monthsExceeded = monthlyAmounts.filter(amount => amount > budget).length;
      const avgSpent = monthlyAmounts.reduce((sum, a) => sum + a, 0) / (monthlyAmounts.length || 1);
      
      return {
        category,
        label,
        color,
        budget,
        avgSpent,
        monthsExceeded,
        complianceRate: monthlyAmounts.length > 0 
          ? ((monthlyAmounts.length - monthsExceeded) / monthlyAmounts.length) * 100 
          : 100
      };
    });
    
    return { chartData: months, categoryStats: stats };
  }, [expenses, budgetedCategories]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, idx: number) => {
              const budget = budgetedCategories.find(b => b.category === entry.dataKey)?.budget || 0;
              const exceeded = entry.value > budget;
              
              return (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="truncate max-w-[100px]">{entry.name}</span>
                  </span>
                  <span className={`font-medium ${exceeded ? "text-red-500" : ""}`}>
                    {formatCurrency(entry.value)}
                    {exceeded && " ⚠"}
                  </span>
                </div>
              );
            })}
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

  if (!budgetedCategories.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Historial por Categoría (6 meses)
          </CardTitle>
          <CardDescription>Seguimiento de gastos vs presupuesto por categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-center">
            <p>Configura presupuestos por categoría para ver el historial.<br/>Usa la tarjeta "Metas por Categoría" para comenzar.</p>
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
              <BarChart3 className="h-5 w-5 text-primary" />
              Historial por Categoría (6 meses)
            </CardTitle>
            <CardDescription>Gastos mensuales vs presupuesto por categoría</CardDescription>
          </div>
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
              {budgetedCategories.map(({ category, label, color, budget }) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  name={label}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
              {/* Reference lines for budget limits */}
              {budgetedCategories.map(({ category, color, budget }) => (
                <ReferenceLine
                  key={`ref-${category}`}
                  y={budget}
                  stroke={color}
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t">
          {categoryStats.map(stat => (
            <div 
              key={stat.category}
              className="p-3 rounded-lg bg-muted/30 space-y-2"
              style={{ borderLeft: `3px solid ${stat.color}` }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{stat.label}</p>
                <Badge variant={stat.monthsExceeded === 0 ? "outline" : "destructive"} className="text-xs">
                  {stat.monthsExceeded === 0 ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> OK</>
                  ) : (
                    <><AlertTriangle className="h-3 w-3 mr-1" /> {stat.monthsExceeded}/6</>
                  )}
                </Badge>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Promedio: {formatCurrency(stat.avgSpent)}</span>
                <span>Meta: {formatCurrency(stat.budget)}</span>
              </div>
              <div className="text-xs">
                <span className={stat.complianceRate >= 80 ? "text-green-500" : stat.complianceRate >= 50 ? "text-amber-500" : "text-red-500"}>
                  {stat.complianceRate.toFixed(0)}% cumplimiento
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
