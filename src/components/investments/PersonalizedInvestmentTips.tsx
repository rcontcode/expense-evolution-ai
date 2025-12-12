import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFinancialProfile } from '@/hooks/data/useFinancialProfile';
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
  ChevronRight
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
];

export function PersonalizedInvestmentTips() {
  const { language } = useLanguage();
  const { data: profile, isLoading } = useFinancialProfile();
  const navigate = useNavigate();

  const personalizedTips = useMemo(() => {
    if (!profile) {
      // Return generic tips if no profile
      return ALL_TIPS.filter(tip => tip.category === 'beginner').slice(0, 3);
    }

    const userLevel = profile.financial_education_level || 'beginner';
    const userInterests = profile.interests || [];

    // Filter tips based on user level and interests
    const relevantTips = ALL_TIPS.filter(tip => {
      // Check if tip matches user level or is for all levels
      const levelMatch = tip.category === 'all' || 
                        tip.category === userLevel ||
                        (userLevel === 'advanced' && tip.category !== 'beginner') ||
                        (userLevel === 'intermediate' && tip.category === 'beginner');

      // Check if tip matches user interests (or has no interest requirement)
      const interestMatch = !tip.interests || 
                           tip.interests.some(interest => userInterests.includes(interest));

      return levelMatch && interestMatch;
    });

    // Prioritize tips that match user interests
    const sortedTips = relevantTips.sort((a, b) => {
      const aMatchesInterest = a.interests?.some(i => userInterests.includes(i)) ? 1 : 0;
      const bMatchesInterest = b.interests?.some(i => userInterests.includes(i)) ? 1 : 0;
      return bMatchesInterest - aMatchesInterest;
    });

    return sortedTips.slice(0, 3);
  }, [profile]);

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

  if (isLoading) {
    return null;
  }

  // Don't show if user hasn't completed the investment onboarding
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
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-2">
            {profile.interests.slice(0, 4).map(interest => (
              <Badge key={interest} variant="secondary" className="text-xs">
                {interest}
              </Badge>
            ))}
          </div>
        )}
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