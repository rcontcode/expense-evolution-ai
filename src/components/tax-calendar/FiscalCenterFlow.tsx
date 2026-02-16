import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, Calculator, BookOpen, ExternalLink, 
  ChevronRight, Sparkles, CheckCircle2
} from "lucide-react";

interface FiscalFlowStep {
  id: string;
  emoji: string;
  tabValue: string;
  label: { es: string; en: string };
  description: { es: string; en: string };
  color: string;
  iconBg: string;
  icon: React.ReactNode;
}

const FLOW_STEPS: FiscalFlowStep[] = [
  {
    id: 'profile',
    emoji: '🧑‍💼',
    tabValue: '',
    label: { es: 'Tu Perfil', en: 'Your Profile' },
    description: { es: 'Configura tu tipo de negocio y situación fiscal', en: 'Set up your business type and tax situation' },
    color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
    iconBg: 'bg-violet-500/10',
    icon: <Sparkles className="h-4 w-4 text-violet-500" />,
  },
  {
    id: 'timeline',
    emoji: '📅',
    tabValue: 'timeline',
    label: { es: 'Timeline', en: 'Timeline' },
    description: { es: 'Visualiza tus fechas fiscales en el tiempo', en: 'See your tax dates on a timeline' },
    color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    iconBg: 'bg-blue-500/10',
    icon: <Calendar className="h-4 w-4 text-blue-500" />,
  },
  {
    id: 'deadlines',
    emoji: '⏰',
    tabValue: 'deadlines',
    label: { es: 'Fechas', en: 'Deadlines' },
    description: { es: 'Fechas límite detalladas con alertas', en: 'Detailed deadlines with alerts' },
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    iconBg: 'bg-amber-500/10',
    icon: <Clock className="h-4 w-4 text-amber-500" />,
  },
  {
    id: 'estimator',
    emoji: '🧮',
    tabValue: 'estimator',
    label: { es: 'Estimador', en: 'Estimator' },
    description: { es: 'Estima tus impuestos y planifica pagos', en: 'Estimate taxes and plan payments' },
    color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    iconBg: 'bg-green-500/10',
    icon: <Calculator className="h-4 w-4 text-green-500" />,
  },
  {
    id: 'guide',
    emoji: '📖',
    tabValue: 'guide',
    label: { es: 'Guía', en: 'Guide' },
    description: { es: 'Aprende sobre tus obligaciones fiscales', en: 'Learn about your tax obligations' },
    color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
    iconBg: 'bg-rose-500/10',
    icon: <BookOpen className="h-4 w-4 text-rose-500" />,
  },
  {
    id: 'resources',
    emoji: '🔗',
    tabValue: 'resources',
    label: { es: 'Recursos', en: 'Resources' },
    description: { es: 'Enlaces oficiales y herramientas externas', en: 'Official links and external tools' },
    color: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30',
    iconBg: 'bg-indigo-500/10',
    icon: <ExternalLink className="h-4 w-4 text-indigo-500" />,
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
  const [expanded, setExpanded] = useState(false);

  const activeIdx = FLOW_STEPS.findIndex(s => s.tabValue === activeTab);

  return (
    <div className="space-y-2">
      {/* Title bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <span className="animate-[pulse_3s_ease-in-out_infinite]">🗺️</span>
        {isEs ? 'Flujo del Centro Fiscal' : 'Fiscal Center Flow'}
        <ChevronRight className={cn("h-3 w-3 transition-transform", expanded && "rotate-90")} />
        <span className="flex-1" />
        <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20">
          {FLOW_STEPS.length} {isEs ? 'secciones' : 'sections'}
        </Badge>
      </button>

      {/* Compact horizontal flow - always visible */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {FLOW_STEPS.map((step, idx) => {
          const isActive = step.tabValue === activeTab;
          const isProfileStep = step.id === 'profile';
          const isDone = isProfileStep ? profileComplete : false;
          
          return (
            <button
              key={step.id}
              onClick={() => {
                if (!isProfileStep && step.tabValue) {
                  onTabChange(step.tabValue);
                }
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-300 min-w-fit relative group whitespace-nowrap",
                isActive
                  ? `bg-gradient-to-r ${step.color} shadow-lg scale-105 ring-1 ring-primary/20`
                  : isProfileStep && isDone
                    ? "bg-primary/5 border-primary/20 opacity-75"
                    : "bg-card/50 border-border/40 opacity-60 hover:opacity-100 hover:scale-102 cursor-pointer"
              )}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-xl animate-pulse ring-1 ring-primary/20 pointer-events-none" />
              )}

              <span className="text-base">{step.emoji}</span>
              <span className="text-[11px] font-medium">{step.label[isEs ? 'es' : 'en']}</span>

              {isDone && <CheckCircle2 className="h-3 w-3 text-primary" />}

              {/* Connector arrow */}
              {idx < FLOW_STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground/40 ml-0.5" />
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <p className="font-semibold">{step.label[isEs ? 'es' : 'en']}</p>
                <p className="text-muted-foreground">{step.description[isEs ? 'es' : 'en']}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded descriptions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
              {FLOW_STEPS.map((step, idx) => (
                <motion.button
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => step.tabValue && onTabChange(step.tabValue)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all hover:shadow-md hover:-translate-y-0.5",
                    step.tabValue === activeTab
                      ? `bg-gradient-to-br ${step.color} shadow-md`
                      : "bg-card/30 border-border/30 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("p-1 rounded-lg", step.iconBg)}>{step.icon}</span>
                    <span className="text-xs font-bold">{step.emoji} {step.label[isEs ? 'es' : 'en']}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {step.description[isEs ? 'es' : 'en']}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
