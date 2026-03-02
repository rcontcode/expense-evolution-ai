import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Scale,
  Wallet,
  GraduationCap,
  Target,
  Receipt,
  MapPin,
  RefreshCw,
  Landmark,
  Briefcase,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ToolTab {
  id: string;
  icon: typeof BarChart3;
  emoji?: string;
  label: { es: string; en: string };
  description: { es: string; en: string };
}

interface ToolCategory {
  id: string;
  label: { es: string; en: string };
  color: string; // gradient for category header dot
  tabs: ToolTab[];
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'visualize',
    label: { es: '📊 Visualizar', en: '📊 Visualize' },
    color: 'from-blue-400 to-indigo-500',
    tabs: [
      {
        id: 'charts',
        icon: BarChart3,
        label: { es: 'Gráficos', en: 'Charts' },
        description: { es: 'Categorías, tendencias y distribución', en: 'Categories, trends & distribution' },
      },
      {
        id: 'analytics',
        icon: Scale,
        label: { es: 'Análisis', en: 'Analytics' },
        description: { es: 'Radar financiero, correlaciones, heatmaps', en: 'Financial radar, correlations, heatmaps' },
      },
    ],
  },
  {
    id: 'plan',
    label: { es: '🎯 Planificar', en: '🎯 Plan' },
    color: 'from-emerald-400 to-teal-500',
    tabs: [
      {
        id: 'budgets',
        icon: Wallet,
        label: { es: 'Presupuesto', en: 'Budget' },
        description: { es: 'Plan mensual, alertas y proyecciones', en: 'Monthly plan, alerts & projections' },
      },
      {
        id: 'goals',
        icon: Target,
        label: { es: 'Metas', en: 'Goals' },
        description: { es: 'Metas de ahorro con seguimiento', en: 'Savings goals with tracking' },
      },
      {
        id: 'tax',
        icon: Receipt,
        label: { es: 'Impuestos', en: 'Taxes' },
        description: { es: 'Optimizador fiscal y deducciones', en: 'Tax optimizer & deductions' },
      },
    ],
  },
  {
    id: 'grow',
    label: { es: '🌱 Crecer', en: '🌱 Grow' },
    color: 'from-violet-400 to-purple-500',
    tabs: [
      {
        id: 'mentorship',
        icon: GraduationCap,
        label: { es: 'Mentoría', en: 'Mentorship' },
        description: { es: 'Cuadrante cashflow, diario, hábitos', en: 'Cashflow quadrant, journal, habits' },
      },
      {
        id: 'education',
        icon: GraduationCap,
        label: { es: 'Educación', en: 'Education' },
        description: { es: 'Lecturas, ritmo y recursos', en: 'Readings, pace & resources' },
      },
      {
        id: 'fire',
        icon: BarChart3,
        emoji: '🔥',
        label: { es: 'FIRE', en: 'FIRE' },
        description: { es: 'Libertad financiera e inversión', en: 'Financial freedom & investing' },
      },
    ],
  },
  {
    id: 'manage',
    label: { es: '⚙️ Gestionar', en: '⚙️ Manage' },
    color: 'from-amber-400 to-orange-500',
    tabs: [
      {
        id: 'mileage',
        icon: MapPin,
        label: { es: 'Kilometraje', en: 'Mileage' },
        description: { es: 'Registro de viajes deducibles', en: 'Deductible trip logging' },
      },
      {
        id: 'subscriptions',
        icon: RefreshCw,
        label: { es: 'Suscripciones', en: 'Subscriptions' },
        description: { es: 'Pagos recurrentes y optimización', en: 'Recurring payments & optimization' },
      },
      {
        id: 'debt',
        icon: Landmark,
        label: { es: 'Deudas', en: 'Debt' },
        description: { es: 'Estrategias de pago y seguimiento', en: 'Payment strategies & tracking' },
      },
      {
        id: 'portfolio',
        icon: Briefcase,
        label: { es: 'Portfolio', en: 'Portfolio' },
        description: { es: 'Inversiones y tips personalizados', en: 'Investments & personalized tips' },
      },
    ],
  },
];

interface AdvancedToolsNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  shouldHighlight?: (key: string) => boolean;
}

export const AdvancedToolsNav = memo(({ activeTab, onTabChange, shouldHighlight }: AdvancedToolsNavProps) => {
  const { language } = useLanguage();
  const lang = language as 'es' | 'en';

  return (
    <div className="space-y-3">
      {TOOL_CATEGORIES.map((category) => (
        <div key={category.id} className="space-y-1.5">
          {/* Category Header */}
          <div className="flex items-center gap-2 px-1">
            <div className={cn('w-2 h-2 rounded-full bg-gradient-to-br', category.color)} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {category.label[lang]}
            </span>
          </div>

          {/* Tabs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
            {category.tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const isHighlighted = shouldHighlight?.(tab.id === 'budgets' ? 'budget' : tab.id);

              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onTabChange(tab.id)}
                      className={cn(
                        'relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-200 border group',
                        isActive
                          ? 'bg-primary/10 border-primary/40 shadow-sm shadow-primary/10'
                          : 'bg-card/50 border-border/40 hover:bg-muted/60 hover:border-border/60',
                        isHighlighted && !isActive && 'ring-2 ring-primary/30 animate-pulse'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-tool-tab"
                          className="absolute inset-0 rounded-xl bg-primary/8 border border-primary/30"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}

                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors relative z-10',
                        isActive
                          ? `bg-gradient-to-br ${category.color} shadow-sm`
                          : 'bg-muted/80 group-hover:bg-muted'
                      )}>
                        {tab.emoji ? (
                          <span className="text-xs">{tab.emoji}</span>
                        ) : (
                          <Icon className={cn(
                            'h-3.5 w-3.5 transition-colors',
                            isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                          )} />
                        )}
                      </div>

                      <div className="min-w-0 relative z-10">
                        <span className={cn(
                          'text-xs font-semibold block truncate transition-colors',
                          isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                        )}>
                          {tab.label[lang]}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 block truncate leading-tight">
                          {tab.description[lang]}
                        </span>
                      </div>

                      {isActive && (
                        <div className={cn('absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gradient-to-br', category.color)} />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px]">
                    <p className="font-semibold">{tab.label[lang]}</p>
                    <p className="text-xs text-muted-foreground">{tab.description[lang]}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

AdvancedToolsNav.displayName = 'AdvancedToolsNav';
