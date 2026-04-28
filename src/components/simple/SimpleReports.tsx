import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, FileText } from 'lucide-react';
import { SimplePageShell } from './SimplePageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { cn } from '@/lib/utils';

export function SimpleReports() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const { formatCurrency } = useFormatCurrency();

  const summary = useMemo(() => {
    const ym = new Date().toISOString().slice(0, 7);
    const inc = (income ?? [])
      .filter((i: any) => typeof i.date === 'string' && i.date.startsWith(ym))
      .reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
    const out = (expenses ?? [])
      .filter((e: any) => typeof e.date === 'string' && e.date.startsWith(ym))
      .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
    return { inc, out, balance: inc - out };
  }, [expenses, income]);

  const positive = summary.balance >= 0;
  const monthName = new Date().toLocaleDateString(language === 'es' ? 'es' : 'en', { month: 'long', year: 'numeric' });

  return (
    <SimplePageShell
      title={language === 'es' ? 'Resumen' : 'Summary'}
      subtitle={monthName}
    >
      <Card className={cn(
        'border-2 shadow-md',
        positive ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent'
                 : 'border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-transparent',
      )}>
        <CardContent className="py-6 text-center space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {language === 'es' ? 'Balance del mes' : 'Monthly balance'}
          </div>
          <div className={cn(
            'text-4xl lg:text-5xl font-bold tabular-nums',
            positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
          )}>
            {positive ? '+' : ''}{formatCurrency(summary.balance)}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">
                {language === 'es' ? 'Ingresos' : 'Income'}
              </div>
              <div className="text-xl font-bold tabular-nums">{formatCurrency(summary.inc)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">
                {language === 'es' ? 'Gastos' : 'Expenses'}
              </div>
              <div className="text-xl font-bold tabular-nums">{formatCurrency(summary.out)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-5 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                {language === 'es' ? '¿Necesitas reportes detallados?' : 'Need detailed reports?'}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'es' ? 'PDF, Excel, impuestos y más' : 'PDF, Excel, taxes and more'}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/reports?advanced=1')} className="gap-1.5 shrink-0">
            <Wallet className="h-4 w-4" />
            {language === 'es' ? 'Ver más reportes' : 'See more reports'}
          </Button>
        </CardContent>
      </Card>
    </SimplePageShell>
  );
}
