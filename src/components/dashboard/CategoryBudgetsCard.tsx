import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, Target, Edit2, Check, X, Sparkles, RefreshCw, Rocket, BarChart3 } from "lucide-react";
import { useCategoryBudgets, useUpsertCategoryBudget, useDeleteCategoryBudget } from "@/hooks/data/useCategoryBudgets";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useBudgetSuggestions, getCategorySuggestion } from "@/hooks/data/useBudgetSuggestions";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBudgetEntity } from "@/contexts/BudgetEntityContext";
import { EXPENSE_CATEGORIES, getCategoryLabel, ExpenseCategory } from "@/lib/constants/expense-categories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function CategoryBudgetsCard() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCompact: fc } = useFormatCurrency();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [editBudget, setEditBudget] = useState("");

  const { data: budgets, isLoading } = useCategoryBudgets(useBudgetEntity());
  const upsertBudget = useUpsertCategoryBudget();
  const deleteBudget = useDeleteCategoryBudget();
  const budgetSuggestions = useBudgetSuggestions();
  const budgetEntityId = useBudgetEntity();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const { data: expenses } = useExpenses({
    dateRange: { start: monthStart, end: monthEnd },
    entityId: budgetEntityId ?? undefined,
    showAllEntities: budgetEntityId === undefined,
  });

  const spendingByCategory: Record<string, number> = {};
  expenses?.forEach((expense) => {
    if (expense.category) {
      spendingByCategory[expense.category] = (spendingByCategory[expense.category] || 0) + Number(expense.amount);
    }
  });

  const budgetedCategories = new Set(budgets?.map((b) => b.category) || []);
  const availableCategories = EXPENSE_CATEGORIES.filter((cat) => !budgetedCategories.has(cat.value));

  // Find top unbudgeted spending categories
  const topUnbudgetedSpending = Object.entries(spendingByCategory)
    .filter(([cat]) => !budgetedCategories.has(cat))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const handleSuggestForCategory = (category: string) => {
    const suggestion = getCategorySuggestion(budgetSuggestions, category);
    if (suggestion && suggestion.suggestedBudget > 0) {
      setNewBudget(suggestion.suggestedBudget.toString());
      toast.success(l 
        ? `Sugerido: ${fc(suggestion.suggestedBudget)} (promedio ${fc(Math.round(suggestion.averageSpent))} + 10%)`
        : `Suggested: ${fc(suggestion.suggestedBudget)} (avg ${fc(Math.round(suggestion.averageSpent))} + 10%)`);
    } else {
      toast.info(l ? "No hay suficiente historial para esta categoría" : "Not enough history for this category");
    }
  };

  const handleAdjustAll = () => {
    if (!budgets || budgets.length === 0) return;
    
    let updated = 0;
    budgets.forEach((budget) => {
      const suggestion = getCategorySuggestion(budgetSuggestions, budget.category);
      if (suggestion && suggestion.suggestedBudget > 0) {
        upsertBudget.mutate({ 
          category: budget.category, 
          monthly_budget: suggestion.suggestedBudget 
        });
        updated++;
      }
    });
    
    if (updated > 0) {
      toast.success(l 
        ? `${updated} presupuestos ajustados automáticamente`
        : `${updated} budgets adjusted automatically`);
    } else {
      toast.info(l ? "No hay suficiente historial para ajustar" : "Not enough history to adjust");
    }
  };

  const handleAdd = () => {
    if (!newCategory || !newBudget) return;
    upsertBudget.mutate(
      { category: newCategory, monthly_budget: parseFloat(newBudget) },
      {
        onSuccess: () => {
          setIsAdding(false);
          setNewCategory("");
          setNewBudget("");
        },
      }
    );
  };

  const handleEdit = (id: string, category: string) => {
    if (!editBudget) return;
    upsertBudget.mutate(
      { category, monthly_budget: parseFloat(editBudget) },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditBudget("");
        },
      }
    );
  };

  const startEditBudget = (budget: number) => {
    setEditBudget(budget.toString());
  };

  const getStatusStyles = (percentage: number) => {
    if (percentage >= 100) return { 
      gradient: "from-red-500 to-rose-600", 
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-600 dark:text-red-400"
    };
    if (percentage >= 80) return { 
      gradient: "from-amber-500 to-orange-500", 
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-600 dark:text-amber-400"
    };
    return { 
      gradient: "from-teal-500 to-cyan-500", 
      bg: "bg-teal-50 dark:bg-teal-950/30",
      text: "text-teal-600 dark:text-teal-400"
    };
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-transparent" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
        <CardTitle className="flex items-center gap-3 text-base">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/25"
          >
            <Target className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <span className="text-teal-700 dark:text-teal-400 font-bold">
              {l ? 'Metas por Categoría' : 'Category Goals'}
            </span>
            <p className="text-xs text-muted-foreground font-normal">
              {format(now, "MMMM yyyy", { locale: l ? es : enUS })}
            </p>
          </div>
        </CardTitle>
        <div className="flex items-center gap-2">
          {budgets && budgets.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.1, rotate: 180 }} transition={{ duration: 0.3 }}>
                  <Button size="sm" variant="ghost" onClick={handleAdjustAll} className="h-8 w-8 p-0 rounded-full hover:bg-teal-100 dark:hover:bg-teal-900/30">
                    <RefreshCw className="h-4 w-4 text-teal-600" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>{l ? 'Ajustar todos automáticamente' : 'Auto-adjust all'}</TooltipContent>
            </Tooltip>
          )}
          {!isAdding && availableCategories.length > 0 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="sm" 
                onClick={() => setIsAdding(true)}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                {l ? 'Agregar' : 'Add'}
              </Button>
            </motion.div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 relative">
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 items-end p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/50 dark:to-cyan-950/50 rounded-xl border border-teal-200 dark:border-teal-800 flex-wrap"
            >
              <div className="flex-1 min-w-[120px] space-y-1">
                <label className="text-xs text-muted-foreground font-medium">
                  {l ? 'Categoría' : 'Category'}
                </label>
                <Select value={newCategory} onValueChange={(val) => {
                  setNewCategory(val);
                  const suggestion = getCategorySuggestion(budgetSuggestions, val);
                  if (suggestion && suggestion.suggestedBudget > 0) {
                    setNewBudget(suggestion.suggestedBudget.toString());
                  }
                }}>
                  <SelectTrigger className="h-9 border-teal-200 dark:border-teal-800">
                    <SelectValue placeholder={l ? "Seleccionar" : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground font-medium">
                    {l ? 'Presupuesto' : 'Budget'}
                  </label>
                  {newCategory && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-5 w-5 rounded-full bg-gradient-to-br from-teal-500 to-cyan-400 text-white hover:opacity-90" 
                          onClick={() => handleSuggestForCategory(newCategory)}
                        >
                          <Sparkles className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{l ? 'Sugerir basado en historial' : 'Suggest based on history'}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="h-9 border-teal-200 dark:border-teal-800"
                />
              </div>
              <Button 
                size="sm" 
                onClick={handleAdd} 
                disabled={upsertBudget.isPending}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-400 animate-pulse" />
            <p className="text-sm text-muted-foreground">{l ? 'Cargando...' : 'Loading...'}</p>
          </div>
        ) : !budgets || budgets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 py-4"
          >
            <div className="text-center">
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center"
              >
                <Rocket className="h-8 w-8 text-teal-600" />
              </motion.div>
              <p className="text-sm font-medium mb-1">
                {l ? 'Aún no tienes metas por categoría' : 'No category goals yet'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {l 
                  ? 'Agrega metas para controlar tu gasto por categoría y recibir alertas inteligentes.'
                  : 'Add goals to control spending by category and get smart alerts.'}
              </p>
            </div>

            {/* Suggest based on spending */}
            {topUnbudgetedSpending.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {l ? 'Basado en tu gasto actual:' : 'Based on your current spending:'}
                </p>
                {topUnbudgetedSpending.map(([cat, spent]) => (
                  <div key={cat} className="flex items-center justify-between p-2.5 rounded-lg bg-teal-500/5 border border-teal-500/10">
                    <div>
                      <p className="text-xs font-medium">{getCategoryLabel(cat as ExpenseCategory)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {fc(spent)} {l ? 'este mes' : 'this month'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-teal-500/30 hover:bg-teal-500/10"
                      onClick={() => {
                        setNewCategory(cat);
                        const suggestion = getCategorySuggestion(budgetSuggestions, cat);
                        setNewBudget(suggestion?.suggestedBudget?.toString() || Math.ceil(spent * 1.1).toString());
                        setIsAdding(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {l ? 'Crear meta' : 'Create goal'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget, index) => {
              const spent = spendingByCategory[budget.category] || 0;
              const percentage = budget.monthly_budget > 0 ? (spent / budget.monthly_budget) * 100 : 0;
              const remaining = budget.monthly_budget - spent;
              const styles = getStatusStyles(percentage);

              return (
                <motion.div 
                  key={budget.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "space-y-2 p-3 rounded-xl transition-all",
                    styles.bg
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{getCategoryLabel(budget.category as ExpenseCategory)}</span>
                    <div className="flex items-center gap-2">
                      {editingId === budget.id ? (
                        <>
                          <Input
                            type="number"
                            value={editBudget}
                            onChange={(e) => setEditBudget(e.target.value)}
                            className="h-7 w-24 text-sm"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleEdit(budget.id, budget.category)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge
                            className={cn(
                              "px-2 py-0.5",
                              `bg-gradient-to-r ${styles.gradient} text-white border-0`
                            )}
                          >
                            {fc(spent)} / {fc(budget.monthly_budget)}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 hover:bg-teal-100 dark:hover:bg-teal-900/30"
                            onClick={() => {
                              setEditingId(budget.id);
                              startEditBudget(budget.monthly_budget);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:bg-red-100 dark:hover:bg-red-900/30"
                            onClick={() => deleteBudget.mutate(budget.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="relative h-2.5 rounded-full overflow-hidden bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full",
                        `bg-gradient-to-r ${styles.gradient}`
                      )}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{percentage.toFixed(0)}% {l ? 'utilizado' : 'used'}</span>
                    <span className={cn("font-medium", styles.text)}>
                      {remaining >= 0
                        ? `${fc(remaining)} ${l ? 'disponible' : 'available'}`
                        : `${fc(Math.abs(remaining))} ${l ? 'excedido' : 'exceeded'}`}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
