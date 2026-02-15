import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useMonthlyPlanData } from "@/hooks/data/useMonthlyPlanData";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Banknote,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ExternalLink,
  Info,
  Landmark,
  PiggyBank,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

// Category label map
const CATEGORY_LABELS: Record<string, { es: string; en: string }> = {
  meals: { es: "Comidas", en: "Meals" },
  travel: { es: "Viajes", en: "Travel" },
  equipment: { es: "Equipamiento", en: "Equipment" },
  software: { es: "Software", en: "Software" },
  mileage: { es: "Kilometraje", en: "Mileage" },
  home_office: { es: "Oficina en Casa", en: "Home Office" },
  professional_services: { es: "Servicios Prof.", en: "Prof. Services" },
  office_supplies: { es: "Suministros", en: "Supplies" },
  utilities: { es: "Servicios Básicos", en: "Utilities" },
  fuel: { es: "Combustible", en: "Fuel" },
  other: { es: "Otros", en: "Other" },
};

export function MonthlyPlanCard() {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();
  const navigate = useNavigate();
  const plan = useMonthlyPlanData();
  const now = new Date();

  const [showAlerts, setShowAlerts] = useState(true);
  const [showProjection, setShowProjection] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showUnpaidBills, setShowUnpaidBills] = useState(false);

  const alertIcon = (type: string) => {
    switch (type) {
      case "danger": return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case "success": return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      default: return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  const alertBg = (type: string) => {
    switch (type) {
      case "danger": return "bg-red-500/10 border-red-500/20";
      case "warning": return "bg-amber-500/10 border-amber-500/20";
      case "success": return "bg-emerald-500/10 border-emerald-500/20";
      default: return "bg-blue-500/10 border-blue-500/20";
    }
  };

  // Completeness score
  const completeness = [plan.hasIncome, plan.hasBills, plan.hasBudget, plan.hasExpenses].filter(Boolean).length;
  const completenessPercent = (completeness / 4) * 100;

  const steps = [
    {
      icon: Banknote,
      label: l ? "Ingreso Mensual" : "Monthly Income",
      value: fc(plan.totalIncome),
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      missing: !plan.hasIncome,
      missingLabel: l ? "Sin ingresos" : "No income",
      link: "/income",
    },
    {
      icon: CreditCard,
      label: l ? "Pagos Fijos" : "Fixed Payments",
      value: `-${fc(plan.totalFixed)}`,
      sub: `${plan.paidBillsCount}/${plan.fixedBillsCount} ${l ? "pagados" : "paid"}`,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      missing: !plan.hasBills,
      missingLabel: l ? "Sin pagos fijos" : "No fixed payments",
      link: "/banking",
      onClick: plan.hasBills && plan.unpaidBills.length > 0 ? () => setShowUnpaidBills(!showUnpaidBills) : undefined,
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
        ? `${l ? "de" : "of"} ${fc(plan.variableBudget)} ${l ? "ppto" : "budget"}`
        : undefined,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      missing: !plan.hasBudget,
      missingLabel: l ? "Sin presupuesto" : "No budget",
    },
    {
      icon: PiggyBank,
      label: l ? "Ahorro Proyectado" : "Projected Savings",
      value: fc(plan.projectedSavings),
      sub: `${plan.savingsRate.toFixed(0)}% ${l ? "ahorro" : "saved"}`,
      color: plan.projectedSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  const getCatLabel = (cat: string) => {
    const label = CATEGORY_LABELS[cat];
    return label ? (l ? label.es : label.en) : cat;
  };

  return (
    <Card className="relative overflow-hidden col-span-full">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-emerald-500/5" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between flex-wrap gap-2">
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

          <div className="flex items-center gap-2 flex-wrap">
            {/* Completeness indicator */}
            {completenessPercent < 100 && (
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 gap-1">
                <ShieldAlert className="h-3 w-3" />
                {completeness}/4 {l ? "configurado" : "configured"}
              </Badge>
            )}
            {plan.dailyBudget > 0 && (
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                {fc(plan.dailyBudget)}/{l ? "día" : "day"}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-700 dark:text-blue-400">
              <CalendarRange className="h-3 w-3 mr-1" />
              {plan.daysRemaining} {l ? "días" : "days"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* ---- ALERTS SECTION ---- */}
        {plan.alerts.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {showAlerts ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {plan.alerts.filter((a) => a.type === "danger" || a.type === "warning").length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
              {l ? `${plan.alerts.length} alerta(s)` : `${plan.alerts.length} alert(s)`}
            </button>
            <AnimatePresence>
              {showAlerts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  {plan.alerts.map((alert, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn("flex items-center gap-2 p-2 rounded-lg border text-xs", alertBg(alert.type))}
                    >
                      {alertIcon(alert.type)}
                      <span className="flex-1 text-foreground">{alert.message}</span>
                      {alert.action && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] px-2"
                          onClick={() => alert.link && navigate(alert.link)}
                        >
                          {alert.action}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ---- FLOW STEPS ---- */}
        <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-1">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-center gap-1 flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => {
                    if (step.onClick) step.onClick();
                    else if (step.missing && step.link) navigate(step.link);
                  }}
                  className={cn(
                    "flex-1 rounded-xl border p-3 space-y-1 transition-all",
                    step.bg,
                    step.border,
                    (step.missing || step.onClick) && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
                    step.missing && "border-dashed"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", step.missing ? "text-muted-foreground" : step.color)} />
                    <span className="text-[11px] text-muted-foreground font-medium truncate">{step.label}</span>
                    {step.missing && (
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                        {step.missingLabel}
                      </span>
                    )}
                  </div>
                  <p className={cn("text-lg font-bold leading-tight", step.missing ? "text-muted-foreground" : step.color)}>
                    {step.value}
                  </p>
                  {step.sub && <p className="text-[10px] text-muted-foreground">{step.sub}</p>}
                </motion.div>
                {i < steps.length - 1 && <ArrowRight className="hidden md:block h-4 w-4 text-muted-foreground/40 shrink-0" />}
                {i < steps.length - 1 && <ArrowDown className="md:hidden h-4 w-4 text-muted-foreground/40 shrink-0 mx-auto" />}
              </div>
            );
          })}
        </div>

        {/* ---- UNPAID BILLS DETAIL ---- */}
        <AnimatePresence>
          {showUnpaidBills && plan.unpaidBills.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 space-y-2">
                <p className="text-xs font-medium text-red-700 dark:text-red-400">
                  {l ? "Pagos pendientes este mes:" : "Pending payments this month:"}
                </p>
                {plan.unpaidBills.map((bill, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between text-xs p-2 rounded-lg",
                      bill.overdue ? "bg-red-500/10 border border-red-500/20" : "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {bill.overdue && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                      <span className="font-medium">{bill.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {format(new Date(bill.nextDue), "dd MMM", { locale: l ? es : enUS })}
                      </span>
                      <span className="font-bold text-red-600 dark:text-red-400">{fc(bill.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- PACE + ANNUAL PROJECTION ---- */}
        <div className="grid gap-3 md:grid-cols-2">
          {/* Pace */}
          <div className="p-3 rounded-xl bg-muted/50 border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">{l ? "Ritmo de Gasto" : "Spending Pace"}</span>
              <span className={cn(
                "font-bold",
                plan.pace <= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {plan.pace > 0 ? `${plan.pace.toFixed(0)}%` : "—"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(plan.pace, 100)}%` }}
                transition={{ duration: 0.8 }}
                className={cn("h-full rounded-full", plan.pace <= 100 ? "bg-emerald-500" : "bg-red-500")}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {plan.pace <= 100
                ? (l ? "✓ Vas dentro de lo planificado" : "✓ On track with your plan")
                : (l ? "⚠ Estás gastando más rápido de lo ideal" : "⚠ Spending faster than planned")}
            </p>
          </div>

          {/* Annual projection */}
          <motion.div
            className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/15 space-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-muted-foreground">
                  {l ? "Proyección Anual" : "Annual Projection"}
                </span>
              </div>
              <span className={cn(
                "text-sm font-bold",
                plan.annualProjectedSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {fc(plan.annualProjectedSavings)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {plan.annualProjectedSavings >= 0
                ? (l ? "Proyección de ahorro a 12 meses al ritmo actual" : "12-month savings projection at current pace")
                : (l ? "⚠ Proyección de déficit anual" : "⚠ Annual deficit projection")}
            </p>
          </motion.div>
        </div>

        {/* ---- EXPANDABLE: 6-Month Projection Chart ---- */}
        <div>
          <button
            onClick={() => setShowProjection(!showProjection)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-1"
          >
            {showProjection ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            📊 {l ? "Proyección 6 meses" : "6-Month Projection"}
          </button>
          <AnimatePresence>
            {showProjection && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="h-48 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={plan.monthlyProjection} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={50} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(value: number) => fc(value)}
                      />
                      <Bar dataKey="income" name={l ? "Ingreso" : "Income"} radius={[4, 4, 0, 0]}>
                        {plan.monthlyProjection.map((_, i) => (
                          <Cell key={i} fill="hsl(142, 71%, 45%)" opacity={i === 0 ? 1 : 0.6} />
                        ))}
                      </Bar>
                      <Bar dataKey="expenses" name={l ? "Gastos" : "Expenses"} radius={[4, 4, 0, 0]}>
                        {plan.monthlyProjection.map((_, i) => (
                          <Cell key={i} fill="hsl(0, 84%, 60%)" opacity={i === 0 ? 1 : 0.6} />
                        ))}
                      </Bar>
                      <Bar dataKey="savings" name={l ? "Ahorro" : "Savings"} radius={[4, 4, 0, 0]}>
                        {plan.monthlyProjection.map((entry, i) => (
                          <Cell key={i} fill={entry.savings >= 0 ? "hsl(168, 76%, 42%)" : "hsl(0, 84%, 60%)"} opacity={i === 0 ? 1 : 0.6} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---- EXPANDABLE: Category Breakdown ---- */}
        {plan.categorySpending.length > 0 && (
          <div>
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-1"
            >
              {showCategories ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              📋 {l ? "Gasto por Categoría" : "Spending by Category"}
              {plan.categorySpending.some((c) => c.budget > 0 && c.percentage > 100) && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
            <AnimatePresence>
              {showCategories && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 mt-2">
                    {plan.categorySpending.map((cat, i) => (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{getCatLabel(cat.category)}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{fc(cat.spent)}</span>
                            {cat.budget > 0 && (
                              <span className={cn(
                                "text-[10px] px-1 rounded",
                                cat.percentage > 100 ? "bg-red-500/20 text-red-600 dark:text-red-400" :
                                cat.percentage > 80 ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" :
                                "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              )}>
                                {cat.percentage.toFixed(0)}%
                              </span>
                            )}
                            {cat.budget === 0 && cat.spent > 0 && (
                              <span className="text-[10px] px-1 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                {l ? "sin ppto" : "no budget"}
                              </span>
                            )}
                          </div>
                        </div>
                        {cat.budget > 0 && (
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(cat.percentage, 100)}%` }}
                              transition={{ duration: 0.5, delay: i * 0.03 }}
                              className={cn(
                                "h-full rounded-full",
                                cat.percentage > 100 ? "bg-red-500" :
                                cat.percentage > 80 ? "bg-amber-500" :
                                "bg-emerald-500"
                              )}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
