import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { PiggyBank, Target, TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const translations = {
  es: {
    title: 'Tendencia de Ahorro',
    description: 'Evolución de tu tasa de ahorro mensual',
    savingsRate: 'Tasa de ahorro',
    targetRate: 'Meta recomendada',
    currentRate: 'Tasa actual',
    avgRate: 'Promedio',
    trend: 'Tendencia',
    improving: 'Mejorando',
    declining: 'Decreciendo',
    stable: 'Estable',
    excellent: 'Excelente',
    good: 'Buena',
    moderate: 'Moderada',
    low: 'Baja',
    negative: 'Negativa',
    tips: {
      excellent: '¡Fantástico! Estás ahorrando más del 30%. Considera invertir el excedente.',
      good: 'Buen trabajo. Ahorrar 20-30% es saludable para tus finanzas.',
      moderate: 'Aceptable. Intenta llegar al 20% automatizando tus ahorros.',
      low: 'Cuidado. Menos del 10% de ahorro puede limitar tu futuro financiero.',
      negative: 'Alerta. Estás gastando más de lo que ganas. Revisa tus gastos urgentemente.'
    },
    noData: 'Agrega ingresos y gastos para ver tu tendencia de ahorro'
  },
  en: {
    title: 'Savings Trend',
    description: 'Evolution of your monthly savings rate',
    savingsRate: 'Savings rate',
    targetRate: 'Recommended target',
    currentRate: 'Current rate',
    avgRate: 'Average',
    trend: 'Trend',
    improving: 'Improving',
    declining: 'Declining',
    stable: 'Stable',
    excellent: 'Excellent',
    good: 'Good',
    moderate: 'Moderate',
    low: 'Low',
    negative: 'Negative',
    tips: {
      excellent: 'Fantastic! You\'re saving over 30%. Consider investing the surplus.',
      good: 'Great job. Saving 20-30% is healthy for your finances.',
      moderate: 'Acceptable. Try reaching 20% by automating your savings.',
      low: 'Careful. Less than 10% savings can limit your financial future.',
      negative: 'Alert. You\'re spending more than you earn. Review expenses urgently.'
    },
    noData: 'Add income and expenses to see your savings trend'
  }
};

const TARGET_SAVINGS_RATE = 20; // 20% target

export function SavingsRateChart() {
  const { language } = useLanguage();
  const t = translations[language];
  const locale = language === 'es' ? es : enUS;
  
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: income = [], isLoading: incomeLoading } = useIncome();

  const isLoading = expensesLoading || incomeLoading;

  const chartData = useMemo(() => {
    const months: { month: string; date: Date; rate: number; income: number; expenses: number; savings: number }[] = [];
    
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthIncome = income
        .filter(inc => {
          const incDate = new Date(inc.date);
          return incDate >= monthStart && incDate <= monthEnd;
        })
        .reduce((sum, inc) => sum + inc.amount, 0);
      
      const monthExpenses = expenses
        .filter(exp => {
          const expDate = new Date(exp.date);
          return expDate >= monthStart && expDate <= monthEnd;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      const savings = monthIncome - monthExpenses;
      const rate = monthIncome > 0 ? (savings / monthIncome) * 100 : 0;
      
      months.push({
        month: format(date, 'MMM', { locale }),
        date,
        rate: Math.round(rate * 10) / 10,
        income: monthIncome,
        expenses: monthExpenses,
        savings
      });
    }
    
    return months;
  }, [income, expenses, locale]);

  const stats = useMemo(() => {
    const recentMonths = chartData.slice(-6); // Last 6 months for analysis
    const validMonths = recentMonths.filter(m => m.income > 0);
    
    if (validMonths.length === 0) {
      return { currentRate: 0, avgRate: 0, trend: 'stable' as const, level: 'moderate' as const };
    }
    
    const avgRate = validMonths.reduce((sum, m) => sum + m.rate, 0) / validMonths.length;
    const currentRate = validMonths[validMonths.length - 1]?.rate || 0;
    
    // Calculate trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (validMonths.length >= 3) {
      const firstHalf = validMonths.slice(0, Math.floor(validMonths.length / 2));
      const secondHalf = validMonths.slice(Math.floor(validMonths.length / 2));
      const firstAvg = firstHalf.reduce((sum, m) => sum + m.rate, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.rate, 0) / secondHalf.length;
      
      if (secondAvg - firstAvg > 3) trend = 'improving';
      else if (firstAvg - secondAvg > 3) trend = 'declining';
    }
    
    // Determine level
    let level: 'excellent' | 'good' | 'moderate' | 'low' | 'negative';
    if (currentRate >= 30) level = 'excellent';
    else if (currentRate >= 20) level = 'good';
    else if (currentRate >= 10) level = 'moderate';
    else if (currentRate >= 0) level = 'low';
    else level = 'negative';
    
    return { currentRate, avgRate, trend, level };
  }, [chartData]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'good': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'moderate': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'negative': return 'text-red-500 bg-red-500/10 border-red-500/30';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span>{t.savingsRate}</span>
              <span className={`font-bold ${data.rate >= TARGET_SAVINGS_RATE ? 'text-green-500' : data.rate >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                {data.rate}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-muted-foreground">
              <span>Ahorro</span>
              <span>{formatCurrency(data.savings)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  const hasData = chartData.some(m => m.income > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t.noData}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getLevelColor(stats.level)}>
              {stats.level === 'excellent' && <Award className="h-3 w-3 mr-1" />}
              {stats.level === 'negative' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {t[stats.level]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Rate Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t.currentRate}</span>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`font-bold ${stats.currentRate >= TARGET_SAVINGS_RATE ? 'text-green-500' : 'text-muted-foreground'}`}>
                {stats.currentRate.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="relative">
            <Progress 
              value={Math.min(100, Math.max(0, stats.currentRate * 2))} 
              className="h-3"
            />
            <div 
              className="absolute top-0 h-3 w-0.5 bg-primary"
              style={{ left: `${TARGET_SAVINGS_RATE * 2}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {t.targetRate}: {TARGET_SAVINGS_RATE}%
            </span>
            <span>50%+</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${value}%`}
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={TARGET_SAVINGS_RATE} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
                label={{ value: `${TARGET_SAVINGS_RATE}%`, position: 'right', fill: 'hsl(var(--primary))', fontSize: 10 }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeOpacity={0.5} />
              <Area 
                type="monotone" 
                dataKey="rate" 
                stroke="hsl(var(--primary))"
                fill="url(#savingsGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.currentRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{t.currentRate}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.avgRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{t.avgRate}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {getTrendIcon()}
              <p className="text-lg font-medium">{t[stats.trend]}</p>
            </div>
            <p className="text-xs text-muted-foreground">{t.trend}</p>
          </div>
        </div>

        {/* Tip */}
        <div className={`p-3 rounded-lg border ${getLevelColor(stats.level)}`}>
          <p className="text-sm">
            {t.tips[stats.level]}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
