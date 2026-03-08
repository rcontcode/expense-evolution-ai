import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useIncome } from '@/hooks/data/useIncome';
import { motion } from 'framer-motion';
import { parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Shield, TrendingUp, Users, BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StabilityFactors {
  diversification: number;   // 0-25: how many income sources
  recurringPct: number;      // 0-25: % of income that's recurring
  volatility: number;        // 0-25: consistency of monthly totals
  concentration: number;     // 0-25: inverse of client dependency
  totalScore: number;
  grade: string;
  gradeColor: string;
}

export function IncomeStabilityScore() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: income } = useIncome();

  const stability = useMemo((): StabilityFactors | null => {
    if (!income || income.length < 5) return null;

    const now = new Date();

    // 1. Diversification (0-25): unique sources
    const sources = new Set(income.map((i: any) => i.category || 'other'));
    const diversification = Math.min(25, sources.size * 5);

    // 2. Recurring % (0-25): clients appearing 3+ months
    const clientMonths: Record<string, Set<string>> = {};
    income.forEach((i: any) => {
      const key = i.client_id || i.category || 'misc';
      const month = i.date.substring(0, 7);
      if (!clientMonths[key]) clientMonths[key] = new Set();
      clientMonths[key].add(month);
    });
    const totalAmount = income.reduce((s: number, i: any) => s + Math.abs(Number(i.amount)), 0);
    let recurringAmount = 0;
    income.forEach((i: any) => {
      const key = i.client_id || i.category || 'misc';
      if ((clientMonths[key]?.size || 0) >= 3) {
        recurringAmount += Math.abs(Number(i.amount));
      }
    });
    const recurringPct = totalAmount > 0 ? Math.min(25, Math.round((recurringAmount / totalAmount) * 25)) : 0;

    // 3. Volatility (0-25): coefficient of variation of monthly totals
    const monthlyTotals: Record<string, number> = {};
    income.forEach((i: any) => {
      const month = i.date.substring(0, 7);
      monthlyTotals[month] = (monthlyTotals[month] || 0) + Math.abs(Number(i.amount));
    });
    const monthValues = Object.values(monthlyTotals);
    let volatility = 25;
    if (monthValues.length >= 2) {
      const mean = monthValues.reduce((s, v) => s + v, 0) / monthValues.length;
      const stdDev = Math.sqrt(monthValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / monthValues.length);
      const cv = mean > 0 ? stdDev / mean : 1;
      // cv 0 = perfect (25pts), cv >= 1 = terrible (0pts)
      volatility = Math.max(0, Math.round((1 - Math.min(cv, 1)) * 25));
    }

    // 4. Concentration risk (0-25): inverse of dependency on top client
    const clientTotals: Record<string, number> = {};
    income.forEach((i: any) => {
      const key = i.client_id || 'other';
      clientTotals[key] = (clientTotals[key] || 0) + Math.abs(Number(i.amount));
    });
    const topClientPct = totalAmount > 0
      ? Math.max(...Object.values(clientTotals)) / totalAmount
      : 1;
    const concentration = Math.max(0, Math.round((1 - topClientPct) * 25));

    const totalScore = diversification + recurringPct + volatility + concentration;

    const grade = totalScore >= 80 ? 'A' : totalScore >= 65 ? 'B' : totalScore >= 50 ? 'C' : totalScore >= 35 ? 'D' : 'F';
    const gradeColor = totalScore >= 80 ? 'text-emerald-600' : totalScore >= 65 ? 'text-primary' : totalScore >= 50 ? 'text-amber-600' : 'text-destructive';

    return { diversification, recurringPct, volatility, concentration, totalScore, grade, gradeColor };
  }, [income]);

  if (!stability) return null;

  const factors = [
    {
      icon: BarChart3,
      label: l ? 'Diversificación' : 'Diversification',
      score: stability.diversification,
      max: 25,
      tip: l ? 'Más fuentes de ingreso = más estabilidad' : 'More income sources = more stability',
    },
    {
      icon: TrendingUp,
      label: l ? '% Recurrente' : 'Recurring %',
      score: stability.recurringPct,
      max: 25,
      tip: l ? 'Ingresos que se repiten 3+ meses' : 'Income repeating 3+ months',
    },
    {
      icon: Shield,
      label: l ? 'Consistencia' : 'Consistency',
      score: stability.volatility,
      max: 25,
      tip: l ? 'Qué tan estable es tu ingreso mensual' : 'How stable your monthly income is',
    },
    {
      icon: Users,
      label: l ? 'Riesgo Concentración' : 'Concentration Risk',
      score: stability.concentration,
      max: 25,
      tip: l ? 'Baja dependencia de un solo cliente' : 'Low dependency on single client',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            {l ? 'Score de Estabilidad de Ingresos' : 'Income Stability Score'}
          </CardTitle>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full border-2",
              stability.totalScore >= 65 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'
            )}
          >
            <span className={cn("text-2xl font-black", stability.gradeColor)}>{stability.grade}</span>
            <span className="text-sm font-bold text-muted-foreground">{stability.totalScore}/100</span>
          </motion.div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Score bar */}
        <div className="relative">
          <Progress value={stability.totalScore} className="h-3" />
          <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5">
            <span>{l ? 'Frágil' : 'Fragile'}</span>
            <span>{l ? 'Estable' : 'Stable'}</span>
            <span>{l ? 'Blindado' : 'Bulletproof'}</span>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="grid gap-2 sm:grid-cols-2">
          {factors.map((factor, i) => (
            <motion.div
              key={factor.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-2.5 rounded-lg border bg-card"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <factor.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{factor.label}</span>
                </div>
                <Badge variant={factor.score >= 18 ? 'default' : factor.score >= 10 ? 'secondary' : 'destructive'} className="text-[9px] px-1.5 py-0">
                  {factor.score}/{factor.max}
                </Badge>
              </div>
              <Progress value={(factor.score / factor.max) * 100} className="h-1.5" />
              <p className="text-[9px] text-muted-foreground mt-1">{factor.tip}</p>
            </motion.div>
          ))}
        </div>

        {/* Actionable tip */}
        {stability.totalScore < 65 && (
          <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                {l
                  ? '💡 Tip: Agrega al menos 3 fuentes de ingreso distintas y asegura que ningún cliente represente más del 40% de tus ingresos totales.'
                  : '💡 Tip: Add at least 3 distinct income sources and ensure no single client represents more than 40% of your total revenue.'}
              </p>
            </div>
          </div>
        )}
        {stability.totalScore >= 80 && (
          <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                {l
                  ? '🏆 ¡Excelente! Tus ingresos son diversificados, recurrentes y estables. Estás en posición ideal para invertir el excedente.'
                  : '🏆 Excellent! Your income is diversified, recurring and stable. You\'re in an ideal position to invest your surplus.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
