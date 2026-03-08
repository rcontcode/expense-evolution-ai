import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Target,
  Lightbulb,
  PiggyBank,
  Wallet,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Heart
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useBankInsights } from '@/hooks/data/useBankAnalysis';
import { useCategoryBudgets } from '@/hooks/data/useCategoryBudgets';
import { useUserSettings, UserPreferences } from '@/hooks/data/useUserSettings';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Insight {
  type: 'success' | 'warning' | 'info' | 'tip';
  icon: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; to?: string; onClick?: () => void };
}

export function FinancialHealthPanel() {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const { data: transactions } = useBankTransactions();
  const bankInsights = useBankInsights();
  const { data: budgets } = useCategoryBudgets();
  const { data: settings } = useUserSettings();
  const { data: allIncome } = useIncome();
  const { formatCurrency: fc } = useFormatCurrency();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const { data: expenses } = useExpenses({ dateRange: { start: monthStart, end: monthEnd } });
  const { data: lastExpenses } = useExpenses({ dateRange: { start: lastMonthStart, end: lastMonthEnd } });

  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;
  const userName = profile?.full_name?.split(' ')[0] || '';

  const totalSpent = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  const lastMonthSpent = lastExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  const budgetUsage = globalBudget > 0 ? (totalSpent / globalBudget) * 100 : 0;
  const remainingBudget = globalBudget - totalSpent;
  const recurringTotal = bankInsights.recurringPayments.reduce((sum, p) => sum + p.amount, 0);

  // Income this month
  const monthlyIncome = allIncome?.filter(i => {
    const d = new Date(i.date);
    return d >= monthStart && d <= monthEnd;
  }).reduce((sum, i) => sum + Number(i.amount), 0) || 0;

  // Composite Health Score (0-100)
  const healthScore = useMemo(() => {
    let score = 50; // baseline
    const factors: { name: string; value: number; weight: number }[] = [];

    // Factor 1: Savings rate (0-30 pts)
    if (monthlyIncome > 0) {
      const savingsRate = Math.max(0, (monthlyIncome - totalSpent) / monthlyIncome);
      const savingsPts = Math.min(30, savingsRate * 100);
      factors.push({ name: 'savings', value: savingsPts, weight: 30 });
      score = score - 15 + savingsPts; // replace half of baseline
    }

    // Factor 2: Budget adherence (0-25 pts)
    if (globalBudget > 0) {
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const expectedUsage = (dayOfMonth / daysInMonth) * 100;
      const adherence = budgetUsage <= expectedUsage ? 25 : Math.max(0, 25 - (budgetUsage - expectedUsage) * 0.5);
      factors.push({ name: 'budget', value: adherence, weight: 25 });
      score = score - 12.5 + adherence;
    }

    // Factor 3: Spending stability (0-25 pts) - low variance month over month
    if (lastMonthSpent > 0) {
      const variance = Math.abs(totalSpent - lastMonthSpent) / lastMonthSpent;
      const stability = Math.max(0, 25 - variance * 50);
      factors.push({ name: 'stability', value: stability, weight: 25 });
      score = score - 12.5 + stability;
    }

    // Factor 4: Recurring-to-income ratio (0-20 pts)
    if (monthlyIncome > 0 && recurringTotal > 0) {
      const ratio = recurringTotal / monthlyIncome;
      const fixedScore = ratio < 0.3 ? 20 : ratio < 0.5 ? 15 : ratio < 0.7 ? 10 : 5;
      factors.push({ name: 'fixed', value: fixedScore, weight: 20 });
      score = score - 10 + fixedScore;
    }

    return { score: Math.round(Math.max(0, Math.min(100, score))), factors };
  }, [totalSpent, monthlyIncome, globalBudget, budgetUsage, lastMonthSpent, recurringTotal, now]);

  const scoreColor = healthScore.score >= 75 ? 'text-chart-4' : healthScore.score >= 50 ? 'text-chart-1' : 'text-destructive';
  const scoreLabel = healthScore.score >= 75 
    ? (language === 'es' ? 'Excelente' : 'Excellent')
    : healthScore.score >= 50
    ? (language === 'es' ? 'Bueno' : 'Good')
    : (language === 'es' ? 'Necesita atención' : 'Needs attention');

  // Insights
  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];
    const l = language === 'es';

    if (globalBudget > 0) {
      if (budgetUsage >= 100) {
        result.push({ type: 'warning', icon: AlertTriangle,
          title: l ? '⚠️ Presupuesto excedido' : '⚠️ Budget exceeded',
          description: l ? `Excediste por ${fc(Math.abs(remainingBudget))}` : `Over by ${fc(Math.abs(remainingBudget))}`,
          action: { label: l ? 'Revisar' : 'Review', to: '/expenses' }
        });
      } else if (budgetUsage >= 80) {
        result.push({ type: 'warning', icon: Target,
          title: l ? '👀 Atención con tu presupuesto' : '👀 Watch your budget',
          description: l ? `${budgetUsage.toFixed(0)}% usado. Quedan ${fc(remainingBudget)}` : `${budgetUsage.toFixed(0)}% used. ${fc(remainingBudget)} left`
        });
      } else if (budgetUsage < 50) {
        result.push({ type: 'success', icon: CheckCircle2,
          title: l ? '🎯 ¡Excelente control!' : '🎯 Excellent control!',
          description: l ? `Solo ${budgetUsage.toFixed(0)}% del presupuesto usado` : `Only ${budgetUsage.toFixed(0)}% of budget used`
        });
      }
    }

    if (bankInsights.recurringPayments.length > 0) {
      result.push({ type: 'info', icon: RefreshCw,
        title: l ? `💳 ${bankInsights.recurringPayments.length} pagos fijos` : `💳 ${bankInsights.recurringPayments.length} fixed payments`,
        description: l ? `${fc(recurringTotal)}/mes (${fc(recurringTotal * 12)}/año)` : `${fc(recurringTotal)}/mo (${fc(recurringTotal * 12)}/yr)`
      });
    }

    if (bankInsights.topVendors.length > 0 && bankInsights.topVendors[0].total > 200) {
      const top = bankInsights.topVendors[0];
      result.push({ type: 'tip', icon: Lightbulb,
        title: l ? '💡 Oportunidad de ahorro' : '💡 Savings opportunity',
        description: l ? `${fc(top.total)} en "${top.vendor}". ¿Puedes reducirlo?` : `${fc(top.total)} at "${top.vendor}". Can you reduce it?`
      });
    }

    if (globalBudget === 0 && totalSpent > 0) {
      result.push({ type: 'info', icon: Target,
        title: l ? '📊 Define tu presupuesto' : '📊 Set your budget',
        description: l ? `Gastaste ${fc(totalSpent)} este mes sin meta definida` : `You spent ${fc(totalSpent)} this month with no goal set`,
        action: { label: l ? 'Configurar' : 'Set up', to: '/budget' }
      });
    }

    if ((budgets?.length || 0) === 0 && (transactions?.length || 0) > 0) {
      result.push({ type: 'tip', icon: PiggyBank,
        title: l ? '🎯 Metas por categoría' : '🎯 Category goals',
        description: l ? 'Configura presupuestos por categoría' : 'Set up category budgets',
        action: { label: l ? 'Crear' : 'Create', to: '/budget' }
      });
    }

    return result.slice(0, 3);
  }, [language, globalBudget, budgetUsage, remainingBudget, recurringTotal, bankInsights, budgets, transactions, totalSpent, fc]);

  if (insights.length === 0 && healthScore.score === 50) return null;

  const getInsightStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success': return 'border-chart-4/30 bg-chart-4/5';
      case 'warning': return 'border-chart-5/30 bg-chart-5/5';
      case 'tip': return 'border-chart-1/30 bg-chart-1/5';
      default: return 'border-primary/30 bg-primary/5';
    }
  };

  const getIconStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success': return 'text-chart-4 bg-chart-4/10';
      case 'warning': return 'text-chart-5 bg-chart-5/10';
      case 'tip': return 'text-chart-1 bg-chart-1/10';
      default: return 'text-primary bg-primary/10';
    }
  };

  const l = language === 'es';

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
      
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center gap-3 text-base">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/25"
          >
            <Heart className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <span className="text-primary font-bold">
              {userName 
                ? (l ? `${userName}, tu salud financiera` : `${userName}, your financial health`)
                : (l ? 'Tu salud financiera' : 'Your financial health')}
            </span>
            <p className="text-xs text-muted-foreground font-normal">
              {format(now, 'MMMM yyyy', { locale: l ? es : undefined })}
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 relative">
        {/* Health Score Gauge */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" strokeWidth="3" strokeDasharray={`${healthScore.score}, 100`}
                className={cn(
                  healthScore.score >= 75 ? 'stroke-chart-4' : healthScore.score >= 50 ? 'stroke-chart-1' : 'stroke-destructive'
                )} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-lg font-bold", scoreColor)}>{healthScore.score}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("font-bold text-sm", scoreColor)}>{scoreLabel}</span>
              <Badge variant="outline" className="text-[10px]">{healthScore.score}/100</Badge>
            </div>
            {globalBudget > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{fc(totalSpent)} {l ? 'gastado' : 'spent'}</span>
                  <span className={cn('font-medium', remainingBudget >= 0 ? 'text-chart-4' : 'text-destructive')}>
                    {remainingBudget >= 0 ? fc(remainingBudget) : `-${fc(Math.abs(remainingBudget))}`} {l ? 'disponible' : 'left'}
                  </span>
                </div>
                <Progress value={Math.min(budgetUsage, 100)} className="h-1.5" />
              </div>
            )}
          </div>
        </div>

        {/* Insights */}
        <div className="grid gap-2">
          {insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn('flex items-start gap-3 p-2.5 rounded-xl border transition-all hover:shadow-sm', getInsightStyles(insight.type))}
            >
              <div className={cn('p-1.5 rounded-lg', getIconStyles(insight.type))}>
                <insight.icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs">{insight.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{insight.description}</p>
              </div>
              {insight.action && (
                insight.action.to ? (
                  <Link to={insight.action.to}>
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2">
                      {insight.action.label}<ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={insight.action.onClick}>
                    {insight.action.label}<ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                )
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}