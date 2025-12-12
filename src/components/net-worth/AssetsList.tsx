import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Asset, ASSET_CATEGORIES, useDeleteAsset, useUpdateAsset } from '@/hooks/data/useNetWorth';
import { useFinancialProfile } from '@/hooks/data/useFinancialProfile';
import { useProfile } from '@/hooks/data/useProfile';
import { 
  Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown, Home, Car, PiggyBank, Bitcoin, 
  Gem, Building2, Package, Droplets, Hexagon, CircleDollarSign, Coins, Layers, ImageIcon,
  Zap, AlertTriangle, DollarSign, Lightbulb, ArrowRight, Sparkles, Loader2, Check, RotateCw
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

// Recommendations generator based on profile and assets
const generateRecommendations = (
  nonProductiveAssets: Asset[],
  profile: { risk_tolerance?: string; interests?: string[]; time_availability?: string } | null,
  userName: string
) => {
  const recommendations: Array<{
    asset: Asset;
    suggestion: string;
    strategy: string;
    icon: React.ReactNode;
    difficulty: 'fácil' | 'moderado' | 'avanzado';
  }> = [];

  const riskLevel = profile?.risk_tolerance || 'moderate';
  const interests = profile?.interests || [];
  const timeAvailable = profile?.time_availability || 'moderate';

  nonProductiveAssets.forEach(asset => {
    if (asset.category === 'vehicles') {
      // Vehicle recommendations
      if (riskLevel === 'aggressive' || interests.includes('business')) {
        recommendations.push({
          asset,
          suggestion: `${userName}, tu ${asset.name} podría generar ingresos`,
          strategy: 'Considera registrarte en plataformas como Uber, Lyft, o servicios de delivery. También podrías rentarlo cuando no lo uses a través de Turo o similar.',
          icon: <Car className="h-4 w-4" />,
          difficulty: 'moderado'
        });
      } else {
        recommendations.push({
          asset,
          suggestion: `${userName}, tu ${asset.name} está depreciándose`,
          strategy: 'Evalúa si realmente necesitas este vehículo. Podrías venderlo e invertir el dinero en activos que generen ingresos pasivos como ETFs o REITs.',
          icon: <Car className="h-4 w-4" />,
          difficulty: 'fácil'
        });
      }
    } else if (asset.category === 'collectibles') {
      recommendations.push({
        asset,
        suggestion: `${userName}, tus coleccionables podrían trabajar para ti`,
        strategy: 'Considera exhibirlos en museos por una tarifa, alquilarlos para eventos o producciones, o fraccionarlos para venta parcial si tienen alto valor.',
        icon: <Gem className="h-4 w-4" />,
        difficulty: 'avanzado'
      });
    } else if (asset.category === 'bank_accounts') {
      const value = asset.current_value;
      if (value > 5000) {
        if (riskLevel === 'conservative') {
          recommendations.push({
            asset,
            suggestion: `${userName}, tu efectivo podría generar intereses`,
            strategy: 'Mueve parte de este dinero a una cuenta de ahorro de alto rendimiento (HISA) o GICs. Obtendrás 4-5% anual sin riesgo.',
            icon: <DollarSign className="h-4 w-4" />,
            difficulty: 'fácil'
          });
        } else {
          recommendations.push({
            asset,
            suggestion: `${userName}, tienes efectivo que no está trabajando`,
            strategy: 'Considera invertir el excedente en ETFs de dividendos o índices. Mantén solo 3-6 meses de gastos como emergencia.',
            icon: <TrendingUp className="h-4 w-4" />,
            difficulty: 'moderado'
          });
        }
      }
    } else if (asset.category === 'other') {
      recommendations.push({
        asset,
        suggestion: `${userName}, evalúa si "${asset.name}" puede generar valor`,
        strategy: 'Pregúntate: ¿Puedo rentarlo? ¿Puedo usarlo para crear un negocio? ¿Genera flujo de efectivo? Si no, considera venderlo e invertir.',
        icon: <Lightbulb className="h-4 w-4" />,
        difficulty: 'moderado'
      });
    }
  });

  // Add general recommendation if no specific ones
  if (recommendations.length === 0 && nonProductiveAssets.length > 0) {
    recommendations.push({
      asset: nonProductiveAssets[0],
      suggestion: `${userName}, convierte tus activos en generadores de ingresos`,
      strategy: 'Robert Kiyosaki dice: "Los ricos adquieren activos que generan ingresos. Los pobres y clase media adquieren pasivos pensando que son activos." Evalúa cada posesión preguntándote: ¿Esto pone dinero en mi bolsillo?',
      icon: <Sparkles className="h-4 w-4" />,
      difficulty: 'moderado'
    });
  }

  return recommendations;
};

// Conversion status helpers
const CONVERSION_MARKERS = {
  IN_PROGRESS: '[EN CONVERSIÓN',
  COMPLETED: '[CONVERTIDO',
  GENERATES_INCOME: '[GENERA INGRESOS'
};

interface ConversionInfo {
  status: 'none' | 'in_progress' | 'completed' | 'productive';
  startDate?: Date;
  completedDate?: Date;
  elapsedDays?: number;
}

const parseConversionInfo = (asset: Asset): ConversionInfo => {
  const notes = asset.notes || '';
  
  // Match patterns like [EN CONVERSIÓN:2024-12-12] or [GENERA INGRESOS:2024-12-12]
  const inProgressMatch = notes.match(/\[EN CONVERSIÓN:(\d{4}-\d{2}-\d{2})\]/i);
  const completedMatch = notes.match(/\[GENERA INGRESOS:(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})\]/i);
  const legacyCompleted = notes.match(/\[GENERA INGRESOS\]/i) || notes.match(/\[CONVERTIDO\]/i);
  
  if (completedMatch) {
    const startDate = new Date(completedMatch[1]);
    const completedDate = new Date(completedMatch[2]);
    const elapsedDays = Math.floor((completedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return { status: 'productive', startDate, completedDate, elapsedDays };
  }
  
  if (legacyCompleted && !completedMatch) {
    return { status: 'productive' };
  }
  
  if (inProgressMatch) {
    const startDate = new Date(inProgressMatch[1]);
    const now = new Date();
    const elapsedDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return { status: 'in_progress', startDate, elapsedDays };
  }
  
  // Legacy pattern without date
  if (notes.toUpperCase().includes('[EN CONVERSIÓN]')) {
    return { status: 'in_progress' };
  }
  
  return { status: 'none' };
};

const getConversionStatus = (asset: Asset): 'none' | 'in_progress' | 'completed' | 'productive' => {
  return parseConversionInfo(asset).status;
};

export function AssetsList({ assets, onAdd, onEdit }: AssetsListProps) {
  const deleteAsset = useDeleteAsset();
  const updateAsset = useUpdateAsset();
  const { data: financialProfile } = useFinancialProfile();
  const { data: userProfile } = useProfile();

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
    const notes = asset.notes?.toLowerCase() || '';
    // Check if notes indicate it generates income
    if (notes.includes('[genera ingresos]') || notes.includes('[convertido]')) return true;
    if (notes.includes('ingreso') || notes.includes('renta') || notes.includes('dividendo')) return true;
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

  // Handle conversion status toggle
  const handleStartConversion = (asset: Asset) => {
    const currentNotes = asset.notes || '';
    const today = new Date().toISOString().split('T')[0];
    // Remove any old conversion markers first
    const cleanNotes = currentNotes
      .replace(/\[EN CONVERSIÓN[:\d-]*\]\s*/gi, '')
      .replace(/\[GENERA INGRESOS[:\d-]*\]\s*/gi, '')
      .replace(/\[CONVERTIDO[:\d-]*\]\s*/gi, '');
    const newNotes = `[EN CONVERSIÓN:${today}] ${cleanNotes}`.trim();
    updateAsset.mutate({ id: asset.id, notes: newNotes });
  };

  const handleCompleteConversion = (asset: Asset) => {
    let currentNotes = asset.notes || '';
    const today = new Date().toISOString().split('T')[0];
    
    // Extract start date from in-progress marker
    const startMatch = currentNotes.match(/\[EN CONVERSIÓN:(\d{4}-\d{2}-\d{2})\]/i);
    const startDate = startMatch ? startMatch[1] : today;
    
    // Remove old markers
    const cleanNotes = currentNotes
      .replace(/\[EN CONVERSIÓN[:\d-]*\]\s*/gi, '')
      .replace(/\[GENERA INGRESOS[:\d-]*\]\s*/gi, '')
      .replace(/\[CONVERTIDO[:\d-]*\]\s*/gi, '');
    
    const newNotes = `[GENERA INGRESOS:${startDate}:${today}] ${cleanNotes}`.trim();
    updateAsset.mutate({ id: asset.id, notes: newNotes });
  };

  const handleCancelConversion = (asset: Asset) => {
    let currentNotes = asset.notes || '';
    // Remove all conversion markers
    currentNotes = currentNotes
      .replace(/\[EN CONVERSIÓN[:\d-]*\]\s*/gi, '')
      .replace(/\[GENERA INGRESOS[:\d-]*\]\s*/gi, '')
      .replace(/\[CONVERTIDO[:\d-]*\]\s*/gi, '');
    updateAsset.mutate({ id: asset.id, notes: currentNotes.trim() });
  };

  // Count assets in conversion and converted
  const assetsInConversion = assets.filter(a => getConversionStatus(a) === 'in_progress');
  const convertedAssets = assets.filter(a => {
    const info = parseConversionInfo(a);
    return info.status === 'productive' && info.startDate; // Only those with conversion history
  });

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

            {/* Conversion Progress */}
            {assetsInConversion.length > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm">
                <RotateCw className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="text-blue-600 dark:text-blue-400">
                  <strong>{assetsInConversion.length}</strong> activo{assetsInConversion.length > 1 ? 's' : ''} en proceso de conversión a productivo
                </span>
                <span className="text-xs text-blue-500/70 ml-auto">
                  ({assetsInConversion.map(a => a.name).join(', ')})
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
              const conversionStatus = getConversionStatus(asset);
              const isConverting = conversionStatus === 'in_progress';

              return (
                <div
                  key={asset.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isConverting
                      ? 'bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/30 ring-1 ring-blue-500/20'
                      : hasDepreciated 
                        ? 'bg-red-500/5 hover:bg-red-500/10 border border-red-500/20' 
                        : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full relative ${
                      isConverting
                        ? 'bg-blue-500/10'
                        : category.group === 'crypto' 
                          ? 'bg-amber-500/10' 
                          : productive 
                            ? 'bg-green-500/10' 
                            : 'bg-muted'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${
                        isConverting
                          ? 'text-blue-500'
                          : category.group === 'crypto' 
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
                      {isConverting && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                          <RotateCw className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{asset.name}</span>
                        {isConverting && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30 animate-pulse">
                                <RotateCw className="h-3 w-3 mr-1" />
                                En conversión
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Estás trabajando en convertir este activo en productivo</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
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
                        ) : !isConverting && (
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
                        {depreciating && !productive && !isConverting && (
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
                      {/* Conversion action buttons */}
                      {!productive && !isConverting && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                              onClick={() => handleStartConversion(asset)}
                              disabled={updateAsset.isPending}
                            >
                              <RotateCw className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Iniciar conversión a productivo</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {isConverting && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                onClick={() => handleCompleteConversion(asset)}
                                disabled={updateAsset.isPending}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">¡Marcar como convertido! Ya genera ingresos</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleCancelConversion(asset)}
                                disabled={updateAsset.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Cancelar conversión</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
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

        {/* Conversion History */}
        {(convertedAssets.length > 0 || assetsInConversion.length > 0) && (() => {
          // Calculate conversion statistics
          const totalConversions = convertedAssets.length + assetsInConversion.length;
          const successRate = totalConversions > 0 
            ? Math.round((convertedAssets.length / totalConversions) * 100) 
            : 0;
          
          const completedWithTime = convertedAssets.filter(a => {
            const info = parseConversionInfo(a);
            return info.elapsedDays !== undefined;
          });
          
          const avgConversionDays = completedWithTime.length > 0
            ? Math.round(
                completedWithTime.reduce((sum, a) => {
                  const info = parseConversionInfo(a);
                  return sum + (info.elapsedDays || 0);
                }, 0) / completedWithTime.length
              )
            : 0;
          
          const totalConvertedValue = convertedAssets.reduce((sum, a) => sum + a.current_value, 0);
          const valueInProgress = assetsInConversion.reduce((sum, a) => sum + a.current_value, 0);
          
          return (
          <div className="mt-4 space-y-3">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
                <p className="text-2xl font-bold text-green-600">{successRate}%</p>
                <p className="text-xs text-muted-foreground">Tasa de éxito</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
                <p className="text-2xl font-bold text-blue-600">{avgConversionDays}</p>
                <p className="text-xs text-muted-foreground">Días promedio</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalConvertedValue)}</p>
                <p className="text-xs text-muted-foreground">Valor convertido</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(valueInProgress)}</p>
                <p className="text-xs text-muted-foreground">En conversión</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <RotateCw className="h-4 w-4" />
              <span>Historial de Conversiones</span>
              <Badge variant="outline" className="text-xs">
                {convertedAssets.length} completado{convertedAssets.length !== 1 ? 's' : ''} · {assetsInConversion.length} en progreso
              </Badge>
            </div>

            {/* In Progress */}
            {assetsInConversion.map((asset) => {
              const info = parseConversionInfo(asset);
              const category = getCategoryInfo(asset.category);
              return (
                <div 
                  key={`progress-${asset.id}`}
                  className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-500/10">
                        <RotateCw className="h-4 w-4 text-blue-500 animate-spin" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{category.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {info.startDate && (
                        <>
                          <p className="text-xs text-blue-600">
                            Inicio: {info.startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs font-semibold text-blue-500">
                            {info.elapsedDays} día{info.elapsedDays !== 1 ? 's' : ''} en proceso
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(100, (info.elapsedDays || 0) * 3)} 
                    className="h-1.5 mt-2"
                  />
                </div>
              );
            })}

            {/* Completed Conversions */}
            {convertedAssets.map((asset) => {
              const info = parseConversionInfo(asset);
              const category = getCategoryInfo(asset.category);
              return (
                <div 
                  key={`completed-${asset.id}`}
                  className="p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-500/10">
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm flex items-center gap-2">
                          {asset.name}
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                            <Zap className="h-3 w-3 mr-1" />
                            Convertido
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">{category.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {info.startDate && info.completedDate && (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {info.startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} → {info.completedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs font-semibold text-green-600">
                            Convertido en {info.elapsedDays} día{info.elapsedDays !== 1 ? 's' : ''}
                          </p>
                        </>
                      )}
                      <p className="text-xs text-green-500 font-medium mt-1">
                        {formatCurrency(asset.current_value)} generando ingresos
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          );
        })()}
        {/* Personalized Recommendations */}
        {nonProductiveAssets.length > 0 && (() => {
          const userName = userProfile?.full_name?.split(' ')[0] || 'Amigo';
          const recommendations = generateRecommendations(nonProductiveAssets, financialProfile, userName);
          
          if (recommendations.length === 0) return null;
          
          return (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Lightbulb className="h-4 w-4" />
                <span>Recomendaciones personalizadas para ti</span>
              </div>
              
              {recommendations.slice(0, 3).map((rec, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary mt-0.5">
                      {rec.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{rec.suggestion}</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            rec.difficulty === 'fácil' 
                              ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                              : rec.difficulty === 'moderado'
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                : 'bg-red-500/10 text-red-600 border-red-500/30'
                          }`}
                        >
                          {rec.difficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {rec.strategy}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-primary/70 pt-1">
                        <ArrowRight className="h-3 w-3" />
                        <span>Activo: {rec.asset.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Kiyosaki Quote */}
              <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground italic">
                <p>"Un activo pone dinero en tu bolsillo. Un pasivo saca dinero de tu bolsillo." — Robert Kiyosaki</p>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
