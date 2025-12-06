import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  RefreshCw, 
  Upload, 
  FileSpreadsheet, 
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  HelpCircle,
  Banknote,
  Receipt,
  Sparkles,
  Trash2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { EmptyStateWithGuide } from '@/components/ui/feature-guide';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BankImportDialog } from '@/components/dialogs/BankImportDialog';
import { useBankTransactions, useDeleteBankTransaction } from '@/hooks/data/useBankTransactions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export default function Reconciliation() {
  const { t, language } = useLanguage();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  const { data: transactions = [], isLoading } = useBankTransactions();
  const deleteTransaction = useDeleteBankTransaction();

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const matchedTransactions = transactions.filter(t => t.status === 'matched');
  const discrepancyTransactions = transactions.filter(t => t.status === 'discrepancy');

  const guideSteps = [
    {
      icon: <Upload className="h-5 w-5 text-primary" />,
      title: language === 'es' ? 'Sube tu estado bancario' : 'Upload bank statement',
      description: language === 'es' 
        ? 'Exporta el CSV desde tu banco o toma una foto'
        : 'Export CSV from your bank or take a photo',
    },
    {
      icon: <ArrowLeftRight className="h-5 w-5 text-primary" />,
      title: language === 'es' ? 'Conciliación automática' : 'Automatic matching',
      description: language === 'es'
        ? 'El sistema compara transacciones con tus gastos registrados'
        : 'The system compares transactions with your recorded expenses',
    },
    {
      icon: <CheckCircle2 className="h-5 w-5 text-success" />,
      title: language === 'es' ? 'Revisa y confirma' : 'Review and confirm',
      description: language === 'es'
        ? 'Verifica las coincidencias y resuelve las discrepancias'
        : 'Verify matches and resolve discrepancies',
    },
  ];

  return (
    <Layout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{t('nav.reconciliation')}</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                {language === 'es' ? 'Beta' : 'Beta'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              {language === 'es' 
                ? 'Compara tus transacciones bancarias con los gastos registrados para mantener tu contabilidad perfecta'
                : 'Compare your bank transactions with recorded expenses to keep your accounting perfect'}
            </p>
          </div>
          <Button 
            onClick={() => setImportDialogOpen(true)}
            className="bg-gradient-primary hover:opacity-90 shadow-glow"
          >
            <Upload className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Importar Estado Bancario' : 'Import Bank Statement'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isLoading ? '-' : transactions.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Transacciones bancarias' : 'Bank transactions'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isLoading ? '-' : matchedTransactions.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Conciliadas' : 'Matched'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isLoading ? '-' : pendingTransactions.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Pendientes' : 'Pending'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isLoading ? '-' : discrepancyTransactions.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Discrepancias' : 'Discrepancies'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : transactions.length === 0 ? (
          <EmptyStateWithGuide
            icon={<RefreshCw className="h-8 w-8 text-muted-foreground" />}
            title={language === 'es' ? 'Sin transacciones bancarias' : 'No bank transactions'}
            description={
              language === 'es'
                ? 'Importa tu estado de cuenta bancario para comenzar a conciliar tus gastos automáticamente'
                : 'Import your bank statement to start reconciling your expenses automatically'
            }
            guideTitle={language === 'es' ? '¿Para qué sirve la conciliación?' : 'What is reconciliation for?'}
            steps={guideSteps}
            onAction={() => setImportDialogOpen(true)}
            actionLabel={language === 'es' ? 'Importar Estado Bancario' : 'Import Bank Statement'}
          />
        ) : (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {language === 'es' ? 'Pendientes' : 'Pending'} ({pendingTransactions.length})
              </TabsTrigger>
              <TabsTrigger value="matched" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {language === 'es' ? 'Conciliadas' : 'Matched'} ({matchedTransactions.length})
              </TabsTrigger>
              <TabsTrigger value="discrepancies" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {language === 'es' ? 'Discrepancias' : 'Discrepancies'} ({discrepancyTransactions.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              <Card>
                <CardContent className="p-4 space-y-3">
                  {pendingTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {language === 'es' 
                        ? 'No hay transacciones pendientes de conciliar'
                        : 'No pending transactions to reconcile'}
                    </p>
                  ) : (
                    pendingTransactions.map(transaction => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-warning" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description || (language === 'es' ? 'Sin descripción' : 'No description')}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(transaction.transaction_date), 'dd MMM yyyy', {
                                locale: language === 'es' ? es : undefined
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-destructive">
                            -${transaction.amount.toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteTransaction.mutate(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="matched">
              <Card>
                <CardContent className="p-4 space-y-3">
                  {matchedTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {language === 'es' 
                        ? 'No hay transacciones conciliadas'
                        : 'No matched transactions'}
                    </p>
                  ) : (
                    matchedTransactions.map(transaction => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(transaction.transaction_date), 'dd MMM yyyy', {
                                locale: language === 'es' ? es : undefined
                              })}
                            </div>
                          </div>
                        </div>
                        <span className="font-bold">${transaction.amount.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="discrepancies">
              <Card>
                <CardContent className="p-4 space-y-3">
                  {discrepancyTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {language === 'es' 
                        ? 'No hay discrepancias detectadas'
                        : 'No discrepancies detected'}
                    </p>
                  ) : (
                    discrepancyTransactions.map(transaction => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(transaction.transaction_date), 'dd MMM yyyy', {
                                locale: language === 'es' ? es : undefined
                              })}
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-destructive">${transaction.amount.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Benefits Section */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              {language === 'es' ? '¿Por qué conciliar?' : 'Why reconcile?'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">
                    {language === 'es' ? 'Detecta errores' : 'Detect errors'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'es'
                      ? 'Identifica gastos duplicados o faltantes en tu registro'
                      : 'Identify duplicate or missing expenses in your records'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Receipt className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">
                    {language === 'es' ? 'Contabilidad precisa' : 'Accurate accounting'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'es'
                      ? 'Asegura que tus reportes fiscales sean exactos'
                      : 'Ensure your tax reports are accurate'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">
                    {language === 'es' ? 'Prepárate para el CRA' : 'Prepare for CRA'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'es'
                      ? 'Documentación completa para auditorías fiscales'
                      : 'Complete documentation for tax audits'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Dialog */}
      <BankImportDialog 
        open={importDialogOpen} 
        onClose={() => setImportDialogOpen(false)} 
      />
    </Layout>
  );
}
