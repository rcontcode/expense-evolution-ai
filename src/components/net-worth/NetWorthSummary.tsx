import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Scale, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';
import { NetWorthSnapshot } from '@/hooks/data/useNetWorth';

interface NetWorthSummaryProps {
  totalAssets: number;
  totalLiabilities: number;
  snapshots: NetWorthSnapshot[];
}

export function NetWorthSummary({ totalAssets, totalLiabilities, snapshots }: NetWorthSummaryProps) {
  const netWorth = totalAssets - totalLiabilities;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate month-over-month change
  const getMonthlyChange = () => {
    if (snapshots.length < 2) return null;
    const lastSnapshot = snapshots[snapshots.length - 1];
    const previousSnapshot = snapshots[snapshots.length - 2];
    const change = netWorth - previousSnapshot.net_worth;
    const percentChange = previousSnapshot.net_worth !== 0 
      ? ((change / Math.abs(previousSnapshot.net_worth)) * 100) 
      : 0;
    return { change, percentChange };
  };

  const monthlyChange = getMonthlyChange();

  // Calculate debt-to-asset ratio
  const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Net Worth Card */}
      <Card className={`${netWorth >= 0 ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Scale className={`h-5 w-5 ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <span className="text-sm font-medium text-muted-foreground">Patrimonio Neto</span>
          </div>
          <div className={`text-3xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netWorth)}
          </div>
          {monthlyChange && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${monthlyChange.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyChange.change >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>
                {monthlyChange.change >= 0 ? '+' : ''}{formatCurrency(monthlyChange.change)} ({monthlyChange.percentChange.toFixed(1)}%)
              </span>
              <span className="text-muted-foreground">vs mes anterior</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Assets Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Total Activos</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(totalAssets)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Inversiones, propiedades, cuentas
          </div>
        </CardContent>
      </Card>

      {/* Total Liabilities Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-muted-foreground">Total Pasivos</span>
          </div>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(totalLiabilities)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Deudas, préstamos, hipotecas
          </div>
        </CardContent>
      </Card>

      {/* Debt-to-Asset Ratio Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-muted-foreground">Ratio Deuda/Activos</span>
          </div>
          <div className={`text-2xl font-bold ${debtToAssetRatio <= 30 ? 'text-green-600' : debtToAssetRatio <= 50 ? 'text-amber-500' : 'text-red-600'}`}>
            {debtToAssetRatio.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {debtToAssetRatio <= 30 ? '✓ Saludable' : debtToAssetRatio <= 50 ? '⚠ Moderado' : '⚠ Alto'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
