import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Plus, TrendingUp, TrendingDown, Receipt, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { cn } from '@/lib/utils';

interface SimpleDashboardProps {
  onQuickCapture?: () => void;
}

/**
 * Ultra-simplified dashboard for users in Simple UI mode.
 * Shows only: monthly balance, 3 big actions, recent activity.
 * No tabs, no complex grids, lots of whitespace.
 */
export function SimpleDashboard({ onQuickCapture }: SimpleDashboardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { formatCurrency } = useFormatCurrency();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();

  const balance = (stats?.monthlyIncome ?? 0) - (stats?.monthlyTotal ?? 0);
  const positive = balance >= 0;

  // Combine recent expenses + income, take top 8 by date
  const recent = useMemo(() => {
    const items: Array<{ id: string; type: 'expense' | 'income'; label: string; amount: number; date: string }> = [];
    (expenses ?? []).slice(0, 20).forEach((e: any) => {
      items.push({
        id: `e-${e.id}`,
        type: 'expense',
        label: e.merchant || e.category || (language === 'es' ? 'Gasto' : 'Expense'),
        amount: Number(e.amount) || 0,
        date: e.date,
      });
    });
    (income ?? []).slice(0, 20).forEach((i: any) => {
      items.push({
        id: `i-${i.id}`,
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

  const monthLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(language === 'es' ? 'es' : 'en', { month: 'long', year: 'numeric' });
  }, [language]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      {/* Hero balance */}
      <Card
        className={cn(
          'border-2 shadow-xl transition-all',
          positive
            ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5'
            : 'border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-orange-500/5',
        )}
      >
        <CardContent className="py-8 text-center space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {language === 'es' ? 'Balance de' : 'Balance for'} {monthLabel}
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
          <div className="flex justify-center gap-6 pt-3 text-sm">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">{formatCurrency(stats?.monthlyIncome ?? 0)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
              <span className="font-semibold">{formatCurrency(stats?.monthlyTotal ?? 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3 big action buttons */}
      <div className="grid grid-cols-3 gap-3">
        <ActionButton
          icon={<Receipt className="h-6 w-6" />}
          label={language === 'es' ? 'Gasto' : 'Expense'}
          color="rose"
          onClick={() => navigate('/expenses')}
        />
        <ActionButton
          icon={<Plus className="h-6 w-6" />}
          label={language === 'es' ? 'Ingreso' : 'Income'}
          color="emerald"
          onClick={() => navigate('/income')}
        />
        <ActionButton
          icon={<Camera className="h-6 w-6" />}
          label={language === 'es' ? 'Capturar' : 'Capture'}
          color="violet"
          onClick={() => (onQuickCapture ? onQuickCapture() : navigate('/capture'))}
        />
      </div>

      {/* Recent activity */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base">
              {language === 'es' ? 'Movimientos recientes' : 'Recent activity'}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/expenses')} className="gap-1 h-7">
              {language === 'es' ? 'Ver todo' : 'See all'}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {language === 'es'
                ? 'Aún no hay movimientos este mes. Empieza con tu primer gasto o ingreso.'
                : 'No activity yet this month. Start with your first expense or income.'}
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {recent.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-2.5">
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
                  <div
                    className={cn(
                      'text-sm font-bold tabular-nums shrink-0 ml-3',
                      item.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground',
                    )}
                  >
                    {item.type === 'income' ? '+' : '−'}
                    {formatCurrency(item.amount)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pt-2">
        {language === 'es'
          ? 'Modo Simple activo · Cambia a Avanzado desde el botón en el header.'
          : 'Simple Mode active · Switch to Advanced from the header button.'}
      </p>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 font-semibold text-sm transition-all hover:scale-[1.04] active:scale-[0.98] shadow-md',
        colorMap[color],
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
