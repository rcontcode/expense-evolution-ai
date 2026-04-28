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
  Sparkles,
  Link2
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

interface CrossReference {
  path: string;
  title: { es: string; en: string };
  relationship: { es: string; en: string };
}

interface PageContextGuideProps {
  pageKey: string;
  pageTitle: { es: string; en: string };
  pageDescription: { es: string; en: string };
  actions: PageAction[];
  workflows?: PageWorkflow[];
  tips?: { es: string; en: string }[];
  goals?: { es: string; en: string }[];
  crossReferences?: CrossReference[];
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
  crossReferences,
  className,
  onActionClick
}: PageContextGuideProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  
  // Collapse by default on mobile for compact UI
  const [isMobile, setIsMobile] = React.useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [isExpanded, setIsExpanded] = React.useState(!isMobile);
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

  // Filter out actions without any handler so we never render dead buttons
  const validActions = actions.filter(a => typeof a.action === 'function' || !!a.path);

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
                    <Badge key={idx} variant="outline" className="text-xs cursor-pointer font-semibold px-3 py-1.5 bg-gradient-to-b from-primary/20 to-primary/10 border-2 border-primary/40 rounded-xl shadow-[0_3px_0_0] shadow-primary/25 hover:bg-primary/25 hover:shadow-[0_4px_0_0] hover:shadow-primary/30 hover:-translate-y-1 hover:border-primary/60 active:translate-y-0.5 active:shadow-[0_1px_0_0] active:shadow-primary/20 transition-all duration-200">
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
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border-2 font-bold transition-all",
                        step.completed 
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-400/30 shadow-sm shadow-green-500/10"
                          : "bg-secondary/60 text-muted-foreground border-border/40"
                      )}>
                        {step.completed && <CheckCircle2 className="h-3 w-3" />}
                        <span className="font-bold">{step.step}.</span>
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
                    className="group p-3 rounded-xl border-2 border-primary/30 bg-gradient-to-b from-card via-card to-muted/30 shadow-[0_4px_0_0] shadow-primary/20 hover:border-primary/50 hover:shadow-[0_6px_0_0] hover:shadow-primary/30 hover:-translate-y-1.5 hover:bg-primary/5 active:translate-y-1 active:shadow-[0_1px_0_0] active:shadow-primary/15 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 border-2 border-primary/30 shadow-[0_2px_0_0] shadow-primary/20 flex items-center justify-center group-hover:from-primary/35 group-hover:to-primary/20 group-hover:border-primary/50 transition-all duration-200">
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

            {/* Cross References - Related Tools */}
            {crossReferences && crossReferences.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">
                    {language === 'es' ? 'Herramientas relacionadas' : 'Related tools'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {crossReferences.map((ref, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(ref.path)}
                      className="w-full flex items-start gap-2 p-2 rounded-lg border border-border/50 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 text-left group"
                    >
                      <ArrowRight className="h-3 w-3 text-primary mt-0.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-primary">{ref.title[language]}</span>
                        <span className="text-[10px] text-muted-foreground block leading-tight">{ref.relationship[language]}</span>
                      </div>
                    </button>
                  ))}
                </div>
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
      { es: 'Clasificar para impuestos', en: 'Classify for taxes' },
      { es: 'Preparar reembolsos', en: 'Prepare reimbursements' },
      { es: 'Ver resumen del mes', en: 'View monthly summary' }
    ],
    workflows: [
      { step: 1, title: { es: 'Capturar', en: 'Capture' }, description: { es: 'Foto o manual', en: 'Photo or manual' } },
      { step: 2, title: { es: 'Revisar', en: 'Review' }, description: { es: 'Verificar datos', en: 'Verify data' } },
      { step: 3, title: { es: 'Clasificar', en: 'Classify' }, description: { es: 'Cliente/Fiscal', en: 'Client/Tax' } },
      { step: 4, title: { es: 'Reportar', en: 'Report' }, description: { es: 'Exportar', en: 'Export' } }
    ],
    tips: [
      { es: 'los gastos bien clasificados pueden ahorrarte hasta 30% en impuestos.', en: 'well-classified expenses can save you up to 30% in taxes.' },
      { es: 'recuerda asignar cada gasto a un cliente para generar reportes de reembolso.', en: 'remember to assign each expense to a client to generate reimbursement reports.' },
      { es: 'puedes filtrar por categoría para ver exactamente cuánto gastas en cada área.', en: 'you can filter by category to see exactly how much you spend in each area.' }
    ],
    crossReferences: [
      { path: '/chaos', title: { es: 'Bandeja del Caos', en: 'Chaos Inbox' }, relationship: { es: 'Captura fotos/archivos → IA extrae datos → llegan aquí como gastos', en: 'Capture photos/files → AI extracts data → they arrive here as expenses' } },
      { path: '/banking', title: { es: 'Análisis Bancario', en: 'Banking Analysis' }, relationship: { es: 'Las transacciones bancarias importadas se concilian con estos gastos', en: 'Imported bank transactions are reconciled with these expenses' } },
      { path: '/bills', title: { es: 'Pagos Fijos', en: 'Recurring Bills' }, relationship: { es: 'Los gastos recurrentes se detectan automáticamente y aparecen en Pagos Fijos', en: 'Recurring expenses are auto-detected and appear in Recurring Bills' } },
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
    ],
    crossReferences: [
      { path: '/chaos', title: { es: 'Bandeja del Caos', en: 'Chaos Inbox' }, relationship: { es: 'También puedes registrar ingresos subiendo facturas — la IA detecta si es ingreso o gasto', en: 'You can also register income by uploading invoices — AI detects if it\'s income or expense' } },
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
    ],
    crossReferences: [
      { path: '/contracts', title: { es: 'Contratos', en: 'Contracts' }, relationship: { es: 'Los contratos subidos se vinculan a clientes y extraen términos de reembolso automáticamente', en: 'Uploaded contracts are linked to clients and automatically extract reimbursement terms' } },
      { path: '/expenses', title: { es: 'Gastos', en: 'Expenses' }, relationship: { es: 'Los gastos asignados a clientes permiten generar reportes de reembolso y analizar rentabilidad', en: 'Expenses assigned to clients enable reimbursement reports and profitability analysis' } },
      { path: '/income', title: { es: 'Ingresos', en: 'Income' }, relationship: { es: 'Los ingresos vinculados a clientes muestran la rentabilidad real de cada relación comercial', en: 'Income linked to clients shows the real profitability of each business relationship' } },
    ]
  },
  mileage: {
    pageKey: 'mileage',
    pageTitle: { es: 'aquí registras tus viajes', en: 'here you log your trips' },
    pageDescription: { 
      es: 'Control de kilometraje personal y profesional — con deducción fiscal si configuras tu jurisdicción', 
      en: 'Personal and professional mileage tracking — with tax deduction if you configure your jurisdiction' 
    },
    goals: [
      { es: 'Registrar viaje reciente', en: 'Log recent trip' },
      { es: 'Ver deducciones acumuladas', en: 'View accumulated deductions' },
      { es: 'Exportar para declaración fiscal', en: 'Export for tax filing' }
    ],
    workflows: [
      { step: 1, title: { es: 'Registrar', en: 'Log' }, description: { es: 'Fecha y ruta', en: 'Date and route' } },
      { step: 2, title: { es: 'Asignar', en: 'Assign' }, description: { es: 'Cliente', en: 'Client' } },
      { step: 3, title: { es: 'Calcular', en: 'Calculate' }, description: { es: 'Tarifa oficial', en: 'Official rate' } },
      { step: 4, title: { es: 'Deducir', en: 'Deduct' }, description: { es: 'En impuestos', en: 'On taxes' } }
    ],
    tips: [
      { es: 'el kilometraje funciona como registro personal para todos. Si configuras una entidad fiscal (CRA/SII), también calcula deducciones.', en: 'mileage works as personal tracking for everyone. If you configure a tax entity (CRA/SII), it also calculates deductions.' },
      { es: 'guarda un registro de cada viaje — las autoridades fiscales pueden solicitar comprobantes.', en: 'keep a record of each trip — tax authorities may request proof.' }
    ],
    crossReferences: [
      { path: '/clients', title: { es: 'Clientes', en: 'Clients' }, relationship: { es: 'Asigna viajes a clientes para reportes de reembolso de kilometraje', en: 'Assign trips to clients for mileage reimbursement reports' } },
      { path: '/expenses', title: { es: 'Gastos', en: 'Expenses' }, relationship: { es: 'Las deducciones de kilometraje se reflejan en tu resumen fiscal de gastos', en: 'Mileage deductions are reflected in your tax expense summary' } },
    ]
  },
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
    ],
    crossReferences: [
      { path: '/income', title: { es: 'Ingresos', en: 'Income' }, relationship: { es: 'Tus ingresos alimentan el crecimiento de tu patrimonio neto mes a mes', en: 'Your income feeds the growth of your net worth month by month' } },
      { path: '/expenses', title: { es: 'Gastos', en: 'Expenses' }, relationship: { es: 'Los gastos reducen tu patrimonio — controlarlos es clave para crecer', en: 'Expenses reduce your net worth — controlling them is key to growth' } },
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
    ],
    crossReferences: [
      { path: '/reconciliation', title: { es: 'Conciliación', en: 'Reconciliation' }, relationship: { es: 'Las transacciones importadas aquí se emparejan con tus gastos registrados en Conciliación', en: 'Transactions imported here are matched with your recorded expenses in Reconciliation' } },
      { path: '/subscriptions', title: { es: 'Suscripciones', en: 'Subscriptions' }, relationship: { es: 'Los pagos recurrentes detectados aquí aparecen automáticamente en Suscripciones', en: 'Recurring payments detected here automatically appear in Subscriptions' } },
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
    ],
    crossReferences: [
      { path: '/banking', title: { es: 'Análisis Bancario', en: 'Banking Analysis' }, relationship: { es: 'Primero importa estados de cuenta en Análisis Bancario para tener transacciones que conciliar', en: 'First import bank statements in Banking Analysis to have transactions to reconcile' } },
      { path: '/expenses', title: { es: 'Gastos', en: 'Expenses' }, relationship: { es: 'Los gastos registrados se emparejan automáticamente con las transacciones bancarias', en: 'Recorded expenses are automatically matched with bank transactions' } },
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
    ],
    crossReferences: [
      { path: '/expenses', title: { es: 'Gastos', en: 'Expenses' }, relationship: { es: 'Las etiquetas se asignan a gastos para organización y filtrado avanzado', en: 'Tags are assigned to expenses for organization and advanced filtering' } },
    ]
  },
  'chaos-inbox': {
    pageKey: 'chaos-inbox',
    pageTitle: { es: 'aquí revisas documentos capturados', en: 'here you review captured documents' },
    pageDescription: { 
      es: 'Bandeja de entrada de documentos: las fotos de Captura Rápida y archivos subidos llegan aquí para revisión. Una vez aprobados, se crean como gastos o ingresos.', 
      en: 'Document inbox: photos from Quick Capture and uploaded files arrive here for review. Once approved, they become expenses or income.' 
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
    ],
    crossReferences: [
      { path: '/expenses', title: { es: 'Gastos', en: 'Expenses' }, relationship: { es: 'Los recibos aprobados aquí se convierten en gastos en la sección de Gastos', en: 'Receipts approved here become expenses in the Expenses section' } },
      { path: '/income', title: { es: 'Ingresos', en: 'Income' }, relationship: { es: 'Las facturas de clientes aprobadas aquí se registran como ingresos', en: 'Client invoices approved here are recorded as income' } },
    ]
  },
  bills: {
    pageKey: 'bills',
    pageTitle: { es: 'aquí gestionas tus pagos fijos', en: 'here you manage your recurring bills' },
    pageDescription: { 
      es: 'Controla servicios, suscripciones y compromisos mensuales', 
      en: 'Control services, subscriptions and monthly commitments' 
    },
    goals: [
      { es: 'Configurar pagos recurrentes', en: 'Set up recurring payments' },
      { es: 'Ver calendario de vencimientos', en: 'View due date calendar' },
      { es: 'Detectar pagos atrasados', en: 'Detect overdue payments' },
      { es: 'Proyectar flujo de caja', en: 'Project cash flow' }
    ],
    workflows: [
      { step: 1, title: { es: 'Agregar', en: 'Add' }, description: { es: 'Pago fijo', en: 'Fixed bill' } },
      { step: 2, title: { es: 'Configurar', en: 'Configure' }, description: { es: 'Monto y fecha', en: 'Amount & date' } },
      { step: 3, title: { es: 'Seguir', en: 'Track' }, description: { es: 'Estado mensual', en: 'Monthly status' } },
      { step: 4, title: { es: 'Optimizar', en: 'Optimize' }, description: { es: 'Reducir costos', en: 'Reduce costs' } }
    ],
    tips: [
      { es: 'usa el Quick Setup para agregar tus pagos típicos en segundos.', en: 'use Quick Setup to add your typical bills in seconds.' },
      { es: 'el Kanban te permite arrastrar pagos de "Pendiente" a "Pagado" fácilmente.', en: 'the Kanban lets you drag bills from "Pending" to "Paid" easily.' },
      { es: 'la vista Calendario te muestra exactamente cuándo vence cada pago del mes.', en: 'the Calendar view shows you exactly when each payment is due this month.' }
    ],
    crossReferences: [
      { path: '/expenses', title: { es: 'Gastos', en: 'Expenses' }, relationship: { es: 'Los pagos fijos también se detectan automáticamente al registrar gastos recurrentes', en: 'Recurring bills are also auto-detected when you record recurring expenses' } },
      { path: '/banking', title: { es: 'Análisis Bancario', en: 'Banking Analysis' }, relationship: { es: 'Al importar extractos bancarios, se detectan cobros recurrentes que pueden convertirse en pagos fijos', en: 'When importing bank statements, recurring charges are detected that can become recurring bills' } },
      { path: '/subscriptions', title: { es: 'Suscripciones', en: 'Subscriptions' }, relationship: { es: 'Las suscripciones detectadas automáticamente pueden convertirse en pagos fijos aquí', en: 'Auto-detected subscriptions can be converted to recurring bills here' } },
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
    ],
    crossReferences: [
      { path: '/clients', title: { es: 'Clientes', en: 'Clients' }, relationship: { es: 'Los contratos se vinculan a clientes para extraer términos de reembolso y facturación', en: 'Contracts are linked to clients to extract reimbursement and billing terms' } },
      { path: '/chaos', title: { es: 'Bandeja del Caos', en: 'Chaos Inbox' }, relationship: { es: 'También puedes subir contratos desde la Bandeja del Caos — la IA los detecta y clasifica', en: 'You can also upload contracts from Chaos Inbox — AI detects and classifies them' } },
      { path: '/expenses', title: { es: 'Gastos', en: 'Expenses' }, relationship: { es: 'Los gastos se clasifican automáticamente según los términos extraídos del contrato', en: 'Expenses are auto-classified based on terms extracted from the contract' } },
    ]
  }
};
