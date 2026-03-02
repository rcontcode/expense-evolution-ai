import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { cn } from '@/lib/utils';

interface MobileStatsGridProps {
  isLoading: boolean;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  savingsRate: number;
}

export const MobileStatsGrid = memo(({
  isLoading,
  monthlyIncome,
  monthlyExpenses,
  monthlyBalance,
  savingsRate,
}: MobileStatsGridProps) => {
  const { language } = useLanguage();
  const { formatCompact } = useFormatCurrency();
  const navigate = useNavigate();
  const isPositive = monthlyBalance >= 0;

  if (isLoading) {
    return (
      <div className="stats-grid-2x2">
        <Skeleton className="h-[72px] rounded-xl skeleton-shimmer" />
        <Skeleton className="h-[72px] rounded-xl skeleton-shimmer" />
        <Skeleton className="h-[72px] rounded-xl skeleton-shimmer" />
        <Skeleton className="h-[72px] rounded-xl skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="stats-grid-2x2">
      {/* Income */}
      <Card
        className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate('/income')}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate" title={formatCompact(monthlyIncome)}>
              {formatCompact(monthlyIncome)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {language === 'es' ? 'Ingresos' : 'Income'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card
        className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/20 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate('/expenses')}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
            <TrendingDown className="h-5 w-5 text-rose-500" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400 truncate" title={formatCompact(monthlyExpenses)}>
              {formatCompact(monthlyExpenses)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {language === 'es' ? 'Gastos' : 'Expenses'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Balance */}
      <Card
        className={cn(
          'border cursor-pointer active:scale-[0.98] transition-transform',
          isPositive
            ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20'
            : 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20'
        )}
        onClick={() => navigate('/net-worth')}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
            isPositive ? 'bg-blue-500/20' : 'bg-amber-500/20'
          )}>
            <Wallet className={cn('h-5 w-5', isPositive ? 'text-blue-500' : 'text-amber-500')} />
          </div>
          <div className="min-w-0">
            <p className={cn(
              'text-lg font-bold truncate',
              isPositive ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
            )}>
              {isPositive ? '+' : ''}{formatCompact(monthlyBalance)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {language === 'es' ? 'Balance' : 'Balance'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Savings Rate */}
      <Card
        className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/20 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate('/banking')}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
            <PiggyBank className="h-5 w-5 text-purple-500" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 truncate">
              {savingsRate.toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {language === 'es' ? 'Ahorro' : 'Savings'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

MobileStatsGrid.displayName = 'MobileStatsGrid';
