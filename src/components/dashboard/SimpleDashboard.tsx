import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Plus,
  TrendingUp,
  TrendingDown,
  Receipt,
  ArrowRight,
  Wallet,
  Landmark,
  Target,
  Sparkles,
  Mic,
  PenLine,
  ChevronRight,
  CalendarClock,
  Volume2,
  Check,
  Clock,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useProfile } from '@/hooks/data/useProfile';
import { applyUiModeImmediately, useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { SimpleOnboardingPath } from './SimpleOnboardingPath';
import { SimpleSparkline } from './SimpleSparkline';
import { getDailyTip, type TipContext } from '@/data/simpleFinancialTips';
import { cn } from '@/lib/utils';

interface SimpleDashboardProps {
  onQuickCapture?: () => void;
}

/**
 * Ultra-simplified dashboard for users in Simple UI mode.
 * Shows only what matters: greeting, balance, quick actions, recent activity, single tip.
 */
export function SimpleDashboard({ onQuickCapture }: SimpleDashboardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { formatCurrency } = useFormatCurrency();
  const { setUiMode } = useDisplayPreferences();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const { data: profile } = useProfile();
  const { data: bills } = useRecurringBills();

  // Inline savings-goal input state (B1)
  const [goalInput, setGoalInput] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const monthlyIncome = stats?.monthlyIncome ?? 0;
  const monthlyTotal = stats?.monthlyTotal ?? 0;
  const balance = monthlyIncome - monthlyTotal;
  const positive = balance >= 0;

  // % of income spent (capped at 100% for the bar)
  const spentPct = monthlyIncome > 0 ? Math.min(100, (monthlyTotal / monthlyIncome) * 100) : 0;

  // Greeting by hour
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (language === 'es') {
      if (h < 12) return 'Buenos días';
      if (h < 19) return 'Buenas tardes';
      return 'Buenas noches';
    }
    if (h < 12) return 'Good morning';
    if (h < 19) return 'Good afternoon';
    return 'Good evening';
  }, [language]);

  const firstName = useMemo(() => {
    const name = (profile as any)?.full_name?.split(' ')[0];
    return name || (language === 'es' ? 'amigo' : 'friend');
  }, [profile, language]);

  // Combine recent expenses + income, sort BEFORE slicing so we never miss the latest
  const recent = useMemo(() => {
    const items: Array<{ id: string; rawId: string; type: 'expense' | 'income'; label: string; amount: number; date: string }> = [];
    (expenses ?? []).forEach((e: any) => {
      items.push({
        id: `e-${e.id}`,
        rawId: String(e.id),
        type: 'expense',
        label: e.merchant || e.category || (language === 'es' ? 'Gasto' : 'Expense'),
        amount: Number(e.amount) || 0,
        date: e.date,
      });
    });
    (income ?? []).forEach((i: any) => {
      items.push({
        id: `i-${i.id}`,
        rawId: String(i.id),
        type: 'income',
        label: i.source || i.category || (language === 'es' ? 'Ingreso' : 'Income'),
        amount: Number(i.amount) || 0,
        date: i.date,
      });
    });
    return items
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 8);
  }, [expenses, income, language]);

  // Day-of-month context — helps the user interpret the balance
  const monthProgress = useMemo(() => {
    const d = new Date();
    const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const day = d.getDate();
    const remaining = total - day;
    return { day, total, remaining, pct: (day / total) * 100 };
  }, []);

  // Bills due in the next 7 days — drives the "Próximos pagos" shortcut badge
  const upcomingBillsCount = useMemo(() => {
    if (!bills) return 0;
    const now = new Date();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 7);
    return (bills as any[]).filter((b) => {
      if (!b?.next_due_date) return false;
      const d = new Date(b.next_due_date);
      return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && d <= limit;
    }).length;
  }, [bills]);

  // Has the user configured a budget already? Drives the second shortcut choice
  const hasBudget = useMemo(() => {
    const prefs = (profile as any)?.preferences;
    return Boolean(prefs?.budget_mode);
  }, [profile]);

  const monthLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(language === 'es' ? 'es' : 'en', { month: 'long', year: 'numeric' });
  }, [language]);

  // Top spending category for current month — short, plain-text insight under the sparkline
  const topCategory = useMemo(() => {
    if (!expenses || expenses.length === 0 || monthlyTotal <= 0) return null;
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const totals = new Map<string, number>();
    (expenses as any[]).forEach((e) => {
      if (typeof e.date === 'string' && e.date.startsWith(ym)) {
        const cat = e.category || (language === 'es' ? 'Sin categoría' : 'Uncategorized');
        totals.set(cat, (totals.get(cat) ?? 0) + (Number(e.amount) || 0));
      }
    });
    if (totals.size === 0) return null;
    let topCat = '';
    let topAmt = 0;
    totals.forEach((v, k) => {
      if (v > topAmt) { topAmt = v; topCat = k; }
    });
    if (topAmt <= 0) return null;
    const pct = Math.round((topAmt / monthlyTotal) * 100);
    return { category: topCat, amount: topAmt, pct };
  }, [expenses, monthlyTotal, language]);

  // End-of-month projection — answers "if I keep going at this pace, how will I finish?"
  const projection = useMemo(() => {
    if (monthProgress.day < 3 || monthlyTotal <= 0) return null; // need a few days of data
    const dailyRate = monthlyTotal / monthProgress.day;
    const projectedSpend = dailyRate * monthProgress.total;
    const projectedBalance = monthlyIncome - projectedSpend;
    return { projectedBalance, positive: projectedBalance >= 0 };
  }, [monthlyTotal, monthlyIncome, monthProgress]);

  // Optional savings goal from preferences (stored in display_preferences.savings_goal_monthly)
  const savingsGoal = useMemo(() => {
    const prefs = (profile as any)?.display_preferences ?? (profile as any)?.preferences;
    const goal = Number(prefs?.savings_goal_monthly) || 0;
    if (goal <= 0) return null;
    const current = Math.max(0, balance);
    const pct = Math.min(100, (current / goal) * 100);
    return { goal, current, pct, achieved: current >= goal };
  }, [profile, balance]);

  // Single contextual tip — financial education, rotates daily
  const tip = useMemo(() => {
    let ctx: TipContext;
    if (monthlyIncome === 0 && monthlyTotal === 0) ctx = 'empty';
    else if (!positive) ctx = 'deficit';
    else if (spentPct > 80) ctx = 'high_spend';
    else ctx = 'healthy';
    return getDailyTip(ctx, language);
  }, [monthlyIncome, monthlyTotal, positive, spentPct, language]);

  // Spoken summary — accessibility helper, uses localized currency
  const speakSummary = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const isEs = language === 'es';
    const text = isEs
      ? `Tu balance del mes es ${balance < 0 ? 'negativo ' : ''}${formatCurrency(Math.abs(balance))}. Has tenido ingresos por ${formatCurrency(monthlyIncome)} y gastos por ${formatCurrency(monthlyTotal)}. Vas en el día ${monthProgress.day} de ${monthProgress.total}.`
      : `Your monthly balance is ${balance < 0 ? 'negative ' : ''}${formatCurrency(Math.abs(balance))}. You earned ${formatCurrency(monthlyIncome)} and spent ${formatCurrency(monthlyTotal)}. It's day ${monthProgress.day} of ${monthProgress.total}.`;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = isEs ? 'es-ES' : 'en-US';
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    } catch {
      // graceful no-op
    }
  };

  // Inactivity detector (B2) — days since the last logged movement
  const daysSinceLastEntry = useMemo(() => {
    if (recent.length === 0) return null;
    const lastDateStr = recent[0].date;
    const last = new Date(lastDateStr);
    if (isNaN(last.getTime())) return null;
    const today = new Date();
    const ms = today.getTime() - last.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }, [recent]);

  // Inline-save the savings goal (B1) — one-shot, no navigation needed
  const saveSavingsGoal = async () => {
    const value = Number(goalInput.replace(/[^0-9.]/g, ''));
    if (!value || value <= 0 || !user?.id) return;
    setSavingGoal(true);
    try {
      const currentPrefs = (((profile as any)?.display_preferences) ?? {}) as Record<string, unknown>;
      const next = { ...currentPrefs, savings_goal_monthly: value };
      const { error } = await supabase
        .from('profiles')
        .update({ display_preferences: next as any })
        .eq('id', user.id);
      if (error) throw error;
      toast({
        title: language === 'es' ? '🎯 Meta guardada' : '🎯 Goal saved',
        description: language === 'es'
          ? `Apuntas a ahorrar ${formatCurrency(value)} este mes.`
          : `You aim to save ${formatCurrency(value)} this month.`,
      });
      setGoalInput('');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (e) {
      toast({
        title: language === 'es' ? 'No pudimos guardar' : 'Could not save',
        description: language === 'es' ? 'Inténtalo de nuevo.' : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-8">
      {/* Greeting */}
      <div className="px-1 pt-1">
        <h1 className="text-2xl font-bold">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
      </div>

      {/* Inactivity nudge (B2) — only when last entry is more than a week old */}
      {daysSinceLastEntry !== null && daysSinceLastEntry > 7 && (
        <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/10 px-3 py-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {language === 'es'
                ? `Hace ${daysSinceLastEntry} días que no registras`
                : `${daysSinceLastEntry} days since your last entry`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {language === 'es' ? '¿Todo bien? Captura uno rápido.' : 'All good? Log one quickly.'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1 border-amber-500/40 hover:bg-amber-500/15 shrink-0"
            onClick={() => (onQuickCapture ? onQuickCapture() : navigate('/expenses?new=1'))}
          >
            {language === 'es' ? 'Capturar' : 'Capture'}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Onboarding path — auto-hides when all steps complete */}
      <SimpleOnboardingPath />

      {/* Hero balance */}
      <Card
        className={cn(
          'border-2 shadow-xl transition-all overflow-hidden relative',
          positive
            ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5'
            : 'border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-orange-500/5',
        )}
      >
        {/* Listen-to-summary button — accessibility helper */}
        <button
          type="button"
          onClick={speakSummary}
          aria-label={language === 'es' ? 'Escuchar resumen del mes' : 'Listen to monthly summary'}
          title={language === 'es' ? 'Escuchar resumen' : 'Listen to summary'}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/70 hover:bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm z-10"
        >
          <Volume2 className="h-3.5 w-3.5" />
        </button>

        <CardContent className="py-7 text-center space-y-3" aria-live="polite">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {language === 'es' ? 'Balance del mes' : 'Monthly balance'}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {language === 'es' ? 'Lo que te queda · ingresos − gastos' : "What's left · income − expenses"}
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="h-12 w-48 mx-auto" />
          ) : (
            <div
              className={cn(
                'text-4xl md:text-5xl font-bold tabular-nums',
                positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {positive ? '+' : ''}
              {formatCurrency(balance)}
            </div>
          )}
          <div className="flex justify-center gap-5 pt-1 text-sm flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-[11px] uppercase font-semibold tracking-wide">
                  {language === 'es' ? 'Ingresos' : 'Income'}
                </span>
              </div>
              <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                {formatCurrency(monthlyIncome)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <TrendingDown className="h-4 w-4" />
                <span className="text-[11px] uppercase font-semibold tracking-wide">
                  {language === 'es' ? 'Gastos' : 'Expenses'}
                </span>
              </div>
              <span className="font-bold tabular-nums text-rose-700 dark:text-rose-300">
                {formatCurrency(monthlyTotal)}
              </span>
            </div>
          </div>

          {/* Day-of-month context — frames the balance in time */}
          <div className="pt-2 px-4">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {language === 'es'
                  ? `Día ${monthProgress.day} de ${monthProgress.total}`
                  : `Day ${monthProgress.day} of ${monthProgress.total}`}
              </span>
              <span>
                {language === 'es'
                  ? `quedan ${monthProgress.remaining} días`
                  : `${monthProgress.remaining} days left`}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-foreground/40 rounded-full transition-all"
                style={{ width: `${monthProgress.pct}%` }}
              />
            </div>
          </div>

          {monthlyIncome > 0 && (
            <div className="pt-2 px-4">
              <div className="text-xs text-muted-foreground mb-1.5 text-left">
                {language === 'es'
                  ? `Has gastado ${spentPct.toFixed(0)}% de tus ingresos`
                  : `You've spent ${spentPct.toFixed(0)}% of your income`}
              </div>
              <Progress value={spentPct} className="h-2" />
            </div>
          )}

          {/* Mini-trend sparkline — last 6 months of spending */}
          {(stats?.monthlyTrends?.length ?? 0) >= 2 && (
            <SimpleSparkline
              trends={stats!.monthlyTrends}
              language={language}
            />
          )}

          {/* Top category insight — answers "where did my money go?" */}
          {topCategory && (
            <div className="pt-1 px-4 text-left">
              <div className="text-[11px] text-muted-foreground">
                {language === 'es' ? 'Tu mayor categoría este mes' : 'Your top category this month'}
              </div>
              <div className="text-sm font-semibold">
                <span className="capitalize">{topCategory.category}</span>
                <span className="text-muted-foreground font-normal"> · </span>
                <span className="tabular-nums">{formatCurrency(topCategory.amount)}</span>
                <span className="text-muted-foreground font-normal tabular-nums"> ({topCategory.pct}%)</span>
              </div>
            </div>
          )}

          {/* End-of-month projection — answers "where am I headed?" */}
          {projection && (
            <div className="pt-1 px-4 text-left">
              <div className="text-[11px] text-muted-foreground">
                {language === 'es' ? 'A este ritmo, terminarás el mes con' : 'At this pace, you will end the month at'}
              </div>
              <div className={cn(
                'text-sm font-bold tabular-nums',
                projection.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
              )}>
                {projection.positive ? '+' : ''}{formatCurrency(projection.projectedBalance)}
                <span className="text-[10px] font-normal text-muted-foreground ml-1">
                  {language === 'es' ? '(estimado)' : '(estimate)'}
                </span>
              </div>
            </div>
          )}

          {/* Savings goal — concrete target if user has set one */}
          {savingsGoal ? (
            <div className="pt-2 px-4 text-left">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Target className="h-3 w-3" />
                  {language === 'es' ? 'Meta de ahorro' : 'Savings goal'}
                </span>
                <span className={cn(
                  'tabular-nums font-semibold',
                  savingsGoal.achieved ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground',
                )}>
                  {formatCurrency(savingsGoal.current)} / {formatCurrency(savingsGoal.goal)}
                  {savingsGoal.achieved && ' 🎉'}
                </span>
              </div>
              <Progress value={savingsGoal.pct} className="h-1.5" />
            </div>
          ) : (
            <div className="pt-2 px-4">
              <label
                htmlFor="simple-savings-goal"
                className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1.5"
              >
                <Target className="h-3 w-3" />
                {language === 'es' ? '¿Cuánto quieres ahorrar este mes?' : 'How much do you want to save this month?'}
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  id="simple-savings-goal"
                  type="number"
                  inputMode="decimal"
                  placeholder={
                    monthlyIncome > 0
                      ? (language === 'es'
                          ? `Sugerido: ${Math.round(monthlyIncome * 0.2)}`
                          : `Suggested: ${Math.round(monthlyIncome * 0.2)}`)
                      : (language === 'es' ? 'Ej: 200' : 'e.g. 200')
                  }
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveSavingsGoal();
                    }
                  }}
                  className="h-8 text-sm flex-1"
                  disabled={savingGoal}
                />
                {monthlyIncome > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setGoalInput(String(Math.round(monthlyIncome * 0.2)))}
                    disabled={savingGoal}
                    className="h-8 px-2 text-[11px] font-semibold"
                    title={language === 'es' ? 'Sugerir 20% de tus ingresos' : 'Suggest 20% of income'}
                  >
                    20%
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={saveSavingsGoal}
                  disabled={!goalInput || savingGoal}
                  className="h-8 px-2.5 gap-1"
                  aria-label={language === 'es' ? 'Guardar meta' : 'Save goal'}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
              {monthlyIncome > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {language === 'es'
                    ? `La regla 50/30/20 sugiere ahorrar ~20% (${formatCurrency(monthlyIncome * 0.2)})`
                    : `The 50/30/20 rule suggests saving ~20% (${formatCurrency(monthlyIncome * 0.2)})`}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3 big primary actions */}
      <div className="grid grid-cols-3 gap-3">
        <ActionButton
          icon={<Receipt className="h-6 w-6" />}
          label={language === 'es' ? 'Gasto' : 'Expense'}
          subtitle={language === 'es' ? 'Registrar uno nuevo' : 'Log a new one'}
          color="rose"
          onClick={() => navigate('/expenses')}
        />
        <ActionButton
          icon={<TrendingUp className="h-6 w-6" />}
          label={language === 'es' ? 'Ingreso' : 'Income'}
          subtitle={language === 'es' ? 'Sumar al balance' : 'Add to balance'}
          color="emerald"
          onClick={() => navigate('/income')}
        />
        <ActionButton
          icon={<Camera className="h-6 w-6" />}
          label={language === 'es' ? 'Capturar' : 'Capture'}
          subtitle={language === 'es' ? 'Foto de recibo' : 'Receipt photo'}
          color="violet"
          onClick={() => (onQuickCapture ? onQuickCapture() : navigate('/capture'))}
        />
      </div>

      {/* Secondary shortcuts — context-aware */}
      <div className="grid grid-cols-2 gap-3">
        <SecondaryShortcut
          icon={<CalendarClock className="h-4 w-4" />}
          label={language === 'es' ? 'Próximos pagos' : 'Upcoming bills'}
          badge={upcomingBillsCount > 0 ? String(upcomingBillsCount) : undefined}
          onClick={() => navigate('/bills')}
        />
        {hasBudget ? (
          <SecondaryShortcut
            icon={<Wallet className="h-4 w-4" />}
            label={language === 'es' ? 'Mi presupuesto' : 'My budget'}
            onClick={() => navigate('/budget')}
          />
        ) : (
          <SecondaryShortcut
            icon={<Landmark className="h-4 w-4" />}
            label={language === 'es' ? 'Conectar banco' : 'Connect bank'}
            onClick={() => navigate('/banking')}
          />
        )}
      </div>

      {/* Recent activity */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="font-bold text-base">
              {language === 'es' ? 'Movimientos recientes' : 'Recent activity'}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/expenses')}
                className="gap-1 h-7 px-2.5 text-xs font-semibold border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 hover:scale-[1.04] transition-all"
              >
                {language === 'es' ? 'Gastos' : 'Expenses'}
                <ArrowRight className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/income')}
                className="gap-1 h-7 px-2.5 text-xs font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:scale-[1.04] transition-all"
              >
                {language === 'es' ? 'Ingresos' : 'Income'}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {recent.length === 0 ? (
            <div className="py-4 space-y-3">
              <div className="rounded-lg bg-muted/40 border border-dashed border-border p-3 text-center">
                <p className="text-sm font-semibold text-foreground">
                  {language === 'es' ? 'Tres formas de registrar tu primer movimiento' : 'Three ways to log your first entry'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'es'
                    ? 'Elige la más cómoda — todo se sincroniza automáticamente.'
                    : 'Pick whichever is easiest — everything syncs automatically.'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <EmptyStateChip
                  icon={<Camera className="h-4 w-4" />}
                  label={language === 'es' ? 'Foto' : 'Photo'}
                  hint={language === 'es' ? 'recibo' : 'receipt'}
                  onClick={() => (onQuickCapture ? onQuickCapture() : navigate('/capture'))}
                />
                <EmptyStateChip
                  icon={<Mic className="h-4 w-4" />}
                  label={language === 'es' ? 'Voz' : 'Voice'}
                  hint={language === 'es' ? 'dictado' : 'dictate'}
                  onClick={() => (onQuickCapture ? onQuickCapture() : navigate('/expenses?new=1'))}
                />
                <EmptyStateChip
                  icon={<PenLine className="h-4 w-4" />}
                  label={language === 'es' ? 'Manual' : 'Manual'}
                  hint={language === 'es' ? 'formulario' : 'form'}
                  onClick={() => navigate('/expenses?new=1')}
                />
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {recent.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => navigate(
                      item.type === 'income'
                        ? `/income?edit=${item.rawId}`
                        : `/expenses?edit=${item.rawId}`
                    )}
                    className="w-full flex items-center justify-between py-2.5 -mx-1 px-1 rounded-lg hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
                    aria-label={language === 'es' ? `Editar ${item.label}` : `Edit ${item.label}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                          item.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                        )}
                      >
                        {item.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{item.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.date).toLocaleDateString(language === 'es' ? 'es' : 'en', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <div
                        className={cn(
                          'text-sm font-bold tabular-nums',
                          item.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-foreground',
                        )}
                      >
                        {item.type === 'income' ? '+' : '−'}
                        {formatCurrency(item.amount)}
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Single contextual tip */}
      <Card className="border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
              {language === 'es' ? 'Educación financiera' : 'Financial education'}
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{tip}</p>
            <p className="text-[10px] text-muted-foreground italic pt-0.5">
              {language === 'es'
                ? 'Consulta a un profesional antes de tomar decisiones.'
                : 'Consult a professional before making decisions.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer — interactive, lets the user switch mode or reopen the setup guide */}
      <div className="space-y-2 pt-1 px-2">
        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          {language === 'es'
            ? 'Estás en Modo Simple. Cuando necesites impuestos, inversiones, contratos o el ecosistema completo:'
            : 'You are in Simple Mode. When you need taxes, investments, contracts or the full ecosystem:'}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => {
              applyUiModeImmediately('advanced');
              setUiMode('advanced');
              navigate('/dashboard', { replace: true });
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {language === 'es' ? 'Cambiar a Avanzado' : 'Switch to Advanced'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => window.dispatchEvent(new Event('simple-onboarding:reopen'))}
          >
            {language === 'es' ? 'Ver guía de configuración' : 'Open setup guide'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  subtitle,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  color: 'rose' | 'emerald' | 'violet';
  onClick: () => void;
}) {
  const colorMap = {
    rose: 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300',
    emerald:
      'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    violet:
      'border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300',
  };
  const subtitleColor = {
    rose: 'text-rose-600/70 dark:text-rose-400/70',
    emerald: 'text-emerald-600/70 dark:text-emerald-400/70',
    violet: 'text-violet-600/70 dark:text-violet-400/70',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-xl border-2 font-semibold text-sm transition-all hover:scale-[1.04] active:scale-[0.98] shadow-md',
        colorMap[color],
      )}
    >
      {icon}
      <span className="leading-tight">{label}</span>
      {subtitle && (
        <span className={cn('text-[10px] font-medium leading-tight text-center', subtitleColor[color])}>
          {subtitle}
        </span>
      )}
    </button>
  );
}

function SecondaryShortcut({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card hover:bg-muted/60 hover:border-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm font-medium text-foreground"
    >
      <span className="text-primary">{icon}</span>
      <span>{label}</span>
      {badge && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
          {badge}
        </span>
      )}
    </button>
  );
}

function EmptyStateChip({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 hover:scale-[1.04] active:scale-[0.98] transition-all"
    >
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-semibold leading-tight">{label}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{hint}</span>
    </button>
  );
}
