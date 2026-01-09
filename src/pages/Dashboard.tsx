import { useState, useMemo, useCallback, lazy, Suspense, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Receipt, Users, Download, Scale, MapPin, RefreshCw, Landmark, Briefcase, BarChart3, GraduationCap, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { ViewModeToggle, OrganizedDashboard } from '@/components/focus';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { YearTimelineChart } from '@/components/dashboard/YearTimelineChart';
import { MonthDetailPanel } from '@/components/dashboard/MonthDetailPanel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
const GlobalBudgetCard = lazy(() => import('@/components/dashboard/GlobalBudgetCard').then(m => ({ default: m.GlobalBudgetCard })));
const BudgetHistoryChart = lazy(() => import('@/components/dashboard/BudgetHistoryChart').then(m => ({ default: m.BudgetHistoryChart })));
const CategoryBudgetsCard = lazy(() => import('@/components/dashboard/CategoryBudgetsCard').then(m => ({ default: m.CategoryBudgetsCard })));
const BudgetAlertsCard = lazy(() => import('@/components/dashboard/BudgetAlertsCard').then(m => ({ default: m.BudgetAlertsCard })));
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

  const { refreshSubscription } = useSubscription();
  const { viewMode } = useDisplayPreferences();

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

  // Deep-linking: open the Control Center on a specific tab (used by InteractiveWelcome)
  useEffect(() => {
    const tab = searchParams.get('tab');
    const allowedTabs = [
      'charts',
      'analytics',
      'mentorship',
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

  return (
    <Layout>
      <TooltipProvider delayDuration={200}>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Interactive Guide - Shown on first visit or on demand */}
          {showGuide && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <InteractiveWelcome />
            </div>
          )}
          
          {/* =============================================
               FASE 1-2: Timeline Anual + Mes Expandido
               (siempre visible; esto es el “contenido” principal)
             ============================================= */}

          <YearTimelineChart
            selectedMonth={selectedMonth}
            onMonthSelect={setSelectedMonth}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />

          <MonthDetailPanel
            year={selectedYear}
            month={selectedMonth}
            onAddIncome={handleAddIncome}
            onAddExpense={handleAddExpense}
          />

          {/* View Mode Toggle + Export (siempre visible) */}
          <div className="flex items-center justify-between gap-4 py-2">
            <ViewModeToggle />
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
                    className="w-full gap-2 border-dashed"
                  >
                    {showAllTools ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <BarChart3 className="h-4 w-4" />
                    {language === 'es' ? 'Centro de Control Avanzado' : 'Advanced Control Center'}
                    {showAllTools ? '' : ` (${language === 'es' ? 'expandir' : 'expand'})`}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pt-4">
                  <Card className="border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-3 pt-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg font-semibold">
                          {language === 'es' ? 'Herramientas Avanzadas' : 'Advanced Tools'}
                        </CardTitle>
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
                            <Scale className="h-4 w-4 mr-1.5" />
                            {language === 'es' ? 'Análisis' : 'Analytics'}
                          </TabsTrigger>
                          <TabsTrigger value="mentorship" className="px-3 py-2 text-xs rounded-md data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                            <GraduationCap className="h-4 w-4 mr-1.5" />
                            {language === 'es' ? 'Mentoría' : 'Mentorship'}
                          </TabsTrigger>
                          
                          {/* More dropdown for less-used tabs */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="px-3 py-2 h-auto text-xs">
                                <MoreHorizontal className="h-4 w-4 mr-1.5" />
                                {language === 'es' ? 'Más' : 'More'}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setActiveTab('tax')}>
                                <Receipt className="h-4 w-4 mr-2" />
                                {language === 'es' ? 'Impuestos' : 'Taxes'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setActiveTab('mileage')}>
                                <MapPin className="h-4 w-4 mr-2" />
                                {language === 'es' ? 'Kilometraje' : 'Mileage'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setActiveTab('subscriptions')}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                {language === 'es' ? 'Suscripciones' : 'Subscriptions'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setActiveTab('fire')}>
                                🔥 FIRE
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setActiveTab('debt')}>
                                <Landmark className="h-4 w-4 mr-2" />
                                {language === 'es' ? 'Deudas' : 'Debt'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setActiveTab('portfolio')}>
                                <Briefcase className="h-4 w-4 mr-2" />
                                Portfolio
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setActiveTab('education')}>
                                <GraduationCap className="h-4 w-4 mr-2" />
                                {language === 'es' ? 'Educación' : 'Education'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                                <div className="grid gap-6 lg:grid-cols-2">
                                  <GlobalBudgetCard />
                                  <BudgetHistoryChart />
                                </div>
                                <div className="grid gap-6 lg:grid-cols-2">
                                  <BudgetAlertsCard />
                                  <CategoryBudgetsCard />
                                </div>
                                <IncomeVsExpensesChart />
                                <div className="grid gap-6 lg:grid-cols-2">
                                  <SavingsRateChart />
                                  <YearOverYearComparison />
                                </div>
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
                                <Suspense fallback={<Skeleton className="h-[500px]" />}>
                                  <TaxOptimizerCard />
                                </Suspense>
                                <Suspense fallback={<Skeleton className="h-[500px]" />}>
                                  <RrspTfsaOptimizerCard />
                                </Suspense>
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
                            <Suspense fallback={<Skeleton className="h-64" />}>
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
