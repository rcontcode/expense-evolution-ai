import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useMonthlyPlanData } from '@/hooks/data/useMonthlyPlanData';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useCategoryBudgets, useUpsertCategoryBudget } from '@/hooks/data/useCategoryBudgets';
import { EXPENSE_CATEGORY_TRANSLATIONS, type ExpenseCategory } from '@/lib/constants/expense-categories';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Check, AlertTriangle, Sparkles, PiggyBank, ArrowRight } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

const ENVELOPE_CATEGORIES: ExpenseCategory[] = [
  'meals', 'travel', 'fuel', 'utilities', 'software',
  'equipment', 'office_supplies', 'professional_services',
  'home_office', 'mileage', 'other'
];

export function ZeroBasedBudgetView() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const plan = useMonthlyPlanData();
  const { data: categoryBudgets } = useCategoryBudgets();
  const upsertBudget = useUpsertCategoryBudget();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const { data: expenses } = useExpenses({ dateRange: { start: monthStart, end: monthEnd } });
  const monthLabel = format(now, 'MMMM yyyy', { locale: l ? es : enUS });

  // Local state for envelope allocations being edited
  const [editingAllocations, setEditingAllocations] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Current allocations from DB
  const currentAllocations = useMemo(() => {
    const map: Record<string, number> = {};
    (categoryBudgets || []).forEach(cb => {
      map[cb.category] = Number(cb.monthly_budget);
    });
    return map;
  }, [categoryBudgets]);

  // Spending per category this month
  const spentPerCategory = useMemo(() => {
    const map: Record<string, number> = {};
    (expenses || []).forEach(e => {
      const cat = e.category || 'other';
      map[cat] = (map[cat] || 0) + Number(e.amount);
    });
    return map;
  }, [expenses]);

  const totalIncome = plan.totalIncome;
  const totalAllocated = ENVELOPE_CATEGORIES.reduce((s, cat) => {
    if (isEditing) {
      const val = editingAllocations[cat];
      return s + (val !== undefined ? parseFloat(val) || 0 : currentAllocations[cat] || 0);
    }
    return s + (currentAllocations[cat] || 0);
  }, 0);

  const totalFixed = plan.totalFixed;
  const unallocated = totalIncome - totalFixed - totalAllocated;
  const totalSpent = Object.values(spentPerCategory).reduce((s, v) => s + v, 0);

  const startEditing = () => {
    const initial: Record<string, string> = {};
    ENVELOPE_CATEGORIES.forEach(cat => {
      initial[cat] = String(currentAllocations[cat] || 0);
    });
    setEditingAllocations(initial);
    setIsEditing(true);
  };

  const saveAllocations = async () => {
    for (const cat of ENVELOPE_CATEGORIES) {
      const val = parseFloat(editingAllocations[cat] || '0');
      if (val !== (currentAllocations[cat] || 0)) {
        await upsertBudget.mutateAsync({ category: cat, monthly_budget: val });
      }
    }
    setIsEditing(false);
    toast.success(l ? '✅ Sobres actualizados' : '✅ Envelopes updated');
  };

  const getEnvelopeStatus = (cat: string, allocated: number) => {
    const spent = spentPerCategory[cat] || 0;
    if (allocated === 0) return 'empty';
    if (spent > allocated) return 'over';
    if (spent >= allocated * 0.8) return 'warning';
    return 'ok';
  };

  return (
    <div className="space-y-4">
      {/* Header: Income allocation bar */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {l ? '✉️ Presupuesto Base Cero' : '✉️ Zero-Based Budget'}
                </CardTitle>
                <p className="text-xs text-muted-foreground capitalize">{monthLabel}</p>
              </div>
            </div>
            {!isEditing ? (
              <Button size="sm" variant="outline" onClick={startEditing} className="text-xs">
                {l ? 'Asignar' : 'Allocate'}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="text-xs">
                  {l ? 'Cancelar' : 'Cancel'}
                </Button>
                <Button size="sm" onClick={saveAllocations} className="text-xs gap-1">
                  <Check className="h-3 w-3" />
                  {l ? 'Guardar' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Allocation summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{l ? 'Ingresos del mes' : 'Monthly income'}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{fc(totalIncome)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{l ? 'Pagos fijos' : 'Fixed bills'}</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">-{fc(totalFixed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{l ? 'Asignado a sobres' : 'Allocated to envelopes'}</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">-{fc(totalAllocated)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{l ? 'Sin asignar' : 'Unallocated'}</span>
              <span className={cn("font-bold text-lg", unallocated >= 0 ? "text-primary" : "text-destructive")}>
                {fc(unallocated)}
              </span>
            </div>
            {/* Visual bar */}
            <div className="h-3 rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${totalIncome > 0 ? Math.min((totalFixed / totalIncome) * 100, 100) : 0}%` }}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${totalIncome > 0 ? Math.min((totalAllocated / totalIncome) * 100, 100 - (totalFixed / totalIncome) * 100) : 0}%` }}
              />
              {unallocated > 0 && (
                <div
                  className="h-full bg-primary/30 transition-all duration-500"
                  style={{ width: `${(unallocated / totalIncome) * 100}%` }}
                />
              )}
            </div>
            <div className="flex gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />{l ? 'Fijos' : 'Fixed'}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{l ? 'Sobres' : 'Envelopes'}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/30" />{l ? 'Libre' : 'Free'}</span>
            </div>
          </div>

          {unallocated === 0 && totalAllocated > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <Check className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {l ? '¡Cada dólar tiene un trabajo! 🎉' : 'Every dollar has a job! 🎉'}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Envelopes grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {ENVELOPE_CATEGORIES.map((cat, i) => {
            const catConfig = EXPENSE_CATEGORY_TRANSLATIONS[cat];
            const allocated = isEditing
              ? parseFloat(editingAllocations[cat] || '0') || 0
              : currentAllocations[cat] || 0;
            const spent = spentPerCategory[cat] || 0;
            const remaining = allocated - spent;
            const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
            const status = getEnvelopeStatus(cat, allocated);

            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={cn(
                  "transition-all duration-200",
                  status === 'over' && "border-destructive/40 bg-destructive/5",
                  status === 'warning' && "border-amber-500/40 bg-amber-500/5",
                  status === 'ok' && "border-border",
                  status === 'empty' && "border-dashed border-muted-foreground/20"
                )}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-lg">{catConfig?.icon || '📋'}</span>
                        {catConfig?.[l ? 'es' : 'en'] || cat}
                      </span>
                      {status === 'over' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      {status === 'ok' && allocated > 0 && <Check className="h-4 w-4 text-emerald-500" />}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min="0"
                          step="10"
                          value={editingAllocations[cat] || '0'}
                          onChange={e => setEditingAllocations(prev => ({ ...prev, [cat]: e.target.value }))}
                          className="h-8 text-sm"
                          placeholder="0"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {fc(spent)} / {fc(allocated)}
                          </span>
                          <span className={cn(
                            "font-semibold",
                            remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                          )}>
                            {remaining >= 0 ? fc(remaining) : `-${fc(Math.abs(remaining))}`}
                            <span className="font-normal text-muted-foreground"> {l ? 'restante' : 'left'}</span>
                          </span>
                        </div>
                        {allocated > 0 && (
                          <Progress
                            value={Math.min(pct, 100)}
                            className={cn(
                              "h-2",
                              status === 'over' && "[&>div]:bg-destructive",
                              status === 'warning' && "[&>div]:bg-amber-500"
                            )}
                          />
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Savings envelope */}
      {!isEditing && totalIncome > 0 && (
        <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <PiggyBank className="h-6 w-6 text-emerald-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">{l ? 'Ahorro proyectado' : 'Projected savings'}</p>
              <p className="text-xs text-muted-foreground">
                {l ? 'Ingresos − fijos − sobres − gastado' : 'Income − fixed − envelopes − spent'}
              </p>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-lg font-bold",
                plan.projectedSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
              )}>
                {fc(Math.max(0, unallocated))}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {totalIncome > 0 ? `${((Math.max(0, unallocated) / totalIncome) * 100).toFixed(0)}%` : '0%'} {l ? 'del ingreso' : 'of income'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Educational banner */}
      <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
        <p className="text-xs text-muted-foreground leading-relaxed">
          💡 {l
            ? 'El presupuesto base cero asigna cada dólar a una categoría antes de gastar. La meta es que "Sin asignar" llegue a $0 — cada dólar tiene un trabajo.'
            : 'Zero-based budgeting assigns every dollar to a category before spending. The goal is to get "Unallocated" to $0 — every dollar has a job.'}
        </p>
      </div>
    </div>
  );
}
