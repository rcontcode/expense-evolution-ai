import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, ArrowRight, RotateCcw, CheckCircle2, Sparkles, Rocket, Zap, Star, Target, Shield, Clock, Crown, TrendingUp, Gift, ChevronRight, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { PhoenixScoreAnimation } from "./PhoenixScoreAnimation";
import { QuizRecommendations } from "./QuizRecommendations";
import type { QuizResult, ReferralInfo } from "@/pages/FinancialQuiz";
import confetti from "canvas-confetti";

interface QuizResultsProps {
  result: QuizResult;
  onRetake: () => void;
  referralInfo?: ReferralInfo | null;
  onNavigateToAuth?: () => void;
}

const getLevelInfo = (level: QuizResult["level"], language: string) => {
  const levels = {
    principiante: {
      es: {
        title: "Phoenix Principiante",
        description: "Tu Phoenix financiero está listo para nacer. Tienes un gran potencial esperando ser liberado.",
        color: "from-red-500 to-orange-500",
        bgColor: "bg-gradient-to-br from-red-500/20 to-orange-500/10",
        borderColor: "border-red-500/40",
        glowColor: "shadow-red-500/20",
        icon: "🔥",
      },
      en: {
        title: "Beginner Phoenix",
        description: "Your financial Phoenix is ready to be born. You have great potential waiting to be unleashed.",
        color: "from-red-500 to-orange-500",
        bgColor: "bg-gradient-to-br from-red-500/20 to-orange-500/10",
        borderColor: "border-red-500/40",
        glowColor: "shadow-red-500/20",
        icon: "🔥",
      },
    },
    emergente: {
      es: {
        title: "Phoenix Emergente",
        description: "Tu Phoenix está despertando. Ya tienes bases sólidas, es hora de potenciarlas.",
        color: "from-orange-500 to-amber-500",
        bgColor: "bg-gradient-to-br from-orange-500/20 to-amber-500/10",
        borderColor: "border-orange-500/40",
        glowColor: "shadow-orange-500/20",
        icon: "🌅",
      },
      en: {
        title: "Emerging Phoenix",
        description: "Your Phoenix is awakening. You have solid foundations, time to supercharge them.",
        color: "from-orange-500 to-amber-500",
        bgColor: "bg-gradient-to-br from-orange-500/20 to-amber-500/10",
        borderColor: "border-orange-500/40",
        glowColor: "shadow-orange-500/20",
        icon: "🌅",
      },
    },
    evolucionando: {
      es: {
        title: "Phoenix en Evolución",
        description: "Tu Phoenix está volando alto. Vas por buen camino, ¡automaticemos para que vueles aún más alto!",
        color: "from-amber-400 to-yellow-400",
        bgColor: "bg-gradient-to-br from-amber-500/20 to-yellow-500/10",
        borderColor: "border-amber-500/40",
        glowColor: "shadow-amber-500/20",
        icon: "🦅",
      },
      en: {
        title: "Evolving Phoenix",
        description: "Your Phoenix is flying high. You're on the right track, let's automate so you can soar even higher!",
        color: "from-amber-400 to-yellow-400",
        bgColor: "bg-gradient-to-br from-amber-500/20 to-yellow-500/10",
        borderColor: "border-amber-500/40",
        glowColor: "shadow-amber-500/20",
        icon: "🦅",
      },
    },
    maestro: {
      es: {
        title: "Phoenix Maestro",
        description: "¡Tu Phoenix brilla con luz propia! Tienes un excelente control financiero. EvoFinz es tu copiloto para ir más lejos, más rápido.",
        color: "from-emerald-400 to-teal-400",
        bgColor: "bg-gradient-to-br from-emerald-500/20 to-teal-500/10",
        borderColor: "border-emerald-500/40",
        glowColor: "shadow-emerald-500/20",
        icon: "✨",
      },
      en: {
        title: "Master Phoenix",
        description: "Your Phoenix shines bright! You have excellent financial control. EvoFinz is your copilot to go further, faster.",
        color: "from-emerald-400 to-teal-400",
        bgColor: "bg-gradient-to-br from-emerald-500/20 to-teal-500/10",
        borderColor: "border-emerald-500/40",
        glowColor: "shadow-emerald-500/20",
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
          canada: `${firstName}, ¡impresionante dominio financiero! Como freelancer en Canadá que ya controla sus finanzas, EvoFinz es tu **multiplicador de resultados**: captura gastos en segundos con foto o voz, genera reportes T2125 automáticamente, y nuestro optimizador fiscal encuentra deducciones que incluso los expertos pasan por alto.`,
          chile: `${firstName}, ¡excelente gestión! Como freelancer en Chile con control financiero, EvoFinz te da **superpoderes**: automatiza la organización de boletas, calcula retenciones de honorarios automáticamente, y te alerta de deadlines del SII.`,
          default: `${firstName}, ¡felicitaciones por tu disciplina financiera! EvoFinz no es para "arreglarte" – es para **potenciarte**. Automatiza las tareas repetitivas que ya haces bien y libera tu tiempo para lo que realmente importa.`,
        },
        employee: {
          canada: `${firstName}, ¡tienes una base financiera sólida! Como empleado en Canadá, EvoFinz te ayuda a descubrir **deducciones ocultas** (home office, educación, gastos médicos) que podrías estar perdiendo. Además, nuestro calculador FIRE te muestra exactamente cuándo podrás ser financieramente libre.`,
          chile: `${firstName}, ¡excelente control! Como empleado en Chile, EvoFinz te ayuda a **maximizar tu APV**, optimizar gastos de salud y educación, y visualizar tu camino hacia la libertad financiera.`,
          default: `${firstName}, ¡admirable disciplina! Para alguien con tu nivel de control, EvoFinz es el **copiloto perfecto**: tracking automático de patrimonio neto, proyecciones de jubilación, y análisis de tendencias.`,
        },
        business: {
          canada: `${firstName}, ¡gestión empresarial ejemplar! EvoFinz es tu **centro de comando financiero**: genera reportes T2125 con un clic, identifica gastos deducibles automáticamente, y rastrea rentabilidad por cliente/proyecto.`,
          chile: `${firstName}, ¡control empresarial impecable! EvoFinz automatiza tu gestión con el SII: organiza facturas, calcula IVA, genera reportes para tu contador, y te da visibilidad total de tu flujo de caja.`,
          default: `${firstName}, ¡excelente visión de negocio! EvoFinz escala contigo: desde tracking automático de gastos hasta análisis de rentabilidad por proyecto.`,
        },
        default: `${firstName}, ¡eres un ejemplo de disciplina financiera! EvoFinz no reemplaza tu expertise – lo **amplifica**. Automatización inteligente, insights basados en datos, y herramientas que transforman buenas prácticas en resultados extraordinarios.`,
      },
      en: {
        freelancer: {
          canada: `${firstName}, impressive financial mastery! As a freelancer in Canada who already controls their finances, EvoFinz is your **results multiplier**: capture expenses in seconds with photo or voice, auto-generate T2125 reports, and our tax optimizer finds deductions even experts miss.`,
          chile: `${firstName}, excellent management! As a freelancer in Chile with financial control, EvoFinz gives you **superpowers**: automate invoice organization, auto-calculate withholdings, and get SII deadline alerts.`,
          default: `${firstName}, congratulations on your financial discipline! EvoFinz isn't here to "fix" you – it's here to **supercharge** you. Automate repetitive tasks you already do well and free your time for what matters.`,
        },
        employee: {
          canada: `${firstName}, you have a solid financial foundation! As a Canadian employee, EvoFinz helps you discover **hidden deductions** (home office, education, medical) you might be missing. Plus, our FIRE calculator shows exactly when you can be financially free.`,
          chile: `${firstName}, excellent control! As a Chilean employee, EvoFinz helps you **maximize APV**, optimize health and education expenses, and visualize your path to financial freedom.`,
          default: `${firstName}, admirable discipline! For someone at your level, EvoFinz is the **perfect copilot**: automatic net worth tracking, retirement projections, and trend analysis that turns data into smart decisions.`,
        },
        business: {
          canada: `${firstName}, exemplary business management! EvoFinz is your **financial command center**: generate T2125 reports with one click, auto-identify deductible expenses, and track profitability by client/project.`,
          chile: `${firstName}, impeccable business control! EvoFinz automates your SII management: organize invoices, calculate VAT, generate reports for your accountant, and get full cash flow visibility.`,
          default: `${firstName}, excellent business vision! EvoFinz scales with you: from automatic expense tracking to per-project profitability analysis.`,
        },
        default: `${firstName}, you're an example of financial discipline! EvoFinz doesn't replace your expertise – it **amplifies** it. Smart automation, data-driven insights, and tools that transform good practices into extraordinary results.`,
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

// Animated Score Ring Component
const ScoreRing = ({ score, color }: { score: number; color: string }) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <svg className="absolute w-[200px] h-[200px] -rotate-90" viewBox="0 0 200 200">
      {/* Background ring */}
      <circle
        cx="100"
        cy="100"
        r={radius}
        stroke="currentColor"
        strokeWidth="6"
        fill="none"
        className="text-muted/30"
      />
      {/* Animated progress ring */}
      <motion.circle
        cx="100"
        cy="100"
        r={radius}
        stroke="url(#scoreGradient)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
        style={{ strokeDasharray: circumference }}
      />
      <defs>
        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const QuizResults = ({ result, onRetake, referralInfo, onNavigateToAuth }: QuizResultsProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const hasConfettiFired = useRef(false);

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

  const hasVipReferral = referralInfo?.isValid && referralInfo?.referrerName;

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
        // Fire confetti when score animation completes
        if (!hasConfettiFired.current) {
          hasConfettiFired.current = true;
          setShowConfetti(true);
          const colors = result.score >= 80 
            ? ['#22c55e', '#10b981', '#34d399', '#fbbf24']
            : result.score >= 60
            ? ['#f59e0b', '#fbbf24', '#fcd34d']
            : ['#ef4444', '#f97316', '#fb923c'];
          
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.4 },
            colors,
          });
        }
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [result.score]);

  const handleAccessApp = () => {
    if (onNavigateToAuth) {
      onNavigateToAuth();
    } else if (hasVipReferral && referralInfo?.code) {
      navigate(`/auth?ref=${referralInfo.code}`);
    } else {
      navigate("/landing");
    }
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
      ctaTitle: "Tu Plan de Acción Te Espera",
      ctaSubtitle: "Todas las herramientas para resolver lo que viste en tu diagnóstico",
      cta: "¡Descubre EvoFinz Gratis!",
      ctaSecondary: "Ver todas las herramientas",
      retake: "Volver a hacer el quiz",
      benefits: [
        { icon: Clock, text: "Empieza en 2 min" },
        { icon: Shield, text: "100% Gratis" },
        { icon: Gift, text: "Sin tarjeta" },
      ],
      features: [
        { icon: Zap, text: "Captura gastos con foto, voz o texto" },
        { icon: TrendingUp, text: "Presupuestos inteligentes con alertas" },
        { icon: Target, text: "Optimizador de impuestos Canadá/Chile" },
        { icon: Flame, text: "Calculador FIRE para libertad financiera" },
      ],
      whyEvofinz: "¿Por qué EvoFinz para ti?",
      whyItems: [
        "🚀 Automatiza lo que ya haces bien",
        "📊 Dashboard con métricas que importan",
        "🎯 Optimizador fiscal inteligente",
        "⚡ Captura en 3 segundos",
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
      ctaTitle: "Your Action Plan Awaits",
      ctaSubtitle: "All the tools to solve what you saw in your diagnosis",
      cta: "Discover EvoFinz Free!",
      ctaSecondary: "See all tools",
      retake: "Retake quiz",
      benefits: [
        { icon: Clock, text: "Start in 2 min" },
        { icon: Shield, text: "100% Free" },
        { icon: Gift, text: "No card needed" },
      ],
      features: [
        { icon: Zap, text: "Capture expenses with photo, voice or text" },
        { icon: TrendingUp, text: "Smart budgets with alerts" },
        { icon: Target, text: "Tax optimizer for Canada/Chile" },
        { icon: Flame, text: "FIRE calculator for financial freedom" },
      ],
      whyEvofinz: "Why EvoFinz for you?",
      whyItems: [
        "🚀 Automate what you already do well",
        "📊 Dashboard with metrics that matter",
        "🎯 Smart tax optimizer",
        "⚡ Capture in 3 seconds",
      ],
    },
  };

  const t = content[language as keyof typeof content] || content.es;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 md:py-12 relative z-10">
      {/* Personalized Greeting with Crown for high scorers */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          {result.score >= 80 && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Crown className="w-7 h-7 text-amber-400 drop-shadow-lg" />
            </motion.div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {t.greeting}
          </h1>
          {result.score >= 80 && (
            <motion.div
              initial={{ scale: 0, rotate: 20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Crown className="w-7 h-7 text-amber-400 drop-shadow-lg" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Score Section with Ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center mb-8 relative"
      >
        <div className="relative flex items-center justify-center">
          <ScoreRing score={result.score} color={levelInfo.color} />
          <div className="relative z-10">
            <PhoenixScoreAnimation level={result.level} />
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6"
        >
          <p className="text-white/70 text-sm mb-1 font-medium tracking-wide uppercase">{t.yourScore}</p>
          <div className="flex items-baseline justify-center gap-2">
            <motion.span 
              className={`text-6xl md:text-7xl font-black bg-gradient-to-r ${levelInfo.color} bg-clip-text text-transparent drop-shadow-lg`}
              animate={showConfetti ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {animatedScore}
            </motion.span>
            <span className="text-white/60 text-xl font-medium">{t.outOf}</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Level Badge - Premium Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={`${levelInfo.bgColor} ${levelInfo.borderColor} border-2 rounded-2xl p-6 mb-6 max-w-md text-center backdrop-blur-xl shadow-2xl ${levelInfo.glowColor}`}
      >
        <motion.span 
          className="text-4xl mb-3 block"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          {levelInfo.icon}
        </motion.span>
        <h2 className={`text-2xl font-black bg-gradient-to-r ${levelInfo.color} bg-clip-text text-transparent mb-2`}>
          {levelInfo.title}
        </h2>
        <p className="text-white/90 text-sm font-medium leading-relaxed">{levelInfo.description}</p>
      </motion.div>

      {/* Your Profile Card - Clean Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 shadow-xl"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          {t.yourProfile}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: t.situation, value: result.data.situation, icon: profileDisplay.situationIcon },
            { label: t.country, value: result.data.country, icon: "🌍" },
            { label: t.goal, value: result.data.goal, icon: profileDisplay.goalIcon },
            { label: t.obstacle, value: result.data.obstacle, icon: profileDisplay.obstacleIcon },
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors"
            >
              <span className="text-white/50 block text-xs font-medium uppercase tracking-wide">{item.label}</span>
              <span className="text-white flex items-center gap-1.5 mt-1.5 font-semibold">
                <span className="text-lg">{item.icon}</span>
                <span className="truncate text-sm">{item.value}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Personalized Message - Highlighted */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-full max-w-md bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-500/30 backdrop-blur-xl rounded-2xl p-6 mb-6 shadow-xl shadow-amber-500/10"
      >
        <h3 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          {t.personalAnalysis}
        </h3>
        <p
          className="text-white/90 text-sm leading-relaxed font-medium"
          dangerouslySetInnerHTML={{
            __html: personalizedMessage.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="text-amber-400 font-bold">$1</strong>'
            ),
          }}
        />
      </motion.div>

      {/* For HIGH scorers - Enhanced why section */}
      {result.score >= 80 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="w-full max-w-md bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/30 backdrop-blur-xl rounded-2xl p-6 mb-6 shadow-xl shadow-emerald-500/10"
        >
          <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            {t.whyEvofinz}
          </h3>
          <ul className="space-y-3">
            {t.whyItems.map((item, i) => (
              <motion.li 
                key={i} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="text-white/90 text-sm font-medium flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4 text-emerald-400" />
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Recommendations - only show if there are failed questions */}
      {result.failedQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="w-full max-w-2xl mb-6"
        >
          <h3 className="text-lg font-bold text-white mb-2 text-center">{t.recommendations}</h3>
          <p className="text-white/60 text-sm text-center mb-4">{t.recommendationsSubtitle}</p>
          <QuizRecommendations 
            failedQuestions={result.failedQuestions} 
            language={language}
            situation={result.data.situation}
          />
        </motion.div>
      )}

      {/* EPIC CTA Section - VIP Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="w-full max-w-md"
      >
        <div className="relative overflow-hidden">
          {/* Animated glow background - Gold for VIP */}
          <motion.div 
            className={`absolute inset-0 rounded-3xl blur-xl ${
              hasVipReferral 
                ? "bg-gradient-to-r from-yellow-500/30 via-amber-400/40 to-yellow-500/30"
                : "bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-amber-500/20"
            }`}
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          <div className={`relative backdrop-blur-xl rounded-3xl p-6 text-center shadow-2xl ${
            hasVipReferral
              ? "bg-gradient-to-b from-amber-900/40 to-slate-900/95 border-2 border-yellow-400/50 shadow-yellow-500/30"
              : "bg-gradient-to-b from-slate-800/95 to-slate-900/95 border-2 border-amber-500/40 shadow-amber-500/20"
          }`}>
            {/* VIP Badge inside CTA */}
            {hasVipReferral && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", bounce: 0.5 }}
                className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-bold text-xs shadow-lg shadow-yellow-500/40"
              >
                <Crown className="w-3.5 h-3.5" />
                {language === "es" ? "INVITACIÓN VIP" : "VIP INVITATION"}
                <Crown className="w-3.5 h-3.5" />
              </motion.div>
            )}

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-1 h-1 rounded-full ${hasVipReferral ? "bg-yellow-400" : "bg-amber-400"}`}
                  style={{ left: `${10 + i * 12}%`, top: "80%" }}
                  animate={{
                    y: [-20, -80],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>

            {/* Moving shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-3xl"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
            
            <div className={`relative z-10 ${hasVipReferral ? "pt-4" : ""}`}>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {hasVipReferral ? (
                  <Users className="w-10 h-10 text-yellow-400 mx-auto mb-3 drop-shadow-lg" />
                ) : (
                  <Rocket className="w-10 h-10 text-amber-400 mx-auto mb-3 drop-shadow-lg" />
                )}
              </motion.div>
              
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                {hasVipReferral 
                  ? (language === "es" 
                    ? `¡${referralInfo?.referrerName} Te Espera!`
                    : `${referralInfo?.referrerName} Is Waiting!`)
                  : t.ctaTitle
                }
              </h3>
              <p className="text-white/70 text-sm mb-5">
                {hasVipReferral
                  ? (language === "es"
                    ? "Únete ahora y activa tu acceso VIP de 90 días"
                    : "Join now and activate your 90-day VIP access")
                  : t.ctaSubtitle
                }
              </p>
              
              {/* Features list with icons */}
              <ul className="text-left space-y-3 mb-6">
                {t.features.map((feature, index) => (
                  <motion.li 
                    key={index} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-center gap-3 text-white"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      hasVipReferral ? "bg-yellow-500/20" : "bg-amber-500/20"
                    }`}>
                      <feature.icon className={`w-4 h-4 ${hasVipReferral ? "text-yellow-400" : "text-amber-400"}`} />
                    </div>
                    <span className="text-sm font-medium">{feature.text}</span>
                  </motion.li>
                ))}
              </ul>

              {/* Main CTA Button - VIP Enhanced */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleAccessApp}
                  size="lg"
                  className={`w-full relative overflow-hidden text-white font-black text-lg py-7 rounded-2xl transition-all duration-300 group border-0 ${
                    hasVipReferral
                      ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-500 shadow-xl shadow-yellow-500/40 text-slate-900"
                      : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:via-orange-600 hover:to-amber-600 shadow-xl shadow-amber-500/40"
                  }`}
                >
                  {/* Button shine */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                  <span className="relative flex items-center justify-center gap-2">
                    {hasVipReferral ? (
                      <>
                        <Crown className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        {language === "es" ? "¡Activar Mi Acceso VIP!" : "Activate My VIP Access!"}
                      </>
                    ) : (
                      <>
                        <Star className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        {t.cta}
                      </>
                    )}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </motion.div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
                {t.benefits.map((benefit, index) => (
                  <motion.span 
                    key={index} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                    className="flex items-center gap-1.5 text-white/80 bg-white/5 px-3 py-1.5 rounded-full text-xs font-medium"
                  >
                    <benefit.icon className="w-3.5 h-3.5 text-emerald-400" />
                    {benefit.text}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <motion.button
          onClick={onRetake}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex items-center justify-center gap-2 mx-auto mt-6 text-white/50 hover:text-white transition-colors font-medium group"
        >
          <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-sm">{t.retake}</span>
        </motion.button>
      </motion.div>
    </div>
  );
};
