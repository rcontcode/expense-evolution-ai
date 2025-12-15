import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { OnboardingAmbientMusic } from '@/components/onboarding/OnboardingAmbientMusic';
import { useAuth } from '@/contexts/AuthContext';
import confetti from 'canvas-confetti';
import { 
  Camera, Receipt, FileText, Calculator, Trophy, GraduationCap,
  BarChart3, BookOpen, Building2, CreditCard, Mic, TrendingUp,
  ChevronLeft, ChevronRight, Sparkles, ArrowRight
} from 'lucide-react';
import evofinzLogo from '@/assets/evofinz-logo.png';

const features = [
  {
    icon: Camera,
    title: 'Captura Inteligente',
    description: 'Fotografía recibos y nuestra IA extrae automáticamente vendor, monto, fecha y categoría.',
    tier: 'Pro',
    gradient: 'from-blue-600 to-teal-500',
    emoji: '📸',
    colors: ['#1e3a5f', '#14b8a6']
  },
  {
    icon: Receipt,
    title: 'Gestión de Gastos e Ingresos',
    description: 'Organiza todas tus transacciones con categorización automática y filtros avanzados.',
    tier: 'Premium',
    gradient: 'from-teal-500 to-emerald-500',
    emoji: '💰',
    colors: ['#14b8a6', '#10b981']
  },
  {
    icon: FileText,
    title: 'Contratos con Análisis IA',
    description: 'Sube contratos y nuestra IA extrae términos de reembolso automáticamente.',
    tier: 'Pro',
    gradient: 'from-amber-500 to-orange-500',
    emoji: '📄',
    colors: ['#f59e0b', '#f97316']
  },
  {
    icon: Calculator,
    title: 'Calculadoras FIRE/RRSP/TFSA',
    description: 'Planifica tu retiro anticipado y optimiza tus contribuciones fiscales canadienses.',
    tier: 'Pro',
    gradient: 'from-blue-500 to-cyan-500',
    emoji: '🧮',
    colors: ['#3b82f6', '#06b6d4']
  },
  {
    icon: Trophy,
    title: 'Gamificación Completa',
    description: 'Gana XP, desbloquea logros y mantén streaks por tus hábitos financieros.',
    tier: 'Premium',
    gradient: 'from-amber-500 to-yellow-400',
    emoji: '🏆',
    colors: ['#f59e0b', '#eab308']
  },
  {
    icon: GraduationCap,
    title: 'Mentoría Kiyosaki/Tracy/Rohn',
    description: 'Sistema de 8 módulos basados en principios de los mejores mentores financieros.',
    tier: 'Pro',
    gradient: 'from-purple-500 to-pink-500',
    emoji: '🎓',
    colors: ['#a855f7', '#ec4899']
  },
  {
    icon: BarChart3,
    title: 'Analytics Avanzados',
    description: '9+ visualizaciones incluyendo heatmaps, sankeys, y proyecciones de flujo de caja.',
    tier: 'Pro',
    gradient: 'from-rose-500 to-red-500',
    emoji: '📊',
    colors: ['#f43f5e', '#ef4444']
  },
  {
    icon: BookOpen,
    title: 'Educación Financiera',
    description: 'Trackea libros, cursos y podcasts con métricas de progreso y curvas de aprendizaje.',
    tier: 'Premium',
    gradient: 'from-green-500 to-emerald-500',
    emoji: '📚',
    colors: ['#22c55e', '#10b981']
  },
  {
    icon: Building2,
    title: 'Análisis Bancario con IA',
    description: 'Sube estados de cuenta y detecta anomalías, suscripciones y patrones de gasto.',
    tier: 'Pro',
    gradient: 'from-cyan-500 to-blue-500',
    emoji: '🏦',
    colors: ['#06b6d4', '#3b82f6']
  },
  {
    icon: CreditCard,
    title: 'Detector de Suscripciones',
    description: 'Identifica automáticamente pagos recurrentes y calcula costos anualizados.',
    tier: 'Premium',
    gradient: 'from-orange-500 to-red-500',
    emoji: '💳',
    colors: ['#f97316', '#ef4444']
  },
  {
    icon: Mic,
    title: 'Asistente de Voz',
    description: 'Dicta gastos por voz y nuestra IA los transcribe y categoriza automáticamente.',
    tier: 'Pro',
    gradient: 'from-violet-500 to-purple-500',
    emoji: '🎤',
    colors: ['#8b5cf6', '#a855f7']
  },
  {
    icon: TrendingUp,
    title: 'Patrimonio Neto',
    description: 'Trackea activos vs pasivos con proyecciones y clasificación Kiyosaki.',
    tier: 'Premium',
    gradient: 'from-emerald-500 to-teal-500',
    emoji: '📈',
    colors: ['#10b981', '#14b8a6']
  }
];

export default function BetaFeatures() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userName, setUserName] = useState('Beta Tester');

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setUserName(user.user_metadata.full_name.split(' ')[0]);
    }
  }, [user]);

  const currentFeature = features[currentIndex];
  const progress = ((currentIndex + 1) / features.length) * 100;

  const triggerConfetti = (colors: string[]) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors
    });
  };

  const handleNext = () => {
    if (currentIndex < features.length - 1) {
      setCurrentIndex(prev => prev + 1);
      triggerConfetti(features[currentIndex + 1].colors);
    } else {
      // Final celebration
      const duration = 2000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#fbbf24', '#f59e0b', '#d97706']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#fbbf24', '#f59e0b', '#d97706']
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      
      setTimeout(() => navigate('/dashboard'), 1500);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    triggerConfetti(currentFeature.colors);
  }, []);

  const Icon = currentFeature.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentFeature.gradient} transition-all duration-700 flex items-center justify-center p-4 overflow-hidden relative`}>
      <OnboardingAmbientMusic />
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-white/20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <img src={evofinzLogo} alt="EvoFinz" className="h-10 w-auto object-contain drop-shadow-lg" />
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="text-white/80 hover:text-white hover:bg-white/20"
          >
            Saltar Tour
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-white/80 text-sm mb-2">
            <span>{userName}, esto está incluido en tu Beta:</span>
            <span className="font-bold">{currentIndex + 1}/{features.length}</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>

        {/* Feature Card */}
        <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl overflow-hidden">
          <div className={`bg-gradient-to-r ${currentFeature.gradient} p-8 text-center relative overflow-hidden`}>
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            
            <div className="relative">
              <div className="text-6xl mb-4">{currentFeature.emoji}</div>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur mb-4">
                <Icon className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
              <Badge className={`ml-3 ${currentFeature.tier === 'Pro' ? 'bg-amber-500' : 'bg-emerald-500'} text-white shadow-lg`}>
                {currentFeature.tier}
              </Badge>
            </div>
          </div>
          
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-3 text-foreground">{currentFeature.title}</h2>
            <p className="text-muted-foreground text-lg mb-6">{currentFeature.description}</p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
              <Sparkles className="h-4 w-4" />
              <span>¡{userName}, esto está incluido en tu Beta!</span>
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="text-white hover:bg-white/20 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Anterior
          </Button>

          {/* Dots */}
          <div className="flex gap-2">
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentIndex(i);
                  triggerConfetti(features[i].colors);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex 
                    ? 'bg-white w-6' 
                    : i < currentIndex 
                      ? 'bg-white/60' 
                      : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            className="bg-white text-foreground hover:bg-white/90 shadow-lg font-bold"
          >
            {currentIndex === features.length - 1 ? (
              <>
                ¡Comenzar!
                <ArrowRight className="h-5 w-5 ml-1" />
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="h-5 w-5 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
