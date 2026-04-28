import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Landmark } from 'lucide-react';
import { SimplePageShell } from './SimplePageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { BankImportDialog } from '@/components/dialogs/BankImportDialog';
import { cn } from '@/lib/utils';

export function SimpleBanking() {
  const { language } = useLanguage();
  const { data: transactions } = useBankTransactions();
  const { formatCurrency } = useFormatCurrency();
  const [importOpen, setImportOpen] = useState(false);

  const recent = useMemo(() => (transactions ?? []).slice(0, 15), [transactions]);

  const monthSummary = useMemo(() => {
    const ym = new Date().toISOString().slice(0, 7);
    let inc = 0, out = 0;
    for (const t of (transactions ?? [])) {
      if (!t.transaction_date?.startsWith(ym)) continue;
      const a = Number(t.amount || 0);
      if (a >= 0) inc += a; else out += Math.abs(a);
    }
    return { inc, out };
  }, [transactions]);

  return (
    <SimplePageShell
      title={language === 'es' ? 'Banco' : 'Bank'}
      subtitle={language === 'es' ? 'Movimientos recientes' : 'Recent movements'}
      primaryAction={
        <Button size="sm" onClick={() => setImportOpen(true)} className="gap-1.5">
          <Upload className="h-4 w-4" />
          {language === 'es' ? 'Importar extracto' : 'Import statement'}
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="py-4 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {language === 'es' ? 'Entradas del mes' : 'Money in'}
            </div>
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatCurrency(monthSummary.inc)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent">
          <CardContent className="py-4 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {language === 'es' ? 'Salidas del mes' : 'Money out'}
            </div>
            <div className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-1">
              −{formatCurrency(monthSummary.out)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                {language === 'es' ? 'Aún no tienes movimientos. Importa tu primer extracto.' : 'No movements yet. Import your first statement.'}
              </p>
              <Button onClick={() => setImportOpen(true)} className="gap-1.5">
                <Upload className="h-4 w-4" />
                {language === 'es' ? 'Importar extracto' : 'Import statement'}
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {recent.map((t: any) => {
                const amt = Number(t.amount || 0);
                const positive = amt >= 0;
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.description || t.merchant || (language === 'es' ? 'Movimiento' : 'Movement')}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(t.transaction_date).toLocaleDateString(language === 'es' ? 'es' : 'en', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      'shrink-0 text-sm font-bold tabular-nums',
                      positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground',
                    )}>
                      {positive ? '+' : '−'}{formatCurrency(Math.abs(amt))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <BankImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </SimplePageShell>
  );
}
