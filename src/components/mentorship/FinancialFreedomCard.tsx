import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFinancialFreedom } from '@/hooks/data/useFinancialFreedom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, TrendingUp, Calendar, DollarSign, Lightbulb, PartyPopper } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export function FinancialFreedomCard() {
  const { language } = useLanguage();
  const {
    passiveIncomeMonthly,
    activeIncomeMonthly,
    monthlyExpenses,
    freedomPercentage,
    gapToFreedom,
    estimatedFreedomDate,
    monthsToFreedom,
    isFinanciallyFree,
    recommendations,
    isLoading,
  } = useFinancialFreedom();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusColor = () => {
    if (isFinanciallyFree) return 'text-primary';
    if (freedomPercentage >= 75) return 'text-green-500';
    if (freedomPercentage >= 50) return 'text-yellow-500';
    if (freedomPercentage >= 25) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <Card className={`overflow-hidden ${isFinanciallyFree ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isFinanciallyFree ? (
              <PartyPopper className="h-5 w-5 text-primary animate-pulse" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
            {language === 'es' ? 'Libertad Financiera' : 'Financial Freedom'}
          </CardTitle>
          <Badge variant="outline" className="text-xs" title={language === 'es' ? 'Inspirado en obra de Robert Kiyosaki. No afiliado.' : 'Inspired by Robert Kiyosaki\'s work. Not affiliated.'}>
            📖 Kiyosaki*
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {language === 'es' 
            ? 'Ingresos Pasivos ÷ Gastos = % Libertad'
            : 'Passive Income ÷ Expenses = % Freedom'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Percentage */}
        <div className="text-center py-4">
          <div className={`text-5xl font-bold ${getStatusColor()}`}>
            {freedomPercentage.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isFinanciallyFree 
              ? (language === 'es' ? '¡ERES FINANCIERAMENTE LIBRE!' : "YOU'RE FINANCIALLY FREE!")
              : (language === 'es' ? 'hacia la libertad financiera' : 'towards financial freedom')
            }
          </p>
          <Progress 
            value={Math.min(freedomPercentage, 100)} 
            className="h-3 mt-3"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {language === 'es' ? 'Ingreso Pasivo/mes' : 'Passive Income/mo'}
            </div>
            <p className="text-lg font-semibold text-primary">
              {formatCurrency(passiveIncomeMonthly)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              {language === 'es' ? 'Gastos/mes' : 'Expenses/mo'}
            </div>
            <p className="text-lg font-semibold">
              {formatCurrency(monthlyExpenses)}
            </p>
          </div>
        </div>

        {/* Gap to Freedom */}
        {!isFinanciallyFree && gapToFreedom > 0 && (
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {language === 'es' ? 'Brecha a cubrir' : 'Gap to cover'}
              </span>
              <span className="font-semibold text-destructive">
                {formatCurrency(gapToFreedom)}/mes
              </span>
            </div>
          </div>
        )}

        {/* Estimated Freedom Date */}
        {estimatedFreedomDate && !isFinanciallyFree && (
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Fecha estimada de libertad' : 'Estimated freedom date'}
                </p>
                <p className="font-semibold">
                  {format(estimatedFreedomDate, 'MMMM yyyy', { 
                    locale: language === 'es' ? es : enUS 
                  })}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({monthsToFreedom} {language === 'es' ? 'meses' : 'months'})
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              {language === 'es' ? 'Consejos' : 'Tips'}
            </div>
            <ul className="space-y-1">
              {recommendations.slice(0, 2).map((rec, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-primary">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        <LegalDisclaimer variant="education" size="compact" />
      </CardContent>
    </Card>
  );
}
