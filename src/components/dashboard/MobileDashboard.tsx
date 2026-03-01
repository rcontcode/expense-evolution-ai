import { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useNudgeSystem } from '@/hooks/utils/useNudgeSystem';
import { NextActionBanner } from '@/components/dashboard/NextActionBanner';
import { YearTimelineChart } from '@/components/dashboard/YearTimelineChart';
import { MonthDetailPanel } from '@/components/dashboard/MonthDetailPanel';
import { MobileStatsGrid } from '@/components/dashboard/MobileStatsGrid';
import { MobileAlertsBanner } from '@/components/dashboard/MobileAlertsBanner';
import { DashboardViewTabs } from '@/components/dashboard/DashboardViewTabs';
import { ProgressiveOnboarding } from '@/components/onboarding/ProgressiveOnboarding';
import { BetaReminderBanner } from '@/components/beta/BetaReminderBanner';
import { EcosystemOnboarding } from '@/components/ecosystem/EcosystemOnboarding';

const LazyEcosystemWidgets = lazy(() => import('@/components/ecosystem/EcosystemDashboardWidgets'));

const OrganizedDashboard = lazy(() => import('@/components/focus').then(m => ({ default: m.OrganizedDashboard })));

interface MobileDashboardProps {
  onQuickCapture?: () => void;
}

export function MobileDashboard({ onQuickCapture }: MobileDashboardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();
  const { pendingDocuments, incompleteExpenses, totalClients, totalIncomes } = useNudgeSystem();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeView, setActiveView] = useState<'resumen' | 'control'>('resumen');

  const handleAddIncome = useCallback(() => navigate('/income'), [navigate]);
  const handleAddExpense = useCallback(() => navigate('/expenses'), [navigate]);

  const monthlyIncome = stats?.billableExpenses || 0;
  const monthlyExpenses = stats?.monthlyTotal || 0;
  const monthlyBalance = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;

  return (
    <div className="mobile-page mobile-gap space-y-4">
      <MobileAlertsBanner
        pendingDocuments={pendingDocuments}
        incompleteExpenses={incompleteExpenses}
      />

      <BetaReminderBanner />
      <ProgressiveOnboarding />
      <EcosystemOnboarding />
      

      <MobileStatsGrid
        isLoading={isLoading}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        monthlyBalance={monthlyBalance}
        savingsRate={savingsRate}
      />

      <DashboardViewTabs activeTab={activeView} onTabChange={setActiveView} />

      <AnimatePresence mode="wait">
        {activeView === 'resumen' ? (
          <motion.div
            key="resumen"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {(pendingDocuments > 0 || incompleteExpenses > 0 || totalClients === 0) && (
              <NextActionBanner
                pendingDocuments={pendingDocuments}
                incompleteExpenses={incompleteExpenses}
                totalClients={totalClients}
                totalIncomes={totalIncomes}
                totalExpenses={stats?.totalExpenses || 0}
              />
            )}

            <div className="overflow-x-auto -mx-4 px-4">
              <YearTimelineChart
                selectedMonth={selectedMonth}
                onMonthSelect={setSelectedMonth}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            </div>

            <MonthDetailPanel
              year={selectedYear}
              month={selectedMonth}
              onAddIncome={handleAddIncome}
              onAddExpense={handleAddExpense}
            />

            <Suspense fallback={null}>
              <LazyEcosystemWidgets />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            key="control"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<Skeleton className="h-96" />}>
              <OrganizedDashboard />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
