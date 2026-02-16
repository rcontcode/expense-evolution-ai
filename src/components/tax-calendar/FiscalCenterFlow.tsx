import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, Calculator, BookOpen, ExternalLink, 
  ChevronRight, ChevronDown, Sparkles, CheckCircle2, 
  Zap, Target, ArrowRight
} from "lucide-react";

interface FiscalFlowStep {
  id: string;
  emoji: string;
  tabValue: string;
  label: { es: string; en: string };
  description: { es: string; en: string };
  color: string;
  glowColor: string;
  iconBg: string;
  icon: React.ReactNode;
  progressLabel: { es: string; en: string };
}

const FLOW_STEPS: FiscalFlowStep[] = [
  {
    id: 'profile',
    emoji: '🧑‍💼',
    tabValue: '',
    label: { es: 'Tu Perfil Fiscal', en: 'Your Tax Profile' },
    description: { es: 'Configura tu tipo de negocio y situación fiscal para personalizar todo', en: 'Set up your business type and tax situation to personalize everything' },
    color: 'from-violet-500 to-purple-600',
    glowColor: 'shadow-violet-500/40',
    iconBg: 'bg-violet-500/15 ring-2 ring-violet-500/30',
    icon: <Sparkles className="h-5 w-5 text-violet-400" />,
    progressLabel: { es: 'Perfil completo', en: 'Profile complete' },
  },
  {
    id: 'timeline',
    emoji: '📅',
    tabValue: 'timeline',
    label: { es: 'Timeline Visual', en: 'Visual Timeline' },
    description: { es: 'Ve todas tus fechas fiscales en un mapa temporal interactivo', en: 'See all your tax dates on an interactive timeline' },
    color: 'from-blue-500 to-cyan-500',
    glowColor: 'shadow-blue-500/40',
    iconBg: 'bg-blue-500/15 ring-2 ring-blue-500/30',
    icon: <Calendar className="h-5 w-5 text-blue-400" />,
    progressLabel: { es: 'Fechas revisadas', en: 'Dates reviewed' },
  },
  {
    id: 'deadlines',
    emoji: '⏰',
    tabValue: 'deadlines',
    label: { es: 'Fechas Límite', en: 'Key Deadlines' },
    description: { es: 'Alertas y recordatorios para nunca perder una fecha importante', en: 'Alerts and reminders so you never miss an important date' },
    color: 'from-amber-500 to-orange-500',
    glowColor: 'shadow-amber-500/40',
    iconBg: 'bg-amber-500/15 ring-2 ring-amber-500/30',
    icon: <Clock className="h-5 w-5 text-amber-400" />,
    progressLabel: { es: 'Fechas al día', en: 'Dates up to date' },
  },
  {
    id: 'estimator',
    emoji: '🧮',
    tabValue: 'estimator',
    label: { es: 'Estimador Fiscal', en: 'Tax Estimator' },
    description: { es: 'Calcula cuánto debes y planifica tus pagos trimestrales', en: 'Calculate how much you owe and plan quarterly payments' },
    color: 'from-emerald-500 to-green-500',
    glowColor: 'shadow-emerald-500/40',
    iconBg: 'bg-emerald-500/15 ring-2 ring-emerald-500/30',
    icon: <Calculator className="h-5 w-5 text-emerald-400" />,
    progressLabel: { es: 'Estimación lista', en: 'Estimate ready' },
  },
  {
    id: 'guide',
    emoji: '📖',
    tabValue: 'guide',
    label: { es: 'Guía Práctica', en: 'Practical Guide' },
    description: { es: 'Aprende paso a paso sobre tus obligaciones tributarias', en: 'Learn step by step about your tax obligations' },
    color: 'from-rose-500 to-pink-500',
    glowColor: 'shadow-rose-500/40',
    iconBg: 'bg-rose-500/15 ring-2 ring-rose-500/30',
    icon: <BookOpen className="h-5 w-5 text-rose-400" />,
    progressLabel: { es: 'Guía leída', en: 'Guide read' },
  },
  {
    id: 'resources',
    emoji: '🔗',
    tabValue: 'resources',
    label: { es: 'Recursos Oficiales', en: 'Official Resources' },
    description: { es: 'Enlaces directos al CRA/SII y herramientas externas verificadas', en: 'Direct links to CRA/SII and verified external tools' },
    color: 'from-indigo-500 to-blue-600',
    glowColor: 'shadow-indigo-500/40',
    iconBg: 'bg-indigo-500/15 ring-2 ring-indigo-500/30',
    icon: <ExternalLink className="h-5 w-5 text-indigo-400" />,
    progressLabel: { es: 'Recursos visitados', en: 'Resources visited' },
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

  // Simulated progress per step
  const getStepProgress = (step: FiscalFlowStep) => {
    if (step.id === 'profile') return profileComplete ? 100 : 0;
    if (step.tabValue === activeTab) return 60;
    const stepIdx = FLOW_STEPS.findIndex(s => s.id === step.id);
    if (stepIdx < activeIdx) return 85;
    return 15;
  };

  const overallProgress = Math.round(
    FLOW_STEPS.reduce((sum, s) => sum + getStepProgress(s), 0) / FLOW_STEPS.length
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-muted/30 shadow-xl shadow-primary/5 overflow-hidden"
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
            {isEs ? 'Tu ruta paso a paso para dominar tus impuestos' : 'Your step-by-step path to mastering your taxes'}
          </p>
        </div>

        {/* Overall progress */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 min-w-[140px]">
            <Progress 
              value={overallProgress} 
              className="h-2.5 bg-muted/50"
              indicatorClassName="bg-gradient-to-r from-primary via-accent to-primary rounded-full"
            />
            <span className="text-xs font-bold text-primary min-w-[36px]">{overallProgress}%</span>
          </div>
          <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30 text-[10px] font-bold gap-1">
            <Target className="h-3 w-3" />
            {FLOW_STEPS.length} {isEs ? 'pasos' : 'steps'}
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
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Horizontal Flow - Desktop */}
              <div className="hidden md:flex items-stretch gap-0">
                {FLOW_STEPS.map((step, idx) => {
                  const isActive = step.tabValue === activeTab;
                  const isProfileStep = step.id === 'profile';
                  const isDone = isProfileStep ? profileComplete : false;
                  const progress = getStepProgress(step);
                  const isPast = idx < activeIdx || isDone;

                  return (
                    <div key={step.id} className="flex items-center flex-1 min-w-0">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          if (!isProfileStep && step.tabValue) {
                            onTabChange(step.tabValue);
                          }
                        }}
                        className={cn(
                          "relative flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border-2 transition-all duration-300 w-full group",
                          isActive
                            ? `bg-gradient-to-b ${step.color} border-white/30 shadow-2xl ${step.glowColor} text-white scale-105 ring-2 ring-white/20`
                            : isPast
                              ? "bg-primary/5 border-primary/20 shadow-md hover:shadow-lg"
                              : "bg-card/60 border-border/40 hover:border-primary/30 hover:shadow-lg opacity-70 hover:opacity-100"
                        )}
                      >
                        {/* Pulse ring for active */}
                        {isActive && (
                          <span className="absolute inset-0 rounded-2xl animate-[pulse_2s_ease-in-out_infinite] ring-2 ring-white/30 pointer-events-none" />
                        )}

                        {/* Step number */}
                        <div className={cn(
                          "absolute -top-2.5 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg",
                          isActive 
                            ? "bg-white text-foreground" 
                            : isPast 
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground border border-border"
                        )}>
                          {isPast && !isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                        </div>

                        {/* Icon */}
                        <div className={cn(
                          "p-2.5 rounded-xl transition-all",
                          isActive ? "bg-white/20 shadow-inner" : step.iconBg
                        )}>
                          <span className="text-xl">{step.emoji}</span>
                        </div>

                        {/* Label */}
                        <span className={cn(
                          "text-[11px] font-bold text-center leading-tight",
                          isActive ? "text-white" : "text-foreground"
                        )}>
                          {step.label[isEs ? 'es' : 'en']}
                        </span>

                        {/* Progress bar */}
                        <div className="w-full px-1">
                          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                              className={cn(
                                "h-full rounded-full",
                                isActive 
                                  ? "bg-white/70" 
                                  : isPast 
                                    ? "bg-primary" 
                                    : "bg-muted-foreground/30"
                              )}
                            />
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold mt-0.5 block text-center",
                            isActive ? "text-white/80" : "text-muted-foreground"
                          )}>
                            {progress}%
                          </span>
                        </div>

                        {/* Done badge */}
                        {isDone && (
                          <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] px-1.5 py-0 shadow-lg shadow-emerald-500/30 animate-bounce">
                            ✅
                          </Badge>
                        )}

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-popover border-2 border-primary/20 rounded-xl px-4 py-3 text-xs shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 backdrop-blur-sm">
                          <p className="font-black flex items-center gap-1.5">
                            <span>{step.emoji}</span> {step.label[isEs ? 'es' : 'en']}
                          </p>
                          <p className="text-muted-foreground mt-0.5">{step.description[isEs ? 'es' : 'en']}</p>
                          <p className="text-primary font-bold mt-1 flex items-center gap-1">
                            <Zap className="h-3 w-3" /> {step.progressLabel[isEs ? 'es' : 'en']}: {progress}%
                          </p>
                        </div>
                      </motion.button>

                      {/* Connector arrow */}
                      {idx < FLOW_STEPS.length - 1 && (
                        <div className="flex items-center px-1 shrink-0">
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

              {/* Mobile Flow - Vertical */}
              <div className="md:hidden space-y-2">
                {FLOW_STEPS.map((step, idx) => {
                  const isActive = step.tabValue === activeTab;
                  const isProfileStep = step.id === 'profile';
                  const isDone = isProfileStep ? profileComplete : false;
                  const progress = getStepProgress(step);
                  const isPast = idx < activeIdx || isDone;

                  return (
                    <motion.div key={step.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}>
                      <button
                        onClick={() => {
                          if (!isProfileStep && step.tabValue) onTabChange(step.tabValue);
                        }}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all",
                          isActive
                            ? `bg-gradient-to-r ${step.color} border-white/20 text-white shadow-xl ${step.glowColor}`
                            : isPast
                              ? "bg-primary/5 border-primary/20"
                              : "bg-card/60 border-border/30 opacity-70"
                        )}
                      >
                        {/* Step # */}
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow",
                          isActive ? "bg-white/20 text-white" : isPast ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {isPast && !isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                        </div>

                        <span className="text-lg">{step.emoji}</span>
                        <div className="flex-1 text-left min-w-0">
                          <p className={cn("text-xs font-bold truncate", isActive ? "text-white" : "")}>
                            {step.label[isEs ? 'es' : 'en']}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className={cn("h-full rounded-full", isActive ? "bg-white/60" : "bg-primary")}
                              />
                            </div>
                            <span className={cn("text-[10px] font-bold", isActive ? "text-white/80" : "text-muted-foreground")}>
                              {progress}%
                            </span>
                          </div>
                        </div>

                        {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                        {isActive && <Zap className="h-4 w-4 text-yellow-300 animate-pulse shrink-0" />}
                      </button>

                      {/* Vertical connector */}
                      {idx < FLOW_STEPS.length - 1 && (
                        <div className="flex justify-start ml-7 py-0.5">
                          <div className={cn(
                            "w-0.5 h-3 rounded-full",
                            idx < activeIdx ? "bg-primary" : "bg-border"
                          )} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> {isEs ? 'Completado' : 'Completed'}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse" /> {isEs ? 'Actual' : 'Current'}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> {isEs ? 'Pendiente' : 'Pending'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
