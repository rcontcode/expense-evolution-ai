import * as React from "react";
import { useNavigate } from "react-router-dom";
import { 
  MessageCircle, 
  Target, 
  HelpCircle, 
  Lightbulb,
  Receipt,
  Users,
  FileText,
  TrendingUp,
  Camera,
  Upload,
  DollarSign,
  Car,
  Building2,
  PiggyBank,
  Wallet,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/data/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  icon: React.ElementType;
  title: { es: string; en: string };
  description: { es: string; en: string };
  path: string;
  color: string;
  category: 'capture' | 'organize' | 'analyze' | 'plan';
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'capture-receipt',
    icon: Camera,
    title: { es: 'Capturar Recibo', en: 'Capture Receipt' },
    description: { es: 'Toma una foto de tu recibo y lo procesamos automáticamente', en: 'Take a photo of your receipt and we process it automatically' },
    path: '/capture',
    color: 'bg-blue-500',
    category: 'capture'
  },
  {
    id: 'add-expense',
    icon: Receipt,
    title: { es: 'Agregar Gasto', en: 'Add Expense' },
    description: { es: 'Registra un gasto manualmente con todos los detalles', en: 'Record an expense manually with all details' },
    path: '/expenses',
    color: 'bg-red-500',
    category: 'capture'
  },
  {
    id: 'add-income',
    icon: DollarSign,
    title: { es: 'Registrar Ingreso', en: 'Record Income' },
    description: { es: 'Añade pagos de clientes, salarios o inversiones', en: 'Add client payments, salary or investments' },
    path: '/income',
    color: 'bg-green-500',
    category: 'capture'
  },
  {
    id: 'manage-clients',
    icon: Users,
    title: { es: 'Gestionar Clientes', en: 'Manage Clients' },
    description: { es: 'Organiza tus clientes y sus datos de facturación', en: 'Organize your clients and their billing data' },
    path: '/clients',
    color: 'bg-purple-500',
    category: 'organize'
  },
  {
    id: 'contracts',
    icon: FileText,
    title: { es: 'Contratos', en: 'Contracts' },
    description: { es: 'Sube contratos para extraer términos de reembolso', en: 'Upload contracts to extract reimbursement terms' },
    path: '/contracts',
    color: 'bg-amber-500',
    category: 'organize'
  },
  {
    id: 'mileage',
    icon: Car,
    title: { es: 'Kilometraje', en: 'Mileage' },
    description: { es: 'Registra viajes de negocios para deducciones CRA', en: 'Log business trips for CRA deductions' },
    path: '/mileage',
    color: 'bg-cyan-500',
    category: 'capture'
  },
  {
    id: 'banking',
    icon: Building2,
    title: { es: 'Análisis Bancario', en: 'Bank Analysis' },
    description: { es: 'Importa estados de cuenta y detecta patrones', en: 'Import statements and detect patterns' },
    path: '/banking',
    color: 'bg-indigo-500',
    category: 'analyze'
  },
  {
    id: 'net-worth',
    icon: Wallet,
    title: { es: 'Patrimonio Neto', en: 'Net Worth' },
    description: { es: 'Rastrea activos, pasivos y tu riqueza total', en: 'Track assets, liabilities and total wealth' },
    path: '/net-worth',
    color: 'bg-emerald-500',
    category: 'plan'
  },
  {
    id: 'reconciliation',
    icon: TrendingUp,
    title: { es: 'Conciliación', en: 'Reconciliation' },
    description: { es: 'Empareja transacciones bancarias con gastos', en: 'Match bank transactions with expenses' },
    path: '/reconciliation',
    color: 'bg-pink-500',
    category: 'analyze'
  }
];

const CATEGORY_LABELS = {
  capture: { es: '📥 Capturar', en: '📥 Capture' },
  organize: { es: '📁 Organizar', en: '📁 Organize' },
  analyze: { es: '📊 Analizar', en: '📊 Analyze' },
  plan: { es: '🎯 Planificar', en: '🎯 Plan' }
};

interface InteractiveQuestion {
  id: string;
  icon: React.ElementType;
  question: { es: string; en: string };
  actions: { label: { es: string; en: string }; path: string; highlight?: boolean }[];
}

const INTERACTIVE_QUESTIONS: InteractiveQuestion[] = [
  {
    id: 'goal',
    icon: Target,
    question: { 
      es: '¿Cuál es tu objetivo principal hoy?', 
      en: 'What is your main goal today?' 
    },
    actions: [
      { label: { es: 'Organizar mis gastos', en: 'Organize my expenses' }, path: '/expenses', highlight: true },
      { label: { es: 'Preparar impuestos', en: 'Prepare taxes' }, path: '/dashboard' },
      { label: { es: 'Facturar a clientes', en: 'Bill clients' }, path: '/clients' },
      { label: { es: 'Ver mi patrimonio', en: 'View my net worth' }, path: '/net-worth' }
    ]
  },
  {
    id: 'concern',
    icon: HelpCircle,
    question: { 
      es: '¿Qué te preocupa de tus finanzas?', 
      en: 'What concerns you about your finances?' 
    },
    actions: [
      { label: { es: 'No sé qué puedo deducir', en: "I don't know what I can deduct" }, path: '/dashboard' },
      { label: { es: 'Tengo recibos sin procesar', en: 'I have unprocessed receipts' }, path: '/chaos-inbox', highlight: true },
      { label: { es: 'Necesito entender mis contratos', en: 'Need to understand my contracts' }, path: '/contracts' },
      { label: { es: 'Quiero ahorrar más', en: 'I want to save more' }, path: '/net-worth' }
    ]
  },
  {
    id: 'plan',
    icon: Lightbulb,
    question: { 
      es: '¿Tienes algún plan financiero en mente?', 
      en: 'Do you have any financial plan in mind?' 
    },
    actions: [
      { label: { es: 'Planificar retiro (FIRE)', en: 'Plan retirement (FIRE)' }, path: '/dashboard' },
      { label: { es: 'Reducir deudas', en: 'Reduce debt' }, path: '/net-worth' },
      { label: { es: 'Maximizar inversiones', en: 'Maximize investments' }, path: '/dashboard' },
      { label: { es: 'Optimizar RRSP/TFSA', en: 'Optimize RRSP/TFSA' }, path: '/dashboard' }
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
        className="mb-4"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {language === 'es' ? 'Mostrar Guía Interactiva' : 'Show Interactive Guide'}
      </Button>
    );
  }

  const groupedActions = QUICK_ACTIONS.reduce((acc, action) => {
    if (!acc[action.category]) acc[action.category] = [];
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  const displayedActions = showAllActions ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, 6);

  return (
    <Card className={cn("border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {language === 'es' 
                  ? `${firstName ? `${firstName}, ` : ''}¿En qué puedo ayudarte hoy?` 
                  : `${firstName ? `${firstName}, ` : ''}How can I help you today?`
                }
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {language === 'es'
                  ? 'Soy tu asistente financiero personal. Cuéntame qué necesitas.'
                  : "I'm your personal financial assistant. Tell me what you need."
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Interactive Questions */}
        <div className="space-y-3">
          {INTERACTIVE_QUESTIONS.map((q) => {
            const Icon = q.icon;
            const isActive = activeQuestion === q.id;
            
            return (
              <div key={q.id} className="space-y-2">
                <button
                  onClick={() => setActiveQuestion(isActive ? null : q.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="flex-1 font-medium">{q.question[language]}</span>
                  {isActive ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                
                {isActive && (
                  <div className="grid grid-cols-2 gap-2 pl-11 animate-in fade-in slide-in-from-top-2 duration-200">
                    {q.actions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant={action.highlight ? "default" : "outline"}
                        size="sm"
                        className="justify-start h-auto py-2 text-left"
                        onClick={() => navigate(action.path)}
                      >
                        <ArrowRight className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="text-xs">{action.label[language]}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-sm text-muted-foreground">
              {language === 'es' ? 'O elige una acción rápida' : 'Or choose a quick action'}
            </span>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {label[language]}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {displayedActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className="group p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-md transition-all text-left bg-card hover:bg-accent/30"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", action.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                        {action.title[language]}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {action.description[language]}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {QUICK_ACTIONS.length > 6 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowAllActions(!showAllActions)}
            >
              {showAllActions 
                ? (language === 'es' ? 'Ver menos' : 'Show less')
                : (language === 'es' ? `Ver todas las opciones (${QUICK_ACTIONS.length})` : `See all options (${QUICK_ACTIONS.length})`)
              }
              {showAllActions ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          )}
        </div>

        {/* Tip */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            {language === 'es'
              ? `${firstName ? `${firstName}, ` : ''}cada acción que tomes aquí te acerca a tener tus finanzas completamente organizadas. ¡Comienza con lo que más te preocupa!`
              : `${firstName ? `${firstName}, ` : ''}every action you take here brings you closer to having your finances completely organized. Start with what concerns you most!`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
