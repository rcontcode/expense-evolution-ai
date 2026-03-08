import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  PiggyBank,
  Plus,
  Lightbulb,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Wrench,
  BarChart3
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategoryBudgets, useUpsertCategoryBudget } from '@/hooks/data/useCategoryBudgets';
import { useUserSettings, UserPreferences, useUpdateUserPreferences } from '@/hooks/data/useUserSettings';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useBudgetSuggestions, getCategorySuggestion } from '@/hooks/data/useBudgetSuggestions';
import { useBankInsights } from '@/hooks/data/useBankAnalysis';
import { getCategoryLabel, ExpenseCategory } from '@/lib/constants/expense-categories';
import { startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';

export function SmartBudgetIntegration() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: budgets } = useCategoryBudgets();
  const { data: settings } = useUserSettings();
  const upsertBudget = useUpsertCategoryBudget();
  const updatePreferences = useUpdateUserPreferences();
  const budgetSuggestions = useBudgetSuggestions();
  const bankInsights = useBankInsights();
  const { data: transactions } = useBankTransactions();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const { data: expenses } = useExpenses({ dateRange: { start: monthStart, end: monthEnd } });
  const { data: lastExpenses } = useExpenses({ dateRange: { start: lastMonthStart, end: lastMonthEnd } });

  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;

  // Unified spending: manual + bank (deduplicated)
  const spendingByCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    expenses?.forEach((e) => {
      if (e.category && !e.deleted_at) {
        catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
      }
    });
    // Add unmatched bank transactions
    transactions?.forEach(t => {
      if (!t.matched_expense_id && t.description) {
        const d = parseISO(t.transaction_date);
        if (d >= monthStart && d <= monthEnd) {
          catMap['other'] = (catMap['other'] || 0) + Math.abs(Number(t.amount));
        }
      }
    });
    return catMap;
  }, [expenses, transactions, monthStart, monthEnd]);

  // Last month by category for comparison
  const lastSpendingByCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    lastExpenses?.forEach((e) => {
      if (e.category && !e.deleted_at) {
        catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
      }
    });
    return catMap;
  }, [lastExpenses]);

  // Budget health audit
  const budgetAudit = useMemo(() => {
    if (!budgets || budgets.length === 0) return [];
    return budgets.map(b => {
      const spent = spendingByCategory[b.category] || 0;
      const lastSpent = lastSpendingByCategory[b.category] || 0;
      const pct = b.monthly_budget > 0 ? (spent / b.monthly_budget) * 100 : 0;
      const catSugg = budgetSuggestions.categorySuggestions[b.category];
      const avgLast3 = catSugg?.averageSpent || lastSpent;
      const isUnderfunded = avgLast3 > b.monthly_budget * 1.15;
      const isOverfunded = avgLast3 > 0 && b.monthly_budget > avgLast3 * 1.5;
      const suggestedAdjust = isUnderfunded
        ? Math.ceil(avgLast3 * 1.1)
        : isOverfunded
        ? Math.ceil(avgLast3 * 1.15)
        : null;
      const momChange = lastSpent > 0 ? ((spent - lastSpent) / lastSpent) * 100 : 0;

      return {
        ...b,
        spent,
        pct,
        lastSpent,
        momChange,
        isUnderfunded,
        isOverfunded,
        suggestedAdjust,
        status: pct >= 100 ? 'exceeded' as const : pct >= 80 ? 'warning' as const : 'ok' as const,
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [budgets, spendingByCategory, lastSpendingByCategory, budgetSuggestions]);

  // Categories without budgets
  const categoriesNeedingBudget = Object.entries(spendingByCategory)
    .filter(([cat]) => !budgets?.some(b => b.category === cat))
    .map(([category, spent]) => ({
      category,
      spent,
      suggestion: getCategorySuggestion(budgetSuggestions, category)
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);

  const handleQuickApply = (category: string, amount: number) => {
    upsertBudget.mutate({ category, monthly_budget: amount });
  };

  const handleAutoGlobalBudget = () => {
    if (budgetSuggestions.globalSuggestion > 0) {
      updatePreferences.mutate({
        global_monthly_budget: budgetSuggestions.globalSuggestion,
        global_budget_alert_threshold: 80
      });
      toast.success(l
        ? `Presupuesto de ${fc(budgetSuggestions.globalSuggestion)} configurado`
        : `Budget of ${fc(budgetSuggestions.globalSuggestion)} set`
      );
    }
  };

  const handleAdjustBudget = (category: string, amount: number) => {
    upsertBudget.mutate({ category, monthly_budget: amount });
    toast.success(l ? 'Presupuesto ajustado' : 'Budget adjusted');
  };

  const problemCount = budgetAudit.filter(b => b.isUnderfunded || b.status === 'exceeded').length;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 via-transparent to-chart-4/5" />

      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-3 to-chart-4 flex items-center justify-center shadow-lg shadow-chart-3/25"
            >
              <Target className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <span className="font-bold">{l ? 'Control de Presupuesto' : 'Budget Control'}</span>
              <p className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
                {problemCount > 0 && (
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                    {problemCount} {l ? 'ajuste(s)' : 'fix(es)'}
                  </Badge>
                )}
                {l ? 'Integrado con datos bancarios' : 'Integrated with bank data'}
              </p>
            </div>
          </div>
          <Link to="/budget">
            <Button size="sm" variant="outline" className="text-xs h-7">
              {l ? 'Ver todo' : 'View all'}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 relative">
        {/* Quick global budget setup */}
        {globalBudget === 0 && budgetSuggestions.globalSuggestion > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {l ? '✨ Presupuesto sugerido' : '✨ Suggested budget'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {l
                    ? `Promedio ${fc(budgetSuggestions.globalAverage)}/mes → sugerido ${fc(budgetSuggestions.globalSuggestion)}/mes (+10%)`
                    : `Average ${fc(budgetSuggestions.globalAverage)}/mo → suggested ${fc(budgetSuggestions.globalSuggestion)}/mo (+10%)`}
                </p>
              </div>
              <Button size="sm" onClick={handleAutoGlobalBudget} className="bg-gradient-to-r from-primary to-chart-2 text-xs h-7">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {l ? 'Aplicar' : 'Apply'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Budget health audit alerts */}
        {budgetAudit.filter(b => b.isUnderfunded || b.isOverfunded).slice(0, 2).map((b, idx) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg border text-xs",
              b.isUnderfunded ? "bg-chart-5/5 border-chart-5/20" : "bg-chart-1/5 border-chart-1/20"
            )}
          >
            <Wrench className={cn("h-3.5 w-3.5 shrink-0", b.isUnderfunded ? "text-chart-5" : "text-chart-1")} />
            <div className="flex-1 min-w-0">
              <span className="font-medium">{getCategoryLabel(b.category as ExpenseCategory)}</span>
              <span className="text-muted-foreground ml-1">
                {b.isUnderfunded
                  ? (l ? `— límite bajo (gastas ~${fc(b.spent)}, límite ${fc(b.monthly_budget)})` : `— underfunded (spending ~${fc(b.spent)}, limit ${fc(b.monthly_budget)})`)
                  : (l ? `— sobredimensionado` : `— overfunded`)}
              </span>
            </div>
            {b.suggestedAdjust && (
              <Button
                size="sm" variant="outline"
                className="h-6 text-[10px] px-2 shrink-0"
                onClick={() => handleAdjustBudget(b.category, b.suggestedAdjust!)}
                disabled={upsertBudget.isPending}
              >
                → {fc(b.suggestedAdjust)}
              </Button>
            )}
          </motion.div>
        ))}

        {/* Categories needing budget */}
        {categoriesNeedingBudget.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5 text-chart-1" />
              {l ? 'Sin presupuesto' : 'No budget set'}
            </p>
            {categoriesNeedingBudget.map((item, idx) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{getCategoryLabel(item.category as ExpenseCategory)}</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      {fc(item.spent)}
                    </Badge>
                  </div>
                </div>
                {item.suggestion && item.suggestion.suggestedBudget > 0 && (
                  <Button
                    size="sm" variant="outline"
                    className="h-6 text-[10px] px-2"
                    onClick={() => handleQuickApply(item.category, item.suggestion!.suggestedBudget)}
                    disabled={upsertBudget.isPending}
                  >
                    <Plus className="h-2.5 w-2.5 mr-0.5" />
                    {fc(item.suggestion.suggestedBudget)}
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Active budgets with MoM comparison */}
        {budgetAudit.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              {l ? 'Presupuestos activos' : 'Active budgets'}
            </p>
            {budgetAudit.slice(0, 4).map((b) => {
              const isOver = b.status === 'exceeded';
              const isWarn = b.status === 'warning';
              return (
                <div key={b.id} className="p-2 rounded-lg bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium flex items-center gap-1.5">
                      {getCategoryLabel(b.category as ExpenseCategory)}
                      {b.momChange !== 0 && Math.abs(b.momChange) > 10 && (
                        <span className={cn("inline-flex items-center gap-0.5 text-[9px]",
                          b.momChange > 0 ? "text-destructive" : "text-chart-4"
                        )}>
                          {b.momChange > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                          {b.momChange > 0 ? '+' : ''}{b.momChange.toFixed(0)}%
                        </span>
                      )}
                    </span>
                    <span className={cn(
                      'font-medium text-[10px]',
                      isOver ? 'text-destructive' : isWarn ? 'text-chart-5' : 'text-chart-4'
                    )}>
                      {fc(b.spent)} / {fc(b.monthly_budget)}
                    </span>
                  </div>
                  <Progress value={Math.min(b.pct, 100)} className="h-1" />
                </div>
              );
            })}
            {budgetAudit.length > 4 && (
              <Link to="/budget">
                <Button variant="ghost" size="sm" className="w-full text-[10px] h-6">
                  {l ? `Ver ${budgetAudit.length - 4} más` : `View ${budgetAudit.length - 4} more`}
                  <ArrowUpRight className="h-2.5 w-2.5 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Empty state */}
        {(!budgets || budgets.length === 0) && categoriesNeedingBudget.length === 0 && globalBudget === 0 && (
          <div className="text-center py-4">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-chart-3/20 to-chart-4/20 flex items-center justify-center"
            >
              <PiggyBank className="h-6 w-6 text-chart-3" />
            </motion.div>
            <p className="text-xs text-muted-foreground">
              {l
                ? 'Importa transacciones para recibir sugerencias'
                : 'Import transactions to get suggestions'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
