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

          {/* Workflow Visualizer - Clear Step-by-Step Flows */}
          <WorkflowVisualizer 
            selectedWorkflows={['expense-capture', 'client-billing', 'tax-preparation']}
            showAll={false}
          />

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

          {/* Workflow Summary Widget */}
          <WorkflowSummaryWidget />

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

        {/* Dashboard Module Tabs - Centro de Control Financiero */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-accent/5 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent text-white">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {language === 'es' ? '🎛️ Centro de Control Financiero' : '🎛️ Financial Control Center'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'es' 
                      ? 'Explora todas las herramientas disponibles para gestionar tus finanzas' 
                      : 'Explore all available tools to manage your finances'}
                  </CardDescription>
                </div>
              </div>
              <ControlCenterTour onTabChange={setActiveTab} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 h-auto bg-transparent p-0">
                {/* Gráficos */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="charts" 
                      className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="p-2 rounded-lg bg-blue-500/20 data-[state=active]:bg-white/20">
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-xs font-medium">{t('taxAnalysis.charts')}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{language === 'es' ? '📊 Gráficos Principales' : '📊 Main Charts'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'Visualiza tus gastos por categoría, cliente y tendencias mensuales. Ideal para ver el panorama general de tus finanzas.' 
                        : 'View your expenses by category, client, and monthly trends. Ideal for seeing the overall picture of your finances.'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Análisis */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="analytics" 
                      className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-xs font-medium">{language === 'es' ? 'Análisis' : 'Analytics'}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{language === 'es' ? '🔍 Análisis Avanzado' : '🔍 Advanced Analytics'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'Predicciones de gastos con IA, flujo de caja, rentabilidad por proyecto/cliente, correlaciones financieras y más de 10 visualizaciones.' 
                        : 'AI expense predictions, cash flow, project/client profitability, financial correlations, and 10+ visualizations.'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Mentoría */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="mentorship" 
                      className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-xs font-medium">{language === 'es' ? 'Mentoría' : 'Mentorship'}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{language === 'es' ? '🧠 Sistema de Mentoría' : '🧠 Mentorship System'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'Metodología Kiyosaki/Tracy: Cuadrante del Flujo de Caja, Libertad Financiera, Págate Primero, Clasificación de Deudas, Metas SMART y Diario Financiero.' 
                        : 'Kiyosaki/Tracy methodology: Cashflow Quadrant, Financial Freedom, Pay Yourself First, Debt Classification, SMART Goals, and Financial Journal.'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Análisis Fiscal */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="tax" 
                      className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 hover:border-green-400 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <Receipt className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-xs font-medium">{t('taxAnalysis.taxAnalysis')}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{language === 'es' ? '💰 Optimización Fiscal' : '💰 Tax Optimization'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'Optimizador de impuestos con IA, calculadora RRSP/TFSA, deducciones CRA y resumen fiscal completo para maximizar tus ahorros.' 
                        : 'AI tax optimizer, RRSP/TFSA calculator, CRA deductions, and complete tax summary to maximize your savings.'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Kilometraje */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="mileage" 
                      className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white bg-cyan-50 dark:bg-cyan-950/30 border-2 border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <MapPin className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="text-xs font-medium">{t('mileage.title')}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{language === 'es' ? '🚗 Registro de Kilometraje' : '🚗 Mileage Tracking'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'Registra viajes de negocios con tasas CRA 2024 ($0.70/km primeros 5,000km). Calcula deducciones automáticamente para tu declaración de impuestos.' 
                        : 'Track business trips with CRA 2024 rates ($0.70/km first 5,000km). Calculate deductions automatically for your tax return.'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Suscripciones */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="subscriptions" 
                      className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-gradient-to-br data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white bg-pink-50 dark:bg-pink-950/30 border-2 border-pink-200 dark:border-pink-800 hover:border-pink-400 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="p-2 rounded-lg bg-pink-500/20">
                        <RefreshCw className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <span className="text-xs font-medium">{language === 'es' ? 'Suscripciones' : 'Subscriptions'}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{language === 'es' ? '🔄 Detector de Suscripciones' : '🔄 Subscription Detector'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'Detecta automáticamente pagos recurrentes en tus gastos. Ve el costo anual total y encuentra oportunidades de ahorro cancelando suscripciones.' 
                        : 'Automatically detect recurring payments in your expenses. See total annual cost and find savings opportunities by canceling subscriptions.'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* FIRE */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="fire" 
                      className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-xs font-medium">🔥 FIRE</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{language === 'es' ? '🔥 Calculadora FIRE' : '🔥 FIRE Calculator'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'Financial Independence, Retire Early. Calcula cuánto necesitas ahorrar para retirarte temprano con proyecciones Lean/Standard/Fat FIRE.' 
                        : 'Financial Independence, Retire Early. Calculate how much you need to save to retire early with Lean/Standard/Fat FIRE projections.'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Deudas */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="debt" 
                      className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-rose-600 data-[state=active]:text-white bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 hover:border-red-400 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <Landmark className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-xs font-medium">{language === 'es' ? 'Deudas' : 'Debt'}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{language === 'es' ? '💳 Gestor de Deudas' : '💳 Debt Manager'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'Estrategias de pago de deudas: Avalancha (interés alto primero) vs Bola de Nieve (saldo bajo primero). Ve cuánto pagarás y cuándo estarás libre.' 
                        : 'Debt payoff strategies: Avalanche (high interest first) vs Snowball (low balance first). See how much you\'ll pay and when you\'ll be debt-free.'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Portfolio */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="portfolio" 
                      className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="p-2 rounded-lg bg-indigo-500/20">
                        <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-xs font-medium">Portfolio</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{language === 'es' ? '📈 Portfolio de Inversiones' : '📈 Investment Portfolio'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'Rastrea tus inversiones: acciones, crypto, fondos. Ve rendimiento, distribución de activos y recibe tips personalizados según tu perfil de riesgo.' 
                        : 'Track your investments: stocks, crypto, funds. See performance, asset allocation, and get personalized tips based on your risk profile.'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Educación */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger 
                      value="education" 
                      className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white bg-teal-50 dark:bg-teal-950/30 border-2 border-teal-200 dark:border-teal-800 hover:border-teal-400 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="p-2 rounded-lg bg-teal-500/20">
                        <GraduationCap className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="text-xs font-medium">{language === 'es' ? 'Educación' : 'Education'}</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{language === 'es' ? '📚 Educación Financiera' : '📚 Financial Education'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'es' 
                        ? 'Rastrea tu progreso de lectura de libros financieros. Ve estadísticas de aprendizaje, rachas de lectura y configura recordatorios diarios.' 
                        : 'Track your financial book reading progress. See learning statistics, reading streaks, and set up daily reminders.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
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