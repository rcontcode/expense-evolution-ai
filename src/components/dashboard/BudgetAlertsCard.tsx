import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Wallet, PiggyBank, Zap, ShieldCheck, BarChart3 } from "lucide-react";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useIncome } from "@/hooks/data/useIncome";
import { useCategoryBudgets } from "@/hooks/data/useCategoryBudgets";
import { useUserSettings, UserPreferences } from "@/hooks/data/useUserSettings";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useLanguage } from "@/contexts/LanguageContext";
import { startOfMonth, endOfMonth, format, differenceInDays } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { getCategoryLabel, ExpenseCategory } from "@/lib/constants/expense-categories";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BudgetAlert {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
  threshold: number;
  status: "safe" | "warning" | "danger" | "exceeded";
  isGlobal?: boolean;
}

export function BudgetAlertsCard() {
  const { language } = useLanguage();
  const { formatCurrency: fc } = useFormatCurrency();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const l = language === 'es';

  const { data: expenses } = useExpenses({
    dateRange: { start: monthStart, end: monthEnd },
  });

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const { data: incomeData } = useIncome({ year: currentYear, month: currentMonth });

  const { data: budgets } = useCategoryBudgets();
  const { data: settings } = useUserSettings();

  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;
  const globalThreshold = preferences.global_budget_alert_threshold || 80;

  const totalSpent = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  const totalMonthlyIncome = incomeData?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;
  const savingsRate = totalMonthlyIncome > 0 ? ((totalMonthlyIncome - totalSpent) / totalMonthlyIncome) * 100 : 0;

  // Spending by category
  const spendingByCategory: Record<string, number> = {};
  expenses?.forEach((expense) => {
    if (expense.category) {
      spendingByCategory[expense.category] = (spendingByCategory[expense.category] || 0) + Number(expense.amount);
    }
  });

  // Days info for spending pace
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const daysPassed = differenceInDays(now, monthStart) + 1;
  const idealPace = daysPassed / daysInMonth;

  // Category health when all budgets are OK
  const categoryHealth = useMemo(() => {
    if (!budgets || budgets.length === 0) return [];
    return budgets.map(budget => {
      const spent = spendingByCategory[budget.category] || 0;
      const percentage = budget.monthly_budget > 0 ? (spent / budget.monthly_budget) * 100 : 0;
      const remaining = budget.monthly_budget - spent;
      return { ...budget, spent, percentage, remaining };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [budgets, spendingByCategory]);

  // Generate alerts
  const alerts: BudgetAlert[] = [];

  if (globalBudget > 0) {
    const globalPercentage = (totalSpent / globalBudget) * 100;
    let globalStatus: BudgetAlert["status"] = "safe";
    if (globalPercentage >= 100) globalStatus = "exceeded";
    else if (globalPercentage >= 90) globalStatus = "danger";
    else if (globalPercentage >= globalThreshold) globalStatus = "warning";

    if (globalStatus !== "safe") {
      alerts.push({
        category: "global",
        budget: globalBudget,
        spent: totalSpent,
        percentage: globalPercentage,
        threshold: globalThreshold,
        status: globalStatus,
        isGlobal: true,
      });
    }
  }

  if (budgets) {
    budgets.forEach((budget) => {
      const spent = spendingByCategory[budget.category] || 0;
      const percentage = budget.monthly_budget > 0 ? (spent / budget.monthly_budget) * 100 : 0;
      
      let status: BudgetAlert["status"] = "safe";
      if (percentage >= 100) status = "exceeded";
      else if (percentage >= 90) status = "danger";
      else if (percentage >= budget.alert_threshold) status = "warning";

      if (status !== "safe") {
        alerts.push({
          category: budget.category,
          budget: budget.monthly_budget,
          spent,
          percentage,
          threshold: budget.alert_threshold,
          status,
        });
      }
    });
  }

  alerts.sort((a, b) => b.percentage - a.percentage);

  if (!budgets?.length && !globalBudget) {
    return null;
  }

  // Calculate spending pace
  const globalPace = globalBudget > 0 ? (totalSpent / globalBudget) / idealPace : 0;
  const paceStatus = globalPace <= 0.9 ? 'under' : globalPace <= 1.1 ? 'on_track' : 'over';

  // SUCCESS STATE - Much richer
  if (alerts.length === 0) {
    const bestCategory = categoryHealth.length > 0 ? categoryHealth[categoryHealth.length - 1] : null;
    const worstCategory = categoryHealth.length > 0 ? categoryHealth[0] : null;

    return (
      <Card className="relative overflow-hidden border-2 border-emerald-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
        
        <CardHeader className="pb-2 relative">
          <CardTitle className="flex items-center gap-3 text-base">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25"
            >
              <ShieldCheck className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                {l ? 'Presupuestos bajo control' : 'Budgets under control'}
              </span>
              <p className="text-xs text-muted-foreground font-normal">
                {format(now, "MMMM yyyy", { locale: l ? es : enUS })}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {/* Spending Pace */}
          {globalBudget > 0 && (
            <div className={cn(
              "p-3 rounded-xl flex items-center gap-3",
              paceStatus === 'under' ? "bg-emerald-500/10 border border-emerald-500/20" :
              paceStatus === 'on_track' ? "bg-chart-2/10 border border-chart-2/20" :
              "bg-amber-500/10 border border-amber-500/20"
            )}>
              <Zap className={cn(
                "h-5 w-5",
                paceStatus === 'under' ? "text-emerald-500" :
                paceStatus === 'on_track' ? "text-chart-2" : "text-amber-500"
              )} />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {l ? 'Ritmo de gasto' : 'Spending pace'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {paceStatus === 'under' 
                    ? (l ? 'Vas por debajo del ritmo ideal — ¡excelente!' : "You're below ideal pace — excellent!")
                    : paceStatus === 'on_track'
                    ? (l ? 'Vas al ritmo esperado para este punto del mes' : "You're on track for this point in the month")
                    : (l ? 'Vas un poco por encima del ritmo ideal' : "You're slightly above ideal pace")}
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {(globalPace * 100).toFixed(0)}%
              </Badge>
            </div>
          )}

          {/* Savings Rate */}
          {totalMonthlyIncome > 0 && (
            <div className={cn(
              "p-3 rounded-xl flex items-center gap-3",
              savingsRate >= 20 ? "bg-emerald-500/10 border border-emerald-500/20" :
              savingsRate >= 0 ? "bg-amber-500/10 border border-amber-500/20" :
              "bg-destructive/10 border border-destructive/20"
            )}>
              <PiggyBank className={cn(
                "h-5 w-5",
                savingsRate >= 20 ? "text-emerald-500" : savingsRate >= 0 ? "text-amber-500" : "text-destructive"
              )} />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {l ? 'Tasa de ahorro' : 'Savings rate'}: {savingsRate.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {fc(totalMonthlyIncome - totalSpent)} {l ? 'disponible este mes' : 'available this month'}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {savingsRate >= 20 ? '🏆' : savingsRate >= 10 ? '👍' : '💪'}
              </Badge>
            </div>
          )}

          {/* Top categories summary */}
          {categoryHealth.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {l ? 'Resumen por categoría' : 'Category summary'}
              </p>
              <div className="space-y-2">
                {categoryHealth.slice(0, 4).map((cat, idx) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs font-medium w-24 truncate">
                      {getCategoryLabel(cat.category as ExpenseCategory)}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(cat.percentage, 100)}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        className={cn(
                          "h-full rounded-full",
                          cat.percentage >= 80 ? "bg-amber-500" :
                          cat.percentage >= 50 ? "bg-chart-2" : "bg-emerald-500"
                        )}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right font-mono">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Best & Watch categories */}
          {bestCategory && worstCategory && categoryHealth.length >= 2 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
                <p className="text-[10px] text-muted-foreground">{l ? '✨ Mejor control' : '✨ Best control'}</p>
                <p className="text-xs font-semibold truncate">
                  {getCategoryLabel(bestCategory.category as ExpenseCategory)}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  {bestCategory.percentage.toFixed(0)}% {l ? 'usado' : 'used'}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
                <p className="text-[10px] text-muted-foreground">{l ? '👀 Vigilar' : '👀 Watch'}</p>
                <p className="text-xs font-semibold truncate">
                  {getCategoryLabel(worstCategory.category as ExpenseCategory)}
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  {worstCategory.percentage.toFixed(0)}% {l ? 'usado' : 'used'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ALERT STATE
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-amber-700 dark:text-amber-400 font-bold">
              {l ? 'Alertas de Presupuesto' : 'Budget Alerts'}
            </span>
            <p className="text-xs text-muted-foreground font-normal">
              {alerts.length} {l ? 'requieren atención' : 'need attention'}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 relative">
        {/* Savings Rate Indicator */}
        {totalMonthlyIncome > 0 && (
          <div className={cn(
            "flex items-center gap-2 p-2.5 rounded-xl text-sm",
            savingsRate >= 20 ? 'bg-emerald-500/10 border border-emerald-500/20' 
            : savingsRate >= 0 ? 'bg-amber-500/10 border border-amber-500/20'
            : 'bg-destructive/10 border border-destructive/20'
          )}>
            <PiggyBank className={cn(
              "h-4 w-4 shrink-0",
              savingsRate >= 20 ? "text-emerald-500" : savingsRate >= 0 ? "text-amber-500" : "text-destructive"
            )} />
            <span className="font-medium">
              {l ? 'Tasa de ahorro' : 'Savings rate'}: {savingsRate.toFixed(0)}%
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {fc(totalMonthlyIncome - totalSpent)} {l ? 'disponible' : 'available'}
            </span>
          </div>
        )}
        {alerts.map((alert, idx) => (
          <motion.div
            key={alert.category}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Alert
              variant={alert.status === "exceeded" ? "destructive" : "default"}
              className={cn(
                "rounded-xl",
                alert.status === "warning"
                  ? "border-amber-500/50 bg-amber-500/10"
                  : alert.status === "danger"
                  ? "border-orange-500/50 bg-orange-500/10"
                  : ""
              )}
            >
              <div className="flex items-start gap-2">
                {alert.status === "exceeded" ? (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ) : alert.isGlobal ? (
                  <Wallet className="h-4 w-4 text-amber-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                )}
                <div className="flex-1 space-y-2">
                  <AlertTitle className="text-sm font-medium">
                    {alert.isGlobal 
                      ? (l ? 'Presupuesto Global' : 'Global Budget')
                      : getCategoryLabel(alert.category as ExpenseCategory)}
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {alert.status === "exceeded" ? (
                      <>{l ? 'Excediste tu presupuesto por' : 'You exceeded your budget by'} {fc(alert.spent - alert.budget)}</>
                    ) : (
                      <>{l ? 'Has gastado' : 'You spent'} {fc(alert.spent)} {l ? 'de' : 'of'} {fc(alert.budget)}</>
                    )}
                  </AlertDescription>
                  <div className="space-y-1">
                    <Progress 
                      value={Math.min(alert.percentage, 100)} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {alert.percentage.toFixed(0)}% {l ? 'utilizado' : 'used'}
                    </p>
                  </div>
                </div>
              </div>
            </Alert>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
