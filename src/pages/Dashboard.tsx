import { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Receipt, Users, Download } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useSubscription } from '@/hooks/data/useSubscription';
import { toast } from 'sonner';
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
import { BetaReminderBanner } from '@/components/beta/BetaReminderBanner';
import { NextActionBanner } from '@/components/dashboard/NextActionBanner';
import { useNudgeSystem } from '@/hooks/utils/useNudgeSystem';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDashboard } from '@/components/dashboard/MobileDashboard';
import { QuickCaptureDialog } from '@/components/dialogs/QuickCaptureDialog';
import { DashboardGamificationWidget } from '@/components/gamification';
import { ProfileCompletionNudge } from '@/components/profile/ProfileCompletionNudge';
import { ProfileExtenderDialog } from '@/components/profile/ProfileExtenderDialog';
import { LifeProfileSection } from '@/hooks/data/useLifeProfile';
import { DashboardNotificationHub } from '@/components/dashboard/DashboardNotificationHub';
import { EcosystemOnboarding } from '@/components/ecosystem/EcosystemOnboarding';
import { EcosystemSection } from '@/components/ecosystem/EcosystemSection';
import { DashboardNavigator } from '@/components/dashboard/DashboardNavigator';

// Lazy load only dashboard-specific components
const WorkflowSummaryWidget = lazy(() => import('@/components/dashboard/WorkflowSummaryWidget').then(m => ({ default: m.WorkflowSummaryWidget })));
const MonthlyBillsWidget = lazy(() => import('@/components/dashboard/MonthlyBillsWidget').then(m => ({ default: m.MonthlyBillsWidget })));
const ProactiveAlertsWidget = lazy(() => import('@/components/dashboard/ProactiveAlertsWidget').then(m => ({ default: m.ProactiveAlertsWidget })));

// Tab → route redirect map
const TAB_REDIRECTS: Record<string, string> = {
  charts: '/analytics',
  analytics: '/analytics',
  budget: '/budget',
  budgets: '/budget',
  mentorship: '/mentorship',
  goals: '/budget?tab=savings',
  tax: '/tax-optimizer',
  mileage: '/mileage',
  subscriptions: '/subscriptions',
  fire: '/investments',
  debt: '/investments',
  portfolio: '/investments',
  education: '/mentorship',
};

export default function Dashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const { refreshSubscription } = useSubscription();
  const { viewMode, setViewMode, isLoading: prefsLoading } = useDisplayPreferences();

  // Handle subscription success/cancel from Stripe redirect
  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscription');
    if (subscriptionStatus === 'success') {
      toast.success('¡Suscripción activada! 🎉', {
        description: 'Tu plan ha sido actualizado correctamente',
      });
      refreshSubscription();
      setSearchParams({});
    } else if (subscriptionStatus === 'cancelled') {
      toast.info('Pago cancelado', {
        description: 'Puedes intentar de nuevo cuando quieras',
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refreshSubscription]);

  // Deep-link redirect: ?tab=X → dedicated route
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) return;
    const redirectTo = TAB_REDIRECTS[tab];
    if (redirectTo) {
      setSearchParams({});
      navigate(redirectTo, { replace: true });
    }
  }, [searchParams, setSearchParams, navigate]);

  // Track dashboard visit for missions
  usePageVisitTracker('view_dashboard');

  // Enable real-time sync for expenses
  useExpensesRealtime();

  const { data: stats, isLoading } = useDashboardStats();
  const { data: allExpenses } = useExpenses();
  const { pendingDocuments, incompleteExpenses, totalClients, totalIncomes } = useNudgeSystem();

  const handleAddIncome = useCallback(() => {
    navigate('/income');
  }, [navigate]);

  const handleAddExpense = useCallback(() => {
    navigate('/expenses');
  }, [navigate]);

  // Check if first visit to show guide
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('dashboard-timeline-guide-seen');
    if (!hasSeenGuide && user) {
      setShowGuide(true);
      localStorage.setItem('dashboard-timeline-guide-seen', 'true');
    }
  }, [user]);

  const isMobile = useIsMobile();
  
  // Quick capture dialog state for mobile
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);

  // Mobile-optimized dashboard
  if (isMobile) {
    return (
      <Layout>
        <div className="p-4">
          <MobileDashboard onQuickCapture={() => setQuickCaptureOpen(true)} />
        </div>
        <ExportDialog 
          open={exportDialogOpen} 
          onClose={() => setExportDialogOpen(false)} 
          expenses={allExpenses || []} 
        />
        <QuickCaptureDialog 
          open={quickCaptureOpen} 
          onClose={() => setQuickCaptureOpen(false)} 
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <TooltipProvider delayDuration={200}>
        <div className="page-container section-gap">
          
          {/* Live Date & Time */}
          <LiveClock />

          {/* Notification Hub */}
          <DashboardNotificationHub />

          {/* Beta Reminder Banner */}
          <BetaReminderBanner />
          
          {/* Next Action Nudge Banner */}
          <NextActionBanner 
            pendingDocuments={pendingDocuments}
            incompleteExpenses={incompleteExpenses}
            totalClients={totalClients}
            totalIncomes={totalIncomes}
            totalExpenses={stats?.totalExpenses || 0}
          />
          
          {/* Progressive Onboarding */}
          <ProgressiveOnboarding />
          
          {/* Ecosystem Onboarding */}
          <EcosystemOnboarding />
          
          {/* Profile Extender Dialog */}
          <ProfileExtenderDialog
            open={profileExtenderOpen}
            onOpenChange={setProfileExtenderOpen}
            section={selectedProfileSection}
          />
          
          {/* Interactive Guide */}
          {showGuide && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <InteractiveWelcome />
            </div>
          )}
          
          {/* Timeline + Month Detail */}
          <div className="side-by-side" data-section="timeline" data-highlight="timeline-section">
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

          {/* Ecosystem */}
          <div data-section="ecosystem">
            <EcosystemSection />
          </div>

          {/* ===== VIEW TABS ===== */}
          <DashboardViewTabs 
            activeTab={viewMode === 'organized' ? 'control' : 'resumen'} 
            onTabChange={(tab) => setViewMode(tab === 'control' ? 'organized' : 'classic')} 
          />

          <AnimatePresence mode="wait">
            {viewMode === 'organized' ? (
              <motion.div
                key="control"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <OrganizedDashboard />
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
                {/* Quick Actions */}
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

                {/* Workflow Progress + Bills */}
                <div className="grid gap-4 lg:grid-cols-2" data-section="workflows">
                  <Suspense fallback={<Skeleton className="h-[200px]" />}>
                    <WorkflowSummaryWidget />
                  </Suspense>
                  <Suspense fallback={<Skeleton className="h-[200px]" />}>
                    <MonthlyBillsWidget />
                  </Suspense>
                </div>

                {/* Smart Alerts + Gamification */}
                <div data-section="alerts">
                  <Suspense fallback={null}>
                    <ProactiveAlertsWidget />
                  </Suspense>
                </div>
                <div data-section="gamification">
                  <ProfileCompletionNudge onStartSection={handleStartProfileSection} />
                  <DashboardGamificationWidget compact={true} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Navigator */}
          <DashboardNavigator viewMode={viewMode === 'organized' ? 'control' : 'resumen'} />

          <ExportDialog 
            open={exportDialogOpen} 
            onClose={() => setExportDialogOpen(false)} 
            expenses={allExpenses || []} 
          />
        </div>
      </TooltipProvider>
    </Layout>
  );
}
