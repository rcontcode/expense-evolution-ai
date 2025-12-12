import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Scale, ArrowUpRight, ArrowDownRight, Target, HelpCircle } from 'lucide-react';
import { NetWorthSnapshot } from '@/hooks/data/useNetWorth';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/60 hover:text-muted-foreground">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3">
                <p className="font-medium text-sm mb-1">¿Qué es el Patrimonio Neto?</p>
                <p className="text-xs text-muted-foreground">
                  Es lo que realmente tienes = Activos - Pasivos. Es como tu "puntaje financiero" personal. 
                  Si crece cada mes, vas por buen camino hacia la libertad financiera.
                </p>
              </TooltipContent>
            </Tooltip>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/60 hover:text-muted-foreground">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3">
                <p className="font-medium text-sm mb-1">¿Qué son los Activos?</p>
                <p className="text-xs text-muted-foreground">
                  Cosas que PONEN dinero en tu bolsillo: inversiones, propiedades que rentas, negocios. 
                  Un verdadero activo genera ingresos o aumenta de valor.
                </p>
              </TooltipContent>
            </Tooltip>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/60 hover:text-muted-foreground">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3">
                <p className="font-medium text-sm mb-1">¿Qué son los Pasivos?</p>
                <p className="text-xs text-muted-foreground">
                  Cosas que SACAN dinero de tu bolsillo: deudas, préstamos, hipotecas. 
                  El objetivo es que tus activos generen suficiente dinero para pagar tus pasivos.
                </p>
              </TooltipContent>
            </Tooltip>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/60 hover:text-muted-foreground">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3">
                <p className="font-medium text-sm mb-1">¿Qué es el Ratio Deuda/Activos?</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Qué porcentaje de tus activos debes. Menos de 30% = saludable. 
                  Más de 50% = deberías enfocarte en pagar deudas.
                </p>
                <p className="text-xs text-amber-600">
                  💡 Los bancos usan este ratio para decidir si te prestan dinero.
                </p>
              </TooltipContent>
            </Tooltip>
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
