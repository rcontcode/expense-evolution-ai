import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Camera, Wallet, BarChart3, Car, Building2, Trophy, FileText, Flame, GraduationCap, Calculator } from "lucide-react";
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

const demos = [
  { 
    id: "receipt", 
    title: "Captura Inteligente", 
    subtitle: "OCR + IA extrae datos automáticamente",
    icon: Camera,
    color: "from-cyan-500 to-blue-600",
    component: ReceiptDemoAnimation 
  },
  { 
    id: "networth", 
    title: "Patrimonio Neto", 
    subtitle: "Solo activos que generan ingreso",
    icon: Wallet,
    color: "from-emerald-500 to-teal-600",
    component: NetWorthDemoAnimation 
  },
  { 
    id: "dashboard", 
    title: "Analytics Avanzado", 
    subtitle: "9+ visualizaciones con predicciones IA",
    icon: BarChart3,
    color: "from-violet-500 to-purple-600",
    component: DashboardDemoAnimation 
  },
  { 
    id: "gamification", 
    title: "Gamificación", 
    subtitle: "XP, niveles, logros y rachas",
    icon: Trophy,
    color: "from-amber-500 to-orange-600",
    component: GamificationDemoAnimation 
  },
  { 
    id: "contracts", 
    title: "Contratos IA", 
    subtitle: "Extracción automática de términos",
    icon: FileText,
    color: "from-indigo-500 to-blue-600",
    component: ContractsDemoAnimation 
  },
  { 
    id: "fire", 
    title: "Calculadora FIRE", 
    subtitle: "Financial Independence Retire Early",
    icon: Flame,
    color: "from-orange-500 to-red-600",
    component: FIREDemoAnimation 
  },
  { 
    id: "education", 
    title: "Educación Financiera", 
    subtitle: "Tracking de libros y lecciones",
    icon: GraduationCap,
    color: "from-green-500 to-emerald-600",
    component: EducationDemoAnimation 
  },
  { 
    id: "tax", 
    title: "Tax Optimizer IA", 
    subtitle: "Maximiza deducciones CRA",
    icon: Calculator,
    color: "from-cyan-500 to-teal-600",
    component: TaxOptimizerDemoAnimation 
  },
  { 
    id: "mileage", 
    title: "Kilometraje CRA", 
    subtitle: "Cálculo automático de deducciones",
    icon: Car,
    color: "from-blue-500 to-indigo-600",
    component: MileageDemoAnimation 
  },
  { 
    id: "banking", 
    title: "Smart Banking", 
    subtitle: "Análisis de estados de cuenta con IA",
    icon: Building2,
    color: "from-rose-500 to-pink-600",
    component: BankingDemoAnimation 
  },
];

export function FeatureDemosCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % demos.length);
    }, 12000);
    
    return () => clearInterval(timer);
  }, [autoPlay]);

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
        Desliza para ver más demos
      </p>
    </div>
  );
}
