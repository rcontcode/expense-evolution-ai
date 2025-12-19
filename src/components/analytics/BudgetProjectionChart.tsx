import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useIncome } from "@/hooks/data/useIncome";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Calculator, Target, TrendingUp, AlertTriangle, CheckCircle, Wallet } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, differenceInDays, getDaysInMonth } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const translations = {
  es: {
    title: "Proyección de Presupuesto",
    description: "Estimación de gastos futuros basada en tu historial",
    noData: "Agrega gastos para ver proyecciones",
    projectedExpenses: "Gastos proyectados",
    historicalAvg: "Promedio histórico",
    budgetLimit: "Límite presupuesto",
    monthlyBudget: "Presupuesto mensual",
    projected: "Proyectado",
    remaining: "Restante",
    overBudget: "Sobre presupuesto",
    underBudget: "Bajo presupuesto",
    onTrack: "En objetivo",
    warning: "Alerta: podrías exceder tu presupuesto",
    safe: "Bien: estás dentro del presupuesto",
    thisMonth: "Este mes",
    nextMonths: "Próximos meses",
    adjustBudget: "Ajustar presupuesto",
    currentSpend: "Gasto actual",
    projectedEnd: "Proyección fin de mes"
  },
  en: {
    title: "Budget Projection",
    description: "Expense estimation based on your history",
    noData: "Add expenses to see projections",
    projectedExpenses: "Projected expenses",
    historicalAvg: "Historical average",
    budgetLimit: "Budget limit",
    monthlyBudget: "Monthly budget",
    projected: "Projected",
    remaining: "Remaining",
    overBudget: "Over budget",
    underBudget: "Under budget",
    onTrack: "On track",
    warning: "Warning: you may exceed your budget",
    safe: "Good: you're within budget",
    thisMonth: "This month",
    nextMonths: "Next months",
    adjustBudget: "Adjust budget",
    currentSpend: "Current spend",
    projectedEnd: "End of month projection"
  }
};

export function BudgetProjectionChart() {
  const { language } = useLanguage();
  const t = translations[language];
  const locale = language === "es" ? es : enUS;
  
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: income = [], isLoading: incomeLoading } = useIncome();

  const isLoading = expensesLoading || incomeLoading;

  // Calculate average monthly income for default budget
  const avgMonthlyIncome = useMemo(() => {
    const last6Months: number[] = [];
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
      if (monthIncome > 0) last6Months.push(monthIncome);
    }
    return last6Months.length > 0 
      ? last6Months.reduce((a, b) => a + b, 0) / last6Months.length 
      : 5000;
  }, [income]);

  const [budget, setBudget] = useState(Math.round(avgMonthlyIncome * 0.7 / 100) * 100);

  const { chartData, currentMonthStats, projections } = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const daysPassed = differenceInDays(now, currentMonthStart) + 1;
    const totalDays = getDaysInMonth(now);
    
    // Calculate historical monthly averages
    const monthlyExpenses: number[] = [];
    for (let i = 5; i >= 1; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthTotal = expenses
        .filter(exp => {
          const expDate = new Date(exp.date);
          return expDate >= monthStart && expDate <= monthEnd;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
      monthlyExpenses.push(monthTotal);
    }
    
    const historicalAvg = monthlyExpenses.length > 0 
      ? monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length 
      : 0;
    
    // Current month actual spending
    const currentSpend = expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= currentMonthStart && expDate <= currentMonthEnd;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Daily spending rate
    const dailyRate = currentSpend / daysPassed;
    const projectedMonthEnd = dailyRate * totalDays;
    
    // Build chart data (historical + projections)
    const chartData: { month: string; actual?: number; projected?: number; budget: number }[] = [];
    
    // Historical months
    for (let i = 5; i >= 1; i--) {
      const date = subMonths(now, i);
      chartData.push({
        month: format(date, "MMM", { locale }),
        actual: monthlyExpenses[5 - i],
        budget
      });
    }
    
    // Current month
    chartData.push({
      month: format(now, "MMM", { locale }),
      actual: currentSpend,
      projected: projectedMonthEnd,
      budget
    });
    
    // Future projections (next 3 months)
    for (let i = 1; i <= 3; i++) {
      const date = addMonths(now, i);
      // Project based on weighted average (more recent months have more weight)
      const weightedProjection = historicalAvg * 0.7 + projectedMonthEnd * 0.3;
      chartData.push({
        month: format(date, "MMM", { locale }),
        projected: weightedProjection,
        budget
      });
    }
    
    const currentMonthStats = {
      currentSpend,
      projectedMonthEnd,
      dailyRate,
      daysPassed,
      totalDays,
      percentComplete: (daysPassed / totalDays) * 100,
      budgetUsed: (currentSpend / budget) * 100,
      projectedBudgetUsed: (projectedMonthEnd / budget) * 100
    };
    
    const projections = {
      historicalAvg,
      willExceedBudget: projectedMonthEnd > budget,
      overAmount: Math.max(0, projectedMonthEnd - budget),
      underAmount: Math.max(0, budget - projectedMonthEnd)
    };
    
    return { chartData, currentMonthStats, projections };
  }, [expenses, budget, locale]);

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
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
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
          <Skeleton className="h-[350px]" />
        </CardContent>
      </Card>
    );
  }

  const hasData = expenses.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
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
              <Calculator className="h-5 w-5 text-primary" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={projections.willExceedBudget 
              ? "text-red-500 border-red-500/30" 
              : "text-green-500 border-green-500/30"
            }
          >
            {projections.willExceedBudget 
              ? <AlertTriangle className="h-3 w-3 mr-1" />
              : <CheckCircle className="h-3 w-3 mr-1" />
            }
            {projections.willExceedBudget ? t.overBudget : t.onTrack}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Month Progress */}
        <div className="space-y-3 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              {t.thisMonth}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentMonthStats.daysPassed}/{currentMonthStats.totalDays} días
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t.currentSpend}</span>
              <span className="font-bold">{formatCurrency(currentMonthStats.currentSpend)}</span>
            </div>
            <Progress 
              value={Math.min(100, currentMonthStats.budgetUsed)} 
              className={`h-2 ${currentMonthStats.budgetUsed > 100 ? "[&>div]:bg-red-500" : ""}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t.projectedEnd}: {formatCurrency(currentMonthStats.projectedMonthEnd)}</span>
              <span>{t.budgetLimit}: {formatCurrency(budget)}</span>
            </div>
          </div>
          
          {projections.willExceedBudget ? (
            <div className="flex items-start gap-2 p-2 rounded bg-red-500/10 text-red-500 text-xs">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{t.warning} ({formatCurrency(projections.overAmount)} {t.overBudget.toLowerCase()})</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-2 rounded bg-green-500/10 text-green-500 text-xs">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{t.safe} ({formatCurrency(projections.underAmount)} {t.remaining.toLowerCase()})</span>
            </div>
          )}
        </div>

        {/* Budget Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t.adjustBudget}</span>
            <Badge variant="outline">{formatCurrency(budget)}</Badge>
          </div>
          <Slider
            value={[budget]}
            min={1000}
            max={20000}
            step={100}
            onValueChange={(value) => setBudget(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$1,000</span>
            <span>$20,000</span>
          </div>
        </div>

        {/* Projection Chart */}
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
              <ReferenceLine 
                y={budget} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                label={{ value: t.budgetLimit, position: "right", fill: "hsl(var(--destructive))", fontSize: 10 }}
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                name={language === "es" ? "Real" : "Actual"}
                stroke="hsl(var(--primary))"
                fill="url(#actualGradient)"
                strokeWidth={2}
                connectNulls
              />
              <Area 
                type="monotone" 
                dataKey="projected" 
                name={t.projected}
                stroke="hsl(var(--muted-foreground))"
                fill="url(#projectedGradient)"
                strokeWidth={2}
                strokeDasharray="5 5"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center p-2 rounded-lg bg-primary/10">
            <p className="text-lg font-bold text-primary">{formatCurrency(currentMonthStats.dailyRate)}</p>
            <p className="text-xs text-muted-foreground">{language === "es" ? "Gasto/día" : "Spend/day"}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted">
            <p className="text-lg font-bold">{formatCurrency(projections.historicalAvg)}</p>
            <p className="text-xs text-muted-foreground">{t.historicalAvg}</p>
          </div>
          <div className={`text-center p-2 rounded-lg ${projections.willExceedBudget ? "bg-red-500/10" : "bg-green-500/10"}`}>
            <p className={`text-lg font-bold ${projections.willExceedBudget ? "text-red-500" : "text-green-500"}`}>
              {currentMonthStats.projectedBudgetUsed.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">{t.budgetLimit}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
