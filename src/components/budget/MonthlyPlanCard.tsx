import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useIncome } from "@/hooks/data/useIncome";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useRecurringBills } from "@/hooks/data/useRecurringBills";
import { useUserSettings, UserPreferences } from "@/hooks/data/useUserSettings";
import { useCategoryBudgets } from "@/hooks/data/useCategoryBudgets";
import { startOfMonth, endOfMonth, format, differenceInDays } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowRight,
  Banknote,
  CreditCard,
  Landmark,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  Wallet,
  CalendarRange,
} from "lucide-react";

export function MonthlyPlanCard() {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const daysPassed = differenceInDays(now, monthStart) + 1;
  const daysRemaining = daysInMonth - daysPassed;

  const { data: incomeData } = useIncome({ year: currentYear, month: currentMonth });
  const { data: expenses } = useExpenses({ dateRange: { start: monthStart, end: monthEnd } });
  const { data: bills } = useRecurringBills();
  const { data: settings } = useUserSettings();
  const { data: categoryBudgets } = useCategoryBudgets();

  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;

  const plan = useMemo(() => {
    const totalIncome = incomeData?.reduce((s, i) => s + Number(i.amount), 0) || 0;

    // Fixed bills (active, monthly equivalent)
    const activeBills = (bills || []).filter((b) => b.status === "active");
    const totalFixed = activeBills.reduce((s, b) => {
      const freq = b.frequency;
      const amt = Number(b.amount);
      if (freq === "weekly") return s + amt * 4.33;
      if (freq === "biweekly") return s + amt * 2.17;
      if (freq === "quarterly") return s + amt / 3;
      if (freq === "semi_annual") return s + amt / 6;
      if (freq === "annual") return s + amt / 12;
      return s + amt; // monthly
    }, 0);

    const freeMoney = totalIncome - totalFixed;
    const totalSpent = expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;

    // Variable budget = category budgets sum or (global - fixed)
    const catBudgetTotal = categoryBudgets?.reduce((s, cb) => s + Number(cb.monthly_budget), 0) || 0;
    const variableBudget = catBudgetTotal > 0 ? catBudgetTotal : Math.max(globalBudget - totalFixed, 0);

    const projectedSavings = totalIncome - totalFixed - totalSpent;
    const savingsRate = totalIncome > 0 ? (projectedSavings / totalIncome) * 100 : 0;
    const annualProjectedSavings = projectedSavings * 12;

    // Pace: expected spent so far vs actual
    const expectedSpentSoFar = variableBudget > 0 ? (variableBudget / daysInMonth) * daysPassed : 0;
    const variableSpent = totalSpent; // simplification
    const pace = expectedSpentSoFar > 0 ? (variableSpent / expectedSpentSoFar) * 100 : 0;

    const paidBillsCount = activeBills.filter((b) => {
      if (!b.last_paid_date) return false;
      const pd = new Date(b.last_paid_date);
      return pd >= monthStart && pd <= monthEnd;
    }).length;

    return {
      totalIncome,
      totalFixed,
      fixedBillsCount: activeBills.length,
      paidBillsCount,
      freeMoney,
      variableBudget,
      totalSpent,
      projectedSavings,
      savingsRate,
      annualProjectedSavings,
      pace,
      dailyBudget: daysRemaining > 0 && freeMoney - totalSpent > 0 ? (freeMoney - totalSpent) / daysRemaining : 0,
    };
  }, [incomeData, bills, expenses, categoryBudgets, globalBudget, monthStart, monthEnd, daysInMonth, daysPassed, daysRemaining]);

  const steps = [
    {
      icon: Banknote,
      label: l ? "Ingreso Mensual" : "Monthly Income",
      value: fc(plan.totalIncome),
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      icon: CreditCard,
      label: l ? "Pagos Fijos" : "Fixed Payments",
      value: `-${fc(plan.totalFixed)}`,
      sub: `${plan.paidBillsCount}/${plan.fixedBillsCount} ${l ? "pagados" : "paid"}`,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    {
      icon: Wallet,
      label: l ? "Dinero Libre" : "Free Money",
      value: fc(plan.freeMoney),
      color: plan.freeMoney >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      icon: Landmark,
      label: l ? "Gastado Variable" : "Variable Spent",
      value: fc(plan.totalSpent),
      sub: plan.variableBudget > 0
        ? `${l ? "de" : "of"} ${fc(plan.variableBudget)} ${l ? "presupuestado" : "budgeted"}`
        : undefined,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      icon: PiggyBank,
      label: l ? "Ahorro Proyectado" : "Projected Savings",
      value: fc(plan.projectedSavings),
      sub: `${plan.savingsRate.toFixed(0)}% ${l ? "tasa de ahorro" : "savings rate"}`,
      color: plan.projectedSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <Card className="relative overflow-hidden col-span-full">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-emerald-500/5" />
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-base">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/25"
            >
              <ShieldCheck className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {l ? "Plan Mensual" : "Monthly Plan"}
              </span>
              <p className="text-xs text-muted-foreground font-normal">
                {format(now, "MMMM yyyy", { locale: l ? es : enUS })}
              </p>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            {plan.dailyBudget > 0 && (
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-700 dark:text-amber-400">
                {fc(plan.dailyBudget)}/{l ? "día" : "day"}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              <CalendarRange className="h-3 w-3 mr-1" />
              {daysRemaining} {l ? "días restantes" : "days left"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {/* Flow steps */}
        <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-1">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-center gap-1 flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "flex-1 rounded-xl border p-3 space-y-1",
                    step.bg,
                    step.border
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", step.color)} />
                    <span className="text-[11px] text-muted-foreground font-medium truncate">{step.label}</span>
                  </div>
                  <p className={cn("text-lg font-bold leading-tight", step.color)}>{step.value}</p>
                  {step.sub && (
                    <p className="text-[10px] text-muted-foreground">{step.sub}</p>
                  )}
                </motion.div>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden md:block h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}
                {i < steps.length - 1 && (
                  <ArrowDown className="md:hidden h-4 w-4 text-muted-foreground/40 shrink-0 mx-auto" />
                )}
              </div>
            );
          })}
        </div>

        {/* Annual projection bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/15 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-muted-foreground">
              {l ? "Proyección anual de ahorro" : "Annual savings projection"}
            </span>
          </div>
          <span className={cn(
            "text-sm font-bold",
            plan.annualProjectedSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            {fc(plan.annualProjectedSavings)}
          </span>
        </motion.div>

        {/* Pace indicator */}
        {plan.variableBudget > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(plan.pace, 100)}%` }}
                transition={{ duration: 0.6 }}
                className={cn(
                  "h-full rounded-full",
                  plan.pace <= 100 ? "bg-emerald-500" : "bg-red-500"
                )}
              />
            </div>
            <span className="shrink-0">
              {l ? "Ritmo:" : "Pace:"} {plan.pace.toFixed(0)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
