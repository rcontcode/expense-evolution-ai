import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  RefreshCw, 
  DollarSign, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Sparkles,
  CreditCard,
  Wifi,
  Tv,
  Music,
  Cloud,
  ShoppingBag,
  Dumbbell,
  Newspaper,
  HelpCircle,
  ArrowRightLeft,
  Check,
  Building2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useSubscriptionDetector, DetectedSubscription } from '@/hooks/data/useSubscriptionDetector';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, parseISO, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  subscriptions: <RefreshCw className="h-4 w-4" />,
  telecommunications: <Wifi className="h-4 w-4" />,
  entertainment: <Tv className="h-4 w-4" />,
  music: <Music className="h-4 w-4" />,
  software: <Cloud className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  fitness: <Dumbbell className="h-4 w-4" />,
  news: <Newspaper className="h-4 w-4" />,
  default: <CreditCard className="h-4 w-4" />,
};

function getCategoryIcon(category: string | null): React.ReactNode {
  if (!category) return CATEGORY_ICONS.default;
  const lowerCategory = category.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lowerCategory.includes(key)) return icon;
  }
  return CATEGORY_ICONS.default;
}

function getFrequencyColor(frequency: DetectedSubscription['frequency']): string {
  switch (frequency) {
    case 'weekly': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'monthly': return 'bg-primary/10 text-primary border-primary/20';
    case 'quarterly': return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
    case 'yearly': return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getSourceBadge(source: DetectedSubscription['source'], language: string) {
  switch (source) {
    case 'bank':
      return (
        <Badge variant="outline" className="text-xs bg-chart-1/10 text-chart-1 border-chart-1/20">
          <Building2 className="h-3 w-3 mr-1" />
          {language === 'es' ? 'Banco' : 'Bank'}
        </Badge>
      );
    case 'both':
      return (
        <Badge variant="outline" className="text-xs bg-chart-3/10 text-chart-3 border-chart-3/20">
          <ArrowRightLeft className="h-3 w-3 mr-1" />
          {language === 'es' ? 'Verificado' : 'Verified'}
        </Badge>
      );
    default:
      return null;
  }
}

interface SubscriptionCardProps {
  subscription: DetectedSubscription;
  language: string;
  getFrequencyLabel: (frequency: DetectedSubscription['frequency'], language: string) => string;
  onConvertToBill: (subscription: DetectedSubscription) => void;
  isConverted: boolean;
}

function SubscriptionCard({ subscription, language, getFrequencyLabel, onConvertToBill, isConverted }: SubscriptionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-l-4 border-l-primary/50">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardContent className="py-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  {getCategoryIcon(subscription.category)}
                </div>
                <div>
                  <h4 className="font-medium">{subscription.vendor}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <Badge variant="outline" className={getFrequencyColor(subscription.frequency)}>
                      {getFrequencyLabel(subscription.frequency, language)}
                    </Badge>
                    {getSourceBadge(subscription.source, language)}
                    <span>•</span>
                    <span>{subscription.occurrences} {language === 'es' ? 'pagos' : 'payments'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold">${subscription.averageAmount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    ${subscription.annualizedCost.toFixed(0)}/{language === 'es' ? 'año' : 'year'}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 border-t">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{language === 'es' ? 'Último pago' : 'Last payment'}:</span>
                  <span className="ml-2 font-medium">
                    {format(parseISO(subscription.lastDate), 'PP', { locale: language === 'es' ? es : undefined })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">{language === 'es' ? 'Total gastado' : 'Total spent'}:</span>
                  <span className="ml-2 font-medium">${subscription.totalSpent.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {language === 'es' ? 'Confianza de detección' : 'Detection confidence'}:
                </span>
                <Progress value={subscription.confidence} className="h-2 w-24" />
                <span className="text-sm font-medium">{subscription.confidence.toFixed(0)}%</span>
              </div>
              {/* Convert to Recurring Bill */}
              <div className="pt-2">
                {isConverted ? (
                  <Button variant="outline" size="sm" disabled className="w-full">
                    <Check className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Agregado como gasto fijo' : 'Added as recurring bill'}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={(e) => { e.stopPropagation(); onConvertToBill(subscription); }}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Convertir en gasto fijo' : 'Convert to recurring bill'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function SubscriptionTracker() {
  const { language } = useLanguage();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: bankTransactions, isLoading: bankLoading } = useBankTransactions();
  const queryClient = useQueryClient();
  const [convertedVendors, setConvertedVendors] = useState<Set<string>>(new Set());

  const { 
    subscriptions, 
    totalAnnualSubscriptionCost, 
    totalMonthlySubscriptionCost,
    getFrequencyLabel 
  } = useSubscriptionDetector(expenses || [], bankTransactions || []);

  const isLoading = expensesLoading || bankLoading;

  const handleConvertToBill = async (sub: DetectedSubscription) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const frequencyMap: Record<string, string> = {
        weekly: 'weekly',
        monthly: 'monthly',
        quarterly: 'quarterly',
        yearly: 'yearly',
      };

      const nextDue = addMonths(parseISO(sub.lastDate), sub.frequency === 'quarterly' ? 3 : sub.frequency === 'yearly' ? 12 : 1);

      const { error } = await supabase.from('recurring_bills').insert({
        user_id: user.id,
        name: sub.vendor,
        amount: Math.round(sub.averageAmount * 100) / 100,
        frequency: frequencyMap[sub.frequency] || 'monthly',
        category: sub.category || 'subscriptions',
        is_active: true,
        auto_pay: false,
        next_due_date: format(nextDue, 'yyyy-MM-dd'),
      });

      if (error) throw error;

      setConvertedVendors(prev => new Set(prev).add(sub.vendor));
      queryClient.invalidateQueries({ queryKey: ['recurring-bills'] });
      toast.success(
        language === 'es'
          ? `"${sub.vendor}" agregado como gasto fijo recurrente`
          : `"${sub.vendor}" added as a recurring bill`
      );
    } catch (err) {
      console.error('Error converting to bill:', err);
      toast.error(language === 'es' ? 'Error al crear gasto fijo' : 'Error creating recurring bill');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            {language === 'es' ? 'Cargando suscripciones...' : 'Loading subscriptions...'}
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const bankCount = subscriptions.filter(s => s.source === 'bank' || s.source === 'both').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {language === 'es' ? 'Suscripciones Detectadas' : 'Detected Subscriptions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{subscriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              {bankCount > 0
                ? (language === 'es' ? `${bankCount} desde extractos bancarios` : `${bankCount} from bank statements`)
                : (language === 'es' ? 'Gastos recurrentes identificados' : 'Recurring expenses identified')
              }
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-1/5 to-chart-1/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {language === 'es' ? 'Costo Mensual' : 'Monthly Cost'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalMonthlySubscriptionCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Promedio mensual en suscripciones' : 'Average monthly in subscriptions'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-2/5 to-chart-2/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {language === 'es' ? 'Costo Anual' : 'Annual Cost'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalAnnualSubscriptionCost.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Proyección anual total' : 'Total annual projection'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Tip */}
      {subscriptions.length > 0 && totalAnnualSubscriptionCost > 500 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-accent-foreground mt-0.5" />
              <div>
                <h4 className="font-medium">
                  {language === 'es' ? 'Oportunidad de Ahorro' : 'Savings Opportunity'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {language === 'es' 
                    ? `Estás gastando $${totalAnnualSubscriptionCost.toFixed(0)} al año en suscripciones recurrentes. Revisa cuáles realmente usas y considera cancelar las que no aprovechas.`
                    : `You're spending $${totalAnnualSubscriptionCost.toFixed(0)} per year on recurring subscriptions. Review which ones you actually use and consider canceling those you don't.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {language === 'es' ? 'Gastos Recurrentes Detectados' : 'Detected Recurring Expenses'}
          </CardTitle>
          <CardDescription>
            {language === 'es' 
              ? 'Basado en tus gastos y extractos bancarios'
              : 'Based on your expenses and bank statements'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">
                {language === 'es' 
                  ? 'No se detectaron suscripciones recurrentes'
                  : 'No recurring subscriptions detected'
                }
              </p>
              <p className="text-sm mt-2">
                {language === 'es'
                  ? 'Agrega más gastos o importa extractos bancarios para detectar patrones'
                  : 'Add more expenses or import bank statements to detect patterns'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((subscription, index) => (
                <SubscriptionCard
                  key={`${subscription.vendor}-${index}`}
                  subscription={subscription}
                  language={language}
                  getFrequencyLabel={getFrequencyLabel}
                  onConvertToBill={handleConvertToBill}
                  isConverted={convertedVendors.has(subscription.vendor)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* High-Cost Alert */}
      {subscriptions.filter(s => s.frequency === 'weekly').length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium">
                  {language === 'es' ? 'Atención: Gastos Semanales Detectados' : 'Attention: Weekly Expenses Detected'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {language === 'es' 
                    ? 'Tienes gastos que se repiten semanalmente. Estos pueden acumularse rápidamente.'
                    : 'You have expenses that repeat weekly. These can add up quickly.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
