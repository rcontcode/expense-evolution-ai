import { lazy, Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { Scale } from 'lucide-react';

const SmartMonthlyReport = lazy(() => import('@/components/dashboard/SmartMonthlyReport').then(m => ({ default: m.SmartMonthlyReport })));
const IncomeVsExpensesChart = lazy(() => import('@/components/analytics/IncomeVsExpensesChart').then(m => ({ default: m.IncomeVsExpensesChart })));
const SavingsRateChart = lazy(() => import('@/components/analytics/SavingsRateChart').then(m => ({ default: m.SavingsRateChart })));
const YearOverYearComparison = lazy(() => import('@/components/analytics/YearOverYearComparison').then(m => ({ default: m.YearOverYearComparison })));
const CategoryTrendsChart = lazy(() => import('@/components/analytics/CategoryTrendsChart').then(m => ({ default: m.CategoryTrendsChart })));
const FinancialHealthRadar = lazy(() => import('@/components/analytics/FinancialHealthRadar').then(m => ({ default: m.FinancialHealthRadar })));
const CashFlowSankey = lazy(() => import('@/components/analytics/CashFlowSankey').then(m => ({ default: m.CashFlowSankey })));
const ProjectProfitability = lazy(() => import('@/components/analytics/ProjectProfitability').then(m => ({ default: m.ProjectProfitability })));
const ClientProfitability = lazy(() => import('@/components/analytics/ClientProfitability').then(m => ({ default: m.ClientProfitability })));
const FinancialCorrelations = lazy(() => import('@/components/analytics/FinancialCorrelations').then(m => ({ default: m.FinancialCorrelations })));
const MoneyMomentumScore = lazy(() => import('@/components/dashboard/MoneyMomentumScore').then(m => ({ default: m.MoneyMomentumScore })));
const WhatIfSimulator = lazy(() => import('@/components/dashboard/WhatIfSimulator').then(m => ({ default: m.WhatIfSimulator })));
const NegotiationScriptGenerator = lazy(() => import('@/components/dashboard/NegotiationScriptGenerator').then(m => ({ default: m.NegotiationScriptGenerator })));
const TransactionTimeline = lazy(() => import('@/components/analytics/TransactionTimeline').then(m => ({ default: m.TransactionTimeline })));
const NetWorthTreemap = lazy(() => import('@/components/analytics/NetWorthTreemap').then(m => ({ default: m.NetWorthTreemap })));
const SpendingHeatmap = lazy(() => import('@/components/analytics/SpendingHeatmap').then(m => ({ default: m.SpendingHeatmap })));
const SeasonalityChart = lazy(() => import('@/components/analytics/SeasonalityChart').then(m => ({ default: m.SeasonalityChart })));
const MonthComparisonChart = lazy(() => import('@/components/analytics/MonthComparisonChart').then(m => ({ default: m.MonthComparisonChart })));
const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.DashboardCharts })));
const BudgetProjectionChart = lazy(() => import('@/components/analytics/BudgetProjectionChart').then(m => ({ default: m.BudgetProjectionChart })));
const ExpensePredictions = lazy(() => import('@/components/analytics/ExpensePredictions').then(m => ({ default: m.ExpensePredictions })));
const CashFlowProjection = lazy(() => import('@/components/analytics/CashFlowProjection').then(m => ({ default: m.CashFlowProjection })));

import { useDashboardStats } from '@/hooks/data/useDashboardStats';

const AnalyticsSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-[300px]" />
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-[380px]" />
      <Skeleton className="h-[400px]" />
    </div>
  </div>
);

export default function Analytics() {
  const { language } = useLanguage();
  const { data: allExpenses, isLoading } = useExpenses();
  const { data: stats } = useDashboardStats();

  return (
    <Layout>
      <div className="page-container section-gap">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'es' ? 'Análisis Financiero' : 'Financial Analytics'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'es' ? 'Gráficos, tendencias, correlaciones y predicciones' : 'Charts, trends, correlations & predictions'}
            </p>
          </div>
        </div>

        <Suspense fallback={<AnalyticsSkeleton />}>
          <div className="space-y-6">
            <DashboardCharts
              categoryBreakdown={stats?.categoryBreakdown || []}
              clientBreakdown={stats?.clientBreakdown || []}
              monthlyTrends={stats?.monthlyTrends || []}
              isLoading={isLoading}
            />
            <SmartMonthlyReport />
            <IncomeVsExpensesChart />
            <div className="grid gap-6 lg:grid-cols-2">
              <SavingsRateChart />
              <YearOverYearComparison />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <CategoryTrendsChart />
              <FinancialHealthRadar />
            </div>
            <CashFlowSankey />
            <div className="grid gap-6 lg:grid-cols-2">
              <ProjectProfitability />
              <ClientProfitability />
            </div>
            <FinancialCorrelations />
            <div className="grid gap-6 lg:grid-cols-2">
              <MoneyMomentumScore />
              <WhatIfSimulator />
            </div>
            <NegotiationScriptGenerator />
            <BudgetProjectionChart />
            <div className="grid gap-6 lg:grid-cols-2">
              <ExpensePredictions expenses={allExpenses || []} />
              <CashFlowProjection />
            </div>
            <TransactionTimeline />
            <div className="grid gap-6 lg:grid-cols-2">
              <NetWorthTreemap />
              <SpendingHeatmap expenses={allExpenses || []} isLoading={isLoading} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <SeasonalityChart expenses={allExpenses || []} isLoading={isLoading} />
              <MonthComparisonChart expenses={allExpenses || []} isLoading={isLoading} />
            </div>
          </div>
        </Suspense>
      </div>
    </Layout>
  );
}
