import { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Receipt, Users, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useExpensesRealtime } from '@/hooks/data/useExpensesRealtime';
import { ExportDialog } from '@/components/export/ExportDialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePageVisitTracker } from '@/hooks/data/useMissionAutoTracker';
import { InteractiveWelcome } from '@/components/guidance/InteractiveWelcome';
import { ProgressiveOnboarding } from '@/components/onboarding/ProgressiveOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { OrganizedDashboard } from '@/components/focus';
import { DashboardViewTabs } from '@/components/dashboard/DashboardViewTabs';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { YearTimelineChart } from '@/components/dashboard/YearTimelineChart';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { MonthDetailPanel } from '@/components/dashboard/MonthDetailPanel';
import { DashboardNotificationHub } from '@/components/dashboard/DashboardNotificationHub';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDashboard } from '@/components/dashboard/MobileDashboard';
import { QuickCaptureDialog } from '@/components/dialogs/QuickCaptureDialog';
import { DashboardGamificationWidget } from '@/components/gamification';
import { MissionControl } from '@/components/dashboard/MissionControl';
import { ProfileCompletionNudge } from '@/components/profile/ProfileCompletionNudge';
import { ProfileExtenderDialog } from '@/components/profile/ProfileExtenderDialog';
import { LifeProfileSection } from '@/hooks/data/useLifeProfile';
import { EcosystemSection } from '@/components/ecosystem/EcosystemSection';
import { DashboardNavigator } from '@/components/dashboard/DashboardNavigator';
import { useDashboardDeepLinks } from '@/hooks/utils/useDashboardDeepLinks';
import { DataInventoryPanel } from '@/components/dashboard/DataInventoryPanel';

// Lazy load only dashboard-specific components
const WorkflowSummaryWidget = lazy(() => import('@/components/dashboard/WorkflowSummaryWidget').then(m => ({ default: m.WorkflowSummaryWidget })));
const MonthlyBillsWidget = lazy(() => import('@/components/dashboard/MonthlyBillsWidget').then(m => ({ default: m.MonthlyBillsWidget })));
const ProactiveAlertsWidget = lazy(() => import('@/components/dashboard/ProactiveAlertsWidget').then(m => ({ default: m.ProactiveAlertsWidget })));
const FinancialAutopilot = lazy(() => import('@/components/dashboard/FinancialAutopilot').then(m => ({ default: m.FinancialAutopilot })));
const LazyBankingSummaryCard = lazy(() => import('@/components/banking/BankingSummaryCard').then(m => ({ default: m.BankingSummaryCard })));
const FinancialNarrativeCard = lazy(() => import('@/components/dashboard/FinancialNarrativeCard'));

export default function Dashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Timeline state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // UI state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  // Profile extension state
  const [profileExtenderOpen, setProfileExtenderOpen] = useState(false);
  const [selectedProfileSection, setSelectedProfileSection] = useState<LifeProfileSection>('family');
  
  const handleStartProfileSection = useCallback((section: LifeProfileSection) => {
    setSelectedProfileSection(section);
    setProfileExtenderOpen(true);
  }, []);

  const { viewMode, setViewMode, isLoading: prefsLoading } = useDisplayPreferences();

  // Deep-link & Stripe redirect handling (extracted)
  const { deepLinkArea, deepLinkTab, deepLinkKey } = useDashboardDeepLinks(viewMode, setViewMode);

  // Track dashboard visit for missions
  usePageVisitTracker('view_dashboard');

  // Enable real-time sync for expenses
  useExpensesRealtime();

  const { data: stats, isLoading } = useDashboardStats();
  const { data: allExpenses } = useExpenses();

  const handleAddIncome = useCallback(() => navigate('/income'), [navigate]);
  const handleAddExpense = useCallback(() => navigate('/expenses'), [navigate]);

  // Check if first visit to show guide
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('dashboard-timeline-guide-seen');
    if (!hasSeenGuide && user) {
      setShowGuide(true);
      localStorage.setItem('dashboard-timeline-guide-seen', 'true');
    }
  }, [user]);

  const isMobile = useIsMobile();
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);

  // Mobile-optimized dashboard
  if (isMobile) {
    return (
      <Layout>
        <div className="page-container section-gap mobile-compact">
          <MobileDashboard onQuickCapture={() => setQuickCaptureOpen(true)} />
        </div>
        <ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} expenses={allExpenses || []} />
        <QuickCaptureDialog open={quickCaptureOpen} onClose={() => setQuickCaptureOpen(false)} />
      </Layout>
    );
  }

  return (
    <Layout>
      <TooltipProvider delayDuration={200}>
        <div className="page-container section-gap">
          
          {/* 1. Live Clock */}
          <LiveClock />

          {/* 2. Notification Hub — THE ONLY alert center */}
          <DashboardNotificationHub />

          {/* 3. Onboarding (only for new users, auto-hides) */}
          <ProgressiveOnboarding />

          {/* 4. Profile Extender Dialog */}
          <ProfileExtenderDialog
            open={profileExtenderOpen}
            onOpenChange={setProfileExtenderOpen}
            section={selectedProfileSection}
          />
          
          {/* 5. Interactive Guide (first visit only) */}
          {showGuide && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <InteractiveWelcome />
            </div>
          )}

          {/* 6. Quick Actions — ALWAYS VISIBLE */}
          <Card className="border-dashed" data-section="quick-actions">
            <CardContent className="py-3">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => navigate('/chaos')} size="sm" className="gap-2">
                  <Upload className="h-4 w-4" /> {t('dashboard.uploadDocument')}
                </Button>
                <Button onClick={() => navigate('/expenses')} variant="outline" size="sm" className="gap-2">
                  <Receipt className="h-4 w-4" /> {t('dashboard.addExpense')}
                </Button>
                <Button onClick={() => navigate('/clients')} variant="outline" size="sm" className="gap-2">
                  <Users className="h-4 w-4" /> {t('dashboard.addClient')}
                </Button>
                <Button onClick={() => setExportDialogOpen(true)} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" /> {t('export.exportButton')}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* 7. Data Inventory */}
          <DataInventoryPanel />

          {/* 8. Mission Control */}
          <MissionControl />

          {/* 9. VIEW TABS — ABOVE the timeline as primary navigation */}
          <DashboardViewTabs 
            activeTab={viewMode === 'organized' ? 'control' : 'resumen'} 
            onTabChange={(tab) => setViewMode(tab === 'control' ? 'organized' : 'classic')} 
          />

          {/* 8. View Content */}
          <AnimatePresence mode="wait">
            {viewMode === 'organized' ? (
              <motion.div
                key="control"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <OrganizedDashboard deepLinkArea={deepLinkArea} deepLinkTab={deepLinkTab} deepLinkKey={deepLinkKey} />
              </motion.div>
            ) : (
              <motion.div
                key="resumen"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Timeline + Month Detail */}
                <div id="timeline" className="side-by-side" data-section="timeline" data-highlight="timeline-section">
                  <div data-highlight="timeline-chart" className="flex flex-col">
                    <YearTimelineChart
                      selectedMonth={selectedMonth}
                      onMonthSelect={setSelectedMonth}
                      selectedYear={selectedYear}
                      onYearChange={setSelectedYear}
                    />
                  </div>
                  <div data-highlight="balance-card">
                    <MonthDetailPanel
                      year={selectedYear}
                      month={selectedMonth}
                      onAddIncome={handleAddIncome}
                      onAddExpense={handleAddExpense}
                    />
                  </div>
                </div>

                {/* Banking Summary */}
                <div id="banking-summary" data-section="banking-summary">
                  <Suspense fallback={<Skeleton className="h-[200px]" />}>
                    <LazyBankingSummaryCard />
                  </Suspense>
                </div>

                {/* Financial Narrative */}
                <div id="financial-narrative" data-section="financial-narrative">
                  <Suspense fallback={<Skeleton className="h-[300px]" />}>
                    <FinancialNarrativeCard />
                  </Suspense>
                </div>

                {/* Ecosystem */}
                <div id="ecosystem" data-section="ecosystem">
                  <EcosystemSection />
                </div>

                {/* Workflow Progress + Bills */}
                <div id="workflows" className="grid gap-4 lg:grid-cols-2" data-section="workflows">
                  <Suspense fallback={<Skeleton className="h-[200px]" />}>
                    <WorkflowSummaryWidget />
                  </Suspense>
                  <Suspense fallback={<Skeleton className="h-[200px]" />}>
                    <MonthlyBillsWidget />
                  </Suspense>
                </div>

                {/* Smart Alerts */}
                <div id="alerts" data-section="alerts">
                  <Suspense fallback={null}>
                    <ProactiveAlertsWidget />
                  </Suspense>
                </div>

                {/* AI Financial Autopilot */}
                <div id="autopilot" data-section="autopilot">
                  <Suspense fallback={<Skeleton className="h-[200px]" />}>
                    <FinancialAutopilot />
                  </Suspense>
                </div>

                {/* Gamification */}
                <div id="gamification" data-section="gamification">
                  <ProfileCompletionNudge onStartSection={handleStartProfileSection} />
                  <DashboardGamificationWidget compact={true} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Navigator */}
          <DashboardNavigator viewMode={viewMode === 'organized' ? 'control' : 'resumen'} />

          <ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} expenses={allExpenses || []} />
        </div>
      </TooltipProvider>
    </Layout>
  );
}
