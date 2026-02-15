import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useMonthlyPlanData } from "@/hooks/data/useMonthlyPlanData";
import { useUserSettings, UserPreferences, BudgetMode } from "@/hooks/data/useUserSettings";
import { useCategoryBudgets } from "@/hooks/data/useCategoryBudgets";
import { useExpenses } from "@/hooks/data/useExpenses";
import { EXPENSE_CATEGORY_TRANSLATIONS, ExpenseCategory } from "@/lib/constants/expense-categories";
import { BILL_CATEGORY_CONFIG, BillCategory } from "@/lib/constants/bill-categories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Plus, Settings2, TrendingUp, AlertTriangle } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FamilyExpenseDialog } from "./FamilyExpenseDialog";
import { FamilyIncomeDialog } from "./FamilyIncomeDialog";

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
  const now = new Date();
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    resumen: true,
    gastos: false,
    pagos: false,
    categorias: false,
    negocio: false,
  });

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const isUnified = budgetMode === "unified";
  const monthLabel = format(now, "MMMM yyyy", { locale: l ? es : enUS });

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

  // Split expenses into family vs business (by entity_id presence)
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const { data: allExpenses } = useExpenses({ dateRange: { start: monthStart, end: monthEnd } });
  
  const familyExpenses = (allExpenses || []).filter(e => !e.entity_id);
  const businessExpenses = (allExpenses || []).filter(e => e.entity_id);
  const familyTotal = familyExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const businessTotal = businessExpenses.reduce((s, e) => s + Number(e.amount), 0);

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

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
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
      </div>

      {/* ===== 1. RESUMEN RÁPIDO ===== */}
      <CollapsibleSection
        emoji="📊"
        title={l ? "Resumen del Mes" : "Monthly Summary"}
        open={openSections.resumen}
        onToggle={() => toggle("resumen")}
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
              emoji="💰"
              label={l ? "Ingresos" : "Income"}
              value={fc(plan.totalIncome)}
              color="text-emerald-600 dark:text-emerald-400"
              missing={!plan.hasIncome}
              missingAction={() => setShowIncomeDialog(true)}
              missingLabel={l ? "+ Agregar" : "+ Add"}
            />
            <MiniCard
              emoji="🏦"
              label={l ? "Pagos Fijos" : "Fixed Payments"}
              value={fc(plan.totalFixed)}
              color="text-red-500 dark:text-red-400"
              missing={!plan.hasBills}
              missingAction={() => {}}
              missingLabel={l ? "+ Agregar" : "+ Add"}
            />
            <MiniCard
              emoji="🛒"
              label={l ? "Gastado" : "Spent"}
              value={fc(isUnified ? familyTotal + businessTotal : familyTotal)}
              color="text-amber-600 dark:text-amber-400"
            />
            <MiniCard
              emoji="🐷"
              label={l ? "Libre" : "Free"}
              value={fc(plan.freeMoney - plan.totalSpent)}
              color={plan.freeMoney - plan.totalSpent >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500"}
            />
          </div>

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

      {/* ===== 2. GASTOS POR CATEGORÍA (FAMILIA) ===== */}
      <CollapsibleSection
        emoji="👨‍👩‍👧‍👦"
        title={l ? "Gastos Familiares" : "Family Expenses"}
        subtitle={`${familyCategories.length} ${l ? "categorías" : "categories"} · ${fc(familyTotal)}`}
        open={openSections.gastos}
        onToggle={() => toggle("gastos")}
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
          <EmptyState
            emoji="🛒"
            text={l ? "No hay gastos familiares este mes" : "No family expenses this month"}
            actionLabel={l ? "Agregar gasto" : "Add expense"}
            onAction={() => setShowExpenseDialog(true)}
          />
        )}
      </CollapsibleSection>

      {/* ===== 3. PAGOS PENDIENTES ===== */}
      {plan.unpaidBills.length > 0 && (
        <CollapsibleSection
          emoji="⏰"
          title={l ? "Pagos Pendientes" : "Pending Payments"}
          subtitle={`${plan.unpaidBills.length} ${l ? "pendiente(s)" : "pending"}`}
          open={openSections.pagos}
          onToggle={() => toggle("pagos")}
          alert
        >
          <div className="space-y-2">
            {plan.unpaidBills.map((bill, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  bill.overdue ? "bg-red-500/10 border border-red-500/20" : "bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2">
                  {bill.overdue && <span className="text-sm">🔴</span>}
                  <span className="text-sm font-medium">{bill.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fc(bill.amount)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(bill.nextDue), "dd MMM", { locale: l ? es : enUS })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ===== 4. GASTOS DEL NEGOCIO (solo modo unificado) ===== */}
      {isUnified && (
        <CollapsibleSection
          emoji="💼"
          title={l ? "Gastos del Negocio" : "Business Expenses"}
          subtitle={businessTotal > 0 ? fc(businessTotal) : (l ? "Sin gastos" : "No expenses")}
          open={openSections.negocio}
          onToggle={() => toggle("negocio")}
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
            <EmptyState
              emoji="💼"
              text={l ? "No hay gastos de negocio este mes" : "No business expenses this month"}
            actionLabel={l ? "Agregar gasto" : "Add expense"}
            onAction={() => setShowExpenseDialog(true)}
            />
          )}
          <p className="text-[11px] text-muted-foreground mt-2">
            💡 {l
              ? "Los gastos del negocio se registran igual que los familiares, solo asócialos a tu entidad fiscal."
              : "Business expenses are recorded the same way, just associate them with your fiscal entity."}
          </p>
        </CollapsibleSection>
      )}

      {/* ===== 5. PROYECCIÓN ===== */}
      <CollapsibleSection
        emoji="🔮"
        title={l ? "Proyección" : "Projection"}
        subtitle={`${l ? "Ahorro anual" : "Annual savings"}: ${fc(plan.annualProjectedSavings)}`}
        open={false}
        onToggle={() => {}}
      >
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
      </CollapsibleSection>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => setShowExpenseDialog(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          {l ? "Agregar Gasto" : "Add Expense"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => setShowIncomeDialog(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          {l ? "Agregar Ingreso" : "Add Income"}
        </Button>
      </div>

      {/* Dialogs */}
      <FamilyExpenseDialog open={showExpenseDialog} onClose={() => setShowExpenseDialog(false)} />
      <FamilyIncomeDialog open={showIncomeDialog} onClose={() => setShowIncomeDialog(false)} />
    </div>
  );
}

// ---- Sub-components ----

function CollapsibleSection({
  emoji,
  title,
  subtitle,
  open: defaultOpen,
  onToggle,
  children,
  alert,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  alert?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const handleToggle = () => {
    setOpen(!open);
    onToggle();
  };

  return (
    <Collapsible open={open} onOpenChange={handleToggle}>
      <Card className={cn(alert && "border-red-500/30")}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors rounded-t-xl">
            <span className="text-xl">{emoji}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold flex items-center gap-2">
                {title}
                {alert && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              </p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function MiniCard({
  emoji,
  label,
  value,
  color,
  missing,
  missingAction,
  missingLabel,
}: {
  emoji: string;
  label: string;
  value: string;
  color: string;
  missing?: boolean;
  missingAction?: () => void;
  missingLabel?: string;
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-xl bg-muted/40 space-y-1",
        missing && "border border-dashed border-muted-foreground/20 cursor-pointer hover:bg-muted/60"
      )}
      onClick={missing ? missingAction : undefined}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-base">{emoji}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      {missing ? (
        <p className="text-sm text-primary font-medium">{missingLabel}</p>
      ) : (
        <p className={cn("text-lg font-bold", color)}>{value}</p>
      )}
    </div>
  );
}

function EmptyState({
  emoji,
  text,
  actionLabel,
  onAction,
}: {
  emoji: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="text-center py-6 space-y-3">
      <span className="text-3xl">{emoji}</span>
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button size="sm" variant="outline" onClick={onAction} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        {actionLabel}
      </Button>
    </div>
  );
}
