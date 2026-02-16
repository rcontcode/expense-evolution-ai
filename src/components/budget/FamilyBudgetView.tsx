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
import { Plus, Settings2, Upload, CreditCard } from "lucide-react";
import { format, startOfMonth, endOfMonth, differenceInDays, parseISO, subMonths, eachDayOfInterval } from "date-fns";
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
  const [showSmartTextDialog, setShowSmartTextDialog] = useState(false);

  const isUnified = budgetMode === "unified";
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

  // Spending health
  const spendingHealth = plan.totalIncome > 0
    ? ((plan.totalIncome - plan.totalSpent - plan.totalFixed) / plan.totalIncome) * 100
    : 0;

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

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🏠 {l ? "Mi Presupuesto" : "My Budget"}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {monthLabel} — {l ? `Día ${plan.daysPassed} de ${plan.daysInMonth}` : `Day ${plan.daysPassed} of ${plan.daysInMonth}`}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onChangeMode} className="text-xs text-muted-foreground gap-1">
          <Settings2 className="h-3.5 w-3.5" />
          {l ? "Modo" : "Mode"}
        </Button>
      </motion.div>

      {/* ===== ROW 1: SALUD + INSIGHTS (side by side on desktop) ===== */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* 1. SALUD FINANCIERA (GAUGE) */}
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
            <div className="grid grid-cols-2 gap-3">
              <MiniCard
                emoji="💰" label={l ? "Ingresos" : "Income"} value={fc(plan.totalIncome)}
                color="text-emerald-600 dark:text-emerald-400"
                missing={!plan.hasIncome} missingAction={() => setShowIncomeDialog(true)}
                missingLabel={l ? "+ Agregar" : "+ Add"}
              />
              <MiniCard
                emoji="🏦" label={l ? "Pagos Fijos" : "Fixed"} value={fc(plan.totalFixed)}
                color="text-red-500 dark:text-red-400"
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
                color={plan.freeMoney - plan.totalSpent >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500"}
              />
            </div>
            {plan.dailyBudget > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-lg">📅</span>
                <p className="text-sm">
                  <span className="font-semibold">{fc(plan.dailyBudget)}</span>
                  <span className="text-muted-foreground">
                    /{l ? "día" : "day"} · {plan.daysRemaining} {l ? "días restantes" : "days left"}
                  </span>
                </p>
              </div>
            )}
            {plan.pace > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{l ? "Ritmo de gasto" : "Spending pace"}</span>
                  <span className={cn("font-semibold", plan.pace <= 100 ? "text-emerald-600" : "text-red-500")}>
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

        {/* 2. INSIGHTS + CALENDARIO */}
        <div className="space-y-5">
          <CollapsibleSection
            emoji="🧠"
            title={l ? "Consejos Inteligentes" : "Smart Insights"}
            subtitle={l ? "Análisis y recomendaciones personalizadas" : "Personalized analysis & recommendations"}
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

          <CollapsibleSection
            emoji="🗓️"
            title={l ? "Calendario de Gastos" : "Spending Calendar"}
            subtitle={l ? "Mapa de calor de tu gasto diario" : "Daily spending heatmap"}
          >
            <MonthlyHeatmap
              data={heatmapData}
              dailyBudget={plan.dailyBudget}
              currentDay={plan.daysPassed}
            />
          </CollapsibleSection>
        </div>
      </div>

      {/* ===== ROW 2: DONUT + PAGOS FIJOS ===== */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Distribución de Gastos / Donut */}
        <CollapsibleSection
          emoji="🍩"
          title={l ? "Distribución de Gastos" : "Spending Distribution"}
          subtitle={familyCategories.length > 0
            ? `${familyCategories.length} ${l ? "categorías" : "categories"} · ${fc(familyTotal)}`
            : (l ? "Sin gastos registrados" : "No expenses recorded")}
          defaultOpen={true}
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

        {/* Pagos Fijos */}
        <CollapsibleSection
          emoji="🏦"
          title={l ? "Pagos Fijos y Compromisos" : "Fixed Payments & Commitments"}
          subtitle={`${activeBills.length} ${l ? "activos" : "active"} · ${fc(plan.totalFixed)}/${l ? "mes" : "mo"}`}
          alert={unpaidBills.length > 0 || overdueBills.length > 0}
          badge={overdueBills.length > 0
            ? `${overdueBills.length} ${l ? "vencido" : "overdue"}`
            : unpaidBills.length > 0
            ? `${unpaidBills.length} ${l ? "pronto" : "soon"}`
            : undefined}
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
                {activeBills.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{activeBills.length - 8} {l ? "más" : "more"}
                  </p>
                )}
              </div>
            ) : (
              <EmptyState emoji="🏦" text={l ? "Configura tus pagos recurrentes (arriendo, servicios, seguros...)" : "Set up recurring payments (rent, utilities, insurance...)"} actionLabel={l ? "Agregar pago" : "Add payment"} onAction={() => setShowBillDialog(true)} />
            )}
            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => { setEditingBill(null); setShowBillDialog(true); }}>
              <Plus className="h-3.5 w-3.5" />
              {l ? "Nuevo Pago Fijo" : "New Fixed Payment"}
            </Button>
          </div>
        </CollapsibleSection>
      </div>

      {/* ===== ROW 3: CATEGORÍAS + DEUDAS ===== */}
      <div className="grid gap-5 lg:grid-cols-2">
        <CollapsibleSection
          emoji="🛒"
          title={l ? "Detalle por Categoría" : "Category Breakdown"}
          subtitle={`${familyCategories.length} ${l ? "categorías activas" : "active categories"} · ${fc(familyTotal)}`}
          badge={categoriesOverBudget > 0 ? `${categoriesOverBudget} ${l ? "excedidas" : "over"}` : undefined}
          alert={categoriesOverBudget > 0}
        >
          {familyCategories.length > 0 ? (
            <div className="space-y-2">
              {familyCategories.map(({ cat, spent, icon, label }) => {
                const budget = plan.categorySpending.find(c => c.category === cat)?.budget || 0;
                const pct = budget > 0 ? (spent / budget) * 100 : 0;
                const isOver = pct > 100;
                return (
                  <div key={cat} className={cn(
                    "p-3 rounded-lg space-y-1.5",
                    isOver ? "bg-red-500/10 border border-red-500/15" : "bg-muted/30"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <span>{icon}</span> {label}
                        {isOver && <span className="text-[10px] text-red-500 font-semibold">⚠️ {l ? "EXCEDIDO" : "OVER"}</span>}
                      </span>
                      <span className="text-sm font-semibold">{fc(spent)}</span>
                    </div>
                    {budget > 0 && (
                      <div className="space-y-0.5">
                        <Progress value={Math.min(pct, 100)} className={cn("h-1.5", isOver && "[&>div]:bg-red-500")} />
                        <p className="text-[10px] text-muted-foreground text-right">
                          {pct.toFixed(0)}% {l ? "de" : "of"} {fc(budget)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState emoji="🛒" text={l ? "Registra gastos para ver el desglose" : "Log expenses to see the breakdown"} actionLabel={l ? "Agregar gasto" : "Add expense"} onAction={() => setShowExpenseDialog(true)} />
          )}
        </CollapsibleSection>

        <CollapsibleSection
          emoji="💳"
          title={l ? "Deudas y Compromisos" : "Debts & Obligations"}
          subtitle={l ? "Préstamos, tarjetas y financiamientos" : "Loans, cards & financing"}
        >
          <DebtSnapshot />
        </CollapsibleSection>
      </div>

      {/* ===== ROW 4: LIMITS + ALERTS ===== */}
      <div className="grid gap-5 lg:grid-cols-2">
        <CollapsibleSection
          emoji="📏"
          title={l ? "Límites por Categoría" : "Category Budgets"}
          subtitle={l ? "Define cuánto puedes gastar en cada área" : "Define how much you can spend per area"}
        >
          <CategoryBudgetsCard />
        </CollapsibleSection>

        <CollapsibleSection
          emoji="🔔"
          title={l ? "Alertas y Notificaciones" : "Alerts & Notifications"}
          subtitle={l ? "Avisos importantes y recomendaciones" : "Important warnings & recommendations"}
          badge={plan.alerts.filter(a => a.type === "danger").length > 0
            ? `${plan.alerts.filter(a => a.type === "danger").length} ${l ? "críticas" : "critical"}`
            : undefined}
          alert={plan.alerts.some(a => a.type === "danger")}
        >
          <BudgetAlertsCard />
        </CollapsibleSection>
      </div>

      {/* ===== ROW 5: PROYECCIONES (full width) ===== */}
      <CollapsibleSection
        emoji="🔮"
        title={l ? "Proyecciones y Tendencias" : "Projections & Trends"}
        subtitle={`${l ? "Ahorro mensual proyectado" : "Projected monthly savings"}: ${fc(plan.projectedSavings)} · ${l ? "Anual" : "Annual"}: ${fc(plan.annualProjectedSavings)}`}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{fc(plan.projectedSavings)}</p>
              <p className="text-[11px] text-muted-foreground">{l ? "Ahorro este mes" : "This month"}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 text-center">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{fc(plan.annualProjectedSavings)}</p>
              <p className="text-[11px] text-muted-foreground">{l ? "Proyección anual" : "Annual"}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 text-center">
              <p className="text-xl font-bold text-primary">{plan.savingsRate.toFixed(0)}%</p>
              <p className="text-[11px] text-muted-foreground">{l ? "Tasa de ahorro" : "Savings rate"}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 text-center">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{fc(plan.dailyBudget)}</p>
              <p className="text-[11px] text-muted-foreground">{l ? "Presup. diario" : "Daily budget"}</p>
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

      {/* ===== ROW 6: SUSCRIPCIONES + GAMIFICACIÓN ===== */}
      <div className="grid gap-5 lg:grid-cols-2">
        <CollapsibleSection
          emoji="🔄"
          title={l ? "Suscripciones Detectadas" : "Detected Subscriptions"}
          subtitle={l ? "Cobros recurrentes en tus extractos" : "Recurring charges from your statements"}
        >
          <SubscriptionTracker />
        </CollapsibleSection>

        <CollapsibleSection
          emoji="🎮"
          title={l ? "Tu Progreso Financiero" : "Your Financial Progress"}
          subtitle={l ? "Nivel, racha y logros acumulados" : "Level, streak & cumulative achievements"}
        >
          <GamificationStreak />
        </CollapsibleSection>
      </div>

      {/* ===== ROW 7: BANCARIO + NEGOCIO ===== */}
      <div className={cn("grid gap-5", isUnified ? "lg:grid-cols-2" : "")}>
        <CollapsibleSection
          emoji="🏧"
          title={l ? "Análisis Bancario" : "Bank Analysis"}
          subtitle={l ? "Importa extractos para análisis inteligente" : "Import statements for intelligent analysis"}
        >
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {l
                ? "Sube tus extractos bancarios o boletas para detectar patrones, duplicados y suscripciones ocultas automáticamente."
                : "Upload bank statements or receipts to automatically detect patterns, duplicates, and hidden subscriptions."}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/banking")}>
                <CreditCard className="h-3.5 w-3.5" />
                {l ? "Centro Bancario" : "Banking Center"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/mobile-capture")}>
                <Upload className="h-3.5 w-3.5" />
                {l ? "Capturar Boleta" : "Capture Receipt"}
              </Button>
            </div>
          </div>
        </CollapsibleSection>

        {isUnified && (
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
      </div>

      {/* FAB */}
      <FamilyFAB
        onExpense={() => setShowExpenseDialog(true)}
        onIncome={() => setShowIncomeDialog(true)}
        onBill={() => { setEditingBill(null); setShowBillDialog(true); }}
        onReceipt={() => navigate("/mobile-capture")}
        onSmartText={() => setShowSmartTextDialog(true)}
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
        open={showSmartTextDialog}
        onClose={() => setShowSmartTextDialog(false)}
        defaultTab="text"
      />
    </div>
  );
}
