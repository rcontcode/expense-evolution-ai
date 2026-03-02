import { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { DashboardNotificationHub } from '@/components/dashboard/DashboardNotificationHub';
import { YearTimelineChart } from '@/components/dashboard/YearTimelineChart';
import { MonthDetailPanel } from '@/components/dashboard/MonthDetailPanel';
import { MobileStatsGrid } from '@/components/dashboard/MobileStatsGrid';
import { DashboardViewTabs } from '@/components/dashboard/DashboardViewTabs';
import { ProgressiveOnboarding } from '@/components/onboarding/ProgressiveOnboarding';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { ProfileCompletionNudge } from '@/components/profile/ProfileCompletionNudge';
import { DashboardGamificationWidget } from '@/components/gamification';
import { MobileSectionPills } from '@/components/dashboard/MobileSectionPills';

const LazyEcosystemWidgets = lazy(() => import('@/components/ecosystem/EcosystemDashboardWidgets'));
const OrganizedDashboard = lazy(() => import('@/components/focus').then(m => ({ default: m.OrganizedDashboard })));

interface MobileDashboardProps {
  onQuickCapture?: () => void;
}

export function MobileDashboard({ onQuickCapture }: MobileDashboardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeView, setActiveView] = useState<'resumen' | 'control'>('resumen');

  const handleAddIncome = useCallback(() => navigate('/income'), [navigate]);
  const handleAddExpense = useCallback(() => navigate('/expenses'), [navigate]);

  const monthlyIncome = stats?.monthlyIncome || 0;
  const monthlyExpenses = stats?.monthlyTotal || 0;
  const monthlyBalance = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;

  return (
    <div className="mobile-page mobile-gap space-y-4">
      <div className="flex items-center justify-between">
        <LiveClock />
      </div>

      {/* THE ONLY alert center — no more MobileAlertsBanner or NextActionBanner */}
      <DashboardNotificationHub />

      {/* Onboarding (auto-hides when complete) */}
      <ProgressiveOnboarding />

      <MobileStatsGrid
        isLoading={isLoading}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        monthlyBalance={monthlyBalance}
        savingsRate={savingsRate}
      />

      {/* VIEW TABS — above content as primary navigation */}
      <DashboardViewTabs activeTab={activeView} onTabChange={setActiveView} />
      
      {/* Section navigation pills */}
      <MobileSectionPills activeView={activeView} />

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
            <div className="overflow-x-auto -mx-4 px-4" data-section="timeline">
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

            <div data-section="gamification">
              <ProfileCompletionNudge />
              <DashboardGamificationWidget compact={true} />
            </div>

            <div data-section="ecosystem">
              <Suspense fallback={null}>
                <LazyEcosystemWidgets />
              </Suspense>
            </div>
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
