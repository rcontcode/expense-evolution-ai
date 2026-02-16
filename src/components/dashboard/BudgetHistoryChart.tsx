import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useUserSettings, UserPreferences } from "@/hooks/data/useUserSettings";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBudgetEntity } from "@/contexts/BudgetEntityContext";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BudgetHistoryChart() {
  const { language } = useLanguage();
  const { formatCompact: fc, formatCurrency: fcFull } = useFormatCurrency();
  const l = language === 'es';
  const { data: settings } = useUserSettings();
  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;

  const now = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));
  const budgetEntityId = useBudgetEntity();

  const { data: expenses, isLoading } = useExpenses({
    dateRange: { start: sixMonthsAgo, end: endOfMonth(now) },
    entityId: budgetEntityId ?? undefined,
    showAllEntities: budgetEntityId === undefined,
  });

  const chartData = useMemo(() => {
    if (!expenses) return [];

    const monthlyData: Record<string, { month: string; spent: number; budget: number; monthKey: string }> = {};

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, "yyyy-MM");
      const monthLabel = format(date, "MMM yy", { locale: l ? es : enUS });
      monthlyData[monthKey] = {
        month: monthLabel,
        monthKey,
        spent: 0,
        budget: globalBudget,
      };
    }

    expenses.forEach((expense) => {
      const monthKey = format(new Date(expense.date), "yyyy-MM");
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].spent += Number(expense.amount);
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [expenses, globalBudget, l]);

  const avgSpent = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((sum, d) => sum + d.spent, 0) / chartData.length;
  }, [chartData]);

  const monthsOverBudget = useMemo(() => {
    if (globalBudget === 0) return 0;
    return chartData.filter(d => d.spent > globalBudget).length;
  }, [chartData, globalBudget]);

  // Trend: compare last 3 months avg vs previous 3
  const trend = useMemo(() => {
    if (chartData.length < 4) return 0;
    const recent = chartData.slice(-3).reduce((s, d) => s + d.spent, 0) / 3;
    const older = chartData.slice(0, 3).reduce((s, d) => s + d.spent, 0) / 3;
    if (older === 0) return 0;
    return ((recent - older) / older) * 100;
  }, [chartData]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-[250px] bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center gap-3 text-base">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -10 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/25"
          >
            <History className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <span className="text-primary font-bold">
              {l ? 'Historial de Presupuesto' : 'Budget History'}
            </span>
            <p className="text-xs text-muted-foreground font-normal">
              {l ? 'Últimos 6 meses' : 'Last 6 months'}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 relative">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-card border">
            <p className="text-xl font-bold">{fc(avgSpent)}</p>
            <p className="text-[10px] text-muted-foreground">
              {l ? 'Promedio mensual' : 'Monthly avg'}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-card border">
            <p className="text-xl font-bold">{globalBudget > 0 ? fc(globalBudget) : '—'}</p>
            <p className="text-[10px] text-muted-foreground">
              {l ? 'Presupuesto' : 'Budget'}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-card border">
            <div className="flex items-center justify-center gap-1">
              {trend < -5 ? (
                <TrendingDown className="h-4 w-4 text-emerald-500" />
              ) : trend > 5 ? (
                <TrendingUp className="h-4 w-4 text-destructive" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <p className={cn(
                "text-xl font-bold",
                trend < -5 ? "text-emerald-500" : trend > 5 ? "text-destructive" : ""
              )}>
                {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {l ? 'Tendencia' : 'Trend'}
            </p>
          </div>
        </div>

        {/* Months over budget badge */}
        {globalBudget > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              {l ? 'Meses excedidos' : 'Months exceeded'}
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                monthsOverBudget > 0 ? "border-destructive/50 text-destructive" : "border-emerald-500/50 text-emerald-500"
              )}
            >
              {monthsOverBudget}/6
            </Badge>
          </div>
        )}

        {/* Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => fc(value)}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  fcFull(value),
                  name === "spent" ? (l ? "Gastado" : "Spent") : (l ? "Presupuesto" : "Budget")
                ]}
                labelFormatter={(label) => `${l ? 'Mes' : 'Month'}: ${label}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend 
                formatter={(value) => value === "spent" ? (l ? "Gastado" : "Spent") : (l ? "Presupuesto" : "Budget")}
              />
              {globalBudget > 0 && (
                <ReferenceLine 
                  y={globalBudget} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: l ? "Límite" : "Limit", 
                    position: "right",
                    fontSize: 11,
                    fill: "hsl(var(--destructive))"
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="spent"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#spentGradient)"
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {globalBudget === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {l 
              ? 'Configura un presupuesto global para ver la línea de referencia.'
              : 'Set a global budget to see the reference line.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
