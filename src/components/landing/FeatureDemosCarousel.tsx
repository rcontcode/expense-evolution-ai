import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Camera, Wallet, BarChart3, Car, Building2, Trophy, FileText, Flame, GraduationCap, Calculator, Mic, TrendingDown, CreditCard, BookOpen, Target } from "lucide-react";
import { ReceiptDemoAnimation } from "./ReceiptDemoAnimation";
import { NetWorthDemoAnimation } from "./NetWorthDemoAnimation";
import { DashboardDemoAnimation } from "./DashboardDemoAnimation";
import { MileageDemoAnimation } from "./MileageDemoAnimation";
import { BankingDemoAnimation } from "./BankingDemoAnimation";
import { GamificationDemoAnimation } from "./GamificationDemoAnimation";
import { ContractsDemoAnimation } from "./ContractsDemoAnimation";
import { FIREDemoAnimation } from "./FIREDemoAnimation";
import { EducationDemoAnimation } from "./EducationDemoAnimation";
import { TaxOptimizerDemoAnimation } from "./TaxOptimizerDemoAnimation";
import { VoiceAssistantDemoAnimation } from "./VoiceAssistantDemoAnimation";
import { DebtManagerDemoAnimation } from "./DebtManagerDemoAnimation";
import { SubscriptionsDemoAnimation } from "./SubscriptionsDemoAnimation";
import { JournalDemoAnimation } from "./JournalDemoAnimation";
import { HabitsDemoAnimation } from "./HabitsDemoAnimation";
import { useLanguage } from "@/contexts/LanguageContext";

const getDemos = (language: string) => [
  { 
    id: "receipt", 
    title: language === 'es' ? "Captura Inteligente" : "Smart Capture", 
    subtitle: language === 'es' ? "OCR Smart extrae datos automáticamente" : "Smart OCR extracts data automatically",
    icon: Camera,
    color: "from-cyan-500 to-blue-600",
    component: ReceiptDemoAnimation 
  },
  { 
    id: "voice", 
    title: language === 'es' ? "Asistente de Voz" : "Voice Assistant", 
    subtitle: language === 'es' ? "Comandos por voz con detección ES/EN" : "Voice commands with ES/EN detection",
    icon: Mic,
    color: "from-violet-500 to-purple-600",
    component: VoiceAssistantDemoAnimation 
  },
  { 
    id: "networth", 
    title: language === 'es' ? "Patrimonio Neto" : "Net Worth", 
    subtitle: language === 'es' ? "Solo activos que generan ingreso" : "Only income-generating assets",
    icon: Wallet,
    color: "from-emerald-500 to-teal-600",
    component: NetWorthDemoAnimation 
  },
  { 
    id: "dashboard", 
    title: language === 'es' ? "Analytics Avanzado" : "Advanced Analytics", 
    subtitle: language === 'es' ? "9+ visualizaciones con predicciones inteligentes" : "9+ visualizations with smart predictions",
    icon: BarChart3,
    color: "from-violet-500 to-purple-600",
    component: DashboardDemoAnimation 
  },
  { 
    id: "habits", 
    title: language === 'es' ? "Hábitos Atómicos" : "Atomic Habits", 
    subtitle: language === 'es' ? "Construye hábitos financieros ganadores" : "Build winning financial habits",
    icon: Target,
    color: "from-indigo-500 to-violet-600",
    component: HabitsDemoAnimation 
  },
  { 
    id: "gamification", 
    title: language === 'es' ? "Gamificación" : "Gamification", 
    subtitle: language === 'es' ? "XP, niveles, logros y rachas" : "XP, levels, achievements and streaks",
    icon: Trophy,
    color: "from-amber-500 to-orange-600",
    component: GamificationDemoAnimation 
  },
  { 
    id: "debt", 
    title: language === 'es' ? "Gestor de Deudas" : "Debt Manager", 
    subtitle: language === 'es' ? "Avalancha vs Bola de nieve" : "Avalanche vs Snowball methods",
    icon: TrendingDown,
    color: "from-rose-500 to-red-600",
    component: DebtManagerDemoAnimation 
  },
  { 
    id: "subscriptions", 
    title: language === 'es' ? "Detector Suscripciones" : "Subscription Detector", 
    subtitle: language === 'es' ? "Encuentra suscripciones olvidadas" : "Find forgotten subscriptions",
    icon: CreditCard,
    color: "from-pink-500 to-rose-600",
    component: SubscriptionsDemoAnimation 
  },
  { 
    id: "journal", 
    title: language === 'es' ? "Diario Financiero" : "Financial Journal", 
    subtitle: language === 'es' ? "Reflexiona y aprende de tus decisiones" : "Reflect and learn from decisions",
    icon: BookOpen,
    color: "from-amber-500 to-orange-600",
    component: JournalDemoAnimation 
  },
  { 
    id: "contracts", 
    title: language === 'es' ? "Contratos Smart" : "Smart Contracts", 
    subtitle: language === 'es' ? "Extracción automática de términos" : "Automatic term extraction",
    icon: FileText,
    color: "from-indigo-500 to-blue-600",
    component: ContractsDemoAnimation 
  },
  { 
    id: "fire", 
    title: language === 'es' ? "Calculadora FIRE" : "FIRE Calculator", 
    subtitle: "Financial Independence Retire Early",
    icon: Flame,
    color: "from-orange-500 to-red-600",
    component: FIREDemoAnimation 
  },
  { 
    id: "education", 
    title: language === 'es' ? "Educación Financiera" : "Financial Education", 
    subtitle: language === 'es' ? "Tracking de libros y lecciones" : "Book and lesson tracking",
    icon: GraduationCap,
    color: "from-green-500 to-emerald-600",
    component: EducationDemoAnimation 
  },
  { 
    id: "tax", 
    title: "Tax Optimizer Smart", 
    subtitle: language === 'es' ? "Maximiza deducciones fiscales" : "Maximize tax deductions",
    icon: Calculator,
    color: "from-cyan-500 to-teal-600",
    component: TaxOptimizerDemoAnimation 
  },
  { 
    id: "mileage", 
    title: language === 'es' ? "Kilometraje Fiscal" : "Tax Mileage", 
    subtitle: language === 'es' ? "Cálculo automático de deducciones" : "Automatic deduction calculation",
    icon: Car,
    color: "from-blue-500 to-indigo-600",
    component: MileageDemoAnimation 
  },
  { 
    id: "banking", 
    title: "Smart Banking", 
    subtitle: language === 'es' ? "Análisis inteligente de estados de cuenta" : "Smart bank statement analysis",
    icon: Building2,
    color: "from-rose-500 to-pink-600",
    component: BankingDemoAnimation 
  },
];

export function FeatureDemosCarousel() {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const demos = getDemos(language);

  // Auto-rotation - 15s optimal for interactive demos with animations
  useEffect(() => {
    if (!autoPlay) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % demos.length);
    }, 15000);
    
    return () => clearInterval(timer);
  }, [autoPlay, demos.length]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setAutoPlay(false);
    // Resume autoplay after 30 seconds
    setTimeout(() => setAutoPlay(true), 30000);
  };

  const goNext = () => {
    goTo((currentIndex + 1) % demos.length);
  };

  const goPrev = () => {
    goTo((currentIndex - 1 + demos.length) % demos.length);
  };

  const CurrentDemo = demos[currentIndex].component;
  const CurrentIcon = demos[currentIndex].icon;

  const swipeHint = language === 'es' ? 'Desliza para ver más demos' : 'Swipe to see more demos';

  return (
    <div className="relative">
      {/* Title */}
      <motion.div 
        key={currentIndex}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${demos[currentIndex].color} text-white text-sm font-medium shadow-lg mb-3`}>
          <CurrentIcon className="w-4 h-4" />
          {demos[currentIndex].title}
        </div>
        <p className="text-slate-500 text-sm">{demos[currentIndex].subtitle}</p>
      </motion.div>

      {/* Demo Container */}
      <div className="relative">
        {/* Navigation Arrows */}
        <button
          onClick={goPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 hover:text-cyan-600 hover:shadow-xl transition-all hover:scale-110 hidden md:flex"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 hover:text-cyan-600 hover:shadow-xl transition-all hover:scale-110 hidden md:flex"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Demo Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentDemo />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Navigation */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {demos.map((demo, index) => {
          const Icon = demo.icon;
          return (
            <button
              key={demo.id}
              onClick={() => goTo(index)}
              className={`group relative flex items-center justify-center transition-all duration-300 ${
                index === currentIndex 
                  ? "w-12 h-12" 
                  : "w-8 h-8 hover:w-10 hover:h-10"
              }`}
            >
              <div
                className={`absolute inset-0 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? `bg-gradient-to-r ${demo.color} shadow-lg`
                    : "bg-slate-200 group-hover:bg-slate-300"
                }`}
              />
              <Icon
                className={`relative z-10 transition-all duration-300 ${
                  index === currentIndex
                    ? "w-5 h-5 text-white"
                    : "w-4 h-4 text-slate-500 group-hover:text-slate-700"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Mobile swipe hint */}
      <p className="text-center text-[10px] text-slate-400 mt-4 md:hidden">
        {swipeHint}
      </p>
    </div>
  );
}
