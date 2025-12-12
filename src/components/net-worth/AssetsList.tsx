import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Asset, ASSET_CATEGORIES, useDeleteAsset } from '@/hooks/data/useNetWorth';
import { 
  Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown, Home, Car, PiggyBank, Bitcoin, 
  Gem, Building2, Package, Droplets, Hexagon, CircleDollarSign, Coins, Layers, ImageIcon,
  Zap, AlertTriangle, DollarSign
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AssetsListProps {
  assets: Asset[];
  onAdd: () => void;
  onEdit: (asset: Asset) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wallet, TrendingUp, Home, Car, PiggyBank, Bitcoin, Gem, Building2, Package,
  Hexagon, CircleDollarSign, Coins, Layers, ImageIcon
};

// Categories that typically depreciate
const DEPRECIATING_CATEGORIES = ['vehicles', 'collectibles'];

// Categories that are typically productive (generate income)
const PRODUCTIVE_CATEGORIES = ['investments', 'real_estate', 'business', 'retirement', 'crypto_defi'];

export function AssetsList({ assets, onAdd, onEdit }: AssetsListProps) {
  const deleteAsset = useDeleteAsset();

  const formatCurrency = (value: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat('es-CA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
  const liquidAssets = assets.filter(a => a.is_liquid).reduce((sum, a) => sum + a.current_value, 0);

  // Calculate productive vs non-productive
  const isProductive = (asset: Asset) => {
    // Check if notes indicate it generates income
    if (asset.notes?.toLowerCase().includes('[genera ingresos]')) return true;
    if (asset.notes?.toLowerCase().includes('ingreso') || 
        asset.notes?.toLowerCase().includes('renta') ||
        asset.notes?.toLowerCase().includes('dividendo')) return true;
    // Check if category is typically productive
    return PRODUCTIVE_CATEGORIES.includes(asset.category);
  };

  const productiveAssets = assets.filter(isProductive);
  const nonProductiveAssets = assets.filter(a => !isProductive(a));
  const productiveValue = productiveAssets.reduce((sum, a) => sum + a.current_value, 0);
  const nonProductiveValue = nonProductiveAssets.reduce((sum, a) => sum + a.current_value, 0);
  const productivePercent = totalAssets > 0 ? (productiveValue / totalAssets) * 100 : 0;

  // Calculate total depreciation
  const totalDepreciation = assets.reduce((sum, a) => {
    if (a.purchase_value && a.current_value < a.purchase_value) {
      return sum + (a.purchase_value - a.current_value);
    }
    return sum;
  }, 0);

  const getCategoryInfo = (categoryValue: string) => {
    return ASSET_CATEGORIES.find(c => c.value === categoryValue) || ASSET_CATEGORIES[ASSET_CATEGORIES.length - 1];
  };

  const getGainLoss = (asset: Asset) => {
    if (!asset.purchase_value) return null;
    const diff = asset.current_value - asset.purchase_value;
    const percent = (diff / asset.purchase_value) * 100;
    return { diff, percent };
  };

  const isDepreciating = (asset: Asset) => {
    return DEPRECIATING_CATEGORIES.includes(asset.category);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Activos
            </CardTitle>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
              <span>Total: <span className="font-semibold text-primary">{formatCurrency(totalAssets)}</span></span>
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                Líquidos: {formatCurrency(liquidAssets)}
              </span>
            </div>
          </div>
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>

        {/* Productive vs Non-Productive Summary */}
        {assets.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span>Productivos:</span>
                <span className="font-semibold text-green-600">{formatCurrency(productiveValue)}</span>
                <span className="text-xs text-muted-foreground">({productiveAssets.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>No productivos:</span>
                <span className="font-semibold text-muted-foreground">{formatCurrency(nonProductiveValue)}</span>
                <span className="text-xs text-muted-foreground">({nonProductiveAssets.length})</span>
              </div>
            </div>
            <div className="space-y-1">
              <Progress 
                value={productivePercent} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground text-center">
                {productivePercent.toFixed(0)}% de tu patrimonio genera o puede generar ingresos
              </p>
            </div>

            {/* Depreciation Alert */}
            {totalDepreciation > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400">
                  Depreciación total: <strong>{formatCurrency(totalDepreciation)}</strong> en activos que pierden valor
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {assets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tienes activos registrados</p>
            <p className="text-sm">Agrega tus cuentas, inversiones y propiedades</p>
          </div>
        ) : (
          <TooltipProvider>
            {assets.map((asset) => {
              const category = getCategoryInfo(asset.category);
              const IconComponent = iconMap[category.icon] || Package;
              const gainLoss = getGainLoss(asset);
              const productive = isProductive(asset);
              const depreciating = isDepreciating(asset);
              const hasDepreciated = gainLoss && gainLoss.diff < 0;

              return (
                <div
                  key={asset.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    hasDepreciated 
                      ? 'bg-red-500/5 hover:bg-red-500/10 border border-red-500/20' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full relative ${
                      category.group === 'crypto' 
                        ? 'bg-amber-500/10' 
                        : productive 
                          ? 'bg-green-500/10' 
                          : 'bg-muted'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${
                        category.group === 'crypto' 
                          ? 'text-amber-500' 
                          : productive 
                            ? 'text-green-500' 
                            : 'text-muted-foreground'
                      }`} />
                      {productive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                          <Zap className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{asset.name}</span>
                        {productive ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                                <Zap className="h-3 w-3 mr-1" />
                                Productivo
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Este activo genera o puede generar ingresos pasivos</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                No productivo
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Este activo no genera ingresos directos</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {asset.is_liquid && (
                          <Badge variant="outline" className="text-xs">
                            <Droplets className="h-3 w-3 mr-1" />
                            Líquido
                          </Badge>
                        )}
                        {depreciating && !productive && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Se deprecia
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Los {category.label.toLowerCase()} típicamente pierden valor con el tiempo</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{category.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(asset.current_value, asset.currency)}</div>
                      {gainLoss && (
                        <div className="flex items-center gap-1 justify-end">
                          {gainLoss.diff >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span className={`text-xs ${gainLoss.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {gainLoss.diff >= 0 ? '+' : ''}{formatCurrency(gainLoss.diff, asset.currency)}
                            <span className="text-[10px] ml-1">({gainLoss.percent.toFixed(1)}%)</span>
                          </span>
                        </div>
                      )}
                      {/* Depreciation bar for assets that lost value */}
                      {hasDepreciated && (
                        <div className="mt-1 w-24">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.abs(gainLoss.percent))}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-red-500 mt-0.5">
                            Perdió {Math.abs(gainLoss.percent).toFixed(0)}% de valor
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(asset)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar activo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará "{asset.name}" permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAsset.mutate(asset.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </TooltipProvider>
        )}

        {/* Educational footer */}
        {assets.length > 0 && nonProductiveAssets.length > productiveAssets.length && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
            <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                <strong>Consejo:</strong> La mayoría de tus activos no generan ingresos. 
                Considera convertir activos no productivos en inversiones que generen flujo de efectivo.
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
