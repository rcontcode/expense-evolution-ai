import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  BarChart3, TrendingUp, GraduationCap, Receipt, MapPin, 
  RefreshCw, Landmark, Briefcase, X, ChevronRight, ChevronLeft,
  Sparkles, Play, RotateCcw
} from 'lucide-react';

interface TourStep {
  id: string;
  tabValue: string;
  icon: React.ReactNode;
  title: { es: string; en: string };
  description: { es: string; en: string };
  features: { es: string[]; en: string[] };
  color: string;
  gradient: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'charts',
    tabValue: 'charts',
    icon: <BarChart3 className="h-8 w-8" />,
    title: { es: '📊 Gráficos Principales', en: '📊 Main Charts' },
    description: { 
      es: 'Tu centro de visualización financiera. Aquí ves el panorama completo de tus finanzas de un vistazo.',
      en: 'Your financial visualization center. See the complete picture of your finances at a glance.'
    },
    features: {
      es: ['Gastos por categoría', 'Distribución por cliente', 'Tendencias mensuales'],
      en: ['Expenses by category', 'Distribution by client', 'Monthly trends']
    },
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'analytics',
    tabValue: 'analytics',
    icon: <TrendingUp className="h-8 w-8" />,
    title: { es: '🔍 Análisis Avanzado', en: '🔍 Advanced Analytics' },
    description: { 
      es: 'Inteligencia artificial al servicio de tus finanzas. Predicciones, correlaciones y más de 10 visualizaciones.',
      en: 'AI at your financial service. Predictions, correlations, and 10+ visualizations.'
    },
    features: {
      es: ['Predicciones con IA', 'Flujo de caja proyectado', 'Rentabilidad por proyecto', 'Correlaciones financieras'],
      en: ['AI predictions', 'Projected cash flow', 'Project profitability', 'Financial correlations']
    },
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 'mentorship',
    tabValue: 'mentorship',
    icon: <GraduationCap className="h-8 w-8" />,
    title: { es: '🧠 Sistema de Mentoría', en: '🧠 Mentorship System' },
    description: { 
      es: 'Aprende de los mejores: Kiyosaki, Tracy, Rohn. Metodologías probadas para construir riqueza.',
      en: 'Learn from the best: Kiyosaki, Tracy, Rohn. Proven methodologies for building wealth.'
    },
    features: {
      es: ['Cuadrante del Flujo de Caja', 'Libertad Financiera', 'Págate Primero', 'Metas SMART', 'Diario Financiero'],
      en: ['Cashflow Quadrant', 'Financial Freedom', 'Pay Yourself First', 'SMART Goals', 'Financial Journal']
    },
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    id: 'tax',
    tabValue: 'tax',
    icon: <Receipt className="h-8 w-8" />,
    title: { es: '💰 Optimización Fiscal', en: '💰 Tax Optimization' },
    description: { 
      es: 'Maximiza tus deducciones y ahorra en impuestos con herramientas inteligentes.',
      en: 'Maximize your deductions and save on taxes with smart tools.'
    },
    features: {
      es: ['Optimizador de impuestos con IA', 'Calculadora RRSP/TFSA', 'Deducciones CRA', 'Resumen fiscal completo'],
      en: ['AI tax optimizer', 'RRSP/TFSA calculator', 'CRA deductions', 'Complete tax summary']
    },
    color: 'text-green-600',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    id: 'mileage',
    tabValue: 'mileage',
    icon: <MapPin className="h-8 w-8" />,
    title: { es: '🚗 Kilometraje', en: '🚗 Mileage' },
    description: { 
      es: 'Registra viajes de negocios y calcula deducciones automáticamente con tasas CRA 2024.',
      en: 'Track business trips and calculate deductions automatically with CRA 2024 rates.'
    },
    features: {
      es: ['$0.70/km primeros 5,000km', '$0.64/km adicionales', 'Cálculo automático de deducciones'],
      en: ['$0.70/km first 5,000km', '$0.64/km additional', 'Automatic deduction calculation']
    },
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-teal-500'
  },
  {
    id: 'subscriptions',
    tabValue: 'subscriptions',
    icon: <RefreshCw className="h-8 w-8" />,
    title: { es: '🔄 Suscripciones', en: '🔄 Subscriptions' },
    description: { 
      es: 'Detecta automáticamente pagos recurrentes y encuentra oportunidades de ahorro.',
      en: 'Automatically detect recurring payments and find savings opportunities.'
    },
    features: {
      es: ['Detección automática', 'Costo anual total', 'Oportunidades de ahorro', 'Alertas de renovación'],
      en: ['Automatic detection', 'Total annual cost', 'Savings opportunities', 'Renewal alerts']
    },
    color: 'text-pink-600',
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    id: 'fire',
    tabValue: 'fire',
    icon: <TrendingUp className="h-8 w-8" />,
    title: { es: '🔥 Calculadora FIRE', en: '🔥 FIRE Calculator' },
    description: { 
      es: 'Financial Independence, Retire Early. Calcula cuándo podrás retirarte.',
      en: 'Financial Independence, Retire Early. Calculate when you can retire.'
    },
    features: {
      es: ['Número FIRE personalizado', 'Proyecciones Lean/Standard/Fat', 'Años hasta la libertad', 'Ahorro mensual necesario'],
      en: ['Personalized FIRE number', 'Lean/Standard/Fat projections', 'Years to freedom', 'Monthly savings needed']
    },
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    id: 'debt',
    tabValue: 'debt',
    icon: <Landmark className="h-8 w-8" />,
    title: { es: '💳 Gestor de Deudas', en: '💳 Debt Manager' },
    description: { 
      es: 'Estrategias inteligentes para pagar deudas y alcanzar la libertad financiera.',
      en: 'Smart strategies to pay off debt and achieve financial freedom.'
    },
    features: {
      es: ['Método Avalancha', 'Método Bola de Nieve', 'Fecha libre de deudas', 'Ahorro en intereses'],
      en: ['Avalanche method', 'Snowball method', 'Debt-free date', 'Interest savings']
    },
    color: 'text-red-600',
    gradient: 'from-red-500 to-rose-600'
  },
  {
    id: 'portfolio',
    tabValue: 'portfolio',
    icon: <Briefcase className="h-8 w-8" />,
    title: { es: '📈 Portfolio', en: '📈 Portfolio' },
    description: { 
      es: 'Rastrea tus inversiones y recibe recomendaciones personalizadas.',
      en: 'Track your investments and receive personalized recommendations.'
    },
    features: {
      es: ['Acciones, crypto, fondos', 'Rendimiento histórico', 'Distribución de activos', 'Tips personalizados'],
      en: ['Stocks, crypto, funds', 'Historical performance', 'Asset allocation', 'Personalized tips']
    },
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-violet-500'
  },
  {
    id: 'education',
    tabValue: 'education',
    icon: <GraduationCap className="h-8 w-8" />,
    title: { es: '📚 Educación Financiera', en: '📚 Financial Education' },
    description: { 
      es: 'Rastrea tu progreso de lectura y mantén el hábito de aprender.',
      en: 'Track your reading progress and maintain the learning habit.'
    },
    features: {
      es: ['Progreso de lectura', 'Rachas de aprendizaje', 'Recordatorios diarios', 'Estadísticas globales'],
      en: ['Reading progress', 'Learning streaks', 'Daily reminders', 'Global statistics']
    },
    color: 'text-teal-600',
    gradient: 'from-teal-500 to-emerald-500'
  }
];

const STORAGE_KEY = 'control-center-tour-completed';

interface ControlCenterTourProps {
  onTabChange?: (tabValue: string) => void;
}

export function ControlCenterTour({ onTabChange }: ControlCenterTourProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    setHasCompletedTour(completed === 'true');
    
    // Auto-show tour for new users
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onTabChange?.(TOUR_STEPS[nextStep].tabValue);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onTabChange?.(TOUR_STEPS[prevStep].tabValue);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasCompletedTour(true);
    setIsOpen(false);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsOpen(true);
    onTabChange?.(TOUR_STEPS[0].tabValue);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestart}
        className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
      >
        {hasCompletedTour ? (
          <>
            <RotateCcw className="h-4 w-4" />
            {language === 'es' ? 'Repetir Tour' : 'Restart Tour'}
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            {language === 'es' ? 'Iniciar Tour' : 'Start Tour'}
          </>
        )}
      </Button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Tour Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl border-2 animate-in zoom-in-95 duration-300">
          <CardHeader className={`bg-gradient-to-r ${step.gradient} text-white rounded-t-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  {step.icon}
                </div>
                <div>
                  <Badge variant="secondary" className="mb-1 bg-white/20 text-white border-0">
                    {currentStep + 1} / {TOUR_STEPS.length}
                  </Badge>
                  <CardTitle className="text-xl">
                    {step.title[language as 'es' | 'en']}
                  </CardTitle>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-4">
            <Progress value={progress} className="h-2" />
            
            <CardDescription className="text-base text-foreground">
              {step.description[language as 'es' | 'en']}
            </CardDescription>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                {language === 'es' ? 'Características:' : 'Features:'}
              </p>
              <ul className="grid grid-cols-1 gap-2">
                {step.features[language as 'es' | 'en'].map((feature, index) => (
                  <li 
                    key={index}
                    className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2"
                  >
                    <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${step.gradient}`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                {language === 'es' ? 'Saltar tour' : 'Skip tour'}
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {language === 'es' ? 'Anterior' : 'Previous'}
                </Button>
                <Button
                  onClick={handleNext}
                  className={`bg-gradient-to-r ${step.gradient} hover:opacity-90`}
                >
                  {currentStep === TOUR_STEPS.length - 1 ? (
                    language === 'es' ? '¡Completar!' : 'Complete!'
                  ) : (
                    <>
                      {language === 'es' ? 'Siguiente' : 'Next'}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Step indicators */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {TOUR_STEPS.map((s, index) => (
          <button
            key={s.id}
            onClick={() => {
              setCurrentStep(index);
              onTabChange?.(TOUR_STEPS[index].tabValue);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentStep 
                ? `w-8 bg-gradient-to-r ${step.gradient}` 
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </>
  );
}
