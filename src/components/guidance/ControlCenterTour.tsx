import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  BarChart3, TrendingUp, GraduationCap, Receipt, MapPin, 
  RefreshCw, Landmark, Briefcase, X, ChevronRight, ChevronLeft,
  Sparkles, Play, RotateCcw, PartyPopper
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCelebrationSound } from '@/hooks/utils/useCelebrationSound';

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
      es: ['Predicciones inteligentes', 'Flujo de caja proyectado', 'Rentabilidad por proyecto', 'Correlaciones financieras'],
      en: ['Smart predictions', 'Projected cash flow', 'Project profitability', 'Financial correlations']
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
      es: ['Optimizador fiscal inteligente', 'Calculadora RRSP/TFSA', 'Deducciones CRA', 'Resumen fiscal completo'],
      en: ['Smart tax optimizer', 'RRSP/TFSA calculator', 'CRA deductions', 'Complete tax summary']
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const { playFullCelebration } = useCelebrationSound();

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    setHasCompletedTour(completed === 'true');
    
    // Auto-show tour for new users
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const triggerCelebration = () => {
    // Play celebration sound
    playFullCelebration();
    
    // Fire multiple confetti bursts
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1']
      });
    }, 250);

    // Center burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96e6a1']
    });
  };

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

  const handleComplete = (isFirstCompletion = true) => {
    const wasCompletedBefore = localStorage.getItem(STORAGE_KEY) === 'true';
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasCompletedTour(true);
    
    // Only celebrate on first-ever completion
    if (!wasCompletedBefore && isFirstCompletion) {
      setShowCelebration(true);
      triggerCelebration();
      
      // Hide celebration after animation
      setTimeout(() => {
        setShowCelebration(false);
        setIsOpen(false);
      }, 4000);
    } else {
      setIsOpen(false);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsOpen(true);
    onTabChange?.(TOUR_STEPS[0].tabValue);
  };

  const handleSkip = () => {
    handleComplete(false); // No celebration when skipping
  };

  const handleElegantClose = () => {
    setIsExiting(true);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setShowCelebration(false);
      setIsOpen(false);
      setIsExiting(false);
    }, 700);
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

  // Generate floating particles
  const goldenParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 4,
    size: 4 + Math.random() * 8,
    type: Math.random() > 0.5 ? 'circle' : 'star',
  }));

  // Show celebration screen with elegant exit animation
  if (showCelebration || isExiting) {
    return (
      <>
        {/* Overlay with fade effect */}
        <div 
          className={`fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-700 ${
            isExiting ? 'opacity-0' : 'opacity-100'
          }`} 
        />
        
        {/* Floating Golden Particles */}
        {!isExiting && (
          <div className="fixed inset-0 z-45 pointer-events-none overflow-hidden">
            {goldenParticles.map((particle) => (
              <div
                key={particle.id}
                className="absolute animate-float-particle"
                style={{
                  left: `${particle.left}%`,
                  bottom: '-20px',
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                }}
              >
                {particle.type === 'star' ? (
                  <svg 
                    width={particle.size} 
                    height={particle.size} 
                    viewBox="0 0 24 24" 
                    fill="none"
                    className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  >
                    <path 
                      d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" 
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  <div 
                    className="rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                    style={{ 
                      width: particle.size, 
                      height: particle.size,
                    }}
                  />
                )}
              </div>
            ))}
            
            {/* Sparkle bursts */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`sparkle-${i}`}
                className="absolute animate-sparkle-burst"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                  animationDelay: `${i * 0.4}s`,
                }}
              >
                <Sparkles className="h-6 w-6 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,1)]" />
              </div>
            ))}
          </div>
        )}
        
        {/* Celebration Card with elegant transitions */}
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-700 ${
          isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}>
          {/* Golden pulsing glow wrapper */}
          <div className={`relative ${isExiting ? '' : 'animate-glow-pulse'}`}>
            {/* Outer glow rings */}
            {!isExiting && (
              <>
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/30 via-yellow-300/40 to-amber-400/30 rounded-2xl blur-xl animate-pulse" />
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 via-orange-400/30 to-amber-500/20 rounded-xl blur-md animate-[pulse_1.5s_ease-in-out_infinite]" />
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/40 to-orange-400/40 rounded-lg blur-sm animate-[pulse_2s_ease-in-out_infinite_0.5s]" />
              </>
            )}
            
            <Card className={`relative w-full max-w-md shadow-2xl border-2 border-amber-400 transition-all duration-700 ${
              isExiting 
                ? 'translate-y-8 blur-sm' 
                : 'animate-in zoom-in-95 duration-500'
            }`}
            style={{
              boxShadow: isExiting ? undefined : '0 0 30px rgba(251, 191, 36, 0.5), 0 0 60px rgba(251, 191, 36, 0.3), 0 0 90px rgba(251, 191, 36, 0.1)'
            }}>
            <CardHeader className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-t-lg text-center py-8 overflow-hidden relative">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -skew-x-12" />
              
              <div className="relative flex justify-center mb-4">
                <div className={`p-4 bg-white/20 rounded-full ${isExiting ? '' : 'animate-bounce'}`}>
                  <PartyPopper className="h-12 w-12" />
                </div>
              </div>
              <CardTitle className="relative text-3xl mb-2">
                {language === 'es' ? '🎉 ¡Felicidades!' : '🎉 Congratulations!'}
              </CardTitle>
              <CardDescription className="relative text-white/90 text-lg">
                {language === 'es' 
                  ? '¡Has completado el tour del Centro de Control!' 
                  : 'You have completed the Control Center tour!'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6 text-center space-y-4">
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  {language === 'es' 
                    ? 'Ahora conoces todas las herramientas disponibles para gestionar tus finanzas.' 
                    : 'Now you know all the tools available to manage your finances.'}
                </p>
                <p className="text-muted-foreground">
                  {language === 'es' 
                    ? '¡Explora cada módulo y comienza a tomar el control de tu futuro financiero!' 
                    : 'Explore each module and start taking control of your financial future!'}
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 py-4">
                <Badge className="bg-blue-500/20 text-blue-700 border-blue-300 transition-all hover:scale-110">📊 Gráficos</Badge>
                <Badge className="bg-purple-500/20 text-purple-700 border-purple-300 transition-all hover:scale-110">🔍 Análisis</Badge>
                <Badge className="bg-amber-500/20 text-amber-700 border-amber-300 transition-all hover:scale-110">🧠 Mentoría</Badge>
                <Badge className="bg-green-500/20 text-green-700 border-green-300 transition-all hover:scale-110">💰 Impuestos</Badge>
                <Badge className="bg-orange-500/20 text-orange-700 border-orange-300 transition-all hover:scale-110">🔥 FIRE</Badge>
              </div>
              
              <Button
                onClick={handleElegantClose}
                disabled={isExiting}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-lg py-6 transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-70"
              >
                <Sparkles className={`h-5 w-5 mr-2 ${isExiting ? '' : 'animate-pulse'}`} />
                {language === 'es' ? '¡Comenzar a explorar!' : 'Start exploring!'}
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </>
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
