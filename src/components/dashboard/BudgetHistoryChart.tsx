import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useUserSettings, UserPreferences } from "@/hooks/data/useUserSettings";
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
import { es } from "date-fns/locale";

export function BudgetHistoryChart() {
  const { data: settings } = useUserSettings();
  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;

  // Get last 6 months of data
  const now = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));

  const { data: expenses, isLoading } = useExpenses({
    dateRange: { start: sixMonthsAgo, end: endOfMonth(now) },
  });

  const chartData = useMemo(() => {
    if (!expenses) return [];

    const monthlyData: Record<string, { month: string; spent: number; budget: number; monthKey: string }> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, "yyyy-MM");
      const monthLabel = format(date, "MMM yy", { locale: es });
      monthlyData[monthKey] = {
        month: monthLabel,
        monthKey,
        spent: 0,
        budget: globalBudget,
      };
    }

    // Sum expenses by month
    expenses.forEach((expense) => {
      const monthKey = format(new Date(expense.date), "yyyy-MM");
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].spent += Number(expense.amount);
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [expenses, globalBudget]);

  const avgSpent = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((sum, d) => sum + d.spent, 0) / chartData.length;
  }, [chartData]);

  const monthsOverBudget = useMemo(() => {
    if (globalBudget === 0) return 0;
    return chartData.filter(d => d.spent > globalBudget).length;
  }, [chartData, globalBudget]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Cargando historial...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-5 w-5 text-primary" />
          Historial de Presupuesto (6 meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">${avgSpent.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Promedio mensual</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">${globalBudget.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Presupuesto</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className={`text-2xl font-bold ${monthsOverBudget > 0 ? "text-destructive" : "text-green-500"}`}>
              {monthsOverBudget}
            </p>
            <p className="text-xs text-muted-foreground">Meses excedidos</p>
          </div>
        </div>

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
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(2)}`,
                  name === "spent" ? "Gastado" : "Presupuesto"
                ]}
                labelFormatter={(label) => `Mes: ${label}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend 
                formatter={(value) => value === "spent" ? "Gastado" : "Presupuesto"}
              />
              {globalBudget > 0 && (
                <ReferenceLine 
                  y={globalBudget} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: "Límite", 
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
          <p className="text-xs text-muted-foreground text-center mt-2">
            Configura un presupuesto global para ver la línea de referencia.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
