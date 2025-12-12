import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  PiggyBank, 
  TrendingUp, 
  Calculator, 
  Sparkles, 
  ChevronRight,
  Wallet,
  Target,
  ArrowUpRight,
  Info,
  Loader2
} from 'lucide-react';
import { useRrspTfsaOptimizer } from '@/hooks/data/useRrspTfsaOptimizer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function RrspTfsaOptimizerCard() {
  const { isAnalyzing, result, error, analyzeOptimalContributions, clearResult } = useRrspTfsaOptimizer();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'rrsp': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'tfsa': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'rrsp': return 'Priorizar RRSP';
      case 'tfsa': return 'Priorizar TFSA';
      default: return 'Estrategia Balanceada';
    }
  };

  if (!result) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            Optimizador TFSA/RRSP
          </CardTitle>
          <CardDescription>
            Analiza tu situación fiscal y obtén recomendaciones personalizadas para maximizar tus contribuciones a TFSA y RRSP según tu ingreso y provincia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Wallet className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium">TFSA</p>
                  <p className="text-xs text-muted-foreground">Crecimiento libre de impuestos</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Target className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium">RRSP</p>
                  <p className="text-xs text-muted-foreground">Reducción fiscal inmediata</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button 
              onClick={analyzeOptimalContributions} 
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analizar Opciones Óptimas
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { recommendations, taxInfo } = result;
  const totalRecommended = recommendations.tfsa.recommended + recommendations.rrsp.recommended;
  const totalTaxSavings = recommendations.tfsa.taxSavings + recommendations.rrsp.taxSavings;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              Tu Plan de Ahorro Óptimo
            </CardTitle>
            <CardDescription>
              Recomendaciones personalizadas basadas en tu situación fiscal
            </CardDescription>
          </div>
          <Badge className={getPriorityColor(recommendations.priority)}>
            {getPriorityLabel(recommendations.priority)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strategy Summary */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-sm">{recommendations.strategy}</p>
        </div>

        {/* Tax Rates Info */}
        <div className="grid grid-cols-3 gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-3 rounded-lg bg-muted/50 cursor-help">
                  <p className="text-xs text-muted-foreground">Federal</p>
                  <p className="text-lg font-bold">{formatPercent(taxInfo.marginalRates.federal)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tu tasa marginal federal actual</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-3 rounded-lg bg-muted/50 cursor-help">
                  <p className="text-xs text-muted-foreground">Provincial</p>
                  <p className="text-lg font-bold">{formatPercent(taxInfo.marginalRates.provincial)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tu tasa marginal provincial</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-3 rounded-lg bg-primary/10 cursor-help">
                  <p className="text-xs text-muted-foreground">Combinada</p>
                  <p className="text-lg font-bold text-primary">{formatPercent(taxInfo.marginalRates.combined)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tu tasa marginal total (federal + provincial)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Separator />

        {/* TFSA Recommendation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-green-500/10">
                <Wallet className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">TFSA</p>
                <p className="text-xs text-muted-foreground">Tax-Free Savings Account</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(recommendations.tfsa.recommended)}
              </p>
              <p className="text-xs text-muted-foreground">
                Límite: {formatCurrency(taxInfo.tfsaLimit)}
              </p>
            </div>
          </div>
          
          <Progress 
            value={(recommendations.tfsa.recommended / taxInfo.tfsaLimit) * 100} 
            className="h-2"
          />
          
          <p className="text-sm text-muted-foreground">
            {recommendations.tfsa.reasoning}
          </p>
        </div>

        {/* RRSP Recommendation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">RRSP</p>
                <p className="text-xs text-muted-foreground">Registered Retirement Savings Plan</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(recommendations.rrsp.recommended)}
              </p>
              <p className="text-xs text-muted-foreground">
                Espacio: {formatCurrency(taxInfo.rrspRoom)}
              </p>
            </div>
          </div>
          
          <Progress 
            value={taxInfo.rrspRoom > 0 ? (recommendations.rrsp.recommended / taxInfo.rrspRoom) * 100 : 0} 
            className="h-2"
          />
          
          <p className="text-sm text-muted-foreground">
            {recommendations.rrsp.reasoning}
          </p>
        </div>

        <Separator />

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Recomendado Anual</p>
            <p className="text-2xl font-bold">{formatCurrency(totalRecommended)}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalRecommended / 12)}/mes
            </p>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 text-center">
            <p className="text-xs text-muted-foreground mb-1">Ahorro Fiscal Estimado</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalTaxSavings)}</p>
            <p className="text-xs text-muted-foreground">
              en tu próxima declaración
            </p>
          </div>
        </div>

        {/* Projections */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="font-medium text-sm">Proyección de Crecimiento</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Basado en 7% de retorno anual promedio</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">1 Año</p>
              <p className="font-bold">{formatCurrency(recommendations.projections.year1)}</p>
            </div>
            <div className="text-center p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">5 Años</p>
              <p className="font-bold">{formatCurrency(recommendations.projections.year5)}</p>
            </div>
            <div className="text-center p-3 rounded-lg border bg-primary/5">
              <p className="text-xs text-muted-foreground">10 Años</p>
              <p className="font-bold text-primary">{formatCurrency(recommendations.projections.year10)}</p>
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={clearResult} className="w-full">
          <Calculator className="mr-2 h-4 w-4" />
          Recalcular con Nuevos Datos
        </Button>
      </CardContent>
    </Card>
  );
}
