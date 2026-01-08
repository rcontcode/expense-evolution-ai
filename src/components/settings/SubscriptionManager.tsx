import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, Sparkles, Zap, CreditCard, ExternalLink, 
  Check, Calendar, RefreshCw, Loader2, ArrowRight
} from 'lucide-react';
import { useSubscription, STRIPE_CONFIG, BillingPeriod } from '@/hooks/data/useSubscription';
import { usePlanLimits, PLAN_LIMITS, PlanType } from '@/hooks/data/usePlanLimits';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

const planConfig = {
  free: {
    name: 'Free',
    price: '$0',
    icon: Zap,
    color: 'from-slate-500 to-slate-600',
    features: [
      '50 gastos/mes',
      '20 ingresos/mes',
      '5 escaneos OCR/mes',
      '2 clientes',
      '2 proyectos',
    ],
  },
  premium: {
    name: 'Premium',
    price: '$6.99',
    priceAnnual: '$5.59',
    icon: Sparkles,
    color: 'from-amber-500 via-orange-500 to-red-500',
    features: [
      'Gastos ilimitados',
      'Ingresos ilimitados',
      '50 escaneos OCR/mes',
      'Clientes ilimitados',
      'Proyectos ilimitados',
      'Registro de kilometraje',
      'Gamificación completa',
      'Patrimonio neto',
      'Calendario fiscal',
      'Exportar a Excel',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$14.99',
    priceAnnual: '$11.99',
    icon: Crown,
    color: 'from-violet-600 via-purple-600 to-indigo-600',
    features: [
      'Todo de Premium',
      'OCR ilimitado',
      'Análisis de contratos con IA',
      'Análisis bancario con IA',
      'Optimizador fiscal',
      'Calculadora FIRE',
      'Asistente de voz',
      'Optimizador RRSP/TFSA',
      'Exportar T2125',
      'Mentoría completa (8 módulos)',
    ],
  },
};

export function SubscriptionManager() {
  const { language } = useLanguage();
  const {
    isSubscribed,
    planType,
    billingPeriod,
    subscriptionEnd,
    isLoading,
    isCheckingOut,
    isOpeningPortal,
    createCheckout,
    openCustomerPortal,
    refreshSubscription,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'pro'>('premium');
  const [selectedBilling, setSelectedBilling] = useState<BillingPeriod>('annual');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSubscription();
    setIsRefreshing(false);
  };

  const handleCheckout = async () => {
    await createCheckout(selectedPlan, selectedBilling);
  };

  const dateLocale = language === 'es' ? es : enUS;
  const currentPlanConfig = planConfig[planType];
  const CurrentIcon = currentPlanConfig.icon;

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 bg-muted rounded" />
          <div className="h-40 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>
                {language === 'es' ? 'Suscripción' : 'Subscription'}
              </CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Gestiona tu plan y facturación' 
                  : 'Manage your plan and billing'}
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Plan Card */}
        <div className={`p-4 rounded-xl bg-gradient-to-r ${currentPlanConfig.color} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CurrentIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Plan {currentPlanConfig.name}</h3>
                <p className="text-sm text-white/80">
                  {isSubscribed && billingPeriod
                    ? `Facturación ${billingPeriod === 'annual' ? 'anual' : 'mensual'}`
                    : language === 'es' ? 'Gratis para siempre' : 'Free forever'}
                </p>
              </div>
            </div>
            {isSubscribed && subscriptionEnd && (
              <div className="text-right">
                <p className="text-xs text-white/70">
                  {language === 'es' ? 'Próxima renovación' : 'Next renewal'}
                </p>
                <p className="font-medium">
                  {format(new Date(subscriptionEnd), 'PPP', { locale: dateLocale })}
                </p>
              </div>
            )}
          </div>
          
          {isSubscribed && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <Button
                variant="secondary"
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={openCustomerPortal}
                disabled={isOpeningPortal}
              >
                {isOpeningPortal ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                {language === 'es' ? 'Gestionar Suscripción' : 'Manage Subscription'}
              </Button>
            </div>
          )}
        </div>

        {/* Upgrade Section - Only show if not on Pro */}
        {planType !== 'pro' && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {language === 'es' ? 'Mejorar tu plan' : 'Upgrade your plan'}
            </h4>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setSelectedBilling('monthly')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  selectedBilling === 'monthly' 
                    ? 'bg-background shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {language === 'es' ? 'Mensual' : 'Monthly'}
              </button>
              <button
                onClick={() => setSelectedBilling('annual')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedBilling === 'annual' 
                    ? 'bg-background shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {language === 'es' ? 'Anual' : 'Annual'}
                <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                  -20%
                </Badge>
              </button>
            </div>

            {/* Plan Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {(['premium', 'pro'] as const)
                .filter(plan => planType === 'free' || plan === 'pro')
                .map((plan) => {
                  const config = planConfig[plan];
                  const PlanIcon = config.icon;
                  const isSelected = selectedPlan === plan;
                  const price = selectedBilling === 'annual' 
                    ? config.priceAnnual 
                    : config.price;

                  return (
                    <button
                      key={plan}
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color}`}>
                          <PlanIcon className="h-5 w-5 text-white" />
                        </div>
                        {isSelected && (
                          <Badge className="bg-primary text-primary-foreground">
                            <Check className="h-3 w-3 mr-1" />
                            {language === 'es' ? 'Seleccionado' : 'Selected'}
                          </Badge>
                        )}
                      </div>
                      <h5 className="font-bold text-lg">{config.name}</h5>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black">{price}</span>
                        <span className="text-muted-foreground">/mes</span>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {config.features.slice(0, 5).map((feature, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                        {config.features.length > 5 && (
                          <li className="text-xs text-muted-foreground">
                            +{config.features.length - 5} más...
                          </li>
                        )}
                      </ul>
                    </button>
                  );
                })}
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className={`w-full py-6 font-bold text-lg bg-gradient-to-r ${planConfig[selectedPlan].color} hover:opacity-90 text-white`}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {language === 'es' ? 'Procesando...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  {language === 'es' 
                    ? `Obtener ${planConfig[selectedPlan].name}` 
                    : `Get ${planConfig[selectedPlan].name}`}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {language === 'es' 
                ? 'Pago seguro con Stripe • Cancela cuando quieras' 
                : 'Secure payment with Stripe • Cancel anytime'}
            </p>
          </div>
        )}

        {/* Pro User Message */}
        {planType === 'pro' && (
          <div className="text-center py-4">
            <Crown className="h-12 w-12 text-primary mx-auto mb-3" />
            <h4 className="font-bold text-lg">
              {language === 'es' ? '¡Tienes el plan máximo!' : 'You have the top plan!'}
            </h4>
            <p className="text-muted-foreground text-sm">
              {language === 'es' 
                ? 'Disfruta de todas las funciones de EvoFinz sin límites' 
                : 'Enjoy all EvoFinz features without limits'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
