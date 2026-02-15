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

// Family-specific dialogs
import { FamilyExpenseDialog } from "./FamilyExpenseDialog";
import { FamilyIncomeDialog } from "./FamilyIncomeDialog";

// Full-power components reused
import { BillFormDialog } from "@/components/bills/BillFormDialog";
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

  // Spending health
  const spendingHealth = plan.totalIncome > 0
    ? ((plan.totalIncome - plan.totalSpent - plan.totalFixed) / plan.totalIncome) * 100
    : 0;
  const healthEmoji = spendingHealth >= 20 ? "🟢" : spendingHealth >= 5 ? "🟡" : "🔴";
  const healthText = spendingHealth >= 20
    ? (l ? "¡Vas muy bien!" : "You're doing great!")
    : spendingHealth >= 5
    ? (l ? "Cuidado, ajusta tus gastos" : "Careful, adjust your spending")
    : (l ? "Estás en rojo, revisa tus gastos" : "You're in the red, review spending");

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

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-24">
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
          <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onChangeMode} className="text-xs text-muted-foreground gap-1">
          <Settings2 className="h-3.5 w-3.5" />
          {l ? "Modo" : "Mode"}
        </Button>
      </motion.div>

      {/* ===== 1. RESUMEN RÁPIDO ===== */}
      <CollapsibleSection
        emoji="📊"
        title={l ? "Resumen del Mes" : "Monthly Summary"}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {/* Health indicator */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <span className="text-2xl">{healthEmoji}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{healthText}</p>
              <p className="text-xs text-muted-foreground">
                {l ? `Tasa de ahorro: ${spendingHealth.toFixed(0)}%` : `Savings rate: ${spendingHealth.toFixed(0)}%`}
              </p>
            </div>
          </div>

          {/* Key numbers */}
          <div className="grid grid-cols-2 gap-3">
            <MiniCard
              emoji="💰" label={l ? "Ingresos" : "Income"} value={fc(plan.totalIncome)}
              color="text-emerald-600 dark:text-emerald-400"
              missing={!plan.hasIncome} missingAction={() => setShowIncomeDialog(true)}
              missingLabel={l ? "+ Agregar" : "+ Add"}
            />
            <MiniCard
              emoji="🏦" label={l ? "Pagos Fijos" : "Fixed Payments"} value={fc(plan.totalFixed)}
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
              emoji="🐷" label={l ? "Libre" : "Free"}
              value={fc(plan.freeMoney - plan.totalSpent)}
              color={plan.freeMoney - plan.totalSpent >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500"}
            />
          </div>

          {/* Donut chart */}
          {familyCategories.length > 0 && (
            <SpendingDonut
              categories={familyCategories}
              total={familyTotal}
              freeLabel={l ? "Libre" : "Free"}
              freeMoney={Math.max(0, plan.freeMoney - plan.totalSpent)}
            />
          )}

          {/* Daily budget */}
          {plan.dailyBudget > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
              <span className="text-lg">📅</span>
              <p className="text-sm">
                <span className="font-semibold">{fc(plan.dailyBudget)}</span>
                <span className="text-muted-foreground">
                  /{l ? "día" : "day"} × {plan.daysRemaining} {l ? "días restantes" : "days left"}
                </span>
              </p>
            </div>
          )}

          {/* Pace bar */}
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

      {/* ===== 2. INSIGHTS INTELIGENTES ===== */}
      <CollapsibleSection
        emoji="🧠"
        title={l ? "Insights Inteligentes" : "Smart Insights"}
        subtitle={l ? "Consejos personalizados" : "Personalized tips"}
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
          topCategory: topCategory ? { label: topCategory.label, spent: topCategory.spent, icon: topCategory.icon } : undefined,
          prevMonthSpent: prevFamilyTotal,
        }} />
      </CollapsibleSection>

      {/* ===== 3. PAGOS FIJOS ===== */}
      <CollapsibleSection
        emoji="🏦"
        title={l ? "Pagos Fijos" : "Fixed Payments"}
        subtitle={`${activeBills.length} ${l ? "activos" : "active"} · ${fc(plan.totalFixed)}`}
        alert={unpaidBills.length > 0}
        badge={unpaidBills.length > 0 ? `${unpaidBills.length} ${l ? "pronto" : "soon"}` : undefined}
      >
        <div className="space-y-3">
          {activeBills.length > 0 ? (
            <div className="space-y-2">
              {activeBills.slice(0, 8).map((bill) => {
                const due = parseISO(bill.next_due_date);
                const daysUntil = differenceInDays(due, now);
                const isUrgent = daysUntil <= 3;
                const catInfo = getCatInfo(bill.category, l ? 'es' : 'en');
                return (
                  <motion.div
                    key={bill.id}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors",
                      isUrgent ? "bg-destructive/10 border border-destructive/20" : "bg-muted/30"
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
                      <p className={cn("text-[11px]", isUrgent ? "text-destructive font-medium" : "text-muted-foreground")}>
                        {isUrgent && "⚠️ "}{format(due, "dd MMM", { locale: l ? es : enUS })}
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
            <EmptyState emoji="🏦" text={l ? "No tienes pagos fijos configurados" : "No fixed payments set up"} actionLabel={l ? "Agregar pago" : "Add payment"} onAction={() => setShowBillDialog(true)} />
          )}
          <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => { setEditingBill(null); setShowBillDialog(true); }}>
            <Plus className="h-3.5 w-3.5" />
            {l ? "Nuevo Pago Fijo" : "New Fixed Payment"}
          </Button>
        </div>
      </CollapsibleSection>

      {/* ===== 4. GASTOS POR CATEGORÍA ===== */}
      <CollapsibleSection
        emoji="🛒"
        title={l ? "Gastos por Categoría" : "Spending by Category"}
        subtitle={`${familyCategories.length} ${l ? "categorías" : "categories"} · ${fc(familyTotal)}`}
      >
        {familyCategories.length > 0 ? (
          <div className="space-y-2">
            {familyCategories.map(({ cat, spent, icon, label }) => {
              const budget = plan.categorySpending.find(c => c.category === cat)?.budget || 0;
              const pct = budget > 0 ? (spent / budget) * 100 : 0;
              return (
                <div key={cat} className="p-3 rounded-lg bg-muted/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <span>{icon}</span> {label}
                    </span>
                    <span className="text-sm font-semibold">{fc(spent)}</span>
                  </div>
                  {budget > 0 && (
                    <div className="space-y-0.5">
                      <Progress value={Math.min(pct, 100)} className="h-1.5" />
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
          <EmptyState emoji="🛒" text={l ? "No hay gastos este mes" : "No expenses this month"} actionLabel={l ? "Agregar gasto" : "Add expense"} onAction={() => setShowExpenseDialog(true)} />
        )}
      </CollapsibleSection>

      {/* ===== 5. PRESUPUESTOS POR CATEGORÍA (editable) ===== */}
      <CollapsibleSection
        emoji="📏"
        title={l ? "Límites de Categoría" : "Category Budgets"}
        subtitle={l ? "Configura límites mensuales" : "Set monthly limits"}
      >
        <CategoryBudgetsCard />
      </CollapsibleSection>

      {/* ===== 6. ALERTAS INTELIGENTES ===== */}
      <CollapsibleSection
        emoji="🔔"
        title={l ? "Alertas" : "Alerts"}
        subtitle={l ? "Avisos y recomendaciones" : "Warnings & recommendations"}
      >
        <BudgetAlertsCard />
      </CollapsibleSection>

      {/* ===== 7. PROYECCIONES ===== */}
      <CollapsibleSection
        emoji="🔮"
        title={l ? "Proyecciones" : "Projections"}
        subtitle={`${l ? "Ahorro anual" : "Annual savings"}: ${fc(plan.annualProjectedSavings)}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fc(plan.projectedSavings)}</p>
              <p className="text-xs text-muted-foreground">{l ? "Ahorro este mes" : "Savings this month"}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fc(plan.annualProjectedSavings)}</p>
              <p className="text-xs text-muted-foreground">{l ? "Proyección anual" : "Annual projection"}</p>
            </div>
          </div>
          <Suspense fallback={<div className="h-48 animate-pulse bg-muted/30 rounded-lg" />}>
            <BudgetProjectionChart />
          </Suspense>
          <Suspense fallback={<div className="h-48 animate-pulse bg-muted/30 rounded-lg" />}>
            <CashFlowProjection />
          </Suspense>
        </div>
      </CollapsibleSection>

      {/* ===== 8. SUSCRIPCIONES ===== */}
      <CollapsibleSection
        emoji="🔄"
        title={l ? "Suscripciones Detectadas" : "Detected Subscriptions"}
        subtitle={l ? "Cobros recurrentes automáticos" : "Automatic recurring charges"}
      >
        <SubscriptionTracker />
      </CollapsibleSection>

      {/* ===== 9. ANÁLISIS BANCARIO ===== */}
      <CollapsibleSection
        emoji="🏧"
        title={l ? "Análisis Bancario" : "Bank Analysis"}
        subtitle={l ? "Sube extractos y boletas" : "Upload statements & receipts"}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {l
              ? "Sube tus extractos bancarios o boletas para que la app analice tus gastos, detecte duplicados y encuentre suscripciones ocultas."
              : "Upload your bank statements or receipts so the app can analyze your spending, detect duplicates, and find hidden subscriptions."}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/banking")}>
              <CreditCard className="h-3.5 w-3.5" />
              {l ? "Ir a Banca" : "Go to Banking"}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/mobile-capture")}>
              <Upload className="h-3.5 w-3.5" />
              {l ? "Subir Boleta" : "Upload Receipt"}
            </Button>
          </div>
        </div>
      </CollapsibleSection>

      {/* ===== 10. GASTOS DEL NEGOCIO (solo modo unificado) ===== */}
      {isUnified && (
        <CollapsibleSection
          emoji="💼"
          title={l ? "Gastos del Negocio" : "Business Expenses"}
          subtitle={businessTotal > 0 ? fc(businessTotal) : (l ? "Sin gastos" : "No expenses")}
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

      {/* FAB */}
      <FamilyFAB
        onExpense={() => setShowExpenseDialog(true)}
        onIncome={() => setShowIncomeDialog(true)}
        onBill={() => { setEditingBill(null); setShowBillDialog(true); }}
        onReceipt={() => navigate("/mobile-capture")}
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
    </div>
  );
}
