import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { motion } from "framer-motion";

interface InsightData {
  totalIncome: number;
  totalSpent: number;
  totalFixed: number;
  freeMoney: number;
  pace: number;
  dailyBudget: number;
  daysRemaining: number;
  topCategory?: { label: string; spent: number; icon: string };
  prevMonthSpent?: number;
}

export function SmartInsights({ data }: { data: InsightData }) {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();

  const insights: { icon: string; text: string; type: "success" | "warning" | "info" }[] = [];

  // Savings rate
  const savingsRate = data.totalIncome > 0
    ? ((data.totalIncome - data.totalSpent - data.totalFixed) / data.totalIncome) * 100
    : 0;

  if (savingsRate >= 20) {
    insights.push({
      icon: "🏆",
      text: l
        ? `Tasa de ahorro del ${savingsRate.toFixed(0)}%. ¡Excelente disciplina financiera!`
        : `${savingsRate.toFixed(0)}% savings rate. Excellent financial discipline!`,
      type: "success",
    });
  } else if (savingsRate < 5 && data.totalIncome > 0) {
    insights.push({
      icon: "⚠️",
      text: l
        ? `Tu tasa de ahorro es solo ${savingsRate.toFixed(0)}%. Intenta reducir gastos variables.`
        : `Your savings rate is only ${savingsRate.toFixed(0)}%. Try reducing variable expenses.`,
      type: "warning",
    });
  }

  // Pace alert
  if (data.pace > 110) {
    insights.push({
      icon: "🚨",
      text: l
        ? `Ritmo de gasto al ${data.pace.toFixed(0)}%. Reduce ${fc(data.dailyBudget * 0.3)}/día para volver al plan.`
        : `Spending pace at ${data.pace.toFixed(0)}%. Reduce by ${fc(data.dailyBudget * 0.3)}/day to get back on track.`,
      type: "warning",
    });
  } else if (data.pace > 0 && data.pace <= 85) {
    insights.push({
      icon: "✨",
      text: l
        ? `¡Vas por debajo del ritmo ideal! Podrías ahorrar ${fc(data.dailyBudget * data.daysRemaining * 0.15)} extra este mes.`
        : `You're below ideal pace! You could save an extra ${fc(data.dailyBudget * data.daysRemaining * 0.15)} this month.`,
      type: "success",
    });
  }

  // Top category
  if (data.topCategory && data.totalSpent > 0) {
    const pct = (data.topCategory.spent / data.totalSpent) * 100;
    if (pct > 40) {
      insights.push({
        icon: data.topCategory.icon,
        text: l
          ? `${data.topCategory.label} representa el ${pct.toFixed(0)}% de tus gastos. ¿Puedes optimizar?`
          : `${data.topCategory.label} is ${pct.toFixed(0)}% of your spending. Can you optimize?`,
        type: "info",
      });
    }
  }

  // Month comparison
  if (data.prevMonthSpent && data.prevMonthSpent > 0) {
    const diff = ((data.totalSpent - data.prevMonthSpent) / data.prevMonthSpent) * 100;
    if (diff > 15) {
      insights.push({
        icon: "📈",
        text: l
          ? `Gastando ${diff.toFixed(0)}% más que el mes pasado. Revisa las nuevas categorías.`
          : `Spending ${diff.toFixed(0)}% more than last month. Review new categories.`,
        type: "warning",
      });
    } else if (diff < -10) {
      insights.push({
        icon: "📉",
        text: l
          ? `¡${Math.abs(diff).toFixed(0)}% menos que el mes pasado! Sigue así.`
          : `${Math.abs(diff).toFixed(0)}% less than last month! Keep it up.`,
        type: "success",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      icon: "💡",
      text: l
        ? "Agrega ingresos y gastos para recibir consejos personalizados."
        : "Add income and expenses to receive personalized tips.",
      type: "info",
    });
  }

  const bgMap = {
    success: "bg-emerald-500/10 border-emerald-500/20",
    warning: "bg-amber-500/10 border-amber-500/20",
    info: "bg-blue-500/10 border-blue-500/20",
  };

  return (
    <div className="space-y-2">
      {insights.slice(0, 3).map((insight, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`flex items-start gap-2.5 p-3 rounded-lg border ${bgMap[insight.type]}`}
        >
          <span className="text-base mt-0.5">{insight.icon}</span>
          <p className="text-xs leading-relaxed">{insight.text}</p>
        </motion.div>
      ))}
    </div>
  );
}
