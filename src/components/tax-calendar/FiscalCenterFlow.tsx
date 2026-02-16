import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, Calculator, BookOpen, ExternalLink, 
  ChevronDown, Sparkles, CheckCircle2, 
  Zap, Target, ArrowRight
} from "lucide-react";

interface FiscalFlowStep {
  id: string;
  emoji: string;
  tabValue: string;
  label: { es: string; en: string };
  description: { es: string; en: string };
  helpText: { es: string; en: string };
  color: string;
  glowColor: string;
  iconBg: string;
  icon: React.ReactNode;
}

const FLOW_STEPS: FiscalFlowStep[] = [
  {
    id: 'profile',
    emoji: '🧑‍💼',
    tabValue: '',
    label: { es: 'Tu Perfil Fiscal', en: 'Your Tax Profile' },
    description: { es: 'Define si eres empleado, autónomo o empresa', en: 'Define if you are employee, self-employed or corporation' },
    helpText: { es: '👉 Completa tu tipo de trabajo y datos fiscales para personalizar todo el centro', en: '👉 Complete your work type and tax data to personalize the entire center' },
    color: 'from-violet-500 to-purple-600',
    glowColor: 'shadow-violet-500/40',
    iconBg: 'bg-violet-500/15 ring-2 ring-violet-500/30',
    icon: <Sparkles className="h-5 w-5 text-violet-400" />,
  },
  {
    id: 'timeline',
    emoji: '📅',
    tabValue: 'timeline',
    label: { es: 'Calendario Fiscal', en: 'Tax Calendar' },
    description: { es: 'Mapa visual con TODAS tus fechas de impuestos del año', en: 'Visual map with ALL your tax dates for the year' },
    helpText: { es: '👉 Revisa mes a mes cuándo debes presentar declaraciones y pagos', en: '👉 Review month by month when you must file returns and make payments' },
    color: 'from-blue-500 to-cyan-500',
    glowColor: 'shadow-blue-500/40',
    iconBg: 'bg-blue-500/15 ring-2 ring-blue-500/30',
    icon: <Calendar className="h-5 w-5 text-blue-400" />,
  },
  {
    id: 'deadlines',
    emoji: '⏰',
    tabValue: 'deadlines',
    label: { es: 'Fechas Límite', en: 'Key Deadlines' },
    description: { es: 'Alertas de vencimiento con cuenta regresiva', en: 'Expiration alerts with countdown timers' },
    helpText: { es: '👉 Ve exactamente cuántos días faltan para cada obligación tributaria', en: '👉 See exactly how many days until each tax obligation' },
    color: 'from-amber-500 to-orange-500',
    glowColor: 'shadow-amber-500/40',
    iconBg: 'bg-amber-500/15 ring-2 ring-amber-500/30',
    icon: <Clock className="h-5 w-5 text-amber-400" />,
  },
  {
    id: 'estimator',
    emoji: '🧮',
    tabValue: 'estimator',
    label: { es: 'Estimador de Impuestos', en: 'Tax Estimator' },
    description: { es: 'Calcula cuánto debes pagar según tus ingresos', en: 'Calculate how much you owe based on your income' },
    helpText: { es: '👉 Ingresa tus ingresos y gastos para estimar tu carga tributaria', en: '👉 Enter your income and expenses to estimate your tax burden' },
    color: 'from-emerald-500 to-green-500',
    glowColor: 'shadow-emerald-500/40',
    iconBg: 'bg-emerald-500/15 ring-2 ring-emerald-500/30',
    icon: <Calculator className="h-5 w-5 text-emerald-400" />,
  },
  {
    id: 'guide',
    emoji: '📖',
    tabValue: 'guide',
    label: { es: 'Guía Práctica', en: 'Practical Guide' },
    description: { es: 'Explicaciones simples de tus obligaciones fiscales', en: 'Simple explanations of your tax obligations' },
    helpText: { es: '👉 Lee qué formularios necesitas y cómo llenarlos paso a paso', en: '👉 Read which forms you need and how to fill them step by step' },
    color: 'from-rose-500 to-pink-500',
    glowColor: 'shadow-rose-500/40',
    iconBg: 'bg-rose-500/15 ring-2 ring-rose-500/30',
    icon: <BookOpen className="h-5 w-5 text-rose-400" />,
  },
  {
    id: 'resources',
    emoji: '🔗',
    tabValue: 'resources',
    label: { es: 'Links Oficiales', en: 'Official Links' },
    description: { es: 'Acceso directo al CRA, SII y herramientas del gobierno', en: 'Direct access to CRA, SII and government tools' },
    helpText: { es: '👉 Encuentra los portales oficiales donde presentas y pagas tus impuestos', en: '👉 Find the official portals where you file and pay your taxes' },
    color: 'from-indigo-500 to-blue-600',
    glowColor: 'shadow-indigo-500/40',
    iconBg: 'bg-indigo-500/15 ring-2 ring-indigo-500/30',
    icon: <ExternalLink className="h-5 w-5 text-indigo-400" />,
  },
];

interface FiscalCenterFlowProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  profileComplete: boolean;
}

export function FiscalCenterFlow({ activeTab, onTabChange, profileComplete }: FiscalCenterFlowProps) {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [expanded, setExpanded] = useState(true);

  const activeIdx = FLOW_STEPS.findIndex(s => s.tabValue === activeTab);

  // Status per step
  const getStepStatus = (step: FiscalFlowStep, idx: number): 'done' | 'active' | 'pending' => {
    if (step.id === 'profile') return profileComplete ? 'done' : 'pending';
    if (step.tabValue === activeTab) return 'active';
    if (idx < activeIdx) return 'done';
    return 'pending';
  };

  const getStatusLabel = (status: 'done' | 'active' | 'pending') => {
    if (status === 'done') return isEs ? '✅ Revisado' : '✅ Reviewed';
    if (status === 'active') return isEs ? '👀 Viendo ahora' : '👀 Viewing now';
    return isEs ? '➡️ Por explorar' : '➡️ To explore';
  };

  const completedCount = FLOW_STEPS.filter((s, i) => getStepStatus(s, i) === 'done').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-muted/30 shadow-xl shadow-primary/5"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full px-5 py-4 hover:bg-muted/30 transition-all group"
      >
        <motion.span 
          animate={{ rotate: [0, 10, -10, 0] }} 
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-2xl"
        >
          🗺️
        </motion.span>
        <div className="flex-1 text-left">
          <h3 className="text-sm font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {isEs ? '🚀 Flujo del Centro Fiscal' : '🚀 Fiscal Center Flow'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {isEs ? 'Tu ruta paso a paso — haz clic en cada paso para navegar' : 'Your step-by-step path — click each step to navigate'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30 text-[10px] font-bold gap-1">
            <Target className="h-3 w-3" />
            {completedCount}/{FLOW_STEPS.length} {isEs ? 'revisados' : 'reviewed'}
          </Badge>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.div>
        </div>
      </button>

      {/* Flow Diagram */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 pt-2 space-y-4">
              {/* Desktop: Horizontal Flow */}
              <div className="hidden md:flex items-start gap-0 pt-4">
                {FLOW_STEPS.map((step, idx) => {
                  const status = getStepStatus(step, idx);
                  const isActive = status === 'active';
                  const isDone = status === 'done';
                  const isProfileStep = step.id === 'profile';

                  return (
                    <div key={step.id} className="flex items-start flex-1 min-w-0">
                      <motion.button
                        whileHover={{ scale: 1.04, y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          if (!isProfileStep && step.tabValue) {
                            onTabChange(step.tabValue);
                          }
                        }}
                        className={cn(
                          "relative flex flex-col items-center gap-1.5 px-2 py-4 pt-6 rounded-2xl border-2 transition-all duration-300 w-full group",
                          isActive
                            ? `bg-gradient-to-b ${step.color} border-white/30 shadow-2xl ${step.glowColor} text-white ring-2 ring-white/20`
                            : isDone
                              ? "bg-primary/5 border-primary/25 shadow-md hover:shadow-lg"
                              : "bg-card/60 border-border/40 hover:border-primary/30 hover:shadow-lg opacity-70 hover:opacity-100"
                        )}
                      >
                        {/* Pulse ring for active */}
                        {isActive && (
                          <span className="absolute inset-0 rounded-2xl animate-[pulse_2s_ease-in-out_infinite] ring-2 ring-white/30 pointer-events-none" />
                        )}

                        {/* Step number badge */}
                        <div className={cn(
                          "absolute -top-3 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg z-10",
                          isActive 
                            ? "bg-white text-foreground" 
                            : isDone 
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground border border-border"
                        )}>
                          {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                        </div>

                        {/* Done badge */}
                        {isDone && (
                          <Badge className="absolute -top-2.5 -right-1 bg-emerald-500 text-white text-[8px] px-1.5 py-0 shadow-lg shadow-emerald-500/30 z-10">
                            ✅
                          </Badge>
                        )}

                        {/* Icon */}
                        <div className={cn(
                          "p-2 rounded-xl transition-all",
                          isActive ? "bg-white/20 shadow-inner" : step.iconBg
                        )}>
                          <span className="text-xl">{step.emoji}</span>
                        </div>

                        {/* Label */}
                        <span className={cn(
                          "text-[11px] font-bold text-center leading-tight px-1",
                          isActive ? "text-white" : "text-foreground"
                        )}>
                          {step.label[isEs ? 'es' : 'en']}
                        </span>

                        {/* Status label */}
                        <span className={cn(
                          "text-[9px] font-semibold text-center",
                          isActive ? "text-white/80" : isDone ? "text-primary" : "text-muted-foreground"
                        )}>
                          {getStatusLabel(status)}
                        </span>

                        {/* Tooltip with description */}
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover border-2 border-primary/20 rounded-xl px-4 py-3 text-xs shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-normal min-w-[200px] max-w-[240px] z-50 backdrop-blur-sm">
                          <p className="font-black flex items-center gap-1.5">
                            <span>{step.emoji}</span> {step.label[isEs ? 'es' : 'en']}
                          </p>
                          <p className="text-muted-foreground mt-1 leading-snug">{step.description[isEs ? 'es' : 'en']}</p>
                          <p className="text-primary font-bold mt-1.5 text-[10px] leading-snug">{step.helpText[isEs ? 'es' : 'en']}</p>
                        </div>
                      </motion.button>

                      {/* Connector arrow */}
                      {idx < FLOW_STEPS.length - 1 && (
                        <div className="flex items-center px-1 shrink-0 pt-10">
                          <motion.div
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <ArrowRight className={cn(
                              "h-5 w-5 transition-colors",
                              idx < activeIdx 
                                ? "text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]" 
                                : "text-muted-foreground/30"
                            )} />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mobile: Vertical Flow */}
              <div className="md:hidden space-y-1.5">
                {FLOW_STEPS.map((step, idx) => {
                  const status = getStepStatus(step, idx);
                  const isActive = status === 'active';
                  const isDone = status === 'done';
                  const isProfileStep = step.id === 'profile';

                  return (
                    <motion.div key={step.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}>
                      <button
                        onClick={() => {
                          if (!isProfileStep && step.tabValue) onTabChange(step.tabValue);
                        }}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left",
                          isActive
                            ? `bg-gradient-to-r ${step.color} border-white/20 text-white shadow-xl ${step.glowColor}`
                            : isDone
                              ? "bg-primary/5 border-primary/20"
                              : "bg-card/60 border-border/30 opacity-70"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow",
                          isActive ? "bg-white/20 text-white" : isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                        </div>

                        <span className="text-lg shrink-0">{step.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-bold", isActive ? "text-white" : "")}>
                            {step.label[isEs ? 'es' : 'en']}
                          </p>
                          <p className={cn("text-[10px] mt-0.5 leading-snug", isActive ? "text-white/70" : "text-muted-foreground")}>
                            {step.description[isEs ? 'es' : 'en']}
                          </p>
                        </div>

                        <span className={cn("text-[10px] font-bold shrink-0", isActive ? "text-white/80" : isDone ? "text-primary" : "text-muted-foreground")}>
                          {isDone ? '✅' : isActive ? '👀' : '➡️'}
                        </span>
                      </button>

                      {idx < FLOW_STEPS.length - 1 && (
                        <div className="flex justify-start ml-7 py-0.5">
                          <div className={cn("w-0.5 h-2.5 rounded-full", idx < activeIdx ? "bg-primary" : "bg-border")} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-5 pt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> {isEs ? 'Revisado' : 'Reviewed'}</span>
                <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-amber-500 animate-pulse" /> {isEs ? 'Viendo ahora' : 'Viewing now'}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> {isEs ? 'Por explorar' : 'To explore'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
