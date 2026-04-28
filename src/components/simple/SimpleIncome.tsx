import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp } from 'lucide-react';
import { SimplePageShell } from './SimplePageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIncome } from '@/hooks/data/useIncome';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { IncomeDialog } from '@/components/dialogs/IncomeDialog';
import type { IncomeWithRelations } from '@/types/income.types';

export function SimpleIncome() {
  const { language } = useLanguage();
  const { data: income } = useIncome();
  const { formatCurrency } = useFormatCurrency();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeWithRelations | null>(null);

  const sorted = useMemo(
    () => [...(income ?? [])].sort((a: any, b: any) => (a.date < b.date ? 1 : -1)).slice(0, 100),
    [income],
  );

  const total = useMemo(() => {
    const ym = new Date().toISOString().slice(0, 7);
    return (income ?? [])
      .filter((i: any) => typeof i.date === 'string' && i.date.startsWith(ym))
      .reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  }, [income]);

  return (
    <SimplePageShell
      title={language === 'es' ? 'Ingresos' : 'Income'}
      subtitle={language === 'es' ? 'Lo que has sumado este mes' : 'What you have added this month'}
      primaryAction={
        <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {language === 'es' ? 'Agregar ingreso' : 'Add income'}
        </Button>
      }
    >
      <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardContent className="py-5 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {language === 'es' ? 'Ingresos este mes' : 'This month'}
          </div>
          <div className="text-3xl lg:text-4xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(total)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {language === 'es' ? 'Sin ingresos todavía.' : 'No income yet.'}
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {sorted.map((i: any) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => { setEditing(i); setDialogOpen(true); }}
                    className="w-full flex items-center justify-between gap-3 py-3 px-4 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {i.source || i.description || (language === 'es' ? 'Ingreso' : 'Income')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(i.date).toLocaleDateString(language === 'es' ? 'es' : 'en', { day: 'numeric', month: 'short' })}
                          {i.category ? ` · ${i.category}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(Number(i.amount || 0))}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <IncomeDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        income={editing ?? undefined}
      />
    </SimplePageShell>
  );
}
