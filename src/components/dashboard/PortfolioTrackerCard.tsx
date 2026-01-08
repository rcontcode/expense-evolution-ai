import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePortfolioTracker } from '@/hooks/data/usePortfolioTracker';
import { useLanguage } from '@/contexts/LanguageContext';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  DollarSign,
  Wallet,
  BarChart3,
  Coins,
  Building2,
  Bitcoin,
  Landmark,
  Gem,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('stock')) return TrendingUp;
  if (cat.includes('crypto') || cat.includes('bitcoin')) return Bitcoin;
  if (cat.includes('bond')) return Landmark;
  if (cat.includes('real') || cat.includes('property')) return Building2;
  if (cat.includes('fund') || cat.includes('etf')) return BarChart3;
  if (cat.includes('commodity') || cat.includes('gold')) return Gem;
  if (cat.includes('cash')) return Coins;
  return CircleDollarSign;
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    'stocks': 'Acciones',
    'crypto': 'Criptomonedas',
    'bonds': 'Bonos',
    'real_estate': 'Bienes Raíces',
    'mutual_funds': 'Fondos Mutuos',
    'etf': 'ETFs',
    'commodities': 'Commodities',
    'cash': 'Efectivo',
    'investments': 'Inversiones',
  };
  return labels[category.toLowerCase()] || category;
};

export function PortfolioTrackerCard() {
  const { t } = useLanguage();
  const metrics = usePortfolioTracker();

  const hasAssets = metrics.assets.length > 0;
  const hasDividends = metrics.dividendHistory.length > 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</p>
              </div>
              <Wallet className="h-8 w-8 text-primary opacity-80" />
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">Invertido:</span>
              <span>{formatCurrency(metrics.totalInvested)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${metrics.totalReturn >= 0 ? 'from-green-500/10 to-green-500/5 border-green-500/20' : 'from-red-500/10 to-red-500/5 border-red-500/20'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Retorno Total</p>
                <p className={`text-2xl font-bold ${metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.totalReturn)}
                </p>
              </div>
              {metrics.totalReturn >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600 opacity-80" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600 opacity-80" />
              )}
            </div>
            <div className="mt-2">
              <Badge variant={metrics.totalReturnPercentage >= 0 ? 'default' : 'destructive'} className="text-xs">
                {formatPercentage(metrics.totalReturnPercentage)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dividendos Totales</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(metrics.totalDividends)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-600 opacity-80" />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              ~{formatCurrency(metrics.monthlyDividendAverage)}/mes
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Yield Anual</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.dividendYield.toFixed(2)}%</p>
              </div>
              <PieChart className="h-8 w-8 text-purple-600 opacity-80" />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Proyección: {formatCurrency(metrics.yearlyDividendProjection)}/año
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diversification Chart */}
        <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Diversificación del Portafolio
            <InfoTooltip content={{ es: { title: "Diversificación", description: "Distribución de tus inversiones por categoría. Una buena diversificación reduce el riesgo." }, en: { title: "Diversification", description: "Distribution of your investments by category. Good diversification reduces risk." } }} />
          </CardTitle>
        </CardHeader>
          <CardContent>
            {metrics.diversification.length > 0 ? (
              <div className="space-y-4">
                {metrics.diversification.map((item) => {
                  const Icon = getCategoryIcon(item.category);
                  return (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{getCategoryLabel(item.category)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(item.value)}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={item.percentage} 
                        className="h-2"
                        style={{ 
                          '--progress-background': item.color 
                        } as React.CSSProperties}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay activos de inversión registrados</p>
                <p className="text-sm mt-1">Agrega inversiones en la página de Patrimonio</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets Performance */}
        <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rendimiento por Activo
            <InfoTooltip content={{ es: { title: "Rendimiento", description: "Ganancia o pérdida de cada inversión desde su compra." }, en: { title: "Performance", description: "Gain or loss of each investment since purchase." } }} />
          </CardTitle>
        </CardHeader>
          <CardContent>
            {hasAssets ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {metrics.assets.map((asset) => {
                  const Icon = getCategoryIcon(asset.category);
                  const isPositive = asset.returnPercentage >= 0;
                  
                  return (
                    <div 
                      key={asset.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          <Icon className={`h-4 w-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getCategoryLabel(asset.category)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(asset.currentValue)}</p>
                        <div className={`flex items-center justify-end gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          <span>{formatPercentage(asset.returnPercentage)}</span>
                          <span className="text-muted-foreground">
                            ({formatCurrency(asset.returnAmount)})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay inversiones registradas</p>
                <p className="text-sm mt-1">Comienza agregando tus activos de inversión</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topPerformers.length > 0 ? (
              <div className="space-y-3">
                {metrics.topPerformers.map((asset, index) => (
                  <div key={asset.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-600">#{index + 1}</span>
                      <span className="text-sm">{asset.name}</span>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      {formatPercentage(asset.returnPercentage)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin ganancias registradas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Underperformers */}
        <Card className="border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Necesitan Atención
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.underperformers.length > 0 ? (
              <div className="space-y-3">
                {metrics.underperformers.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between">
                    <span className="text-sm">{asset.name}</span>
                    <Badge variant="destructive">
                      {formatPercentage(asset.returnPercentage)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                ¡Todas tus inversiones están en verde!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Dividends */}
        <Card className="border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <Coins className="h-5 w-5" />
              Dividendos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasDividends ? (
              <div className="space-y-3 max-h-[150px] overflow-y-auto">
                {metrics.dividendHistory.slice(0, 5).map((dividend) => (
                  <div key={dividend.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{format(new Date(dividend.date), 'dd MMM')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground truncate max-w-[100px]">
                        {dividend.source}
                      </span>
                      <span className="font-medium text-amber-600">
                        +{formatCurrency(dividend.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin dividendos registrados
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investment Tips */}
      {hasAssets && (
        <Card className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Gem className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-600 mb-1">Consejo de Inversión</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.diversification.length === 1 ? (
                    "Tu portafolio está concentrado en una sola categoría. Considera diversificar en diferentes tipos de activos para reducir el riesgo."
                  ) : metrics.dividendYield < 2 ? (
                    "Tu yield por dividendos es bajo. Considera agregar acciones o ETFs que paguen dividendos para generar ingresos pasivos."
                  ) : metrics.topPerformers.length > 0 && metrics.topPerformers[0].returnPercentage > 50 ? (
                    `${metrics.topPerformers[0].name} ha crecido significativamente. Considera tomar ganancias parciales y rebalancear.`
                  ) : (
                    "Mantén tu estrategia de inversión diversificada y continúa aportando regularmente para maximizar el efecto del interés compuesto."
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <LegalDisclaimer variant="investment" />
    </div>
  );
}
