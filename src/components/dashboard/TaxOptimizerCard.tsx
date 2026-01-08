import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Loader2,
  DollarSign,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { useTaxOptimizer } from '@/hooks/data/useTaxOptimizer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaxInfoVersionBadge } from '@/components/tax-calendar/TaxInfoVersionBadge';
import type { CountryCode } from '@/lib/constants/country-tax-config';

export const TaxOptimizerCard = memo(function TaxOptimizerCard() {
  const { t } = useLanguage();
  const { data: profile } = useProfile();
  const { isAnalyzing, result, error, analyzeAndOptimize, clearResult } = useTaxOptimizer();
  const country = (profile?.country || 'CA') as CountryCode;
  const isCL = country === 'CL';

  const getInsightIcon = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getInsightBadgeVariant = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {isCL ? 'Optimizador de Impuestos IA' : 'AI Tax Optimizer'}
              </CardTitle>
              <CardDescription>
                {isCL 
                  ? 'Análisis inteligente para maximizar deducciones SII'
                  : 'Smart analysis to maximize CRA deductions'
                }
              </CardDescription>
            </div>
          </div>
          <TaxInfoVersionBadge country={country} compact />
          {result && (
            <Button variant="ghost" size="sm" onClick={clearResult}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Nuevo análisis
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && !isAnalyzing && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                EvoFinz analizará tus gastos y perfil fiscal para encontrar oportunidades de ahorro.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Análisis según tu tipo de trabajo</li>
                <li>✓ Deducciones que podrías estar perdiendo</li>
                <li>✓ Estrategias personalizadas para CRA</li>
              </ul>
            </div>
            <Button 
              onClick={analyzeAndOptimize} 
              className="gap-2"
              disabled={isAnalyzing}
            >
              <Sparkles className="h-4 w-4" />
              Analizar mis impuestos
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <div className="space-y-1">
              <p className="font-medium">Analizando tu situación fiscal...</p>
              <p className="text-sm text-muted-foreground">
                Revisando gastos, categorías y oportunidades de deducción
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-6 space-y-3">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={analyzeAndOptimize}>
              Reintentar
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Deducible</span>
                </div>
                <p className="text-xl font-bold text-primary">
                  ${result.summary.totalDeductible.toLocaleString('es-CA', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Ahorro Estimado</span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  ${result.summary.potentialSavings.toLocaleString('es-CA', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Deduction Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tasa de Deducción</span>
                <span className="font-medium">{result.summary.deductionRate.toFixed(1)}%</span>
              </div>
              <Progress value={result.summary.deductionRate} className="h-2" />
            </div>

            {/* Quick Insights */}
            {result.quickInsights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Insights Rápidos</h4>
                <div className="space-y-2">
                  {result.quickInsights.map((insight, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-lg bg-muted/30"
                    >
                      {getInsightIcon(insight.type)}
                      <p className="text-sm">{insight.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Suggestions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Recomendaciones de IA
              </h4>
              <ScrollArea className="h-[300px] rounded-lg border p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {result.suggestions.split('\n').map((line, idx) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <h5 key={idx} className="font-semibold text-primary mt-4 mb-2">
                          {line.replace(/\*\*/g, '')}
                        </h5>
                      );
                    }
                    if (line.startsWith('- ') || line.startsWith('• ')) {
                      return (
                        <p key={idx} className="ml-4 my-1 text-sm">
                          {line}
                        </p>
                      );
                    }
                    if (line.trim()) {
                      return (
                        <p key={idx} className="my-2 text-sm">
                          {line}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
