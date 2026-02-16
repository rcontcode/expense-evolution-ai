import { useState, lazy, Suspense, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useMonthlyPlanData } from "@/hooks/data/useMonthlyPlanData";
import { useUserSettings, BudgetMode } from "@/hooks/data/useUserSettings";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useRecurringBills, useCreateBill, useUpdateBill, type RecurringBill, type BillInsert } from "@/hooks/data/useRecurringBills";
import { EXPENSE_CATEGORY_TRANSLATIONS, ExpenseCategory } from "@/lib/constants/expense-categories";
import { BILL_CATEGORY_CONFIG, BillCategory } from "@/lib/constants/bill-categories";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Plus, Settings2, Upload, CreditCard } from "lucide-react";
import { format, startOfMonth, endOfMonth, differenceInDays, parseISO, subMonths } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Family sub-components
import { CollapsibleSection } from "./family/CollapsibleSection";
import { MiniCard } from "./family/MiniCard";
import { EmptyState } from "./family/EmptyState";
import { SpendingDonut } from "./family/SpendingDonut";
import { SmartInsights } from "./family/SmartInsights";
import { FamilyFAB } from "./family/FamilyFAB";
import { HealthGauge } from "./family/HealthGauge";
import { MonthlyHeatmap } from "./family/MonthlyHeatmap";
import { DebtSnapshot } from "./family/DebtSnapshot";
import { GamificationStreak } from "./family/GamificationStreak";
import { BudgetOnboarding } from "./family/BudgetOnboarding";
import { CumulativeSpendingChart } from "./family/CumulativeSpendingChart";
import { BudgetVsActualChart } from "./family/BudgetVsActualChart";
import { UpcomingReminders } from "./family/UpcomingReminders";
import { MonthComparisonChart } from "./family/MonthComparisonChart";
import { SavingsGoalsWidget } from "./family/SavingsGoalsWidget";
import { BudgetRulesWidget } from "./family/BudgetRulesWidget";
import { BudgetAuditLogWidget } from "./family/BudgetAuditLogWidget";
import { YearComparisonChart } from "./family/YearComparisonChart";
import { BudgetExportWidget } from "./family/BudgetExportWidget";
import { BudgetPeriodSelector, type BudgetPeriod } from "./family/BudgetPeriodSelector";
import { BudgetContextBar } from "./BudgetContextBar";
import { IncomeListWidget } from "./family/IncomeListWidget";

// Family-specific dialogs
import { FamilyExpenseDialog } from "./FamilyExpenseDialog";
import { FamilyIncomeDialog } from "./FamilyIncomeDialog";

// Full-power components reused
import { BillFormDialog } from "@/components/bills/BillFormDialog";
import { QuickCaptureDialog } from "@/components/dialogs/QuickCaptureDialog";
import { BudgetAlertsCard } from "@/components/dashboard/BudgetAlertsCard";
import { CategoryBudgetsCard } from "@/components/dashboard/CategoryBudgetsCard";
import { SubscriptionTracker } from "@/components/subscriptions/SubscriptionTracker";

// Lazy-loaded heavy charts
const BudgetProjectionChart = lazy(() =>
  import("@/components/analytics/BudgetProjectionChart").then(m => ({ default: m.BudgetProjectionChart }))
);
const CashFlowProjection = lazy(() =>
  import("@/components/analytics/CashFlowProjection").then(m => ({ default: m.CashFlowProjection }))
);

function getCatInfo(cat: string, lang: 'es' | 'en') {
  const billCfg = BILL_CATEGORY_CONFIG[cat as BillCategory];
  if (billCfg) return { label: billCfg[lang], icon: billCfg.icon };
  const expCfg = EXPENSE_CATEGORY_TRANSLATIONS[cat as ExpenseCategory];
  if (expCfg) return { label: expCfg[lang], icon: expCfg.icon };
  return { label: cat, icon: '📋' };
}

interface FamilyBudgetViewProps {
  budgetMode: BudgetMode;
  onChangeMode: () => void;
}

export function FamilyBudgetView({ budgetMode, onChangeMode }: FamilyBudgetViewProps) {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();
  const plan = useMonthlyPlanData();
  const navigate = useNavigate();
  const now = new Date();

  // Dialog states
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [showCaptureDialog, setShowCaptureDialog] = useState(false);

  const isUnified = budgetMode === "unified";
  const isSeparated = budgetMode === "separated";
  const monthLabel = format(now, "MMMM yyyy", { locale: l ? es : enUS });

  // Bills data
  const { data: bills } = useRecurringBills();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();

  const handleSaveBill = async (bill: BillInsert, editId?: string) => {
    if (editId) {
      await updateBill.mutateAsync({ id: editId, ...bill });
    } else {
      await createBill.mutateAsync(bill);
    }
    setShowBillDialog(false);
    setEditingBill(null);
  };

  const activeBills = (bills || []).filter(b => b.status === 'active');
  const unpaidBills = activeBills.filter(b => {
    const due = parseISO(b.next_due_date);
    return differenceInDays(due, now) <= 7;
  });
  const overdueBills = plan.unpaidBills.filter(b => b.overdue);

  // Current month expenses
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const { data: allExpenses } = useExpenses({ dateRange: { start: monthStart, end: monthEnd } });

  // Previous month expenses for comparison
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));
  const { data: prevExpenses } = useExpenses({ dateRange: { start: prevMonthStart, end: prevMonthEnd } });

  const familyExpenses = (allExpenses || []).filter(e => !e.entity_id);
  const businessExpenses = (allExpenses || []).filter(e => e.entity_id);
  const familyTotal = familyExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const businessTotal = businessExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const prevFamilyTotal = (prevExpenses || []).filter(e => !e.entity_id).reduce((s, e) => s + Number(e.amount), 0);

  // Group family expenses by category
  const familyCatMap: Record<string, number> = {};
  familyExpenses.forEach(e => {
    const cat = e.category || "other";
    familyCatMap[cat] = (familyCatMap[cat] || 0) + Number(e.amount);
  });
  const familyCategories = Object.entries(familyCatMap)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, spent]) => ({ cat, spent, ...getCatInfo(cat, l ? 'es' : 'en') }));

  // Business categories
  const bizCatMap: Record<string, number> = {};
  businessExpenses.forEach(e => {
    const cat = e.category || "other";
    bizCatMap[cat] = (bizCatMap[cat] || 0) + Number(e.amount);
  });
  const businessCategories = Object.entries(bizCatMap)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, spent]) => ({ cat, spent, ...getCatInfo(cat, l ? 'es' : 'en') }));

  // Month-over-month trends
  const spentTrend = prevFamilyTotal > 0
    ? ((familyTotal - prevFamilyTotal) / prevFamilyTotal) * 100
    : 0;

  const topCategory = familyCategories.length > 0 ? familyCategories[0] : undefined;

  // Heatmap data: daily spending
  const heatmapData = useMemo(() => {
    const dayMap: Record<number, number> = {};
    familyExpenses.forEach(e => {
      const day = new Date(e.date).getDate();
      dayMap[day] = (dayMap[day] || 0) + Number(e.amount);
    });
    const result = [];
    for (let d = 1; d <= plan.daysInMonth; d++) {
      result.push({ day: d, spent: dayMap[d] || 0 });
    }
    return result;
  }, [familyExpenses, plan.daysInMonth]);

  // Categories over budget count
  const categoriesOverBudget = plan.categorySpending.filter(c => c.budget > 0 && c.percentage > 100).length;

  // Determine if user is in "empty" onboarding state
  const hasAnyData = plan.hasIncome || familyExpenses.length > 0 || activeBills.length > 0;

  const SECTION_IDS = [
    { id: 'budget-summary', label: l ? 'Resumen' : 'Summary', emoji: '💰' },
    { id: 'budget-health', label: l ? 'Salud' : 'Health', emoji: '📊' },
    { id: 'budget-pace', label: l ? 'Ritmo' : 'Pace', emoji: '📈' },
    { id: 'budget-payments', label: l ? 'Pagos' : 'Payments', emoji: '⏰' },
    { id: 'budget-categories', label: l ? 'Categorías' : 'Categories', emoji: '🛒' },
    { id: 'budget-goals', label: l ? 'Metas' : 'Goals', emoji: '🎯' },
    { id: 'budget-projections', label: l ? 'Proyecciones' : 'Projections', emoji: '🔮' },
    { id: 'budget-tools', label: l ? 'Herramientas' : 'Tools', emoji: '⚡' },
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground capitalize">
              {isUnified ? "🏠💼" : "🏠"} {monthLabel} — {l ? `Día ${plan.daysPassed} de ${plan.daysInMonth}` : `Day ${plan.daysPassed} of ${plan.daysInMonth}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] px-2.5 py-1 rounded-full font-medium",
              isSeparated
                ? "bg-blue-500/15 text-blue-500 border border-blue-500/20"
                : isUnified
                ? "bg-blue-500/15 text-blue-500 border border-blue-500/20"
                : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20"
            )}>
              {isSeparated
                ? (l ? "🏢 Separado" : "🏢 Separated")
                : isUnified
                ? (l ? "🔗 Unificado" : "🔗 Unified")
                : (l ? "🏡 Familiar" : "🏡 Family")}
            </span>
            <Button variant="ghost" size="sm" onClick={onChangeMode} className="text-xs text-muted-foreground gap-1">
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Context bar: country, currency, language */}
        <BudgetContextBar />
      </motion.div>

      {/* Section scroll nav */}
      {hasAnyData && (
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex gap-1.5 min-w-max pb-1">
            {SECTION_IDS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap border border-transparent hover:border-primary/20"
              >
                <span>{s.emoji}</span> {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ONBOARDING: Show guided steps when no data */}
      {!hasAnyData ? (
        <BudgetOnboarding
          hasIncome={plan.hasIncome}
          hasExpenses={familyExpenses.length > 0}
          hasBills={activeBills.length > 0}
          onAddIncome={() => setShowIncomeDialog(true)}
          onAddExpense={() => setShowExpenseDialog(true)}
          onAddBill={() => { setEditingBill(null); setShowBillDialog(true); }}
          onSmartCapture={() => setShowCaptureDialog(true)}
        />
      ) : (
        <>
          {/* ===== SECTION 1: RESUMEN RÁPIDO (summary strip) ===== */}
          <motion.div id="budget-summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
            <Card className="p-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MiniCard
                  emoji="💰" label={l ? "Ingresos" : "Income"} value={fc(plan.totalIncome)}
                  color="text-emerald-600 dark:text-emerald-400"
                  missing={!plan.hasIncome} missingAction={() => setShowIncomeDialog(true)}
                  missingLabel={l ? "+ Agregar" : "+ Add"}
                />
                <MiniCard
                  emoji="🏦" label={l ? "Pagos Fijos" : "Fixed"} value={fc(plan.totalFixed)}
                  color="text-blue-600 dark:text-blue-400"
                  missing={!plan.hasBills} missingAction={() => setShowBillDialog(true)}
                  missingLabel={l ? "+ Agregar" : "+ Add"}
                />
                <MiniCard
                  emoji="🛒" label={l ? "Gastado" : "Spent"}
                  value={fc(isUnified ? familyTotal + businessTotal : familyTotal)}
                  color="text-amber-600 dark:text-amber-400"
                  trend={prevFamilyTotal > 0 ? { value: -spentTrend, label: l ? "vs mes ant." : "vs last mo." } : undefined}
                />
                <MiniCard
                  emoji="🐷" label={l ? "Disponible" : "Available"}
                  value={fc(plan.freeMoney - plan.totalSpent)}
                  color={plan.freeMoney - plan.totalSpent >= 0 ? "text-primary" : "text-destructive"}
                />
              </div>
              {plan.dailyBudget > 0 && (
                <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-lg">📅</span>
                  <p className="text-sm">
                    <span className="font-semibold">{fc(plan.dailyBudget)}</span>
                    <span className="text-muted-foreground">
                      /{l ? "día" : "day"} · {plan.daysRemaining} {l ? "días restantes" : "days left"}
                    </span>
                  </p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* ===== INCOME LIST: Edit/Delete ===== */}
          <CollapsibleSection
            emoji="💰"
            title={l ? "Ingresos del Mes" : "Monthly Income"}
            subtitle={l ? "Edita o elimina ingresos registrados" : "Edit or delete recorded income"}
            defaultOpen={false}
          >
            <IncomeListWidget />
          </CollapsibleSection>

          {/* ===== SECTION 2: SALUD + INSIGHTS ===== */}
          <div id="budget-health" className="grid gap-5 lg:grid-cols-2">
            <CollapsibleSection
              emoji="📊"
              title={l ? "Salud Financiera" : "Financial Health"}
              subtitle={`${plan.healthScore}/100 · ${plan.healthLabel}`}
              defaultOpen={true}
            >
              <div className="space-y-4">
                <HealthGauge
                  score={plan.healthScore}
                  label={plan.healthLabel}
                  savingsRate={plan.savingsRate}
                  pace={plan.pace}
                />
                {plan.pace > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{l ? "Ritmo de gasto" : "Spending pace"}</span>
                      <span className={cn("font-semibold", plan.pace <= 100 ? "text-emerald-600" : "text-destructive")}>
                        {plan.pace.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={Math.min(plan.pace, 100)} className="h-2" />
                    <p className="text-[11px] text-muted-foreground">
                      {plan.pace <= 100
                        ? `✅ ${l ? "Dentro de lo planificado" : "On track"}`
                        : `⚠️ ${l ? "Gastando más rápido de lo ideal" : "Spending faster than planned"}`}
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              emoji="🧠"
              title={l ? "Consejos Inteligentes" : "Smart Insights"}
              subtitle={l ? "Análisis y recomendaciones" : "Analysis & recommendations"}
              defaultOpen={true}
            >
              <SmartInsights data={{
                totalIncome: plan.totalIncome,
                totalSpent: familyTotal,
                totalFixed: plan.totalFixed,
                freeMoney: plan.freeMoney,
                pace: plan.pace,
                dailyBudget: plan.dailyBudget,
                daysRemaining: plan.daysRemaining,
                daysPassed: plan.daysPassed,
                daysInMonth: plan.daysInMonth,
                topCategory: topCategory ? { label: topCategory.label, spent: topCategory.spent, icon: topCategory.icon } : undefined,
                prevMonthSpent: prevFamilyTotal,
                overdueBills: overdueBills.length,
                categoriesOverBudget,
                projectedSavings: plan.projectedSavings,
              }} />
            </CollapsibleSection>
          </div>

          {/* ===== SECTION 3: RITMO + COMPARACIÓN (only if has expenses) ===== */}
          {familyExpenses.length > 0 && (
            <div id="budget-pace" className="grid gap-5 lg:grid-cols-2">
              <CollapsibleSection
                emoji="📈"
                title={l ? "Ritmo de Gasto Diario" : "Daily Spending Pace"}
                subtitle={l ? "Gasto acumulado vs ritmo ideal" : "Cumulative spending vs ideal pace"}
                defaultOpen={true}
              >
                <CumulativeSpendingChart
                  data={plan.cumulativeData}
                  dailyBudget={plan.dailyBudget}
                  daysInMonth={plan.daysInMonth}
                  daysPassed={plan.daysPassed}
                />
              </CollapsibleSection>

              <CollapsibleSection
                emoji="🎯"
                title={l ? "Presupuesto vs Real" : "Budget vs Actual"}
                subtitle={l ? "Por categoría" : "By category"}
                defaultOpen={plan.hasCategoryBudgets}
              >
                <BudgetVsActualChart
                  categories={plan.categorySpending.map(c => {
                    const info = getCatInfo(c.category, l ? 'es' : 'en');
                    return { ...c, label: info.label, icon: info.icon };
                  })}
                />
              </CollapsibleSection>
            </div>
          )}

          {/* ===== SECTION 4: COMPARACIÓN MENSUAL + RECORDATORIOS ===== */}
          <div id="budget-payments" className="grid gap-5 lg:grid-cols-2">
            <CollapsibleSection
              emoji="📊"
              title={l ? "Comparación Mensual" : "Monthly Comparison"}
              subtitle={l ? "Últimos 3 meses" : "Last 3 months"}
              defaultOpen={true}
            >
              <MonthComparisonChart />
            </CollapsibleSection>

            <CollapsibleSection
              emoji="⏰"
              title={l ? "Próximos Pagos" : "Upcoming Payments"}
              subtitle={l ? "Recordatorios y vencimientos" : "Reminders & due dates"}
              alert={overdueBills.length > 0}
              badge={overdueBills.length > 0 ? `${overdueBills.length} ${l ? "vencido" : "overdue"}` : undefined}
              defaultOpen={activeBills.length > 0}
            >
              <UpcomingReminders />
            </CollapsibleSection>
          </div>

          {/* ===== SECTION 5: GASTOS + PAGOS FIJOS ===== */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Spending Distribution: only show expanded if has expenses */}
            <CollapsibleSection
              emoji="🍩"
              title={l ? "Distribución de Gastos" : "Spending Distribution"}
              subtitle={familyCategories.length > 0
                ? `${familyCategories.length} ${l ? "categorías" : "categories"} · ${fc(familyTotal)}`
                : (l ? "Sin gastos registrados" : "No expenses recorded")}
              defaultOpen={familyCategories.length > 0}
            >
              {familyCategories.length > 0 ? (
                <SpendingDonut
                  categories={familyCategories}
                  total={familyTotal}
                  freeLabel={l ? "Disponible" : "Available"}
                  freeMoney={Math.max(0, plan.freeMoney - plan.totalSpent)}
                />
              ) : (
                <EmptyState emoji="🍩" text={l ? "Registra gastos para ver la distribución" : "Log expenses to see the distribution"} actionLabel={l ? "Agregar gasto" : "Add expense"} onAction={() => setShowExpenseDialog(true)} />
              )}
            </CollapsibleSection>

            {/* Fixed Payments: only expanded if has bills */}
            <CollapsibleSection
              emoji="🏦"
              title={l ? "Pagos Fijos" : "Fixed Payments"}
              subtitle={`${activeBills.length} ${l ? "activos" : "active"} · ${fc(plan.totalFixed)}/${l ? "mes" : "mo"}`}
              alert={overdueBills.length > 0}
              badge={overdueBills.length > 0
                ? `${overdueBills.length} ${l ? "vencido" : "overdue"}`
                : unpaidBills.length > 0
                ? `${unpaidBills.length} ${l ? "pronto" : "soon"}`
                : undefined}
              defaultOpen={activeBills.length > 0}
            >
              <div className="space-y-3">
                {activeBills.length > 0 ? (
                  <div className="space-y-2">
                    {activeBills.slice(0, 8).map((bill) => {
                      const due = parseISO(bill.next_due_date);
                      const daysUntil = differenceInDays(due, now);
                      const isUrgent = daysUntil <= 3;
                      const isOverdue = daysUntil < 0;
                      const catInfo = getCatInfo(bill.category, l ? 'es' : 'en');
                      return (
                        <motion.div
                          key={bill.id}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors",
                            isOverdue ? "bg-destructive/15 border border-destructive/30" :
                            isUrgent ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/30"
                          )}
                          onClick={() => { setEditingBill(bill); setShowBillDialog(true); }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{catInfo.icon}</span>
                            <div>
                              <p className="text-sm font-medium">{bill.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {bill.auto_pay ? "🔄 " : ""}{catInfo.label}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{fc(bill.amount)}</p>
                            <p className={cn("text-[11px]",
                              isOverdue ? "text-destructive font-semibold" :
                              isUrgent ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"
                            )}>
                              {isOverdue ? "🔴 " : isUrgent ? "⚠️ " : ""}
                              {format(due, "dd MMM", { locale: l ? es : enUS })}
                              {isOverdue && ` (${Math.abs(daysUntil)}d ${l ? "atrás" : "ago"})`}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState emoji="🏦" text={l ? "Configura tus pagos recurrentes" : "Set up recurring payments"} actionLabel={l ? "Agregar pago" : "Add payment"} onAction={() => setShowBillDialog(true)} />
                )}
                <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => { setEditingBill(null); setShowBillDialog(true); }}>
                  <Plus className="h-3.5 w-3.5" />
                  {l ? "Nuevo Pago Fijo" : "New Fixed Payment"}
                </Button>
              </div>
            </CollapsibleSection>
          </div>

          {/* ===== SECTION 6: CATEGORÍAS + CALENDARIO (only if has expenses) ===== */}
          {familyExpenses.length > 0 && (
            <div id="budget-categories" className="grid gap-5 lg:grid-cols-2">
              <CollapsibleSection
                emoji="🛒"
                title={l ? "Detalle por Categoría" : "Category Breakdown"}
                subtitle={`${familyCategories.length} ${l ? "categorías" : "categories"} · ${fc(familyTotal)}`}
                badge={categoriesOverBudget > 0 ? `${categoriesOverBudget} ${l ? "excedidas" : "over"}` : undefined}
                alert={categoriesOverBudget > 0}
              >
                <div className="space-y-2">
                  {familyCategories.map(({ cat, spent, icon, label }) => {
                    const budget = plan.categorySpending.find(c => c.category === cat)?.budget || 0;
                    const pct = budget > 0 ? (spent / budget) * 100 : 0;
                    const isOver = pct > 100;
                    return (
                      <div key={cat} className={cn(
                        "p-3 rounded-lg space-y-1.5",
                        isOver ? "bg-destructive/10 border border-destructive/15" : "bg-muted/30"
                      )}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm flex items-center gap-2">
                            <span>{icon}</span> {label}
                            {isOver && <span className="text-[10px] text-destructive font-semibold">⚠️ {l ? "EXCEDIDO" : "OVER"}</span>}
                          </span>
                          <span className="text-sm font-semibold">{fc(spent)}</span>
                        </div>
                        {budget > 0 && (
                          <div className="space-y-0.5">
                            <Progress value={Math.min(pct, 100)} className={cn("h-1.5", isOver && "[&>div]:bg-destructive")} />
                            <p className="text-[10px] text-muted-foreground text-right">
                              {pct.toFixed(0)}% {l ? "de" : "of"} {fc(budget)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                emoji="🗓️"
                title={l ? "Calendario de Gastos" : "Spending Calendar"}
                subtitle={l ? "Mapa de calor diario" : "Daily heatmap"}
              >
                <MonthlyHeatmap
                  data={heatmapData}
                  dailyBudget={plan.dailyBudget}
                  currentDay={plan.daysPassed}
                />
              </CollapsibleSection>
            </div>
          )}

          {/* ===== SECTION 7: LÍMITES + ALERTAS ===== */}
          <div className="grid gap-5 lg:grid-cols-2">
            <CollapsibleSection
              emoji="📏"
              title={l ? "Límites por Categoría" : "Category Budgets"}
              subtitle={l ? "Define cuánto gastar por área" : "Define spending per area"}
            >
              <CategoryBudgetsCard />
            </CollapsibleSection>

            <CollapsibleSection
              emoji="🔔"
              title={l ? "Alertas" : "Alerts"}
              subtitle={l ? "Avisos y recomendaciones" : "Warnings & recommendations"}
              badge={plan.alerts.filter(a => a.type === "danger").length > 0
                ? `${plan.alerts.filter(a => a.type === "danger").length} ${l ? "críticas" : "critical"}`
                : undefined}
              alert={plan.alerts.some(a => a.type === "danger")}
            >
              <BudgetAlertsCard />
            </CollapsibleSection>
          </div>

          {/* ===== SECTION 8: PROYECCIONES (full width) ===== */}
          <div id="budget-projections">
          <CollapsibleSection
            emoji="🔮"
            title={l ? "Proyecciones" : "Projections"}
            subtitle={`${l ? "Ahorro proyectado" : "Projected savings"}: ${fc(plan.projectedSavings)} · ${l ? "Anual" : "Annual"}: ${fc(plan.annualProjectedSavings)}`}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{fc(plan.projectedSavings)}</p>
                  <p className="text-[11px] text-muted-foreground">{l ? "Este mes" : "This month"}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{fc(plan.annualProjectedSavings)}</p>
                  <p className="text-[11px] text-muted-foreground">{l ? "Anual" : "Annual"}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <p className="text-xl font-bold text-primary">{plan.savingsRate.toFixed(0)}%</p>
                  <p className="text-[11px] text-muted-foreground">{l ? "Tasa ahorro" : "Savings rate"}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{fc(plan.dailyBudget)}</p>
                  <p className="text-[11px] text-muted-foreground">{l ? "Diario" : "Daily"}</p>
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <Suspense fallback={<div className="h-48 animate-pulse bg-muted/30 rounded-lg" />}>
                  <BudgetProjectionChart />
                </Suspense>
                <Suspense fallback={<div className="h-48 animate-pulse bg-muted/30 rounded-lg" />}>
                  <CashFlowProjection />
                </Suspense>
              </div>
            </div>
          </CollapsibleSection>
          </div>

          {/* ===== SECTION 8b: METAS DE AHORRO + COMPARACIÓN ANUAL ===== */}
          <div id="budget-goals" className="grid gap-5 lg:grid-cols-2">
            <CollapsibleSection
              emoji="🎯"
              title={l ? "Metas de Ahorro" : "Savings Goals"}
              subtitle={l ? "Define y rastrea tus objetivos" : "Define and track your objectives"}
              defaultOpen={true}
            >
              <SavingsGoalsWidget />
            </CollapsibleSection>

            <CollapsibleSection
              emoji="📅"
              title={l ? "Comparación Año vs Año" : "Year vs Year"}
              subtitle={l ? "Mismos meses, diferente año" : "Same months, different year"}
            >
              <YearComparisonChart />
            </CollapsibleSection>
          </div>

          {/* ===== SECTION 8c: REGLAS + HISTORIAL + EXPORTAR ===== */}
          <div id="budget-tools" className="grid gap-5 lg:grid-cols-3">
            <CollapsibleSection
              emoji="⚡"
              title={l ? "Reglas Automáticas" : "Automatic Rules"}
              subtitle={l ? "Alertas personalizadas" : "Custom alerts"}
            >
              <BudgetRulesWidget />
            </CollapsibleSection>

            <CollapsibleSection
              emoji="📝"
              title={l ? "Historial de Cambios" : "Change History"}
              subtitle={l ? "Auditoría del presupuesto" : "Budget audit trail"}
            >
              <BudgetAuditLogWidget />
            </CollapsibleSection>

            <CollapsibleSection
              emoji="📥"
              title={l ? "Exportar Presupuesto" : "Export Budget"}
              subtitle={l ? "PDF y Excel" : "PDF & Excel"}
            >
              <BudgetExportWidget />
            </CollapsibleSection>
          </div>

          {/* ===== SECTION 9: EXTRAS (compact row) ===== */}
          <div className="grid gap-5 lg:grid-cols-3">
            <CollapsibleSection
              emoji="💳"
              title={l ? "Deudas" : "Debts"}
              subtitle={l ? "Préstamos y financiamientos" : "Loans & financing"}
            >
              <DebtSnapshot />
            </CollapsibleSection>

            <CollapsibleSection
              emoji="🔄"
              title={l ? "Suscripciones" : "Subscriptions"}
              subtitle={l ? "Cobros recurrentes detectados" : "Detected recurring charges"}
            >
              <SubscriptionTracker />
            </CollapsibleSection>

            <CollapsibleSection
              emoji="🎮"
              title={l ? "Progreso" : "Progress"}
              subtitle={l ? "Nivel y racha" : "Level & streak"}
            >
              <GamificationStreak />
            </CollapsibleSection>
          </div>

          {/* ===== SECTION 10: BANKING + BUSINESS ===== */}
          {(isUnified || isSeparated) && (
            <CollapsibleSection
              emoji="💼"
              title={l ? "Gastos del Negocio" : "Business Expenses"}
              subtitle={businessTotal > 0 ? `${businessCategories.length} ${l ? "categorías" : "categories"} · ${fc(businessTotal)}` : (l ? "Sin gastos este mes" : "No expenses this month")}
            >
              {businessCategories.length > 0 ? (
                <div className="space-y-2">
                  {businessCategories.map(({ cat, spent, icon, label }) => (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm flex items-center gap-2">
                        <span>{icon}</span> {label}
                      </span>
                      <span className="text-sm font-semibold">{fc(spent)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-sm font-medium">{l ? "Total negocio" : "Total business"}</span>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{fc(businessTotal)}</span>
                  </div>
                </div>
              ) : (
                <EmptyState emoji="💼" text={l ? "No hay gastos de negocio este mes" : "No business expenses this month"} actionLabel={l ? "Agregar gasto" : "Add expense"} onAction={() => setShowExpenseDialog(true)} />
              )}
            </CollapsibleSection>
          )}
        </>
      )}

      {/* FAB */}
      <FamilyFAB
        onExpense={() => setShowExpenseDialog(true)}
        onIncome={() => setShowIncomeDialog(true)}
        onBill={() => { setEditingBill(null); setShowBillDialog(true); }}
        onSmartCapture={() => setShowCaptureDialog(true)}
      />

      {/* Dialogs */}
      <FamilyExpenseDialog open={showExpenseDialog} onClose={() => setShowExpenseDialog(false)} />
      <FamilyIncomeDialog open={showIncomeDialog} onClose={() => setShowIncomeDialog(false)} />
      <BillFormDialog
        open={showBillDialog}
        onOpenChange={(open) => { setShowBillDialog(open); if (!open) setEditingBill(null); }}
        editingBill={editingBill}
        onSave={handleSaveBill}
      />
      <QuickCaptureDialog
        open={showCaptureDialog}
        onClose={() => setShowCaptureDialog(false)}
        defaultTab="text"
      />
    </div>
  );
}
