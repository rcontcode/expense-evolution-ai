import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, Sparkles, Zap, CreditCard, ExternalLink, 
  Check, RefreshCw, Loader2, ArrowRight, Layers
} from 'lucide-react';
import { useSubscription, STRIPE_CONFIG, BillingPeriod } from '@/hooks/data/useSubscription';
import { usePlanLimits, PlanType } from '@/hooks/data/usePlanLimits';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

type UpgradePlan = 'premium' | 'pro' | 'bundle';

const planConfig: Record<string, {
  name: string;
  nameEn: string;
  price: string;
  priceAnnual?: string;
  icon: typeof Zap;
  color: string;
  features: string[];
  featuresEn: string[];
}> = {
  free: {
    name: 'Free',
    nameEn: 'Free',
    price: '$0',
    icon: Zap,
    color: 'from-slate-500 to-slate-600',
    features: [
      '50 gastos/mes',
      '20 ingresos/mes',
      '5 escaneos OCR/mes',
      '2 clientes',
      '2 proyectos',
      'Asistente de voz (3 min/mes)',
      'Alertas proactivas básicas',
    ],
    featuresEn: [
      '50 expenses/month',
      '20 incomes/month',
      '5 OCR scans/month',
      '2 clients',
      '2 projects',
      'Voice assistant (3 min/month)',
      'Basic proactive alerts',
    ],
  },
  premium: {
    name: 'Premium',
    nameEn: 'Premium',
    price: '$7.99',
    priceAnnual: '$6.49',
    icon: Sparkles,
    color: 'from-amber-500 via-orange-500 to-red-500',
    features: [
      'Gastos e ingresos ilimitados',
      '50 escaneos OCR/mes',
      'Clientes y proyectos ilimitados',
      'Registro de kilometraje',
      'Gamificación completa',
      'Patrimonio neto',
      'Calendario fiscal',
      'Exportar a Excel',
      'Reporte mensual IA',
      'Alertas proactivas',
      'Asistente de voz (30 min/mes)',
      'Mentoría (4 módulos)',
    ],
    featuresEn: [
      'Unlimited expenses & income',
      '50 OCR scans/month',
      'Unlimited clients & projects',
      'Mileage tracking',
      'Full gamification',
      'Net worth',
      'Tax calendar',
      'Export to Excel',
      'Monthly AI report',
      'Proactive alerts',
      'Voice assistant (30 min/month)',
      'Mentorship (4 modules)',
    ],
  },
  pro: {
    name: 'Pro',
    nameEn: 'Pro',
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
      'Calculadora de Libertad Financiera',
      'Optimizador RRSP/TFSA',
      'Exportar T2125',
      'Asistente de voz (120 min/mes)',
      'Mentoría completa (8 módulos)',
      'Soporte dedicado',
    ],
    featuresEn: [
      'Everything in Premium',
      'Unlimited OCR',
      'AI contract analysis',
      'AI bank analysis',
      'Tax optimizer',
      'Financial Freedom Calculator',
      'RRSP/TFSA optimizer',
      'Export T2125',
      'Voice assistant (120 min/month)',
      'Full mentorship (8 modules)',
      'Dedicated support',
    ],
  },
  bundle: {
    name: 'Evo Bundle',
    nameEn: 'Evo Bundle',
    price: '$14.99',
    priceAnnual: '$9.99',
    icon: Layers,
    color: 'from-emerald-500 via-teal-500 to-cyan-600',
    features: [
      'EvoFinz Pro completo',
      'Fokuspark Premium completo',
      'Datos cruzados entre apps',
      'Insights de correlación enfoque↔finanzas',
      'Frases unificadas del ecosistema',
      'Dashboard de ecosistema',
      'Ahorro de 33% vs planes separados',
      'Soporte prioritario del ecosistema',
    ],
    featuresEn: [
      'Full EvoFinz Pro',
      'Full Fokuspark Premium',
      'Cross-app data integration',
      'Focus↔finance correlation insights',
      'Unified ecosystem quotes',
      'Ecosystem dashboard',
      '33% savings vs separate plans',
      'Priority ecosystem support',
    ],
  },
  pro_beta: {
    name: 'Pro (Early Access)',
    nameEn: 'Pro (Early Access)',
    price: '$0',
    icon: Crown,
    color: 'from-emerald-500 to-teal-600',
    features: [
      'Todo de Pro con límites especiales',
      '20 escaneos OCR/mes',
      'Asistente de voz (15 min/mes)',
      'Acceso anticipado a nuevas funciones',
      'Mentoría completa (8 módulos)',
      'Soporte prioritario',
    ],
    featuresEn: [
      'Everything in Pro with special limits',
      '20 OCR scans/month',
      'Voice assistant (15 min/month)',
      'Early access to new features',
      'Full mentorship (8 modules)',
      'Priority support',
    ],
  },
};

export function SubscriptionManager() {
  const { language } = useLanguage();
  const isEs = language === 'es';
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

  const [selectedPlan, setSelectedPlan] = useState<UpgradePlan>('premium');
  const [selectedBilling, setSelectedBilling] = useState<BillingPeriod>('annual');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (planType === 'premium') {
      setSelectedPlan('pro');
    } else if (planType === 'free') {
      setSelectedPlan('premium');
    }
  }, [planType]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSubscription();
    setIsRefreshing(false);
  };

  const handleCheckout = async () => {
    if (selectedPlan === 'bundle') {
      // Bundle uses the bundle checkout flow
      await createCheckout('bundle' as any, selectedBilling);
    } else {
      await createCheckout(selectedPlan, selectedBilling);
    }
  };

  const dateLocale = isEs ? es : enUS;
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

  // Determine which plans to show based on current plan
  const getAvailablePlans = (): UpgradePlan[] => {
    if (planType === 'free') return ['premium', 'pro', 'bundle'];
    if (planType === 'premium') return ['pro', 'bundle'];
    return [];
  };

  const availablePlans = getAvailablePlans();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>
                {isEs ? 'Suscripción' : 'Subscription'}
              </CardTitle>
              <CardDescription>
                {isEs 
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
                <h3 className="font-bold text-lg">Plan {isEs ? currentPlanConfig.name : currentPlanConfig.nameEn}</h3>
                <p className="text-sm text-white/80">
                  {isSubscribed && billingPeriod
                    ? isEs 
                      ? `Facturación ${billingPeriod === 'annual' ? 'anual' : 'mensual'}`
                      : `${billingPeriod === 'annual' ? 'Annual' : 'Monthly'} billing`
                    : isEs ? 'Gratis para siempre' : 'Free forever'}
                </p>
              </div>
            </div>
            {isSubscribed && subscriptionEnd && (
              <div className="text-right">
                <p className="text-xs text-white/70">
                  {isEs ? 'Próxima renovación' : 'Next renewal'}
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
                {isEs ? 'Gestionar Suscripción' : 'Manage Subscription'}
              </Button>
            </div>
          )}
        </div>

        {/* Upgrade Section */}
        {availablePlans.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {isEs ? 'Mejorar tu plan' : 'Upgrade your plan'}
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
                {isEs ? 'Mensual' : 'Monthly'}
              </button>
              <button
                onClick={() => setSelectedBilling('annual')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedBilling === 'annual' 
                    ? 'bg-background shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isEs ? 'Anual' : 'Annual'}
                <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                  -20%
                </Badge>
              </button>
            </div>

            {/* Plan Cards */}
            <div className={`grid gap-4 ${availablePlans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {availablePlans.map((plan) => {
                const config = planConfig[plan];
                const PlanIcon = config.icon;
                const isSelected = selectedPlan === plan;
                const price = selectedBilling === 'annual' 
                  ? config.priceAnnual 
                  : config.price;
                const isBundle = plan === 'bundle';
                const features = isEs ? config.features : config.featuresEn;

                return (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {isBundle && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] px-2 py-0.5 shadow-md">
                          🌟 {isEs ? 'Mejor valor' : 'Best value'}
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color}`}>
                        <PlanIcon className="h-5 w-5 text-white" />
                      </div>
                      {isSelected && (
                        <Badge className="bg-primary text-primary-foreground">
                          <Check className="h-3 w-3 mr-1" />
                          {isEs ? 'Seleccionado' : 'Selected'}
                        </Badge>
                      )}
                    </div>
                    <h5 className="font-bold text-lg">{isEs ? config.name : config.nameEn}</h5>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black">{price}</span>
                      <span className="text-muted-foreground">/{isEs ? 'mes' : 'mo'}</span>
                    </div>
                    {isBundle && selectedBilling === 'annual' && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                        {isEs ? '33% menos vs planes separados' : '33% off vs separate plans'}
                      </p>
                    )}
                    <ul className="mt-3 space-y-1.5">
                      {features.slice(0, 5).map((feature, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {features.length > 5 && (
                        <li className="text-xs text-muted-foreground">
                          +{features.length - 5} {isEs ? 'más...' : 'more...'}
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
                  {isEs ? 'Procesando...' : 'Processing...'}
                </>
              ) : (
                <>
                  {selectedPlan === 'bundle' ? <Layers className="h-5 w-5 mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                  {isEs 
                    ? `Obtener ${planConfig[selectedPlan].name}` 
                    : `Get ${planConfig[selectedPlan].nameEn}`}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {isEs 
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
              {isEs ? '¡Tienes el plan máximo!' : 'You have the top plan!'}
            </h4>
            <p className="text-muted-foreground text-sm">
              {isEs 
                ? 'Disfruta de todas las funciones de EvoFinz sin límites' 
                : 'Enjoy all EvoFinz features without limits'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
