import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { 
  Crown, Sparkles, Zap, ArrowRight, Check, Lock, 
  TrendingUp, Camera, Users, FolderOpen, FileText, 
  Brain, Calculator, Mic, Receipt 
} from 'lucide-react';
import { PlanType, PLAN_LIMITS } from '@/hooks/data/usePlanLimits';
import { useLanguage } from '@/contexts/LanguageContext';

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
    color: 'from-slate-500 to-slate-600',
    icon: Zap,
  },
  premium: {
    name: 'Premium',
    price: '$6.99',
    color: 'from-amber-500 via-orange-500 to-red-500',
    icon: Sparkles,
  },
  pro: {
    name: 'Pro',
    price: '$14.99',
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

const upgradeReasons: Record<string, { title: string; benefits: string[] }> = {
  expenses: {
    title: '¡Has alcanzado el límite de gastos!',
    benefits: [
      'Gastos ilimitados con Premium',
      'Mejor control de tu flujo de caja',
      'Reportes más completos para impuestos',
    ],
  },
  incomes: {
    title: '¡Has alcanzado el límite de ingresos!',
    benefits: [
      'Ingresos ilimitados con Premium',
      'Tracking completo de todas tus fuentes',
      'Análisis de rentabilidad por cliente',
    ],
  },
  ocr: {
    title: '¡Has usado todos tus escaneos OCR!',
    benefits: [
      '50 escaneos/mes con Premium',
      'OCR ilimitado con Pro',
      'Captura recibos sin límites',
    ],
  },
  clients: {
    title: '¡Has alcanzado el límite de clientes!',
    benefits: [
      'Clientes ilimitados con Premium',
      'Gestiona todos tus contratos',
      'Reportes de reembolso profesionales',
    ],
  },
  projects: {
    title: '¡Has alcanzado el límite de proyectos!',
    benefits: [
      'Proyectos ilimitados con Premium',
      'Organiza gastos por proyecto',
      'Tracking de rentabilidad',
    ],
  },
  contracts: {
    title: 'Análisis de contratos es Pro',
    benefits: [
      'Extracción automática de términos',
      'Sugerencias de gastos reembolsables',
      'Alertas de vencimiento',
    ],
  },
  mileage: {
    title: 'Mileage Tracking es Premium',
    benefits: [
      'Registro de kilómetros por viaje',
      'Cálculo automático CRA ($0.70/km)',
      'Mapas visuales de rutas',
    ],
  },
  gamification: {
    title: 'Gamificación es Premium',
    benefits: [
      'Gana XP por buenos hábitos',
      'Desbloquea logros y badges',
      'Mantén rachas motivadoras',
    ],
  },
  net_worth: {
    title: 'Net Worth Tracker es Premium',
    benefits: [
      'Tracking de activos y pasivos',
      'Evolución de patrimonio mensual',
      'Metas de patrimonio neto',
    ],
  },
  fire_calculator: {
    title: 'FIRE Calculator es Pro',
    benefits: [
      'Calcula tu número FIRE',
      'Proyección de independencia financiera',
      'Simulaciones de retiro anticipado',
    ],
  },
  mentorship: {
    title: 'Mentoría completa es Pro',
    benefits: [
      '8 componentes de mentoría',
      'Principios Kiyosaki y Tracy',
      'Cuadrante de flujo de caja',
    ],
  },
  voice_assistant: {
    title: 'Asistente de Voz es Pro',
    benefits: [
      'Dicta gastos con tu voz',
      'Consultas naturales',
      'Manos libres total',
    ],
  },
  tax_optimizer: {
    title: 'Optimizador Fiscal es Pro',
    benefits: [
      'Sugerencias de deducciones',
      'Maximiza tu retorno CRA',
      'Alertas de oportunidades',
    ],
  },
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
  
  const targetPlan = requiredPlan || (currentPlan === 'free' ? 'premium' : 'pro');
  const targetDetails = planDetails[targetPlan];
  const currentDetails = planDetails[currentPlan];
  const Icon = featureIcons[feature] || Receipt;
  const reasons = upgradeReasons[feature] || upgradeReasons.expenses;

  const handleUpgrade = () => {
    onClose();
    // TODO: Navigate to pricing/checkout when Stripe is integrated
    navigate('/settings?tab=subscription');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${targetDetails.color}`}>
              <Lock className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-xl">{reasons.title}</DialogTitle>
          </div>
          <DialogDescription>
            Desbloquea más poder con {targetDetails.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Usage Progress (if applicable) */}
          {usageType && limit > 0 && (
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  Uso este mes
                </span>
                <span className="text-sm text-muted-foreground">
                  {currentUsage} / {limit}
                </span>
              </div>
              <Progress value={(currentUsage / limit) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Reinicia el 1° de cada mes
              </p>
            </Card>
          )}

          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Con {targetDetails.name} obtienes:
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

          {/* Plan Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Current Plan */}
            <Card className="p-4 border-2 border-muted">
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Tu plan actual</Badge>
                <p className="font-bold text-lg">{currentDetails.name}</p>
                <p className="text-2xl font-black text-muted-foreground">{currentDetails.price}</p>
                <p className="text-xs text-muted-foreground">/mes</p>
              </div>
            </Card>

            {/* Upgrade Plan */}
            <Card className={`p-4 border-2 border-transparent bg-gradient-to-br ${targetDetails.color} text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl" />
              <div className="text-center relative">
                <Badge className="mb-2 bg-white/20 text-white border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Recomendado
                </Badge>
                <p className="font-bold text-lg">{targetDetails.name}</p>
                <p className="text-2xl font-black">{targetDetails.price}</p>
                <p className="text-xs text-white/80">/mes</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleUpgrade}
            className={`w-full py-6 font-bold bg-gradient-to-r ${targetDetails.color} hover:opacity-90 text-white`}
          >
            <Crown className="h-5 w-5 mr-2" />
            Actualizar a {targetDetails.name}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            Quizás después
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
        <Badge variant="secondary" className="text-xs">
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
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Progress 
          value={Math.min(percentage, 100)} 
          className={`h-2 flex-1 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-amber-500' : ''}`}
        />
        {isAtLimit && onUpgrade && (
          <Button size="sm" variant="outline" onClick={onUpgrade} className="text-xs h-6 px-2">
            <Zap className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        )}
      </div>
    </div>
  );
}
