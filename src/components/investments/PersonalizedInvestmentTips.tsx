import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFinancialProfile } from '@/hooks/data/useFinancialProfile';
import { useInvestmentGoals, InvestmentGoal } from '@/hooks/data/useInvestmentGoals';
import { 
  Lightbulb, 
  TrendingUp, 
  Bitcoin, 
  Shield, 
  Target,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  Building2,
  PiggyBank,
  BarChart3,
  Gem,
  ChevronRight,
  Flame,
  Clock,
  Wallet,
  TrendingDown,
  Rocket,
  Heart,
  Briefcase,
  Home,
  Car,
  Plane,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Tip {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action?: {
    label: string;
    path: string;
  };
  category: 'beginner' | 'intermediate' | 'advanced' | 'all';
  interests?: string[];
  goalTypes?: string[];
}

const ALL_TIPS: Tip[] = [
  // Beginner tips
  {
    id: 'emergency_fund',
    title: 'Construye tu fondo de emergencia',
    description: 'Antes de invertir, asegúrate de tener 3-6 meses de gastos guardados. Es tu colchón de seguridad.',
    icon: Shield,
    color: 'text-blue-500',
    action: { label: 'Ver patrimonio', path: '/net-worth' },
    category: 'beginner',
  },
  {
    id: 'track_expenses',
    title: 'Conoce a dónde va tu dinero',
    description: 'El primer paso para invertir es entender tus gastos. Revisa tus categorías de gasto mensual.',
    icon: BarChart3,
    color: 'text-green-500',
    action: { label: 'Ver gastos', path: '/expenses' },
    category: 'beginner',
  },
  {
    id: 'start_small',
    title: 'Comienza con poco, pero comienza',
    description: 'No necesitas miles para empezar. Incluso $50/mes en ETFs puede crecer significativamente con el tiempo.',
    icon: Sparkles,
    color: 'text-purple-500',
    category: 'beginner',
  },
  {
    id: 'pay_yourself_first',
    title: 'Págate a ti mismo primero',
    description: 'Automatiza tus inversiones. Transfiere dinero a inversiones antes de gastar en otras cosas.',
    icon: Wallet,
    color: 'text-emerald-500',
    category: 'beginner',
  },
  // Crypto tips
  {
    id: 'crypto_dca',
    title: 'Usa DCA para crypto',
    description: 'Dollar-Cost Averaging reduce el riesgo de timing. Compra pequeñas cantidades regularmente en lugar de todo de golpe.',
    icon: Bitcoin,
    color: 'text-amber-500',
    category: 'all',
    interests: ['crypto'],
  },
  {
    id: 'crypto_security',
    title: 'Protege tus crypto',
    description: 'Considera una hardware wallet para holdings grandes. "Not your keys, not your coins."',
    icon: Shield,
    color: 'text-amber-500',
    category: 'intermediate',
    interests: ['crypto'],
  },
  {
    id: 'crypto_allocation',
    title: 'Limita tu exposición crypto',
    description: 'Los expertos sugieren máximo 5-10% del portafolio en crypto debido a su alta volatilidad.',
    icon: AlertTriangle,
    color: 'text-amber-500',
    category: 'beginner',
    interests: ['crypto'],
  },
  {
    id: 'crypto_research',
    title: 'DYOR: Investiga antes de comprar',
    description: 'No sigas consejos ciegamente. Lee whitepapers, entiende el proyecto y su utilidad real.',
    icon: BookOpen,
    color: 'text-amber-500',
    category: 'intermediate',
    interests: ['crypto'],
  },
  // Stocks tips
  {
    id: 'stocks_diversify',
    title: 'Diversifica con ETFs',
    description: 'En lugar de elegir acciones individuales, los ETFs como VTI o XIU te dan diversificación instantánea.',
    icon: TrendingUp,
    color: 'text-green-500',
    category: 'beginner',
    interests: ['stocks', 'etf'],
  },
  {
    id: 'stocks_dividends',
    title: 'Considera acciones de dividendos',
    description: 'Las acciones que pagan dividendos pueden generar ingresos pasivos mientras crece tu capital.',
    icon: PiggyBank,
    color: 'text-green-500',
    category: 'intermediate',
    interests: ['stocks'],
  },
  {
    id: 'stocks_long_term',
    title: 'Invierte a largo plazo',
    description: 'El tiempo en el mercado supera el timing del mercado. Mantén tus inversiones por años, no meses.',
    icon: Clock,
    color: 'text-green-500',
    category: 'beginner',
    interests: ['stocks'],
  },
  {
    id: 'stocks_volatility',
    title: 'La volatilidad es tu amiga',
    description: 'Las caídas del mercado son oportunidades de compra si tienes un horizonte largo.',
    icon: TrendingDown,
    color: 'text-green-500',
    category: 'intermediate',
    interests: ['stocks'],
  },
  // Real estate tips
  {
    id: 'real_estate_reits',
    title: 'REITs: Bienes raíces sin comprar propiedades',
    description: 'Los REITs te permiten invertir en bienes raíces con pequeñas cantidades y alta liquidez.',
    icon: Building2,
    color: 'text-blue-500',
    category: 'intermediate',
    interests: ['real_estate'],
  },
  {
    id: 'real_estate_leverage',
    title: 'El poder del apalancamiento inmobiliario',
    description: 'Con 20% de enganche puedes controlar una propiedad completa. El inquilino paga tu hipoteca.',
    icon: Home,
    color: 'text-blue-500',
    category: 'advanced',
    interests: ['real_estate'],
  },
  // Retirement tips
  {
    id: 'retirement_tfsa',
    title: 'Maximiza tu TFSA primero',
    description: 'En Canadá, el TFSA crece libre de impuestos. Es ideal para inversiones de largo plazo.',
    icon: Target,
    color: 'text-purple-500',
    category: 'beginner',
    interests: ['retirement'],
  },
  {
    id: 'retirement_rrsp',
    title: 'RRSP para reducir impuestos ahora',
    description: 'Si estás en un bracket alto, el RRSP reduce tu ingreso gravable y difiere impuestos.',
    icon: Gem,
    color: 'text-purple-500',
    category: 'intermediate',
    interests: ['retirement'],
  },
  // Goal-based tips
  {
    id: 'goal_passive_income',
    title: 'Ingreso pasivo: La clave de la libertad',
    description: 'Enfócate en activos que generen flujo de efectivo: dividendos, rentas, royalties.',
    icon: Flame,
    color: 'text-orange-500',
    category: 'all',
    goalTypes: ['passive_income'],
  },
  {
    id: 'goal_passive_diversify',
    title: 'Diversifica tus fuentes de ingreso pasivo',
    description: 'No dependas de una sola fuente. Combina dividendos, rentas y negocios automatizados.',
    icon: Briefcase,
    color: 'text-orange-500',
    category: 'intermediate',
    goalTypes: ['passive_income'],
  },
  {
    id: 'goal_fire_aggressive',
    title: 'FIRE: Ahorra agresivamente',
    description: 'Para retirarte temprano, apunta a ahorrar 50%+ de tus ingresos e invertir la diferencia.',
    icon: Rocket,
    color: 'text-red-500',
    category: 'intermediate',
    goalTypes: ['early_retirement', 'financial_independence'],
  },
  {
    id: 'goal_fire_withdrawal',
    title: 'La regla del 4%',
    description: 'Necesitas 25x tus gastos anuales para retirarte. Retira 4% anual para vivir indefinidamente.',
    icon: Target,
    color: 'text-red-500',
    category: 'intermediate',
    goalTypes: ['early_retirement', 'financial_independence'],
  },
  {
    id: 'goal_house_saving',
    title: 'Para tu casa: FHSA + TFSA',
    description: 'En Canadá usa FHSA (libre de impuestos para primera casa) + TFSA para maximizar ahorro.',
    icon: Home,
    color: 'text-teal-500',
    category: 'beginner',
    goalTypes: ['house', 'property'],
  },
  {
    id: 'goal_education',
    title: 'RESP para educación',
    description: 'El gobierno aporta 20% en grants hasta $500/año. Dinero gratis para educación.',
    icon: GraduationCap,
    color: 'text-indigo-500',
    category: 'beginner',
    goalTypes: ['education'],
  },
  {
    id: 'goal_travel',
    title: 'Fondo de viajes separado',
    description: 'Mantén un fondo específico para viajes. No toques tus inversiones a largo plazo.',
    icon: Plane,
    color: 'text-sky-500',
    category: 'beginner',
    goalTypes: ['travel', 'vacation'],
  },
  {
    id: 'goal_car',
    title: 'Ahorra para el auto, no financies',
    description: 'Los autos se deprecian rápido. Pagar cash te ahorra miles en intereses.',
    icon: Car,
    color: 'text-slate-500',
    category: 'beginner',
    goalTypes: ['car', 'vehicle'],
  },
  // Advanced tips
  {
    id: 'advanced_rebalance',
    title: 'Rebalancea tu portafolio',
    description: 'Revisa tu asignación de activos cada 6-12 meses y rebalancea para mantener tu estrategia.',
    icon: BarChart3,
    color: 'text-blue-500',
    category: 'advanced',
  },
  {
    id: 'advanced_tax_loss',
    title: 'Tax-Loss Harvesting',
    description: 'Vende posiciones perdedoras para compensar ganancias y reducir impuestos. Cuidado con la regla de 30 días.',
    icon: Target,
    color: 'text-blue-500',
    category: 'advanced',
  },
  {
    id: 'advanced_asset_location',
    title: 'Ubicación de activos',
    description: 'Pon bonos en RRSP (impuestos diferidos) y acciones de crecimiento en TFSA (libre de impuestos).',
    icon: Gem,
    color: 'text-violet-500',
    category: 'advanced',
  },
  {
    id: 'compound_power',
    title: 'El poder del interés compuesto',
    description: 'Einstein lo llamó la 8va maravilla. $500/mes al 8% = $1.4M en 30 años.',
    icon: Sparkles,
    color: 'text-yellow-500',
    category: 'all',
  },
  {
    id: 'emotional_investing',
    title: 'No inviertas con emociones',
    description: 'El miedo y la codicia son enemigos del inversor. Sigue tu plan, no las noticias.',
    icon: Heart,
    color: 'text-pink-500',
    category: 'intermediate',
  },
];

// Generate tips based on specific goals
function generateGoalSpecificTips(goals: InvestmentGoal[]): Tip[] {
  const tips: Tip[] = [];
  
  goals.forEach(goal => {
    const progress = goal.target_amount > 0 
      ? (goal.current_amount / goal.target_amount) * 100 
      : 0;
    
    // Almost there tip
    if (progress >= 75 && progress < 100) {
      tips.push({
        id: `goal_almost_${goal.id}`,
        title: `¡Casi llegas a "${goal.name}"!`,
        description: `Te falta solo ${(100 - progress).toFixed(0)}% para alcanzar tu meta. ¡No te rindas ahora!`,
        icon: Rocket,
        color: 'text-green-500',
        category: 'all',
      });
    }
    
    // Behind schedule tip
    if (goal.deadline && goal.monthly_target > 0) {
      const monthsLeft = Math.max(0, 
        (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      const remaining = goal.target_amount - goal.current_amount;
      const neededMonthly = remaining / Math.max(1, monthsLeft);
      
      if (neededMonthly > goal.monthly_target * 1.5 && monthsLeft > 1) {
        tips.push({
          id: `goal_behind_${goal.id}`,
          title: `Acelera tu meta "${goal.name}"`,
          description: `Necesitas $${neededMonthly.toFixed(0)}/mes para cumplir a tiempo. Considera aumentar tus aportes.`,
          icon: Clock,
          color: 'text-amber-500',
          category: 'all',
        });
      }
    }
    
    // Just started tip
    if (progress < 10 && progress > 0) {
      tips.push({
        id: `goal_started_${goal.id}`,
        title: `Buen inicio con "${goal.name}"`,
        description: 'El primer paso es el más importante. Mantén la constancia y verás resultados.',
        icon: Sparkles,
        color: 'text-purple-500',
        category: 'all',
      });
    }
  });
  
  return tips;
}

export function PersonalizedInvestmentTips() {
  const { language } = useLanguage();
  const { data: profile, isLoading: profileLoading } = useFinancialProfile();
  const { data: goals, isLoading: goalsLoading } = useInvestmentGoals();
  const navigate = useNavigate();

  const personalizedTips = useMemo(() => {
    if (!profile) {
      return ALL_TIPS.filter(tip => tip.category === 'beginner').slice(0, 3);
    }

    const userLevel = profile.financial_education_level || 'beginner';
    const userInterests = profile.interests || [];
    
    // Get goal types from user's investment goals
    const userGoalTypes = goals?.map(g => g.goal_type) || [];
    
    // Generate dynamic tips based on actual goals
    const goalSpecificTips = goals ? generateGoalSpecificTips(goals) : [];

    // Filter tips based on user level, interests, and goal types
    const relevantTips = ALL_TIPS.filter(tip => {
      // Check if tip matches user level or is for all levels
      const levelMatch = tip.category === 'all' || 
                        tip.category === userLevel ||
                        (userLevel === 'advanced' && tip.category !== 'beginner') ||
                        (userLevel === 'intermediate' && tip.category === 'beginner');

      // Check if tip matches user interests
      const interestMatch = !tip.interests || 
                           tip.interests.some(interest => userInterests.includes(interest));

      // Check if tip matches user goal types
      const goalMatch = !tip.goalTypes ||
                       tip.goalTypes.some(gt => userGoalTypes.includes(gt));

      return levelMatch && (interestMatch || goalMatch);
    });

    // Combine with goal-specific dynamic tips
    const allRelevantTips = [...goalSpecificTips, ...relevantTips];

    // Prioritize tips that match user interests or goals
    const sortedTips = allRelevantTips.sort((a, b) => {
      // Goal-specific tips first
      const aIsGoalSpecific = a.id.startsWith('goal_') ? 2 : 0;
      const bIsGoalSpecific = b.id.startsWith('goal_') ? 2 : 0;
      
      const aMatchesInterest = a.interests?.some(i => userInterests.includes(i)) ? 1 : 0;
      const bMatchesInterest = b.interests?.some(i => userInterests.includes(i)) ? 1 : 0;
      
      const aMatchesGoal = a.goalTypes?.some(gt => userGoalTypes.includes(gt)) ? 1 : 0;
      const bMatchesGoal = b.goalTypes?.some(gt => userGoalTypes.includes(gt)) ? 1 : 0;
      
      return (bIsGoalSpecific + bMatchesInterest + bMatchesGoal) - 
             (aIsGoalSpecific + aMatchesInterest + aMatchesGoal);
    });

    // Remove duplicates and limit
    const uniqueTips = sortedTips.filter((tip, index, self) => 
      index === self.findIndex(t => t.id === tip.id)
    );

    return uniqueTips.slice(0, 4);
  }, [profile, goals]);

  const getLevelBadge = () => {
    if (!profile?.financial_education_level) return null;
    
    const levels = {
      beginner: { label: language === 'es' ? 'Principiante' : 'Beginner', color: 'bg-green-500/10 text-green-600' },
      intermediate: { label: language === 'es' ? 'Intermedio' : 'Intermediate', color: 'bg-blue-500/10 text-blue-600' },
      advanced: { label: language === 'es' ? 'Avanzado' : 'Advanced', color: 'bg-purple-500/10 text-purple-600' },
    };

    const level = levels[profile.financial_education_level as keyof typeof levels] || levels.beginner;
    
    return (
      <Badge variant="outline" className={`${level.color} border-0`}>
        <GraduationCap className="h-3 w-3 mr-1" />
        {level.label}
      </Badge>
    );
  };

  if (profileLoading || goalsLoading) {
    return null;
  }

  if (!profile) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-purple-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Tips Personalizados para Ti' : 'Personalized Tips for You'}
          </CardTitle>
          {getLevelBadge()}
        </div>
        <div className="flex gap-1 flex-wrap mt-2">
          {profile.interests && profile.interests.slice(0, 3).map(interest => (
            <Badge key={interest} variant="secondary" className="text-xs">
              {interest}
            </Badge>
          ))}
          {goals && goals.length > 0 && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-0">
              <Target className="h-3 w-3 mr-1" />
              {goals.length} {language === 'es' ? 'metas' : 'goals'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {personalizedTips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div
              key={tip.id}
              className="p-3 rounded-lg bg-background/80 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-muted ${tip.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{tip.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
                  {tip.action && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-2 text-xs"
                      onClick={() => navigate(tip.action!.path)}
                    >
                      {tip.action.label}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-4">
          <AlertTriangle className="h-3 w-3 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700">
            {language === 'es' 
              ? 'Estos tips son educativos, NO consejo de inversión. Consulta un asesor financiero.'
              : 'These tips are educational, NOT investment advice. Consult a financial advisor.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}