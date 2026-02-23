import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useIncome } from "@/hooks/data/useIncome";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useRecurringBills } from "@/hooks/data/useRecurringBills";
import { useUserSettings, UserPreferences } from "@/hooks/data/useUserSettings";
import { useCategoryBudgets } from "@/hooks/data/useCategoryBudgets";
import { useBudgetEntity } from "@/contexts/BudgetEntityContext";
import { startOfMonth, endOfMonth, differenceInDays } from "date-fns";

export interface MonthlyPlanData {
  totalIncome: number;
  totalFixed: number;
  fixedBillsCount: number;
  paidBillsCount: number;
  unpaidBills: Array<{ name: string; amount: number; nextDue: string; overdue: boolean }>;
  freeMoney: number;
  variableBudget: number;
  totalSpent: number;
  projectedSavings: number;
  savingsRate: number;
  annualProjectedSavings: number;
  pace: number;
  dailyBudget: number;
  daysRemaining: number;
  daysPassed: number;
  daysInMonth: number;
  // Missing data flags
  hasIncome: boolean;
  hasBills: boolean;
  hasBudget: boolean;
  hasCategoryBudgets: boolean;
  hasExpenses: boolean;
  // Projection data (6 months)
  monthlyProjection: Array<{ month: string; income: number; expenses: number; savings: number }>;
  // Alerts
  alerts: Array<{ type: "danger" | "warning" | "info" | "success"; message: string; action?: string; link?: string }>;
  // Category breakdown
  categorySpending: Array<{ category: string; spent: number; budget: number; percentage: number }>;
  // Financial health score (0-100)
  healthScore: number;
  healthLabel: string;
  // Top spending category
  topCategory: { category: string; spent: number } | null;
  // Cumulative savings for the month chart
  cumulativeData: Array<{ day: number; spent: number; ideal: number }>;
}

export function useMonthlyPlanData(): MonthlyPlanData {
  const { language } = useLanguage();
  const l = language === "es";
  const budgetEntityId = useBudgetEntity();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const daysPassed = differenceInDays(now, monthStart) + 1;
  const daysRemaining = daysInMonth - daysPassed;

  const { data: incomeData } = useIncome({
    year: currentYear,
    month: currentMonth,
    entityId: budgetEntityId ?? undefined,
    showAllEntities: budgetEntityId === undefined,
  });
  const { data: expenses } = useExpenses({
    dateRange: { start: monthStart, end: monthEnd },
    entityId: budgetEntityId ?? undefined,
    showAllEntities: budgetEntityId === undefined,
  });
  const { data: bills } = useRecurringBills();
  const { data: settings } = useUserSettings();
  const { data: categoryBudgets } = useCategoryBudgets(budgetEntityId);

  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;

  return useMemo(() => {
    const totalIncome = incomeData?.reduce((s, i) => s + Number(i.amount), 0) || 0;
    
    // Filter bills by entity context
    const allActiveBills = (bills || []).filter((b) => b.status === "active");
    const activeBills = budgetEntityId === undefined
      ? allActiveBills // unified: all bills
      : allActiveBills.filter((b) =>
          budgetEntityId === null
            ? !b.entity_id // family: no entity
            : b.entity_id === budgetEntityId // specific entity
        );

    const totalFixed = activeBills.reduce((s, b) => {
      const freq = b.frequency;
      const amt = Number(b.amount);
      if (freq === "weekly") return s + amt * 4.33;
      if (freq === "biweekly") return s + amt * 2.17;
      if (freq === "quarterly") return s + amt / 3;
      if (freq === "semi_annual") return s + amt / 6;
      if (freq === "annual") return s + amt / 12;
      return s + amt;
    }, 0);

    const paidBillsCount = activeBills.filter((b) => {
      if (!b.last_paid_date) return false;
      const pd = new Date(b.last_paid_date);
      return pd >= monthStart && pd <= monthEnd;
    }).length;

    const unpaidBills = activeBills
      .filter((b) => {
        if (!b.last_paid_date) return true;
        const pd = new Date(b.last_paid_date);
        return pd < monthStart || pd > monthEnd;
      })
      .map((b) => ({
        name: b.name,
        amount: Number(b.amount),
        nextDue: b.next_due_date,
        overdue: new Date(b.next_due_date) < now,
      }))
      .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime());

    const freeMoney = totalIncome - totalFixed;
    const totalSpent = expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;

    const catBudgetTotal = categoryBudgets?.reduce((s, cb) => s + Number(cb.monthly_budget), 0) || 0;
    const variableBudget = catBudgetTotal > 0 ? catBudgetTotal : Math.max(globalBudget - totalFixed, 0);

    const projectedSavings = totalIncome - totalFixed - totalSpent;
    const savingsRate = totalIncome > 0 ? (projectedSavings / totalIncome) * 100 : 0;
    const annualProjectedSavings = projectedSavings * 12;

    const expectedSpentSoFar = variableBudget > 0 ? (variableBudget / daysInMonth) * daysPassed : 0;
    const pace = expectedSpentSoFar > 0 ? (totalSpent / expectedSpentSoFar) * 100 : 0;
    const dailyBudget = daysRemaining > 0 && freeMoney - totalSpent > 0 ? (freeMoney - totalSpent) / daysRemaining : 0;

    // Category spending breakdown
    const catMap: Record<string, number> = {};
    (expenses || []).forEach((e) => {
      const cat = e.category || "other";
      catMap[cat] = (catMap[cat] || 0) + Number(e.amount);
    });
    const catBudgetMap: Record<string, number> = {};
    (categoryBudgets || []).forEach((cb) => {
      catBudgetMap[cb.category] = Number(cb.monthly_budget);
    });
    const allCats = new Set([...Object.keys(catMap), ...Object.keys(catBudgetMap)]);
    const categorySpending = Array.from(allCats).map((cat) => {
      const spent = catMap[cat] || 0;
      const budget = catBudgetMap[cat] || 0;
      return { category: cat, spent, budget, percentage: budget > 0 ? (spent / budget) * 100 : 0 };
    }).sort((a, b) => b.spent - a.spent);

    // 6-month projection
    const monthNames = l
      ? ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyProjection = [];
    for (let i = 0; i < 6; i++) {
      const mIdx = (now.getMonth() + i) % 12;
      const projIncome = totalIncome; // assume stable
      const projExpenses = totalFixed + (totalSpent > 0 ? totalSpent : variableBudget);
      const projSavings = projIncome - projExpenses;
      monthlyProjection.push({
        month: monthNames[mIdx],
        income: Math.round(projIncome),
        expenses: Math.round(projExpenses),
        savings: Math.round(projSavings),
      });
    }

    // Alerts
    const alerts: MonthlyPlanData["alerts"] = [];

    if (totalIncome === 0) {
      alerts.push({
        type: "danger",
        message: l ? "No has registrado ingresos este mes" : "No income recorded this month",
        action: l ? "Registrar ingreso" : "Add income",
        link: "/income",
      });
    }

    if (activeBills.length === 0) {
      alerts.push({
        type: "warning",
        message: l ? "No tienes pagos fijos configurados" : "No fixed payments configured",
        action: l ? "Agregar pagos" : "Add payments",
        link: "/banking",
      });
    }

    if (globalBudget === 0 && catBudgetTotal === 0) {
      alerts.push({
        type: "warning",
        message: l ? "No tienes presupuesto configurado" : "No budget configured",
        action: l ? "Configurar" : "Set up",
      });
    }

    const overdueBills = unpaidBills.filter((b) => b.overdue);
    if (overdueBills.length > 0) {
      alerts.push({
        type: "danger",
        message: l
          ? `${overdueBills.length} pago(s) vencido(s)`
          : `${overdueBills.length} overdue payment(s)`,
        action: l ? "Ver pagos" : "View payments",
        link: "/banking",
      });
    }

    if (pace > 120) {
      alerts.push({
        type: "danger",
        message: l
          ? `Estás gastando ${Math.round(pace - 100)}% más de lo planificado`
          : `You're spending ${Math.round(pace - 100)}% more than planned`,
      });
    } else if (pace > 100) {
      alerts.push({
        type: "warning",
        message: l ? "Estás ligeramente sobre tu ritmo ideal" : "You're slightly over your ideal pace",
      });
    }

    if (totalIncome > 0 && totalSpent === 0) {
      alerts.push({
        type: "warning",
        message: l
          ? "Tienes ingresos pero no has registrado gastos este mes. Las métricas no reflejan tu realidad financiera."
          : "You have income but no expenses recorded this month. Metrics don't reflect your financial reality.",
        action: l ? "Registrar gastos" : "Add expenses",
        link: "/expenses",
      });
    }

    if (savingsRate >= 20 && totalSpent > 0) {
      alerts.push({
        type: "success",
        message: l
          ? `¡Excelente! Tasa de ahorro del ${savingsRate.toFixed(0)}%`
          : `Excellent! ${savingsRate.toFixed(0)}% savings rate`,
      });
    }

    const categoriesOverBudget = categorySpending.filter((c) => c.budget > 0 && c.percentage > 100);
    if (categoriesOverBudget.length > 0) {
      alerts.push({
        type: "warning",
        message: l
          ? `${categoriesOverBudget.length} categoría(s) excedieron su presupuesto`
          : `${categoriesOverBudget.length} category(ies) exceeded budget`,
      });
    }

    const categoriesWithoutBudget = categorySpending.filter((c) => c.spent > 0 && c.budget === 0);
    if (categoriesWithoutBudget.length > 0) {
      alerts.push({
        type: "info",
        message: l
          ? `${categoriesWithoutBudget.length} categoría(s) sin presupuesto asignado`
          : `${categoriesWithoutBudget.length} category(ies) without budget`,
      });
    }

    // Financial Health Score (0-100) - savings bonuses only when expenses exist
    let healthScore = 50; // base
    if (totalIncome > 0) healthScore += 10;
    if (activeBills.length > 0) healthScore += 5;
    if (globalBudget > 0 || catBudgetTotal > 0) healthScore += 10;
    // Only award savings points when expenses are actually recorded
    if (totalSpent > 0) {
      if (savingsRate >= 20) healthScore += 15;
      else if (savingsRate >= 10) healthScore += 8;
      else if (savingsRate > 0) healthScore += 3;
    }
    if (pace <= 100 && pace > 0) healthScore += 10;
    else if (pace > 120) healthScore -= 15;
    if (overdueBills.length > 0) healthScore -= 10 * overdueBills.length;
    if (categoriesOverBudget.length > 0) healthScore -= 5 * categoriesOverBudget.length;
    // Penalize incomplete data (income without expenses)
    if (totalIncome > 0 && totalSpent === 0) healthScore -= 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    const healthLabel = healthScore >= 80
      ? (l ? "Excelente" : "Excellent")
      : healthScore >= 60
      ? (l ? "Bueno" : "Good")
      : healthScore >= 40
      ? (l ? "Regular" : "Fair")
      : (l ? "Necesita atención" : "Needs attention");

    // Top spending category
    const topCategory = categorySpending.length > 0
      ? { category: categorySpending[0].category, spent: categorySpending[0].spent }
      : null;

    // Cumulative daily spending vs ideal
    const cumulativeData: MonthlyPlanData["cumulativeData"] = [];
    const sortedExpenses = [...(expenses || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const idealDailySpend = variableBudget > 0 ? variableBudget / daysInMonth : 0;
    let cumSpent = 0;
    for (let d = 1; d <= daysPassed; d++) {
      const dayExpenses = sortedExpenses.filter((e) => new Date(e.date).getDate() === d);
      cumSpent += dayExpenses.reduce((s, e) => s + Number(e.amount), 0);
      cumulativeData.push({ day: d, spent: Math.round(cumSpent), ideal: Math.round(idealDailySpend * d) });
    }

    return {
      totalIncome,
      totalFixed,
      fixedBillsCount: activeBills.length,
      paidBillsCount,
      unpaidBills,
      freeMoney,
      variableBudget,
      totalSpent,
      projectedSavings,
      savingsRate,
      annualProjectedSavings,
      pace,
      dailyBudget,
      daysRemaining,
      daysPassed,
      daysInMonth,
      hasIncome: totalIncome > 0,
      hasBills: activeBills.length > 0,
      hasBudget: globalBudget > 0 || catBudgetTotal > 0,
      hasCategoryBudgets: catBudgetTotal > 0,
      hasExpenses: totalSpent > 0,
      monthlyProjection,
      alerts,
      categorySpending,
      healthScore,
      healthLabel,
      topCategory,
      cumulativeData,
    };
  }, [incomeData, bills, expenses, categoryBudgets, globalBudget, budgetEntityId, monthStart, monthEnd, daysInMonth, daysPassed, daysRemaining, l, now]);
}
