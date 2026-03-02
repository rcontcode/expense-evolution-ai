import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Bell, AlertTriangle, TrendingUp, TrendingDown, Calendar,
  CreditCard, Target, Flame, ArrowRight, Zap, Wallet, ShieldAlert
} from 'lucide-react';
import { differenceInDays, startOfMonth, endOfMonth, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useExpenseCompleteness } from '@/hooks/utils/useExpenseCompleteness';

interface SmartAlert {
  id: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  icon: typeof Bell;
  title: string;
  description: string;
  action?: { label: string; route: string };
  priority: number; // 1 = highest
}

export function ProactiveAlertsWidget() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { user } = useAuth();
  const { formatCompact } = useFormatCurrency();
  const navigate = useNavigate();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const { data: expenses } = useExpenses({});
  const { data: incomeData } = useIncome({ year: currentYear });
  const { isConfirmed: expensesConfirmed, looksIncomplete } = useExpenseCompleteness();

  // Recurring bills
  const { data: bills } = useQuery<any[]>({
    queryKey: ['recurring-bills-alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as any)
        .from('recurring_bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!user,
  });

  // Category budgets
  const { data: budgets } = useQuery({
    queryKey: ['category-budgets-alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const alerts = useMemo((): SmartAlert[] => {
    const result: SmartAlert[] = [];
    if (!expenses) return result;

    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && !e.deleted_at;
    });
    const totalSpent = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const monthIncome = incomeData?.filter(i => new Date(i.date).getMonth() === currentMonth)
      .reduce((s, i) => s + Number(i.amount), 0) || 0;

    // 1. Spending pace alert
    const dailyAvg = totalSpent / Math.max(dayOfMonth, 1);
    const projectedTotal = dailyAvg * daysInMonth;
    const remainingDays = daysInMonth - dayOfMonth;

    if (monthIncome > 0 && projectedTotal > monthIncome * 1.1) {
      const overspend = projectedTotal - monthIncome;
      result.push({
        id: 'overspend-projected',
        type: 'danger',
        icon: ShieldAlert,
        title: l ? '⚠️ Alerta de Sobregasto' : '⚠️ Overspending Alert',
        description: l
          ? `A este ritmo gastarás ${formatCompact(projectedTotal)} este mes, ${formatCompact(overspend)} más que tus ingresos. Te quedan ${remainingDays} días para ajustar.`
          : `At this pace you'll spend ${formatCompact(projectedTotal)} this month, ${formatCompact(overspend)} over income. ${remainingDays} days left to adjust.`,
        action: { label: l ? 'Ver presupuesto' : 'View budget', route: '/budget' },
        priority: 1,
      });
    }

    // 2. Bills due soon
    if (bills) {
      const upcomingBills = bills.filter(b => {
        const dueDay = b.due_day || 1;
        const daysUntilDue = dueDay >= dayOfMonth ? dueDay - dayOfMonth : daysInMonth - dayOfMonth + dueDay;
        return daysUntilDue <= 5 && daysUntilDue >= 0;
      });

      if (upcomingBills.length > 0) {
        const totalDue = upcomingBills.reduce((s, b) => s + Number(b.amount || 0), 0);
        result.push({
          id: 'bills-due',
          type: 'warning',
          icon: Calendar,
          title: l ? `📅 ${upcomingBills.length} pago(s) próximo(s)` : `📅 ${upcomingBills.length} upcoming payment(s)`,
          description: l
            ? `${upcomingBills.map(b => b.name).join(', ')} — Total: ${formatCompact(totalDue)}`
            : `${upcomingBills.map(b => b.name).join(', ')} — Total: ${formatCompact(totalDue)}`,
          action: { label: l ? 'Centro de pagos' : 'Payment center', route: '/dashboard?tab=overview' },
          priority: 2,
        });
      }
    }

    // 3. Budget category warnings
    if (budgets && budgets.length > 0) {
      const categorySpending: Record<string, number> = {};
      monthExpenses.forEach(e => {
        const cat = e.category || 'other';
        categorySpending[cat] = (categorySpending[cat] || 0) + Number(e.amount);
      });

      const overBudget = budgets.filter(b => {
        const spent = categorySpending[b.category] || 0;
        return spent > b.monthly_budget * (b.alert_threshold / 100);
      });

      if (overBudget.length > 0) {
        result.push({
          id: 'over-budget',
          type: 'warning',
          icon: Target,
          title: l ? `🎯 ${overBudget.length} categoría(s) sobre límite` : `🎯 ${overBudget.length} category(ies) over limit`,
          description: overBudget.map(b => {
            const spent = categorySpending[b.category] || 0;
            const pct = ((spent / b.monthly_budget) * 100).toFixed(0);
            return `${b.category}: ${pct}%`;
          }).join(', '),
          action: { label: l ? 'Ajustar' : 'Adjust', route: '/dashboard?tab=budgets' },
          priority: 3,
        });
      }
    }

    // 4. Savings rate celebration — only when expenses exist AND data confirmed or not suspicious
    if (monthIncome > 0 && totalSpent > 0 && (!looksIncomplete || expensesConfirmed)) {
      const savingsRate = ((monthIncome - totalSpent) / monthIncome) * 100;
      if (savingsRate > 30) {
        result.push({
          id: 'great-savings',
          type: 'success',
          icon: Flame,
          title: l ? `🔥 Tasa de ahorro: ${savingsRate.toFixed(0)}%` : `🔥 Savings rate: ${savingsRate.toFixed(0)}%`,
          description: l
            ? `¡Increíble! Estás ahorrando ${formatCompact(monthIncome - totalSpent)} este mes. Sigue así.`
            : `Amazing! You're saving ${formatCompact(monthIncome - totalSpent)} this month. Keep it up.`,
          priority: 5,
        });
      }
    }

    // 4b. Income without expenses warning
    if (monthIncome > 0 && totalSpent === 0 && dayOfMonth > 5) {
      result.push({
        id: 'no-expenses-warning',
        type: 'warning',
        icon: AlertTriangle,
        title: l ? '📝 Sin gastos registrados' : '📝 No expenses recorded',
        description: l
          ? 'Tienes ingresos pero no gastos este mes. Registra tus gastos para métricas reales.'
          : "You have income but no expenses this month. Add expenses for real metrics.",
        action: { label: l ? 'Registrar gasto' : 'Add expense', route: '/expenses' },
        priority: 2,
      });
    }

    // 5. No income registered yet this month
    if (!incomeData || incomeData.filter(i => new Date(i.date).getMonth() === currentMonth).length === 0) {
      if (dayOfMonth > 10) {
        result.push({
          id: 'no-income',
          type: 'info',
          icon: Wallet,
          title: l ? '💰 Sin ingresos registrados' : '💰 No income recorded',
          description: l
            ? 'No has registrado ingresos este mes. Agrega tus ingresos para un análisis preciso.'
            : "You haven't recorded income this month. Add income for accurate analysis.",
          action: { label: l ? 'Agregar ingreso' : 'Add income', route: '/income' },
          priority: 4,
        });
      }
    }

    // 6. Unusual spending spike in a category
    const prevMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear && !e.deleted_at;
    });
    const prevCategorySpending: Record<string, number> = {};
    prevMonthExpenses.forEach(e => {
      const cat = e.category || 'other';
      prevCategorySpending[cat] = (prevCategorySpending[cat] || 0) + Number(e.amount);
    });

    const currentCategorySpending: Record<string, number> = {};
    monthExpenses.forEach(e => {
      const cat = e.category || 'other';
      currentCategorySpending[cat] = (currentCategorySpending[cat] || 0) + Number(e.amount);
    });

    Object.entries(currentCategorySpending).forEach(([cat, amount]) => {
      const prev = prevCategorySpending[cat] || 0;
      if (prev > 50 && amount > prev * 1.5) {
        result.push({
          id: `spike-${cat}`,
          type: 'warning',
          icon: TrendingUp,
          title: l ? `📈 Aumento en ${cat}` : `📈 Spike in ${cat}`,
          description: l
            ? `"${cat}" subió ${((amount / prev - 1) * 100).toFixed(0)}% vs mes anterior (${formatCompact(prev)} → ${formatCompact(amount)})`
            : `"${cat}" up ${((amount / prev - 1) * 100).toFixed(0)}% vs last month (${formatCompact(prev)} → ${formatCompact(amount)})`,
          priority: 4,
        });
      }
    });

    return result.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }, [expenses, incomeData, bills, budgets, currentMonth, dayOfMonth, daysInMonth]);

  const typeStyles = {
    danger: 'border-destructive/30 bg-destructive/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    success: 'border-green-500/30 bg-green-500/5',
    info: 'border-blue-500/30 bg-blue-500/5',
  };

  const iconStyles = {
    danger: 'text-destructive',
    warning: 'text-amber-500',
    success: 'text-green-500',
    info: 'text-blue-500',
  };

  if (alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            {l ? 'Alertas Inteligentes' : 'Smart Alerts'}
          </span>
          <Badge variant="outline" className="text-xs">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <AnimatePresence>
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("p-3 rounded-lg border", typeStyles[alert.type])}
            >
              <div className="flex items-start gap-2.5">
                <alert.icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconStyles[alert.type])} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{alert.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{alert.description}</p>
                  {alert.action && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] mt-1.5"
                      onClick={() => navigate(alert.action!.route)}
                    >
                      {alert.action.label}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
