import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { Fuel, TrendingDown, TrendingUp, AlertTriangle, Shield, Zap } from 'lucide-react';
import { subMonths, isAfter, differenceInDays } from 'date-fns';

interface RunwayMetrics {
  avgDailyExpense: number;
  avgDailyIncome: number;
  monthlyBurn: number;
  monthlyIncome: number;
  netMonthlyRate: number;
  runwayDays: number | null; // null = infinite (income > expense)
  monthlyRecurring: number;
  savingsRate: number;
  riskLevel: 'safe' | 'caution' | 'warning' | 'critical';
  weeklyBurn: number;
}

export function CashFlowRunwayCalculator() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const { data: bills } = useRecurringBills();

  const metrics = useMemo<RunwayMetrics>(() => {
    const threeMonthsAgo = subMonths(new Date(), 3);
    const now = new Date();
    const daysInPeriod = differenceInDays(now, threeMonthsAgo) || 90;

    // Expenses in last 3 months
    const recentExpenses = (expenses || []).filter(e =>
      isAfter(new Date(e.date), threeMonthsAgo)
    );
    const totalExpenses = recentExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const avgDailyExpense = totalExpenses / daysInPeriod;
    const monthlyBurn = avgDailyExpense * 30;

    // Income in last 3 months
    const recentIncome = (income || []).filter(i =>
      isAfter(new Date(i.date), threeMonthsAgo)
    );
    const totalIncome = recentIncome.reduce((sum, i) => sum + Number(i.amount), 0);
    const avgDailyIncome = totalIncome / daysInPeriod;
    const monthlyIncome = avgDailyIncome * 30;

    // Recurring bills
    const monthlyRecurring = (bills || [])
      .filter(b => b.status === 'active')
      .reduce((sum, b) => {
        const amount = Number(b.amount);
        if (b.frequency === 'weekly') return sum + amount * 4.33;
        if (b.frequency === 'biweekly') return sum + amount * 2.17;
        if (b.frequency === 'quarterly') return sum + amount / 3;
        if (b.frequency === 'yearly' || b.frequency === 'annual') return sum + amount / 12;
        return sum + amount; // monthly
      }, 0);

    const netMonthlyRate = monthlyIncome - monthlyBurn;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyBurn) / monthlyIncome) * 100 : 0;
    
    // Runway: if spending > income, how long can savings sustain?
    const runwayDays = netMonthlyRate >= 0 ? null : Math.abs(Math.round((monthlyIncome * 3) / avgDailyExpense));

    const riskLevel: RunwayMetrics['riskLevel'] =
      savingsRate >= 20 ? 'safe' :
      savingsRate >= 5 ? 'caution' :
      savingsRate >= 0 ? 'warning' : 'critical';

    return {
      avgDailyExpense,
      avgDailyIncome,
      monthlyBurn,
      monthlyIncome,
      netMonthlyRate,
      runwayDays,
      monthlyRecurring,
      savingsRate,
      riskLevel,
      weeklyBurn: avgDailyExpense * 7,
    };
  }, [expenses, income, bills]);

  const riskConfig = {
    safe: { color: 'text-success', bg: 'bg-success/10', icon: Shield, label: { es: 'Saludable', en: 'Healthy' } },
    caution: { color: 'text-primary', bg: 'bg-primary/10', icon: Zap, label: { es: 'Moderado', en: 'Moderate' } },
    warning: { color: 'text-warning', bg: 'bg-warning/10', icon: AlertTriangle, label: { es: 'Precaución', en: 'Caution' } },
    critical: { color: 'text-destructive', bg: 'bg-destructive/10', icon: TrendingDown, label: { es: 'Crítico', en: 'Critical' } },
  };

  const risk = riskConfig[metrics.riskLevel];
  const RiskIcon = risk.icon;

  const formatCurrency = (n: number) => `$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Fuel className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">
                {l ? 'Pista de Efectivo' : 'Cash Runway'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {l ? 'Salud de tu flujo de caja (3 meses)' : 'Cash flow health (3 months)'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`${risk.bg} ${risk.color} border-0`}>
            <RiskIcon className="h-3 w-3 mr-1" />
            {risk.label[language]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main runway indicator */}
        <div className="text-center p-4 rounded-xl bg-muted/50 border">
          {metrics.netMonthlyRate >= 0 ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-success" />
                <span className="text-3xl font-bold text-success">
                  +{formatCurrency(metrics.netMonthlyRate)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {l ? 'superávit mensual promedio' : 'average monthly surplus'}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <span className="text-3xl font-bold text-destructive">
                  {metrics.runwayDays} {l ? 'días' : 'days'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {l ? 'de pista estimada al ritmo actual' : 'estimated runway at current pace'}
              </p>
            </>
          )}
        </div>

        {/* Savings rate bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">{l ? 'Tasa de ahorro' : 'Savings rate'}</span>
            <span className={`text-xs font-bold ${metrics.savingsRate >= 20 ? 'text-success' : metrics.savingsRate >= 0 ? 'text-warning' : 'text-destructive'}`}>
              {metrics.savingsRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={Math.max(0, Math.min(100, metrics.savingsRate))} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {l ? 'Meta recomendada: 20%+' : 'Recommended target: 20%+'}
          </p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
            <p className="text-xs text-muted-foreground">{l ? 'Ingreso mensual' : 'Monthly income'}</p>
            <p className="text-lg font-bold text-success">{formatCurrency(metrics.monthlyIncome)}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(metrics.avgDailyIncome)}/{l ? 'día' : 'day'}</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-xs text-muted-foreground">{l ? 'Gasto mensual' : 'Monthly spend'}</p>
            <p className="text-lg font-bold text-destructive">{formatCurrency(metrics.monthlyBurn)}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(metrics.avgDailyExpense)}/{l ? 'día' : 'day'}</p>
          </div>
        </div>

        {/* Key insights */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{l ? 'Gastos fijos mensuales' : 'Fixed monthly costs'}</span>
            <span className="font-medium">{formatCurrency(metrics.monthlyRecurring)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{l ? 'Gasto semanal promedio' : 'Avg weekly spend'}</span>
            <span className="font-medium">{formatCurrency(metrics.weeklyBurn)}</span>
          </div>
          {metrics.monthlyRecurring > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{l ? '% fijo vs variable' : 'Fixed vs variable %'}</span>
              <span className="font-medium">
                {Math.round((metrics.monthlyRecurring / metrics.monthlyBurn) * 100)}% {l ? 'fijo' : 'fixed'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
