import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  PiggyBank,
  ArrowRight,
  Clock,
  CalendarDays,
  Zap,
  ShieldCheck,
  Repeat
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useBankInsights } from '@/hooks/data/useBankAnalysis';
import { useUserSettings, UserPreferences } from '@/hooks/data/useUserSettings';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { startOfMonth, endOfMonth, subMonths, parseISO, format, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SmartInsight {
  id: string;
  type: 'achievement' | 'warning' | 'opportunity' | 'tip' | 'goal';
  priority: number;
  icon: React.ElementType;
  title: string;
  description: string;
  metric?: { value: string; label: string; trend?: 'up' | 'down' };
  action?: { label: string; to?: string };
}

export function SmartInsightsEngine() {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const { data: transactions } = useBankTransactions();
  const insights = useBankInsights();
  const { data: settings } = useUserSettings();
  const { data: allIncome } = useIncome();
  const { formatCurrency: fc } = useFormatCurrency();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const twoMonthsAgoStart = startOfMonth(subMonths(now, 2));
  const twoMonthsAgoEnd = endOfMonth(subMonths(now, 2));

  const { data: currentExpenses } = useExpenses({ dateRange: { start: monthStart, end: monthEnd } });
  const { data: lastExpenses } = useExpenses({ dateRange: { start: lastMonthStart, end: lastMonthEnd } });
  const { data: twoMonthsAgoExpenses } = useExpenses({ dateRange: { start: twoMonthsAgoStart, end: twoMonthsAgoEnd } });

  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;
  const userName = profile?.full_name?.split(' ')[0] || '';

  const smartInsights = useMemo<SmartInsight[]>(() => {
    const result: SmartInsight[] = [];
    const l = language === 'es';

    const currentTotal = currentExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const lastTotal = lastExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const twoMonthsTotal = twoMonthsAgoExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const percentChange = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

    // 3-month trend detection
    const isConsistentIncrease = currentTotal > lastTotal && lastTotal > twoMonthsTotal && twoMonthsTotal > 0;
    const isConsistentDecrease = currentTotal < lastTotal && lastTotal < twoMonthsTotal && twoMonthsTotal > 0;

    // MoM spending comparison
    if (lastTotal > 0) {
      if (percentChange < -10) {
        result.push({
          id: 'spending-down',
          type: 'achievement',
          priority: 1,
          icon: TrendingDown,
          title: l ? `🎉 ¡Excelente ${userName}!` : `🎉 Excellent ${userName}!`,
          description: l
            ? `Redujiste tus gastos ${Math.abs(percentChange).toFixed(0)}% vs el mes pasado${isConsistentDecrease ? ' — ¡3 meses consecutivos mejorando!' : ''}`
            : `You reduced spending ${Math.abs(percentChange).toFixed(0)}% vs last month${isConsistentDecrease ? ' — 3 consecutive months improving!' : ''}`,
          metric: {
            value: `-${Math.abs(percentChange).toFixed(0)}%`,
            label: l ? 'vs mes anterior' : 'vs last month',
            trend: 'down'
          }
        });
      } else if (percentChange > 20) {
        result.push({
          id: 'spending-up',
          type: 'warning',
          priority: isConsistentIncrease ? 1 : 2,
          icon: TrendingUp,
          title: isConsistentIncrease
            ? (l ? '🚨 Tendencia alcista por 3 meses' : '🚨 3-month upward trend')
            : (l ? '📈 Gastos en aumento' : '📈 Spending increasing'),
          description: l
            ? `Tus gastos subieron ${percentChange.toFixed(0)}% este mes.${isConsistentIncrease ? ' Llevas 3 meses consecutivos aumentando.' : ' Revisa dónde puedes ajustar.'}`
            : `Your spending is up ${percentChange.toFixed(0)}% this month.${isConsistentIncrease ? ' This is the 3rd consecutive month increasing.' : ' Review where you can adjust.'}`,
          metric: {
            value: `+${percentChange.toFixed(0)}%`,
            label: l ? 'vs mes anterior' : 'vs last month',
            trend: 'up'
          },
          action: { label: l ? 'Ver detalles' : 'View details', to: '/expenses' }
        });
      }
    }

    // Budget status with pace analysis
    if (globalBudget > 0) {
      const usage = (currentTotal / globalBudget) * 100;
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const expectedUsage = (dayOfMonth / daysInMonth) * 100;

      if (usage < expectedUsage * 0.8) {
        const projectedSavings = globalBudget - (currentTotal / dayOfMonth) * daysInMonth;
        result.push({
          id: 'budget-ahead',
          type: 'achievement',
          priority: 3,
          icon: Target,
          title: l ? '🎯 Adelantado en tu meta' : '🎯 Ahead of your goal',
          description: l
            ? `Vas por debajo de tu ritmo ideal. Proyección de ahorro: ${fc(Math.max(0, projectedSavings))}`
            : `You're below your ideal pace. Projected savings: ${fc(Math.max(0, projectedSavings))}`,
          metric: {
            value: `${usage.toFixed(0)}%`,
            label: l ? `del presupuesto (ideal: ${expectedUsage.toFixed(0)}%)` : `of budget (ideal: ${expectedUsage.toFixed(0)}%)`
          }
        });
      } else if (usage > 100) {
        result.push({
          id: 'budget-exceeded',
          type: 'warning',
          priority: 1,
          icon: AlertTriangle,
          title: l ? '⚠️ Presupuesto excedido' : '⚠️ Budget exceeded',
          description: l
            ? `Has superado tu presupuesto por ${fc(currentTotal - globalBudget)}`
            : `You've exceeded your budget by ${fc(currentTotal - globalBudget)}`,
          action: { label: l ? 'Ajustar presupuesto' : 'Adjust budget', to: '/budget' }
        });
      }
    }

    // Day-of-week spending pattern
    const allItems: { date: string; amount: number }[] = [
      ...(currentExpenses || []).filter(e => !e.deleted_at).map(e => ({ date: e.date, amount: Math.abs(Number(e.amount)) })),
      ...(transactions || []).filter(t => !t.matched_expense_id).map(t => ({ date: t.transaction_date, amount: Math.abs(Number(t.amount)) }))
    ];

    if (allItems.length >= 10) {
      const dayTotals: Record<number, { sum: number; count: number }> = {};
      allItems.forEach(i => {
        const d = getDay(parseISO(i.date));
        if (!dayTotals[d]) dayTotals[d] = { sum: 0, count: 0 };
        dayTotals[d].sum += i.amount;
        dayTotals[d].count++;
      });

      const dayEntries = Object.entries(dayTotals).map(([d, v]) => ({
        day: Number(d),
        avg: v.count > 0 ? v.sum / v.count : 0
      }));
      const highest = dayEntries.sort((a, b) => b.avg - a.avg)[0];
      const lowest = dayEntries.sort((a, b) => a.avg - b.avg)[0];

      if (highest && lowest && highest.avg > lowest.avg * 2) {
        const dayNames = l
          ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
          : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        result.push({
          id: 'day-pattern',
          type: 'tip',
          priority: 5,
          icon: CalendarDays,
          title: l ? '📅 Patrón de día detectado' : '📅 Day pattern detected',
          description: l
            ? `Gastas más los ${dayNames[highest.day]} (~${fc(highest.avg)}/día) y menos los ${dayNames[lowest.day]} (~${fc(lowest.avg)}/día)`
            : `You spend most on ${dayNames[highest.day]}s (~${fc(highest.avg)}/day) and least on ${dayNames[lowest.day]}s (~${fc(lowest.avg)}/day)`,
        });
      }
    }

    // Category velocity - fastest growing category
    if (currentExpenses && lastExpenses) {
      const currentByCat: Record<string, number> = {};
      const lastByCat: Record<string, number> = {};
      currentExpenses.forEach(e => {
        if (e.category) currentByCat[e.category] = (currentByCat[e.category] || 0) + Number(e.amount);
      });
      lastExpenses.forEach(e => {
        if (e.category) lastByCat[e.category] = (lastByCat[e.category] || 0) + Number(e.amount);
      });

      let fastestGrowth = { cat: '', pct: 0, amount: 0 };
      Object.entries(currentByCat).forEach(([cat, curr]) => {
        const prev = lastByCat[cat] || 0;
        if (prev > 50) {
          const pct = ((curr - prev) / prev) * 100;
          if (pct > fastestGrowth.pct && pct > 30) {
            fastestGrowth = { cat, pct, amount: curr - prev };
          }
        }
      });

      if (fastestGrowth.cat) {
        result.push({
          id: 'category-velocity',
          type: 'warning',
          priority: 4,
          icon: Zap,
          title: l ? `⚡ Categoría en ascenso: ${fastestGrowth.cat}` : `⚡ Rising category: ${fastestGrowth.cat}`,
          description: l
            ? `Aumentó +${fastestGrowth.pct.toFixed(0)}% (+${fc(fastestGrowth.amount)}) vs mes anterior`
            : `Up +${fastestGrowth.pct.toFixed(0)}% (+${fc(fastestGrowth.amount)}) vs last month`,
          metric: { value: `+${fastestGrowth.pct.toFixed(0)}%`, label: fastestGrowth.cat, trend: 'up' },
          action: { label: l ? 'Ver categoría' : 'View category', to: '/expenses' }
        });
      }
    }

    // Recurring payments insight
    const recurringTotal = insights.recurringPayments.reduce((sum, p) => sum + p.amount, 0);
    if (recurringTotal > 100) {
      const yearlyRecurring = recurringTotal * 12;
      const currentMonthIncome = allIncome?.filter(i => {
        const d = new Date(i.date);
        return d >= monthStart && d <= monthEnd;
      }).reduce((sum, i) => sum + Number(i.amount), 0) || 0;

      const fixedRatio = currentMonthIncome > 0 ? (recurringTotal / currentMonthIncome) * 100 : 0;

      result.push({
        id: 'recurring-insight',
        type: fixedRatio > 50 ? 'warning' : 'tip',
        priority: 4,
        icon: Repeat,
        title: l ? '💳 Gastos fijos' : '💳 Fixed expenses',
        description: l
          ? `${fc(recurringTotal)}/mes en pagos fijos (${fc(yearlyRecurring)}/año)${fixedRatio > 0 ? ` — ${fixedRatio.toFixed(0)}% de tus ingresos` : ''}`
          : `${fc(recurringTotal)}/mo in fixed payments (${fc(yearlyRecurring)}/yr)${fixedRatio > 0 ? ` — ${fixedRatio.toFixed(0)}% of income` : ''}`,
        metric: {
          value: fc(recurringTotal),
          label: l ? '/mes fijo' : '/mo fixed'
        }
      });
    }

    // Savings rate with income
    const currentMonthIncome = allIncome?.filter(i => {
      const d = new Date(i.date);
      return d >= monthStart && d <= monthEnd;
    }).reduce((sum, i) => sum + Number(i.amount), 0) || 0;

    if (currentMonthIncome > 0 && currentTotal > 0) {
      const savingsRate = ((currentMonthIncome - currentTotal) / currentMonthIncome) * 100;
      if (savingsRate >= 20) {
        result.push({
          id: 'savings-rate',
          type: 'achievement',
          priority: 2,
          icon: ShieldCheck,
          title: l ? `💪 Tasa de ahorro: ${savingsRate.toFixed(0)}%` : `💪 Savings rate: ${savingsRate.toFixed(0)}%`,
          description: l
            ? `Ahorrando ${fc(currentMonthIncome - currentTotal)} este mes. ${savingsRate >= 30 ? '¡Nivel experto!' : '¡Excelente disciplina!'}`
            : `Saving ${fc(currentMonthIncome - currentTotal)} this month. ${savingsRate >= 30 ? 'Expert level!' : 'Excellent discipline!'}`,
          metric: { value: `${savingsRate.toFixed(0)}%`, label: l ? 'tasa de ahorro' : 'savings rate' }
        });
      } else if (savingsRate < 5 && savingsRate >= 0) {
        result.push({
          id: 'low-savings',
          type: 'warning',
          priority: 2,
          icon: AlertTriangle,
          title: l ? '⚠️ Tasa de ahorro baja' : '⚠️ Low savings rate',
          description: l
            ? `Solo ahorras el ${savingsRate.toFixed(0)}% de tus ingresos. Necesitas ${fc(currentMonthIncome * 0.2 - (currentMonthIncome - currentTotal))} más para llegar al 20%.`
            : `You're only saving ${savingsRate.toFixed(0)}% of income. You need ${fc(currentMonthIncome * 0.2 - (currentMonthIncome - currentTotal))} more to reach 20%.`,
          action: { label: l ? 'Ver gastos' : 'View expenses', to: '/expenses' }
        });
      }
    }

    // Savings potential
    if (globalBudget > 0 && currentTotal < globalBudget && currentMonthIncome === 0) {
      const potentialSavings = globalBudget - currentTotal;
      result.push({
        id: 'savings-potential',
        type: 'opportunity',
        priority: 5,
        icon: PiggyBank,
        title: l ? '💰 Potencial de ahorro' : '💰 Savings potential',
        description: l
          ? `Si mantienes este ritmo, podrías ahorrar ${fc(potentialSavings)} este mes`
          : `If you maintain this pace, you could save ${fc(potentialSavings)} this month`,
        metric: {
          value: fc(potentialSavings),
          label: l ? 'posible ahorro' : 'potential savings'
        }
      });
    }

    return result.sort((a, b) => a.priority - b.priority).slice(0, 6);
  }, [currentExpenses, lastExpenses, twoMonthsAgoExpenses, transactions, globalBudget, insights.recurringPayments, userName, language, now, allIncome, fc]);

  if (smartInsights.length === 0) return null;

  const l = language === 'es';

  const getTypeStyles = (type: SmartInsight['type']) => {
    switch (type) {
      case 'achievement': return 'border-chart-4/30 bg-chart-4/5';
      case 'warning': return 'border-chart-5/30 bg-chart-5/5';
      case 'opportunity': return 'border-chart-1/30 bg-chart-1/5';
      case 'goal': return 'border-primary/30 bg-primary/5';
      default: return 'border-muted bg-muted/50';
    }
  };

  const getIconStyles = (type: SmartInsight['type']) => {
    switch (type) {
      case 'achievement': return 'bg-chart-4/10 text-chart-4';
      case 'warning': return 'bg-chart-5/10 text-chart-5';
      case 'opportunity': return 'bg-chart-1/10 text-chart-1';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-chart-1 shadow-lg shadow-primary/25"
          >
            <Brain className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {l ? '🧠 Insights Inteligentes' : '🧠 Smart Insights'}
              <Badge variant="secondary" className="text-xs">{smartInsights.length}</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {l ? 'Análisis proactivo de tus finanzas' : 'Proactive analysis of your finances'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 relative">
        {smartInsights.map((insight, idx) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 }}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm",
              getTypeStyles(insight.type)
            )}
          >
            <div className={cn("p-1.5 rounded-lg shrink-0", getIconStyles(insight.type))}>
              <insight.icon className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{insight.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>

              {insight.metric && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn(
                    "text-base font-bold",
                    insight.metric.trend === 'up' ? 'text-destructive' :
                    insight.metric.trend === 'down' ? 'text-chart-4' : ''
                  )}>
                    {insight.metric.value}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{insight.metric.label}</span>
                </div>
              )}
            </div>

            {insight.action && (
              <Link to={insight.action.to || '#'}>
                <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0 px-2">
                  {insight.action.label}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
