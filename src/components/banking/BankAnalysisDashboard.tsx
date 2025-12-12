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
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useBankInsights, CATEGORY_LABELS, BankAlert, RecurringPayment } from '@/hooks/data/useBankAnalysis';
import { BankImportDialog } from '@/components/dialogs/BankImportDialog';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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

export function BankAnalysisDashboard() {
  const { language } = useLanguage();
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

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <Button onClick={() => setImportDialogOpen(true)} className="bg-gradient-primary">
          <ArrowUpRight className="h-4 w-4 mr-2" />
          {language === 'es' ? 'Importar Estado' : 'Import Statement'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {language === 'es' ? 'Total Transacciones' : 'Total Transactions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              ${totalAmount.toFixed(2)} {language === 'es' ? 'procesados' : 'processed'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {language === 'es' ? 'Pagos Recurrentes' : 'Recurring Payments'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.recurringPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              ${insights.recurringPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}/
              {language === 'es' ? 'mes' : 'month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              {language === 'es' ? 'Conciliados' : 'Matched'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchedCount}</div>
            <Progress 
              value={totalTransactions > 0 ? (matchedCount / totalTransactions) * 100 : 0} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card className={pendingCount > 0 ? 'border-amber-500/30' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              {language === 'es' ? 'Pendientes' : 'Pending'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'requieren atención' : 'need attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <PieChart className="h-3 w-3" />
            {language === 'es' ? 'Resumen' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="recurring" className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            {language === 'es' ? 'Recurrentes' : 'Recurring'}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-1">
            <Wallet className="h-3 w-3" />
            {language === 'es' ? 'Transacciones' : 'Transactions'}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {language === 'es' ? 'Alertas' : 'Alerts'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Vendors/Bills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'es' ? 'Principales Comercios' : 'Top Vendors'}
                </CardTitle>
                <CardDescription>
                  {language === 'es' ? 'Dónde gastas más' : 'Where you spend the most'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vendorSummary.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {language === 'es' 
                      ? 'Importa un estado de cuenta para ver análisis'
                      : 'Import a bank statement to see analysis'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {vendorSummary.map((vendor, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium">{vendor.vendor}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">${vendor.total.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({vendor.count}x)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  {language === 'es' ? 'Observaciones' : 'Insights'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {totalTransactions === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {language === 'es' 
                        ? 'Sube un estado de cuenta bancario para obtener análisis inteligente'
                        : 'Upload a bank statement to get smart analysis'}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setImportDialogOpen(true)}
                    >
                      {language === 'es' ? 'Importar Ahora' : 'Import Now'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.recurringPayments.length > 0 && (
                      <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg">
                        <p className="text-sm">
                          {language === 'es' 
                            ? `Tienes ${insights.recurringPayments.length} pagos recurrentes detectados que suman $${insights.recurringPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)}/mes`
                            : `You have ${insights.recurringPayments.length} detected recurring payments totaling $${insights.recurringPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)}/month`}
                        </p>
                      </div>
                    )}
                    {pendingCount > 0 && (
                      <div className="p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg">
                        <p className="text-sm">
                          {language === 'es' 
                            ? `${pendingCount} transacciones pendientes de clasificar o conciliar`
                            : `${pendingCount} transactions pending classification or reconciliation`}
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
                <p className="text-center text-muted-foreground py-8">
                  {language === 'es' 
                    ? 'No se detectaron pagos recurrentes. Importa más transacciones para detectar patrones.'
                    : 'No recurring payments detected. Import more transactions to detect patterns.'}
                </p>
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
  );
}
