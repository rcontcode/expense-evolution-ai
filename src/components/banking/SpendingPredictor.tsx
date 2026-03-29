import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useBankInsights } from '@/hooks/data/useBankAnalysis';
import { useUserSettings, UserPreferences } from '@/hooks/data/useUserSettings';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { getMonthlyEquivalent } from '@/lib/constants/bill-categories';
import { ProjectionDisclaimer, type DataSource } from '@/components/projections/ProjectionDisclaimer';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, getDaysInMonth, subMonths, parseISO, getDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function SpendingPredictor() {
  const { language } = useLanguage();
  const { data: transactions } = useBankTransactions();
  const { data: expenses } = useExpenses();
  const { data: settings } = useUserSettings();
  const { formatCurrency: fc } = useFormatCurrency();
  const insights = useBankInsights();
  const { data: bills } = useRecurringBills();
  
  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;
  
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = getDaysInMonth(now);
  const daysRemaining = daysInMonth - dayOfMonth;
  const monthProgress = (dayOfMonth / daysInMonth) * 100;
  
  // Unify both data sources
  const unifiedData = useMemo(() => {
    const items: { date: string; amount: number }[] = [];
    if (expenses?.length) {
      expenses.forEach(e => {
        if (!e.deleted_at) items.push({ date: e.date, amount: Math.abs(Number(e.amount)) });
      });
    }
    if (transactions?.length) {
      transactions.forEach(t => {
        if (!t.matched_expense_id) items.push({ date: t.transaction_date, amount: Math.abs(Number(t.amount)) });
      });
    }
    return items;
  }, [transactions, expenses]);
  
  const predictions = useMemo(() => {
    if (unifiedData.length === 0) return null;
    
    const monthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    
    const currentMonthItems = unifiedData.filter(item => {
      const date = parseISO(item.date);
      return date >= monthStart && date <= now;
    });
    
    const currentSpent = currentMonthItems.reduce((sum, item) => sum + item.amount, 0);
    const dailyAvg = dayOfMonth > 0 ? currentSpent / dayOfMonth : 0;
    
    // Add pending recurring bills for remaining days
    const activeBills = (bills || []).filter(b => b.status === 'active');
    const monthlyBillsTotal = activeBills.reduce((s, b) => 
      s + getMonthlyEquivalent(Number(b.amount), b.frequency, b.frequency_months || undefined), 0);
    const dailyBillsAvg = monthlyBillsTotal / daysInMonth;
    const remainingBillsCost = dailyBillsAvg * daysRemaining;
    
    const monthEndPrediction = currentSpent + (dailyAvg * daysRemaining) + remainingBillsCost;
    
    const lastMonthItems = unifiedData.filter(item => {
      const date = parseISO(item.date);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });
    const lastMonthTotal = lastMonthItems.reduce((sum, item) => sum + item.amount, 0);
    
    const projectedSavings = globalBudget > 0 ? globalBudget - monthEndPrediction : 0;
    const onTrack = globalBudget > 0 ? monthEndPrediction <= globalBudget : true;
    const percentChange = lastMonthTotal > 0 ? ((monthEndPrediction - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    
    // Weekend vs Weekday analysis
    const weekdayItems = currentMonthItems.filter(i => { const d = getDay(parseISO(i.date)); return d >= 1 && d <= 5; });
    const weekendItems = currentMonthItems.filter(i => { const d = getDay(parseISO(i.date)); return d === 0 || d === 6; });
    
    const weekdayDays = eachDayOfInterval({ start: monthStart, end: now }).filter(d => { const day = getDay(d); return day >= 1 && day <= 5; }).length;
    const weekendDays = eachDayOfInterval({ start: monthStart, end: now }).filter(d => { const day = getDay(d); return day === 0 || day === 6; }).length;
    
    const weekdayAvg = weekdayDays > 0 ? weekdayItems.reduce((s, i) => s + i.amount, 0) / weekdayDays : 0;
    const weekendAvg = weekendDays > 0 ? weekendItems.reduce((s, i) => s + i.amount, 0) / weekendDays : 0;
    const weekendPremium = weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0;
    
    // Weekly pace: spending per week of the month
    const weeklyPace: { week: number; total: number; days: number }[] = [];
    for (let w = 0; w < 5; w++) {
      const weekStart = w * 7 + 1;
      const weekEnd = Math.min((w + 1) * 7, daysInMonth);
      if (weekStart > dayOfMonth) break;
      const weekItems = currentMonthItems.filter(i => {
        const d = parseISO(i.date).getDate();
        return d >= weekStart && d <= Math.min(weekEnd, dayOfMonth);
      });
      const activeDays = Math.min(weekEnd, dayOfMonth) - weekStart + 1;
      weeklyPace.push({
        week: w + 1,
        total: weekItems.reduce((s, i) => s + i.amount, 0),
        days: activeDays
      });
    }
    
    // Ideal daily budget
    const idealDaily = globalBudget > 0 ? (globalBudget - currentSpent) / Math.max(daysRemaining, 1) : 0;
    
    return {
      monthEndPrediction, dailyAvg, currentSpent, lastMonthTotal,
      projectedSavings, onTrack, percentChange, daysRemaining,
      weekdayAvg, weekendAvg, weekendPremium,
      weeklyPace, idealDaily
    };
  }, [unifiedData, globalBudget, dayOfMonth, daysInMonth, now, daysRemaining, bills]);

  const disclaimerSources: DataSource[] = useMemo(() => [
    { name: { es: 'Gastos manuales', en: 'Manual expenses' }, available: (expenses?.length || 0) > 0, count: expenses?.length, tip: { es: 'Registra tus gastos diarios', en: 'Log your daily expenses' } },
    { name: { es: 'Transacciones bancarias', en: 'Bank transactions' }, available: (transactions?.length || 0) > 0, count: transactions?.length, tip: { es: 'Importa tu estado de cuenta', en: 'Import your bank statement' } },
    { name: { es: 'Pagos fijos recurrentes', en: 'Recurring bills' }, available: (bills?.filter(b => b.status === 'active').length || 0) > 0, count: bills?.filter(b => b.status === 'active').length, tip: { es: 'Agrega tus pagos fijos (renta, servicios, suscripciones)', en: 'Add your fixed payments (rent, utilities, subscriptions)' } },
    { name: { es: 'Presupuesto global', en: 'Global budget' }, available: globalBudget > 0, tip: { es: 'Configura tu presupuesto mensual en ajustes', en: 'Set your monthly budget in settings' } },
  ], [expenses, transactions, bills, globalBudget]);
  
  if (!predictions || unifiedData.length === 0) return null;
  
  const l = language === 'es';
  
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 via-transparent to-primary/5" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="p-2.5 rounded-xl bg-gradient-to-br from-chart-2 to-primary shadow-lg shadow-chart-2/25"
            >
              <Sparkles className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-base">
                {l ? '🔮 Predicción de Gastos' : '🔮 Spending Prediction'}
              </CardTitle>
              <CardDescription className="text-xs">
                {l ? 'Análisis unificado de gastos y banco' : 'Unified expense & bank analysis'}
              </CardDescription>
            </div>
          </div>
          <Badge variant={predictions.onTrack ? 'default' : 'destructive'} className="text-xs">
            {predictions.onTrack 
              ? (l ? '✓ En meta' : '✓ On track')
              : (l ? '⚠️ Sobre presupuesto' : '⚠️ Over budget')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 relative">
        {/* Month progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {format(now, 'MMMM', { locale: l ? es : undefined })}
            </span>
            <span className="text-muted-foreground">
              {l ? `${daysRemaining} días restantes` : `${daysRemaining} days left`}
            </span>
          </div>
          <Progress value={monthProgress} className="h-2" />
        </div>
        
        {/* Prediction cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl bg-muted/50 border"
          >
            <p className="text-xs text-muted-foreground mb-1">
              {l ? 'Proyección fin de mes' : 'End of month projection'}
            </p>
            <p className="text-2xl font-bold">{fc(predictions.monthEndPrediction)}</p>
            {predictions.percentChange !== 0 && (
              <div className={cn(
                "flex items-center gap-1 text-xs mt-1",
                predictions.percentChange > 0 ? 'text-destructive' : 'text-chart-4'
              )}>
                {predictions.percentChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(predictions.percentChange).toFixed(0)}% {l ? 'vs mes anterior' : 'vs last month'}
              </div>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "p-3 rounded-xl border",
              predictions.projectedSavings >= 0 
                ? 'bg-chart-4/10 border-chart-4/30' 
                : 'bg-destructive/10 border-destructive/30'
            )}
          >
            <p className="text-xs text-muted-foreground mb-1">
              {predictions.projectedSavings >= 0 
                ? (l ? 'Ahorro proyectado' : 'Projected savings')
                : (l ? 'Exceso proyectado' : 'Projected excess')}
            </p>
            <p className={cn("text-2xl font-bold", predictions.projectedSavings >= 0 ? 'text-chart-4' : 'text-destructive')}>
              {fc(Math.abs(predictions.projectedSavings))}
            </p>
            {globalBudget > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {l ? `de ${fc(globalBudget)} presupuesto` : `of ${fc(globalBudget)} budget`}
              </p>
            )}
          </motion.div>
        </div>

        {/* Weekend vs Weekday comparison */}
        {predictions.weekdayAvg > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border">
              <Sun className="h-3.5 w-3.5 text-chart-1" />
              <div>
                <p className="text-[10px] text-muted-foreground">{l ? 'L-V promedio' : 'M-F average'}</p>
                <p className="text-sm font-bold">{fc(predictions.weekdayAvg)}<span className="text-[10px] font-normal text-muted-foreground">/{l ? 'día' : 'day'}</span></p>
              </div>
            </div>
            <div className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg border",
              predictions.weekendPremium > 30 ? 'bg-chart-5/10 border-chart-5/30' : 'bg-muted/40'
            )}>
              <Moon className="h-3.5 w-3.5 text-chart-2" />
              <div>
                <p className="text-[10px] text-muted-foreground">{l ? 'Fin de semana' : 'Weekend'}</p>
                <p className="text-sm font-bold">
                  {fc(predictions.weekendAvg)}<span className="text-[10px] font-normal text-muted-foreground">/{l ? 'día' : 'day'}</span>
                  {predictions.weekendPremium > 10 && (
                    <span className="text-[10px] text-chart-5 ml-1">+{predictions.weekendPremium.toFixed(0)}%</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Weekly pace mini-chart */}
        {predictions.weeklyPace.length > 1 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">{l ? 'Ritmo semanal' : 'Weekly pace'}</p>
            <div className="flex gap-1.5 items-end h-12">
              {predictions.weeklyPace.map((w) => {
                const maxWeekTotal = Math.max(...predictions.weeklyPace.map(wk => wk.total));
                const height = maxWeekTotal > 0 ? (w.total / maxWeekTotal) * 100 : 0;
                const idealWeekly = globalBudget > 0 ? (globalBudget / (daysInMonth / 7)) : 0;
                const isOver = idealWeekly > 0 && w.total > idealWeekly;
                return (
                  <div key={w.week} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className={cn(
                        "w-full rounded-t transition-all",
                        isOver ? 'bg-chart-5' : 'bg-primary'
                      )}
                      style={{ height: `${Math.max(height, 8)}%` }}
                    />
                    <span className="text-[9px] text-muted-foreground">S{w.week}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Daily spending insight */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <Target className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {fc(predictions.dailyAvg)} {l ? 'promedio diario' : 'daily average'}
            </p>
            <p className="text-xs text-muted-foreground">
              {globalBudget > 0 && predictions.idealDaily > 0 ? (
                l 
                  ? `Máximo ${fc(predictions.idealDaily)}/día para mantenerte en meta`
                  : `Max ${fc(predictions.idealDaily)}/day to stay on track`
              ) : (
                l ? `Gastado: ${fc(predictions.currentSpent)} este mes` : `Spent: ${fc(predictions.currentSpent)} this month`
              )}
            </p>
          </div>
          {predictions.onTrack ? (
            <CheckCircle2 className="h-5 w-5 text-chart-4" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          )}
        </div>

        <ProjectionDisclaimer
          dataSources={disclaimerSources}
          methodology={{ 
            es: 'Proyecta el gasto de fin de mes usando tu promedio diario actual + pagos fijos pendientes proporcionalmente al tiempo restante.', 
            en: 'Projects end-of-month spending using your current daily average + pending fixed payments proportional to remaining time.' 
          }}
          assumptions={[
            { es: 'El ritmo de gasto se mantiene constante el resto del mes', en: 'Spending pace remains constant for the rest of the month' },
            { es: 'Los pagos fijos se distribuyen proporcionalmente', en: 'Fixed payments are distributed proportionally' },
          ]}
        />
      </CardContent>
    </Card>
  );
}