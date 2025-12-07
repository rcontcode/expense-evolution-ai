import { useState, useMemo, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Receipt, Users, DollarSign, FileText, TrendingUp, TrendingDown, Download, Car, BadgeDollarSign, Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useClients } from '@/hooks/data/useClients';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncomeSummary } from '@/hooks/data/useIncome';
import { useTaxCalculations } from '@/hooks/data/useTaxCalculations';
import { useMileageSummary, CRA_MILEAGE_RATES } from '@/hooks/data/useMileage';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { TaxSummaryCards } from '@/components/dashboard/TaxSummaryCards';
import { ExportDialog } from '@/components/export/ExportDialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { InfoTooltip, TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePageVisitTracker } from '@/hooks/data/useMissionAutoTracker';
import { OnboardingGuide } from '@/components/ui/onboarding-guide';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const categoryChartConfig = {
  total: {
    label: "Total",
  },
} satisfies ChartConfig;

const clientChartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const trendChartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Track dashboard visit for missions
  usePageVisitTracker('view_dashboard');

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

  const handleResetFilters = useCallback(() => {
    setSelectedClient('all');
    setSelectedStatus('all');
    setSelectedCategory('all');
  }, []);

  return (
    <Layout>
      <TooltipProvider delayDuration={200}>
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold">{t('dashboard.welcome')}</h1>
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

          {/* Onboarding Guide */}
          <OnboardingGuide pageKey="dashboard" />

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

        {/* Tabs para Gráficos y Análisis Fiscal */}
        <Tabs defaultValue="charts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <InfoTooltip content={TOOLTIP_CONTENT.chartsTab} variant="wrapper" side="bottom">
              <TabsTrigger value="charts" className="cursor-pointer">{t('taxAnalysis.charts')}</TabsTrigger>
            </InfoTooltip>
            <InfoTooltip content={TOOLTIP_CONTENT.taxTab} variant="wrapper" side="bottom">
              <TabsTrigger value="tax" className="cursor-pointer">{t('taxAnalysis.taxAnalysis')}</TabsTrigger>
            </InfoTooltip>
            <InfoTooltip content={TOOLTIP_CONTENT.mileageTab} variant="wrapper" side="bottom">
              <TabsTrigger value="mileage" className="cursor-pointer">{t('mileage.title')}</TabsTrigger>
            </InfoTooltip>
          </TabsList>

          <TabsContent value="charts" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.expensesByCategory')}</CardTitle>
                  <CardDescription>{t('taxAnalysis.top5Categories')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : stats?.categoryBreakdown.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      {t('taxAnalysis.noDataAvailable')}
                    </div>
                  ) : (
                    <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                      <PieChart>
                        <Pie
                          data={stats?.categoryBreakdown}
                          dataKey="total"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {stats?.categoryBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.expensesByClient')}</CardTitle>
                  <CardDescription>{t('taxAnalysis.top5Clients')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : stats?.clientBreakdown.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      {t('taxAnalysis.noDataAvailable')}
                    </div>
                  ) : (
                    <ChartContainer config={clientChartConfig} className="h-[300px] w-full">
                      <BarChart data={stats?.clientBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="client_name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="total" fill="hsl(var(--chart-1))" />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Trends */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.monthlyTrends')}</CardTitle>
                <CardDescription>{t('taxAnalysis.last6Months')}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
                    <LineChart data={stats?.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="total" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            <TaxSummaryCards taxSummary={taxSummary} />
          </TabsContent>

          <TabsContent value="mileage" className="space-y-4">
            {mileageLoading ? (
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : mileageSummary && mileageSummary.totalTrips > 0 ? (
              <div className="space-y-4">
                {/* Mileage Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('mileage.totalKm')}</CardTitle>
                      <Car className="h-4 w-4 text-chart-1" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{mileageSummary.totalKilometers.toFixed(1)} km</div>
                      <p className="text-xs text-muted-foreground">
                        {mileageSummary.totalTrips} {t('mileage.trips')} {t('dashboard.thisYear')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('mileage.totalDeduction')}</CardTitle>
                      <TrendingUp className="h-4 w-4 text-chart-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-chart-2">
                        ${mileageSummary.totalDeductibleAmount.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">{t('mileage.craRates')}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('mileage.itcEstimate')}</CardTitle>
                      <BadgeDollarSign className="h-4 w-4 text-chart-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-chart-4">
                        ${mileageSummary.itcClaimable.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">{t('mileage.fuelHstEstimate')}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* CRA Rate Progress */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      {t('mileage.craRatesTitle')}
                    </CardTitle>
                    <CardDescription>{t('mileage.craRatesDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">{t('mileage.first5000')}</div>
                        <div className="text-lg font-bold">${CRA_MILEAGE_RATES.first5000.toFixed(2)}/km</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">{t('mileage.after5000')}</div>
                        <div className="text-lg font-bold">${CRA_MILEAGE_RATES.after5000.toFixed(2)}/km</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('mileage.progressTo5000')}</span>
                        <span className={mileageSummary.yearToDateKm < 5000 ? 'text-chart-1' : 'text-muted-foreground'}>
                          {Math.min(mileageSummary.yearToDateKm, 5000).toFixed(0)} / 5,000 km
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-chart-1 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((mileageSummary.yearToDateKm / 5000) * 100, 100)}%` }}
                        />
                      </div>
                      {mileageSummary.yearToDateKm < 5000 && (
                        <p className="text-xs text-muted-foreground">
                          {(5000 - mileageSummary.yearToDateKm).toFixed(0)} km {t('mileage.kmAtHighRate')}
                        </p>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/mileage')}
                      className="w-full"
                    >
                      <Car className="mr-2 h-4 w-4" />
                      {t('dashboard.viewAllMileage')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Car className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('mileage.noRecords')}</p>
                  <p className="text-sm text-muted-foreground mb-4">{t('mileage.startTracking')}</p>
                  <Button onClick={() => navigate('/mileage')}>
                    <Car className="mr-2 h-4 w-4" />
                    {t('mileage.addFirstTrip')}
                  </Button>
                </CardContent>
              </Card>
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