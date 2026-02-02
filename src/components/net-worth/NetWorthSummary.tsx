import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Scale, ArrowUpRight, ArrowDownRight, Target, HelpCircle } from 'lucide-react';
import { NetWorthSnapshot } from '@/hooks/data/useNetWorth';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface NetWorthSummaryProps {
  totalAssets: number;
  totalLiabilities: number;
  snapshots: NetWorthSnapshot[];
}

export function NetWorthSummary({ totalAssets, totalLiabilities, snapshots }: NetWorthSummaryProps) {
  const isMobile = useIsMobile();
  const netWorth = totalAssets - totalLiabilities;
  
  const formatCurrency = (value: number) => {
    if (isMobile && Math.abs(value) >= 1000) {
      if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      return `$${(value / 1000).toFixed(0)}K`;
    }
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
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
      {/* Net Worth Card */}
      <Card className={cn(
        "col-span-2 sm:col-span-1",
        netWorth >= 0 ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'
      )}>
        <CardContent className="p-3 sm:pt-6 sm:px-6">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Scale className={cn("h-4 w-4 sm:h-5 sm:w-5", netWorth >= 0 ? 'text-green-600' : 'text-red-600')} />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Patrimonio Neto</span>
            {!isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground/60 hover:text-muted-foreground">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                  <p className="font-medium text-sm mb-1">¿Qué es el Patrimonio Neto?</p>
                  <p className="text-xs text-muted-foreground">
                    Es lo que realmente tienes = Activos - Pasivos. Si crece cada mes, vas por buen camino.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className={cn(
            "text-xl sm:text-3xl font-bold",
            netWorth >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {formatCurrency(netWorth)}
          </div>
          {monthlyChange && (
            <div className={cn(
              "flex items-center gap-1 mt-1 sm:mt-2 text-xs sm:text-sm",
              monthlyChange.change >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {monthlyChange.change >= 0 ? (
                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="truncate">
                {monthlyChange.percentChange >= 0 ? '+' : ''}{monthlyChange.percentChange.toFixed(1)}%
              </span>
              <span className="text-muted-foreground hidden sm:inline">vs mes anterior</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Assets Card */}
      <Card>
        <CardContent className="p-3 sm:pt-6 sm:px-6">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Activos</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-primary">
            {formatCurrency(totalAssets)}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
            Inversiones, propiedades, cuentas
          </div>
        </CardContent>
      </Card>

      {/* Total Liabilities Card */}
      <Card>
        <CardContent className="p-3 sm:pt-6 sm:px-6">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Pasivos</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-destructive">
            {formatCurrency(totalLiabilities)}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
            Deudas, préstamos, hipotecas
          </div>
        </CardContent>
      </Card>

      {/* Debt-to-Asset Ratio Card */}
      <Card className="col-span-2 sm:col-span-1">
        <CardContent className="p-3 sm:pt-6 sm:px-6">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Ratio D/A</span>
          </div>
          <div className={cn(
            "text-lg sm:text-2xl font-bold",
            debtToAssetRatio <= 30 ? 'text-green-600' : debtToAssetRatio <= 50 ? 'text-amber-500' : 'text-red-600'
          )}>
            {debtToAssetRatio.toFixed(1)}%
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
            {debtToAssetRatio <= 30 ? '✓ Saludable' : debtToAssetRatio <= 50 ? '⚠ Moderado' : '⚠ Alto'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
