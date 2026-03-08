import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { 
  TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle
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

type ViewMode = 'area' | 'bars';

interface ForecastPoint {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
  netFlow: number;
  cumulative: number;
  isProjection: boolean;
}

export function CashFlowForecast() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc, formatCompact } = useFormatCurrency();
  const { data: transactions } = useBankTransactions();
  const insights = useBankInsights();
  const [months, setMonths] = useState<3 | 6>(3);
  const [viewMode, setViewMode] = useState<ViewMode>('area');

  const now = new Date();
  const currentMonth = startOfMonth(now);

  const sixMonthsAgo = subMonths(currentMonth, 5);
  const futureEnd = endOfMonth(addMonths(now, months));
  const { data: allIncome } = useIncome({ year: now.getFullYear() });
  const { data: allExpenses } = useExpenses({ 
    dateRange: { start: sixMonthsAgo, end: futureEnd } 
  });
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
        const historicalMonths = data.filter(d => !d.isProjection);
        if (historicalMonths.length > 0) {
          monthIncome = historicalMonths.reduce((sum, d) => sum + d.income, 0) / historicalMonths.length;
          monthExpenses = historicalMonths.reduce((sum, d) => sum + d.expenses, 0) / historicalMonths.length;
        }

        const activeBillsTotal = (recurringBills || [])
          .filter(b => b.status === 'active')
          .reduce((sum, b) => sum + Number(b.amount), 0);
        const bankRecurringTotal = insights.recurringPayments.reduce((sum, p) => sum + p.amount, 0);
        monthExpenses = Math.max(monthExpenses, activeBillsTotal, bankRecurringTotal);
      } else {
        monthIncome = (allIncome || [])
          .filter(inc => { const d = parseISO(inc.date); return d >= monthStart && d <= monthEnd; })
          .reduce((sum, inc) => sum + Number(inc.amount), 0);

        monthExpenses = (allExpenses || [])
          .filter(exp => { const d = parseISO(exp.date); return d >= monthStart && d <= monthEnd; })
          .reduce((sum, exp) => sum + Number(exp.amount), 0);

        if (transactions && monthExpenses === 0) {
          monthExpenses = transactions
            .filter(t => { const d = parseISO(t.transaction_date); return d >= monthStart && d <= monthEnd; })
            .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
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
      });
    }

    return data;
  }, [allIncome, allExpenses, transactions, insights.recurringPayments, recurringBills, currentMonth, l, months]);

  if ((!transactions || transactions.length === 0) && (!recurringBills || recurringBills.length === 0) && (!allExpenses || allExpenses.length === 0)) return null;

  const currentMonthData = forecastData.find(d => d.month === format(now, 'yyyy-MM'));
  const projectedMonths = forecastData.filter(d => d.isProjection);
  const avgNetFlow = projectedMonths.length > 0
    ? projectedMonths.reduce((sum, d) => sum + d.netFlow, 0) / projectedMonths.length
    : 0;
  const isPositive = avgNetFlow >= 0;

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
                {l ? `Histórico + ${months} meses proyección` : `Historical + ${months}-month projection`}
              </CardDescription>
            </div>
          </div>
          <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
            {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {fc(Math.abs(avgNetFlow))}/{l ? 'mes' : 'mo'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {/* Controls */}
        <div className="flex gap-2">
          <div className="flex gap-1 p-0.5 rounded-md bg-muted/50">
            <Button variant={months === 3 ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-2.5" onClick={() => setMonths(3)}>3M</Button>
            <Button variant={months === 6 ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-2.5" onClick={() => setMonths(6)}>6M</Button>
          </div>
          <div className="flex gap-1 p-0.5 rounded-md bg-muted/50">
            <Button variant={viewMode === 'area' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-2.5" onClick={() => setViewMode('area')}>
              {l ? 'Área' : 'Area'}
            </Button>
            <Button variant={viewMode === 'bars' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-2.5" onClick={() => setViewMode('bars')}>
              {l ? 'Barras' : 'Bars'}
            </Button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'area' ? (
              <AreaChart data={forecastData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
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
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="income" stroke="hsl(var(--chart-4))" fill="url(#incomeGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="hsl(var(--chart-5))" fill="url(#expenseGrad)" strokeWidth={2} />
              </AreaChart>
            ) : (
              <BarChart data={forecastData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCompact(v)} className="text-muted-foreground" width={50} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => [fc(value), l ? 'Flujo neto' : 'Net flow']}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar dataKey="netFlow" radius={[4, 4, 0, 0]}>
                  {forecastData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.netFlow >= 0 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))'}
                      opacity={entry.isProjection ? 0.6 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend */}
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

        {!isPositive && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">{l ? '⚠️ Flujo negativo proyectado' : '⚠️ Negative flow projected'}</p>
              <p className="text-xs text-muted-foreground">
                {l ? 'Se proyecta un déficit. Considera reducir gastos o aumentar ingresos.' : 'A deficit is projected. Consider reducing expenses or increasing income.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
