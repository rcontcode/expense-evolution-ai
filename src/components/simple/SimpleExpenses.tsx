import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Receipt } from 'lucide-react';
import { SimplePageShell } from './SimplePageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { ExpenseDialog } from '@/components/dialogs/ExpenseDialog';
import type { ExpenseWithRelations } from '@/types/expense.types';

export function SimpleExpenses() {
  const { language } = useLanguage();
  const { data: expenses } = useExpenses();
  const { formatCurrency } = useFormatCurrency();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseWithRelations | null>(null);

  const sorted = useMemo(
    () => [...(expenses ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 100),
    [expenses],
  );

  const total = useMemo(() => {
    const ym = new Date().toISOString().slice(0, 7);
    return (expenses ?? [])
      .filter((e: any) => typeof e.date === 'string' && e.date.startsWith(ym))
      .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  }, [expenses]);

  return (
    <SimplePageShell
      title={language === 'es' ? 'Gastos' : 'Expenses'}
      subtitle={language === 'es' ? 'Tu historial reciente' : 'Your recent history'}
      primaryAction={
        <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {language === 'es' ? 'Agregar gasto' : 'Add expense'}
        </Button>
      }
    >
      <Card className="border-2 border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent">
        <CardContent className="py-5 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {language === 'es' ? 'Gastos este mes' : 'This month'}
          </div>
          <div className="text-3xl lg:text-4xl font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(total)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {language === 'es' ? 'Sin gastos todavía. Agrega el primero.' : 'No expenses yet. Add your first.'}
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {sorted.map((e: any) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => { setEditing(e); setDialogOpen(true); }}
                    className="w-full flex items-center justify-between gap-3 py-3 px-4 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {e.merchant || e.description || (language === 'es' ? 'Gasto' : 'Expense')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(e.date).toLocaleDateString(language === 'es' ? 'es' : 'en', { day: 'numeric', month: 'short' })}
                          {e.category ? ` · ${e.category}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-bold tabular-nums">
                      −{formatCurrency(Number(e.amount || 0))}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ExpenseDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        expense={editing ?? undefined}
      />
    </SimplePageShell>
  );
}
