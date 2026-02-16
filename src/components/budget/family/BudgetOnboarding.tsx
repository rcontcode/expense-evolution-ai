import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { DollarSign, Receipt, CreditCard, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetOnboardingProps {
  hasIncome: boolean;
  hasExpenses: boolean;
  hasBills: boolean;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddBill: () => void;
  onSmartCapture: () => void;
}

export function BudgetOnboarding({
  hasIncome, hasExpenses, hasBills,
  onAddIncome, onAddExpense, onAddBill, onSmartCapture,
}: BudgetOnboardingProps) {
  const { language } = useLanguage();
  const l = language === "es";

  const steps = [
    {
      num: 1,
      icon: DollarSign,
      done: hasIncome,
      title: l ? "Registra tus ingresos" : "Log your income",
      desc: l
        ? "¿Cuánto ganas al mes? Sueldo, freelance, arriendos... Todo cuenta."
        : "How much do you earn monthly? Salary, freelance, rentals... Everything counts.",
      action: onAddIncome,
      actionLabel: l ? "💰 Agregar Ingreso" : "💰 Add Income",
      gradient: "from-emerald-500/20 to-emerald-500/5",
      iconBg: "bg-emerald-500",
      borderColor: "border-emerald-500/30",
    },
    {
      num: 2,
      icon: CreditCard,
      done: hasBills,
      title: l ? "Agrega tus pagos fijos" : "Add your fixed payments",
      desc: l
        ? "Arriendo, luz, agua, internet, seguros... Los compromisos que se repiten cada mes."
        : "Rent, electricity, water, internet, insurance... Monthly commitments.",
      action: onAddBill,
      actionLabel: l ? "🏦 Agregar Pago Fijo" : "🏦 Add Fixed Payment",
      gradient: "from-blue-500/20 to-blue-500/5",
      iconBg: "bg-blue-500",
      borderColor: "border-blue-500/30",
    },
    {
      num: 3,
      icon: Receipt,
      done: hasExpenses,
      title: l ? "Registra tus gastos del día" : "Log today's expenses",
      desc: l
        ? "Supermercado, café, transporte... Todo lo variable. ¡Puedes usar foto o texto libre!"
        : "Groceries, coffee, transport... All variable spending. Use photo or free text!",
      action: onAddExpense,
      actionLabel: l ? "🛒 Agregar Gasto" : "🛒 Add Expense",
      gradient: "from-amber-500/20 to-amber-500/5",
      iconBg: "bg-amber-500",
      borderColor: "border-amber-500/30",
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Welcome header */}
      <Card className="p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <div className="text-center space-y-2">
          <span className="text-4xl">🚀</span>
          <h2 className="text-xl font-bold">
            {l ? "¡Comienza tu presupuesto!" : "Start your budget!"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {l
              ? "Sigue estos 3 pasos para tener el control total de tus finanzas. Solo toma 2 minutos."
              : "Follow these 3 steps to take full control of your finances. It only takes 2 minutes."}
          </p>
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  s.done
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}>
                  {s.done ? "✓" : s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("w-8 h-0.5 rounded-full", s.done ? "bg-emerald-500" : "bg-muted")} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {completedCount}/3 {l ? "completados" : "completed"}
          </p>
        </div>
      </Card>

      {/* Step cards */}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={cn(
              "p-4 transition-all duration-300 border",
              step.done
                ? "bg-muted/20 border-muted opacity-60"
                : `bg-gradient-to-r ${step.gradient} ${step.borderColor} shadow-sm`
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  step.done ? "bg-emerald-500/20" : step.iconBg
                )}>
                  {step.done
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    : <step.icon className="h-5 w-5 text-white" />
                  }
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                        step.done ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/20 text-primary"
                      )}>
                        {l ? `PASO ${step.num}` : `STEP ${step.num}`}
                      </span>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                  {!step.done && (
                    <Button
                      size="sm"
                      onClick={step.action}
                      className="gap-1.5 shadow-lg active:scale-95 transition-transform"
                    >
                      {step.actionLabel}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Smart capture shortcut */}
      <Card
        className="p-4 bg-gradient-to-r from-violet-500/15 to-purple-500/10 border-violet-500/25 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
        onClick={onSmartCapture}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {l ? "⚡ Captura Inteligente" : "⚡ Smart Capture"}
            </p>
            <p className="text-xs text-muted-foreground">
              {l
                ? "Escribe en texto libre, toma una foto de tu boleta o usa la voz. ¡La IA lo clasifica por ti!"
                : "Type freely, snap a receipt photo, or use voice. AI classifies it for you!"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    </motion.div>
  );
}
