import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";

export function DebtSnapshot() {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();
  const { user } = useAuth();

  const { data: debts } = useQuery({
    queryKey: ["liabilities-snapshot", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("liabilities")
        .select("*")
        .eq("user_id", user.id)
        .order("interest_rate", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (!debts || debts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {l ? "¡Sin deudas registradas!" : "No debts recorded!"}
        </p>
        <p className="text-xs text-muted-foreground">
          {l ? "Registra préstamos y tarjetas en Patrimonio" : "Track loans & cards in Net Worth"}
        </p>
      </div>
    );
  }

  const totalDebt = debts.reduce((s, d) => s + Number(d.current_balance), 0);
  const totalMinPayment = debts.reduce((s, d) => s + (Number(d.minimum_payment) || 0), 0);
  const highestRate = debts[0];
  const debtCount = debts.length;

  // Estimated payoff (simplified: total / monthly min payment)
  const monthsToPayoff = totalMinPayment > 0 ? Math.ceil(totalDebt / totalMinPayment) : 0;
  const yearsToPayoff = monthsToPayoff > 0 ? (monthsToPayoff / 12).toFixed(1) : "∞";

  const categoryIcons: Record<string, string> = {
    credit_card: "💳",
    mortgage: "🏠",
    auto_loan: "🚗",
    student_loan: "🎓",
    personal_loan: "💰",
    line_of_credit: "🏦",
    other: "📋",
  };

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-lg bg-red-500/10 text-center">
          <p className="text-lg font-bold text-red-500">{fc(totalDebt)}</p>
          <p className="text-[10px] text-muted-foreground">{l ? "Total Deuda" : "Total Debt"}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-amber-500/10 text-center">
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{fc(totalMinPayment)}</p>
          <p className="text-[10px] text-muted-foreground">{l ? "Pago Mín/Mes" : "Min Pay/Mo"}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-blue-500/10 text-center">
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{yearsToPayoff}</p>
          <p className="text-[10px] text-muted-foreground">{l ? "Años p/pagar" : "Yrs to payoff"}</p>
        </div>
      </div>

      {/* Debt list */}
      <div className="space-y-1.5">
        {debts.slice(0, 5).map((debt, i) => {
          const pct = debt.original_amount > 0
            ? (Number(debt.current_balance) / Number(debt.original_amount)) * 100
            : 100;
          const icon = categoryIcons[debt.category] || "📋";
          return (
            <motion.div
              key={debt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30"
            >
              <span className="text-base">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{debt.name}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{fc(debt.current_balance)}</span>
                  {debt.interest_rate && (
                    <span className={cn(
                      "font-semibold",
                      Number(debt.interest_rate) > 20 ? "text-red-500" : Number(debt.interest_rate) > 10 ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {debt.interest_rate}% APR
                    </span>
                  )}
                </div>
              </div>
              {/* Mini progress bar (remaining %) */}
              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    pct > 75 ? "bg-red-500" : pct > 40 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </motion.div>
          );
        })}
        {debts.length > 5 && (
          <p className="text-[11px] text-muted-foreground text-center">
            +{debts.length - 5} {l ? "más" : "more"}
          </p>
        )}
      </div>

      {/* Highest interest warning */}
      {highestRate && Number(highestRate.interest_rate) > 15 && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs">
            {l
              ? `Prioriza "${highestRate.name}" (${highestRate.interest_rate}% APR). Los intereses altos erosionan tu ahorro.`
              : `Prioritize "${highestRate.name}" (${highestRate.interest_rate}% APR). High interest erodes your savings.`}
          </p>
        </div>
      )}
    </div>
  );
}
