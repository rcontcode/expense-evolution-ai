import { useState, useMemo, useCallback, lazy, Suspense, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Receipt, Users, DollarSign, FileText, TrendingUp, Download, Scale, ArrowUpRight, ArrowDownRight, UserCircle, Building2, MapPin, CheckCircle, RefreshCw, Landmark, Briefcase, BarChart3, GraduationCap, ChevronDown, ChevronUp, Filter, Sliders } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useSubscription } from '@/hooks/data/useSubscription';
import { toast } from 'sonner';
import { useClients } from '@/hooks/data/useClients';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useExpensesRealtime } from '@/hooks/data/useExpensesRealtime';
import { useIncomeSummary } from '@/hooks/data/useIncome';
import { useTaxCalculations } from '@/hooks/data/useTaxCalculations';
import { useProfile } from '@/hooks/data/useProfile';
import { useMileageSummary } from '@/hooks/data/useMileage';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { TaxSummaryCards } from '@/components/dashboard/TaxSummaryCards';
import { CompletenessCard } from '@/components/dashboard/CompletenessCard';
import { ExportDialog } from '@/components/export/ExportDialog';
import { InfoTooltip, TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { usePageVisitTracker } from '@/hooks/data/useMissionAutoTracker';
import { OnboardingGuide } from '@/components/ui/onboarding-guide';
import { SetupProgressBanner } from '@/components/guidance/SetupProgressBanner';
import { InteractiveWelcome } from '@/components/guidance/InteractiveWelcome';
import { WorkflowVisualizer } from '@/components/guidance/WorkflowVisualizer';
import { WorkflowSummaryWidget } from '@/components/dashboard/WorkflowSummaryWidget';
import { ControlCenterTour } from '@/components/guidance/ControlCenterTour';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { useAuth } from '@/contexts/AuthContext';
import { ViewModeToggle, OrganizedDashboard } from '@/components/focus';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { NextActionBanner } from '@/components/dashboard/NextActionBanner';
import { QuickStatsCards } from '@/components/dashboard/QuickStatsCards';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Lazy load chart components for better performance
const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.DashboardCharts })));
const MileageTabContent = lazy(() => import('@/components/dashboard/MileageTabContent').then(m => ({ default: m.MileageTabContent })));
const SubscriptionTracker = lazy(() => import('@/components/subscriptions/SubscriptionTracker').then(m => ({ default: m.SubscriptionTracker })));
const TaxOptimizerCard = lazy(() => import('@/components/dashboard/TaxOptimizerCard').then(m => ({ default: m.TaxOptimizerCard })));
const RrspTfsaOptimizerCard = lazy(() => import('@/components/dashboard/RrspTfsaOptimizerCard').then(m => ({ default: m.RrspTfsaOptimizerCard })));
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
const GlobalLearningChart = lazy(() => import('@/components/mentorship/GlobalLearningChart').then(m => ({ default: m.GlobalLearningChart })));
const ReadingReminderSettings = lazy(() => import('@/components/mentorship/ReadingReminderSettings').then(m => ({ default: m.ReadingReminderSettings })));
const ReadingPaceComparison = lazy(() => import('@/components/mentorship/ReadingPaceComparison').then(m => ({ default: m.ReadingPaceComparison })));
const BudgetAlertsCard = lazy(() => import('@/components/dashboard/BudgetAlertsCard').then(m => ({ default: m.BudgetAlertsCard })));
const CategoryBudgetsCard = lazy(() => import('@/components/dashboard/CategoryBudgetsCard').then(m => ({ default: m.CategoryBudgetsCard })));
const GlobalBudgetCard = lazy(() => import('@/components/dashboard/GlobalBudgetCard').then(m => ({ default: m.GlobalBudgetCard })));
const BudgetHistoryChart = lazy(() => import('@/components/dashboard/BudgetHistoryChart').then(m => ({ default: m.BudgetHistoryChart })));
const CategoryBudgetHistoryChart = lazy(() => import('@/components/dashboard/CategoryBudgetHistoryChart').then(m => ({ default: m.CategoryBudgetHistoryChart })));
const CategoryYearComparison = lazy(() => import('@/components/analytics/CategoryYearComparison').then(m => ({ default: m.CategoryYearComparison })));

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

const SubscriptionsSkeleton = () => (
  <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-3">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
    <Skeleton className="h-64" />
  </div>
);

export default function Dashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('charts');

  const { refreshSubscription } = useSubscription();
  const { viewMode } = useDisplayPreferences();

  // State for collapsible sections and guide
  const [showGuide, setShowGuide] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);
  const [hasInteractedWithGuide, setHasInteractedWithGuide] = useState(() => {
    return localStorage.getItem('dashboard-guide-interacted') === 'true';
  });

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

  // Track dashboard visit for missions
  usePageVisitTracker('view_dashboard');

  // Enable real-time sync for expenses
  useExpensesRealtime();

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    clientId: selectedClient,
    status: selectedStatus as any,
    category: selectedCategory as any,
  }), [selectedClient, selectedStatus, selectedCategory]);

  const expenseFilters = useMemo(() => ({
    clientIds: selectedClient !== 'all' ? [selectedClient] : undefined,
    statuses: selectedStatus !== 'all' ? [selectedStatus as any] : undefined,
    category: selectedCategory !== 'all' ? (selectedCategory as any) : undefined,
  }), [selectedClient, selectedStatus, selectedCategory]);

  const { data: stats, isLoading } = useDashboardStats(filters);
  const { data: clients } = useClients();
  const { data: allExpenses } = useExpenses(expenseFilters);
  const { data: incomeSummary, isLoading: incomeLoading } = useIncomeSummary();
  const { taxSummary } = useTaxCalculations(allExpenses || []);
  const { data: mileageSummary, isLoading: mileageLoading } = useMileageSummary();
  const { data: profile } = useProfile();

  // Memoize balance calculations
  const balanceData = useMemo(() => {
    const totalExpensesAmount = allExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const totalIncomeAmount = incomeSummary?.totalIncome || 0;
    const netBalance = totalIncomeAmount - totalExpensesAmount;
    return {
      totalExpensesAmount,
      totalIncomeAmount,
      netBalance,
      isPositive: netBalance >= 0,
    };
  }, [allExpenses, incomeSummary?.totalIncome]);

  // Get incomplete expenses count
  const incompleteExpenses = useMemo(() => {
    return allExpenses?.filter(e => !e.category || !e.vendor).length || 0;
  }, [allExpenses]);

  const handleResetFilters = useCallback(() => {
    setSelectedClient('all');
    setSelectedStatus('all');
    setSelectedCategory('all');
  }, []);

  const handleOpenGuide = useCallback(() => {
    setShowGuide(true);
    if (!hasInteractedWithGuide) {
      setHasInteractedWithGuide(true);
      localStorage.setItem('dashboard-guide-interacted', 'true');
    }
  }, [hasInteractedWithGuide]);

  return (
    <Layout>
      <TooltipProvider delayDuration={200}>
        <div className="p-8 space-y-6">
          {/* ============================================
               FASE 1: Hero Minimalista + Guía Pulsante
             ============================================ */}
          
          {/* Dashboard Hero - Minimalist greeting + balance + guide button */}
          <DashboardHero
            totalIncome={balanceData.totalIncomeAmount}
            totalExpenses={balanceData.totalExpensesAmount}
            netBalance={balanceData.netBalance}
            isLoading={isLoading || incomeLoading}
            onOpenGuide={handleOpenGuide}
            hasInteracted={hasInteractedWithGuide}
          />

          {/* Next Action Banner - Smart pulsing recommendation */}
          <NextActionBanner
            pendingDocuments={stats?.pendingDocs || 0}
            incompleteExpenses={incompleteExpenses}
            totalClients={clients?.length || 0}
          />

          {/* Interactive Guide - Shown on demand or first visit */}
          {showGuide && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <InteractiveWelcome />
            </div>
          )}

          {/* Quick Stats Cards - Compact and color-coded */}
          <QuickStatsCards
            pendingDocs={stats?.pendingDocs || 0}
            totalExpenses={stats?.totalExpenses || 0}
            monthlyTotal={stats?.monthlyTotal || 0}
            billableExpenses={stats?.billableExpenses || 0}
            isLoading={isLoading}
          />

          {/* Toolbar: Filters + Export */}
          <div className="flex items-center justify-between gap-4 py-2">
            <Collapsible open={showFilters} onOpenChange={setShowFilters} className="flex-1">
              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {language === 'es' ? 'Filtros' : 'Filters'}
                    {(selectedClient !== 'all' || selectedStatus !== 'all' || selectedCategory !== 'all') && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                        {[selectedClient !== 'all', selectedStatus !== 'all', selectedCategory !== 'all'].filter(Boolean).length}
                      </span>
                    )}
                    {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>
                
                {/* View Mode Toggle */}
                <ViewModeToggle />
              </div>
              <CollapsibleContent className="pt-4">
                <DashboardFilters
                  selectedClient={selectedClient}
                  selectedStatus={selectedStatus}
                  selectedCategory={selectedCategory}
                  onClientChange={setSelectedClient}
                  onStatusChange={setSelectedStatus}
                  onCategoryChange={setSelectedCategory}
                  onReset={handleResetFilters}
                  clients={clients || []}
                />
              </CollapsibleContent>
            </Collapsible>
            
            <InfoTooltip content={TOOLTIP_CONTENT.exportButton} variant="wrapper" side="bottom">
              <Button onClick={() => setExportDialogOpen(true)} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {t('export.exportButton')}
              </Button>
            </InfoTooltip>
          </div>

          {/* ============================================
               Centro de Control Financiero
             ============================================ */}
        {viewMode === 'organized' ? (
          <OrganizedDashboard />
        ) : (
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  {language === 'es' ? 'Centro de Control' : 'Control Center'}
                </CardTitle>
              </div>
              <ControlCenterTour onTabChange={setActiveTab} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="flex flex-wrap gap-1.5 h-auto bg-muted/30 p-1.5 rounded-lg">
                <TabsTrigger value="charts" className="px-3 py-2 text-xs rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  {t('taxAnalysis.charts')}
                </TabsTrigger>
                <TabsTrigger value="analytics" className="px-3 py-2 text-xs rounded-md data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  <TrendingUp className="h-4 w-4 mr-1.5" />
                  {language === 'es' ? 'Análisis' : 'Analytics'}
                </TabsTrigger>
                <TabsTrigger value="mentorship" className="px-3 py-2 text-xs rounded-md data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <GraduationCap className="h-4 w-4 mr-1.5" />
                  {language === 'es' ? 'Mentoría' : 'Mentorship'}
                </TabsTrigger>
                <TabsTrigger value="tax" className="px-3 py-2 text-xs rounded-md data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <Receipt className="h-4 w-4 mr-1.5" />
                  {language === 'es' ? 'Impuestos' : 'Taxes'}
                </TabsTrigger>
                <TabsTrigger value="mileage" className="px-3 py-2 text-xs rounded-md data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                  <MapPin className="h-4 w-4 mr-1.5" />
                  Km
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="px-3 py-2 text-xs rounded-md data-[state=active]:bg-pink-600 data-[state=active]:text-white">
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Subs
                </TabsTrigger>
                <TabsTrigger value="fire" className="px-3 py-2 text-xs rounded-md data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                  🔥 FIRE
                </TabsTrigger>
                <TabsTrigger value="debt" className="px-3 py-2 text-xs rounded-md data-[state=active]:bg-red-600 data-[state=active]:text-white">
                  <Landmark className="h-4 w-4 mr-1.5" />
                  {language === 'es' ? 'Deudas' : 'Debt'}
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="px-3 py-2 text-xs rounded-md data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  <Briefcase className="h-4 w-4 mr-1.5" />
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="education" className="px-3 py-2 text-xs rounded-md data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                  <GraduationCap className="h-4 w-4 mr-1.5" />
                  {language === 'es' ? 'Educación' : 'Education'}
                </TabsTrigger>
              </TabsList>

          <TabsContent value="charts" className="space-y-4">
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

          <TabsContent value="analytics" className="space-y-4">
            {activeTab === 'analytics' && (
              <Suspense fallback={<AnalyticsSkeleton />}>
                <div className="space-y-6">
                  {/* Global Budget and History */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <GlobalBudgetCard />
                    <BudgetHistoryChart />
                  </div>
                  {/* Budget Alerts and Category Goals */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <BudgetAlertsCard />
                    <CategoryBudgetsCard />
                  </div>
                  {/* New Charts - Income vs Expenses, Savings Rate, Year Comparison */}
                  <IncomeVsExpensesChart />
                  <div className="grid gap-6 lg:grid-cols-2">
                    <SavingsRateChart />
                    <YearOverYearComparison />
                  </div>
                  {/* Category Trends and Budget Projection */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <CategoryTrendsChart />
                    <BudgetProjectionChart />
                  </div>
                  <ExpensePredictions expenses={allExpenses || []} isLoading={isLoading} />
                  <CashFlowProjection />
                  <div className="grid gap-6 lg:grid-cols-2">
                    <FinancialHealthRadar />
                    <CashFlowSankey />
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <ProjectProfitability />
                    <ClientProfitability />
                  </div>
                  <FinancialCorrelations />
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

          <TabsContent value="mentorship" className="space-y-4">
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

          <TabsContent value="tax" className="space-y-4">
            {activeTab === 'tax' && (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="lg:col-span-1">
                    <Suspense fallback={<Skeleton className="h-[500px]" />}>
                      <TaxOptimizerCard />
                    </Suspense>
                  </div>
                  <div className="lg:col-span-1">
                    <Suspense fallback={<Skeleton className="h-[500px]" />}>
                      <RrspTfsaOptimizerCard />
                    </Suspense>
                  </div>
                </div>
                <TaxSummaryCards taxSummary={taxSummary} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="mileage" className="space-y-4">
            {activeTab === 'mileage' && (
              <Suspense fallback={<MileageSkeleton />}>
                <MileageTabContent
                  mileageSummary={mileageSummary}
                  isLoading={mileageLoading}
                />
              </Suspense>
            )}
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            {activeTab === 'subscriptions' && (
              <Suspense fallback={<SubscriptionsSkeleton />}>
                <SubscriptionTracker />
              </Suspense>
            )}
          </TabsContent>

          <TabsContent value="fire" className="space-y-4">
            {activeTab === 'fire' && (
              <Suspense fallback={<Skeleton className="h-[600px]" />}>
                <FIRECalculatorCard />
              </Suspense>
            )}
          </TabsContent>

          <TabsContent value="debt" className="space-y-4">
            {activeTab === 'debt' && (
              <Suspense fallback={<Skeleton className="h-[600px]" />}>
                <DebtManagerCard />
              </Suspense>
            )}
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
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

          <TabsContent value="education" className="space-y-4">
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
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            <CardDescription>Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button 
                onClick={() => navigate('/chaos')} 
                className="h-24 flex flex-col items-center justify-center space-y-2"
              >
                <Upload className="h-6 w-6" />
                <span>{t('dashboard.uploadDocument')}</span>
              </Button>
              <Button 
                onClick={() => navigate('/expenses')} 
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2"
              >
                <Receipt className="h-6 w-6" />
                <span>{t('dashboard.addExpense')}</span>
              </Button>
              <Button 
                onClick={() => navigate('/clients')} 
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2"
              >
                <Users className="h-6 w-6" />
                <span>{t('dashboard.addClient')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

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