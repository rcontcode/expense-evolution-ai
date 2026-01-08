import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDebtManager, DebtStrategy, DebtPayoffItem } from '@/hooks/data/useDebtManager';
import { LIABILITY_CATEGORIES } from '@/hooks/data/useNetWorth';
import { 
  TrendingDown, 
  Snowflake, 
  Mountain, 
  Calendar, 
  DollarSign, 
  Target,
  Award,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Home,
  Car,
  GraduationCap,
  Banknote,
  Building2,
  Receipt,
  HandCoins,
  Sparkles,
  Trophy,
  Flame,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format, differenceInMonths } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  mortgage: Home,
  car_loan: Car,
  student_loan: GraduationCap,
  credit_card: CreditCard,
  personal_loan: HandCoins,
  line_of_credit: Banknote,
  business_loan: Building2,
  other: Receipt,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonths(months: number, language: string): string {
  if (months === 0) return language === 'es' ? '0 meses' : '0 months';
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (language === 'es') {
    if (years === 0) return `${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
    if (remainingMonths === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
    return `${years} ${years === 1 ? 'año' : 'años'} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
  } else {
    if (years === 0) return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    if (remainingMonths === 0) return `${years} ${years === 1 ? 'year' : 'years'}`;
    return `${years} ${years === 1 ? 'year' : 'years'} and ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
  }
}

interface StrategyCardProps {
  strategy: DebtStrategy;
  isRecommended: boolean;
  language: string;
  totalDebt: number;
}

function StrategyCard({ strategy, isRecommended, language, totalDebt }: StrategyCardProps) {
  const isAvalanche = strategy.name === 'avalanche';
  const Icon = isAvalanche ? Mountain : Snowflake;
  
  const title = isAvalanche 
    ? (language === 'es' ? 'Método Avalancha' : 'Avalanche Method')
    : (language === 'es' ? 'Método Bola de Nieve' : 'Snowball Method');

  return (
    <Card className={`relative overflow-hidden transition-all ${isRecommended ? 'ring-2 ring-primary shadow-lg' : ''}`}>
      {isRecommended && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
            <Trophy className="h-3 w-3 mr-1" />
            {language === 'es' ? 'Recomendado' : 'Recommended'}
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isAvalanche ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
            <Icon className={`h-5 w-5 ${isAvalanche ? 'text-orange-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {strategy.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {language === 'es' ? 'Libre de Deudas' : 'Debt Free'}
            </p>
            <p className="font-semibold text-sm">
              {format(strategy.debtFreeDate, 'MMM yyyy', { locale: language === 'es' ? es : enUS })}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatMonths(strategy.totalMonths, language)}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {language === 'es' ? 'Interés Total' : 'Total Interest'}
            </p>
            <p className="font-semibold text-sm text-destructive">
              {formatCurrency(strategy.totalInterestPaid)}
            </p>
            <p className="text-xs text-muted-foreground">
              {((strategy.totalInterestPaid / totalDebt) * 100).toFixed(1)}% {language === 'es' ? 'del total' : 'of total'}
            </p>
          </div>
        </div>

        {/* Payoff Order Preview */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {language === 'es' ? 'Orden de Pago' : 'Payoff Order'}
          </p>
          <div className="space-y-1.5">
            {strategy.payoffOrder.slice(0, 3).map((debt, index) => {
              const CategoryIcon = iconMap[debt.category] || Receipt;
              return (
                <div key={debt.id} className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium">
                    {index + 1}
                  </span>
                  <CategoryIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="flex-1 truncate">{debt.name}</span>
                  <span className="text-muted-foreground">
                    {formatMonths(debt.monthsToPayoff, language)}
                  </span>
                </div>
              );
            })}
            {strategy.payoffOrder.length > 3 && (
              <p className="text-xs text-muted-foreground pl-6">
                +{strategy.payoffOrder.length - 3} {language === 'es' ? 'más' : 'more'}...
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DebtManagerCard() {
  const { language } = useLanguage();
  const [extraPayment, setExtraPayment] = useState(100);
  const [selectedStrategy, setSelectedStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [showDetails, setShowDetails] = useState(false);
  
  const data = useDebtManager(extraPayment);

  const selectedStrategyData = selectedStrategy === 'avalanche' 
    ? data.avalancheStrategy 
    : data.snowballStrategy;

  if (data.isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.debtsCount === 0) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-700 dark:text-green-400">
              {language === 'es' ? '¡Sin Deudas!' : 'Debt Free!'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'es' 
                ? 'No tienes pasivos registrados.'
                : 'You have no liabilities recorded.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendedStrategy = data.recommendedStrategy === 'avalanche' 
    ? data.avalancheStrategy 
    : data.snowballStrategy;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            <CardTitle className="text-base">
              {language === 'es' ? 'Gestor de Deudas' : 'Debt Manager'}
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-destructive border-destructive/30">
            {data.debtsCount} {language === 'es' ? 'deudas' : 'debts'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Compact Summary - Always Visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2 rounded-lg bg-destructive/5">
            <p className="text-lg font-bold">{formatCurrency(data.totalDebt)}</p>
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Deuda Total' : 'Total Debt'}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-orange-500/5">
            <p className="text-lg font-bold">{data.highestInterestRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Tasa Máxima' : 'Max Rate'}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/5">
            <p className="text-lg font-bold">{formatCurrency(data.totalMinimumPayments)}</p>
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Pago Mín/Mes' : 'Min/Month'}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-500/5">
            <p className="text-lg font-bold text-green-600">
              {recommendedStrategy ? formatMonths(recommendedStrategy.totalMonths, language) : '-'}
            </p>
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Libre en' : 'Free in'}</p>
          </div>
        </div>

        {/* Expand Button */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground">
              <span className="text-sm">
                {showDetails 
                  ? (language === 'es' ? 'Ocultar estrategias y detalles' : 'Hide strategies and details')
                  : (language === 'es' ? 'Ver estrategias de pago' : 'View payoff strategies')
                }
              </span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Extra Payment Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  {language === 'es' ? 'Pago Extra Mensual' : 'Extra Monthly Payment'}
                </span>
                <Badge variant="secondary">+{formatCurrency(extraPayment)}</Badge>
              </div>
              <Slider
                value={[extraPayment]}
                onValueChange={([value]) => setExtraPayment(value)}
                min={0}
                max={1000}
                step={25}
                className="w-full"
              />
            </div>

            {/* Strategy Comparison - Compact */}
            <div className="grid gap-3 md:grid-cols-2">
              {data.avalancheStrategy && (
                <div className={`p-3 rounded-lg border ${data.recommendedStrategy === 'avalanche' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Mountain className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-sm">{language === 'es' ? 'Avalancha' : 'Avalanche'}</span>
                    {data.recommendedStrategy === 'avalanche' && (
                      <Badge variant="default" className="text-xs ml-auto">
                        <Trophy className="h-3 w-3 mr-1" />
                        {language === 'es' ? 'Recomendado' : 'Best'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{data.avalancheStrategy.description}</p>
                  <div className="flex justify-between mt-2 text-sm">
                    <span>{formatMonths(data.avalancheStrategy.totalMonths, language)}</span>
                    <span className="text-destructive">{formatCurrency(data.avalancheStrategy.totalInterestPaid)} int.</span>
                  </div>
                </div>
              )}
              {data.snowballStrategy && (
                <div className={`p-3 rounded-lg border ${data.recommendedStrategy === 'snowball' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Snowflake className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">{language === 'es' ? 'Bola de Nieve' : 'Snowball'}</span>
                    {data.recommendedStrategy === 'snowball' && (
                      <Badge variant="default" className="text-xs ml-auto">
                        <Trophy className="h-3 w-3 mr-1" />
                        {language === 'es' ? 'Recomendado' : 'Best'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{data.snowballStrategy.description}</p>
                  <div className="flex justify-between mt-2 text-sm">
                    <span>{formatMonths(data.snowballStrategy.totalMonths, language)}</span>
                    <span className="text-destructive">{formatCurrency(data.snowballStrategy.totalInterestPaid)} int.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Savings Highlight */}
            {data.potentialSavings > 100 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  {language === 'es' 
                    ? `Usando Avalancha ahorras ${formatCurrency(data.potentialSavings)} en intereses`
                    : `Using Avalanche saves ${formatCurrency(data.potentialSavings)} in interest`}
                </span>
              </div>
            )}

            {/* Detailed Timeline - Nested Collapsible */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Ver cronograma detallado' : 'View detailed timeline'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="flex items-center justify-end mb-3">
                  <Tabs value={selectedStrategy} onValueChange={(v) => setSelectedStrategy(v as any)}>
                    <TabsList className="h-8">
                      <TabsTrigger value="avalanche" className="text-xs px-2 py-1">
                        <Mountain className="h-3 w-3 mr-1" />
                        {language === 'es' ? 'Avalancha' : 'Avalanche'}
                      </TabsTrigger>
                      <TabsTrigger value="snowball" className="text-xs px-2 py-1">
                        <Snowflake className="h-3 w-3 mr-1" />
                        {language === 'es' ? 'Bola de Nieve' : 'Snowball'}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                {selectedStrategyData && (
                  <div className="space-y-3">
                    {selectedStrategyData.payoffOrder.map((debt, index) => {
                      const CategoryIcon = iconMap[debt.category] || Receipt;
                      return (
                        <div key={debt.id} className="flex items-center gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 truncate">{debt.name}</span>
                          <span className="text-muted-foreground">{formatCurrency(debt.balance)}</span>
                          <span className="text-xs text-muted-foreground">{formatMonths(debt.monthsToPayoff, language)}</span>
                        </div>
                      );
                    })}
                    
                    <div className="flex items-center gap-3 pt-2 border-t">
                      <Trophy className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        🎉 {language === 'es' ? 'Libre de deudas:' : 'Debt free:'} {format(selectedStrategyData.debtFreeDate, 'MMM yyyy', { locale: language === 'es' ? es : enUS })}
                      </span>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <LegalDisclaimer variant="education" size="compact" />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
