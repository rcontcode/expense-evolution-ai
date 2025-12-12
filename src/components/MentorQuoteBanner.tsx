import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Quote, RefreshCw, Lightbulb, Sparkles, User } from 'lucide-react';
import { getRandomQuote, getRandomTip, MENTOR_QUOTES, FINANCIAL_TIPS } from '@/lib/constants/mentor-quotes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useFinancialProfile } from '@/hooks/data/useFinancialProfile';
import { useInvestmentGoals } from '@/hooks/data/useInvestmentGoals';
import { useAuth } from '@/contexts/AuthContext';

interface MentorQuoteBannerProps {
  showTip?: boolean;
  className?: string;
  context?: 'dashboard' | 'expenses' | 'income' | 'clients' | 'onboarding' | 'general';
}

// Generate personalized application based on user context
function getPersonalizedApplication(
  quote: typeof MENTOR_QUOTES[0],
  context: string,
  language: string,
  financialProfile?: any,
  investmentGoals?: any[]
): string {
  const applications: Record<string, Record<string, { es: string; en: string }>> = {
    passive_income: {
      dashboard: {
        es: 'Revisa tus fuentes de ingreso pasivo y busca formas de diversificar',
        en: 'Review your passive income sources and look for ways to diversify',
      },
      expenses: {
        es: 'Cada gasto evitado es dinero que puede trabajar para ti',
        en: 'Every avoided expense is money that can work for you',
      },
      income: {
        es: 'Registra todos tus ingresos para visualizar tu potencial de inversión',
        en: 'Track all your income to visualize your investment potential',
      },
      clients: {
        es: 'Clientes recurrentes generan ingresos pasivos predecibles',
        en: 'Recurring clients generate predictable passive income',
      },
      general: {
        es: 'Busca oportunidades para generar ingresos mientras duermes',
        en: 'Look for opportunities to earn money while you sleep',
      },
    },
    mindset: {
      dashboard: {
        es: 'Tu mentalidad financiera se refleja en tus números - ¡míralos!',
        en: 'Your financial mindset is reflected in your numbers - look at them!',
      },
      expenses: {
        es: 'Cada gasto es una decisión - haz que cada una cuente',
        en: 'Every expense is a decision - make each one count',
      },
      income: {
        es: 'Piensa en grande: ¿cómo puedes multiplicar estos ingresos?',
        en: 'Think big: how can you multiply this income?',
      },
      clients: {
        es: 'Cada cliente es una oportunidad de crecimiento mutuo',
        en: 'Every client is an opportunity for mutual growth',
      },
      general: {
        es: 'Tu forma de pensar determina tus resultados financieros',
        en: 'Your way of thinking determines your financial results',
      },
    },
    investing: {
      dashboard: {
        es: 'Analiza tus números para tomar mejores decisiones de inversión',
        en: 'Analyze your numbers to make better investment decisions',
      },
      expenses: {
        es: 'Reduce gastos innecesarios para liberar capital de inversión',
        en: 'Reduce unnecessary expenses to free up investment capital',
      },
      income: {
        es: 'Destina un porcentaje fijo de cada ingreso a inversiones',
        en: 'Allocate a fixed percentage of each income to investments',
      },
      clients: {
        es: 'Invierte en relaciones con clientes de alto valor',
        en: 'Invest in relationships with high-value clients',
      },
      general: {
        es: 'La paciencia en inversiones genera los mejores retornos',
        en: 'Patience in investments generates the best returns',
      },
    },
    saving: {
      dashboard: {
        es: 'Revisa tu balance: ¿estás ahorrando lo suficiente?',
        en: 'Check your balance: are you saving enough?',
      },
      expenses: {
        es: 'Identifica gastos recurrentes que puedas eliminar',
        en: 'Identify recurring expenses you can eliminate',
      },
      income: {
        es: 'Automatiza el ahorro: págate a ti primero',
        en: 'Automate savings: pay yourself first',
      },
      clients: {
        es: 'Cada pago de cliente es una oportunidad de ahorrar',
        en: 'Every client payment is an opportunity to save',
      },
      general: {
        es: 'El ahorro constante construye riqueza a largo plazo',
        en: 'Consistent saving builds long-term wealth',
      },
    },
    assets: {
      dashboard: {
        es: 'Distingue entre gastos, pasivos y activos en tu registro',
        en: 'Distinguish between expenses, liabilities and assets in your records',
      },
      expenses: {
        es: 'Pregúntate: ¿este gasto genera valor o lo consume?',
        en: 'Ask yourself: does this expense generate or consume value?',
      },
      income: {
        es: 'Transforma tus habilidades en activos que generen ingresos',
        en: 'Transform your skills into income-generating assets',
      },
      clients: {
        es: 'Una cartera de clientes leales es tu activo más valioso',
        en: 'A loyal client portfolio is your most valuable asset',
      },
      general: {
        es: 'Enfócate en adquirir activos que generen flujo de efectivo',
        en: 'Focus on acquiring assets that generate cash flow',
      },
    },
    compound: {
      dashboard: {
        es: 'Observa cómo tus pequeñas mejoras se acumulan con el tiempo',
        en: 'Watch how your small improvements compound over time',
      },
      expenses: {
        es: 'Pequeños ahorros diarios se convierten en grandes sumas',
        en: 'Small daily savings become large sums',
      },
      income: {
        es: 'Reinvierte parte de cada ingreso para acelerar el crecimiento',
        en: 'Reinvest part of each income to accelerate growth',
      },
      clients: {
        es: 'La confianza con clientes se construye con pequeñas acciones constantes',
        en: 'Client trust is built with small consistent actions',
      },
      general: {
        es: 'El tiempo es tu mejor aliado cuando inviertes consistentemente',
        en: 'Time is your best ally when you invest consistently',
      },
    },
  };

  const categoryApps = applications[quote.category] || applications.mindset;
  const contextApp = categoryApps[context] || categoryApps.general;
  
  // Personalize based on investment goals if available
  if (investmentGoals && investmentGoals.length > 0) {
    const activeGoal = investmentGoals.find(g => g.status === 'active');
    if (activeGoal) {
      const goalMention = language === 'es' 
        ? ` para alcanzar tu meta "${activeGoal.name}"`
        : ` to reach your goal "${activeGoal.name}"`;
      return (language === 'es' ? contextApp.es : contextApp.en) + goalMention;
    }
  }

  return language === 'es' ? contextApp.es : contextApp.en;
}

export function MentorQuoteBanner({ 
  showTip = false, 
  className = '',
  context = 'general'
}: MentorQuoteBannerProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: financialProfile } = useFinancialProfile();
  const { data: investmentGoals } = useInvestmentGoals();
  
  const [quote, setQuote] = useState(getRandomQuote());
  const [tip, setTip] = useState(getRandomTip());
  const [isAnimating, setIsAnimating] = useState(false);

  // Get user's first name
  const firstName = useMemo(() => {
    return profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  }, [profile?.full_name, user?.email]);

  // Get personalized category based on financial profile
  const preferredCategory = useMemo(() => {
    if (financialProfile?.preferred_income_type === 'passive') return 'passive_income';
    if (financialProfile?.risk_tolerance === 'high') return 'investing';
    if (financialProfile?.risk_tolerance === 'low') return 'saving';
    return undefined;
  }, [financialProfile]);

  const refreshQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setQuote(getRandomQuote(preferredCategory));
      if (showTip) {
        setTip(getRandomTip());
      }
      setIsAnimating(false);
    }, 300);
  };

  // Auto-refresh quote on mount and every 45 seconds
  useEffect(() => {
    const interval = setInterval(refreshQuote, 45000);
    return () => clearInterval(interval);
  }, [showTip, preferredCategory]);

  // Get personalized application
  const personalizedApplication = useMemo(() => {
    return getPersonalizedApplication(
      quote,
      context,
      language,
      financialProfile,
      investmentGoals
    );
  }, [quote, context, language, financialProfile, investmentGoals]);

  return (
    <Card className={`bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-primary/20 overflow-hidden ${className}`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Quote className="h-5 w-5 text-primary" />
          </div>
          
          <div className={`flex-1 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <blockquote className="text-base font-medium italic text-foreground">
              "{quote.quote}"
            </blockquote>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="font-semibold">{quote.author}</span>
              {quote.book && (
                <>
                  <span>•</span>
                  <span className="text-xs">{quote.book}</span>
                </>
              )}
            </div>

            {/* Personalized Application */}
            <div className="mt-3 pt-3 border-t border-primary/20">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-primary">
                    {firstName ? `${firstName}, ` : ''}
                    {language === 'es' ? 'esto lo puedes aplicar:' : 'you can apply this:'}
                  </span>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {personalizedApplication}
                  </p>
                </div>
              </div>
            </div>

            {showTip && tip && (
              <div className="mt-3 pt-3 border-t border-primary/20">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      {language === 'es' ? 'Consejo del día' : 'Tip of the day'}
                    </span>
                    <p className="text-sm text-muted-foreground">{tip.tip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={refreshQuote}
            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary"
            title={language === 'es' ? 'Nueva frase' : 'New quote'}
          >
            <RefreshCw className={`h-4 w-4 ${isAnimating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
