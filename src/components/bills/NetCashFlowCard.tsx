import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useIncomeSummary } from '@/hooks/data/useIncome';
import { getMonthlyEquivalent } from '@/lib/constants/bill-categories';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, PiggyBank, TrendingDown, Scale } from 'lucide-react';

export function NetCashFlowCard() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency, formatCompact } = useFormatCurrency();
  const { data: bills } = useRecurringBills();
  const { data: incomeSummary } = useIncomeSummary();

  const analysis = useMemo(() => {
    const activeBills = bills?.filter(b => b.status === 'active') || [];
    const now = new Date();
    const currentMonthKey = format(now, 'yyyy-MM');

    // Monthly fixed costs
    const monthlyFixedCosts = activeBills.reduce((sum, b) => {
      return sum + getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined);
    }, 0);

    // Current month income (from byMonth data)
    const currentMonthIncome = incomeSummary?.byMonth?.[currentMonthKey] || 0;

    // Average monthly income (last 6 months)
    const monthKeys = Object.keys(incomeSummary?.byMonth || {}).sort().slice(-6);
    const avgMonthlyIncome = monthKeys.length > 0
      ? monthKeys.reduce((s, k) => s + (incomeSummary?.byMonth?.[k] || 0), 0) / monthKeys.length
      : currentMonthIncome;

    const netCashFlow = (avgMonthlyIncome || currentMonthIncome) - monthlyFixedCosts;
    const fixedCostRatio = avgMonthlyIncome > 0 ? (monthlyFixedCosts / avgMonthlyIncome) * 100 : 0;

    // 6-month projection
    const projection = Array.from({ length: 6 }, (_, i) => {
      const month = addMonths(now, i);
      const monthName = format(month, 'MMM', { locale: l ? es : undefined });
      const income = avgMonthlyIncome;
      const costs = monthlyFixedCosts;
      const net = income - costs;
      return { name: monthName, income, costs, net };
    });

    return {
      monthlyFixedCosts,
      currentMonthIncome,
      avgMonthlyIncome: avgMonthlyIncome || currentMonthIncome,
      netCashFlow,
      fixedCostRatio,
      projection,
    };
  }, [bills, incomeSummary, l]);

  const isHealthy = analysis.fixedCostRatio < 50;
  const isWarning = analysis.fixedCostRatio >= 50 && analysis.fixedCostRatio < 70;

  return (
    <div className="space-y-4">
      {/* Main Balance Card */}
      <Card className="overflow-hidden border-2 border-primary/20">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            {l ? 'Balance: Ingreso vs Pagos Fijos' : 'Balance: Income vs Fixed Payments'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Three-column summary */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <ArrowUpCircle className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {l ? 'Ingreso Prom.' : 'Avg Income'}
              </p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(analysis.avgMonthlyIncome)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <ArrowDownCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {l ? 'Pagos Fijos' : 'Fixed Bills'}
              </p>
              <p className="text-base font-bold text-red-600 dark:text-red-400">
                {formatCurrency(analysis.monthlyFixedCosts)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`text-center p-3 rounded-xl border ${
                analysis.netCashFlow >= 0
                  ? 'bg-blue-500/10 border-blue-500/20'
                  : 'bg-destructive/10 border-destructive/20'
              }`}
            >
              <PiggyBank className={`h-5 w-5 mx-auto mb-1 ${analysis.netCashFlow >= 0 ? 'text-blue-500' : 'text-destructive'}`} />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {l ? 'Disponible' : 'Available'}
              </p>
              <p className={`text-base font-bold ${analysis.netCashFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-destructive'}`}>
                {formatCurrency(analysis.netCashFlow)}
              </p>
            </motion.div>
          </div>

          {/* Fixed cost ratio indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {l ? 'Ratio de gastos fijos' : 'Fixed cost ratio'}
              </span>
              <Badge
                variant={isHealthy ? 'default' : isWarning ? 'secondary' : 'destructive'}
                className="text-[10px] h-5"
              >
                {analysis.fixedCostRatio.toFixed(0)}%
                {isHealthy ? ' ✅' : isWarning ? ' ⚠️' : ' 🚨'}
              </Badge>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(analysis.fixedCostRatio, 100)}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${
                  isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-destructive'
                }`}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isHealthy
                ? (l ? '💡 Tus pagos fijos están en un rango saludable (<50% del ingreso)' : '💡 Your fixed payments are in a healthy range (<50% of income)')
                : isWarning
                  ? (l ? '⚠️ Tus pagos fijos consumen más del 50% de tu ingreso' : '⚠️ Your fixed payments consume over 50% of income')
                  : (l ? '🚨 Tus pagos fijos superan el 70% de tu ingreso — revisa prioridades' : '🚨 Fixed payments exceed 70% of income — review priorities')
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 6-Month Projection Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-chart-1" />
            {l ? 'Proyección Ingreso vs Pagos (6 meses)' : 'Income vs Payments Projection (6 months)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysis.projection}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 70%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} width={65} className="text-muted-foreground" />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'income' ? (l ? 'Ingreso' : 'Income')
                      : name === 'costs' ? (l ? 'Pagos Fijos' : 'Fixed Bills')
                      : (l ? 'Neto' : 'Net')
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="hsl(142, 70%, 45%)" fill="url(#incomeGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="costs" stroke="hsl(0, 70%, 50%)" fill="url(#costsGrad)" strokeWidth={2} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-emerald-500 inline-block" />
              {l ? 'Ingreso' : 'Income'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-red-500 inline-block" />
              {l ? 'Pagos Fijos' : 'Fixed Bills'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
