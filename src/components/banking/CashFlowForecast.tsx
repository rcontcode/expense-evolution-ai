import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, ComposedChart, Line
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, Shield, TrendingUp, Calendar
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useBankInsights } from '@/hooks/data/useBankAnalysis';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { motion } from 'framer-motion';
import { format, addMonths, startOfMonth, endOfMonth, parseISO, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ViewMode = 'flow' | 'cumulative' | 'scenarios';

interface ForecastPoint {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
  netFlow: number;
  cumulative: number;
  isProjection: boolean;
  optimistic?: number;
  pessimistic?: number;
}

export function CashFlowForecast() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc, formatCompact } = useFormatCurrency();
  const { data: transactions } = useBankTransactions();
  const insights = useBankInsights();
  const [months, setMonths] = useState<3 | 6>(3);
  const [viewMode, setViewMode] = useState<ViewMode>('flow');

  const now = new Date();
  const currentMonth = startOfMonth(now);
  const sixMonthsAgo = subMonths(currentMonth, 5);
  const futureEnd = endOfMonth(addMonths(now, months));
  const { data: allIncome } = useIncome({ year: now.getFullYear() });
  const { data: allExpenses } = useExpenses({ dateRange: { start: sixMonthsAgo, end: futureEnd } });
  const { data: recurringBills } = useRecurringBills();

  const forecastData = useMemo(() => {
    const data: ForecastPoint[] = [];
    let cumulative = 0;

    for (let i = -5; i <= months; i++) {
      const monthDate = addMonths(currentMonth, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const isProjection = i > 0;

      let monthIncome = 0;
      let monthExpenses = 0;

      if (isProjection) {
        const hist = data.filter(d => !d.isProjection);
        if (hist.length > 0) {
          monthIncome = hist.reduce((s, d) => s + d.income, 0) / hist.length;
          monthExpenses = hist.reduce((s, d) => s + d.expenses, 0) / hist.length;
        }
        const activeBillsTotal = (recurringBills || []).filter(b => b.status === 'active').reduce((s, b) => s + Number(b.amount), 0);
        const bankRecurringTotal = insights.recurringPayments.reduce((s, p) => s + p.amount, 0);
        monthExpenses = Math.max(monthExpenses, activeBillsTotal, bankRecurringTotal);
      } else {
        monthIncome = (allIncome || [])
          .filter(inc => { const d = parseISO(inc.date); return d >= monthStart && d <= monthEnd; })
          .reduce((s, inc) => s + Number(inc.amount), 0);
        monthExpenses = (allExpenses || [])
          .filter(exp => { const d = parseISO(exp.date); return d >= monthStart && d <= monthEnd; })
          .reduce((s, exp) => s + Number(exp.amount), 0);
        if (transactions && monthExpenses === 0) {
          monthExpenses = transactions.filter(t => { const d = parseISO(t.transaction_date); return d >= monthStart && d <= monthEnd; })
            .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
        }
      }

      const netFlow = monthIncome - monthExpenses;
      cumulative += netFlow;

      data.push({
        month: format(monthDate, 'yyyy-MM'),
        monthLabel: format(monthDate, 'MMM', { locale: l ? es : undefined }),
        income: monthIncome,
        expenses: monthExpenses,
        netFlow,
        cumulative,
        isProjection,
        optimistic: isProjection ? monthIncome * 1.1 - monthExpenses * 0.9 : undefined,
        pessimistic: isProjection ? monthIncome * 0.85 - monthExpenses * 1.15 : undefined,
      });
    }
    return data;
  }, [allIncome, allExpenses, transactions, insights.recurringPayments, recurringBills, currentMonth, l, months]);

  if ((!transactions || transactions.length === 0) && (!recurringBills || recurringBills.length === 0) && (!allExpenses || allExpenses.length === 0)) return null;

  const currentMonthData = forecastData.find(d => d.month === format(now, 'yyyy-MM'));
  const projectedMonths = forecastData.filter(d => d.isProjection);
  const avgNetFlow = projectedMonths.length > 0 ? projectedMonths.reduce((s, d) => s + d.netFlow, 0) / projectedMonths.length : 0;
  const isPositive = avgNetFlow >= 0;

  // Months until negative cumulative
  const monthsUntilNegative = projectedMonths.findIndex(d => d.cumulative < 0);
  const runwayMonths = monthsUntilNegative === -1 ? null : monthsUntilNegative + 1;

  // Savings rate
  const totalIncome = forecastData.filter(d => !d.isProjection).reduce((s, d) => s + d.income, 0);
  const totalExpenses = forecastData.filter(d => !d.isProjection).reduce((s, d) => s + d.expenses, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 2 }}
              className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
              <Wallet className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-base">
                {l ? '📈 Flujo de Caja' : '📈 Cash Flow'}
              </CardTitle>
              <CardDescription className="text-xs">
                {l ? `Histórico + ${months}M proyección` : `Historical + ${months}M projection`}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
              {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {fc(Math.abs(avgNetFlow))}/{l ? 'mes' : 'mo'}
            </Badge>
            {savingsRate !== 0 && (
              <span className={cn("text-[10px] font-medium", savingsRate > 0 ? 'text-emerald-600' : 'text-destructive')}>
                {l ? 'Tasa ahorro' : 'Savings rate'}: {savingsRate.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 p-0.5 rounded-md bg-muted/50">
            <Button variant={months === 3 ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-2.5" onClick={() => setMonths(3)}>3M</Button>
            <Button variant={months === 6 ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-2.5" onClick={() => setMonths(6)}>6M</Button>
          </div>
          <div className="flex gap-1 p-0.5 rounded-md bg-muted/50">
            <Button variant={viewMode === 'flow' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-2" onClick={() => setViewMode('flow')}>
              {l ? 'Flujo' : 'Flow'}
            </Button>
            <Button variant={viewMode === 'cumulative' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-2" onClick={() => setViewMode('cumulative')}>
              {l ? 'Acumulado' : 'Cumulative'}
            </Button>
            <Button variant={viewMode === 'scenarios' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-2" onClick={() => setViewMode('scenarios')}>
              {l ? 'Escenarios' : 'Scenarios'}
            </Button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'flow' ? (
              <AreaChart data={forecastData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCompact(v)} className="text-muted-foreground" width={50} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number, name: string) => [fc(value), name === 'income' ? (l ? 'Ingresos' : 'Income') : (l ? 'Gastos' : 'Expenses')]}
                  labelFormatter={(label) => {
                    const p = forecastData.find(d => d.monthLabel === label);
                    return p?.isProjection ? `${label} (${l ? 'proyección' : 'projected'})` : label;
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="hsl(var(--chart-4))" fill="url(#incGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="hsl(var(--chart-5))" fill="url(#expGrad)" strokeWidth={2} />
              </AreaChart>
            ) : viewMode === 'cumulative' ? (
              <AreaChart data={forecastData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCompact(v)} width={50} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => [fc(value), l ? 'Acumulado' : 'Cumulative']}
                />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" fill="url(#cumGrad)" strokeWidth={2.5} />
              </AreaChart>
            ) : (
              <ComposedChart data={forecastData.filter(d => d.isProjection || forecastData.indexOf(d) >= forecastData.length - months - 2)} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCompact(v)} width={50} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      netFlow: l ? 'Base' : 'Base',
                      optimistic: l ? 'Optimista' : 'Optimistic',
                      pessimistic: l ? 'Pesimista' : 'Pessimistic',
                    };
                    return [fc(value), labels[name] || name];
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar dataKey="netFlow" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Line type="monotone" dataKey="optimistic" stroke="hsl(var(--chart-4))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="pessimistic" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend Cards */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-chart-4/10">
            <p className="text-[10px] text-muted-foreground">{l ? 'Ingresos' : 'Income'}</p>
            <p className="text-sm font-bold text-chart-4">{fc(currentMonthData?.income || 0)}</p>
          </div>
          <div className="p-2 rounded-lg bg-chart-5/10">
            <p className="text-[10px] text-muted-foreground">{l ? 'Gastos' : 'Expenses'}</p>
            <p className="text-sm font-bold text-chart-5">{fc(currentMonthData?.expenses || 0)}</p>
          </div>
          <div className={cn("p-2 rounded-lg", (currentMonthData?.netFlow || 0) >= 0 ? 'bg-chart-4/10' : 'bg-destructive/10')}>
            <p className="text-[10px] text-muted-foreground">{l ? 'Neto' : 'Net'}</p>
            <p className={cn("text-sm font-bold", (currentMonthData?.netFlow || 0) >= 0 ? 'text-chart-4' : 'text-destructive')}>
              {(currentMonthData?.netFlow || 0) >= 0 ? '+' : ''}{fc(currentMonthData?.netFlow || 0)}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {runwayMonths !== null && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-destructive">
                {l ? `⚠️ Flujo acumulado negativo en ~${runwayMonths} ${runwayMonths === 1 ? 'mes' : 'meses'}` 
                   : `⚠️ Cumulative flow goes negative in ~${runwayMonths} month${runwayMonths === 1 ? '' : 's'}`}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {l ? 'Considera aumentar ingresos o reducir gastos fijos' : 'Consider increasing income or reducing fixed expenses'}
              </p>
            </div>
          </div>
        )}

        {isPositive && savingsRate > 15 && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {l ? `✨ Tasa de ahorro del ${savingsRate.toFixed(0)}% — excelente disciplina` 
                   : `✨ ${savingsRate.toFixed(0)}% savings rate — excellent discipline`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
