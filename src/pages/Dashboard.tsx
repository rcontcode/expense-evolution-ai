import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Receipt, Users, DollarSign, FileText, TrendingUp, Download, Scale, ArrowUpRight, ArrowDownRight, UserCircle, Building2, MapPin, CheckCircle, RefreshCw, Landmark, Briefcase, BarChart3, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
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
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePageVisitTracker } from '@/hooks/data/useMissionAutoTracker';
import { OnboardingGuide } from '@/components/ui/onboarding-guide';
import { SetupProgressBanner } from '@/components/guidance/SetupProgressBanner';
import { InteractiveWelcome } from '@/components/guidance/InteractiveWelcome';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('charts');

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

  // Get user's first name for personalized greeting
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  const handleResetFilters = useCallback(() => {
    setSelectedClient('all');
    setSelectedStatus('all');
    setSelectedCategory('all');
  }, []);

  return (
    <Layout>
      <TooltipProvider delayDuration={200}>
        <div className="p-8 space-y-8">
          {/* Mentor Quote Banner */}
          <MentorQuoteBanner showTip context="dashboard" className="mb-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold">
                  {language === 'es' 
                    ? `¡Hola${firstName ? `, ${firstName}` : ''}! 👋`
                    : `Hello${firstName ? `, ${firstName}` : ''}! 👋`
                  }
                </h1>
                <p className="text-muted-foreground mt-2">{t('dashboardLabels.subtitle')}</p>
              </div>
              <InfoTooltip content={TOOLTIP_CONTENT.dashboard} />
            </div>
            <InfoTooltip content={TOOLTIP_CONTENT.exportButton} variant="wrapper" side="bottom">
              <Button onClick={() => setExportDialogOpen(true)} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t('export.exportButton')}
              </Button>
            </InfoTooltip>
          </div>

          {/* Interactive Welcome - Proactive Guidance */}
          <InteractiveWelcome />

          {/* Setup Progress Banner */}
          <SetupProgressBanner variant="compact" />

          {/* Filtros */}
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

          {/* Completeness Card */}
          <CompletenessCard expenses={allExpenses || []} isLoading={isLoading} />

          {/* Profile Summary Card */}
          {profile && (
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-lg font-semibold">
                      {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold">{profile.full_name || t('settings.profileTitle')}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {profile.work_types && profile.work_types.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {profile.work_types.includes('contractor') ? 'Sole Proprietor' : 
                             profile.work_types.includes('corporation') ? 'Corporation' : 'Employee'}
                          </span>
                        )}
                        {profile.province && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {profile.province}
                          </span>
                        )}
                        {profile.gst_hst_registered && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            GST/HST
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                    {t('common.edit')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Balance Card */}
          <Card className={`border-2 ${balanceData.isPositive ? 'border-green-500/30 bg-green-50/50 dark:bg-green-900/10' : 'border-red-500/30 bg-red-50/50 dark:bg-red-900/10'}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  <CardTitle className="text-lg">{t('balance.title')}</CardTitle>
                </div>
                <span className="text-xs text-muted-foreground">{t('balance.thisYear')}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    {t('balance.totalIncome')}
                  </div>
                  <div className="text-xl font-bold text-green-600">${balanceData.totalIncomeAmount.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    {t('balance.totalExpenses')}
                  </div>
                  <div className="text-xl font-bold text-red-600">${balanceData.totalExpensesAmount.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">{t('balance.netBalance')}</div>
                  <div className={`text-2xl font-bold ${balanceData.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {balanceData.isPositive ? '+' : ''}${balanceData.netBalance.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <InfoTooltip content={TOOLTIP_CONTENT.monthlyTotal} variant="wrapper" side="bottom">
              <Card className="cursor-help transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('dashboard.monthlyTotal')}
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-chart-1" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">${stats?.monthlyTotal.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">{t('dashboardLabels.currency')}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </InfoTooltip>

            <InfoTooltip content={TOOLTIP_CONTENT.totalExpenses} variant="wrapper" side="bottom">
              <Card className="cursor-help transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('dashboard.totalExpenses')}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-chart-2" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats?.totalExpenses}</div>
                      <p className="text-xs text-muted-foreground">{t('dashboardLabels.totalRecords')}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </InfoTooltip>

            <InfoTooltip content={TOOLTIP_CONTENT.pendingDocs} variant="wrapper" side="bottom">
              <Card className="cursor-help transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('dashboard.pendingDocuments')}
                  </CardTitle>
                  <FileText className="h-4 w-4 text-chart-3" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats?.pendingDocs}</div>
                      <p className="text-xs text-muted-foreground">{t('dashboardLabels.awaitingClassification')}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </InfoTooltip>

            <InfoTooltip content={TOOLTIP_CONTENT.billableExpenses} variant="wrapper" side="bottom">
              <Card className="cursor-help transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('dashboard.billableExpenses')}
                  </CardTitle>
                  <Receipt className="h-4 w-4 text-chart-4" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats?.billableExpenses}</div>
                      <p className="text-xs text-muted-foreground">{t('dashboardLabels.readyToInvoice')}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </InfoTooltip>
          </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex w-full overflow-x-auto">
            <InfoTooltip content={TOOLTIP_CONTENT.chartsTab} variant="wrapper" side="bottom">
              <TabsTrigger value="charts" className="cursor-pointer">{t('taxAnalysis.charts')}</TabsTrigger>
            </InfoTooltip>
            <TabsTrigger value="analytics" className="cursor-pointer flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {language === 'es' ? 'Análisis' : 'Analytics'}
            </TabsTrigger>
            <TabsTrigger value="mentorship" className="cursor-pointer flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {language === 'es' ? 'Mentoría' : 'Mentorship'}
            </TabsTrigger>
            <InfoTooltip content={TOOLTIP_CONTENT.taxTab} variant="wrapper" side="bottom">
              <TabsTrigger value="tax" className="cursor-pointer">{t('taxAnalysis.taxAnalysis')}</TabsTrigger>
            </InfoTooltip>
            <InfoTooltip content={TOOLTIP_CONTENT.mileageTab} variant="wrapper" side="bottom">
              <TabsTrigger value="mileage" className="cursor-pointer">{t('mileage.title')}</TabsTrigger>
            </InfoTooltip>
            <TabsTrigger value="subscriptions" className="cursor-pointer flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              {language === 'es' ? 'Suscripciones' : 'Subscriptions'}
            </TabsTrigger>
            <TabsTrigger value="fire" className="cursor-pointer flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              FIRE
            </TabsTrigger>
            <TabsTrigger value="debt" className="cursor-pointer flex items-center gap-1">
              <Landmark className="h-3 w-3" />
              {language === 'es' ? 'Deudas' : 'Debt'}
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="cursor-pointer flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {language === 'es' ? 'Portfolio' : 'Portfolio'}
            </TabsTrigger>
            <TabsTrigger value="education" className="cursor-pointer flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
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
                    <FinancialEducationCard />
                    <ReadingReminderSettings />
                  </div>
                </div>
              </Suspense>
            )}
          </TabsContent>
        </Tabs>

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