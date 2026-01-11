import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, ArrowRight, RotateCcw, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { PhoenixScoreAnimation } from "./PhoenixScoreAnimation";
import { QuizRecommendations } from "./QuizRecommendations";
import type { QuizResult } from "@/pages/FinancialQuiz";

interface QuizResultsProps {
  result: QuizResult;
  onRetake: () => void;
}

const getLevelInfo = (level: QuizResult["level"], language: string) => {
  const levels = {
    principiante: {
      es: {
        title: "Phoenix Principiante",
        description: "Tu Phoenix financiero aún no ha nacido. Necesitas establecer bases sólidas.",
        color: "from-red-500 to-orange-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        icon: "🔥",
      },
      en: {
        title: "Beginner Phoenix",
        description: "Your financial Phoenix hasn't been born yet. You need to establish solid foundations.",
        color: "from-red-500 to-orange-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        icon: "🔥",
      },
    },
    emergente: {
      es: {
        title: "Phoenix Emergente",
        description: "Tu Phoenix está despertando. Tienes algunas bases pero faltan herramientas clave.",
        color: "from-orange-500 to-amber-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        icon: "🌅",
      },
      en: {
        title: "Emerging Phoenix",
        description: "Your Phoenix is awakening. You have some foundations but lack key tools.",
        color: "from-orange-500 to-amber-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        icon: "🌅",
      },
    },
    evolucionando: {
      es: {
        title: "Phoenix en Evolución",
        description: "Tu Phoenix está volando. Vas por buen camino, es hora de optimizar.",
        color: "from-amber-400 to-yellow-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        icon: "🦅",
      },
      en: {
        title: "Evolving Phoenix",
        description: "Your Phoenix is flying. You're on the right track, time to optimize.",
        color: "from-amber-400 to-yellow-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        icon: "🦅",
      },
    },
    maestro: {
      es: {
        title: "Phoenix Maestro",
        description: "¡Tu Phoenix brilla con luz propia! Excelente control financiero.",
        color: "from-emerald-400 to-teal-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        icon: "✨",
      },
      en: {
        title: "Master Phoenix",
        description: "Your Phoenix shines bright! Excellent financial control.",
        color: "from-emerald-400 to-teal-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        icon: "✨",
      },
    },
  };

  return levels[level][language as "es" | "en"] || levels[level].es;
};

export const QuizResults = ({ result, onRetake }: QuizResultsProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [animatedScore, setAnimatedScore] = useState(0);

  const levelInfo = getLevelInfo(result.level, language);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = result.score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= result.score) {
        setAnimatedScore(result.score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [result.score]);

  const handleAccessApp = () => {
    navigate("/landing");
  };

  const content = {
    es: {
      yourScore: "Tu Puntuación",
      outOf: "de 100",
      recommendations: "Recomendaciones Personalizadas",
      recommendationsSubtitle: "Basado en tus respuestas, aquí están las áreas donde puedes mejorar:",
      cta: "Acceder a EvoFinz GRATIS",
      ctaSubtitle: "Todas las herramientas que necesitas para mejorar tu salud financiera",
      retake: "Volver a hacer el quiz",
      features: [
        "Captura de gastos con foto, voz o texto",
        "Presupuestos inteligentes con alertas",
        "Optimizador de impuestos para Canadá y Chile",
        "Gestor de deudas con estrategias probadas",
        "Tracking de patrimonio neto",
        "Sistema de metas SMART gamificado",
      ],
    },
    en: {
      yourScore: "Your Score",
      outOf: "out of 100",
      recommendations: "Personalized Recommendations",
      recommendationsSubtitle: "Based on your answers, here are the areas where you can improve:",
      cta: "Access EvoFinz FREE",
      ctaSubtitle: "All the tools you need to improve your financial health",
      retake: "Retake quiz",
      features: [
        "Expense capture with photo, voice or text",
        "Smart budgets with alerts",
        "Tax optimizer for Canada and Chile",
        "Debt manager with proven strategies",
        "Net worth tracking",
        "Gamified SMART goals system",
      ],
    },
  };

  const t = content[language as keyof typeof content] || content.es;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 relative z-10">
      {/* Score Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <PhoenixScoreAnimation level={result.level} />
        
        <div className="mt-6">
          <p className="text-slate-400 text-sm mb-2">{t.yourScore}</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className={`text-6xl md:text-7xl font-bold bg-gradient-to-r ${levelInfo.color} bg-clip-text text-transparent`}>
              {animatedScore}
            </span>
            <span className="text-slate-500 text-xl">{t.outOf}</span>
          </div>
        </div>
      </motion.div>

      {/* Level Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`${levelInfo.bgColor} ${levelInfo.borderColor} border rounded-2xl p-6 mb-8 max-w-md text-center`}
      >
        <span className="text-4xl mb-3 block">{levelInfo.icon}</span>
        <h2 className={`text-2xl font-bold bg-gradient-to-r ${levelInfo.color} bg-clip-text text-transparent mb-2`}>
          {levelInfo.title}
        </h2>
        <p className="text-slate-300">{levelInfo.description}</p>
      </motion.div>

      {/* Recommendations */}
      {result.failedQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-2xl mb-8"
        >
          <h3 className="text-xl font-bold text-white mb-2 text-center">{t.recommendations}</h3>
          <p className="text-slate-400 text-sm text-center mb-6">{t.recommendationsSubtitle}</p>
          <QuizRecommendations 
            failedQuestions={result.failedQuestions} 
            language={language}
            situation={result.data.situation}
          />
        </motion.div>
      )}

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-4">{t.ctaSubtitle}</h3>
          
          <ul className="text-left space-y-3 mb-6">
            {t.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={handleAccessApp}
            size="lg"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-lg py-6 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300"
          >
            <Flame className="w-5 h-5 mr-2" />
            {t.cta}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        <button
          onClick={onRetake}
          className="flex items-center justify-center gap-2 mx-auto mt-6 text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">{t.retake}</span>
        </button>
      </motion.div>
    </div>
  );
};
