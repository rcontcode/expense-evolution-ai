import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useIncome } from '@/hooks/data/useIncome';
import { useExpenses } from '@/hooks/data/useExpenses';
import { getMonthlyEquivalent } from '@/lib/constants/bill-categories';
import { format, addDays, differenceInDays, startOfDay, parseISO, startOfMonth, endOfMonth, isBefore, isAfter, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, TrendingUp, TrendingDown, Target, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { ProjectionDisclaimer, type DataSource } from '@/components/projections/ProjectionDisclaimer';

type ScenarioMode = 'realistic' | 'optimistic' | 'pessimistic';

export function BalanceDateLookup() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency, formatCompact } = useFormatCurrency();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [scenario, setScenario] = useState<ScenarioMode>('realistic');

  const now = new Date();
  const { data: bills } = useRecurringBills();
  const { data: allIncome } = useIncome({ year: now.getFullYear() });
  const { data: allExpenses } = useExpenses({
    dateRange: { start: startOfMonth(now), end: endOfMonth(addDays(now, 90)) }
  });

  const dailyProjection = useMemo(() => {
    const today = startOfDay(now);
    const endDate = addDays(today, 90);
    const days = eachDayOfInterval({ start: today, end: endDate });

    const activeBills = (bills || []).filter(b => b.status === 'active');

    const incomeEntries = allIncome || [];
    const currentMonthIncome = incomeEntries
      .filter(i => {
        const d = parseISO(i.date);
        return d >= startOfMonth(now) && d <= endOfMonth(now);
      })
      .reduce((s, i) => s + Number(i.amount), 0);

    const daysInMonth = differenceInDays(endOfMonth(now), startOfMonth(now)) + 1;
    const avgDailyIncome = currentMonthIncome > 0 ? currentMonthIncome / daysInMonth : 0;

    const expEntries = allExpenses || [];
    const currentMonthExpenses = expEntries
      .filter(e => {
        const d = parseISO(e.date);
        return d >= startOfMonth(now) && d <= endOfMonth(now) && isBefore(d, now);
      })
      .reduce((s, e) => s + Number(e.amount), 0);

    const daysPassed = differenceInDays(now, startOfMonth(now)) || 1;
    const avgDailyVariableExpense = currentMonthExpenses / daysPassed;

    const totalMonthlyBills = activeBills.reduce((s, b) => {
      return s + getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined);
    }, 0);
    const avgDailyFixed = totalMonthlyBills / 30;

    // Scenario multipliers
    const multipliers: Record<ScenarioMode, { income: number; expense: number }> = {
      optimistic: { income: 1.1, expense: 0.85 },
      realistic: { income: 1.0, expense: 1.0 },
      pessimistic: { income: 0.9, expense: 1.2 },
    };
    const m = multipliers[scenario];

    let runningBalance = 0;
    const data = days.map((day, i) => {
      const dailyNet = (avgDailyIncome * m.income) - (avgDailyVariableExpense * m.expense) - avgDailyFixed;
      runningBalance += dailyNet;

      return {
        date: day,
        dateStr: format(day, 'MMM dd', { locale: l ? es : undefined }),
        dayLabel: format(day, 'd'),
        balance: runningBalance,
        income: avgDailyIncome * m.income,
        expenses: (avgDailyVariableExpense * m.expense) + avgDailyFixed,
        isToday: i === 0,
      };
    });

    return data;
  }, [bills, allIncome, allExpenses, now, l, scenario]);

  const selectedBalance = useMemo(() => {
    if (!selectedDate || dailyProjection.length === 0) return null;
    const target = startOfDay(selectedDate);
    const today = startOfDay(now);
    const daysDiff = differenceInDays(target, today);
    if (daysDiff < 0 || daysDiff >= dailyProjection.length) return null;
    return dailyProjection[daysDiff];
  }, [selectedDate, dailyProjection, now]);

  if (dailyProjection.length === 0) return null;

  const finalBalance = dailyProjection[dailyProjection.length - 1]?.balance || 0;
  const isPositiveTrend = finalBalance >= 0;
  const chartData = dailyProjection.filter((_, i) => i % 3 === 0 || i === dailyProjection.length - 1);

  const scenarioButtons: { mode: ScenarioMode; label: { es: string; en: string }; icon: typeof Target }[] = [
    { mode: 'optimistic', label: { es: 'Optimista', en: 'Optimistic' }, icon: Zap },
    { mode: 'realistic', label: { es: 'Realista', en: 'Realistic' }, icon: Target },
    { mode: 'pessimistic', label: { es: 'Pesimista', en: 'Pessimistic' }, icon: Shield },
  ];

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 via-transparent to-primary/5" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="p-2.5 rounded-xl bg-gradient-to-br from-chart-2 to-primary shadow-lg shadow-chart-2/25"
            >
              <Target className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-base">
                {l ? '🔮 Cambio Neto Proyectado' : '🔮 Projected Net Change'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {l ? 'Variación proyectada (no balance absoluto)' : 'Projected change (not absolute balance)'}
              </p>
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(
                "gap-2 text-xs font-medium",
                !selectedDate && "text-muted-foreground"
              )}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {selectedDate
                  ? format(selectedDate, 'PPP', { locale: l ? es : undefined })
                  : (l ? 'Elegir fecha' : 'Pick a date')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) =>
                  isBefore(date, startOfDay(now)) || isAfter(date, addDays(now, 90))
                }
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {/* Scenario toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
          {scenarioButtons.map(({ mode, label, icon: Icon }) => (
            <Button
              key={mode}
              variant={scenario === mode ? 'default' : 'ghost'}
              size="sm"
              className={cn("flex-1 text-xs gap-1.5 h-8", scenario !== mode && "text-muted-foreground")}
              onClick={() => setScenario(mode)}
            >
              <Icon className="h-3 w-3" />
              {l ? label.es : label.en}
            </Button>
          ))}
        </div>

        {/* Selected date result */}
        {selectedBalance && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-xl border-2 text-center",
              selectedBalance.balance >= 0
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-destructive/10 border-destructive/30"
            )}
          >
            <p className="text-xs text-muted-foreground mb-1">
              {l ? 'Balance proyectado para' : 'Projected balance for'}{' '}
              <span className="font-semibold text-foreground">
                {format(selectedDate!, 'PPP', { locale: l ? es : undefined })}
              </span>
            </p>
            <p className={cn(
              "text-3xl font-bold",
              selectedBalance.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
            )}>
              {selectedBalance.balance >= 0 ? '+' : ''}{formatCurrency(selectedBalance.balance)}
            </p>
            <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                {formatCurrency(selectedBalance.income)}/{l ? 'día' : 'day'}
              </span>
              <span className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-destructive" />
                {formatCurrency(selectedBalance.expenses)}/{l ? 'día' : 'day'}
              </span>
            </div>
          </motion.div>
        )}

        {/* Chart */}
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGradientLookup" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositiveTrend ? "hsl(var(--chart-4))" : "hsl(var(--destructive))"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isPositiveTrend ? "hsl(var(--chart-4))" : "hsl(var(--destructive))"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis
                dataKey="dateStr"
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={v => formatCompact(v)}
                className="text-muted-foreground"
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [formatCurrency(value), l ? 'Balance' : 'Balance']}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={isPositiveTrend ? "hsl(var(--chart-4))" : "hsl(var(--destructive))"}
                fill="url(#balanceGradientLookup)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/40">
            <p className="text-[10px] text-muted-foreground">{l ? 'En 7 días' : 'In 7 days'}</p>
            <p className={cn("text-sm font-bold", (dailyProjection[7]?.balance || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
              {formatCurrency(dailyProjection[7]?.balance || 0)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/40">
            <p className="text-[10px] text-muted-foreground">{l ? 'En 30 días' : 'In 30 days'}</p>
            <p className={cn("text-sm font-bold", (dailyProjection[30]?.balance || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
              {formatCurrency(dailyProjection[30]?.balance || 0)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/40">
            <p className="text-[10px] text-muted-foreground">{l ? 'En 90 días' : 'In 90 days'}</p>
            <p className={cn("text-sm font-bold", finalBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
              {formatCurrency(finalBalance)}
            </p>
          </div>
        </div>

        {/* Scenario info */}
        <p className="text-[10px] text-center text-muted-foreground">
          {scenario === 'optimistic' && (l ? '📈 +10% ingreso, -15% gasto variable' : '📈 +10% income, -15% variable spending')}
          {scenario === 'realistic' && (l ? '📊 Basado en promedios reales' : '📊 Based on actual averages')}
          {scenario === 'pessimistic' && (l ? '📉 -10% ingreso, +20% gasto variable' : '📉 -10% income, +20% variable spending')}
        </p>

        <ProjectionDisclaimer
          dataSources={[
            { name: { es: 'Ingresos del mes', en: 'Monthly income' }, available: (allIncome || []).length > 0, count: (allIncome || []).length, tip: { es: 'Registra tus ingresos de este mes', en: 'Log your income for this month' } },
            { name: { es: 'Gastos del mes', en: 'Monthly expenses' }, available: (allExpenses || []).length > 0, count: (allExpenses || []).length, tip: { es: 'Registra tus gastos recientes', en: 'Log your recent expenses' } },
            { name: { es: 'Pagos fijos', en: 'Recurring bills' }, available: (bills || []).filter(b => b.status === 'active').length > 0, count: (bills || []).filter(b => b.status === 'active').length, tip: { es: 'Agrega tus pagos recurrentes', en: 'Add your recurring payments' } },
          ]}
          methodology={{
            es: 'Calcula el cambio neto diario (ingreso promedio - gastos variables - gastos fijos) y lo acumula día a día. No es un balance absoluto — muestra cuánto ganarías o perderías desde hoy.',
            en: 'Calculates daily net change (avg income - variable expenses - fixed costs) and accumulates it day by day. Not an absolute balance — shows how much you\'d gain or lose from today.'
          }}
          assumptions={[
            { es: 'Los ingresos y gastos se mantienen al ritmo del mes actual', en: 'Income and expenses maintain current month pace' },
            { es: 'No incluye saldo bancario actual — solo muestra el cambio neto', en: 'Does not include current bank balance — only shows net change' },
          ]}
        />
      </CardContent>
    </Card>
  );
}
