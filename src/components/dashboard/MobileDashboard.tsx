import { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { MissionControl } from '@/components/dashboard/MissionControl';

const LazyEcosystemWidgets = lazy(() => import('@/components/ecosystem/EcosystemDashboardWidgets'));
const LazyBankingSummaryCard = lazy(() => import('@/components/banking/BankingSummaryCard').then(m => ({ default: m.BankingSummaryCard })));
const LazyFinancialNarrative = lazy(() => import('@/components/dashboard/FinancialNarrativeCard'));
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
    <div className="mobile-compact space-y-2 pb-6">
      <LiveClock />

      <DashboardNotificationHub />

      <ProgressiveOnboarding />

      <MobileStatsGrid
        isLoading={isLoading}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        monthlyBalance={monthlyBalance}
        savingsRate={savingsRate}
      />

      <MissionControl compact />

      <DashboardViewTabs activeTab={activeView} onTabChange={setActiveView} />
      
      <MobileSectionPills activeView={activeView} />

      {/* Simple conditional render — no AnimatePresence to avoid scroll bounce */}
      {activeView === 'resumen' ? (
        <div className="space-y-2">
          <div className="overflow-x-auto -mx-3 px-3" data-section="timeline">
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
            <LazyBankingSummaryCard compact />
          </Suspense>

          <Suspense fallback={null}>
            <LazyFinancialNarrative />
          </Suspense>

          <div data-section="gamification">
            <ProfileCompletionNudge />
            <DashboardGamificationWidget compact={true} />
          </div>

          <div data-section="ecosystem">
            <Suspense fallback={null}>
              <LazyEcosystemWidgets />
            </Suspense>
          </div>
        </div>
      ) : (
        <Suspense fallback={<Skeleton className="h-96" />}>
          <OrganizedDashboard />
        </Suspense>
      )}
    </div>
  );
}
