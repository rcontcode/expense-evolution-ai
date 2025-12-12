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
  DollarSign,
  Link2,
  Zap,
  ChevronDown,
  ChevronUp,
  Wand2,
  LayoutGrid
} from 'lucide-react';
import { EmptyStateWithGuide } from '@/components/ui/feature-guide';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BankImportDialog } from '@/components/dialogs/BankImportDialog';
import { 
  useBankTransactions, 
  useBankTransactionsWithMatches,
  useDeleteBankTransaction, 
  useMatchTransaction,
  useMarkAsDiscrepancy,
  TransactionWithMatches,
  ExpenseMatch
} from '@/hooks/data/useBankTransactions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ReconciliationWizard } from '@/components/reconciliation/ReconciliationWizard';

function MatchScoreBadge({ score, matchType }: { score: number; matchType: string }) {
  const { language } = useLanguage();
  
  const getColor = () => {
    if (score >= 90) return 'bg-success/10 text-success border-success/20';
    if (score >= 70) return 'bg-primary/10 text-primary border-primary/20';
    if (score >= 50) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-muted text-muted-foreground';
  };

  const getLabel = () => {
    if (matchType === 'exact') return language === 'es' ? 'Coincidencia exacta' : 'Exact match';
    if (matchType === 'amount') return language === 'es' ? 'Mismo monto' : 'Same amount';
    if (matchType === 'date') return language === 'es' ? 'Misma fecha' : 'Same date';
    return language === 'es' ? 'Posible coincidencia' : 'Possible match';
  };

  return (
    <Badge variant="outline" className={`${getColor()} text-xs`}>
      {score}% - {getLabel()}
    </Badge>
  );
}

function SuggestedMatchCard({ 
  match, 
  onConfirm, 
  isLoading 
}: { 
  match: ExpenseMatch; 
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const { language } = useLanguage();
  
  return (
    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Receipt className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">
            {match.expense.vendor || match.expense.description || (language === 'es' ? 'Sin descripción' : 'No description')}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>${Number(match.expense.amount).toFixed(2)}</span>
            <span>•</span>
            <span>{format(new Date(match.expense.date), 'dd MMM', { locale: language === 'es' ? es : undefined })}</span>
            {match.expense.category && (
              <>
                <span>•</span>
                <span className="capitalize">{match.expense.category}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <MatchScoreBadge score={match.score} matchType={match.matchType} />
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isLoading}
          className="bg-success hover:bg-success/90"
        >
          <Link2 className="h-3 w-3 mr-1" />
          {language === 'es' ? 'Vincular' : 'Link'}
        </Button>
      </div>
    </div>
  );
}

function TransactionWithSuggestions({ 
  transaction,
  onMatch,
  onMarkDiscrepancy,
  onDelete,
  isMatchLoading,
}: { 
  transaction: TransactionWithMatches;
  onMatch: (expenseId: string) => void;
  onMarkDiscrepancy: () => void;
  onDelete: () => void;
  isMatchLoading: boolean;
}) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(transaction.suggestedMatches.length > 0);
  const hasMatches = transaction.suggestedMatches.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`rounded-lg border ${hasMatches ? 'border-primary/30 bg-primary/5' : 'bg-muted/50'}`}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              hasMatches ? 'bg-primary/10' : 'bg-warning/10'
            }`}>
              {hasMatches ? (
                <Zap className="h-5 w-5 text-primary" />
              ) : (
                <DollarSign className="h-5 w-5 text-warning" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">
                  {transaction.description || (language === 'es' ? 'Sin descripción' : 'No description')}
                </p>
                {hasMatches && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                    {transaction.suggestedMatches.length} {language === 'es' ? 'sugerencia(s)' : 'suggestion(s)'}
                  </Badge>
                )}
              </div>
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
              -${Number(transaction.amount).toFixed(2)}
            </span>
            {hasMatches && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-warning"
              onClick={onMarkDiscrepancy}
              title={language === 'es' ? 'Marcar como discrepancia' : 'Mark as discrepancy'}
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          {hasMatches && (
            <div className="px-3 pb-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                {language === 'es' ? 'Gastos que podrían coincidir:' : 'Expenses that might match:'}
              </p>
              {transaction.suggestedMatches.map((match) => (
                <SuggestedMatchCard
                  key={match.expense.id}
                  match={match}
                  onConfirm={() => onMatch(match.expense.id)}
                  isLoading={isMatchLoading}
                />
              ))}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function Reconciliation() {
  const { t, language } = useLanguage();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState(true);
  
  const { data: transactions = [], isLoading } = useBankTransactions();
  const { data: transactionsWithMatches = [], isLoading: isLoadingMatches } = useBankTransactionsWithMatches();
  const deleteTransaction = useDeleteBankTransaction();
  const matchTransaction = useMatchTransaction();
  const markAsDiscrepancy = useMarkAsDiscrepancy();

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const matchedTransactions = transactions.filter(t => t.status === 'matched');
  const discrepancyTransactions = transactions.filter(t => t.status === 'discrepancy');

  const transactionsWithSuggestions = transactionsWithMatches.filter(t => t.suggestedMatches.length > 0);
  const autoMatchRate = pendingTransactions.length > 0 
    ? Math.round((transactionsWithSuggestions.length / pendingTransactions.length) * 100)
    : 0;

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

  const handleMatch = (transactionId: string, expenseId: string) => {
    matchTransaction.mutate({ transactionId, expenseId });
  };

  // Show wizard mode
  if (wizardMode) {
    return (
      <Layout>
        <div className="p-8 space-y-6">
          {/* Header with mode toggle */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{t('nav.reconciliation')}</h1>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  <Wand2 className="h-3 w-3 mr-1" />
                  {language === 'es' ? 'Modo Asistente' : 'Assistant Mode'}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-2">
                {language === 'es' 
                  ? 'Tu asistente de contabilidad personal te guiará paso a paso'
                  : 'Your personal accounting assistant will guide you step by step'}
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => setWizardMode(false)}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Modo Avanzado' : 'Advanced Mode'}
            </Button>
          </div>

          {/* Wizard content */}
          <ReconciliationWizard onExitWizard={() => setWizardMode(false)} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{t('nav.reconciliation')}</h1>
              <Badge variant="secondary" className="bg-muted text-muted-foreground border-0">
                <LayoutGrid className="h-3 w-3 mr-1" />
                {language === 'es' ? 'Modo Avanzado' : 'Advanced Mode'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              {language === 'es' 
                ? 'Compara tus transacciones bancarias con los gastos registrados para mantener tu contabilidad perfecta'
                : 'Compare your bank transactions with recorded expenses to keep your accounting perfect'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setWizardMode(true)}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Modo Asistente' : 'Assistant Mode'}
            </Button>
            <Button 
              onClick={() => setImportDialogOpen(true)}
              className="bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              <Upload className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Importar Estado Bancario' : 'Import Bank Statement'}
            </Button>
          </div>
        </div>

        {/* Contextual Page Guide */}
        <PageContextGuide
          {...PAGE_GUIDES.reconciliation}
          actions={[
            { icon: Upload, title: { es: 'Importar', en: 'Import' }, description: { es: 'Estado bancario', en: 'Bank statement' }, action: () => setImportDialogOpen(true) },
            { icon: Link2, title: { es: 'Emparejar', en: 'Match' }, description: { es: 'Transacciones', en: 'Transactions' }, action: () => {} },
            { icon: Wand2, title: { es: 'Modo Asistente', en: 'Assistant Mode' }, description: { es: 'Guía paso a paso', en: 'Step by step guide' }, action: () => setWizardMode(true) },
            { icon: AlertTriangle, title: { es: 'Discrepancias', en: 'Discrepancies' }, description: { es: 'Sin emparejar', en: 'Unmatched' }, action: () => {} }
          ]}
        />

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

        {/* Auto-match progress */}
        {pendingTransactions.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {language === 'es' ? 'Conciliación Automática' : 'Auto-Matching'}
                  </span>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {transactionsWithSuggestions.length} / {pendingTransactions.length} {language === 'es' ? 'con sugerencias' : 'with suggestions'}
                </Badge>
              </div>
              <Progress value={autoMatchRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {language === 'es' 
                  ? `${autoMatchRate}% de las transacciones pendientes tienen gastos que podrían coincidir`
                  : `${autoMatchRate}% of pending transactions have expenses that might match`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {isLoading || isLoadingMatches ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
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
                  {transactionsWithMatches.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {language === 'es' 
                        ? 'No hay transacciones pendientes de conciliar'
                        : 'No pending transactions to reconcile'}
                    </p>
                  ) : (
                    transactionsWithMatches.map(transaction => (
                      <TransactionWithSuggestions
                        key={transaction.id}
                        transaction={transaction}
                        onMatch={(expenseId) => handleMatch(transaction.id, expenseId)}
                        onMarkDiscrepancy={() => markAsDiscrepancy.mutate(transaction.id)}
                        onDelete={() => deleteTransaction.mutate(transaction.id)}
                        isMatchLoading={matchTransaction.isPending}
                      />
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
                            <p className="font-medium text-sm">{transaction.description || (language === 'es' ? 'Sin descripción' : 'No description')}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(transaction.transaction_date), 'dd MMM yyyy', {
                                locale: language === 'es' ? es : undefined
                              })}
                              <span>•</span>
                              <Link2 className="h-3 w-3" />
                              <span>{language === 'es' ? 'Vinculada a gasto' : 'Linked to expense'}</span>
                            </div>
                          </div>
                        </div>
                        <span className="font-bold">${Number(transaction.amount).toFixed(2)}</span>
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
                          <span className="font-bold text-destructive">${Number(transaction.amount).toFixed(2)}</span>
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
