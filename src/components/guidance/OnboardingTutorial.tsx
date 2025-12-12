import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { UseQueryResult } from '@tanstack/react-query';
import {
  Camera,
  Receipt,
  Users,
  Wallet,
  PiggyBank,
  Building2,
  FileText,
  TrendingUp,
  Calculator,
  Target,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  PartyPopper
} from 'lucide-react';

interface TutorialStep {
  id: string;
  icon: React.ReactNode;
  title: { en: string; es: string };
  description: { en: string; es: string };
  features: { en: string[]; es: string[] };
  route?: string;
  action?: { en: string; es: string };
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    icon: <Sparkles className="h-12 w-12 text-primary" />,
    title: {
      en: 'Welcome to Your Financial Assistant!',
      es: '¡Bienvenido a Tu Asistente Financiero!'
    },
    description: {
      en: 'This app helps you manage expenses, income, taxes, and build wealth. Let me show you around!',
      es: '¡Esta app te ayuda a gestionar gastos, ingresos, impuestos y construir patrimonio. Déjame mostrarte!'
    },
    features: {
      en: ['Track all your expenses', 'Manage income sources', 'Optimize taxes with CRA', 'Build your net worth'],
      es: ['Registra todos tus gastos', 'Gestiona fuentes de ingreso', 'Optimiza impuestos con CRA', 'Construye tu patrimonio']
    }
  },
  {
    id: 'quick-capture',
    icon: <Camera className="h-12 w-12 text-primary" />,
    title: {
      en: 'Quick Expense Capture',
      es: 'Captura Rápida de Gastos'
    },
    description: {
      en: 'Capture expenses instantly with your camera, voice, or text. AI extracts all the details automatically!',
      es: '¡Captura gastos instantáneamente con tu cámara, voz o texto. La IA extrae todos los detalles automáticamente!'
    },
    features: {
      en: ['📸 Take photos of receipts', '🎤 Record voice notes', '⌨️ Quick text entry', '🤖 AI auto-extraction'],
      es: ['📸 Toma fotos de recibos', '🎤 Graba notas de voz', '⌨️ Entrada rápida de texto', '🤖 Extracción automática con IA']
    },
    route: '/capture',
    action: { en: 'Try Capture', es: 'Probar Captura' }
  },
  {
    id: 'expenses',
    icon: <Receipt className="h-12 w-12 text-primary" />,
    title: {
      en: 'Expense Management',
      es: 'Gestión de Gastos'
    },
    description: {
      en: 'View, organize, and categorize all your expenses. Filter by client, project, or category.',
      es: 'Visualiza, organiza y categoriza todos tus gastos. Filtra por cliente, proyecto o categoría.'
    },
    features: {
      en: ['Complete expense history', 'Smart categorization', 'Client/project assignment', 'Reimbursement tracking'],
      es: ['Historial completo de gastos', 'Categorización inteligente', 'Asignación a cliente/proyecto', 'Seguimiento de reembolsos']
    },
    route: '/expenses',
    action: { en: 'View Expenses', es: 'Ver Gastos' }
  },
  {
    id: 'income',
    icon: <Wallet className="h-12 w-12 text-primary" />,
    title: {
      en: 'Income Tracking',
      es: 'Seguimiento de Ingresos'
    },
    description: {
      en: 'Track all income sources: salary, client payments, investments, passive income, and more.',
      es: 'Registra todas las fuentes de ingreso: salario, pagos de clientes, inversiones, ingresos pasivos y más.'
    },
    features: {
      en: ['13 income categories', 'Recurring income setup', 'Tax classification', 'Balance visualization'],
      es: ['13 categorías de ingreso', 'Configurar ingresos recurrentes', 'Clasificación fiscal', 'Visualización del balance']
    },
    route: '/income',
    action: { en: 'Add Income', es: 'Agregar Ingreso' }
  },
  {
    id: 'clients',
    icon: <Users className="h-12 w-12 text-primary" />,
    title: {
      en: 'Client Management',
      es: 'Gestión de Clientes'
    },
    description: {
      en: 'Manage your clients and their projects. Link expenses for accurate billing and reimbursements.',
      es: 'Gestiona tus clientes y sus proyectos. Vincula gastos para facturación precisa y reembolsos.'
    },
    features: {
      en: ['Client profiles', 'Project tracking', 'Financial overview per client', 'Reimbursement reports'],
      es: ['Perfiles de clientes', 'Seguimiento de proyectos', 'Panorama financiero por cliente', 'Reportes de reembolso']
    },
    route: '/clients',
    action: { en: 'Add Client', es: 'Agregar Cliente' }
  },
  {
    id: 'contracts',
    icon: <FileText className="h-12 w-12 text-primary" />,
    title: {
      en: 'Contract Analysis',
      es: 'Análisis de Contratos'
    },
    description: {
      en: 'Upload contracts and let AI extract reimbursement terms. Automatic expense classification!',
      es: '¡Sube contratos y deja que la IA extraiga términos de reembolso. Clasificación automática de gastos!'
    },
    features: {
      en: ['AI contract analysis', 'Reimbursement term extraction', 'Auto expense classification', 'Renewal tracking'],
      es: ['Análisis de contratos con IA', 'Extracción de términos de reembolso', 'Clasificación automática de gastos', 'Seguimiento de renovaciones']
    },
    route: '/contracts',
    action: { en: 'Upload Contract', es: 'Subir Contrato' }
  },
  {
    id: 'net-worth',
    icon: <PiggyBank className="h-12 w-12 text-primary" />,
    title: {
      en: 'Net Worth Tracking',
      es: 'Seguimiento de Patrimonio'
    },
    description: {
      en: 'Track your assets and liabilities. Visualize your wealth growth over time.',
      es: 'Registra tus activos y pasivos. Visualiza el crecimiento de tu patrimonio en el tiempo.'
    },
    features: {
      en: ['Asset categories (crypto, stocks, property)', 'Liability tracking', 'Net worth chart', 'Productive vs non-productive assets'],
      es: ['Categorías de activos (crypto, acciones, propiedades)', 'Seguimiento de pasivos', 'Gráfico de patrimonio', 'Activos productivos vs no productivos']
    },
    route: '/net-worth',
    action: { en: 'View Net Worth', es: 'Ver Patrimonio' }
  },
  {
    id: 'banking',
    icon: <Building2 className="h-12 w-12 text-primary" />,
    title: {
      en: 'Smart Bank Analysis',
      es: 'Análisis Bancario Inteligente'
    },
    description: {
      en: 'Import bank statements and get AI-powered insights: anomaly detection, recurring charges, and trends.',
      es: 'Importa estados de cuenta y obtén análisis con IA: detección de anomalías, cargos recurrentes y tendencias.'
    },
    features: {
      en: ['Multi-bank support', 'Anomaly alerts', 'Subscription detection', 'Smart search chat'],
      es: ['Soporte multi-banco', 'Alertas de anomalías', 'Detección de suscripciones', 'Chat de búsqueda inteligente']
    },
    route: '/banking',
    action: { en: 'Import Statement', es: 'Importar Estado' }
  },
  {
    id: 'dashboard',
    icon: <TrendingUp className="h-12 w-12 text-primary" />,
    title: {
      en: 'Powerful Dashboard',
      es: 'Dashboard Poderoso'
    },
    description: {
      en: 'Your financial command center with charts, tax analysis, FIRE calculator, and investment tools.',
      es: 'Tu centro de mando financiero con gráficos, análisis fiscal, calculadora FIRE y herramientas de inversión.'
    },
    features: {
      en: ['Income vs Expenses charts', 'Tax optimizer (CRA)', 'FIRE calculator', 'RRSP/TFSA optimizer'],
      es: ['Gráficos de Ingresos vs Gastos', 'Optimizador de impuestos (CRA)', 'Calculadora FIRE', 'Optimizador RRSP/TFSA']
    },
    route: '/',
    action: { en: 'Go to Dashboard', es: 'Ir al Dashboard' }
  },
  {
    id: 'complete',
    icon: <PartyPopper className="h-12 w-12 text-primary" />,
    title: {
      en: "You're Ready!",
      es: '¡Estás Listo!'
    },
    description: {
      en: "You've seen the main features. Start by capturing your first expense or exploring the dashboard!",
      es: '¡Has visto las funcionalidades principales. Comienza capturando tu primer gasto o explorando el dashboard!'
    },
    features: {
      en: ['💡 Use the chat assistant anytime', '📱 Install as mobile app', '🎯 Set financial goals', '📊 Track your progress'],
      es: ['💡 Usa el asistente de chat cuando quieras', '📱 Instala como app móvil', '🎯 Define metas financieras', '📊 Sigue tu progreso']
    }
  }
];

const STORAGE_KEY = 'onboarding-tutorial-completed';

export function OnboardingTutorial() {
  const { language, t } = useLanguage();
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const userName = profile?.full_name?.split(' ')[0] || t('user');

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleAction = (route?: string) => {
    if (route) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsOpen(false);
      navigate(route);
    }
  };

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-lg border-primary/20 shadow-2xl">
        <CardContent className="p-0">
          {/* Header with progress */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {language === 'es' ? `Paso ${currentStep + 1} de ${TUTORIAL_STEPS.length}` : `Step ${currentStep + 1} of ${TUTORIAL_STEPS.length}`}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSkip} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Content */}
          <div className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                {step.icon}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-1">
                {currentStep === 0 && `${userName}, `}
                {step.title[language]}
              </h2>
              <p className="text-muted-foreground">
                {step.description[language]}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              {step.features[language].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {step.action && step.route && (
              <Button 
                variant="outline" 
                onClick={() => handleAction(step.route)}
                className="w-full"
              >
                {step.action[language]}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Anterior' : 'Previous'}
            </Button>

            {currentStep === TUTORIAL_STEPS.length - 1 ? (
              <Button onClick={handleComplete} className="bg-primary">
                <Target className="h-4 w-4 mr-2" />
                {language === 'es' ? '¡Comenzar!' : "Let's Go!"}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {language === 'es' ? 'Siguiente' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function resetOnboardingTutorial() {
  localStorage.removeItem(STORAGE_KEY);
}
