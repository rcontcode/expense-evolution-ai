import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, ArrowRight, RotateCcw, CheckCircle2, Sparkles, Rocket, Zap, Star, Target, Shield, Clock } from "lucide-react";
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
        description: "Tu Phoenix financiero está listo para nacer. Tienes un gran potencial esperando ser liberado.",
        color: "from-red-500 to-orange-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        icon: "🔥",
      },
      en: {
        title: "Beginner Phoenix",
        description: "Your financial Phoenix is ready to be born. You have great potential waiting to be unleashed.",
        color: "from-red-500 to-orange-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        icon: "🔥",
      },
    },
    emergente: {
      es: {
        title: "Phoenix Emergente",
        description: "Tu Phoenix está despertando. Ya tienes bases sólidas, es hora de potenciarlas.",
        color: "from-orange-500 to-amber-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        icon: "🌅",
      },
      en: {
        title: "Emerging Phoenix",
        description: "Your Phoenix is awakening. You have solid foundations, time to supercharge them.",
        color: "from-orange-500 to-amber-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/30",
        icon: "🌅",
      },
    },
    evolucionando: {
      es: {
        title: "Phoenix en Evolución",
        description: "Tu Phoenix está volando alto. Vas por buen camino, ¡automaticemos para que vueles aún más alto!",
        color: "from-amber-400 to-yellow-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        icon: "🦅",
      },
      en: {
        title: "Evolving Phoenix",
        description: "Your Phoenix is flying high. You're on the right track, let's automate so you can soar even higher!",
        color: "from-amber-400 to-yellow-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        icon: "🦅",
      },
    },
    maestro: {
      es: {
        title: "Phoenix Maestro",
        description: "¡Tu Phoenix brilla con luz propia! Tienes un excelente control financiero. EvoFinz es tu copiloto para ir más lejos, más rápido.",
        color: "from-emerald-400 to-teal-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        icon: "✨",
      },
      en: {
        title: "Master Phoenix",
        description: "Your Phoenix shines bright! You have excellent financial control. EvoFinz is your copilot to go further, faster.",
        color: "from-emerald-400 to-teal-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        icon: "✨",
      },
    },
  };

  return levels[level][language as "es" | "en"] || levels[level].es;
};

// Generate personalized message based on profile - NOW WITH HIGH SCORE STRATEGY
const getPersonalizedMessage = (
  name: string,
  situation: string,
  country: string,
  goal: string,
  obstacle: string,
  level: QuizResult["level"],
  score: number,
  language: string
): string => {
  const firstName = name.split(" ")[0];
  const isCanada = country.includes("Canadá") || country.includes("Canada");
  const isChile = country.includes("Chile");
  
  // Special messages for HIGH SCORERS (80-100) - Show how EvoFinz ENHANCES their excellence
  if (score >= 80) {
    const highScoreMessages = {
      es: {
        freelancer: {
          canada: `${firstName}, ¡impresionante dominio financiero! 🏆 Como freelancer en Canadá que ya controla sus finanzas, EvoFinz es tu **multiplicador de resultados**: captura gastos en segundos con foto o voz, genera reportes T2125 automáticamente, y nuestro optimizador fiscal encuentra deducciones que incluso los expertos pasan por alto. Transforma tu excelencia en **máxima rentabilidad**.`,
          chile: `${firstName}, ¡excelente gestión! 🏆 Como freelancer en Chile con control financiero, EvoFinz te da **superpoderes**: automatiza la organización de boletas, calcula retenciones de honorarios automáticamente, y te alerta de deadlines del SII. Menos tiempo administrando, más tiempo facturando.`,
          default: `${firstName}, ¡felicitaciones por tu disciplina financiera! 🏆 EvoFinz no es para "arreglarte" – es para **potenciarte**. Automatiza las tareas repetitivas que ya haces bien, centraliza todo en un solo lugar, y libera tu tiempo para lo que realmente importa: hacer crecer tu negocio.`,
        },
        employee: {
          canada: `${firstName}, ¡tienes una base financiera sólida! 🏆 Como empleado en Canadá, EvoFinz te ayuda a descubrir **deducciones ocultas** (home office, educación, gastos médicos) que podrías estar perdiendo. Además, nuestro calculador FIRE te muestra exactamente cuándo podrás ser financieramente libre.`,
          chile: `${firstName}, ¡excelente control! 🏆 Como empleado en Chile, EvoFinz te ayuda a **maximizar tu APV**, optimizar gastos de salud y educación, y visualizar tu camino hacia la libertad financiera con nuestro calculador FIRE personalizado.`,
          default: `${firstName}, ¡admirable disciplina! 🏆 Para alguien con tu nivel de control, EvoFinz es el **copiloto perfecto**: tracking automático de patrimonio neto, proyecciones de jubilación, y análisis de tendencias que transforman datos en decisiones inteligentes.`,
        },
        business: {
          canada: `${firstName}, ¡gestión empresarial ejemplar! 🏆 EvoFinz es tu **centro de comando financiero**: genera reportes T2125 con un clic, identifica gastos deducibles automáticamente, y rastrea rentabilidad por cliente/proyecto. Menos contabilidad, más estrategia.`,
          chile: `${firstName}, ¡control empresarial impecable! 🏆 EvoFinz automatiza tu gestión con el SII: organiza facturas, calcula IVA, genera reportes para tu contador, y te da visibilidad total de tu flujo de caja por cliente.`,
          default: `${firstName}, ¡excelente visión de negocio! 🏆 EvoFinz escala contigo: desde tracking automático de gastos hasta análisis de rentabilidad por proyecto, tienes el dashboard empresarial que mereces.`,
        },
        default: `${firstName}, ¡eres un ejemplo de disciplina financiera! 🏆 EvoFinz no reemplaza tu expertise – lo **amplifica**. Automatización inteligente, insights basados en datos, y herramientas que transforman buenas prácticas en resultados extraordinarios.`,
      },
      en: {
        freelancer: {
          canada: `${firstName}, impressive financial mastery! 🏆 As a freelancer in Canada who already controls their finances, EvoFinz is your **results multiplier**: capture expenses in seconds with photo or voice, auto-generate T2125 reports, and our tax optimizer finds deductions even experts miss. Transform your excellence into **maximum profitability**.`,
          chile: `${firstName}, excellent management! 🏆 As a freelancer in Chile with financial control, EvoFinz gives you **superpowers**: automate invoice organization, auto-calculate withholdings, and get SII deadline alerts. Less time managing, more time billing.`,
          default: `${firstName}, congratulations on your financial discipline! 🏆 EvoFinz isn't here to "fix" you – it's here to **supercharge** you. Automate repetitive tasks you already do well, centralize everything, and free your time for what matters: growing your business.`,
        },
        employee: {
          canada: `${firstName}, you have a solid financial foundation! 🏆 As a Canadian employee, EvoFinz helps you discover **hidden deductions** (home office, education, medical) you might be missing. Plus, our FIRE calculator shows exactly when you can be financially free.`,
          chile: `${firstName}, excellent control! 🏆 As a Chilean employee, EvoFinz helps you **maximize APV**, optimize health and education expenses, and visualize your path to financial freedom with our personalized FIRE calculator.`,
          default: `${firstName}, admirable discipline! 🏆 For someone at your level, EvoFinz is the **perfect copilot**: automatic net worth tracking, retirement projections, and trend analysis that turns data into smart decisions.`,
        },
        business: {
          canada: `${firstName}, exemplary business management! 🏆 EvoFinz is your **financial command center**: generate T2125 reports with one click, auto-identify deductible expenses, and track profitability by client/project. Less accounting, more strategy.`,
          chile: `${firstName}, impeccable business control! 🏆 EvoFinz automates your SII management: organize invoices, calculate VAT, generate reports for your accountant, and get full cash flow visibility by client.`,
          default: `${firstName}, excellent business vision! 🏆 EvoFinz scales with you: from automatic expense tracking to per-project profitability analysis, you get the enterprise dashboard you deserve.`,
        },
        default: `${firstName}, you're an example of financial discipline! 🏆 EvoFinz doesn't replace your expertise – it **amplifies** it. Smart automation, data-driven insights, and tools that transform good practices into extraordinary results.`,
      },
    };

    const lang = language === "en" ? "en" : "es";
    const sitKey = situation.toLowerCase().includes("freelancer") || situation.toLowerCase().includes("contratista") 
      ? "freelancer" 
      : situation.toLowerCase().includes("empleado") || situation.toLowerCase().includes("employee")
      ? "employee"
      : situation.toLowerCase().includes("negocio") || situation.toLowerCase().includes("business") || situation.toLowerCase().includes("dueño")
      ? "business"
      : "default";
    
    const countryKey = isCanada ? "canada" : isChile ? "chile" : "default";
    
    if (sitKey === "default") {
      return highScoreMessages[lang].default;
    }
    
    return highScoreMessages[lang][sitKey][countryKey] || highScoreMessages[lang][sitKey].default;
  }

  // Regular messages for scores below 80
  const messages = {
    es: {
      freelancer: {
        canada: `${firstName}, como freelancer en Canadá, tienes acceso a deducciones del CRA que podrías estar perdiendo. EvoFinz te ayuda a capturar cada gasto deducible y maximizar tu retorno.`,
        chile: `${firstName}, como freelancer en Chile, puedes optimizar tu situación tributaria con el SII. EvoFinz te guía para organizar tus boletas y deducciones inteligentemente.`,
        default: `${firstName}, como freelancer, tu control de gastos es clave para maximizar tus ganancias. EvoFinz automatiza este proceso para ti.`,
      },
      employee: {
        canada: `${firstName}, aunque eres empleado en Canadá, puedes deducir gastos de trabajo desde casa, educación y más. EvoFinz te ayuda a no perder ni un dólar.`,
        chile: `${firstName}, como empleado en Chile, puedes optimizar con gastos de salud, educación y APV. EvoFinz te muestra exactamente cómo.`,
        default: `${firstName}, llevar control de tus finanzas personales te dará claridad y tranquilidad. EvoFinz hace el trabajo pesado por ti.`,
      },
      business: {
        canada: `${firstName}, como dueño de negocio en Canadá, tienes grandes oportunidades de optimización fiscal con el T2125. EvoFinz organiza todo automáticamente.`,
        chile: `${firstName}, como empresario en Chile, maximizar tus beneficios tributarios es clave. EvoFinz te da claridad sobre tu flujo de caja y obligaciones.`,
        default: `${firstName}, gestionar las finanzas de tu negocio no tiene que ser complicado. EvoFinz te da el control que necesitas.`,
      },
      default: `${firstName}, independiente de tu situación, tomar control de tus finanzas transformará tu vida. EvoFinz es tu asistente personal en este camino.`,
    },
    en: {
      freelancer: {
        canada: `${firstName}, as a freelancer in Canada, you have access to CRA deductions you might be missing. EvoFinz helps you capture every deductible expense and maximize your return.`,
        chile: `${firstName}, as a freelancer in Chile, you can optimize your tax situation with SII. EvoFinz guides you to organize your invoices and deductions smartly.`,
        default: `${firstName}, as a freelancer, expense tracking is key to maximizing your earnings. EvoFinz automates this process for you.`,
      },
      employee: {
        canada: `${firstName}, even as an employee in Canada, you can deduct home office expenses, education, and more. EvoFinz helps you not miss a single dollar.`,
        chile: `${firstName}, as an employee in Chile, you can optimize with health, education, and APV expenses. EvoFinz shows you exactly how.`,
        default: `${firstName}, tracking your personal finances will give you clarity and peace of mind. EvoFinz does the heavy lifting for you.`,
      },
      business: {
        canada: `${firstName}, as a business owner in Canada, you have great tax optimization opportunities with T2125. EvoFinz organizes everything automatically.`,
        chile: `${firstName}, as a business owner in Chile, maximizing your tax benefits is key. EvoFinz gives you clarity on cash flow and obligations.`,
        default: `${firstName}, managing your business finances doesn't have to be complicated. EvoFinz gives you the control you need.`,
      },
      default: `${firstName}, regardless of your situation, taking control of your finances will transform your life. EvoFinz is your personal assistant on this journey.`,
    },
  };

  const lang = language === "en" ? "en" : "es";
  const sitKey = situation.toLowerCase().includes("freelancer") || situation.toLowerCase().includes("contratista") 
    ? "freelancer" 
    : situation.toLowerCase().includes("empleado") || situation.toLowerCase().includes("employee")
    ? "employee"
    : situation.toLowerCase().includes("negocio") || situation.toLowerCase().includes("business") || situation.toLowerCase().includes("dueño")
    ? "business"
    : "default";
  
  const countryKey = isCanada ? "canada" : isChile ? "chile" : "default";
  
  if (sitKey === "default") {
    return messages[lang].default;
  }
  
  return messages[lang][sitKey][countryKey] || messages[lang][sitKey].default;
};

// Get profile display info
const getProfileDisplay = (situation: string, country: string, goal: string, obstacle: string, language: string) => {
  const situationIcons: Record<string, string> = {
    "Empleado": "💼", "Employee": "💼",
    "Freelancer/Contratista": "🎯", "Freelancer/Contractor": "🎯",
    "Dueño de negocio": "🏢", "Business Owner": "🏢",
    "Estudiante": "📚", "Student": "📚",
    "Jubilado": "🌴", "Retired": "🌴",
  };

  const goalIcons: Record<string, string> = {
    "Ahorrar más": "💰", "Save more": "💰",
    "Reducir deudas": "📉", "Reduce debt": "📉",
    "Optimizar impuestos": "📊", "Optimize taxes": "📊",
    "Crecer patrimonio": "📈", "Grow wealth": "📈",
    "Jubilación anticipada (FIRE)": "🔥", "Early retirement (FIRE)": "🔥",
  };

  const obstacleIcons: Record<string, string> = {
    "Falta de tiempo": "⏰", "Lack of time": "⏰",
    "No sé por dónde empezar": "🧭", "Don't know where to start": "🧭",
    "Gastos descontrolados": "💸", "Uncontrolled spending": "💸",
    "Ingresos irregulares": "📊", "Irregular income": "📊",
    "Muchas cuentas/bancos": "🏦", "Too many accounts/banks": "🏦",
  };

  return {
    situationIcon: situationIcons[situation] || "👤",
    goalIcon: goalIcons[goal] || "🎯",
    obstacleIcon: obstacleIcons[obstacle] || "⚡",
  };
};

export const QuizResults = ({ result, onRetake }: QuizResultsProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [animatedScore, setAnimatedScore] = useState(0);

  const levelInfo = getLevelInfo(result.level, language);
  const firstName = result.data.name.split(" ")[0];
  const personalizedMessage = getPersonalizedMessage(
    result.data.name,
    result.data.situation,
    result.data.country,
    result.data.goal,
    result.data.obstacle,
    result.level,
    result.score,
    language
  );
  const profileDisplay = getProfileDisplay(
    result.data.situation,
    result.data.country,
    result.data.goal,
    result.data.obstacle,
    language
  );

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
      greeting: `¡${firstName}, tu diagnóstico está listo!`,
      yourScore: "Tu Puntuación Phoenix",
      outOf: "de 100",
      yourProfile: "Tu Perfil Financiero",
      situation: "Situación",
      country: "País",
      goal: "Objetivo",
      obstacle: "Desafío",
      personalAnalysis: "Análisis Personalizado",
      recommendations: "Áreas de Mejora Prioritarias",
      recommendationsSubtitle: "Basado en tus respuestas, estas son tus oportunidades:",
      ctaTitle: "🚀 Tu Plan de Acción Te Espera",
      ctaSubtitle: "Todas las herramientas para resolver lo que viste en tu diagnóstico",
      cta: "¡Descubre Tu Plan Personalizado!",
      ctaSecondary: "Ver todas las herramientas de EvoFinz",
      retake: "Volver a hacer el quiz",
      benefits: [
        { icon: Clock, text: "Empieza en 2 minutos" },
        { icon: Shield, text: "100% Gratis para comenzar" },
        { icon: Star, text: "Sin tarjeta de crédito" },
      ],
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
      greeting: `${firstName}, your diagnosis is ready!`,
      yourScore: "Your Phoenix Score",
      outOf: "out of 100",
      yourProfile: "Your Financial Profile",
      situation: "Situation",
      country: "Country",
      goal: "Goal",
      obstacle: "Challenge",
      personalAnalysis: "Personalized Analysis",
      recommendations: "Priority Improvement Areas",
      recommendationsSubtitle: "Based on your answers, these are your opportunities:",
      ctaTitle: "🚀 Your Action Plan Awaits",
      ctaSubtitle: "All the tools to solve what you saw in your diagnosis",
      cta: "Discover Your Personalized Plan!",
      ctaSecondary: "See all EvoFinz tools",
      retake: "Retake quiz",
      benefits: [
        { icon: Clock, text: "Start in 2 minutes" },
        { icon: Shield, text: "100% Free to start" },
        { icon: Star, text: "No credit card required" },
      ],
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
    <div className="min-h-screen flex flex-col items-center px-4 py-8 md:py-12 relative z-10">
      {/* Personalized Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {t.greeting}
        </h1>
      </motion.div>

      {/* Score Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center mb-6"
      >
        <PhoenixScoreAnimation level={result.level} />
        
        <div className="mt-4">
          <p className="text-slate-400 text-sm mb-1">{t.yourScore}</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${levelInfo.color} bg-clip-text text-transparent`}>
              {animatedScore}
            </span>
            <span className="text-slate-500 text-lg">{t.outOf}</span>
          </div>
        </div>
      </motion.div>

      {/* Level Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`${levelInfo.bgColor} ${levelInfo.borderColor} border rounded-2xl p-5 mb-6 max-w-md text-center`}
      >
        <span className="text-3xl mb-2 block">{levelInfo.icon}</span>
        <h2 className={`text-xl font-bold bg-gradient-to-r ${levelInfo.color} bg-clip-text text-transparent mb-1`}>
          {levelInfo.title}
        </h2>
        <p className="text-slate-300 text-sm">{levelInfo.description}</p>
      </motion.div>

      {/* Your Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full max-w-md bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          {t.yourProfile}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <span className="text-slate-400 block text-xs">{t.situation}</span>
            <span className="text-white flex items-center gap-1.5 mt-1">
              <span>{profileDisplay.situationIcon}</span>
              <span className="truncate">{result.data.situation}</span>
            </span>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <span className="text-slate-400 block text-xs">{t.country}</span>
            <span className="text-white flex items-center gap-1.5 mt-1">
              <span className="truncate">{result.data.country}</span>
            </span>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <span className="text-slate-400 block text-xs">{t.goal}</span>
            <span className="text-white flex items-center gap-1.5 mt-1">
              <span>{profileDisplay.goalIcon}</span>
              <span className="truncate">{result.data.goal}</span>
            </span>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <span className="text-slate-400 block text-xs">{t.obstacle}</span>
            <span className="text-white flex items-center gap-1.5 mt-1">
              <span>{profileDisplay.obstacleIcon}</span>
              <span className="truncate">{result.data.obstacle}</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* Personalized Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-md bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 mb-6"
      >
        <h3 className="text-lg font-semibold text-amber-400 mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          {t.personalAnalysis}
        </h3>
        <p className="text-slate-200 text-sm leading-relaxed">
          {personalizedMessage}
        </p>
      </motion.div>

      {/* For HIGH scorers - show why EvoFinz enhances excellence */}
      {result.score >= 80 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-full max-w-md bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-5 mb-6"
        >
          <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            {language === "es" ? "¿Por qué EvoFinz para ti?" : "Why EvoFinz for you?"}
          </h3>
          <ul className="space-y-2">
            {(language === "es" ? [
              "🚀 Automatiza lo que ya haces bien – ahorra horas cada mes",
              "📊 Dashboard ejecutivo con métricas que importan",
              "🎯 Optimizador fiscal que encuentra deducciones ocultas",
              "⚡ Captura gastos en 3 segundos con foto o voz",
            ] : [
              "🚀 Automate what you already do well – save hours monthly",
              "📊 Executive dashboard with metrics that matter",
              "🎯 Tax optimizer that finds hidden deductions",
              "⚡ Capture expenses in 3 seconds with photo or voice",
            ]).map((item, i) => (
              <li key={i} className="text-slate-300 text-sm">{item}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Recommendations - only show if there are failed questions */}
      {result.failedQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-full max-w-2xl mb-6"
        >
          <h3 className="text-lg font-bold text-white mb-2 text-center">{t.recommendations}</h3>
          <p className="text-slate-400 text-sm text-center mb-4">{t.recommendationsSubtitle}</p>
          <QuizRecommendations 
            failedQuestions={result.failedQuestions} 
            language={language}
            situation={result.data.situation}
          />
        </motion.div>
      )}

      {/* CTA Section - The WOW Factor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="relative bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-amber-500/30 rounded-2xl p-6 text-center overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-pulse" />
          
          <div className="relative z-10">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{t.ctaTitle}</h3>
            <p className="text-slate-300 text-sm mb-4">{t.ctaSubtitle}</p>
            
            {/* Features list */}
            <ul className="text-left space-y-2.5 mb-5">
              {t.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-start gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Main CTA Button - Irresistible */}
            <Button
              onClick={handleAccessApp}
              size="lg"
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:via-orange-600 hover:to-amber-600 text-white font-bold text-lg py-6 rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 animate-pulse hover:animate-none group"
            >
              <Rocket className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
              {t.cta}
              <Zap className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
            </Button>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              {t.benefits.map((benefit, index) => (
                <span key={index} className="flex items-center gap-1 text-slate-400">
                  <benefit.icon className="w-3.5 h-3.5 text-emerald-400" />
                  {benefit.text}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onRetake}
          className="flex items-center justify-center gap-2 mx-auto mt-5 text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">{t.retake}</span>
        </button>
      </motion.div>
    </div>
  );
};
