import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { 
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, 
  Lightbulb, Calendar, Sparkles, RefreshCw
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string | null;
}

interface ExpensePredictionsProps {
  expenses: Expense[];
  isLoading?: boolean;
}

interface Prediction {
  month: string;
  predictedTotal: number;
  confidence: number;
  range: { min: number; max: number };
  categoryBreakdown: Record<string, number>;
}

interface Insight {
  type: 'trend' | 'seasonal' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

interface PredictionResult {
  predictions: Prediction[];
  insights: Insight[];
  summary: {
    trend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
    riskLevel: 'low' | 'medium' | 'high';
    expectedSavings: number | null;
  };
}

export function ExpensePredictions({ expenses, isLoading }: ExpensePredictionsProps) {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Prepare historical data (last 6 months)
  const historicalData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    const now = new Date();
    const monthlyData: Record<string, { total: number; categories: Record<string, number> }> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const key = format(monthDate, 'yyyy-MM');
      monthlyData[key] = { total: 0, categories: {} };
    }

    // Aggregate expenses
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const key = format(expenseDate, 'yyyy-MM');
      
      if (monthlyData[key]) {
        monthlyData[key].total += expense.amount;
        const category = expense.category || 'other';
        monthlyData[key].categories[category] = 
          (monthlyData[key].categories[category] || 0) + expense.amount;
      }
    });

    return Object.entries(monthlyData).map(([key, data]) => ({
      month: format(new Date(key + '-01'), 'MMMM yyyy', { locale: language === 'es' ? es : enUS }),
      ...data
    }));
  }, [expenses, language]);

  // Chart data combining historical and predictions
  const chartData = useMemo(() => {
    const historical = historicalData.map(m => ({
      month: m.month.split(' ')[0], // Just month name
      actual: m.total,
      predicted: null as number | null,
      min: null as number | null,
      max: null as number | null
    }));

    if (predictions) {
      predictions.predictions.forEach(p => {
        historical.push({
          month: p.month,
          actual: null,
          predicted: p.predictedTotal,
          min: p.range.min,
          max: p.range.max
        });
      });
    }

    return historical;
  }, [historicalData, predictions]);

  const generatePredictions = async () => {
    if (historicalData.length < 3) {
      toast({
        title: language === 'es' ? 'Datos insuficientes' : 'Insufficient data',
        description: language === 'es' 
          ? 'Necesitas al menos 3 meses de datos para generar predicciones.'
          : 'You need at least 3 months of data to generate predictions.',
        variant: 'destructive'
      });
      return;
    }

    setIsPredicting(true);
    try {
      const { data, error } = await supabase.functions.invoke('predict-expenses', {
        body: { historicalData, language }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setPredictions(data);
      toast({
        title: language === 'es' ? 'Predicciones generadas' : 'Predictions generated',
        description: language === 'es'
          ? 'El análisis de IA se completó exitosamente.'
          : 'AI analysis completed successfully.'
      });
    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsPredicting(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'seasonal': return <Calendar className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>
              {language === 'es' ? 'Predicciones de Gastos con IA' : 'AI Expense Predictions'}
            </CardTitle>
          </div>
          <Button 
            onClick={generatePredictions} 
            disabled={isPredicting || historicalData.length < 3}
            size="sm"
          >
            {isPredicting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {isPredicting 
              ? (language === 'es' ? 'Analizando...' : 'Analyzing...') 
              : (language === 'es' ? 'Generar Predicciones' : 'Generate Predictions')}
          </Button>
        </div>
        <CardDescription>
          {language === 'es' 
            ? 'Estimaciones de gastos futuros basadas en patrones históricos usando inteligencia artificial' 
            : 'Future expense estimates based on historical patterns using artificial intelligence'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value?.toFixed(2) || '0'}`, '']}
                labelFormatter={(label) => label}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              
              {/* Prediction range area */}
              {predictions && (
                <Area
                  type="monotone"
                  dataKey="max"
                  stroke="none"
                  fill="hsl(var(--primary) / 0.1)"
                  name={language === 'es' ? 'Rango máximo' : 'Max range'}
                />
              )}
              
              {/* Actual expenses */}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.3)"
                strokeWidth={2}
                name={language === 'es' ? 'Gastos reales' : 'Actual expenses'}
                connectNulls={false}
              />
              
              {/* Predicted expenses */}
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--chart-2))"
                fill="hsl(var(--chart-2) / 0.3)"
                strokeWidth={2}
                strokeDasharray="5 5"
                name={language === 'es' ? 'Predicción' : 'Prediction'}
                connectNulls={false}
              />
              
              {/* Today reference line */}
              {predictions && (
                <ReferenceLine
                  x={chartData[historicalData.length - 1]?.month}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  label={{ 
                    value: language === 'es' ? 'Hoy' : 'Today', 
                    position: 'top',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 11
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Predictions summary */}
        {predictions && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  {getTrendIcon(predictions.summary.trend)}
                  <span>{language === 'es' ? 'Tendencia' : 'Trend'}</span>
                </div>
                <p className="text-lg font-semibold capitalize">
                  {predictions.summary.trend === 'increasing' 
                    ? (language === 'es' ? 'Aumentando' : 'Increasing')
                    : predictions.summary.trend === 'decreasing'
                    ? (language === 'es' ? 'Disminuyendo' : 'Decreasing')
                    : (language === 'es' ? 'Estable' : 'Stable')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {predictions.summary.trendPercentage > 0 ? '+' : ''}
                  {predictions.summary.trendPercentage.toFixed(1)}%
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{language === 'es' ? 'Nivel de Riesgo' : 'Risk Level'}</span>
                </div>
                <p className={`text-lg font-semibold capitalize ${getRiskColor(predictions.summary.riskLevel)}`}>
                  {predictions.summary.riskLevel === 'high'
                    ? (language === 'es' ? 'Alto' : 'High')
                    : predictions.summary.riskLevel === 'medium'
                    ? (language === 'es' ? 'Medio' : 'Medium')
                    : (language === 'es' ? 'Bajo' : 'Low')}
                </p>
              </Card>

              {predictions.predictions[0] && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>{language === 'es' ? 'Próximo Mes' : 'Next Month'}</span>
                  </div>
                  <p className="text-lg font-semibold">
                    ${predictions.predictions[0].predictedTotal.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(predictions.predictions[0].confidence * 100).toFixed(0)}% 
                    {language === 'es' ? ' confianza' : ' confidence'}
                  </p>
                </Card>
              )}

              {predictions.predictions[2] && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{language === 'es' ? 'En 3 Meses' : 'In 3 Months'}</span>
                  </div>
                  <p className="text-lg font-semibold">
                    ${predictions.predictions[2].predictedTotal.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Rango: ' : 'Range: '}
                    ${predictions.predictions[2].range.min.toFixed(0)} - ${predictions.predictions[2].range.max.toFixed(0)}
                  </p>
                </Card>
              )}
            </div>

            {/* Insights */}
            {predictions.insights && predictions.insights.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  {language === 'es' ? 'Insights del Análisis' : 'Analysis Insights'}
                </h4>
                <div className="grid gap-3">
                  {predictions.insights.map((insight, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="mt-0.5 text-primary">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{insight.title}</span>
                          <Badge variant={getImpactColor(insight.impact) as any}>
                            {insight.impact === 'high' 
                              ? (language === 'es' ? 'Alto impacto' : 'High impact')
                              : insight.impact === 'medium'
                              ? (language === 'es' ? 'Impacto medio' : 'Medium impact')
                              : (language === 'es' ? 'Bajo impacto' : 'Low impact')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!predictions && !isPredicting && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">
              {language === 'es' 
                ? 'Haz clic en "Generar Predicciones" para analizar tus patrones de gasto'
                : 'Click "Generate Predictions" to analyze your spending patterns'}
            </p>
            <p className="text-sm">
              {language === 'es'
                ? `Datos históricos disponibles: ${historicalData.length} meses`
                : `Historical data available: ${historicalData.length} months`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
