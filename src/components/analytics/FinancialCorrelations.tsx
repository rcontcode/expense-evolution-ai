import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, parseISO, startOfMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MonthlyData {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
}

export function FinancialCorrelations() {
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();

  const { monthlyData, correlation, trendline, insights } = useMemo(() => {
    const monthMap = new Map<string, MonthlyData>();

    // Aggregate by month
    income?.forEach(inc => {
      const date = parseISO(inc.date);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM yy', { locale });
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { 
          month: monthKey, 
          monthLabel,
          income: 0, 
          expenses: 0, 
          savings: 0, 
          savingsRate: 0 
        });
      }
      monthMap.get(monthKey)!.income += inc.amount;
    });

    expenses?.forEach(expense => {
      const date = parseISO(expense.date);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM yy', { locale });
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { 
          month: monthKey, 
          monthLabel,
          income: 0, 
          expenses: 0, 
          savings: 0, 
          savingsRate: 0 
        });
      }
      monthMap.get(monthKey)!.expenses += expense.amount;
    });

    // Calculate savings
    monthMap.forEach(data => {
      data.savings = data.income - data.expenses;
      data.savingsRate = data.income > 0 ? (data.savings / data.income) * 100 : 0;
    });

    const dataPoints = Array.from(monthMap.values())
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate Pearson correlation coefficient
    const n = dataPoints.length;
    if (n < 2) {
      return { 
        monthlyData: dataPoints, 
        correlation: 0, 
        trendline: { slope: 0, intercept: 0 },
        insights: []
      };
    }

    const sumX = dataPoints.reduce((sum, d) => sum + d.income, 0);
    const sumY = dataPoints.reduce((sum, d) => sum + d.expenses, 0);
    const sumXY = dataPoints.reduce((sum, d) => sum + d.income * d.expenses, 0);
    const sumX2 = dataPoints.reduce((sum, d) => sum + d.income * d.income, 0);
    const sumY2 = dataPoints.reduce((sum, d) => sum + d.expenses * d.expenses, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const r = denominator !== 0 ? numerator / denominator : 0;

    // Calculate linear regression (trendline)
    const meanX = sumX / n;
    const meanY = sumY / n;
    const slope = denominator !== 0 ? numerator / (n * sumX2 - sumX * sumX) : 0;
    const intercept = meanY - slope * meanX;

    // Generate insights
    const generatedInsights: { type: 'positive' | 'negative' | 'neutral'; message: string }[] = [];
    
    const avgSavingsRate = dataPoints.reduce((sum, d) => sum + d.savingsRate, 0) / n;
    
    if (r > 0.7) {
      generatedInsights.push({
        type: 'neutral',
        message: language === 'es' 
          ? 'Tus gastos aumentan proporcionalmente con tus ingresos (correlación fuerte)' 
          : 'Your expenses increase proportionally with your income (strong correlation)'
      });
    } else if (r < 0.3) {
      generatedInsights.push({
        type: 'positive',
        message: language === 'es'
          ? 'Tus gastos son relativamente estables independientemente de tus ingresos'
          : 'Your expenses are relatively stable regardless of your income'
      });
    }

    if (avgSavingsRate >= 20) {
      generatedInsights.push({
        type: 'positive',
        message: language === 'es'
          ? `Excelente tasa de ahorro promedio: ${avgSavingsRate.toFixed(1)}%`
          : `Excellent average savings rate: ${avgSavingsRate.toFixed(1)}%`
      });
    } else if (avgSavingsRate >= 0) {
      generatedInsights.push({
        type: 'neutral',
        message: language === 'es'
          ? `Tasa de ahorro promedio: ${avgSavingsRate.toFixed(1)}%. Considera aumentarla.`
          : `Average savings rate: ${avgSavingsRate.toFixed(1)}%. Consider increasing it.`
      });
    } else {
      generatedInsights.push({
        type: 'negative',
        message: language === 'es'
          ? `Estás gastando más de lo que ganas en promedio`
          : `You're spending more than you earn on average`
      });
    }

    // Check if expenses exceed income trend
    if (slope > 1) {
      generatedInsights.push({
        type: 'negative',
        message: language === 'es'
          ? 'Por cada $1 adicional de ingreso, tus gastos aumentan más de $1'
          : 'For every $1 of additional income, your expenses increase by more than $1'
      });
    } else if (slope > 0 && slope < 0.5) {
      generatedInsights.push({
        type: 'positive',
        message: language === 'es'
          ? 'Buen control de gastos: por cada $1 de ingreso extra, solo gastas $' + slope.toFixed(2)
          : 'Good expense control: for every $1 of extra income, you only spend $' + slope.toFixed(2)
      });
    }

    return { 
      monthlyData: dataPoints, 
      correlation: r, 
      trendline: { slope, intercept },
      insights: generatedInsights
    };
  }, [expenses, income, language, locale]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getCorrelationStrength = (r: number) => {
    const absR = Math.abs(r);
    if (absR >= 0.7) return { label: language === 'es' ? 'Fuerte' : 'Strong', color: 'text-amber-600' };
    if (absR >= 0.4) return { label: language === 'es' ? 'Moderada' : 'Moderate', color: 'text-blue-600' };
    return { label: language === 'es' ? 'Débil' : 'Weak', color: 'text-emerald-600' };
  };

  const correlationInfo = getCorrelationStrength(correlation);

  // Generate trendline points
  const minIncome = Math.min(...monthlyData.map(d => d.income), 0);
  const maxIncome = Math.max(...monthlyData.map(d => d.income), 1);
  const trendlineData = [
    { income: minIncome, expenses: trendline.slope * minIncome + trendline.intercept },
    { income: maxIncome, expenses: trendline.slope * maxIncome + trendline.intercept }
  ];

  if (monthlyData.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {language === 'es' ? 'Correlaciones Financieras' : 'Financial Correlations'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {language === 'es' 
              ? 'Se necesitan al menos 2 meses de datos para analizar correlaciones'
              : 'At least 2 months of data needed to analyze correlations'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {language === 'es' ? 'Correlaciones Financieras' : 'Financial Correlations'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Correlation Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Coeficiente r' : 'Coefficient r'}</p>
            <p className={`text-xl font-bold ${correlationInfo.color}`}>{correlation.toFixed(3)}</p>
            <p className="text-xs text-muted-foreground">{correlationInfo.label}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">R²</p>
            <p className="text-xl font-bold">{(correlation * correlation * 100).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Varianza explicada' : 'Variance explained'}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Pendiente' : 'Slope'}</p>
            <p className="text-xl font-bold">{trendline.slope.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Gasto por $1 ingreso' : 'Expense per $1 income'}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Meses analizados' : 'Months analyzed'}</p>
            <p className="text-xl font-bold">{monthlyData.length}</p>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div 
                key={idx}
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  insight.type === 'positive' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                  insight.type === 'negative' ? 'bg-red-500/10 border border-red-500/30' :
                  'bg-blue-500/10 border border-blue-500/30'
                }`}
              >
                {insight.type === 'positive' && <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />}
                {insight.type === 'negative' && <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                {insight.type === 'neutral' && <Info className="h-4 w-4 text-blue-600 mt-0.5" />}
                <span className="text-sm">{insight.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Scatter Plot */}
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number" 
                dataKey="income" 
                name={language === 'es' ? 'Ingresos' : 'Income'}
                tickFormatter={(value) => formatCurrency(value)}
                label={{ 
                  value: language === 'es' ? 'Ingresos Mensuales' : 'Monthly Income', 
                  position: 'bottom',
                  offset: 40
                }}
                className="text-xs"
              />
              <YAxis 
                type="number" 
                dataKey="expenses" 
                name={language === 'es' ? 'Gastos' : 'Expenses'}
                tickFormatter={(value) => formatCurrency(value)}
                label={{ 
                  value: language === 'es' ? 'Gastos Mensuales' : 'Monthly Expenses', 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: -45
                }}
                className="text-xs"
              />
              <ZAxis range={[100, 100]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as MonthlyData;
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">{data.monthLabel}</p>
                        <p className="text-sm text-emerald-600">
                          {language === 'es' ? 'Ingresos' : 'Income'}: {formatCurrency(data.income)}
                        </p>
                        <p className="text-sm text-red-600">
                          {language === 'es' ? 'Gastos' : 'Expenses'}: {formatCurrency(data.expenses)}
                        </p>
                        <p className={`text-sm font-medium ${data.savings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {language === 'es' ? 'Ahorro' : 'Savings'}: {formatCurrency(data.savings)} ({data.savingsRate.toFixed(1)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              
              {/* Trend line */}
              <Scatter
                name={language === 'es' ? 'Tendencia' : 'Trend'}
                data={trendlineData}
                fill="none"
                line={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5 5' }}
                shape={() => null}
              />
              
              {/* Data points */}
              <Scatter
                name={language === 'es' ? 'Datos mensuales' : 'Monthly data'}
                data={monthlyData}
                fill="hsl(var(--primary))"
              />
              
              {/* Break-even line (income = expenses) */}
              <ReferenceLine 
                segment={[
                  { x: minIncome, y: minIncome },
                  { x: maxIncome, y: maxIncome }
                ]}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                label={{ 
                  value: language === 'es' ? 'Equilibrio' : 'Break-even',
                  position: 'insideBottomRight'
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Legend explanation */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-primary" style={{ borderStyle: 'dashed' }}></div>
            {language === 'es' ? 'Línea de tendencia' : 'Trend line'}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-muted-foreground" style={{ borderStyle: 'dashed' }}></div>
            {language === 'es' ? 'Línea de equilibrio (ingreso = gasto)' : 'Break-even line (income = expense)'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
