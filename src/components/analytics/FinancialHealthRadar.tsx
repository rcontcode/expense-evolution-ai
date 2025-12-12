import { useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useAssets, useLiabilities } from '@/hooks/data/useNetWorth';
import { useInvestmentGoals } from '@/hooks/data/useInvestmentGoals';
import { useSavingsGoals } from '@/hooks/data/useSavingsGoals';
import { Shield, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface DimensionScore {
  dimension: string;
  score: number;
  fullMark: 100;
  description: string;
  tips: string[];
}

const translations = {
  es: {
    title: 'Radar de Salud Financiera',
    description: 'Evaluación integral de tu situación financiera en 6 dimensiones clave',
    overallScore: 'Puntuación Global',
    dimensions: {
      savings: 'Ahorro',
      debt: 'Deuda',
      investment: 'Inversión',
      liquidity: 'Liquidez',
      growth: 'Crecimiento',
      organization: 'Organización'
    },
    descriptions: {
      savings: 'Capacidad de ahorro mensual respecto a ingresos',
      debt: 'Nivel de endeudamiento saludable (invertido: más alto = menos deuda)',
      investment: 'Diversificación y progreso en metas de inversión',
      liquidity: 'Disponibilidad de efectivo para emergencias',
      growth: 'Tendencia de crecimiento del patrimonio',
      organization: 'Completitud de datos y seguimiento de gastos'
    },
    tips: {
      savings: ['Intenta ahorrar al menos 20% de tus ingresos', 'Automatiza tus ahorros al inicio del mes'],
      debt: ['Prioriza pagar deudas con mayor interés', 'Mantén ratio deuda/activos bajo 40%'],
      investment: ['Diversifica en al menos 3 tipos de activos', 'Establece metas claras de inversión'],
      liquidity: ['Mantén 3-6 meses de gastos en emergencias', 'Ten al menos 20% de activos líquidos'],
      growth: ['Revisa tu patrimonio mensualmente', 'Busca crecimiento consistente, no explosivo'],
      organization: ['Categoriza todos tus gastos', 'Revisa pendientes semanalmente']
    },
    levels: {
      excellent: 'Excelente',
      good: 'Bueno',
      fair: 'Regular',
      poor: 'Necesita atención',
      critical: 'Crítico'
    },
    noData: 'Agrega más datos para obtener un análisis completo'
  },
  en: {
    title: 'Financial Health Radar',
    description: 'Comprehensive assessment of your financial situation across 6 key dimensions',
    overallScore: 'Overall Score',
    dimensions: {
      savings: 'Savings',
      debt: 'Debt',
      investment: 'Investment',
      liquidity: 'Liquidity',
      growth: 'Growth',
      organization: 'Organization'
    },
    descriptions: {
      savings: 'Monthly savings capacity relative to income',
      debt: 'Healthy debt level (inverted: higher = less debt)',
      investment: 'Diversification and investment goal progress',
      liquidity: 'Cash availability for emergencies',
      growth: 'Net worth growth trend',
      organization: 'Data completeness and expense tracking'
    },
    tips: {
      savings: ['Try to save at least 20% of your income', 'Automate savings at the start of the month'],
      debt: ['Prioritize paying high-interest debt', 'Keep debt-to-asset ratio below 40%'],
      investment: ['Diversify across at least 3 asset types', 'Set clear investment goals'],
      liquidity: ['Keep 3-6 months of expenses in emergency fund', 'Have at least 20% liquid assets'],
      growth: ['Review your net worth monthly', 'Aim for consistent, not explosive growth'],
      organization: ['Categorize all your expenses', 'Review pending items weekly']
    },
    levels: {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Needs Attention',
      critical: 'Critical'
    },
    noData: 'Add more data for a complete analysis'
  }
};

export function FinancialHealthRadar() {
  const { language } = useLanguage();
  const t = translations[language];
  
  const { data: expenses = [] } = useExpenses();
  const { data: income = [] } = useIncome();
  const { data: assets = [] } = useAssets();
  const { data: liabilities = [] } = useLiabilities();
  const { data: investmentGoals = [] } = useInvestmentGoals();
  const { data: savingsGoals = [] } = useSavingsGoals();

  const scores = useMemo(() => {
    // Calculate time-based data (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentExpenses = expenses.filter(e => new Date(e.date) >= threeMonthsAgo);
    const recentIncome = income.filter(i => new Date(i.date) >= threeMonthsAgo);
    
    const totalExpenses = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = recentIncome.reduce((sum, i) => sum + i.amount, 0);
    const monthlyExpenses = totalExpenses / 3;
    const monthlyIncome = totalIncome / 3;
    
    const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
    const liquidAssets = assets.filter(a => a.is_liquid).reduce((sum, a) => sum + a.current_value, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.current_balance, 0);
    const netWorth = totalAssets - totalLiabilities;

    // 1. SAVINGS SCORE (0-100)
    // Based on savings rate (income - expenses) / income
    let savingsScore = 0;
    if (monthlyIncome > 0) {
      const savingsRate = (monthlyIncome - monthlyExpenses) / monthlyIncome;
      // 20%+ savings = 100, 0% = 0, negative = 0
      savingsScore = Math.min(100, Math.max(0, savingsRate * 500)); // 20% = 100
    } else if (savingsGoals.length > 0) {
      // If no income data, base on savings goals progress
      const avgProgress = savingsGoals.reduce((sum, g) => {
        const progress = g.target_amount > 0 ? (g.current_amount || 0) / g.target_amount : 0;
        return sum + progress;
      }, 0) / savingsGoals.length;
      savingsScore = avgProgress * 100;
    }

    // 2. DEBT SCORE (0-100) - Inverted: 100 = no debt, 0 = high debt
    let debtScore = 100;
    if (totalAssets > 0) {
      const debtToAssetRatio = totalLiabilities / totalAssets;
      // 0% debt = 100, 40% = 50, 80%+ = 0
      debtScore = Math.max(0, 100 - (debtToAssetRatio * 125));
    } else if (totalLiabilities > 0) {
      debtScore = 20; // Has debt but no assets
    }

    // 3. INVESTMENT SCORE (0-100)
    // Based on: asset diversification + investment goals progress
    let investmentScore = 0;
    const assetCategories = new Set(assets.map(a => a.category));
    const diversificationScore = Math.min(50, assetCategories.size * 10); // Max 50 for 5+ categories
    
    let goalsProgress = 0;
    if (investmentGoals.length > 0) {
      goalsProgress = investmentGoals.reduce((sum, g) => {
        const progress = g.target_amount > 0 ? (g.current_amount || 0) / g.target_amount : 0;
        return sum + Math.min(1, progress);
      }, 0) / investmentGoals.length * 50; // Max 50 for goals
    } else {
      goalsProgress = assets.length > 0 ? 25 : 0; // Some points for having assets
    }
    investmentScore = diversificationScore + goalsProgress;

    // 4. LIQUIDITY SCORE (0-100)
    // Based on: liquid assets / monthly expenses (should be 3-6 months)
    let liquidityScore = 0;
    if (monthlyExpenses > 0) {
      const monthsCovered = liquidAssets / monthlyExpenses;
      // 6+ months = 100, 3 months = 70, 1 month = 30, 0 = 0
      liquidityScore = Math.min(100, monthsCovered * 16.67);
    } else if (liquidAssets > 0) {
      liquidityScore = 50; // Has liquid assets but no expense data
    }

    // 5. GROWTH SCORE (0-100)
    // Based on: net worth trend, income vs expense trend
    let growthScore = 50; // Default neutral
    if (monthlyIncome > 0 && monthlyExpenses > 0) {
      if (monthlyIncome > monthlyExpenses) {
        const surplus = (monthlyIncome - monthlyExpenses) / monthlyIncome;
        growthScore = Math.min(100, 50 + surplus * 250);
      } else {
        const deficit = (monthlyExpenses - monthlyIncome) / monthlyIncome;
        growthScore = Math.max(0, 50 - deficit * 250);
      }
    }
    // Bonus for having investments/assets growing
    if (netWorth > 0 && totalAssets > totalLiabilities) {
      growthScore = Math.min(100, growthScore + 10);
    }

    // 6. ORGANIZATION SCORE (0-100)
    // Based on: expense categorization, data completeness
    let organizationScore = 0;
    const categorizedExpenses = expenses.filter(e => e.category && e.category !== 'other').length;
    const categorizationRate = expenses.length > 0 ? categorizedExpenses / expenses.length : 0;
    organizationScore += categorizationRate * 40; // 40 points for categorization
    
    // Points for having clients, projects, contracts
    const hasClients = expenses.some(e => e.client_id);
    const hasProjects = expenses.some(e => e.project_id);
    if (hasClients) organizationScore += 20;
    if (hasProjects) organizationScore += 20;
    
    // Points for recent activity
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentActivity = expenses.some(e => new Date(e.created_at || e.date) >= lastWeek);
    if (recentActivity) organizationScore += 20;

    return {
      savings: Math.round(savingsScore),
      debt: Math.round(debtScore),
      investment: Math.round(investmentScore),
      liquidity: Math.round(liquidityScore),
      growth: Math.round(growthScore),
      organization: Math.round(organizationScore)
    };
  }, [expenses, income, assets, liabilities, investmentGoals, savingsGoals]);

  const radarData: DimensionScore[] = [
    { 
      dimension: t.dimensions.savings, 
      score: scores.savings, 
      fullMark: 100,
      description: t.descriptions.savings,
      tips: t.tips.savings
    },
    { 
      dimension: t.dimensions.debt, 
      score: scores.debt, 
      fullMark: 100,
      description: t.descriptions.debt,
      tips: t.tips.debt
    },
    { 
      dimension: t.dimensions.investment, 
      score: scores.investment, 
      fullMark: 100,
      description: t.descriptions.investment,
      tips: t.tips.investment
    },
    { 
      dimension: t.dimensions.liquidity, 
      score: scores.liquidity, 
      fullMark: 100,
      description: t.descriptions.liquidity,
      tips: t.tips.liquidity
    },
    { 
      dimension: t.dimensions.growth, 
      score: scores.growth, 
      fullMark: 100,
      description: t.descriptions.growth,
      tips: t.tips.growth
    },
    { 
      dimension: t.dimensions.organization, 
      score: scores.organization, 
      fullMark: 100,
      description: t.descriptions.organization,
      tips: t.tips.organization
    }
  ];

  const overallScore = Math.round(
    Object.values(scores).reduce((sum, s) => sum + s, 0) / 6
  );

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: t.levels.excellent, color: 'bg-green-500', textColor: 'text-green-500' };
    if (score >= 60) return { label: t.levels.good, color: 'bg-blue-500', textColor: 'text-blue-500' };
    if (score >= 40) return { label: t.levels.fair, color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    if (score >= 20) return { label: t.levels.poor, color: 'bg-orange-500', textColor: 'text-orange-500' };
    return { label: t.levels.critical, color: 'bg-red-500', textColor: 'text-red-500' };
  };

  const overallLevel = getScoreLevel(overallScore);

  const getTrendIcon = (score: number) => {
    if (score >= 60) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (score >= 40) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DimensionScore;
      const level = getScoreLevel(data.score);
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-semibold">{data.dimension}</span>
            <Badge className={level.color}>{data.score}/100</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{data.description}</p>
          <div className="space-y-1">
            {data.tips.map((tip, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {tip}</p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t.overallScore}:</span>
            <Badge className={`${overallLevel.color} text-lg px-3 py-1`}>
              {overallScore}
            </Badge>
          </div>
        </div>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="dimension" 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.5}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Dimension Details */}
          <div className="space-y-3">
            {radarData.map((dim) => {
              const level = getScoreLevel(dim.score);
              return (
                <div key={dim.dimension} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dim.dimension}</span>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{dim.description}</p>
                        </TooltipContent>
                      </UITooltip>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(dim.score)}
                      <span className={`text-sm font-semibold ${level.textColor}`}>
                        {dim.score}
                      </span>
                    </div>
                  </div>
                  <Progress value={dim.score} className="h-2" />
                </div>
              );
            })}

            {/* Overall Score Summary */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t.overallScore}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={overallLevel.textColor}>
                    {overallLevel.label}
                  </Badge>
                  <span className={`text-xl font-bold ${overallLevel.textColor}`}>
                    {overallScore}/100
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
