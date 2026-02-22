import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap, TrendingUp, PiggyBank, Clock, Target,
  Shield, Flame, ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useUserSettings, UserPreferences } from '@/hooks/data/useUserSettings';
import { useBankInsights } from '@/hooks/data/useBankAnalysis';
import { motion } from 'framer-motion';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ScoreDimension {
  id: string;
  label: string;
  score: number; // 0-100
  icon: React.ElementType;
  detail: string;
  color: string;
  weight: number;
}

export function MoneyMomentumScore() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const { data: currentExpenses } = useExpenses({ dateRange: { start: monthStart, end: monthEnd } });
  const { data: lastExpenses } = useExpenses({ dateRange: { start: lastMonthStart, end: lastMonthEnd } });
  const { data: allIncome } = useIncome();
  const { data: settings } = useUserSettings();
  const bankInsights = useBankInsights();

  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;

  const dimensions = useMemo<ScoreDimension[]>(() => {
    const result: ScoreDimension[] = [];

    // Current month totals
    const currentTotal = currentExpenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;
    const lastTotal = lastExpenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;

    // Monthly income
    const recentIncome = allIncome?.filter(i => {
      const d = new Date(i.date);
      return d >= monthStart && d <= monthEnd;
    }) || [];
    const monthlyIncome = recentIncome.reduce((s, i) => s + Number(i.amount), 0);

    // 1. Savings Rate (weight: 30%)
    let savingsScore = 0;
    let savingsDetail = '';
    if (monthlyIncome > 0) {
      const rate = ((monthlyIncome - currentTotal) / monthlyIncome) * 100;
      savingsScore = Math.min(100, Math.max(0, rate * 2.5)); // 40% rate = 100 score
      savingsDetail = l
        ? `${rate.toFixed(0)}% de tus ingresos ahorrados`
        : `${rate.toFixed(0)}% of income saved`;
    } else {
      savingsDetail = l ? 'Agrega ingresos para calcular' : 'Add income to calculate';
    }
    result.push({
      id: 'savings',
      label: l ? 'Tasa de Ahorro' : 'Savings Rate',
      score: savingsScore,
      icon: PiggyBank,
      detail: savingsDetail,
      color: 'text-chart-4',
      weight: 30,
    });

    // 2. Budget Adherence (weight: 25%)
    let budgetScore = 50; // neutral if no budget
    let budgetDetail = '';
    if (globalBudget > 0) {
      const usage = (currentTotal / globalBudget) * 100;
      const dayProgress = (now.getDate() / 30) * 100;
      if (usage <= dayProgress) {
        budgetScore = Math.min(100, 80 + (dayProgress - usage));
      } else {
        budgetScore = Math.max(0, 80 - (usage - dayProgress) * 2);
      }
      budgetDetail = l
        ? `${usage.toFixed(0)}% del presupuesto usado`
        : `${usage.toFixed(0)}% of budget used`;
    } else {
      budgetDetail = l ? 'Configura un presupuesto' : 'Set up a budget';
    }
    result.push({
      id: 'budget',
      label: l ? 'Control de Presupuesto' : 'Budget Control',
      score: budgetScore,
      icon: Target,
      detail: budgetDetail,
      color: 'text-chart-1',
      weight: 25,
    });

    // 3. Spending Trend (weight: 20%)
    let trendScore = 50;
    let trendDetail = '';
    if (lastTotal > 0 && currentTotal > 0) {
      const change = ((currentTotal - lastTotal) / lastTotal) * 100;
      if (change < -10) {
        trendScore = Math.min(100, 80 + Math.abs(change));
        trendDetail = l
          ? `${Math.abs(change).toFixed(0)}% menos vs mes pasado ✓`
          : `${Math.abs(change).toFixed(0)}% less vs last month ✓`;
      } else if (change > 20) {
        trendScore = Math.max(0, 50 - change);
        trendDetail = l
          ? `${change.toFixed(0)}% más vs mes pasado ⚠`
          : `${change.toFixed(0)}% more vs last month ⚠`;
      } else {
        trendScore = 70;
        trendDetail = l ? 'Gasto estable' : 'Stable spending';
      }
    } else {
      trendDetail = l ? 'Necesitas 2+ meses de datos' : 'Need 2+ months of data';
    }
    result.push({
      id: 'trend',
      label: l ? 'Tendencia de Gasto' : 'Spending Trend',
      score: trendScore,
      icon: TrendingUp,
      detail: trendDetail,
      color: 'text-chart-5',
      weight: 20,
    });

    // 4. Financial Awareness (weight: 15%) - categorization, receipts, tracking
    const totalExpenses = currentExpenses?.length || 0;
    const categorized = currentExpenses?.filter(e => e.category && e.category !== 'other').length || 0;
    const withReceipts = currentExpenses?.filter(e => e.document_id).length || 0;
    const awarenessScore = totalExpenses > 0
      ? Math.min(100, ((categorized / totalExpenses) * 50 + (withReceipts / totalExpenses) * 50 + Math.min(totalExpenses, 20) * 2.5))
      : 0;
    result.push({
      id: 'awareness',
      label: l ? 'Conciencia Financiera' : 'Financial Awareness',
      score: awarenessScore,
      icon: Shield,
      detail: l
        ? `${categorized}/${totalExpenses} categorizados, ${withReceipts} con recibo`
        : `${categorized}/${totalExpenses} categorized, ${withReceipts} with receipt`,
      color: 'text-primary',
      weight: 15,
    });

    // 5. Consistency (weight: 10%) - recurring tracking
    const recurringCount = bankInsights.recurringPayments.length;
    const consistencyScore = Math.min(100, recurringCount > 0 ? 60 + totalExpenses * 2 : totalExpenses * 5);
    result.push({
      id: 'consistency',
      label: l ? 'Consistencia' : 'Consistency',
      score: consistencyScore,
      icon: Flame,
      detail: l
        ? `${recurringCount} pagos recurrentes monitoreados`
        : `${recurringCount} recurring payments monitored`,
      color: 'text-chart-3',
      weight: 10,
    });

    return result;
  }, [currentExpenses, lastExpenses, allIncome, globalBudget, bankInsights, now, l, fc]);

  // Weighted composite score
  const totalScore = useMemo(() => {
    const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
    return dimensions.reduce((s, d) => s + (d.score * d.weight), 0) / totalWeight;
  }, [dimensions]);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { emoji: '🚀', label: l ? 'Excepcional' : 'Exceptional', color: 'text-chart-4' };
    if (score >= 60) return { emoji: '💪', label: l ? 'Sólido' : 'Solid', color: 'text-chart-1' };
    if (score >= 40) return { emoji: '📈', label: l ? 'En Progreso' : 'In Progress', color: 'text-chart-5' };
    return { emoji: '🌱', label: l ? 'Comenzando' : 'Starting', color: 'text-muted-foreground' };
  };

  const scoreInfo = getScoreLabel(totalScore);

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-chart-1/5 to-chart-4/5" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-chart-1 shadow-lg shadow-primary/25"
          >
            <Zap className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {l ? '⚡ Money Momentum' : '⚡ Money Momentum'}
              <Badge variant="secondary" className="text-xs">{l ? 'Exclusivo' : 'Exclusive'}</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {l ? 'Tu índice integral de salud financiera' : 'Your comprehensive financial health index'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {/* Main Score */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-chart-4/10 border border-primary/20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center shadow-xl shadow-primary/30">
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                <span className="text-2xl font-black">{Math.round(totalScore)}</span>
              </div>
            </div>
          </motion.div>
          <div className="flex-1">
            <p className="text-lg font-bold flex items-center gap-2">
              <span>{scoreInfo.emoji}</span>
              <span className={scoreInfo.color}>{scoreInfo.label}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {l
                ? 'Basado en 5 dimensiones de tu comportamiento financiero real'
                : 'Based on 5 dimensions of your real financial behavior'
              }
            </p>
          </div>
        </div>

        {/* Dimensions Breakdown */}
        <div className="space-y-2">
          {dimensions.map((dim, i) => (
            <motion.div
              key={dim.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-2.5 rounded-lg border border-border/50 bg-muted/20"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <dim.icon className={cn("h-3.5 w-3.5", dim.color)} />
                <span className="text-xs font-medium flex-1">{dim.label}</span>
                <span className="text-xs font-bold">{Math.round(dim.score)}/100</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{dim.weight}%</Badge>
              </div>
              <Progress value={dim.score} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-1">{dim.detail}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
