import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useCashflowQuadrant } from '@/hooks/data/useCashflowQuadrant';
import { useFinancialFreedom } from '@/hooks/data/useFinancialFreedom';
import { useDebtClassification } from '@/hooks/data/useDebtClassification';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, PiggyBank, Scale } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function KiyosakiQuickStats() {
  const { language } = useLanguage();
  const es = language === 'es';
  const { formatCompact } = useFormatCurrency();

  const { totalIncome, progressToI, isLoading: loadingQ } = useCashflowQuadrant(language);
  const { passiveIncomeMonthly, freedomPercentage, isLoading: loadingF } = useFinancialFreedom(language);
  const { totalGoodDebt, totalBadDebt, goodDebtRatio, isLoading: loadingD } = useDebtClassification(language);

  const isLoading = loadingQ || loadingF || loadingD;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      icon: <TrendingUp className="h-4 w-4 text-primary" />,
      label: es ? 'Ingreso Pasivo' : 'Passive Income',
      value: formatCompact(passiveIncomeMonthly),
      sub: es ? '/mes' : '/mo',
      color: 'bg-primary/5 border-primary/20',
    },
    {
      icon: <PiggyBank className="h-4 w-4 text-emerald-500" />,
      label: es ? '% Libertad' : '% Freedom',
      value: `${freedomPercentage.toFixed(0)}%`,
      sub: es ? 'de meta' : 'of goal',
      color: 'bg-emerald-500/5 border-emerald-500/20',
    },
    {
      icon: <Scale className="h-4 w-4 text-blue-500" />,
      label: es ? 'Deuda Buena' : 'Good Debt',
      value: `${goodDebtRatio.toFixed(0)}%`,
      sub: formatCompact(totalGoodDebt),
      color: 'bg-blue-500/5 border-blue-500/20',
    },
    {
      icon: <TrendingDown className="h-4 w-4 text-destructive" />,
      label: es ? 'Deuda Mala' : 'Bad Debt',
      value: formatCompact(totalBadDebt),
      sub: es ? 'pendiente' : 'outstanding',
      color: 'bg-destructive/5 border-destructive/20',
    },
  ];

  return (
    <Card className="border-emerald-500/20">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💰</span>
          <h3 className="text-sm font-semibold">
            {es ? 'Resumen Kiyosaki' : 'Kiyosaki Summary'}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-lg border p-2.5 ${stat.color}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {stat.icon}
                <span className="text-[10px] text-muted-foreground font-medium">{stat.label}</span>
              </div>
              <p className="text-base font-bold leading-none">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
        {/* Progress to I indicator */}
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{es ? 'Progreso → Cuadrante I:' : 'Progress → Quadrant I:'}</span>
          <span className="font-semibold text-primary">{progressToI.toFixed(0)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
