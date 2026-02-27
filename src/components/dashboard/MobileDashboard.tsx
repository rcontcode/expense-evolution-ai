import { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useNudgeSystem } from '@/hooks/utils/useNudgeSystem';
import { NextActionBanner } from '@/components/dashboard/NextActionBanner';
import { YearTimelineChart } from '@/components/dashboard/YearTimelineChart';
import { MonthDetailPanel } from '@/components/dashboard/MonthDetailPanel';
import { MobileStatsGrid } from '@/components/dashboard/MobileStatsGrid';
import { MobileAlertsBanner } from '@/components/dashboard/MobileAlertsBanner';
import { ProgressiveOnboarding } from '@/components/onboarding/ProgressiveOnboarding';
import { BetaReminderBanner } from '@/components/beta/BetaReminderBanner';
import { BundleActiveBadge } from '@/components/ecosystem/BundleActiveBadge';
import { EcosystemOnboarding } from '@/components/ecosystem/EcosystemOnboarding';
import { EcosystemInsights } from '@/components/ecosystem/EcosystemInsights';
import { EcosystemWeeklyDigest } from '@/components/ecosystem/EcosystemWeeklyDigest';
import { EcosystemHealthScore } from '@/components/ecosystem/EcosystemHealthScore';

import { EcosystemPredictiveAlerts } from '@/components/ecosystem/EcosystemPredictiveAlerts';
import { EcosystemMonthlyReport } from '@/components/ecosystem/EcosystemMonthlyReport';
import { EcosystemAchievements } from '@/components/ecosystem/EcosystemAchievements';
import { EcosystemNotifications } from '@/components/ecosystem/EcosystemNotifications';
import { EcosystemStreaks } from '@/components/ecosystem/EcosystemStreaks';
import { EcosystemCoaching } from '@/components/ecosystem/EcosystemCoaching';
import { EcosystemAICoaching } from '@/components/ecosystem/EcosystemAICoaching';
import { EcosystemLeaderboard } from '@/components/ecosystem/EcosystemLeaderboard';
import { EcosystemInlineWidgets } from '@/components/ecosystem/EcosystemInlineWidgets';

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAddIncome = useCallback(() => navigate('/income'), [navigate]);
  const handleAddExpense = useCallback(() => navigate('/expenses'), [navigate]);

  const monthlyIncome = stats?.billableExpenses || 0;
  const monthlyExpenses = stats?.monthlyTotal || 0;
  const monthlyBalance = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;

  return (
    <div className="mobile-page mobile-gap">
      <MobileAlertsBanner
        pendingDocuments={pendingDocuments}
        incompleteExpenses={incompleteExpenses}
      />

      <BetaReminderBanner />
      <ProgressiveOnboarding />
      <EcosystemOnboarding />
      <BundleActiveBadge variant="full" />

      <MobileStatsGrid
        isLoading={isLoading}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        monthlyBalance={monthlyBalance}
        savingsRate={savingsRate}
      />

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

      <EcosystemNotifications />
      <EcosystemAICoaching />
      <EcosystemCoaching />
      <EcosystemPredictiveAlerts />
      <EcosystemStreaks />
      <EcosystemInlineWidgets />
      <EcosystemWeeklyDigest />
      <EcosystemHealthScore />
      <EcosystemLeaderboard />
      <EcosystemAchievements />
      <EcosystemMonthlyReport />
      <EcosystemInsights />
      

      <Button
        variant="outline"
        className="w-full gap-2 border-dashed"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        <BarChart3 className="h-4 w-4" />
        {language === 'es' ? 'Herramientas Avanzadas' : 'Advanced Tools'}
      </Button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
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
