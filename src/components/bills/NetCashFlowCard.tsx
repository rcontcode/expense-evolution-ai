import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useIncomeSummary } from '@/hooks/data/useIncome';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { getMonthlyEquivalent, BILL_CATEGORY_CONFIG, type BillCategory, BILL_PRIORITIES } from '@/lib/constants/bill-categories';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Bar, ComposedChart } from 'recharts';
import { addMonths, format, getDaysInMonth, getDate, differenceInDays, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowDownCircle, ArrowUpCircle, PiggyBank, TrendingDown, Scale,
  CalendarDays, Zap, ShieldCheck, Clock, Target, Flame, Coffee, DollarSign
} from 'lucide-react';

export function NetCashFlowCard() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency, formatCompact } = useFormatCurrency();
  const { data: bills } = useRecurringBills();
  const { data: incomeSummary } = useIncomeSummary();
  const { data: dashStats } = useDashboardStats({});

  const analysis = useMemo(() => {
    const activeBills = bills?.filter(b => b.status === 'active') || [];
    const now = new Date();
    const currentMonthKey = format(now, 'yyyy-MM');
    const daysInMonth = getDaysInMonth(now);
    const dayOfMonth = getDate(now);
    const daysRemaining = daysInMonth - dayOfMonth;
    const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) };

    // Monthly fixed costs
    const monthlyFixedCosts = activeBills.reduce((sum, b) => {
      return sum + getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined);
    }, 0);

    // Annual fixed costs
    const annualFixedCosts = monthlyFixedCosts * 12;

    // Daily fixed cost
    const dailyFixedCost = monthlyFixedCosts / daysInMonth;

    // Current month income
    const currentMonthIncome = incomeSummary?.byMonth?.[currentMonthKey] || 0;

    // Average monthly income (last 6 months)
    const monthKeys = Object.keys(incomeSummary?.byMonth || {}).sort().slice(-6);
    const avgMonthlyIncome = monthKeys.length > 0
      ? monthKeys.reduce((s, k) => s + (incomeSummary?.byMonth?.[k] || 0), 0) / monthKeys.length
      : currentMonthIncome;

    const effectiveIncome = avgMonthlyIncome || currentMonthIncome;
    const netCashFlow = effectiveIncome - monthlyFixedCosts;
    const fixedCostRatio = effectiveIncome > 0 ? (monthlyFixedCosts / effectiveIncome) * 100 : 0;

    // Daily available after bills
    const dailyAvailable = daysRemaining > 0 ? netCashFlow / daysRemaining : netCashFlow;

    // Variable expenses this month (from dashboard stats)
    const variableExpenses = dashStats?.monthlyTotal || 0;
    const totalMonthlySpend = monthlyFixedCosts + variableExpenses;
    const trueNetRemaining = effectiveIncome - totalMonthlySpend;

    // Autopay stats
    const autopayBills = activeBills.filter(b => b.auto_pay);
    const autopayTotal = autopayBills.reduce((s, b) => s + getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined), 0);
    const manualTotal = monthlyFixedCosts - autopayTotal;
    const autopayPct = monthlyFixedCosts > 0 ? (autopayTotal / monthlyFixedCosts) * 100 : 0;

    // Priority breakdown
    const byPriority: Record<string, { count: number; total: number }> = {};
    activeBills.forEach(b => {
      const p = b.priority || 'medium';
      if (!byPriority[p]) byPriority[p] = { count: 0, total: 0 };
      byPriority[p].count++;
      byPriority[p].total += getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined);
    });

    // Biggest bill
    const biggestBill = activeBills.length > 0
      ? activeBills.reduce((max, b) => {
          const monthly = getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined);
          return monthly > max.amount ? { name: b.name, amount: monthly, icon: BILL_CATEGORY_CONFIG[b.category as BillCategory]?.icon || '📋' } : max;
        }, { name: '', amount: 0, icon: '📋' })
      : null;

    // Bills due this month
    const thisMonthBills = activeBills.filter(b =>
      isWithinInterval(parseISO(b.next_due_date), monthInterval)
    );
    const paidThisMonth = thisMonthBills.filter(b => {
      if (!b.last_paid_date) return false;
      return isWithinInterval(parseISO(b.last_paid_date), monthInterval);
    });
    const monthProgress = thisMonthBills.length > 0 ? (paidThisMonth.length / thisMonthBills.length) * 100 : 100;

    // Next payment
    const nextBill = activeBills
      .filter(b => differenceInDays(parseISO(b.next_due_date), now) >= 0)
      .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))[0] || null;
    const daysToNext = nextBill ? differenceInDays(parseISO(nextBill.next_due_date), now) : null;

    // 6-month projection with variable expenses included
    const projection = Array.from({ length: 6 }, (_, i) => {
      const month = addMonths(now, i);
      const monthName = format(month, 'MMM', { locale: l ? es : undefined });
      return {
        name: monthName,
        income: effectiveIncome,
        fixed: monthlyFixedCosts,
        variable: variableExpenses,
        net: effectiveIncome - monthlyFixedCosts - variableExpenses,
      };
    });

    return {
      monthlyFixedCosts,
      annualFixedCosts,
      dailyFixedCost,
      currentMonthIncome,
      avgMonthlyIncome: effectiveIncome,
      netCashFlow,
      fixedCostRatio,
      dailyAvailable,
      variableExpenses,
      totalMonthlySpend,
      trueNetRemaining,
      autopayTotal,
      manualTotal,
      autopayPct,
      byPriority,
      biggestBill,
      monthProgress,
      paidCount: paidThisMonth.length,
      totalThisMonth: thisMonthBills.length,
      nextBill,
      daysToNext,
      daysRemaining,
      dayOfMonth,
      daysInMonth,
      totalBills: activeBills.length,
      projection,
    };
  }, [bills, incomeSummary, dashStats, l]);

  const isHealthy = analysis.fixedCostRatio < 50;
  const isWarning = analysis.fixedCostRatio >= 50 && analysis.fixedCostRatio < 70;

  const priorityConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    critical: { color: 'hsl(0, 80%, 50%)', label: l ? 'Crítico' : 'Critical', icon: <Flame className="h-3 w-3" /> },
    high: { color: 'hsl(25, 80%, 50%)', label: l ? 'Alto' : 'High', icon: <Zap className="h-3 w-3" /> },
    medium: { color: 'hsl(45, 80%, 50%)', label: l ? 'Medio' : 'Medium', icon: <Target className="h-3 w-3" /> },
    low: { color: 'hsl(130, 50%, 45%)', label: l ? 'Bajo' : 'Low', icon: <Coffee className="h-3 w-3" /> },
  };

  return (
    <div className="space-y-4">
      {/* ═══ MAIN BALANCE CARD ═══ */}
      <Card className="overflow-hidden border-2 border-primary/20">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              {l ? 'Balance: Ingreso vs Compromisos' : 'Balance: Income vs Commitments'}
            </CardTitle>
            {analysis.nextBill && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Clock className="h-3 w-3" />
                {l ? 'Próximo en' : 'Next in'} {analysis.daysToNext === 0 ? (l ? 'Hoy' : 'Today') : `${analysis.daysToNext}d`}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Three-column: Income / Fixed / Available */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <ArrowUpCircle className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{l ? 'Ingreso Prom.' : 'Avg Income'}</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(analysis.avgMonthlyIncome)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(analysis.avgMonthlyIncome * 12)}/{l ? 'año' : 'yr'}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <ArrowDownCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{l ? 'Compromisos' : 'Commitments'}</p>
              <p className="text-base font-bold text-red-600 dark:text-red-400">{formatCurrency(analysis.monthlyFixedCosts)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(analysis.annualFixedCosts)}/{l ? 'año' : 'yr'}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className={`text-center p-3 rounded-xl border ${analysis.netCashFlow >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
              <PiggyBank className={`h-5 w-5 mx-auto mb-1 ${analysis.netCashFlow >= 0 ? 'text-blue-500' : 'text-destructive'}`} />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{l ? 'Disponible' : 'Available'}</p>
              <p className={`text-base font-bold ${analysis.netCashFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-destructive'}`}>
                {formatCurrency(analysis.netCashFlow)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatCurrency(analysis.dailyAvailable)}/{l ? 'día' : 'day'}
              </p>
            </motion.div>
          </div>

          {/* Fixed cost ratio bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{l ? 'Ratio de compromisos fijos' : 'Fixed commitment ratio'}</span>
              <Badge variant={isHealthy ? 'default' : isWarning ? 'secondary' : 'destructive'} className="text-[10px] h-5">
                {analysis.fixedCostRatio.toFixed(0)}%{isHealthy ? ' ✅' : isWarning ? ' ⚠️' : ' 🚨'}
              </Badge>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(analysis.fixedCostRatio, 100)}%` }} transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-destructive'}`} />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isHealthy
                ? (l ? '💡 Compromisos saludables (<50% del ingreso). Buen margen para ahorro e inversión.' : '💡 Healthy commitments (<50% of income). Good margin for savings & investment.')
                : isWarning
                  ? (l ? '⚠️ Tus compromisos consumen >50% del ingreso. Poco margen de maniobra.' : '⚠️ Commitments consume >50% of income. Limited flexibility.')
                  : (l ? '🚨 Compromisos >70% del ingreso — riesgo alto. Revisa prioridades.' : '🚨 Commitments >70% of income — high risk. Review priorities.')}
            </p>
          </div>

          <Separator />

          {/* ═══ DETAILED BREAKDOWN ═══ */}
          <div className="grid grid-cols-2 gap-3">
            {/* True Net: after fixed + variable */}
            <div className="p-2.5 rounded-lg bg-muted/50 border space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                {l ? '💰 Neto Real (fijo+variable)' : '💰 True Net (fixed+variable)'}
              </p>
              <p className={`text-sm font-bold ${analysis.trueNetRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                {formatCurrency(analysis.trueNetRemaining)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {l ? 'Gastos variables: ' : 'Variable expenses: '}{formatCurrency(analysis.variableExpenses)}
              </p>
            </div>

            {/* Daily budget */}
            <div className="p-2.5 rounded-lg bg-muted/50 border space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                {l ? '📅 Presupuesto Diario' : '📅 Daily Budget'}
              </p>
              <p className="text-sm font-bold">{formatCurrency(analysis.dailyFixedCost)}</p>
              <p className="text-[10px] text-muted-foreground">
                {l ? `Quedan ${analysis.daysRemaining} días del mes` : `${analysis.daysRemaining} days left this month`}
              </p>
            </div>

            {/* Autopay vs Manual */}
            <div className="p-2.5 rounded-lg bg-muted/50 border space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                {l ? '⚡ Automático vs Manual' : '⚡ Autopay vs Manual'}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${analysis.autopayPct}%` }} transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] font-medium">{analysis.autopayPct.toFixed(0)}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {formatCurrency(analysis.autopayTotal)} {l ? 'auto' : 'auto'} · {formatCurrency(analysis.manualTotal)} {l ? 'manual' : 'manual'}
              </p>
            </div>

            {/* Month payment progress */}
            <div className="p-2.5 rounded-lg bg-muted/50 border space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                {l ? '✅ Progreso del Mes' : '✅ Month Progress'}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${analysis.monthProgress}%` }} transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-primary" />
                </div>
                <span className="text-[10px] font-medium">{analysis.paidCount}/{analysis.totalThisMonth}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {l ? `Día ${analysis.dayOfMonth} de ${analysis.daysInMonth}` : `Day ${analysis.dayOfMonth} of ${analysis.daysInMonth}`}
              </p>
            </div>
          </div>

          {/* Priority breakdown */}
          {Object.keys(analysis.byPriority).length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                {l ? '🎯 Por Prioridad' : '🎯 By Priority'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['critical', 'high', 'medium', 'low'].map(p => {
                  const data = analysis.byPriority[p];
                  if (!data) return null;
                  const cfg = priorityConfig[p];
                  const pct = analysis.monthlyFixedCosts > 0 ? (data.total / analysis.monthlyFixedCosts) * 100 : 0;
                  return (
                    <motion.div key={p} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="p-2 rounded-lg border text-center" style={{ borderColor: `${cfg.color}33`, backgroundColor: `${cfg.color}0D` }}>
                      <div className="flex items-center justify-center gap-1 mb-0.5" style={{ color: cfg.color }}>
                        {cfg.icon}
                        <span className="text-[10px] font-medium">{cfg.label}</span>
                      </div>
                      <p className="text-xs font-bold">{formatCurrency(data.total)}</p>
                      <p className="text-[10px] text-muted-foreground">{data.count} {l ? 'pagos' : 'bills'} · {pct.toFixed(0)}%</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Biggest bill highlight */}
          {analysis.biggestBill && analysis.biggestBill.amount > 0 && (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-xl">{analysis.biggestBill.icon}</span>
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{l ? 'Mayor compromiso' : 'Biggest commitment'}</p>
                <p className="text-sm font-semibold">{analysis.biggestBill.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatCurrency(analysis.biggestBill.amount)}<span className="text-[10px] text-muted-foreground font-normal">/{l ? 'mes' : 'mo'}</span></p>
                <p className="text-[10px] text-muted-foreground">
                  {analysis.avgMonthlyIncome > 0 ? `${((analysis.biggestBill.amount / analysis.avgMonthlyIncome) * 100).toFixed(1)}% ${l ? 'del ingreso' : 'of income'}` : ''}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ PROJECTION CHART ═══ */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-chart-1" />
              {l ? 'Proyección: Ingreso vs Compromisos (6 meses)' : 'Projection: Income vs Commitments (6 months)'}
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {l ? 'Neto:' : 'Net:'} {formatCurrency(analysis.netCashFlow)}/{l ? 'mes' : 'mo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analysis.projection}>
                <defs>
                  <linearGradient id="ncf-incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} width={65} className="text-muted-foreground" />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'income' ? (l ? 'Ingreso' : 'Income')
                      : name === 'fixed' ? (l ? 'Fijos' : 'Fixed')
                      : name === 'variable' ? (l ? 'Variables' : 'Variable')
                      : (l ? 'Neto' : 'Net')
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="hsl(142, 70%, 45%)" fill="url(#ncf-incomeGrad)" strokeWidth={2.5} name="income" />
                <Bar dataKey="fixed" stackId="spend" fill="hsl(0, 70%, 50%)" opacity={0.8} radius={[0, 0, 0, 0]} name="fixed" />
                <Bar dataKey="variable" stackId="spend" fill="hsl(45, 80%, 50%)" opacity={0.7} radius={[3, 3, 0, 0]} name="variable" />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block opacity-70" />
              {l ? 'Ingreso' : 'Income'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm bg-red-500 inline-block opacity-80" />
              {l ? 'Fijos' : 'Fixed'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm bg-amber-500 inline-block opacity-70" />
              {l ? 'Variables' : 'Variable'}
            </span>
          </div>

          {/* Quick stats under chart */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">{l ? 'Costo Diario Fijo' : 'Daily Fixed Cost'}</p>
              <p className="text-xs font-bold">{formatCurrency(analysis.dailyFixedCost)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">{l ? 'Costo Anual Fijo' : 'Annual Fixed Cost'}</p>
              <p className="text-xs font-bold">{formatCurrency(analysis.annualFixedCosts)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">{l ? 'Total Pagos' : 'Total Bills'}</p>
              <p className="text-xs font-bold">{analysis.totalBills}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
