import { motion } from "framer-motion";
import { Sparkles, Trophy, Flame, Target } from "lucide-react";

interface QuizProgressProps {
  currentStep: number;
  totalSteps: number;
  language?: string;
}

const getMotivationalMessage = (progress: number, language: string = "es") => {
  if (progress < 25) {
    return {
      icon: Sparkles,
      message: language === "es" ? "¡Excelente inicio!" : "Great start!",
      color: "text-amber-400",
    };
  } else if (progress < 50) {
    return {
      icon: Flame,
      message: language === "es" ? "¡Vas muy bien!" : "You're doing great!",
      color: "text-orange-400",
    };
  } else if (progress < 75) {
    return {
      icon: Target,
      message: language === "es" ? "¡Ya casi llegas!" : "Almost there!",
      color: "text-emerald-400",
    };
  } else {
    return {
      icon: Trophy,
      message: language === "es" ? "¡Últimas preguntas!" : "Final questions!",
      color: "text-amber-300",
    };
  }
};

export const QuizProgress = ({ currentStep, totalSteps, language = "es" }: QuizProgressProps) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const motivation = getMotivationalMessage(progress, language);
  const MotivationIcon = motivation.icon;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm">
      {/* Motivational message */}
      <div className="flex items-center justify-center gap-2 py-2">
        <motion.div
          key={Math.floor(progress / 25)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <MotivationIcon className={`w-4 h-4 ${motivation.color}`} />
        </motion.div>
        <motion.span
          key={motivation.message}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`text-xs font-medium ${motivation.color}`}
        >
          {motivation.message}
        </motion.span>
        <span className="text-slate-500 text-xs">
          ({currentStep + 1}/{totalSteps})
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-1.5 bg-slate-800">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ left: ["0%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ left: `${Math.min(progress - 5, 95)}%` }}
        />
      </div>
    </div>
  );
};
