import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  Target,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/data/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface PageAction {
  icon: React.ElementType;
  title: { es: string; en: string };
  description: { es: string; en: string };
  action?: () => void;
  path?: string;
}

interface PageWorkflow {
  step: number;
  title: { es: string; en: string };
  description: { es: string; en: string };
  completed?: boolean;
}

interface PageContextGuideProps {
  pageKey: string;
  pageTitle: { es: string; en: string };
  pageDescription: { es: string; en: string };
  actions: PageAction[];
  workflows?: PageWorkflow[];
  tips?: { es: string; en: string }[];
  goals?: { es: string; en: string }[];
  className?: string;
  onActionClick?: (actionIndex: number) => void;
}

export function PageContextGuide({
  pageKey,
  pageTitle,
  pageDescription,
  actions,
  workflows,
  tips,
  goals,
  className,
  onActionClick
}: PageContextGuideProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [dismissed, setDismissed] = React.useState(() => {
    return localStorage.getItem(`page-guide-${pageKey}-dismissed`) === 'true';
  });

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`page-guide-${pageKey}-dismissed`, 'true');
  };

  const handleActionClick = (action: PageAction, index: number) => {
    if (onActionClick) {
      onActionClick(index);
    }
    if (action.action) {
      action.action();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  if (dismissed) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setDismissed(false);
          localStorage.removeItem(`page-guide-${pageKey}-dismissed`);
        }}
        className="mb-2 text-muted-foreground hover:text-foreground"
      >
        <Sparkles className="h-3 w-3 mr-1" />
        {language === 'es' ? 'Mostrar guía' : 'Show guide'}
      </Button>
    );
  }

  return (
    <Card className={cn(
      "border border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5",
      className
    )}>
      <CardContent className="pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {firstName && <span className="text-primary">{firstName}, </span>}
                {pageTitle[language]}
              </h3>
              <p className="text-xs text-muted-foreground">{pageDescription[language]}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Goals Section */}
            {goals && goals.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">
                    {language === 'es' ? '¿Qué quieres lograr aquí?' : 'What do you want to achieve here?'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {goals.map((goal, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                      {goal[language]}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Workflows */}
            {workflows && workflows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">
                    {language === 'es' ? 'Flujo de trabajo' : 'Workflow'}
                  </span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {workflows.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs whitespace-nowrap",
                        step.completed 
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {step.completed && <CheckCircle2 className="h-3 w-3" />}
                        <span className="font-medium">{step.step}.</span>
                        {step.title[language]}
                      </div>
                      {idx < workflows.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {actions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleActionClick(action, idx)}
                    className="group p-2.5 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs group-hover:text-primary transition-colors truncate">
                          {action.title[language]}
                        </h4>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {action.description[language]}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tips */}
            {tips && tips.length > 0 && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50">
                <Lightbulb className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-200">
                  {firstName && <span className="font-medium">{firstName}, </span>}
                  {tips[Math.floor(Math.random() * tips.length)][language]}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Pre-configured guides for common pages
export const PAGE_GUIDES = {
  expenses: {
    pageKey: 'expenses',
    pageTitle: { es: 'aquí gestionas todos tus gastos', en: 'here you manage all your expenses' },
    pageDescription: { 
      es: 'Registra, clasifica y organiza cada gasto para maximizar deducciones', 
      en: 'Record, classify and organize each expense to maximize deductions' 
    },
    goals: [
      { es: 'Organizar gastos pendientes', en: 'Organize pending expenses' },
      { es: 'Clasificar para CRA', en: 'Classify for CRA' },
      { es: 'Preparar reembolsos', en: 'Prepare reimbursements' },
      { es: 'Ver resumen del mes', en: 'View monthly summary' }
    ],
    workflows: [
      { step: 1, title: { es: 'Capturar', en: 'Capture' }, description: { es: 'Foto o manual', en: 'Photo or manual' } },
      { step: 2, title: { es: 'Revisar', en: 'Review' }, description: { es: 'Verificar datos', en: 'Verify data' } },
      { step: 3, title: { es: 'Clasificar', en: 'Classify' }, description: { es: 'Cliente/CRA', en: 'Client/CRA' } },
      { step: 4, title: { es: 'Reportar', en: 'Report' }, description: { es: 'Exportar', en: 'Export' } }
    ],
    tips: [
      { es: 'los gastos bien clasificados pueden ahorrarte hasta 30% en impuestos.', en: 'well-classified expenses can save you up to 30% in taxes.' },
      { es: 'recuerda asignar cada gasto a un cliente para generar reportes de reembolso.', en: 'remember to assign each expense to a client to generate reimbursement reports.' },
      { es: 'puedes filtrar por categoría para ver exactamente cuánto gastas en cada área.', en: 'you can filter by category to see exactly how much you spend in each area.' }
    ]
  },
  income: {
    pageKey: 'income',
    pageTitle: { es: 'aquí registras todos tus ingresos', en: 'here you record all your income' },
    pageDescription: { 
      es: 'Salarios, pagos de clientes, inversiones y más', 
      en: 'Salaries, client payments, investments and more' 
    },
    goals: [
      { es: 'Registrar pago de cliente', en: 'Record client payment' },
      { es: 'Agregar ingreso recurrente', en: 'Add recurring income' },
      { es: 'Ver balance vs gastos', en: 'View balance vs expenses' },
      { es: 'Analizar fuentes de ingreso', en: 'Analyze income sources' }
    ],
    workflows: [
      { step: 1, title: { es: 'Agregar', en: 'Add' }, description: { es: 'Nuevo ingreso', en: 'New income' } },
      { step: 2, title: { es: 'Categorizar', en: 'Categorize' }, description: { es: 'Tipo de ingreso', en: 'Income type' } },
      { step: 3, title: { es: 'Vincular', en: 'Link' }, description: { es: 'Cliente/Proyecto', en: 'Client/Project' } },
      { step: 4, title: { es: 'Verificar', en: 'Verify' }, description: { es: 'En dashboard', en: 'In dashboard' } }
    ],
    tips: [
      { es: 'los ingresos gravables afectan tu declaración de impuestos - asegúrate de clasificarlos correctamente.', en: 'taxable income affects your tax return - make sure to classify them correctly.' },
      { es: 'vincular ingresos a proyectos te ayuda a ver la rentabilidad de cada uno.', en: 'linking income to projects helps you see the profitability of each one.' }
    ]
  },
  clients: {
    pageKey: 'clients',
    pageTitle: { es: 'aquí gestionas tus clientes', en: 'here you manage your clients' },
    pageDescription: { 
      es: 'Organiza clientes, contratos y términos de reembolso', 
      en: 'Organize clients, contracts and reimbursement terms' 
    },
    goals: [
      { es: 'Agregar nuevo cliente', en: 'Add new client' },
      { es: 'Ver gastos por cliente', en: 'View expenses by client' },
      { es: 'Generar reporte de reembolso', en: 'Generate reimbursement report' },
      { es: 'Actualizar información', en: 'Update information' }
    ],
    workflows: [
      { step: 1, title: { es: 'Crear Cliente', en: 'Create Client' }, description: { es: 'Datos básicos', en: 'Basic data' } },
      { step: 2, title: { es: 'Subir Contrato', en: 'Upload Contract' }, description: { es: 'Términos', en: 'Terms' } },
      { step: 3, title: { es: 'Asignar Gastos', en: 'Assign Expenses' }, description: { es: 'Vincular', en: 'Link' } },
      { step: 4, title: { es: 'Facturar', en: 'Invoice' }, description: { es: 'Reporte', en: 'Report' } }
    ],
    tips: [
      { es: 'completar el perfil del cliente te permite generar reportes de reembolso profesionales.', en: 'completing the client profile allows you to generate professional reimbursement reports.' },
      { es: 'sube los contratos para que EvoFinz extraiga automáticamente los términos de reembolso.', en: 'upload contracts so EvoFinz automatically extracts reimbursement terms.' }
    ]
  },
  mileage: {
    pageKey: 'mileage',
    pageTitle: { es: 'aquí registras tus viajes de negocios', en: 'here you log your business trips' },
    pageDescription: { 
      es: 'Cada kilómetro puede ser una deducción fiscal', 
      en: 'Every kilometer can be a tax deduction' 
    },
    goals: [
      { es: 'Registrar viaje reciente', en: 'Log recent trip' },
      { es: 'Ver deducciones acumuladas', en: 'View accumulated deductions' },
      { es: 'Exportar para CRA', en: 'Export for CRA' }
    ],
    workflows: [
      { step: 1, title: { es: 'Registrar', en: 'Log' }, description: { es: 'Fecha y ruta', en: 'Date and route' } },
      { step: 2, title: { es: 'Asignar', en: 'Assign' }, description: { es: 'Cliente', en: 'Client' } },
      { step: 3, title: { es: 'Calcular', en: 'Calculate' }, description: { es: 'Tarifa CRA', en: 'CRA rate' } },
      { step: 4, title: { es: 'Deducir', en: 'Deduct' }, description: { es: 'En impuestos', en: 'On taxes' } }
    ],
    tips: [
      { es: 'la CRA permite $0.70/km para los primeros 5,000 km y $0.64/km después.', en: 'CRA allows $0.70/km for the first 5,000 km and $0.64/km after.' },
      { es: 'guarda un registro de cada viaje - la CRA puede solicitar comprobantes.', en: 'keep a record of each trip - CRA may request proof.' }
    ]
  },
  // contracts key moved to after banking
  'net-worth': {
    pageKey: 'net-worth',
    pageTitle: { es: 'aquí ves tu patrimonio completo', en: 'here you see your complete wealth' },
    pageDescription: { 
      es: 'Activos, pasivos y tu riqueza neta en el tiempo', 
      en: 'Assets, liabilities and your net worth over time' 
    },
    goals: [
      { es: 'Agregar un activo', en: 'Add an asset' },
      { es: 'Registrar un pasivo', en: 'Record a liability' },
      { es: 'Ver proyección de patrimonio', en: 'View wealth projection' },
      { es: 'Convertir activos no productivos', en: 'Convert non-productive assets' }
    ],
    tips: [
      { es: 'recuerda: un activo debe generar ingresos o apreciarse. Un auto que se deprecia NO es un activo.', en: 'remember: an asset must generate income or appreciate. A depreciating car is NOT an asset.' }
    ]
  },
  banking: {
    pageKey: 'banking',
    pageTitle: { es: 'aquí analizas tus cuentas bancarias', en: 'here you analyze your bank accounts' },
    pageDescription: { 
      es: 'Importa estados de cuenta, detecta anomalías y patrones', 
      en: 'Import statements, detect anomalies and patterns' 
    },
    goals: [
      { es: 'Importar estado de cuenta', en: 'Import bank statement' },
      { es: 'Ver suscripciones detectadas', en: 'View detected subscriptions' },
      { es: 'Buscar transacciones', en: 'Search transactions' },
      { es: 'Detectar cobros duplicados', en: 'Detect duplicate charges' }
    ],
    workflows: [
      { step: 1, title: { es: 'Importar', en: 'Import' }, description: { es: 'CSV o foto', en: 'CSV or photo' } },
      { step: 2, title: { es: 'Analizar', en: 'Analyze' }, description: { es: 'IA detecta', en: 'AI detects' } },
      { step: 3, title: { es: 'Revisar', en: 'Review' }, description: { es: 'Anomalías', en: 'Anomalies' } },
      { step: 4, title: { es: 'Optimizar', en: 'Optimize' }, description: { es: 'Reducir gastos', en: 'Reduce costs' } }
    ],
    tips: [
      { es: 'puedes preguntar en lenguaje natural: "¿cuánto pago de internet al mes?"', en: 'you can ask in natural language: "how much do I pay for internet per month?"' },
      { es: 'EvoFinz detecta automáticamente suscripciones y cobros recurrentes.', en: 'EvoFinz automatically detects subscriptions and recurring charges.' }
    ]
  },
  reconciliation: {
    pageKey: 'reconciliation',
    pageTitle: { es: 'aquí concilias banco con gastos', en: 'here you reconcile bank with expenses' },
    pageDescription: { 
      es: 'Empareja transacciones bancarias con tus gastos registrados', 
      en: 'Match bank transactions with your recorded expenses' 
    },
    goals: [
      { es: 'Emparejar transacciones', en: 'Match transactions' },
      { es: 'Encontrar gastos faltantes', en: 'Find missing expenses' },
      { es: 'Detectar discrepancias', en: 'Detect discrepancies' },
      { es: 'Preparar declaración', en: 'Prepare tax filing' }
    ],
    workflows: [
      { step: 1, title: { es: 'Importar', en: 'Import' }, description: { es: 'Estado bancario', en: 'Bank statement' } },
      { step: 2, title: { es: 'Emparejar', en: 'Match' }, description: { es: 'Auto/manual', en: 'Auto/manual' } },
      { step: 3, title: { es: 'Revisar', en: 'Review' }, description: { es: 'Sin emparejar', en: 'Unmatched' } },
      { step: 4, title: { es: 'Completar', en: 'Complete' }, description: { es: 'Crear faltantes', en: 'Create missing' } }
    ],
    tips: [
      { es: 'usa el Modo Asistente si eres nuevo - te guía paso a paso.', en: 'use Assistant Mode if you are new - it guides you step by step.' },
      { es: 'puedes crear gastos directamente desde transacciones no emparejadas.', en: 'you can create expenses directly from unmatched transactions.' }
    ]
  },
  tags: {
    pageKey: 'tags',
    pageTitle: { es: 'aquí organizas tus gastos con etiquetas', en: 'here you organize expenses with tags' },
    pageDescription: { 
      es: 'Las etiquetas te permiten marcar, agrupar y filtrar gastos de forma flexible', 
      en: 'Tags allow you to mark, group and filter expenses flexibly' 
    },
    goals: [
      { es: 'Marcar gastos urgentes', en: 'Mark urgent expenses' },
      { es: 'Identificar reembolsados', en: 'Identify reimbursed' },
      { es: 'Filtrar por prioridad', en: 'Filter by priority' },
      { es: 'Organizar por proyecto', en: 'Organize by project' }
    ],
    workflows: [
      { step: 1, title: { es: 'Crear', en: 'Create' }, description: { es: 'Nombre y color', en: 'Name and color' } },
      { step: 2, title: { es: 'Asignar', en: 'Assign' }, description: { es: 'A gastos', en: 'To expenses' } },
      { step: 3, title: { es: 'Filtrar', en: 'Filter' }, description: { es: 'En tablas', en: 'In tables' } },
      { step: 4, title: { es: 'Analizar', en: 'Analyze' }, description: { es: 'Patrones', en: 'Patterns' } }
    ],
    tips: [
      { es: 'usa colores distintivos para identificar etiquetas de un vistazo.', en: 'use distinctive colors to identify tags at a glance.' },
      { es: 'puedes asignar múltiples etiquetas a un mismo gasto para mayor flexibilidad.', en: 'you can assign multiple tags to the same expense for more flexibility.' },
      { es: 'las etiquetas "Urgente" y "Pendiente" te ayudan a priorizar qué revisar primero.', en: '"Urgent" and "Pending" tags help you prioritize what to review first.' }
    ]
  },
  'chaos-inbox': {
    pageKey: 'chaos-inbox',
    pageTitle: { es: 'aquí revisas tus recibos capturados', en: 'here you review your captured receipts' },
    pageDescription: { 
      es: 'Aprueba, corrige o rechaza los recibos procesados', 
      en: 'Approve, correct or reject processed receipts' 
    },
    goals: [
      { es: 'Revisar recibos pendientes', en: 'Review pending receipts' },
      { es: 'Aprobar datos correctos', en: 'Approve correct data' },
      { es: 'Corregir errores', en: 'Correct errors' },
      { es: 'Capturar más recibos', en: 'Capture more receipts' }
    ],
    workflows: [
      { step: 1, title: { es: 'Capturar', en: 'Capture' }, description: { es: 'Foto/archivo', en: 'Photo/file' } },
      { step: 2, title: { es: 'Procesa', en: 'Processes' }, description: { es: 'Automático', en: 'Automatic' } },
      { step: 3, title: { es: 'Revisar', en: 'Review' }, description: { es: 'Verificar datos', en: 'Verify data' } },
      { step: 4, title: { es: 'Aprobar', en: 'Approve' }, description: { es: 'Crear gasto', en: 'Create expense' } }
    ],
    tips: [
      { es: 'haz clic en cualquier tarjeta de recibo para ver la imagen completa y editar los datos.', en: 'click on any receipt card to see the full image and edit the data.' },
      { es: 'puedes capturar múltiples recibos en secuencia con la cámara continua.', en: 'you can capture multiple receipts in sequence with continuous camera.' }
    ]
  },
  contracts: {
    pageKey: 'contracts',
    pageTitle: { es: 'aquí gestionas tus contratos', en: 'here you manage your contracts' },
    pageDescription: { 
      es: 'Sube contratos para extraer términos de reembolso automáticamente', 
      en: 'Upload contracts to automatically extract reimbursement terms' 
    },
    goals: [
      { es: 'Subir nuevo contrato', en: 'Upload new contract' },
      { es: 'Ver términos extraídos', en: 'View extracted terms' },
      { es: 'Agregar notas manuales', en: 'Add manual notes' },
      { es: 'Vincular a cliente', en: 'Link to client' }
    ],
    workflows: [
      { step: 1, title: { es: 'Subir', en: 'Upload' }, description: { es: 'PDF/imagen', en: 'PDF/image' } },
      { step: 2, title: { es: 'Análisis Smart', en: 'Smart Analysis' }, description: { es: 'Extrae términos', en: 'Extracts terms' } },
      { step: 3, title: { es: 'Revisar', en: 'Review' }, description: { es: 'Agregar notas', en: 'Add notes' } },
      { step: 4, title: { es: 'Usar', en: 'Use' }, description: { es: 'Clasificar gastos', en: 'Classify expenses' } }
    ],
    tips: [
      { es: 'tus notas en los contratos tienen prioridad sobre la extracción inteligente para clasificar gastos.', en: 'your notes on contracts take priority over smart extraction for classifying expenses.' },
      { es: 'los términos extraídos se usan automáticamente para sugerir reembolsos en gastos.', en: 'extracted terms are automatically used to suggest reimbursements on expenses.' }
    ]
  }
};
