import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoTooltip } from '@/components/ui/info-tooltip';
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
  Flame
} from 'lucide-react';
import { format, differenceInMonths } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

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
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.debtsCount === 0) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
              {language === 'es' ? '¡Sin Deudas!' : 'Debt Free!'}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              {language === 'es' 
                ? 'No tienes pasivos registrados. Agrega deudas en la página de Patrimonio para calcular estrategias de pago.'
                : 'You have no liabilities recorded. Add debts in the Net Worth page to calculate payoff strategies.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Deuda Total' : 'Total Debt'}
                </p>
                <p className="text-lg font-bold">{formatCurrency(data.totalDebt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Flame className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Tasa Más Alta' : 'Highest Rate'}
                </p>
                <p className="text-lg font-bold">{data.highestInterestRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Pagos Mínimos' : 'Min. Payments'}
                </p>
                <p className="text-lg font-bold">{formatCurrency(data.totalMinimumPayments)}/mo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={data.potentialSavings > 100 ? 'border-green-200 dark:border-green-800' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Sparkles className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Ahorro Potencial' : 'Potential Savings'}
                </p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(data.potentialSavings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Extra Payment Slider */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                {language === 'es' ? 'Pago Extra Mensual' : 'Extra Monthly Payment'}
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              +{formatCurrency(extraPayment)}
            </Badge>
          </div>
          <CardDescription>
            {language === 'es' 
              ? 'Aumenta tu pago mensual para liberarte de deudas más rápido'
              : 'Increase your monthly payment to become debt-free faster'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Slider
            value={[extraPayment]}
            onValueChange={([value]) => setExtraPayment(value)}
            min={0}
            max={1000}
            step={25}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>$0</span>
            <span>$250</span>
            <span>$500</span>
            <span>$750</span>
            <span>$1,000</span>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        {data.avalancheStrategy && (
          <StrategyCard
            strategy={data.avalancheStrategy}
            isRecommended={data.recommendedStrategy === 'avalanche'}
            language={language}
            totalDebt={data.totalDebt}
          />
        )}
        {data.snowballStrategy && (
          <StrategyCard
            strategy={data.snowballStrategy}
            isRecommended={data.recommendedStrategy === 'snowball'}
            language={language}
            totalDebt={data.totalDebt}
          />
        )}
      </div>

      {/* Detailed Payoff Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                {language === 'es' ? 'Cronograma de Pago Detallado' : 'Detailed Payoff Timeline'}
              </CardTitle>
            </div>
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
        </CardHeader>
        <CardContent>
          {selectedStrategyData && (
            <div className="space-y-4">
              {selectedStrategyData.payoffOrder.map((debt, index) => {
                const CategoryIcon = iconMap[debt.category] || Receipt;
                const progress = ((data.totalDebt - debt.balance) / data.totalDebt) * 100;
                const categoryInfo = LIABILITY_CATEGORIES.find(c => c.value === debt.category);
                
                return (
                  <div key={debt.id} className="relative">
                    {index < selectedStrategyData.payoffOrder.length - 1 && (
                      <div className="absolute left-[18px] top-10 w-0.5 h-[calc(100%+1rem)] bg-border" />
                    )}
                    
                    <div className="flex gap-4">
                      <div className="relative z-10 flex-shrink-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium">{debt.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {categoryInfo?.label || debt.category}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(debt.balance)}</p>
                            <p className="text-xs text-muted-foreground">
                              {debt.interestRate}% APR
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {language === 'es' ? 'Pago Mínimo' : 'Min. Payment'}
                            </p>
                            <p className="font-medium">{formatCurrency(debt.minimumPayment)}/mo</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {language === 'es' ? 'Tiempo' : 'Time to Payoff'}
                            </p>
                            <p className="font-medium">{formatMonths(debt.monthsToPayoff, language)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {language === 'es' ? 'Interés Pagado' : 'Interest Paid'}
                            </p>
                            <p className="font-medium text-destructive">
                              {formatCurrency(debt.totalInterestPaid)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-muted-foreground">
                            {language === 'es' ? 'Pagado en' : 'Paid off by'}{' '}
                            {format(debt.payoffDate, 'MMMM yyyy', { locale: language === 'es' ? es : enUS })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Debt Free Celebration */}
              <div className="flex gap-4 pt-2">
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <Trophy className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-semibold text-green-700 dark:text-green-400">
                      🎉 {language === 'es' ? '¡Libre de Deudas!' : 'Debt Free!'}
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      {format(selectedStrategyData.debtFreeDate, 'MMMM yyyy', { locale: language === 'es' ? es : enUS })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'es' 
                        ? `Habrás pagado ${formatCurrency(selectedStrategyData.totalInterestPaid)} en intereses`
                        : `You will have paid ${formatCurrency(selectedStrategyData.totalInterestPaid)} in interest`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">
                {language === 'es' ? 'Consejos para Acelerar tu Libertad Financiera' : 'Tips to Accelerate Your Financial Freedom'}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0 text-primary" />
                  {language === 'es' 
                    ? 'Cada $100 extra mensual puede ahorrarte miles en intereses a largo plazo.'
                    : 'Every extra $100/month can save you thousands in interest over time.'}
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0 text-primary" />
                  {language === 'es' 
                    ? 'Considera transferir saldos de tarjetas con alto interés a opciones con menor tasa.'
                    : 'Consider balance transfers from high-interest cards to lower-rate options.'}
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0 text-primary" />
                  {language === 'es' 
                    ? 'Automatiza tus pagos para evitar cargos por mora y mantener tu puntaje crediticio.'
                    : 'Automate payments to avoid late fees and maintain your credit score.'}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
