import * as React from "react";
import { 
  Lightbulb, 
  X,
  ChevronRight,
  Sparkles,
  Receipt,
  Users,
  Car,
  LayoutDashboard,
  TrendingUp,
  FileText,
  Upload,
  CheckCircle2,
  Target,
  BarChart3,
  PieChart,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface OnboardingGuideProps {
  pageKey: 'dashboard' | 'expenses' | 'clients' | 'mileage' | 'income';
  className?: string;
}

const GUIDE_CONFIG = {
  dashboard: {
    storageKey: 'guide-dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    title: {
      es: '¡Bienvenido a tu Panel de Control!',
      en: 'Welcome to your Dashboard!'
    },
    subtitle: {
      es: 'Aquí tienes una vista completa de tus finanzas',
      en: 'Here you have a complete view of your finances'
    },
    steps: {
      es: [
        { icon: <BarChart3 className="h-4 w-4 text-primary" />, title: 'Balance General', description: 'Ve tus ingresos vs gastos de un vistazo' },
        { icon: <PieChart className="h-4 w-4 text-primary" />, title: 'Gráficos Interactivos', description: 'Analiza gastos por categoría y cliente' },
        { icon: <DollarSign className="h-4 w-4 text-primary" />, title: 'Análisis Fiscal CRA', description: 'Calcula deducciones para tu T2125' },
      ],
      en: [
        { icon: <BarChart3 className="h-4 w-4 text-primary" />, title: 'General Balance', description: 'See your income vs expenses at a glance' },
        { icon: <PieChart className="h-4 w-4 text-primary" />, title: 'Interactive Charts', description: 'Analyze expenses by category and client' },
        { icon: <DollarSign className="h-4 w-4 text-primary" />, title: 'CRA Tax Analysis', description: 'Calculate deductions for your T2125' },
      ]
    },
    tip: {
      es: 'Usa los filtros arriba para ver datos de clientes o categorías específicas',
      en: 'Use the filters above to see data for specific clients or categories'
    }
  },
  expenses: {
    storageKey: 'guide-expenses',
    icon: <Receipt className="h-5 w-5" />,
    title: {
      es: '¡Gestiona tus Gastos Fácilmente!',
      en: 'Manage your Expenses Easily!'
    },
    subtitle: {
      es: 'Múltiples formas de registrar y organizar',
      en: 'Multiple ways to record and organize'
    },
    steps: {
      es: [
        { icon: <Sparkles className="h-4 w-4 text-primary" />, title: 'Captura Rápida Smart', description: 'Foto, voz o texto - EvoFinz hace el resto' },
        { icon: <FileText className="h-4 w-4 text-primary" />, title: 'Formulario Manual', description: 'Control total sobre cada detalle' },
        { icon: <TrendingUp className="h-4 w-4 text-primary" />, title: 'Reportes de Reembolso', description: 'Genera informes para tus clientes' },
      ],
      en: [
        { icon: <Sparkles className="h-4 w-4 text-primary" />, title: 'Smart Quick Capture', description: 'Photo, voice or text - EvoFinz does the rest' },
        { icon: <FileText className="h-4 w-4 text-primary" />, title: 'Manual Form', description: 'Full control over every detail' },
        { icon: <TrendingUp className="h-4 w-4 text-primary" />, title: 'Reimbursement Reports', description: 'Generate reports for your clients' },
      ]
    },
    tip: {
      es: 'Prueba la Captura Rápida Smart - solo toma una foto de tu recibo',
      en: 'Try Smart Quick Capture - just take a photo of your receipt'
    }
  },
  clients: {
    storageKey: 'guide-clients',
    icon: <Users className="h-5 w-5" />,
    title: {
      es: '¡Organiza tus Clientes!',
      en: 'Organize your Clients!'
    },
    subtitle: {
      es: 'Gestiona información y términos de reembolso',
      en: 'Manage information and reimbursement terms'
    },
    steps: {
      es: [
        { icon: <Users className="h-4 w-4 text-primary" />, title: 'Perfiles Completos', description: 'Contacto, industria, términos de pago' },
        { icon: <Target className="h-4 w-4 text-primary" />, title: 'Asocia Gastos', description: 'Vincula gastos a cada cliente' },
        { icon: <CheckCircle2 className="h-4 w-4 text-primary" />, title: 'Indicador de Completitud', description: 'Ve qué información falta' },
      ],
      en: [
        { icon: <Users className="h-4 w-4 text-primary" />, title: 'Complete Profiles', description: 'Contact, industry, payment terms' },
        { icon: <Target className="h-4 w-4 text-primary" />, title: 'Associate Expenses', description: 'Link expenses to each client' },
        { icon: <CheckCircle2 className="h-4 w-4 text-primary" />, title: 'Completeness Indicator', description: 'See what information is missing' },
      ]
    },
    tip: {
      es: 'Completa los perfiles de cliente para mejores reportes de reembolso',
      en: 'Complete client profiles for better reimbursement reports'
    }
  },
  mileage: {
    storageKey: 'guide-mileage',
    icon: <Car className="h-5 w-5" />,
    title: {
      es: '¡Rastrea tu Kilometraje!',
      en: 'Track your Mileage!'
    },
    subtitle: {
      es: 'Deducciones CRA calculadas automáticamente',
      en: 'CRA deductions calculated automatically'
    },
    steps: {
      es: [
        { icon: <Car className="h-4 w-4 text-primary" />, title: 'Registra Viajes', description: 'Ruta, kilómetros y propósito' },
        { icon: <DollarSign className="h-4 w-4 text-primary" />, title: 'Tasas CRA 2024', description: '$0.70/km (primeros 5,000km)' },
        { icon: <BarChart3 className="h-4 w-4 text-primary" />, title: 'Resumen Anual', description: 'Total deducible para T2125' },
      ],
      en: [
        { icon: <Car className="h-4 w-4 text-primary" />, title: 'Record Trips', description: 'Route, kilometers and purpose' },
        { icon: <DollarSign className="h-4 w-4 text-primary" />, title: 'CRA 2024 Rates', description: '$0.70/km (first 5,000km)' },
        { icon: <BarChart3 className="h-4 w-4 text-primary" />, title: 'Annual Summary', description: 'Total deductible for T2125' },
      ]
    },
    tip: {
      es: 'Registra cada viaje de trabajo para maximizar tus deducciones',
      en: 'Record every work trip to maximize your deductions'
    }
  },
  income: {
    storageKey: 'guide-income',
    icon: <TrendingUp className="h-5 w-5" />,
    title: {
      es: '¡Controla tus Ingresos!',
      en: 'Control your Income!'
    },
    subtitle: {
      es: 'Registra y categoriza todas tus fuentes',
      en: 'Record and categorize all your sources'
    },
    steps: {
      es: [
        { icon: <TrendingUp className="h-4 w-4 text-primary" />, title: '13 Categorías', description: 'Salario, clientes, inversiones, etc.' },
        { icon: <Target className="h-4 w-4 text-primary" />, title: 'Vincula a Proyectos', description: 'Organiza por cliente y proyecto' },
        { icon: <CheckCircle2 className="h-4 w-4 text-primary" />, title: 'Ingresos Gravables', description: 'Marca cuáles aplican para impuestos' },
      ],
      en: [
        { icon: <TrendingUp className="h-4 w-4 text-primary" />, title: '13 Categories', description: 'Salary, clients, investments, etc.' },
        { icon: <Target className="h-4 w-4 text-primary" />, title: 'Link to Projects', description: 'Organize by client and project' },
        { icon: <CheckCircle2 className="h-4 w-4 text-primary" />, title: 'Taxable Income', description: 'Mark which apply for taxes' },
      ]
    },
    tip: {
      es: 'Activa la recurrencia para ingresos regulares como salarios',
      en: 'Enable recurrence for regular income like salaries'
    }
  }
};

export function OnboardingGuide({ pageKey, className }: OnboardingGuideProps) {
  const { language } = useLanguage();
  const config = GUIDE_CONFIG[pageKey];
  
  const [dismissed, setDismissed] = React.useState(() => {
    return localStorage.getItem(`${config.storageKey}-dismissed`) === 'true';
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`${config.storageKey}-dismissed`, 'true');
  };

  if (dismissed) return null;

  const steps = config.steps[language] || config.steps.es;

  return (
    <Card className={cn(
      "border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden animate-in",
      className
    )}>
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Icon and Title */}
          <div className="flex items-start gap-3 flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow text-primary-foreground">
              {config.icon}
            </div>
            <div className="md:hidden">
              <div className="flex items-center gap-2">
                <h4 className="font-bold">{config.title[language]}</h4>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[10px]">
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  {language === 'es' ? 'Nuevo' : 'New'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{config.subtitle[language]}</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Desktop Title */}
            <div className="hidden md:block mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-lg">{config.title[language]}</h4>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {language === 'es' ? 'Guía' : 'Guide'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{config.subtitle[language]}</p>
            </div>

            {/* Steps Grid */}
            <div className="grid gap-2 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-card/50 border border-border/30"
                >
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-medium text-sm leading-tight">{step.title}</h5>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-muted-foreground">{config.tip[language]}</span>
            </div>
          </div>

          {/* Dismiss Button */}
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 md:relative md:top-0 md:right-0 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
