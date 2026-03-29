import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  RefreshCw,
  Lightbulb,
  Search,
  PieChart,
  Wallet,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  MessageCircle,
  BarChart3,
  Upload
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useBankInsights, CATEGORY_LABELS, BankAlert, RecurringPayment } from '@/hooks/data/useBankAnalysis';
import { BankImportDialog } from '@/components/dialogs/BankImportDialog';
import { SmartSearchChat } from './SmartSearchChat';
import { CategoryTrendsChart } from './CategoryTrendsChart';
import { AnomalyAlerts } from './AnomalyAlerts';
import { Input } from '@/components/ui/input';
import { BankingWelcomeExperience } from './BankingWelcomeExperience';
import { FinancialHealthPanel } from './FinancialHealthPanel';
import { SmartBudgetIntegration } from './SmartBudgetIntegration';
 import { SpendingPredictor } from './SpendingPredictor';
 import { SavingsOpportunityFinder } from './SavingsOpportunityFinder';
 import { SubscriptionTracker } from '@/components/subscriptions/SubscriptionTracker';
 import { CashFlowForecast } from './CashFlowForecast';
 import { SmartInsightsEngine } from './SmartInsightsEngine';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function AlertCard({ alert, language }: { alert: BankAlert; language: string }) {
  const severityColors = {
    info: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10',
    warning: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10',
    critical: 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10',
  };

  const severityIcons = {
    info: <Lightbulb className="h-5 w-5 text-blue-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    critical: <AlertTriangle className="h-5 w-5 text-red-600" />,
  };

  return (
    <Card className={`border-l-4 ${severityColors[alert.severity]}`}>
      <CardContent className="py-3 flex items-start gap-3">
        {severityIcons[alert.severity]}
        <div>
          <p className="text-sm font-medium">{alert.message}</p>
          {alert.transaction && (
            <p className="text-xs text-muted-foreground mt-1">
              {alert.transaction.description} - ${alert.transaction.amount.toFixed(2)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RecurringPaymentCard({ payment, language }: { payment: RecurringPayment; language: string }) {
  const categoryInfo = CATEGORY_LABELS[payment.category] || CATEGORY_LABELS.other;
  
  return (
    <Card className="border-l-4 border-l-primary/50">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{categoryInfo.icon}</span>
            <div>
              <p className="font-medium text-sm">{payment.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {language === 'es' ? categoryInfo.es : categoryInfo.en}
                </Badge>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {payment.frequency === 'monthly' ? (language === 'es' ? 'Mensual' : 'Monthly') :
                   payment.frequency === 'weekly' ? (language === 'es' ? 'Semanal' : 'Weekly') :
                   payment.frequency === 'yearly' ? (language === 'es' ? 'Anual' : 'Yearly') : payment.frequency}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold">${payment.amount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              ${(payment.amount * 12).toFixed(0)}/{language === 'es' ? 'año' : 'year'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BankAnalysisDashboardProps {
  onImportClick?: () => void;
}

export function BankAnalysisDashboard({ onImportClick }: BankAnalysisDashboardProps) {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: transactions, isLoading } = useBankTransactions();
  const insights = useBankInsights();

  // Calculate summaries
  const totalTransactions = transactions?.length || 0;
  const totalAmount = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const matchedCount = transactions?.filter(t => t.matched_expense_id).length || 0;
  const pendingCount = transactions?.filter(t => t.status === 'pending' || t.status === 'unmatched').length || 0;

  // Filter transactions by search
  const filteredTransactions = transactions?.filter(t => 
    !searchQuery || 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Group transactions by vendor for bill tracking
  const vendorSummary = insights.topVendors.slice(0, 5);

  const handleImport = () => {
    if (onImportClick) {
      onImportClick();
    } else {
      setImportDialogOpen(true);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome/Onboarding Experience */}
        <BankingWelcomeExperience onImportClick={handleImport} />

        {/* Financial Insights - only show when has transactions */}
        {totalTransactions > 0 && (
          <div className="space-y-4">
            {/* Row 1: Smart Insights + Spending Predictor */}
            <div className="grid gap-4 lg:grid-cols-2">
              <SmartInsightsEngine />
              <SpendingPredictor />
            </div>
            
            {/* Row 2: Cash Flow + Savings Opportunities */}
            <div className="grid gap-4 lg:grid-cols-2">
              <CashFlowForecast />
              <SavingsOpportunityFinder />
            </div>
            
            {/* Row 3: Financial Health + Budget + Subscriptions */}
            <div className="grid gap-4 lg:grid-cols-3">
              <FinancialHealthPanel />
              <SmartBudgetIntegration />
              <SubscriptionTracker />
            </div>
          </div>
        )}

        {/* Header - compact on mobile */}
        {!isMobile && totalTransactions > 0 && (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                {language === 'es' ? 'Análisis Bancario Inteligente' : 'Smart Bank Analysis'}
              </h2>
              <p className="text-muted-foreground mt-1">
                {language === 'es' 
                  ? 'Analiza tus estados de cuenta, detecta patrones y recibe alertas'
                  : 'Analyze your statements, detect patterns and receive alerts'}
              </p>
            </div>
            <Button onClick={handleImport} className="bg-gradient-primary">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Importar Estado' : 'Import Statement'}
            </Button>
          </div>
        )}

        {/* Mobile: Import button - only if has transactions */}
        {isMobile && totalTransactions > 0 && (
          <Button onClick={handleImport} className="w-full bg-gradient-primary min-h-[44px]">
            <Upload className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Importar Estado de Cuenta' : 'Import Bank Statement'}
          </Button>
        )}

        {/* Summary Cards - 2x2 grid on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card className="p-2 sm:p-0">
            <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">{language === 'es' ? 'Transacciones' : 'Transactions'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{totalTransactions}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                ${totalAmount.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="p-2 sm:p-0">
            <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">{language === 'es' ? 'Recurrentes' : 'Recurring'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{insights.recurringPayments.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                ${insights.recurringPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}/{language === 'es' ? 'mes' : 'mo'}
              </p>
            </CardContent>
          </Card>

          <Card className="p-2 sm:p-0">
            <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                <span className="truncate">{language === 'es' ? 'Conciliados' : 'Matched'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{matchedCount}</div>
              <Progress 
                value={totalTransactions > 0 ? (matchedCount / totalTransactions) * 100 : 0} 
                className="h-1.5 sm:h-2 mt-1 sm:mt-2"
              />
            </CardContent>
          </Card>

          <Card className={`p-2 sm:p-0 ${pendingCount > 0 ? 'border-amber-500/30' : ''}`}>
            <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                <span className="truncate">{language === 'es' ? 'Pendientes' : 'Pending'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{pendingCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {language === 'es' ? 'requieren atención' : 'need attention'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs - horizontal scroll on mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className={`${isMobile ? 'inline-flex w-auto min-w-full' : 'grid w-full grid-cols-6'}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="overview" className="flex items-center gap-1 min-h-[40px] px-2 sm:px-4">
                    <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
                    {!isMobile && (language === 'es' ? 'Resumen' : 'Overview')}
                  </TabsTrigger>
                </TooltipTrigger>
                {isMobile && <TooltipContent>{language === 'es' ? 'Resumen' : 'Overview'}</TooltipContent>}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="search" className="flex items-center gap-1 min-h-[40px] px-2 sm:px-4">
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    {!isMobile && (language === 'es' ? 'Preguntar' : 'Ask')}
                  </TabsTrigger>
                </TooltipTrigger>
                {isMobile && <TooltipContent>{language === 'es' ? 'Preguntar' : 'Ask'}</TooltipContent>}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="trends" className="flex items-center gap-1 min-h-[40px] px-2 sm:px-4">
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    {!isMobile && (language === 'es' ? 'Tendencias' : 'Trends')}
                  </TabsTrigger>
                </TooltipTrigger>
                {isMobile && <TooltipContent>{language === 'es' ? 'Tendencias' : 'Trends'}</TooltipContent>}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="recurring" className="flex items-center gap-1 min-h-[40px] px-2 sm:px-4">
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                    {!isMobile && (language === 'es' ? 'Recurrentes' : 'Recurring')}
                  </TabsTrigger>
                </TooltipTrigger>
                {isMobile && <TooltipContent>{language === 'es' ? 'Recurrentes' : 'Recurring'}</TooltipContent>}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="transactions" className="flex items-center gap-1 min-h-[40px] px-2 sm:px-4">
                    <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                    {!isMobile && (language === 'es' ? 'Lista' : 'List')}
                  </TabsTrigger>
                </TooltipTrigger>
                {isMobile && <TooltipContent>{language === 'es' ? 'Lista' : 'List'}</TooltipContent>}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="alerts" className="flex items-center gap-1 min-h-[40px] px-2 sm:px-4">
                    <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                    {!isMobile && (language === 'es' ? 'Alertas' : 'Alerts')}
                  </TabsTrigger>
                </TooltipTrigger>
                {isMobile && <TooltipContent>{language === 'es' ? 'Alertas' : 'Alerts'}</TooltipContent>}
              </Tooltip>
            </TabsList>
          </div>

        <TabsContent value="search">
          <SmartSearchChat />
        </TabsContent>

        <TabsContent value="trends">
          <CategoryTrendsChart />
        </TabsContent>

        <TabsContent value="alerts">
          <AnomalyAlerts />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          {/* Reconciliation Progress */}
          {totalTransactions > 0 && (
            <Card className="border-primary/20">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{language === 'es' ? 'Progreso de Conciliación' : 'Reconciliation Progress'}</span>
                  <span className="text-xs font-bold text-primary">
                    {totalTransactions > 0 ? ((matchedCount / totalTransactions) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <Progress value={totalTransactions > 0 ? (matchedCount / totalTransactions) * 100 : 0} className="h-2.5" />
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>{matchedCount} {language === 'es' ? 'conciliados' : 'matched'}</span>
                  <span>{pendingCount} {language === 'es' ? 'pendientes' : 'pending'}</span>
                  <span>{totalTransactions - matchedCount - pendingCount} {language === 'es' ? 'otros' : 'other'}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Vendors with bar visualization */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{language === 'es' ? '🏪 Principales Comercios' : '🏪 Top Vendors'}</CardTitle>
                <CardDescription className="text-xs">{language === 'es' ? 'Dónde concentras tu gasto' : 'Where your spending concentrates'}</CardDescription>
              </CardHeader>
              <CardContent>
                {vendorSummary.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">
                    {language === 'es' ? 'Importa transacciones para ver análisis' : 'Import transactions to see analysis'}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {vendorSummary.map((vendor, index) => {
                      const maxTotal = vendorSummary[0]?.total || 1;
                      const pct = (vendor.total / maxTotal) * 100;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">{index + 1}</span>
                              <span className="font-medium truncate max-w-[140px]">{vendor.vendor}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-xs">${vendor.total.toFixed(0)}</span>
                              <span className="text-[10px] text-muted-foreground ml-1">({vendor.count}x)</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insights Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  {language === 'es' ? 'Resumen Inteligente' : 'Smart Summary'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {totalTransactions === 0 ? (
                  <div className="text-center py-6">
                    <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' ? 'Importa para obtener análisis' : 'Import to get analysis'}
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setImportDialogOpen(true)}>
                      {language === 'es' ? 'Importar' : 'Import'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {insights.recurringPayments.length > 0 && (
                      <div className="flex items-start gap-2 p-2.5 bg-primary/5 rounded-lg">
                        <RefreshCw className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs">
                          <span className="font-medium">{insights.recurringPayments.length}</span> {language === 'es' ? 'pagos recurrentes' : 'recurring payments'}: <span className="font-bold">${insights.recurringPayments.reduce((s, p) => s + p.amount, 0).toFixed(0)}</span>/{language === 'es' ? 'mes' : 'mo'}
                        </p>
                      </div>
                    )}
                    {pendingCount > 0 && (
                      <div className="flex items-start gap-2 p-2.5 bg-amber-500/5 rounded-lg">
                        <Clock className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs">
                          <span className="font-medium">{pendingCount}</span> {language === 'es' ? 'transacciones por conciliar' : 'transactions to reconcile'}
                        </p>
                      </div>
                    )}
                    {pendingCount > 5 && (
                      <div className="flex items-start gap-2 p-2.5 bg-destructive/5 rounded-lg">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                        <p className="text-xs">
                          {language === 'es' ? 'Muchas transacciones sin conciliar' : 'Many unreconciled transactions'}
                        </p>
                      </div>
                    )}
                    {matchedCount > 0 && (
                      <div className="flex items-start gap-2 p-2.5 bg-emerald-500/5 rounded-lg">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-xs">
                          <span className="font-medium">{matchedCount}</span> {language === 'es' ? 'conciliadas correctamente' : 'correctly reconciled'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'es' ? 'Pagos Recurrentes Detectados' : 'Detected Recurring Payments'}
              </CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Pagos automáticos, suscripciones y facturas periódicas'
                  : 'Automatic payments, subscriptions and periodic bills'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.recurringPayments.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-muted-foreground text-sm">
                    {language === 'es' 
                      ? 'No se detectaron pagos recurrentes. Importa más transacciones para detectar patrones.'
                      : 'No recurring payments detected. Import more transactions to detect patterns.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shadow-sm hover:shadow-md transition-all"
                    onClick={onImportClick}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {language === 'es' ? 'Importar Estado de Cuenta' : 'Import Bank Statement'}
                  </Button>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                    {language === 'es'
                      ? '💡 También puedes registrar pagos fijos manualmente en'
                      : '💡 You can also manually register fixed payments in'}{' '}
                    <a href="/bills" className="underline underline-offset-2 hover:text-foreground transition-colors font-medium">
                      {language === 'es' ? 'Pagos Fijos' : 'Fixed Payments'}
                    </a>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.recurringPayments.map((payment, index) => (
                    <RecurringPaymentCard 
                      key={index} 
                      payment={payment} 
                      language={language} 
                    />
                  ))}
                  
                  {/* Total */}
                  <div className="pt-4 border-t mt-4">
                    <div className="flex items-center justify-between font-bold">
                      <span>{language === 'es' ? 'Total Mensual' : 'Monthly Total'}</span>
                      <span className="text-lg">
                        ${insights.recurringPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                      <span>{language === 'es' ? 'Total Anual' : 'Annual Total'}</span>
                      <span>
                        ${(insights.recurringPayments.reduce((sum, p) => sum + p.amount, 0) * 12).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {language === 'es' ? 'Todas las Transacciones' : 'All Transactions'}
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'es' ? 'Buscar...' : 'Search...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {language === 'es' ? 'No hay transacciones' : 'No transactions'}
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredTransactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ArrowDownRight className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(transaction.transaction_date), 'dd MMM yyyy', {
                              locale: language === 'es' ? es : undefined
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">${Number(transaction.amount).toFixed(2)}</span>
                        <Badge 
                          variant="outline" 
                          className={transaction.matched_expense_id 
                            ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}
                        >
                          {transaction.matched_expense_id 
                            ? (language === 'es' ? 'Conciliado' : 'Matched')
                            : (language === 'es' ? 'Pendiente' : 'Pending')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {language === 'es' ? 'Alertas y Notificaciones' : 'Alerts & Notifications'}
              </CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Cobros inusuales, duplicados o cambios significativos'
                  : 'Unusual charges, duplicates or significant changes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500/50 mb-4" />
                <p className="font-medium">
                  {language === 'es' ? 'Sin alertas activas' : 'No active alerts'}
                </p>
                <p className="text-sm mt-1">
                  {language === 'es' 
                    ? 'Te notificaremos cuando detectemos algo inusual en tus transacciones'
                    : 'We\'ll notify you when we detect something unusual in your transactions'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BankImportDialog 
        open={importDialogOpen} 
        onClose={() => setImportDialogOpen(false)} 
      />
    </div>
    </TooltipProvider>
  );
}
