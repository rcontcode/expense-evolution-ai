import { useState, useMemo, useCallback, lazy, Suspense, useEffect } from 'react';
import { useHighlightOnArrival } from '@/hooks/utils/useHighlightOnArrival';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Receipt, Users, Download, Scale, MapPin, RefreshCw, Landmark, Briefcase, BarChart3, GraduationCap, ChevronDown, ChevronUp, MoreHorizontal, Target, Wallet } from 'lucide-react';
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
    setActiveTab(tab);

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
          <div className="side-by-side" data-highlight="timeline-section">
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
          <EcosystemSection />

          {/* Visual Workflow Guide - "¿Qué flujo necesitas hoy?" */}
          <Suspense fallback={<Skeleton className="h-[300px]" />}>
            <WorkflowVisualizer compact={true} />
          </Suspense>

          {/* Workflow Progress + Completeness */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Suspense fallback={<Skeleton className="h-[200px]" />}>
              <WorkflowSummaryWidget />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[200px]" />}>
              <MonthlyBillsWidget />
            </Suspense>
          </div>

          {/* Completeness */}
          {allExpenses && allExpenses.length > 0 && (
            <Suspense fallback={<Skeleton className="h-[200px]" />}>
              <CompletenessCard expenses={allExpenses} isLoading={isLoading} />
            </Suspense>
          )}

          {/* Smart Alerts + Profile Completion + Gamification */}
          <Suspense fallback={null}>
            <ProactiveAlertsWidget />
          </Suspense>
          <ProfileCompletionNudge onStartSection={handleStartProfileSection} />
          <DashboardGamificationWidget compact={true} />

          {/* View Mode Toggle + Export (siempre visible) */}
          <div className="flex items-center justify-between gap-4 py-2">
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
            <Button onClick={() => setExportDialogOpen(true)} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t('export.exportButton')}
            </Button>
          </div>

          {/* =============================================
               CONTENIDO ADICIONAL (según modo)
             ============================================= */}

          {viewMode === 'organized' ? (
            <OrganizedDashboard />
          ) : (
            <>
              {/* =============================================
                   FASE 3: Centro de Control Colapsable
                 ============================================= */}

              <Collapsible open={showAllTools} onOpenChange={setShowAllTools}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-full py-8 gap-4 transition-all duration-300 group relative overflow-hidden",
                      "bg-gradient-to-r from-primary/15 via-accent/20 to-amber-500/15",
                      "border-2 hover:border-primary/80",
                      "shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30",
                      "hover:-translate-y-1 active:scale-[0.99]",
                      showAllTools 
                        ? "border-primary bg-gradient-to-r from-primary/20 via-accent/25 to-amber-500/20" 
                        : "border-primary/40"
                    )}
                  >
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                    
                    {/* Icon container with glow */}
                    <div className={cn(
                      "p-3 rounded-xl transition-all duration-300 relative",
                      showAllTools 
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/40" 
                        : "bg-gradient-to-br from-primary/30 to-accent/30 text-primary group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30"
                    )}>
                      <BarChart3 className="h-6 w-6" />
                      {/* Pulsing ring when closed */}
                      {!showAllTools && (
                        <span className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-ping opacity-30" />
                      )}
                    </div>
                    
                    {/* Text content */}
                    <div className="flex flex-col items-start text-left flex-1 z-10">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg bg-gradient-to-r from-primary via-accent to-amber-500 bg-clip-text text-transparent animate-pulse">
                          {language === 'es' ? 'Centro de Control Avanzado' : 'Advanced Control Center'}
                        </span>
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/50 animate-pulse ring-2 ring-amber-400/30">
                          PRO
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          📊 {language === 'es' ? 'Gráficos' : 'Charts'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          🎯 {language === 'es' ? 'Análisis' : 'Analytics'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          🎓 {language === 'es' ? 'Mentoría' : 'Mentorship'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          +6 {language === 'es' ? 'herramientas' : 'tools'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Chevron with enhanced animation */}
                    <div className={cn(
                      "p-2 rounded-full transition-all duration-300",
                      showAllTools 
                        ? "bg-primary/30 rotate-180" 
                        : "bg-gradient-to-br from-muted to-muted/50 group-hover:from-primary/20 group-hover:to-accent/20"
                    )}>
                      <ChevronDown className={cn(
                        "h-5 w-5 transition-transform",
                        showAllTools && "text-primary"
                      )} />
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pt-4">
                  <Card className="border-2 border-primary/30 bg-gradient-to-br from-card via-primary/5 to-accent/10 backdrop-blur-sm overflow-hidden shadow-2xl shadow-primary/20 ring-1 ring-primary/10" data-highlight="control-center">
                    {/* Decorative header bar */}
                    <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 via-amber-500 to-rose-500 shadow-lg shadow-primary/30" />
                    
                    <CardHeader className="pb-4 pt-5">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary via-accent to-amber-500 shadow-lg shadow-primary/40 animate-pulse">
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-black bg-gradient-to-r from-primary via-accent to-amber-500 bg-clip-text text-transparent">
                            {language === 'es' ? 'Herramientas Avanzadas' : 'Advanced Tools'}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1 font-medium">
                            {language === 'es' ? 'Potencia tu gestión financiera' : 'Power up your financial management'}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        <TabsList className="flex flex-wrap gap-1.5 h-auto bg-gradient-to-br from-muted/80 via-muted/50 to-primary/10 p-2.5 rounded-2xl border-2 border-primary/20 shadow-inner">
                          {/* Charts Tab */}
                          <TabsTrigger 
                            value="charts" 
                            className={cn(
                              "px-5 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2",
                              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500",
                              "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/50 data-[state=active]:scale-105",
                              "data-[state=active]:ring-2 data-[state=active]:ring-blue-400/50",
                              "hover:bg-blue-500/20 hover:text-blue-400 hover:scale-102",
                              "bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                              shouldHighlight('charts') && 'highlight-tab-active'
                            )}
                          >
                            <div className="p-1.5 rounded-lg bg-blue-500/20">
                              <BarChart3 className="h-4 w-4" />
                            </div>
                            {t('taxAnalysis.charts')}
                          </TabsTrigger>
                          
                          {/* Analytics Tab */}
                          <TabsTrigger 
                            value="analytics" 
                            className={cn(
                              "px-5 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2",
                              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-500",
                              "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-purple-500/50 data-[state=active]:scale-105",
                              "data-[state=active]:ring-2 data-[state=active]:ring-purple-400/50",
                              "hover:bg-purple-500/20 hover:text-purple-400 hover:scale-102",
                              "bg-purple-500/5 text-purple-600 dark:text-purple-400 border border-purple-500/20",
                              shouldHighlight('analytics') && 'highlight-tab-active'
                            )}
                          >
                            <div className="p-1.5 rounded-lg bg-purple-500/20">
                              <Scale className="h-4 w-4" />
                            </div>
                            {language === 'es' ? 'Análisis' : 'Analytics'}
                          </TabsTrigger>

                          {/* Budget Tab */}
                          <TabsTrigger 
                            value="budgets" 
                            className={cn(
                              "px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-teal-500",
                              "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-cyan-500/50 data-[state=active]:scale-105",
                              "data-[state=active]:ring-2 data-[state=active]:ring-cyan-400/50",
                              "hover:bg-cyan-500/20 hover:text-cyan-400",
                              "bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20",
                              shouldHighlight('budget') && 'highlight-tab-active'
                            )}
                          >
                            <div className="p-1 rounded-lg bg-cyan-500/20">
                              <Wallet className="h-3.5 w-3.5" />
                            </div>
                            💳 {language === 'es' ? 'Presupuesto' : 'Budget'}
                          </TabsTrigger>
                          
                          {/* Mentorship Tab */}
                          <TabsTrigger 
                            value="mentorship" 
                            className={cn(
                              "px-5 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2",
                              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500",
                              "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-amber-500/50 data-[state=active]:scale-105",
                              "data-[state=active]:ring-2 data-[state=active]:ring-amber-400/50",
                              "hover:bg-amber-500/20 hover:text-amber-400 hover:scale-102",
                              "bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                              shouldHighlight('mentorship') && 'highlight-tab-active'
                            )}
                          >
                            <div className="p-1.5 rounded-lg bg-amber-500/20">
                              <GraduationCap className="h-4 w-4" />
                            </div>
                            {language === 'es' ? 'Mentoría' : 'Mentorship'}
                          </TabsTrigger>
                          
                          {/* Goals Tab */}
                          <TabsTrigger 
                            value="goals" 
                            className={cn(
                              "px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-500",
                              "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-emerald-500/50 data-[state=active]:scale-105",
                              "data-[state=active]:ring-2 data-[state=active]:ring-emerald-400/50",
                              "hover:bg-emerald-500/20 hover:text-emerald-400",
                              "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                              shouldHighlight('goals') && 'highlight-tab-active'
                            )}
                          >
                            <div className="p-1 rounded-lg bg-emerald-500/20">
                              <Target className="h-3.5 w-3.5" />
                            </div>
                            🎯 {language === 'es' ? 'Metas' : 'Goals'}
                          </TabsTrigger>

                          {/* Tax Tab */}
                          <TabsTrigger 
                            value="tax" 
                            className={cn(
                              "px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-lime-500",
                              "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-green-500/50 data-[state=active]:scale-105",
                              "data-[state=active]:ring-2 data-[state=active]:ring-green-400/50",
                              "hover:bg-green-500/20 hover:text-green-400",
                              "bg-green-500/5 text-green-600 dark:text-green-400 border border-green-500/20",
                              shouldHighlight('tax') && 'highlight-tab-active'
                            )}
                          >
                            <div className="p-1 rounded-lg bg-green-500/20">
                              <Receipt className="h-3.5 w-3.5" />
                            </div>
                            💰 {language === 'es' ? 'Impuestos' : 'Taxes'}
                          </TabsTrigger>

                          {/* Mileage Tab */}
                          <TabsTrigger 
                            value="mileage" 
                            className={cn(
                              "px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500",
                              "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/50 data-[state=active]:scale-105",
                              "data-[state=active]:ring-2 data-[state=active]:ring-blue-400/50",
                              "hover:bg-blue-500/20 hover:text-blue-400",
                              "bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                              shouldHighlight('mileage') && 'highlight-tab-active'
                            )}
                          >
                            <div className="p-1 rounded-lg bg-blue-500/20">
                              <MapPin className="h-3.5 w-3.5" />
                            </div>
                            🚗 {language === 'es' ? 'Km' : 'Mileage'}
                          </TabsTrigger>

                          {/* Subscriptions Tab */}
                          <TabsTrigger 
                            value="subscriptions" 
                            className={cn(
                              "px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-500",
                              "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-violet-500/50 data-[state=active]:scale-105",
                              "data-[state=active]:ring-2 data-[state=active]:ring-violet-400/50",
                              "hover:bg-violet-500/20 hover:text-violet-400",
                              "bg-violet-500/5 text-violet-600 dark:text-violet-400 border border-violet-500/20",
                              shouldHighlight('subscriptions') && 'highlight-tab-active'
                            )}
                          >
                            <div className="p-1 rounded-lg bg-violet-500/20">
                              <RefreshCw className="h-3.5 w-3.5" />
                            </div>
                            🔄 {language === 'es' ? 'Suscrip.' : 'Subs'}
                          </TabsTrigger>

                          {/* FIRE Tab */}
                          <TabsTrigger 
                            value="fire" 
                            className={cn(
                              "px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-500",
                              "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-orange-500/50 data-[state=active]:scale-105",
                              "data-[state=active]:ring-2 data-[state=active]:ring-orange-400/50",
                              "hover:bg-orange-500/20 hover:text-orange-400",
                              "bg-orange-500/5 text-orange-600 dark:text-orange-400 border border-orange-500/20",
                              shouldHighlight('fire') && 'highlight-tab-active'
                            )}
                          >
                            <div className="p-1 rounded-lg bg-orange-500/20">
                              <span className="text-sm">🔥</span>
                            </div>
                            FIRE
                          </TabsTrigger>

                          {/* Debt Tab */}
                          <TabsTrigger 
                            value="debt" 
                            className={cn(
                              "px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-rose-500",
                              "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-red-500/50 data-[state=active]:scale-105",
                              "data-[state=active]:ring-2 data-[state=active]:ring-red-400/50",
                              "hover:bg-red-500/20 hover:text-red-400",
                              "bg-red-500/5 text-red-600 dark:text-red-400 border border-red-500/20",
                              shouldHighlight('debt') && 'highlight-tab-active'
                            )}
                          >
                            <div className="p-1 rounded-lg bg-red-500/20">
                              <Landmark className="h-3.5 w-3.5" />
                            </div>
                            🏦 {language === 'es' ? 'Deudas' : 'Debt'}
                          </TabsTrigger>

                          {/* Portfolio Tab */}
                          <TabsTrigger 
                            value="portfolio" 
                            className={cn(
                              "px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-500",
                              "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-indigo-500/50 data-[state=active]:scale-105",
                              "data-[state=active]:ring-2 data-[state=active]:ring-indigo-400/50",
                              "hover:bg-indigo-500/20 hover:text-indigo-400",
                              "bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
                              shouldHighlight('portfolio') && 'highlight-tab-active'
                            )}
                          >
                            <div className="p-1 rounded-lg bg-indigo-500/20">
                              <Briefcase className="h-3.5 w-3.5" />
                            </div>
                            📈 Portfolio
                          </TabsTrigger>

                          {/* Education Tab */}
                          <TabsTrigger 
                            value="education" 
                            className={cn(
                              "px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                              "data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-500",
                              "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-amber-500/50 data-[state=active]:scale-105",
                              "data-[state=active]:ring-2 data-[state=active]:ring-amber-400/50",
                              "hover:bg-amber-500/20 hover:text-amber-400",
                              "bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                              shouldHighlight('education') && 'highlight-tab-active'
                            )}
                          >
                            <div className="p-1 rounded-lg bg-amber-500/20">
                              <GraduationCap className="h-3.5 w-3.5" />
                            </div>
                            📚 {language === 'es' ? 'Educación' : 'Education'}
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="charts" className={cn("space-y-4", getHighlightProps('charts').className)} ref={getHighlightProps('charts').ref as any}>
                          {activeTab === 'charts' && (
                            <Suspense fallback={<ChartsSkeleton />}>
                              <DashboardCharts
                                categoryBreakdown={stats?.categoryBreakdown || []}
                                clientBreakdown={stats?.clientBreakdown || []}
                                monthlyTrends={stats?.monthlyTrends || []}
                                isLoading={isLoading}
                              />
                            </Suspense>
                          )}
                        </TabsContent>

                        <TabsContent value="analytics" className={cn("space-y-4", getHighlightProps('analytics').className)} ref={getHighlightProps('analytics').ref as any}>
                          {activeTab === 'analytics' && (
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
                                {/* Unique Power Tools */}
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
                          )}
                        </TabsContent>

                        <TabsContent value="budgets" className={cn("space-y-4", getHighlightProps('budget').className)} ref={getHighlightProps('budget').ref as any}>
                          {activeTab === 'budgets' && (
                            <Suspense fallback={<AnalyticsSkeleton />}>
                              <div className="space-y-6">
                                <MonthlyPlanCard />
                                <div className="grid gap-6 lg:grid-cols-2">
                                  <GlobalBudgetCard />
                                  <BudgetHistoryChart />
                                </div>
                                <div className="grid gap-6 lg:grid-cols-2">
                                  <BudgetAlertsCard />
                                  <CategoryBudgetsCard />
                                </div>
                                <div className="grid gap-6 lg:grid-cols-2">
                                  <BudgetProjectionChart />
                                  <ExpensePredictions expenses={allExpenses || []} isLoading={isLoading} />
                                </div>
                                <CashFlowProjection />
                              </div>
                            </Suspense>
                          )}
                        </TabsContent>

                        <TabsContent value="mentorship" className={cn("space-y-4", getHighlightProps('mentorship').className)} ref={getHighlightProps('mentorship').ref as any}>
                          {activeTab === 'mentorship' && (
                            <Suspense fallback={<AnalyticsSkeleton />}>
                              <div className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                  <CashflowQuadrantCard />
                                  <FinancialFreedomCard />
                                </div>
                                <div className="grid gap-6 md:grid-cols-2">
                                  <PayYourselfFirstCard />
                                  <DebtClassificationCard />
                                </div>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                  <SMARTGoalsCard />
                                  <FinancialJournalCard />
                                  <FinancialHabitsCard />
                                  <FinancialEducationCard />
                                </div>
                              </div>
                            </Suspense>
                          )}
                        </TabsContent>

                        <TabsContent value="goals" className={cn("space-y-4", getHighlightProps('goals').className)} ref={getHighlightProps('goals').ref as any}>
                          {activeTab === 'goals' && (
                            <Suspense fallback={<Skeleton className="h-[400px]" />}>
                              <SavingsGoalsSection />
                            </Suspense>
                          )}
                        </TabsContent>

                        <TabsContent value="tax" className={cn("space-y-4", getHighlightProps('tax').className)} ref={getHighlightProps('tax').ref as any}>
                          {activeTab === 'tax' && (
                            <div className="space-y-6">
                              <div className="grid gap-6 lg:grid-cols-2">
                                <Suspense fallback={<Skeleton className="h-[500px]" />}>
                                  <TaxOptimizerCard />
                                </Suspense>
                                <Suspense fallback={<Skeleton className="h-[500px]" />}>
                                  <SavingsOptimizerSection />
                                </Suspense>
                              </div>
                              <TaxSummaryCards taxSummary={taxSummary} />
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="mileage" className={cn("space-y-4", getHighlightProps('mileage').className)} ref={getHighlightProps('mileage').ref as any}>
                          {activeTab === 'mileage' && (
                            <Suspense fallback={<MileageSkeleton />}>
                              <MileageTabContent
                                mileageSummary={mileageSummary}
                                isLoading={mileageLoading}
                              />
                            </Suspense>
                          )}
                        </TabsContent>

                        <TabsContent value="subscriptions" className={cn("space-y-4", getHighlightProps('subscriptions').className)} ref={getHighlightProps('subscriptions').ref as any}>
                          {activeTab === 'subscriptions' && (
                            <Suspense fallback={<Skeleton className="h-64" />}>
                              <SubscriptionTracker />
                            </Suspense>
                          )}
                        </TabsContent>

                        <TabsContent value="fire" className={cn("space-y-4", getHighlightProps('fire').className)} ref={getHighlightProps('fire').ref as any}>
                          {activeTab === 'fire' && (
                            <Suspense fallback={<Skeleton className="h-[600px]" />}>
                              <FIRECalculatorCard />
                            </Suspense>
                          )}
                        </TabsContent>

                        <TabsContent value="debt" className={cn("space-y-4", getHighlightProps('debt').className)} ref={getHighlightProps('debt').ref as any}>
                          {activeTab === 'debt' && (
                            <Suspense fallback={<Skeleton className="h-[600px]" />}>
                              <DebtManagerCard />
                            </Suspense>
                          )}
                        </TabsContent>

                        <TabsContent value="portfolio" className={cn("space-y-4", getHighlightProps('portfolio').className)} ref={getHighlightProps('portfolio').ref as any}>
                          {activeTab === 'portfolio' && (
                            <div className="grid gap-6 lg:grid-cols-3">
                              <div className="lg:col-span-2">
                                <Suspense fallback={<Skeleton className="h-[600px]" />}>
                                  <PortfolioTrackerCard />
                                </Suspense>
                              </div>
                              <div className="lg:col-span-1">
                                <Suspense fallback={<Skeleton className="h-[400px]" />}>
                                  <PersonalizedInvestmentTips />
                                </Suspense>
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="education" className={cn("space-y-4", getHighlightProps('education').className)} ref={getHighlightProps('education').ref as any}>
                          {activeTab === 'education' && (
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
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              {/* Quick Actions - Compact */}
              <Card className="border-dashed">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('dashboard.quickActions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={() => navigate('/chaos')} 
                      size="sm"
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {t('dashboard.uploadDocument')}
                    </Button>
                    <Button 
                      onClick={() => navigate('/expenses')} 
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Receipt className="h-4 w-4" />
                      {t('dashboard.addExpense')}
                    </Button>
                    <Button 
                      onClick={() => navigate('/clients')} 
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Users className="h-4 w-4" />
                      {t('dashboard.addClient')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

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
