import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface HealthGaugeProps {
  score: number; // 0-100
  label: string;
  savingsRate: number;
  pace: number;
}

export function HealthGauge({ score, label, savingsRate, pace }: HealthGaugeProps) {
  const { language } = useLanguage();
  const l = language === "es";

  // SVG arc calculations
  const radius = 62;
  const circumference = Math.PI * radius; // half circle
  const progress = (score / 100) * circumference;

  const getColor = (s: number) =>
    s >= 80 ? "text-emerald-500" : s >= 60 ? "text-blue-500" : s >= 40 ? "text-amber-500" : "text-red-500";
  const getStroke = (s: number) =>
    s >= 80 ? "stroke-emerald-500" : s >= 60 ? "stroke-blue-500" : s >= 40 ? "stroke-amber-500" : "stroke-red-500";
  const getGlow = (s: number) =>
    s >= 80 ? "drop-shadow(0 0 8px rgb(16 185 129 / 0.5))" : s >= 60 ? "drop-shadow(0 0 8px rgb(59 130 246 / 0.5))" : s >= 40 ? "drop-shadow(0 0 8px rgb(245 158 11 / 0.5))" : "drop-shadow(0 0 8px rgb(239 68 68 / 0.5))";

  const emoji = score >= 80 ? "🏆" : score >= 60 ? "👍" : score >= 40 ? "⚡" : "🚨";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-40 h-24">
        <svg viewBox="0 0 140 80" className="w-full h-full" style={{ filter: getGlow(score) }}>
          {/* Background arc */}
          <path
            d="M 10 75 A 62 62 0 0 1 130 75"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <motion.path
            d="M 10 75 A 62 62 0 0 1 130 75"
            fill="none"
            className={getStroke(score)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-lg">{emoji}</span>
          <motion.span
            className={cn("text-2xl font-extrabold tabular-nums", getColor(score))}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <p className={cn("text-sm font-semibold", getColor(score))}>{label}</p>
      <p className="text-[10px] text-muted-foreground text-center max-w-[180px]">
        {score >= 80 
          ? (l ? "Tu salud financiera es excelente. ¡Sigue así!" : "Your financial health is excellent. Keep it up!")
          : score >= 60 
          ? (l ? "Buen control. Revisa los gastos para mejorar." : "Good control. Review spending to improve.")
          : score >= 40 
          ? (l ? "Atención: gastos superando el ritmo ideal." : "Attention: spending exceeding ideal pace.")
          : (l ? "Alerta: necesitas ajustar tu presupuesto urgente." : "Alert: you need to adjust your budget urgently.")}
      </p>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span>
          {l ? "Ahorro" : "Savings"}: <strong className={savingsRate >= 15 ? "text-emerald-500" : "text-amber-500"}>{savingsRate.toFixed(0)}%</strong>
          <span className="opacity-50 ml-0.5">({l ? "meta: 15%+" : "goal: 15%+"})</span>
        </span>
        <span>
          {l ? "Ritmo" : "Pace"}: <strong className={pace <= 100 ? "text-emerald-500" : "text-red-500"}>{pace > 0 ? `${pace.toFixed(0)}%` : "—"}</strong>
          <span className="opacity-50 ml-0.5">({l ? "meta: ≤100%" : "goal: ≤100%"})</span>
        </span>
      </div>
    </div>
  );
}
