import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Target, Edit2, Check, X } from "lucide-react";
import { useCategoryBudgets, useUpsertCategoryBudget, useDeleteCategoryBudget } from "@/hooks/data/useCategoryBudgets";
import { useExpenses } from "@/hooks/data/useExpenses";
import { EXPENSE_CATEGORIES, getCategoryLabel, ExpenseCategory } from "@/lib/constants/expense-categories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";

export function CategoryBudgetsCard() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [editBudget, setEditBudget] = useState("");

  const { data: budgets, isLoading } = useCategoryBudgets();
  const upsertBudget = useUpsertCategoryBudget();
  const deleteBudget = useDeleteCategoryBudget();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const { data: expenses } = useExpenses({
    dateRange: { start: monthStart, end: monthEnd },
  });

  // Calculate spending by category
  const spendingByCategory: Record<string, number> = {};
  expenses?.forEach((expense) => {
    if (expense.category) {
      spendingByCategory[expense.category] = (spendingByCategory[expense.category] || 0) + Number(expense.amount);
    }
  });

  // Get available categories (not already budgeted)
  const budgetedCategories = new Set(budgets?.map((b) => b.category) || []);
  const availableCategories = EXPENSE_CATEGORIES.filter((cat) => !budgetedCategories.has(cat.value));

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

  const startEdit = (budget: number) => {
    setEditBudget(budget.toString());
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          Metas por Categoría - {format(now, "MMMM yyyy", { locale: es })}
        </CardTitle>
        {!isAdding && availableCategories.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="flex gap-2 items-end p-3 bg-muted/50 rounded-lg">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Categoría</label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seleccionar" />
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
              <label className="text-xs text-muted-foreground">Presupuesto</label>
              <Input
                type="number"
                placeholder="$0.00"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="h-9"
              />
            </div>
            <Button size="sm" onClick={handleAdd} disabled={upsertBudget.isPending}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : !budgets || budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tienes metas configuradas. Agrega una para comenzar a controlar tus gastos por categoría.
          </p>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const spent = spendingByCategory[budget.category] || 0;
              const percentage = budget.monthly_budget > 0 ? (spent / budget.monthly_budget) * 100 : 0;
              const remaining = budget.monthly_budget - spent;

              return (
                <div key={budget.id} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{getCategoryLabel(budget.category as ExpenseCategory)}</span>
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
                            variant={
                              percentage >= 100
                                ? "destructive"
                                : percentage >= 80
                                ? "secondary"
                                : "outline"
                            }
                          >
                            ${spent.toFixed(0)} / ${budget.monthly_budget.toFixed(0)}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingId(budget.id);
                              startEdit(budget.monthly_budget);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteBudget.mutate(budget.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(0)}% utilizado</span>
                    <span>
                      {remaining >= 0
                        ? `$${remaining.toFixed(0)} disponible`
                        : `$${Math.abs(remaining).toFixed(0)} excedido`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
