import * as React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Target, 
  HelpCircle, 
  Lightbulb,
  Receipt,
  Users,
  FileText,
  TrendingUp,
  Camera,
  DollarSign,
  Car,
  Building2,
  PiggyBank,
  Wallet,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  Zap,
  Calculator,
  Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/data/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { PhoenixLogo } from "@/components/ui/phoenix-logo";

interface QuickAction {
  id: string;
  icon: React.ElementType;
  title: { es: string; en: string };
  description: { es: string; en: string };
  path: string;
  color: string;
  bgColor: string;
  borderColor: string;
  category: 'capture' | 'organize' | 'analyze' | 'plan';
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'capture-receipt',
    icon: Camera,
    title: { es: 'Capturar Recibo', en: 'Capture Receipt' },
    description: { es: 'Foto → IA → Gasto automático', en: 'Photo → AI → Auto expense' },
    path: '/capture',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    borderColor: 'border-blue-300 dark:border-blue-700 hover:border-blue-500',
    category: 'capture'
  },
  {
    id: 'add-expense',
    icon: Receipt,
    title: { es: 'Agregar Gasto', en: 'Add Expense' },
    description: { es: 'Registro manual detallado', en: 'Detailed manual entry' },
    path: '/expenses',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/40',
    borderColor: 'border-red-300 dark:border-red-700 hover:border-red-500',
    category: 'capture'
  },
  {
    id: 'add-income',
    icon: DollarSign,
    title: { es: 'Registrar Ingreso', en: 'Record Income' },
    description: { es: 'Pagos, salarios, inversiones', en: 'Payments, salary, investments' },
    path: '/income',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
    borderColor: 'border-green-300 dark:border-green-700 hover:border-green-500',
    category: 'capture'
  },
  {
    id: 'manage-clients',
    icon: Users,
    title: { es: 'Gestionar Clientes', en: 'Manage Clients' },
    description: { es: 'Perfiles y facturación', en: 'Profiles & billing' },
    path: '/clients',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40',
    borderColor: 'border-purple-300 dark:border-purple-700 hover:border-purple-500',
    category: 'organize'
  },
  {
    id: 'contracts',
    icon: FileText,
    title: { es: 'Contratos', en: 'Contracts' },
    description: { es: 'Términos de reembolso', en: 'Reimbursement terms' },
    path: '/contracts',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    borderColor: 'border-amber-300 dark:border-amber-700 hover:border-amber-500',
    category: 'organize'
  },
  {
    id: 'mileage',
    icon: Car,
    title: { es: 'Kilometraje', en: 'Mileage' },
    description: { es: 'Viajes de negocios CRA', en: 'CRA business trips' },
    path: '/mileage',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/40',
    borderColor: 'border-cyan-300 dark:border-cyan-700 hover:border-cyan-500',
    category: 'capture'
  },
  {
    id: 'banking',
    icon: Building2,
    title: { es: 'Análisis Bancario', en: 'Bank Analysis' },
    description: { es: 'Importar y detectar patrones', en: 'Import & detect patterns' },
    path: '/banking',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
    borderColor: 'border-indigo-300 dark:border-indigo-700 hover:border-indigo-500',
    category: 'analyze'
  },
  {
    id: 'net-worth',
    icon: Wallet,
    title: { es: 'Patrimonio Neto', en: 'Net Worth' },
    description: { es: 'Activos vs pasivos', en: 'Assets vs liabilities' },
    path: '/net-worth',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    borderColor: 'border-emerald-300 dark:border-emerald-700 hover:border-emerald-500',
    category: 'plan'
  },
  {
    id: 'reconciliation',
    icon: TrendingUp,
    title: { es: 'Conciliación', en: 'Reconciliation' },
    description: { es: 'Emparejar banco ↔ gastos', en: 'Match bank ↔ expenses' },
    path: '/reconciliation',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/40',
    borderColor: 'border-pink-300 dark:border-pink-700 hover:border-pink-500',
    category: 'analyze'
  }
];

const CATEGORY_CONFIG = {
  capture: { 
    label: { es: '📥 Capturar', en: '📥 Capture' },
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    gradient: 'from-blue-500/20 to-blue-500/5'
  },
  organize: { 
    label: { es: '📁 Organizar', en: '📁 Organize' },
    color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    gradient: 'from-purple-500/20 to-purple-500/5'
  },
  analyze: { 
    label: { es: '📊 Analizar', en: '📊 Analyze' },
    color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    gradient: 'from-indigo-500/20 to-indigo-500/5'
  },
  plan: { 
    label: { es: '🎯 Planificar', en: '🎯 Plan' },
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    gradient: 'from-emerald-500/20 to-emerald-500/5'
  }
};

interface InteractiveQuestion {
  id: string;
  icon: React.ElementType;
  question: { es: string; en: string };
  color: string;
  bgColor: string;
  borderColor: string;
  actions: { 
    label: { es: string; en: string }; 
    path: string; 
    highlight?: boolean;
    icon: React.ElementType;
    color: string;
  }[];
}

const INTERACTIVE_QUESTIONS: InteractiveQuestion[] = [
  {
    id: 'goal',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-950/20',
    borderColor: 'border-blue-300 dark:border-blue-700',
    question: { 
      es: '🎯 ¿Cuál es tu objetivo principal hoy?', 
      en: '🎯 What is your main goal today?' 
    },
    actions: [
      { label: { es: 'Organizar mis gastos', en: 'Organize my expenses' }, path: '/expenses', highlight: true, icon: Receipt, color: 'text-blue-600' },
      { label: { es: 'Preparar impuestos', en: 'Prepare taxes' }, path: '/dashboard?tab=tax', icon: Calculator, color: 'text-emerald-600' },
      { label: { es: 'Facturar a clientes', en: 'Bill clients' }, path: '/clients', icon: Users, color: 'text-purple-600' },
      { label: { es: 'Ver mi patrimonio', en: 'View my net worth' }, path: '/net-worth', icon: Wallet, color: 'text-amber-600' }
    ]
  },
  {
    id: 'concern',
    icon: HelpCircle,
    color: 'text-amber-600',
    bgColor: 'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-950/20',
    borderColor: 'border-amber-300 dark:border-amber-700',
    question: { 
      es: '🤔 ¿Qué te preocupa de tus finanzas?', 
      en: '🤔 What concerns you about your finances?' 
    },
    actions: [
      { label: { es: 'No sé qué puedo deducir', en: "I don't know what I can deduct" }, path: '/dashboard?tab=tax', icon: Shield, color: 'text-blue-600' },
      { label: { es: 'Tengo recibos sin procesar', en: 'I have unprocessed receipts' }, path: '/chaos', highlight: true, icon: Camera, color: 'text-red-600' },
      { label: { es: 'Entender mis contratos', en: 'Understand my contracts' }, path: '/contracts', icon: FileText, color: 'text-purple-600' },
      { label: { es: 'Quiero ahorrar más', en: 'I want to save more' }, path: '/net-worth', icon: PiggyBank, color: 'text-emerald-600' }
    ]
  },
  {
    id: 'plan',
    icon: Lightbulb,
    color: 'text-emerald-600',
    bgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-950/20',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
    question: { 
      es: '💡 ¿Tienes algún plan financiero en mente?', 
      en: '💡 Do you have any financial plan in mind?' 
    },
    actions: [
      { label: { es: 'Planificar retiro (FIRE)', en: 'Plan retirement (FIRE)' }, path: '/dashboard?tab=fire', icon: TrendingUp, color: 'text-orange-600' },
      { label: { es: 'Reducir deudas', en: 'Reduce debt' }, path: '/net-worth', icon: TrendingUp, color: 'text-red-600' },
      { label: { es: 'Maximizar inversiones', en: 'Maximize investments' }, path: '/dashboard?tab=portfolio', icon: Zap, color: 'text-amber-600' },
      { label: { es: 'Optimizar RRSP/TFSA', en: 'Optimize RRSP/TFSA' }, path: '/dashboard?tab=tax', icon: PiggyBank, color: 'text-emerald-600' }
    ]
  }
];

export function InteractiveWelcome({ className }: { className?: string }) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const [showAllActions, setShowAllActions] = React.useState(false);
  const [activeQuestion, setActiveQuestion] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [dismissed, setDismissed] = React.useState(() => {
    return localStorage.getItem('interactive-welcome-dismissed') === 'true';
  });

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('interactive-welcome-dismissed', 'true');
  };

  if (dismissed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setDismissed(false);
          localStorage.removeItem('interactive-welcome-dismissed');
        }}
        className="mb-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50"
      >
        <Sparkles className="h-4 w-4 mr-2 text-primary" />
        {language === 'es' ? 'Mostrar Guía Interactiva' : 'Show Interactive Guide'}
      </Button>
    );
  }

  const filteredActions = activeCategory 
    ? QUICK_ACTIONS.filter(a => a.category === activeCategory)
    : QUICK_ACTIONS;
  const displayedActions = showAllActions ? filteredActions : filteredActions.slice(0, 6);

  return (
    <Card className={cn(
      "overflow-hidden border-2 border-primary/20",
      "bg-gradient-to-br from-primary/5 via-background to-primary/5",
      className
    )}>
      {/* Colorful header with Phoenix Logo */}
      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 p-6 border-b border-primary/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Phoenix Logo as the guide/mentor */}
            <div className="relative">
              <PhoenixLogo variant="mini" state="default" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                <Zap className="h-3 w-3 text-success-foreground" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {language === 'es' 
                  ? `¡Hola${firstName ? `, ${firstName}` : ''}! 👋` 
                  : `Hello${firstName ? `, ${firstName}` : ''}! 👋`
                }
              </h2>
              <p className="text-muted-foreground mt-1">
                {language === 'es'
                  ? '¿En qué puedo ayudarte hoy? Soy tu guía financiero.'
                  : "How can I help you today? I'm your financial guide."
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Interactive Questions - Colorful cards */}
        <div className="grid gap-3 md:grid-cols-3">
          {INTERACTIVE_QUESTIONS.map((q) => {
            const Icon = q.icon;
            const isActive = activeQuestion === q.id;
            
            return (
              <div key={q.id} className="space-y-2">
                <button
                  onClick={() => setActiveQuestion(isActive ? null : q.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all text-left group",
                    isActive 
                      ? `${q.bgColor} ${q.borderColor} shadow-md` 
                      : "border-border/50 hover:border-primary/30 hover:bg-accent/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      isActive ? q.bgColor : "bg-muted",
                      "group-hover:scale-110"
                    )}>
                      <Icon className={cn("h-5 w-5", q.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm block truncate">
                        {q.question[language]}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    {isActive ? (
                      <ChevronUp className={cn("h-4 w-4", q.color)} />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                
                {isActive && (
                  <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {q.actions.map((action, idx) => {
                      const ActionIcon = action.icon;
                      return (
                        <Button
                          key={idx}
                          variant={action.highlight ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "justify-start h-auto py-2.5 text-left",
                            !action.highlight && "hover:bg-accent"
                          )}
                          onClick={() => navigate(action.path)}
                        >
                          <ActionIcon className={cn("h-4 w-4 mr-2 flex-shrink-0", !action.highlight && action.color)} />
                          <span className="text-xs">{action.label[language]}</span>
                          <ArrowRight className="h-3 w-3 ml-auto opacity-50" />
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider with gradient */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-sm text-muted-foreground flex items-center gap-2">
              <Play className="h-3 w-3" />
              {language === 'es' ? 'O elige una acción rápida' : 'Or choose a quick action'}
            </span>
          </div>
        </div>

        {/* Category filters - Colorful pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge 
            variant="outline" 
            className={cn(
              "cursor-pointer transition-all hover:scale-105",
              !activeCategory 
                ? "bg-primary/10 text-primary border-primary/30" 
                : "hover:bg-accent"
            )}
            onClick={() => setActiveCategory(null)}
          >
            {language === 'es' ? '✨ Todas' : '✨ All'}
          </Badge>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <Badge 
              key={key} 
              variant="outline" 
              className={cn(
                "cursor-pointer transition-all hover:scale-105",
                activeCategory === key ? config.color : "hover:bg-accent"
              )}
              onClick={() => setActiveCategory(activeCategory === key ? null : key)}
            >
              {config.label[language]}
            </Badge>
          ))}
        </div>

        {/* Quick Actions Grid - Colorful cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {displayedActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => navigate(action.path)}
                className={cn(
                  "group p-4 rounded-xl border-2 transition-all text-left",
                  "hover:shadow-lg hover:scale-[1.02]",
                  action.borderColor,
                  "bg-gradient-to-br from-background to-muted/30"
                )}
              >
                <div className="flex flex-col gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                    "group-hover:scale-110 group-hover:shadow-md",
                    action.bgColor
                  )}>
                    <Icon className={cn("h-6 w-6", action.color)} />
                  </div>
                  <div>
                    <h4 className={cn(
                      "font-semibold text-sm transition-colors",
                      "group-hover:text-primary"
                    )}>
                      {action.title[language]}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description[language]}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredActions.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowAllActions(!showAllActions)}
          >
            {showAllActions 
              ? (language === 'es' ? 'Ver menos' : 'Show less')
              : (language === 'es' ? `Ver todas (${filteredActions.length})` : `See all (${filteredActions.length})`)
            }
            {showAllActions ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
        )}

        {/* Motivational tip with gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 p-4">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-2xl" />
          <div className="relative flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Lightbulb className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {language === 'es'
                  ? `💪 ${firstName ? `${firstName}, c` : 'C'}ada acción te acerca a tener tus finanzas organizadas.`
                  : `💪 ${firstName ? `${firstName}, e` : 'E'}very action brings you closer to organized finances.`
                }
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                {language === 'es'
                  ? '¡Comienza con lo que más te preocupa!'
                  : 'Start with what concerns you most!'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
