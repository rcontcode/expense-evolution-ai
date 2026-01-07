import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { 
  Crown, Sparkles, Zap, ArrowRight, Check, Lock, 
  TrendingUp, Camera, Users, FolderOpen, FileText, 
  Brain, Calculator, Mic, Receipt, PartyPopper, Heart,
  Rocket, Gift, Star, Trophy, Target, Flame, Clock,
  AlertCircle, Lightbulb
} from 'lucide-react';
import { PlanType, PLAN_LIMITS } from '@/hooks/data/usePlanLimits';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import confetti from 'canvas-confetti';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  currentPlan: PlanType;
  requiredPlan?: PlanType;
  usageType?: 'expenses' | 'incomes' | 'ocr' | 'clients' | 'projects';
  currentUsage?: number;
  limit?: number;
}

const planDetails = {
  free: {
    name: 'Free',
    price: '$0',
    priceAnnual: '$0',
    color: 'from-slate-500 to-slate-600',
    icon: Zap,
  },
  premium: {
    name: 'Premium',
    price: '$6.99',
    priceAnnual: '$5.59',
    color: 'from-amber-500 via-orange-500 to-red-500',
    icon: Sparkles,
  },
  pro: {
    name: 'Pro',
    price: '$14.99',
    priceAnnual: '$11.99',
    color: 'from-violet-600 via-purple-600 to-indigo-600',
    icon: Crown,
  },
};

const featureIcons: Record<string, typeof Camera> = {
  expenses: Receipt,
  incomes: TrendingUp,
  ocr: Camera,
  clients: Users,
  projects: FolderOpen,
  contracts: FileText,
  mentorship: Brain,
  fire_calculator: Calculator,
  voice_assistant: Mic,
};

// Mensajes amigables y motivacionales por tipo de límite
const friendlyMessages: Record<string, {
  celebration: string;
  encouragement: string;
  tip: string;
  alternative: string;
  fomo: string;
}> = {
  expenses: {
    celebration: '¡Wow! Has registrado 50 gastos este mes 🎉',
    encouragement: 'Eso demuestra que estás tomando el control de tus finanzas como un profesional.',
    tip: '💡 Tip: Los usuarios Premium deducen en promedio $2,400 más al año en impuestos.',
    alternative: 'Mientras decides, puedes exportar tus gastos actuales o esperar al próximo mes.',
    fomo: '📈 847 usuarios se actualizaron esta semana para no perder ni un recibo.',
  },
  incomes: {
    celebration: '¡Increíble! Ya tienes 20 fuentes de ingreso registradas 💰',
    encouragement: 'Múltiples fuentes de ingreso = libertad financiera. ¡Vas muy bien!',
    tip: '💡 Tip: Los usuarios Premium identifican en promedio 3 oportunidades de ingreso pasivo adicionales.',
    alternative: 'Puedes editar ingresos existentes o consolidar algunos para liberar espacio.',
    fomo: '🚀 El 78% de usuarios Pro tienen más de 5 fuentes de ingreso activas.',
  },
  ocr: {
    celebration: '¡Has capturado 5 recibos con IA este mes! 📸',
    encouragement: 'Capturar recibos es la clave para maximizar deducciones fiscales.',
    tip: '💡 Tip: Los usuarios Pro capturan 4x más recibos y deducen hasta $4,000 extra.',
    alternative: 'Puedes agregar gastos manualmente mientras tanto - ¡también cuenta!',
    fomo: '⚡ Los usuarios Pro procesan 127 recibos/mes en promedio.',
  },
  clients: {
    celebration: '¡Ya tienes 2 clientes registrados! 👥',
    encouragement: 'Gestionar clientes profesionalmente es señal de un negocio en crecimiento.',
    tip: '💡 Tip: Los usuarios Premium generan reportes de reembolso que impresionan a sus clientes.',
    alternative: 'Puedes asignar gastos a clientes existentes o esperar para agregar más.',
    fomo: '🏆 El freelancer promedio en Premium gestiona 8 clientes activos.',
  },
  projects: {
    celebration: '¡Tienes 2 proyectos en marcha! 🎯',
    encouragement: 'Organizar por proyecto te da claridad total sobre la rentabilidad.',
    tip: '💡 Tip: Los usuarios Premium descubren qué proyectos realmente les generan ganancias.',
    alternative: 'Consolida proyectos pequeños o cierra los completados para liberar espacio.',
    fomo: '📊 El 92% de usuarios Premium saben exactamente cuánto ganan por proyecto.',
  },
  contracts: {
    celebration: '¡Tienes contratos que analizar! 📄',
    encouragement: 'Entender tus contratos previene sorpresas y maximiza reembolsos.',
    tip: '💡 Tip: La IA Pro extrae automáticamente términos de reembolso que muchos pasan por alto.',
    alternative: 'Puedes revisar tus contratos manualmente o guardarlos para después.',
    fomo: '💼 Los usuarios Pro recuperan $890/año en reembolsos que no sabían que podían reclamar.',
  },
  mileage: {
    celebration: '¡El tracking de kilometraje te espera! 🚗',
    encouragement: 'Cada kilómetro que registras es dinero en tu bolsillo fiscal.',
    tip: '💡 Tip: A $0.70/km, 100km semanales = $3,640 en deducciones anuales.',
    alternative: 'Puedes anotar tus viajes en notas de gastos por ahora.',
    fomo: '🛣️ Los usuarios Premium deducen $2,800/año promedio solo en kilometraje.',
  },
  net_worth: {
    celebration: '¡Tu patrimonio neto te está esperando! 📈',
    encouragement: 'Conocer tu net worth es el primer paso hacia la libertad financiera.',
    tip: '💡 Tip: Los usuarios que trackean su patrimonio lo incrementan 23% más rápido.',
    alternative: 'Puedes empezar listando tus activos en las notas mientras tanto.',
    fomo: '🎯 El patrimonio promedio de usuarios Premium crece $840/mes.',
  },
  fire_calculator: {
    celebration: '¡La independencia financiera te llama! 🔥',
    encouragement: 'Calcular tu número FIRE es planificar tu libertad.',
    tip: '💡 Tip: El 34% de usuarios Pro alcanzarán FIRE 5 años antes de lo planeado.',
    alternative: 'Puedes usar calculadoras online básicas mientras tanto.',
    fomo: '🏖️ Los usuarios Pro planifican su retiro anticipado con precisión.',
  },
  mentorship: {
    celebration: '¡La sabiduría financiera te espera! 🧠',
    encouragement: 'Aprender de los mejores acelera tu camino al éxito.',
    tip: '💡 Tip: Los principios de Kiyosaki han transformado la mentalidad de miles.',
    alternative: 'Tienes acceso a 4 componentes de mentoría gratuitos - ¡úsalos!',
    fomo: '📚 El 89% de usuarios Pro reportan cambios positivos en su mentalidad financiera.',
  },
  voice_assistant: {
    celebration: '¡El asistente de voz te simplificaría la vida! 🎤',
    encouragement: 'Dictar gastos es 5x más rápido que escribirlos.',
    tip: '💡 Tip: Los usuarios Pro registran gastos incluso mientras manejan.',
    alternative: 'La entrada manual funciona bien - el asistente es para máxima velocidad.',
    fomo: '⏱️ Los usuarios Pro ahorran 15 minutos diarios con entrada por voz.',
  },
  tax_optimizer: {
    celebration: '¡El optimizador fiscal maximizaría tus deducciones! 💎',
    encouragement: 'La IA encuentra deducciones que los humanos pasamos por alto.',
    tip: '💡 Tip: El promedio de deducciones adicionales encontradas es de $3,200/año.',
    alternative: 'Revisa manualmente las categorías de gastos para no perder deducciones.',
    fomo: '💰 Los usuarios Pro pagan 18% menos impuestos en promedio.',
  },
  gamification: {
    celebration: '¡La gamificación haría tu viaje más divertido! 🎮',
    encouragement: 'Ganar XP y badges mantiene la motivación alta.',
    tip: '💡 Tip: Los usuarios con gamificación mantienen hábitos financieros 4x más tiempo.',
    alternative: 'Puedes crear tu propio sistema de metas en las notas.',
    fomo: '🏅 Los usuarios Premium tienen rachas promedio de 45 días.',
  },
};

const upgradeReasons: Record<string, { title: string; benefits: string[] }> = {
  expenses: {
    title: '¡Momento de subir de nivel!',
    benefits: [
      'Gastos ilimitados - nunca más te quedarás corto',
      'Reportes fiscales automáticos y profesionales',
      'Sugerencias inteligentes de categorización',
    ],
  },
  incomes: {
    title: '¡Tu negocio está creciendo!',
    benefits: [
      'Ingresos ilimitados para todas tus fuentes',
      'Análisis de rentabilidad por cliente',
      'Proyecciones de flujo de caja',
    ],
  },
  ocr: {
    title: '¡Tus recibos necesitan más poder!',
    benefits: [
      '50 escaneos/mes con Premium o ilimitados con Pro',
      'Extracción automática de datos con IA',
      'Organización inteligente por categoría',
    ],
  },
  clients: {
    title: '¡Tu cartera de clientes crece!',
    benefits: [
      'Clientes ilimitados para tu negocio',
      'Reportes de reembolso profesionales',
      'Historial completo por cliente',
    ],
  },
  projects: {
    title: '¡Más proyectos, más éxito!',
    benefits: [
      'Proyectos ilimitados para organizarte',
      'Tracking de rentabilidad por proyecto',
      'Presupuestos y alertas automáticas',
    ],
  },
  contracts: {
    title: '¡Análisis de contratos inteligente!',
    benefits: [
      'Extracción automática de términos clave',
      'Identificación de gastos reembolsables',
      'Alertas de renovación y vencimiento',
    ],
  },
  mileage: {
    title: '¡Cada kilómetro cuenta!',
    benefits: [
      'Registro automático de rutas',
      'Cálculo CRA a $0.70/km',
      'Mapas visuales de tus viajes',
    ],
  },
  gamification: {
    title: '¡Finanzas divertidas!',
    benefits: [
      'Sistema de XP y niveles',
      'Badges y logros desbloqueables',
      'Rachas motivadoras',
    ],
  },
  net_worth: {
    title: '¡Conoce tu patrimonio!',
    benefits: [
      'Tracking de activos y pasivos',
      'Gráficos de evolución mensual',
      'Metas de patrimonio neto',
    ],
  },
  fire_calculator: {
    title: '¡Planifica tu libertad!',
    benefits: [
      'Calcula tu número FIRE personalizado',
      'Simulaciones de escenarios',
      'Plan de retiro anticipado',
    ],
  },
  mentorship: {
    title: '¡Sabiduría financiera completa!',
    benefits: [
      '8 componentes de mentoría',
      'Principios Kiyosaki y Brian Tracy',
      'Cuadrante de flujo de caja interactivo',
    ],
  },
  voice_assistant: {
    title: '¡Habla y registra!',
    benefits: [
      'Dicta gastos con tu voz',
      'Consultas en lenguaje natural',
      'Perfecto para el día a día',
    ],
  },
  tax_optimizer: {
    title: '¡Maximiza tus deducciones!',
    benefits: [
      'Sugerencias personalizadas de la IA',
      'Identificación de oportunidades fiscales',
      'Optimización para tu provincia',
    ],
  },
};

// Animación de celebración
const triggerCelebration = () => {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#f59e0b', '#8b5cf6', '#ec4899'],
  });
};

export function UpgradePrompt({
  isOpen,
  onClose,
  feature = 'expenses',
  currentPlan,
  requiredPlan,
  usageType,
  currentUsage = 0,
  limit = 0,
}: UpgradePromptProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const [showAnnual, setShowAnnual] = useState(false);
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false);
  
  const userName = profile?.full_name?.split(' ')[0] || 'Campeón';
  const targetPlan = requiredPlan || (currentPlan === 'free' ? 'premium' : 'pro');
  const targetDetails = planDetails[targetPlan];
  const currentDetails = planDetails[currentPlan];
  const Icon = featureIcons[feature] || Receipt;
  const reasons = upgradeReasons[feature] || upgradeReasons.expenses;
  const friendly = friendlyMessages[feature] || friendlyMessages.expenses;

  // Celebrar el logro al abrir
  useEffect(() => {
    if (isOpen && !hasTriggeredCelebration && usageType) {
      triggerCelebration();
      setHasTriggeredCelebration(true);
    }
    if (!isOpen) {
      setHasTriggeredCelebration(false);
    }
  }, [isOpen, hasTriggeredCelebration, usageType]);

  const handleUpgrade = () => {
    onClose();
    navigate('/settings?tab=subscription');
  };

  const displayPrice = showAnnual ? targetDetails.priceAnnual : targetDetails.price;
  const savingsPercent = showAnnual ? 20 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden">
        {/* Celebratory Header */}
        <DialogHeader className="relative">
          <div className="absolute -top-4 -right-4 text-6xl opacity-20 pointer-events-none">
            <PartyPopper />
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${targetDetails.color} animate-pulse`}>
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                ¡Felicidades, {userName}! 
                <span className="text-2xl">🎉</span>
              </DialogTitle>
              <DialogDescription className="text-left">
                {friendly.celebration}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Encouragement Message */}
          <Card className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {friendly.encouragement}
                </p>
              </div>
            </div>
          </Card>

          {/* Usage Progress with celebration */}
          {usageType && limit > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="relative">
                <Icon className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Meta del mes alcanzada</span>
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                    <Star className="h-3 w-3 mr-1" />
                    {currentUsage}/{limit}
                  </Badge>
                </div>
                <Progress value={100} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
              </div>
            </div>
          )}

          {/* Smart Tip */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {friendly.tip}
            </p>
          </div>

          {/* What you get with upgrade */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              {reasons.title}
            </h4>
            <ul className="space-y-2">
              {reasons.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className={`p-1 rounded-full bg-gradient-to-r ${targetDetails.color} flex-shrink-0 mt-0.5`}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* FOMO - Social Proof */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>{friendly.fomo}</span>
          </div>

          {/* Pricing Toggle */}
          <Card className={`p-4 border-2 bg-gradient-to-br ${targetDetails.color} text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            
            {/* Annual/Monthly Toggle */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={() => setShowAnnual(false)}
                className={`text-xs px-3 py-1 rounded-full transition-all ${!showAnnual ? 'bg-white/30' : 'bg-white/10'}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setShowAnnual(true)}
                className={`text-xs px-3 py-1 rounded-full transition-all flex items-center gap-1 ${showAnnual ? 'bg-white/30' : 'bg-white/10'}`}
              >
                Anual
                <Badge className="bg-green-500 text-white text-[10px] px-1 py-0">
                  -20%
                </Badge>
              </button>
            </div>

            <div className="text-center relative">
              <p className="font-bold text-lg opacity-90">{targetDetails.name}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black">{displayPrice}</span>
                <span className="text-sm opacity-80">/mes</span>
              </div>
              {showAnnual && (
                <p className="text-xs mt-1 opacity-80">
                  Facturado anualmente (ahorras 20%)
                </p>
              )}
            </div>
          </Card>

          {/* Alternative while deciding */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                Mientras decides:
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                {friendly.alternative}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Button 
            onClick={handleUpgrade}
            size="lg"
            className={`w-full font-bold bg-gradient-to-r ${targetDetails.color} hover:opacity-90 text-white shadow-lg`}
          >
            <Gift className="h-5 w-5 mr-2" />
            Desbloquear {targetDetails.name}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Cancela cuando quieras
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Sin contratos
            </span>
          </div>
          
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground text-sm">
            Continuar con Free por ahora
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact inline upgrade badge for use within components
interface UpgradeBadgeProps {
  requiredPlan: PlanType;
  feature: string;
  onClick?: () => void;
}

export function UpgradeBadge({ requiredPlan, feature, onClick }: UpgradeBadgeProps) {
  const details = planDetails[requiredPlan];
  
  return (
    <Badge 
      className={`cursor-pointer bg-gradient-to-r ${details.color} text-white border-0 hover:opacity-90 transition-opacity`}
      onClick={onClick}
    >
      <Lock className="h-3 w-3 mr-1" />
      {details.name}
    </Badge>
  );
}

// Usage bar component for dashboard
interface UsageBarProps {
  label: string;
  current: number;
  limit: number | 'unlimited';
  icon?: typeof Camera;
  onUpgrade?: () => void;
}

export function UsageBar({ label, current, limit, icon: Icon = Receipt, onUpgrade }: UsageBarProps) {
  if (limit === 'unlimited') {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <Badge variant="secondary" className="text-xs bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600">
          <Sparkles className="h-3 w-3 mr-1" />
          Ilimitado
        </Badge>
      </div>
    );
  }

  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <span className={`font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-amber-500' : ''}`}>
          {current} / {limit}
          {isNearLimit && !isAtLimit && ' 🔥'}
          {isAtLimit && ' ⭐'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Progress 
          value={Math.min(percentage, 100)} 
          className={`h-2 flex-1 ${isAtLimit ? '[&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500' : isNearLimit ? '[&>div]:bg-amber-500' : ''}`}
        />
        {isAtLimit && onUpgrade && (
          <Button size="sm" variant="outline" onClick={onUpgrade} className="text-xs h-6 px-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10">
            <Rocket className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        )}
        {isNearLimit && !isAtLimit && (
          <span className="text-xs text-amber-500">¡Casi!</span>
        )}
      </div>
    </div>
  );
}
