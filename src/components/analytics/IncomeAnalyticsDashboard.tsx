import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useIncome } from '@/hooks/data/useIncome';
import { useExpenses } from '@/hooks/data/useExpenses';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Sparkles,
  Target,
  Zap,
  Rocket,
  PiggyBank,
  Building,
  Laptop,
  Coins,
  Bitcoin,
  Home,
  Music2,
  Briefcase,
  Gift,
  RefreshCcw,
  Award,
  Crown,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  LineChart,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Flame,
  Shield,
  Eye,
  Info,
  Lightbulb,
  Wallet,
  CircleDollarSign,
  Scale,
  Clock,
  Star,
  CheckCircle,
  AlertTriangle,
  PartyPopper
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ComposedChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend
} from 'recharts';
import { IncomeType } from '@/types/income.types';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

// Income type classification based on Kiyosaki quadrant
const INCOME_CLASSIFICATION: Record<IncomeType, { quadrant: 'E' | 'S' | 'B' | 'I'; passive: boolean; color: string; icon: any }> = {
  salary: { quadrant: 'E', passive: false, color: '#3b82f6', icon: Briefcase },
  client_payment: { quadrant: 'S', passive: false, color: '#8b5cf6', icon: Laptop },
  bonus: { quadrant: 'E', passive: false, color: '#06b6d4', icon: Gift },
  gift: { quadrant: 'E', passive: false, color: '#ec4899', icon: Gift },
  refund: { quadrant: 'E', passive: false, color: '#64748b', icon: RefreshCcw },
  investment_stocks: { quadrant: 'I', passive: true, color: '#22c55e', icon: LineChart },
  investment_crypto: { quadrant: 'I', passive: true, color: '#f97316', icon: Bitcoin },
  investment_funds: { quadrant: 'I', passive: true, color: '#10b981', icon: Coins },
  passive_rental: { quadrant: 'I', passive: true, color: '#eab308', icon: Home },
  passive_royalties: { quadrant: 'B', passive: true, color: '#a855f7', icon: Music2 },
  online_business: { quadrant: 'B', passive: false, color: '#14b8a6', icon: Laptop },
  freelance: { quadrant: 'S', passive: false, color: '#6366f1', icon: Briefcase },
  other: { quadrant: 'S', passive: false, color: '#94a3b8', icon: DollarSign }
};

const QUADRANT_INFO = {
  E: { name: { es: 'Empleado', en: 'Employee' }, color: '#3b82f6', description: { es: 'Trabajo para otros', en: 'Working for others' } },
  S: { name: { es: 'Autoempleado', en: 'Self-Employed' }, color: '#8b5cf6', description: { es: 'Trabajo para ti mismo', en: 'Working for yourself' } },
  B: { name: { es: 'Dueño de Negocio', en: 'Business Owner' }, color: '#10b981', description: { es: 'Sistema trabaja para ti', en: 'System works for you' } },
  I: { name: { es: 'Inversionista', en: 'Investor' }, color: '#22c55e', description: { es: 'Dinero trabaja para ti', en: 'Money works for you' } }
};

interface IncomeAnalyticsDashboardProps {
  year: number;
  month: number;
}

export function IncomeAnalyticsDashboard({ year, month }: IncomeAnalyticsDashboardProps) {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const [showProjection, setShowProjection] = useState(true);
  const [showQuadrant, setShowQuadrant] = useState(true);
  const [showStreams, setShowStreams] = useState(true);
  const [showGoals, setShowGoals] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState(false);
  
  // Fetch current year income
  const { data: yearlyIncome } = useIncome({ year });
  const { data: monthlyIncome } = useIncome({ year, month: month + 1 });
  
  // Fetch last 6 months for trends
  const monthsData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(year, month, 1), i);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: format(date, 'MMM', { locale: language === 'es' ? es : enUS })
      });
    }
    return months;
  }, [year, month, language]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CL' : 'en-CA', {
      style: 'currency',
      currency: profile?.country === 'CL' ? 'CLP' : 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // ============= INCOME ANALYSIS =============
  const incomeAnalysis = useMemo(() => {
    const totalMonthly = monthlyIncome?.reduce((s, i) => s + Number(i.amount), 0) || 0;
    const totalYearly = yearlyIncome?.reduce((s, i) => s + Number(i.amount), 0) || 0;
    
    // By type classification
    const byType: Record<IncomeType, number> = {} as Record<IncomeType, number>;
    const byQuadrant: Record<string, number> = { E: 0, S: 0, B: 0, I: 0 };
    let passiveTotal = 0;
    let activeTotal = 0;
    let taxableTotal = 0;
    let nonTaxableTotal = 0;
    
    monthlyIncome?.forEach(inc => {
      const type = inc.income_type as IncomeType;
      byType[type] = (byType[type] || 0) + Number(inc.amount);
      
      const classification = INCOME_CLASSIFICATION[type];
      if (classification) {
        byQuadrant[classification.quadrant] += Number(inc.amount);
        if (classification.passive) {
          passiveTotal += Number(inc.amount);
        } else {
          activeTotal += Number(inc.amount);
        }
      }
      
      if (inc.is_taxable) {
        taxableTotal += Number(inc.amount);
      } else {
        nonTaxableTotal += Number(inc.amount);
      }
    });
    
    // Income streams count
    const uniqueStreams = new Set(monthlyIncome?.map(i => i.income_type) || []);
    const passiveStreams = [...uniqueStreams].filter(t => INCOME_CLASSIFICATION[t as IncomeType]?.passive);
    
    // Recurring vs one-time
    const recurring = monthlyIncome?.filter(i => i.recurrence !== 'one_time') || [];
    const recurringTotal = recurring.reduce((s, i) => s + Number(i.amount), 0);
    
    // Freedom percentage
    const freedomPercentage = totalMonthly > 0 ? (passiveTotal / totalMonthly) * 100 : 0;
    
    // Quadrant progression (ideal: E→S→B→I)
    const quadrantTotal = Object.values(byQuadrant).reduce((a, b) => a + b, 0);
    const quadrantPercentages = {
      E: quadrantTotal > 0 ? (byQuadrant.E / quadrantTotal) * 100 : 0,
      S: quadrantTotal > 0 ? (byQuadrant.S / quadrantTotal) * 100 : 0,
      B: quadrantTotal > 0 ? (byQuadrant.B / quadrantTotal) * 100 : 0,
      I: quadrantTotal > 0 ? (byQuadrant.I / quadrantTotal) * 100 : 0,
    };
    
    // Determine quadrant status
    const rightSidePercentage = quadrantPercentages.B + quadrantPercentages.I;
    const quadrantStatus = rightSidePercentage >= 75 ? 'excellent' 
      : rightSidePercentage >= 50 ? 'good'
      : rightSidePercentage >= 25 ? 'progressing'
      : 'starting';
    
    return {
      totalMonthly,
      totalYearly,
      byType,
      byQuadrant,
      quadrantPercentages,
      passiveTotal,
      activeTotal,
      taxableTotal,
      nonTaxableTotal,
      freedomPercentage,
      streamsCount: uniqueStreams.size,
      passiveStreamsCount: passiveStreams.length,
      recurringTotal,
      recurringCount: recurring.length,
      quadrantStatus,
      rightSidePercentage
    };
  }, [monthlyIncome, yearlyIncome]);
  
  // ============= MONTHLY TRENDS =============
  const monthlyTrends = useMemo(() => {
    if (!yearlyIncome) return [];
    
    const byMonth: Record<string, { passive: number; active: number; total: number }> = {};
    
    yearlyIncome.forEach(inc => {
      const monthKey = format(new Date(inc.date), 'MMM', { locale: language === 'es' ? es : enUS });
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { passive: 0, active: 0, total: 0 };
      }
      
      const isPassive = INCOME_CLASSIFICATION[inc.income_type as IncomeType]?.passive;
      if (isPassive) {
        byMonth[monthKey].passive += Number(inc.amount);
      } else {
        byMonth[monthKey].active += Number(inc.amount);
      }
      byMonth[monthKey].total += Number(inc.amount);
    });
    
    return Object.entries(byMonth).map(([month, data]) => ({
      month,
      ...data,
      freedomRatio: data.total > 0 ? (data.passive / data.total) * 100 : 0
    }));
  }, [yearlyIncome, language]);
  
  // ============= PROJECTIONS =============
  const projections = useMemo(() => {
    const avgMonthly = incomeAnalysis.totalYearly / (month + 1);
    const projectedYearly = avgMonthly * 12;
    
    // Passive income growth (assuming 10% monthly growth for investments)
    const passiveGrowthRate = 0.10;
    const projectedPassive12Months = incomeAnalysis.passiveTotal * Math.pow(1 + passiveGrowthRate / 12, 12);
    
    // Time to financial freedom
    // Assuming average expenses = 70% of income
    const estimatedMonthlyExpenses = avgMonthly * 0.7;
    const currentPassive = incomeAnalysis.passiveTotal;
    
    let monthsToFreedom: number | null = null;
    if (currentPassive > 0 && currentPassive < estimatedMonthlyExpenses) {
      const monthlyGrowthRate = Math.pow(1 + passiveGrowthRate, 1/12) - 1;
      monthsToFreedom = Math.ceil(Math.log(estimatedMonthlyExpenses / currentPassive) / Math.log(1 + monthlyGrowthRate));
    } else if (currentPassive >= estimatedMonthlyExpenses) {
      monthsToFreedom = 0;
    }
    
    return {
      avgMonthly,
      projectedYearly,
      projectedPassive12Months,
      monthsToFreedom,
      estimatedMonthlyExpenses
    };
  }, [incomeAnalysis, month]);
  
  // ============= INCOME DIVERSIFICATION SCORE =============
  const diversificationScore = useMemo(() => {
    const streamsCount = incomeAnalysis.streamsCount;
    const passiveRatio = incomeAnalysis.freedomPercentage;
    const rightSide = incomeAnalysis.rightSidePercentage;
    
    // Score components (0-100)
    const streamsScore = Math.min(streamsCount * 15, 30); // Up to 30 points for 2+ streams
    const passiveScore = Math.min(passiveRatio * 0.4, 40); // Up to 40 points for passive income
    const quadrantScore = Math.min(rightSide * 0.3, 30); // Up to 30 points for B+I quadrant
    
    const total = Math.round(streamsScore + passiveScore + quadrantScore);
    
    const grade = total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : total >= 20 ? 'D' : 'F';
    const emoji = total >= 80 ? '🏆' : total >= 60 ? '⭐' : total >= 40 ? '📈' : total >= 20 ? '🌱' : '💪';
    
    return { total, grade, emoji, streamsScore, passiveScore, quadrantScore };
  }, [incomeAnalysis]);
  
  // ============= RECOMMENDATIONS =============
  const recommendations = useMemo(() => {
    const recs: { type: 'success' | 'warning' | 'info' | 'tip'; icon: any; title: string; message: string }[] = [];
    
    // Passive income recommendations
    if (incomeAnalysis.passiveTotal === 0) {
      recs.push({
        type: 'warning',
        icon: AlertTriangle,
        title: language === 'es' ? 'Sin Ingresos Pasivos' : 'No Passive Income',
        message: language === 'es' 
          ? 'Kiyosaki recomienda: "La libertad financiera viene cuando tu ingreso pasivo supera tus gastos". Considera inversiones en dividendos, bienes raíces o royalties.'
          : 'Kiyosaki recommends: "Financial freedom comes when your passive income exceeds your expenses". Consider dividend investments, real estate or royalties.'
      });
    } else if (incomeAnalysis.freedomPercentage < 25) {
      recs.push({
        type: 'info',
        icon: Lightbulb,
        title: language === 'es' ? 'Aumenta Ingresos Pasivos' : 'Increase Passive Income',
        message: language === 'es' 
          ? `Tu ingreso pasivo es ${incomeAnalysis.freedomPercentage.toFixed(1)}% del total. Meta: 50%+ para mayor seguridad financiera.`
          : `Your passive income is ${incomeAnalysis.freedomPercentage.toFixed(1)}% of total. Goal: 50%+ for greater financial security.`
      });
    }
    
    // Income streams
    if (incomeAnalysis.streamsCount < 3) {
      recs.push({
        type: 'tip',
        icon: Star,
        title: language === 'es' ? 'Diversifica Fuentes' : 'Diversify Sources',
        message: language === 'es' 
          ? 'Los millonarios tienen en promedio 7 fuentes de ingreso. Explora nuevas oportunidades de ingresos pasivos.'
          : 'Millionaires have on average 7 income sources. Explore new passive income opportunities.'
      });
    }
    
    // Quadrant progression
    if (incomeAnalysis.quadrantPercentages.E > 70) {
      recs.push({
        type: 'info',
        icon: Target,
        title: language === 'es' ? 'Transición de Cuadrante' : 'Quadrant Transition',
        message: language === 'es' 
          ? 'Tu ingreso está mayormente en el cuadrante E (Empleado). Considera desarrollar habilidades para el lado derecho (B e I).'
          : 'Your income is mostly in E quadrant (Employee). Consider developing skills for the right side (B and I).'
      });
    }
    
    // Success cases
    if (incomeAnalysis.freedomPercentage >= 50) {
      recs.push({
        type: 'success',
        icon: Crown,
        title: language === 'es' ? '¡Excelente Progreso!' : 'Excellent Progress!',
        message: language === 'es' 
          ? `${incomeAnalysis.freedomPercentage.toFixed(1)}% de tu ingreso es pasivo. ¡Estás construyendo verdadera libertad financiera!`
          : `${incomeAnalysis.freedomPercentage.toFixed(1)}% of your income is passive. You're building true financial freedom!`
      });
    }
    
    if (incomeAnalysis.passiveStreamsCount >= 3) {
      recs.push({
        type: 'success',
        icon: Award,
        title: language === 'es' ? 'Múltiples Fuentes Pasivas' : 'Multiple Passive Sources',
        message: language === 'es' 
          ? `Tienes ${incomeAnalysis.passiveStreamsCount} fuentes de ingreso pasivo. ¡Diversificación excelente!`
          : `You have ${incomeAnalysis.passiveStreamsCount} passive income sources. Excellent diversification!`
      });
    }
    
    return recs;
  }, [incomeAnalysis, language]);
  
  // ============= PIE CHART DATA =============
  const pieData = useMemo(() => {
    return Object.entries(incomeAnalysis.byType)
      .filter(([_, value]) => value > 0)
      .map(([type, value]) => ({
        name: getIncomeTypeLabel(type as IncomeType, language),
        value,
        color: INCOME_CLASSIFICATION[type as IncomeType]?.color || '#94a3b8'
      }));
  }, [incomeAnalysis.byType, language]);
  
  // ============= QUADRANT RADAR DATA =============
  const quadrantRadar = useMemo(() => {
    return Object.entries(QUADRANT_INFO).map(([key, info]) => ({
      quadrant: info.name[language as 'es' | 'en'],
      value: incomeAnalysis.byQuadrant[key] || 0,
      fullMark: incomeAnalysis.totalMonthly * 0.5
    }));
  }, [incomeAnalysis, language]);
  
  const monthNames = language === 'es'
    ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const isFinanciallyFree = projections.monthsToFreedom === 0;
  
  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-green-500/5 to-emerald-500/5 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2.5 rounded-xl bg-gradient-to-br from-primary via-green-500 to-emerald-600 shadow-lg shadow-primary/30"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CircleDollarSign className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 flex-wrap">
                💰 {language === 'es' ? 'Análisis de Ingresos Pro' : 'Pro Income Analysis'}
                <Badge className="bg-gradient-to-r from-primary to-emerald-500 text-white text-[10px]">
                  {monthNames[month]}
                </Badge>
                {isFinanciallyFree && (
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    🎉
                  </motion.span>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {language === 'es' ? 'Cuadrante Kiyosaki • Ingresos Pasivos • Proyecciones' : 'Kiyosaki Quadrant • Passive Income • Projections'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant={showQuadrant ? "default" : "outline"}
              onClick={() => setShowQuadrant(!showQuadrant)}
              className="gap-1 text-xs h-8"
            >
              <Scale className="h-3.5 w-3.5" />
              {language === 'es' ? 'Cuadrante' : 'Quadrant'}
            </Button>
            <Button
              size="sm"
              variant={showStreams ? "default" : "outline"}
              onClick={() => setShowStreams(!showStreams)}
              className="gap-1 text-xs h-8"
            >
              <Wallet className="h-3.5 w-3.5" />
              {language === 'es' ? 'Fuentes' : 'Sources'}
            </Button>
            <Button
              size="sm"
              variant={showProjection ? "default" : "outline"}
              onClick={() => setShowProjection(!showProjection)}
              className="gap-1 text-xs h-8"
            >
              <Rocket className="h-3.5 w-3.5" />
              {language === 'es' ? 'Proyección' : 'Projection'}
            </Button>
            <Button
              size="sm"
              variant={showGoals ? "default" : "outline"}
              onClick={() => setShowGoals(!showGoals)}
              className="gap-1 text-xs h-8"
            >
              <Target className="h-3.5 w-3.5" />
              {language === 'es' ? 'Metas' : 'Goals'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* ============= MAIN STATS GRID ============= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Income */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-green-500/10 border border-primary/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                {language === 'es' ? 'Total Mes' : 'Monthly Total'}
              </span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(incomeAnalysis.totalMonthly)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {language === 'es' ? 'Anual: ' : 'Yearly: '}{formatCurrency(incomeAnalysis.totalYearly)}
            </p>
          </motion.div>
          
          {/* Passive Income */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "p-4 rounded-xl border",
              incomeAnalysis.passiveTotal > 0 
                ? "bg-gradient-to-br from-success/20 to-emerald-500/10 border-success/30"
                : "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-2 rounded-lg", incomeAnalysis.passiveTotal > 0 ? "bg-success/20" : "bg-amber-500/20")}>
                <PiggyBank className={cn("h-4 w-4", incomeAnalysis.passiveTotal > 0 ? "text-success" : "text-amber-500")} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {language === 'es' ? 'Pasivo' : 'Passive'}
              </span>
            </div>
            <p className={cn("text-2xl font-bold", incomeAnalysis.passiveTotal > 0 ? "text-success" : "text-amber-600")}>
              {formatCurrency(incomeAnalysis.passiveTotal)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {incomeAnalysis.freedomPercentage.toFixed(1)}% {language === 'es' ? 'del total' : 'of total'}
            </p>
          </motion.div>
          
          {/* Active Income */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Briefcase className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-blue-600">
                {language === 'es' ? 'Activo' : 'Active'}
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(incomeAnalysis.activeTotal)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {(100 - incomeAnalysis.freedomPercentage).toFixed(1)}% {language === 'es' ? 'del total' : 'of total'}
            </p>
          </motion.div>
          
          {/* Diversification Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Award className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-purple-600">
                {language === 'es' ? 'Score' : 'Score'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{diversificationScore.emoji}</span>
              <span className="text-2xl font-bold text-purple-600">{diversificationScore.grade}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {diversificationScore.total}/100 {language === 'es' ? 'diversificación' : 'diversification'}
            </p>
          </motion.div>
        </div>
        
        {/* ============= PASSIVE VS ACTIVE PROGRESS ============= */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-success/5 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {language === 'es' ? 'Camino a la Libertad Financiera' : 'Path to Financial Freedom'}
            </h4>
            <Badge variant="outline" className="text-xs">
              {incomeAnalysis.freedomPercentage.toFixed(1)}%
            </Badge>
          </div>
          
          <div className="relative h-6 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${100 - incomeAnalysis.freedomPercentage}%` }}
              transition={{ duration: 1 }}
            />
            <motion.div
              className="absolute inset-y-0 bg-gradient-to-r from-success via-emerald-400 to-green-500"
              style={{ left: `${100 - incomeAnalysis.freedomPercentage}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${incomeAnalysis.freedomPercentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {incomeAnalysis.freedomPercentage >= 50 
                ? (language === 'es' ? '¡Más de la mitad!' : 'Over halfway!')
                : incomeAnalysis.freedomPercentage >= 25
                  ? (language === 'es' ? 'Buen progreso' : 'Good progress')
                  : (language === 'es' ? 'Comienza hoy' : 'Start today')
              }
            </div>
          </div>
          
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              {language === 'es' ? 'Activo' : 'Active'}: {formatCurrency(incomeAnalysis.activeTotal)}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              {language === 'es' ? 'Pasivo' : 'Passive'}: {formatCurrency(incomeAnalysis.passiveTotal)}
            </span>
          </div>
        </div>
        
        {/* ============= KIYOSAKI QUADRANT ============= */}
        <AnimatePresence>
          {showQuadrant && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 border border-amber-500/30"
            >
              <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-500" />
                {language === 'es' ? 'Cuadrante del Flujo de Dinero (Kiyosaki)' : "Cashflow Quadrant (Kiyosaki)"}
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {language === 'es' ? 'Lado Derecho' : 'Right Side'}: {incomeAnalysis.rightSidePercentage.toFixed(0)}%
                </Badge>
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                {(['E', 'S', 'B', 'I'] as const).map((q, index) => {
                  const isRightSide = q === 'B' || q === 'I';
                  const value = incomeAnalysis.byQuadrant[q];
                  const percentage = incomeAnalysis.quadrantPercentages[q];
                  
                  return (
                    <motion.div
                      key={q}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all",
                        isRightSide 
                          ? "bg-gradient-to-br from-success/10 to-emerald-500/10 border-success/40"
                          : "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30",
                        percentage > 0 && "ring-2 ring-offset-2 ring-offset-background",
                        percentage > 0 && isRightSide && "ring-success/50",
                        percentage > 0 && !isRightSide && "ring-blue-500/50"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          "text-2xl font-black",
                          isRightSide ? "text-success" : "text-blue-500"
                        )}>
                          {q}
                        </span>
                        <div>
                          <p className="text-xs font-bold">{QUADRANT_INFO[q].name[language as 'es' | 'en']}</p>
                          <p className="text-[10px] text-muted-foreground">{QUADRANT_INFO[q].description[language as 'es' | 'en']}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-lg font-bold">{formatCurrency(value)}</span>
                          <Badge className={cn(
                            "text-[10px]",
                            percentage > 0 ? (isRightSide ? "bg-success/20 text-success" : "bg-blue-500/20 text-blue-600") : "bg-muted"
                          )}>
                            {percentage.toFixed(0)}%
                          </Badge>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-1.5 mt-2"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'es' 
                      ? 'Robert Kiyosaki recomienda migrar del lado izquierdo (E, S) al lado derecho (B, I) para alcanzar la libertad financiera.'
                      : 'Robert Kiyosaki recommends migrating from the left side (E, S) to the right side (B, I) to achieve financial freedom.'}
                  </span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* ============= INCOME STREAMS ============= */}
        <AnimatePresence>
          {showStreams && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid md:grid-cols-2 gap-4"
            >
              {/* Pie Chart */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-purple-500" />
                  {language === 'es' ? 'Distribución por Tipo' : 'Distribution by Type'}
                </h4>
                
                {pieData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="h-[140px] w-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: number) => formatCurrency(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="flex-1 space-y-1.5">
                      {pieData.slice(0, 5).map((type, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                          <span className="text-[10px] flex-1 truncate">{type.name}</span>
                          <span className="text-[10px] font-bold">{((type.value / incomeAnalysis.totalMonthly) * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[140px] flex items-center justify-center text-muted-foreground text-sm">
                    {language === 'es' ? 'Sin datos de ingresos' : 'No income data'}
                  </div>
                )}
              </div>
              
              {/* Income List */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-500" />
                  {language === 'es' ? 'Fuentes de Ingreso' : 'Income Sources'}
                  <Badge className="ml-auto bg-green-500/20 text-green-600 text-[10px]">
                    {incomeAnalysis.streamsCount} {language === 'es' ? 'activas' : 'active'}
                  </Badge>
                </h4>
                
                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {Object.entries(incomeAnalysis.byType)
                    .filter(([_, value]) => value > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, value]) => {
                      const classification = INCOME_CLASSIFICATION[type as IncomeType];
                      const Icon = classification?.icon || DollarSign;
                      const isPassive = classification?.passive;
                      
                      return (
                        <div key={type} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${classification?.color}20` }}>
                            <Icon className="h-3.5 w-3.5" style={{ color: classification?.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{getIncomeTypeLabel(type as IncomeType, language)}</p>
                            <div className="flex items-center gap-1">
                              <Badge className={cn(
                                "text-[8px] h-4",
                                isPassive ? "bg-success/20 text-success" : "bg-blue-500/20 text-blue-600"
                              )}>
                                {isPassive ? (language === 'es' ? 'Pasivo' : 'Passive') : (language === 'es' ? 'Activo' : 'Active')}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{classification?.quadrant}</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold">{formatCurrency(value)}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* ============= PROJECTIONS ============= */}
        <AnimatePresence>
          {showProjection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-indigo-500/10 border border-cyan-500/30"
            >
              <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Rocket className="h-4 w-4 text-cyan-500" />
                {language === 'es' ? 'Proyecciones y Libertad Financiera' : 'Projections & Financial Freedom'}
              </h4>
              
              {/* Trend Chart */}
              {monthlyTrends.length > 0 && (
                <div className="h-[180px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyTrends}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <RechartsTooltip 
                        formatter={(value: number, name: string) => [formatCurrency(value), name === 'passive' ? (language === 'es' ? 'Pasivo' : 'Passive') : (language === 'es' ? 'Activo' : 'Active')]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="active" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.4}
                        name={language === 'es' ? 'Activo' : 'Active'}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="passive" 
                        stackId="1"
                        stroke="#22c55e" 
                        fill="#22c55e" 
                        fillOpacity={0.6}
                        name={language === 'es' ? 'Pasivo' : 'Passive'}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="freedomRatio" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b' }}
                        yAxisId="right"
                        name="% Freedom"
                      />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Freedom Projection Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    {language === 'es' ? 'Promedio Mensual' : 'Monthly Average'}
                  </p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(projections.avgMonthly)}</p>
                </div>
                
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    {language === 'es' ? 'Proyección Anual' : 'Yearly Projection'}
                  </p>
                  <p className="text-lg font-bold text-success">{formatCurrency(projections.projectedYearly)}</p>
                </div>
                
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    {language === 'es' ? 'Pasivo en 12 meses' : 'Passive in 12 months'}
                  </p>
                  <p className="text-lg font-bold text-amber-600">{formatCurrency(projections.projectedPassive12Months)}</p>
                </div>
                
                <div className={cn(
                  "p-3 rounded-lg border",
                  projections.monthsToFreedom === 0 
                    ? "bg-success/20 border-success/40"
                    : projections.monthsToFreedom && projections.monthsToFreedom < 60
                      ? "bg-cyan-500/10 border-cyan-500/20"
                      : "bg-muted border-muted-foreground/20"
                )}>
                  <p className="text-[10px] text-muted-foreground mb-1">
                    {language === 'es' ? 'Libertad en' : 'Freedom in'}
                  </p>
                  {projections.monthsToFreedom === 0 ? (
                    <p className="text-lg font-bold text-success flex items-center gap-1">
                      <PartyPopper className="h-4 w-4" />
                      {language === 'es' ? '¡LIBRE!' : 'FREE!'}
                    </p>
                  ) : projections.monthsToFreedom ? (
                    <p className="text-lg font-bold text-cyan-600">
                      {projections.monthsToFreedom} {language === 'es' ? 'meses' : 'months'}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground">
                      {language === 'es' ? 'Comienza a invertir' : 'Start investing'}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* ============= GOALS & MILESTONES ============= */}
        <AnimatePresence>
          {showGoals && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border border-violet-500/30"
            >
              <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-500" />
                {language === 'es' ? 'Metas de Ingresos Pasivos' : 'Passive Income Goals'}
              </h4>
              
              <div className="space-y-3">
                {[
                  { target: 1000, label: language === 'es' ? 'Primer $1,000 pasivo/mes' : 'First $1,000 passive/mo', icon: '🌱' },
                  { target: 5000, label: language === 'es' ? '$5,000 pasivo/mes' : '$5,000 passive/mo', icon: '🌿' },
                  { target: 10000, label: language === 'es' ? '$10,000 pasivo/mes' : '$10,000 passive/mo', icon: '🌳' },
                  { target: projections.estimatedMonthlyExpenses, label: language === 'es' ? '100% Libertad Financiera' : '100% Financial Freedom', icon: '🎉' }
                ].map((goal, i) => {
                  const progress = goal.target > 0 ? Math.min((incomeAnalysis.passiveTotal / goal.target) * 100, 100) : 0;
                  const achieved = progress >= 100;
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "p-3 rounded-lg border",
                        achieved ? "bg-success/20 border-success/40" : "bg-background/50"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{goal.icon}</span>
                        <span className="text-xs font-medium flex-1">{goal.label}</span>
                        {achieved && <CheckCircle className="h-4 w-4 text-success" />}
                        <Badge variant={achieved ? "default" : "outline"} className="text-[10px]">
                          {formatCurrency(goal.target)}
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-[10px] text-muted-foreground mt-1 text-right">
                        {progress.toFixed(0)}% {language === 'es' ? 'completado' : 'complete'}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* ============= AI RECOMMENDATIONS ============= */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <button 
            onClick={() => setExpandedInsights(!expandedInsights)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Lightbulb className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="font-bold text-sm">
                {language === 'es' ? '💡 Recomendaciones Personalizadas' : '💡 Personalized Recommendations'}
              </span>
              <Badge className="bg-primary/20 text-primary text-[10px]">
                {recommendations.length}
              </Badge>
            </div>
            {expandedInsights ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          <AnimatePresence>
            {expandedInsights && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-4 overflow-hidden"
              >
                {recommendations.map((rec, i) => {
                  const Icon = rec.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border",
                        rec.type === 'success' && "bg-success/10 border-success/30",
                        rec.type === 'warning' && "bg-amber-500/10 border-amber-500/30",
                        rec.type === 'info' && "bg-blue-500/10 border-blue-500/30",
                        rec.type === 'tip' && "bg-purple-500/10 border-purple-500/30"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg flex-shrink-0",
                        rec.type === 'success' && "bg-success/20 text-success",
                        rec.type === 'warning' && "bg-amber-500/20 text-amber-500",
                        rec.type === 'info' && "bg-blue-500/20 text-blue-500",
                        rec.type === 'tip' && "bg-purple-500/20 text-purple-500"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{rec.title}</p>
                        <p className="text-xs text-muted-foreground">{rec.message}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get income type labels
function getIncomeTypeLabel(type: IncomeType, language: string): string {
  const labels: Record<IncomeType, { es: string; en: string }> = {
    salary: { es: 'Salario', en: 'Salary' },
    client_payment: { es: 'Pago de Cliente', en: 'Client Payment' },
    bonus: { es: 'Bono', en: 'Bonus' },
    gift: { es: 'Regalo', en: 'Gift' },
    refund: { es: 'Reembolso', en: 'Refund' },
    investment_stocks: { es: 'Acciones/Dividendos', en: 'Stocks/Dividends' },
    investment_crypto: { es: 'Criptomonedas', en: 'Cryptocurrency' },
    investment_funds: { es: 'Fondos de Inversión', en: 'Investment Funds' },
    passive_rental: { es: 'Alquiler/Renta', en: 'Rental Income' },
    passive_royalties: { es: 'Regalías', en: 'Royalties' },
    online_business: { es: 'Negocio Online', en: 'Online Business' },
    freelance: { es: 'Freelance', en: 'Freelance' },
    other: { es: 'Otro', en: 'Other' }
  };
  
  return labels[type]?.[language as 'es' | 'en'] || type;
}
