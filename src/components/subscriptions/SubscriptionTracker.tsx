import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  RefreshCw, 
  DollarSign, 
  TrendingDown, 
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
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useSubscriptionDetector, DetectedSubscription } from '@/hooks/data/useSubscriptionDetector';
import { format, parseISO } from 'date-fns';
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
    case 'weekly': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'monthly': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'quarterly': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'yearly': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
}

interface SubscriptionCardProps {
  subscription: DetectedSubscription;
  language: string;
  getFrequencyLabel: (frequency: DetectedSubscription['frequency'], language: string) => string;
}

function SubscriptionCard({ subscription, language, getFrequencyLabel }: SubscriptionCardProps) {
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className={getFrequencyColor(subscription.frequency)}>
                      {getFrequencyLabel(subscription.frequency, language)}
                    </Badge>
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
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function SubscriptionTracker() {
  const { language } = useLanguage();
  const { data: expenses, isLoading } = useExpenses();
  const { 
    subscriptions, 
    totalAnnualSubscriptionCost, 
    totalMonthlySubscriptionCost,
    getFrequencyLabel 
  } = useSubscriptionDetector(expenses || []);

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
              {language === 'es' ? 'Gastos recurrentes identificados' : 'Recurring expenses identified'}
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
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200">
                  {language === 'es' ? 'Oportunidad de Ahorro' : 'Savings Opportunity'}
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
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
              ? 'Basado en el análisis de tus gastos históricos'
              : 'Based on analysis of your historical expenses'
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
                  ? 'Agrega más gastos para que podamos detectar patrones de suscripción'
                  : 'Add more expenses so we can detect subscription patterns'
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
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* High-Cost Alert */}
      {subscriptions.filter(s => s.frequency === 'weekly').length > 0 && (
        <Card className="border-red-500/30 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200">
                  {language === 'es' ? 'Atención: Gastos Semanales Detectados' : 'Attention: Weekly Expenses Detected'}
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {language === 'es' 
                    ? 'Tienes gastos que se repiten semanalmente. Estos pueden acumularse rápidamente. Considera si son realmente necesarios.'
                    : 'You have expenses that repeat weekly. These can add up quickly. Consider if they are truly necessary.'
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
