import { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useHighlightOnArrival } from '@/hooks/utils/useHighlightOnArrival';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Receipt, Users, Download, BarChart3 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useSubscription } from '@/hooks/data/useSubscription';
import { toast } from 'sonner';
import { useClients } from '@/hooks/data/useClients';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useExpensesRealtime } from '@/hooks/data/useExpensesRealtime';
import { useTaxCalculations } from '@/hooks/data/useTaxCalculations';
import { useProfile } from '@/hooks/data/useProfile';
import { useMileageSummary } from '@/hooks/data/useMileage';
import { TaxSummaryCards } from '@/components/dashboard/TaxSummaryCards';
import { ExportDialog } from '@/components/export/ExportDialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePageVisitTracker } from '@/hooks/data/useMissionAutoTracker';
import { InteractiveWelcome } from '@/components/guidance/InteractiveWelcome';
import { ProgressiveOnboarding } from '@/components/onboarding/ProgressiveOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { OrganizedDashboard } from '@/components/focus';
import { AdvancedToolsNav } from '@/components/dashboard/AdvancedToolsNav';
import { DashboardViewTabs } from '@/components/dashboard/DashboardViewTabs';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { YearTimelineChart } from '@/components/dashboard/YearTimelineChart';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { MonthDetailPanel } from '@/components/dashboard/MonthDetailPanel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

// Lazy load chart components for better performance
const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.DashboardCharts })));
const MileageTabContent = lazy(() => import('@/components/dashboard/MileageTabContent').then(m => ({ default: m.MileageTabContent })));
const SubscriptionTracker = lazy(() => import('@/components/subscriptions/SubscriptionTracker').then(m => ({ default: m.SubscriptionTracker })));
const TaxOptimizerCard = lazy(() => import('@/components/dashboard/TaxOptimizerCard').then(m => ({ default: m.TaxOptimizerCard })));
const SavingsOptimizerSection = lazy(() => import('@/components/tax/SavingsOptimizerSection').then(m => ({ default: m.SavingsOptimizerSection })));
const FIRECalculatorCard = lazy(() => import('@/components/dashboard/FIRECalculatorCard').then(m => ({ default: m.FIRECalculatorCard })));
const DebtManagerCard = lazy(() => import('@/components/dashboard/DebtManagerCard').then(m => ({ default: m.DebtManagerCard })));
const PortfolioTrackerCard = lazy(() => import('@/components/dashboard/PortfolioTrackerCard').then(m => ({ default: m.PortfolioTrackerCard })));
const PersonalizedInvestmentTips = lazy(() => import('@/components/investments/PersonalizedInvestmentTips').then(m => ({ default: m.PersonalizedInvestmentTips })));
const SpendingHeatmap = lazy(() => import('@/components/analytics/SpendingHeatmap').then(m => ({ default: m.SpendingHeatmap })));
const SeasonalityChart = lazy(() => import('@/components/analytics/SeasonalityChart').then(m => ({ default: m.SeasonalityChart })));
const MonthComparisonChart = lazy(() => import('@/components/analytics/MonthComparisonChart').then(m => ({ default: m.MonthComparisonChart })));
const FinancialHealthRadar = lazy(() => import('@/components/analytics/FinancialHealthRadar').then(m => ({ default: m.FinancialHealthRadar })));
const CashFlowSankey = lazy(() => import('@/components/analytics/CashFlowSankey').then(m => ({ default: m.CashFlowSankey })));
const ProjectProfitability = lazy(() => import('@/components/analytics/ProjectProfitability').then(m => ({ default: m.ProjectProfitability })));
const CashFlowProjection = lazy(() => import('@/components/analytics/CashFlowProjection').then(m => ({ default: m.CashFlowProjection })));
const NetWorthTreemap = lazy(() => import('@/components/analytics/NetWorthTreemap').then(m => ({ default: m.NetWorthTreemap })));
const TransactionTimeline = lazy(() => import('@/components/analytics/TransactionTimeline').then(m => ({ default: m.TransactionTimeline })));
const ClientProfitability = lazy(() => import('@/components/analytics/ClientProfitability').then(m => ({ default: m.ClientProfitability })));
const FinancialCorrelations = lazy(() => import('@/components/analytics/FinancialCorrelations').then(m => ({ default: m.FinancialCorrelations })));
const ExpensePredictions = lazy(() => import('@/components/analytics/ExpensePredictions').then(m => ({ default: m.ExpensePredictions })));
const IncomeVsExpensesChart = lazy(() => import('@/components/analytics/IncomeVsExpensesChart').then(m => ({ default: m.IncomeVsExpensesChart })));
const SavingsRateChart = lazy(() => import('@/components/analytics/SavingsRateChart').then(m => ({ default: m.SavingsRateChart })));
const YearOverYearComparison = lazy(() => import('@/components/analytics/YearOverYearComparison').then(m => ({ default: m.YearOverYearComparison })));
const CategoryTrendsChart = lazy(() => import('@/components/analytics/CategoryTrendsChart').then(m => ({ default: m.CategoryTrendsChart })));
const BudgetProjectionChart = lazy(() => import('@/components/analytics/BudgetProjectionChart').then(m => ({ default: m.BudgetProjectionChart })));
const CashflowQuadrantCard = lazy(() => import('@/components/mentorship/CashflowQuadrantCard').then(m => ({ default: m.CashflowQuadrantCard })));
const FinancialFreedomCard = lazy(() => import('@/components/mentorship/FinancialFreedomCard').then(m => ({ default: m.FinancialFreedomCard })));
const PayYourselfFirstCard = lazy(() => import('@/components/mentorship/PayYourselfFirstCard').then(m => ({ default: m.PayYourselfFirstCard })));
const DebtClassificationCard = lazy(() => import('@/components/mentorship/DebtClassificationCard').then(m => ({ default: m.DebtClassificationCard })));
const FinancialJournalCard = lazy(() => import('@/components/mentorship/FinancialJournalCard').then(m => ({ default: m.FinancialJournalCard })));
const FinancialHabitsCard = lazy(() => import('@/components/mentorship/FinancialHabitsCard').then(m => ({ default: m.FinancialHabitsCard })));
const FinancialEducationCard = lazy(() => import('@/components/mentorship/FinancialEducationCard').then(m => ({ default: m.FinancialEducationCard })));
const SMARTGoalsCard = lazy(() => import('@/components/mentorship/SMARTGoalsCard').then(m => ({ default: m.SMARTGoalsCard })));
const SavingsGoalsSection = lazy(() => import('@/components/settings/SavingsGoalsSection').then(m => ({ default: m.SavingsGoalsSection })));
const WhatIfSimulator = lazy(() => import('@/components/dashboard/WhatIfSimulator').then(m => ({ default: m.WhatIfSimulator })));
const MoneyMomentumScore = lazy(() => import('@/components/dashboard/MoneyMomentumScore').then(m => ({ default: m.MoneyMomentumScore })));
const NegotiationScriptGenerator = lazy(() => import('@/components/dashboard/NegotiationScriptGenerator').then(m => ({ default: m.NegotiationScriptGenerator })));
const SmartMonthlyReport = lazy(() => import('@/components/dashboard/SmartMonthlyReport').then(m => ({ default: m.SmartMonthlyReport })));
const ProactiveAlertsWidget = lazy(() => import('@/components/dashboard/ProactiveAlertsWidget').then(m => ({ default: m.ProactiveAlertsWidget })));
const GlobalLearningChart = lazy(() => import('@/components/mentorship/GlobalLearningChart').then(m => ({ default: m.GlobalLearningChart })));
const ReadingReminderSettings = lazy(() => import('@/components/mentorship/ReadingReminderSettings').then(m => ({ default: m.ReadingReminderSettings })));
const ReadingPaceComparison = lazy(() => import('@/components/mentorship/ReadingPaceComparison').then(m => ({ default: m.ReadingPaceComparison })));
const MonthlyPlanCard = lazy(() => import('@/components/budget/MonthlyPlanCard').then(m => ({ default: m.MonthlyPlanCard })));
const GlobalBudgetCard = lazy(() => import('@/components/dashboard/GlobalBudgetCard').then(m => ({ default: m.GlobalBudgetCard })));
const BudgetHistoryChart = lazy(() => import('@/components/dashboard/BudgetHistoryChart').then(m => ({ default: m.BudgetHistoryChart })));
const CategoryBudgetsCard = lazy(() => import('@/components/dashboard/CategoryBudgetsCard').then(m => ({ default: m.CategoryBudgetsCard })));
const BudgetAlertsCard = lazy(() => import('@/components/dashboard/BudgetAlertsCard').then(m => ({ default: m.BudgetAlertsCard })));
const CategoryYearComparison = lazy(() => import('@/components/analytics/CategoryYearComparison').then(m => ({ default: m.CategoryYearComparison })));
const WorkflowSummaryWidget = lazy(() => import('@/components/dashboard/WorkflowSummaryWidget').then(m => ({ default: m.WorkflowSummaryWidget })));
const CompletenessCard = lazy(() => import('@/components/dashboard/CompletenessCard').then(m => ({ default: m.CompletenessCard })));
const WorkflowVisualizer = lazy(() => import('@/components/guidance/WorkflowVisualizer').then(m => ({ default: m.WorkflowVisualizer })));
const MonthlyBillsWidget = lazy(() => import('@/components/dashboard/MonthlyBillsWidget').then(m => ({ default: m.MonthlyBillsWidget })));

// Skeleton fallback for lazy loaded components
const ChartsSkeleton = () => (
  <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-[380px]" />
      <Skeleton className="h-[380px]" />
    </div>
    <Skeleton className="h-[380px]" />
  </div>
);

const MileageSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-3">
    <Skeleton className="h-32" />
    <Skeleton className="h-32" />
    <Skeleton className="h-32" />
  </div>
);

const AnalyticsSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-[300px]" />
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-[380px]" />
      <Skeleton className="h-[400px]" />
    </div>
  </div>
);

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
  const [showAllTools, setShowAllTools] = useState(false);
  const [activeTab, setActiveTab] = useState('charts');
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

  const { shouldHighlight, getHighlightProps } = useHighlightOnArrival();

  // Deep-linking: open the Control Center on a specific tab (used by InteractiveWelcome)
  useEffect(() => {
    const tab = searchParams.get('tab');
    const allowedTabs = [
      'charts',
      'analytics',
      'budget',
      'budgets',
      'mentorship',
      'goals',
      'tax',
      'mileage',
      'subscriptions',
      'fire',
      'debt',
      'portfolio',
      'education',
    ];

    if (!tab || !allowedTabs.includes(tab)) return;

    setShowAllTools(true);
    setActiveTab(tab === 'budget' ? 'budgets' : tab);

    requestAnimationFrame(() => {
      document.getElementById('control-center')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [searchParams]);

  // Track dashboard visit for missions
  usePageVisitTracker('view_dashboard');

  // Enable real-time sync for expenses
  useExpensesRealtime();

  const { data: stats, isLoading } = useDashboardStats();
  const { data: clients } = useClients();
  const { data: allExpenses } = useExpenses();
  const { taxSummary } = useTaxCalculations(allExpenses || []);
  const { data: mileageSummary, isLoading: mileageLoading } = useMileageSummary();
  const { data: profile } = useProfile();
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

          {/* Notification Hub — persistent, visible alerts center */}
          <DashboardNotificationHub />

          {/* Beta Reminder Banner - Gentle motivational prompts */}
          <BetaReminderBanner />
          
          {/* Next Action Nudge Banner */}
          <NextActionBanner 
            pendingDocuments={pendingDocuments}
            incompleteExpenses={incompleteExpenses}
            totalClients={totalClients}
            totalIncomes={totalIncomes}
            totalExpenses={stats?.totalExpenses || 0}
          />
          
          {/* Progressive Onboarding - Mission-based for new users */}
          <ProgressiveOnboarding />
          
          {/* Ecosystem Onboarding - one-time flow */}
          <EcosystemOnboarding />
          
          {/* Profile Extender Dialog */}
          <ProfileExtenderDialog
            open={profileExtenderOpen}
            onOpenChange={setProfileExtenderOpen}
            section={selectedProfileSection}
          />
          
          {/* Interactive Guide - Shown on first visit or on demand */}
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

          {/* Ecosystem — Collapsible section for Bundle users */}
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

                {/* Tools Section — Clean, categorized */}
                <div data-section="advanced-tools" data-highlight="control-center">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent shadow-md">
                      <BarChart3 className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h2 className="text-lg font-bold">
                      {language === 'es' ? 'Herramientas' : 'Tools'}
                    </h2>
                  </div>
                  
                  <AdvancedToolsNav 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab}
                    shouldHighlight={shouldHighlight}
                  />

                  <div className="mt-4">
                    {activeTab === 'charts' && (
                      <div className={cn("space-y-4", getHighlightProps('charts').className)} ref={getHighlightProps('charts').ref as any}>
                        <Suspense fallback={<ChartsSkeleton />}>
                          <DashboardCharts
                            categoryBreakdown={stats?.categoryBreakdown || []}
                            clientBreakdown={stats?.clientBreakdown || []}
                            monthlyTrends={stats?.monthlyTrends || []}
                            isLoading={isLoading}
                          />
                        </Suspense>
                      </div>
                    )}

                    {activeTab === 'analytics' && (
                      <div className={cn("space-y-4", getHighlightProps('analytics').className)} ref={getHighlightProps('analytics').ref as any}>
                        <Suspense fallback={<AnalyticsSkeleton />}>
                          <div className="space-y-6">
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
                    )}

                    {activeTab === 'budgets' && (
                      <div className={cn("space-y-4", getHighlightProps('budget').className)} ref={getHighlightProps('budget').ref as any}>
                        <Suspense fallback={<AnalyticsSkeleton />}>
                          <div className="space-y-6">
                            <GlobalBudgetCard />
                            <MonthlyPlanCard />
                            <CategoryBudgetsCard />
                            <BudgetAlertsCard />
                            <BudgetProjectionChart />
                            <BudgetHistoryChart />
                            <CategoryYearComparison />
                            <ExpensePredictions expenses={allExpenses || []} />
                            <CashFlowProjection />
                          </div>
                        </Suspense>
                      </div>
                    )}

                    {activeTab === 'mentorship' && (
                      <div className={cn("space-y-4", getHighlightProps('mentorship').className)} ref={getHighlightProps('mentorship').ref as any}>
                        <Suspense fallback={<AnalyticsSkeleton />}>
                          <div className="space-y-6">
                            <CashflowQuadrantCard />
                            <FinancialFreedomCard />
                            <div className="grid gap-6 lg:grid-cols-2">
                              <PayYourselfFirstCard />
                              <DebtClassificationCard />
                            </div>
                            <div className="grid gap-6 lg:grid-cols-2">
                              <FinancialJournalCard />
                              <FinancialHabitsCard />
                            </div>
                            <SMARTGoalsCard />
                          </div>
                        </Suspense>
                      </div>
                    )}

                    {activeTab === 'goals' && (
                      <div className={cn("space-y-4", getHighlightProps('goals').className)} ref={getHighlightProps('goals').ref as any}>
                        <Suspense fallback={<AnalyticsSkeleton />}>
                          <SavingsGoalsSection />
                        </Suspense>
                      </div>
                    )}

                    {activeTab === 'tax' && (
                      <div className={cn("space-y-4", getHighlightProps('tax').className)} ref={getHighlightProps('tax').ref as any}>
                        <Suspense fallback={<AnalyticsSkeleton />}>
                          <div className="space-y-4">
                            <TaxSummaryCards taxSummary={taxSummary} />
                            <TaxOptimizerCard />
                            <SavingsOptimizerSection />
                          </div>
                        </Suspense>
                      </div>
                    )}

                    {activeTab === 'mileage' && (
                      <div className={cn("space-y-4", getHighlightProps('mileage').className)} ref={getHighlightProps('mileage').ref as any}>
                        <Suspense fallback={<MileageSkeleton />}>
                          <MileageTabContent
                            mileageSummary={mileageSummary}
                            isLoading={mileageLoading}
                          />
                        </Suspense>
                      </div>
                    )}

                    {activeTab === 'subscriptions' && (
                      <div className={cn("space-y-4", getHighlightProps('subscriptions').className)} ref={getHighlightProps('subscriptions').ref as any}>
                        <Suspense fallback={<AnalyticsSkeleton />}>
                          <SubscriptionTracker />
                        </Suspense>
                      </div>
                    )}

                    {activeTab === 'fire' && (
                      <div className={cn("space-y-4", getHighlightProps('fire').className)} ref={getHighlightProps('fire').ref as any}>
                        <Suspense fallback={<AnalyticsSkeleton />}>
                          <div className="space-y-6">
                            <FIRECalculatorCard />
                            <PersonalizedInvestmentTips />
                          </div>
                        </Suspense>
                      </div>
                    )}

                    {activeTab === 'debt' && (
                      <div className={cn("space-y-4", getHighlightProps('debt').className)} ref={getHighlightProps('debt').ref as any}>
                        <Suspense fallback={<AnalyticsSkeleton />}>
                          <DebtManagerCard />
                        </Suspense>
                      </div>
                    )}

                    {activeTab === 'portfolio' && (
                      <div className={cn("space-y-4", getHighlightProps('portfolio').className)} ref={getHighlightProps('portfolio').ref as any}>
                        <Suspense fallback={<AnalyticsSkeleton />}>
                          <div className="space-y-6">
                            <PortfolioTrackerCard />
                            <PersonalizedInvestmentTips />
                          </div>
                        </Suspense>
                      </div>
                    )}

                    {activeTab === 'education' && (
                      <div className={cn("space-y-4", getHighlightProps('education').className)} ref={getHighlightProps('education').ref as any}>
                        <Suspense fallback={<AnalyticsSkeleton />}>
                          <div className="space-y-6">
                            <GlobalLearningChart />
                            <div className="grid gap-6 md:grid-cols-2">
                              <ReadingPaceComparison />
                              <ReadingReminderSettings />
                            </div>
                            <FinancialEducationCard />
                          </div>
                        </Suspense>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Navigator - floating TOC with scroll-spy */}
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
