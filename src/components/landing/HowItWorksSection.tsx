import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, Camera, Zap, TrendingUp, Building2, FileText, 
  Receipt, GraduationCap, BookOpen, Brain, Flame, PiggyBank,
  Target, Car, MapPin, Calculator, Users, FolderOpen, FileSpreadsheet,
  Wallet, LineChart, Coins, ChevronLeft, ChevronRight, Sparkles,
  Shield, Clock, Heart, Award
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface WorkflowStep {
  number: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

interface Workflow {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  steps: WorkflowStep[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
    glow: string;
    badge: string;
    badgeText: string;
  };
}

const workflows: Workflow[] = [
  {
    id: 'expenses',
    title: 'Gestión de Gastos',
    subtitle: 'Domina cada peso que sale de tu bolsillo',
    emoji: '💸',
    colors: {
      primary: 'from-cyan-500 to-blue-500',
      secondary: 'from-cyan-400 to-blue-400',
      accent: 'cyan',
      gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
      glow: 'cyan-500/30',
      badge: 'bg-cyan-500/20',
      badgeText: 'text-cyan-400'
    },
    steps: [
      {
        number: '01',
        icon: Camera,
        title: 'Captura',
        description: 'Escanea recibos, dicta gastos o importa desde tu banco. EvoFinz hace el resto.'
      },
      {
        number: '02',
        icon: Zap,
        title: 'Automatiza',
        description: 'Categorización automática, detección de suscripciones y alertas inteligentes.'
      },
      {
        number: '03',
        icon: TrendingUp,
        title: 'Optimiza',
        description: 'Visualiza patrones, reduce gastos innecesarios y alcanza tus metas.'
      }
    ]
  },
  {
    id: 'networth',
    title: 'Patrimonio Neto',
    subtitle: 'Construye riqueza como los millonarios',
    emoji: '🏆',
    colors: {
      primary: 'from-emerald-500 to-teal-500',
      secondary: 'from-emerald-400 to-teal-400',
      accent: 'emerald',
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      glow: 'emerald-500/30',
      badge: 'bg-emerald-500/20',
      badgeText: 'text-emerald-400'
    },
    steps: [
      {
        number: '01',
        icon: Building2,
        title: 'Registra Activos',
        description: 'Propiedades, inversiones, ahorros. Distingue activos productivos de pasivos.'
      },
      {
        number: '02',
        icon: Shield,
        title: 'Clasifica Deudas',
        description: 'Deuda buena vs mala. Aprende qué deudas te hacen rico y cuáles te empobrecen.'
      },
      {
        number: '03',
        icon: Coins,
        title: 'Crece Tu Riqueza',
        description: 'Visualiza tu progreso, recibe tips personalizados y multiplica tu patrimonio.'
      }
    ]
  },
  {
    id: 'clients',
    title: 'Clientes & Proyectos',
    subtitle: 'Profesionaliza tu negocio freelance',
    emoji: '👔',
    colors: {
      primary: 'from-violet-500 to-purple-500',
      secondary: 'from-violet-400 to-purple-400',
      accent: 'violet',
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      glow: 'violet-500/30',
      badge: 'bg-violet-500/20',
      badgeText: 'text-violet-400'
    },
    steps: [
      {
        number: '01',
        icon: Users,
        title: 'Gestiona Clientes',
        description: 'Perfiles completos, historial de pagos, términos de facturación personalizados.'
      },
      {
        number: '02',
        icon: FolderOpen,
        title: 'Asigna Gastos',
        description: 'Vincula cada gasto a su proyecto. Nunca más pierdas un reembolso.'
      },
      {
        number: '03',
        icon: FileSpreadsheet,
        title: 'Genera Reportes',
        description: 'Reportes profesionales de reembolso listos para enviar a tus clientes.'
      }
    ]
  },
  {
    id: 'taxes',
    title: 'Impuestos CRA',
    subtitle: 'Maximiza deducciones, minimiza estrés',
    emoji: '📋',
    colors: {
      primary: 'from-orange-500 to-amber-500',
      secondary: 'from-orange-400 to-amber-400',
      accent: 'orange',
      gradient: 'from-orange-500 via-amber-500 to-yellow-500',
      glow: 'orange-500/30',
      badge: 'bg-orange-500/20',
      badgeText: 'text-orange-400'
    },
    steps: [
      {
        number: '01',
        icon: Receipt,
        title: 'Categoriza',
        description: 'Cada gasto clasificado según reglas del CRA. Soporta auditorías con confianza.'
      },
      {
        number: '02',
        icon: Calculator,
        title: 'Deduce',
        description: 'EvoFinz encuentra deducciones que podrías estar perdiendo. RRSP, TFSA optimizados.'
      },
      {
        number: '03',
        icon: FileText,
        title: 'Exporta T2125',
        description: 'Genera tu formulario T2125 listo para tu contador o declaración personal.'
      }
    ]
  },
  {
    id: 'education',
    title: 'Educación Financiera',
    subtitle: 'Aprende de los mejores mentores',
    emoji: '📚',
    colors: {
      primary: 'from-rose-500 to-pink-500',
      secondary: 'from-rose-400 to-pink-400',
      accent: 'rose',
      gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
      glow: 'rose-500/30',
      badge: 'bg-rose-500/20',
      badgeText: 'text-rose-400'
    },
    steps: [
      {
        number: '01',
        icon: BookOpen,
        title: 'Lee & Consume',
        description: 'Trackea libros, cursos y podcasts. Kiyosaki, Rohn, Tracy te guían.'
      },
      {
        number: '02',
        icon: Brain,
        title: 'Practica',
        description: 'Aplica conceptos en tu vida real. El diario financiero captura tus aprendizajes.'
      },
      {
        number: '03',
        icon: Award,
        title: 'Domina',
        description: 'Desbloquea logros, sube de nivel y transforma tu mentalidad de dinero.'
      }
    ]
  },
  {
    id: 'fire',
    title: 'FIRE / Retiro',
    subtitle: 'Libertad financiera antes de los 65',
    emoji: '🔥',
    colors: {
      primary: 'from-red-500 to-orange-500',
      secondary: 'from-red-400 to-orange-400',
      accent: 'red',
      gradient: 'from-red-500 via-orange-500 to-amber-500',
      glow: 'red-500/30',
      badge: 'bg-red-500/20',
      badgeText: 'text-red-400'
    },
    steps: [
      {
        number: '01',
        icon: PiggyBank,
        title: 'Ahorra Primero',
        description: 'Págate a ti primero. Automatiza el ahorro antes de gastar. Streaks y metas.'
      },
      {
        number: '02',
        icon: LineChart,
        title: 'Invierte',
        description: 'Calculadora FIRE personalizada. Lean, Standard o Fat FIRE - tú decides.'
      },
      {
        number: '03',
        icon: Flame,
        title: 'Libertad',
        description: 'Visualiza tu fecha de independencia financiera. Cada día más cerca.'
      }
    ]
  },
  {
    id: 'mileage',
    title: 'Kilometraje',
    subtitle: 'Cada kilómetro es dinero en tu bolsillo',
    emoji: '🚗',
    colors: {
      primary: 'from-lime-500 to-green-500',
      secondary: 'from-lime-400 to-green-400',
      accent: 'lime',
      gradient: 'from-lime-500 via-green-500 to-emerald-500',
      glow: 'lime-500/30',
      badge: 'bg-lime-500/20',
      badgeText: 'text-lime-400'
    },
    steps: [
      {
        number: '01',
        icon: MapPin,
        title: 'Registra Rutas',
        description: 'Autocomplete de direcciones, mapas visuales, historial de viajes frecuentes.'
      },
      {
        number: '02',
        icon: Calculator,
        title: 'Calcula Deducción',
        description: 'Tasa CRA actualizada automáticamente. Ve cuánto ahorras en impuestos.'
      },
      {
        number: '03',
        icon: Wallet,
        title: 'Reclama',
        description: 'Exporta reportes detallados listos para tu declaración de impuestos.'
      }
    ]
  },
  {
    id: 'contracts',
    title: 'Contratos Inteligentes',
    subtitle: 'EvoFinz lee la letra pequeña por ti',
    emoji: '📝',
    colors: {
      primary: 'from-indigo-500 to-blue-500',
      secondary: 'from-indigo-400 to-blue-400',
      accent: 'indigo',
      gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
      glow: 'indigo-500/30',
      badge: 'bg-indigo-500/20',
      badgeText: 'text-indigo-400'
    },
    steps: [
      {
        number: '01',
        icon: FileText,
        title: 'Sube Contrato',
        description: 'PDF o foto. EvoFinz extrae términos, fechas, montos y cláusulas clave.'
      },
      {
        number: '02',
        icon: Sparkles,
        title: 'Análisis Inteligente',
        description: 'Detecta términos de reembolso, renovaciones automáticas y obligaciones.'
      },
      {
        number: '03',
        icon: Clock,
        title: 'Alertas',
        description: 'Nunca pierdas una fecha límite. Recordatorios antes de renovaciones.'
      }
    ]
  }
];

export function HowItWorksSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [direction, setDirection] = useState(1);

  const currentWorkflow = workflows[currentIndex];

  // Auto-rotation - 10s optimal for ~40 words + 3 steps per workflow
  useEffect(() => {
    if (!autoPlay) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % workflows.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoPlay]);

  const goTo = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 15000);
  };

  const goNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % workflows.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 15000);
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + workflows.length) % workflows.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 15000);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9
    })
  };

  return (
    <section className="relative py-20 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
      {/* Dynamic background decoration based on current workflow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          key={`glow-left-${currentWorkflow.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`absolute top-1/4 left-0 w-96 h-96 bg-${currentWorkflow.colors.accent}-500/10 rounded-full blur-3xl`} 
        />
        <motion.div 
          key={`glow-right-${currentWorkflow.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`absolute bottom-1/4 right-0 w-96 h-96 bg-${currentWorkflow.colors.accent}-500/10 rounded-full blur-3xl`} 
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 px-4 py-2 bg-violet-500/20 text-violet-400 border-violet-500/30 text-sm">
            <Lightbulb className="w-4 h-4 mr-2 inline" />
            8 Flujos Inteligentes
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-white">Cómo Funciona </span>
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">EvoFinz</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Cada área de tu vida financiera, simplificada en 3 pasos.
          </p>
        </motion.div>

        {/* Workflow Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {workflows.map((workflow, index) => (
            <motion.button
              key={workflow.id}
              onClick={() => goTo(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                index === currentIndex
                  ? `bg-gradient-to-r ${workflow.colors.primary} text-white shadow-lg`
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <span className="text-lg">{workflow.emoji}</span>
              <span className="hidden sm:inline">{workflow.title}</span>
            </motion.button>
          ))}
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Navigation Arrows */}
          <button
            onClick={goPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-20 p-3 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-white hover:bg-slate-700 transition-all hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-20 p-3 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-white hover:bg-slate-700 transition-all hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentWorkflow.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {/* Workflow Title */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center gap-3 mb-3"
                >
                  <span className="text-5xl">{currentWorkflow.emoji}</span>
                  <h3 className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${currentWorkflow.colors.primary} bg-clip-text text-transparent`}>
                    {currentWorkflow.title}
                  </h3>
                </motion.div>
                <p className="text-slate-400 text-lg">{currentWorkflow.subtitle}</p>
              </div>

              {/* Connection line */}
              <div className={`absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r ${currentWorkflow.colors.gradient} hidden md:block -translate-y-1/2 opacity-30 mt-20`} />

              {/* Steps */}
              <div className="grid md:grid-cols-3 gap-8 mt-4">
                {currentWorkflow.steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={`${currentWorkflow.id}-${step.number}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15, duration: 0.4 }}
                      className="relative"
                    >
                      {/* Step Card */}
                      <div className={`relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-${currentWorkflow.colors.accent}-500/50 transition-all duration-300 hover:-translate-y-2 group`}>
                        {/* Step Number */}
                        <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br ${currentWorkflow.colors.primary} flex items-center justify-center shadow-lg shadow-${currentWorkflow.colors.glow}`}>
                          <span className="text-white font-black text-lg">{step.number}</span>
                        </div>

                        {/* Icon */}
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentWorkflow.colors.primary} flex items-center justify-center mb-6 shadow-lg mx-auto group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>

                        <h4 className="text-2xl font-bold text-white text-center mb-3">{step.title}</h4>
                        <p className="text-slate-400 text-center leading-relaxed">{step.description}</p>
                      </div>

                      {/* Arrow connector (hidden on last item and mobile) */}
                      {index < currentWorkflow.steps.length - 1 && (
                        <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 -translate-y-1/2 z-10">
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className={`text-${currentWorkflow.colors.accent}-500 text-2xl font-bold`}
                          >
                            →
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-10">
            {workflows.map((workflow, index) => (
              <button
                key={workflow.id}
                onClick={() => goTo(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? `w-8 bg-gradient-to-r ${workflow.colors.primary}`
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          {/* Workflow counter */}
          <div className="text-center mt-4">
            <span className="text-slate-500 text-sm">
              {currentIndex + 1} / {workflows.length}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
