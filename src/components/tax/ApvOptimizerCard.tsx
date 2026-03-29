import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, PiggyBank, Wallet, Info, RefreshCw } from 'lucide-react';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';
import { useApvOptimizer } from '@/hooks/data/useApvOptimizer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ApvOptimizerCard() {
  const { isAnalyzing, result, error, analyzeOptimalContributions, clearResult } = useApvOptimizer();
  const { t } = useLanguage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'regimen_a': return 'Régimen A (Deducción)';
      case 'regimen_b': return 'Régimen B (Bonificación)';
      case 'cuenta2': return 'Cuenta 2 AFP';
      case 'mixed': return 'Estrategia Mixta';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'regimen_a': return 'text-blue-600 bg-blue-100';
      case 'regimen_b': return 'text-green-600 bg-green-100';
      case 'cuenta2': return 'text-purple-600 bg-purple-100';
      case 'mixed': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (result) {
    const { recommendations, taxInfo } = result;
    const totalRecommended = recommendations.apvRegimenA.recommended + 
                             recommendations.apvRegimenB.recommended + 
                             recommendations.cuenta2.recommended;

    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Optimizador APV Chile</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={clearResult}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Recalcular
            </Button>
          </div>
          <CardDescription>
            Recomendación basada en normativa SII 2024
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Priority Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Estrategia recomendada:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendations.priority)}`}>
              {getPriorityLabel(recommendations.priority)}
            </span>
          </div>

          {/* Strategy Explanation */}
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {recommendations.strategy}
          </p>

          {/* Recommendations Grid */}
          <div className="grid gap-3">
            {/* APV Régimen A */}
            {recommendations.apvRegimenA.recommended > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-medium text-sm">APV Régimen A</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Reduce tu base imponible. Pagas impuesto al retirar.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(recommendations.apvRegimenA.recommended)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{recommendations.apvRegimenA.reasoning}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  Ahorro fiscal: {formatCurrency(recommendations.apvRegimenA.taxBenefit)}/año
                </div>
              </div>
            )}

            {/* APV Régimen B */}
            {recommendations.apvRegimenB.recommended > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium text-sm">APV Régimen B</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Estado bonifica 15%. Retiro sin impuesto adicional.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(recommendations.apvRegimenB.recommended)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{recommendations.apvRegimenB.reasoning}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  Bonificación estatal: {formatCurrency(recommendations.apvRegimenB.taxBenefit)}/año
                </div>
              </div>
            )}

            {/* Cuenta 2 */}
            {recommendations.cuenta2.recommended > 0 && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="font-medium text-sm">Cuenta 2 AFP</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Ahorro voluntario con liquidez. Retiro en 4 días hábiles.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    {formatCurrency(recommendations.cuenta2.recommended)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{recommendations.cuenta2.reasoning}</p>
              </div>
            )}
          </div>

          {/* Tax Info Summary */}
          <div className="pt-3 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tasa marginal:</span>
              <span className="font-medium">{(taxInfo.marginalRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Límite APV anual:</span>
              <span className="font-medium">600 UF (~{formatCurrency(taxInfo.apvLimitCLP)})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total recomendado/año:</span>
              <span className="font-bold text-primary">{formatCurrency(totalRecommended)}</span>
            </div>
          </div>

          {/* Projections */}
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Proyección de crecimiento (5% real anual):</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-xs text-muted-foreground">1 año</p>
                <p className="font-medium text-sm">{formatCurrency(recommendations.projections.year1)}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-xs text-muted-foreground">5 años</p>
                <p className="font-medium text-sm">{formatCurrency(recommendations.projections.year5)}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-xs text-muted-foreground">10 años</p>
                <p className="font-medium text-sm">{formatCurrency(recommendations.projections.year10)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">Optimizador APV Chile</CardTitle>
        </div>
        <CardDescription>
          Analiza tus opciones de ahorro previsional voluntario según normativa SII
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
            {error}
          </div>
        )}
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span>APV Régimen A: Deduce de base imponible</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PiggyBank className="h-4 w-4" />
            <span>APV Régimen B: 15% bonificación estatal</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Cuenta 2 AFP: Ahorro con liquidez</span>
          </div>
        </div>

        <Button 
          onClick={analyzeOptimalContributions} 
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analizando opciones...
            </>
          ) : (
            <>
              <PiggyBank className="h-4 w-4 mr-2" />
              Analizar Ahorro Óptimo
            </>
          )}
        </Button>
        <LegalDisclaimer variant="tax" size="compact" showLearnMore={false} className="mt-4" />
      </CardContent>
    </Card>
  );
}
