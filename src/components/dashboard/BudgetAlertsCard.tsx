import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useCategoryBudgets } from "@/hooks/data/useCategoryBudgets";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { getCategoryLabel, ExpenseCategory } from "@/lib/constants/expense-categories";

interface BudgetAlert {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
  threshold: number;
  status: "safe" | "warning" | "danger" | "exceeded";
}

export function BudgetAlertsCard() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const { data: expenses } = useExpenses({
    dateRange: { start: monthStart, end: monthEnd },
  });

  const { data: budgets } = useCategoryBudgets();

  if (!budgets || budgets.length === 0) {
    return null;
  }

  // Calculate spending by category
  const spendingByCategory: Record<string, number> = {};
  expenses?.forEach((expense) => {
    if (expense.category) {
      spendingByCategory[expense.category] = (spendingByCategory[expense.category] || 0) + Number(expense.amount);
    }
  });

  // Generate alerts
  const alerts: BudgetAlert[] = budgets
    .map((budget) => {
      const spent = spendingByCategory[budget.category] || 0;
      const percentage = budget.monthly_budget > 0 ? (spent / budget.monthly_budget) * 100 : 0;
      
      let status: BudgetAlert["status"] = "safe";
      if (percentage >= 100) status = "exceeded";
      else if (percentage >= 90) status = "danger";
      else if (percentage >= budget.alert_threshold) status = "warning";

      return {
        category: budget.category,
        budget: budget.monthly_budget,
        spent,
        percentage,
        threshold: budget.alert_threshold,
        status,
      };
    })
    .filter((alert) => alert.status !== "safe")
    .sort((a, b) => b.percentage - a.percentage);

  if (alerts.length === 0) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Presupuestos bajo control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Todos tus presupuestos están dentro del límite para {format(now, "MMMM", { locale: es })}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Alertas de Presupuesto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <Alert
            key={alert.category}
            variant={alert.status === "exceeded" ? "destructive" : "default"}
            className={
              alert.status === "warning"
                ? "border-amber-500/50 bg-amber-500/10"
                : alert.status === "danger"
                ? "border-orange-500/50 bg-orange-500/10"
                : ""
            }
          >
            <div className="flex items-start gap-2">
              {alert.status === "exceeded" ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <TrendingUp className="h-4 w-4 text-amber-500" />
              )}
              <div className="flex-1 space-y-2">
                <AlertTitle className="text-sm font-medium">
                  {getCategoryLabel(alert.category as ExpenseCategory)}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  {alert.status === "exceeded" ? (
                    <>Excediste tu presupuesto por ${(alert.spent - alert.budget).toFixed(2)}</>
                  ) : (
                    <>Has gastado ${alert.spent.toFixed(2)} de ${alert.budget.toFixed(2)}</>
                  )}
                </AlertDescription>
                <div className="space-y-1">
                  <Progress 
                    value={Math.min(alert.percentage, 100)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {alert.percentage.toFixed(0)}% utilizado
                  </p>
                </div>
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
