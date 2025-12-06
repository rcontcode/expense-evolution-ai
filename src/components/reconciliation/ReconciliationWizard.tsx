import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Sparkles, 
  Upload, 
  ArrowRight, 
  CheckCircle2, 
  FileSpreadsheet,
  Camera,
  Receipt,
  ArrowLeftRight,
  Target,
  AlertTriangle,
  PartyPopper,
  Lightbulb,
  ChevronLeft,
  Wallet,
  Building2,
  User,
  TrendingUp,
  Plus,
  Volume2,
  VolumeX,
  Split,
  Link2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { BankImportDialog } from '@/components/dialogs/BankImportDialog';
import { useBankTransactions, useBankTransactionsWithMatches, useMatchTransaction, useMarkAsDiscrepancy } from '@/hooks/data/useBankTransactions';
import { useExpenses, useCreateExpense } from '@/hooks/data/useExpenses';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { ExpenseFormValues } from '@/lib/validations/expense.schema';
import { SplitTransactionDialog } from './SplitTransactionDialog';
import { LinkExpenseDialog } from './LinkExpenseDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useCelebrationSound } from '@/hooks/utils/useCelebrationSound';

interface Flow {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  steps: string[];
  color: string;
}

interface TransactionForExpense {
  id: string;
  amount: number;
  description: string | null;
  transaction_date: string;
}

type WizardStep = 'welcome' | 'select-flow' | 'import' | 'review-matches' | 'resolve-pending' | 'summary';

export function ReconciliationWizard({ onExitWizard }: { onExitWizard: () => void }) {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);
  const [discrepancyCount, setDiscrepancyCount] = useState(0);
  const [createExpenseDialogOpen, setCreateExpenseDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionForExpense | null>(null);
  const [createdExpensesCount, setCreatedExpensesCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [transactionToSplit, setTransactionToSplit] = useState<TransactionForExpense | null>(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [transactionToLink, setTransactionToLink] = useState<TransactionForExpense | null>(null);
  
  const { playSuccessSound, playCelebrationSound, playFullCelebration } = useCelebrationSound();
  
  const { data: transactions = [] } = useBankTransactions();
  const { data: transactionsWithMatches = [] } = useBankTransactionsWithMatches();
  const { data: expenses = [] } = useExpenses();
  const matchTransaction = useMatchTransaction();
  const markAsDiscrepancy = useMarkAsDiscrepancy();
  const createExpense = useCreateExpense();

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const matchedTransactions = transactions.filter(t => t.status === 'matched');

  // Trigger confetti and sound when reaching summary with all complete
  useEffect(() => {
    if (currentStep === 'summary') {
      const allComplete = pendingTransactions.length === 0;
      
      // Always celebrate reaching summary
      const celebrateCompletion = () => {
        // Play celebration sound if enabled
        if (soundEnabled) {
          if (allComplete) {
            playFullCelebration();
          } else {
            playCelebrationSound();
          }
        }
        
        // First burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']
        });
        
        if (allComplete) {
          // Extra celebration for full completion
          setTimeout(() => {
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#22c55e', '#10b981']
            });
          }, 250);
          
          setTimeout(() => {
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#22c55e', '#10b981']
            });
          }, 400);
          
          // Final big celebration
          setTimeout(() => {
            confetti({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.4 },
              colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']
            });
          }, 600);
        }
      };
      
      celebrateCompletion();
    }
  }, [currentStep, pendingTransactions.length, soundEnabled, playCelebrationSound, playFullCelebration]);
  
  // Play success sound when matching transactions
  const handleMatch = (transactionId: string, expenseId: string) => {
    matchTransaction.mutate({ transactionId, expenseId }, {
      onSuccess: () => {
        setMatchedCount(prev => prev + 1);
        if (soundEnabled) playSuccessSound();
      }
    });
  };

  const flows: Flow[] = [
    {
      id: 'monthly-reconciliation',
      icon: <FileSpreadsheet className="h-8 w-8" />,
      title: language === 'es' ? 'Conciliación Mensual' : 'Monthly Reconciliation',
      description: language === 'es' 
        ? 'Ideal para revisar todos los gastos del mes y asegurarte que todo cuadre con tu banco'
        : 'Ideal for reviewing all monthly expenses and ensuring they match your bank',
      steps: language === 'es' 
        ? ['Importar estado bancario', 'Revisar coincidencias automáticas', 'Resolver pendientes', 'Obtener resumen']
        : ['Import bank statement', 'Review automatic matches', 'Resolve pending', 'Get summary'],
      color: 'bg-primary',
    },
    {
      id: 'find-missing',
      icon: <AlertTriangle className="h-8 w-8" />,
      title: language === 'es' ? 'Encontrar Gastos Faltantes' : 'Find Missing Expenses',
      description: language === 'es'
        ? 'Descubre qué gastos olvidaste registrar comparando con tu banco'
        : 'Discover which expenses you forgot to record by comparing with your bank',
      steps: language === 'es'
        ? ['Importar transacciones', 'Identificar no registrados', 'Agregar gastos faltantes', 'Completar registros']
        : ['Import transactions', 'Identify unrecorded', 'Add missing expenses', 'Complete records'],
      color: 'bg-warning',
    },
    {
      id: 'tax-prep',
      icon: <Building2 className="h-8 w-8" />,
      title: language === 'es' ? 'Preparación para Impuestos' : 'Tax Preparation',
      description: language === 'es'
        ? 'Verifica que todos tus gastos deducibles estén correctamente registrados para el CRA'
        : 'Verify all your deductible expenses are correctly recorded for CRA',
      steps: language === 'es'
        ? ['Importar período fiscal', 'Verificar deducciones', 'Resolver discrepancias', 'Generar reporte']
        : ['Import fiscal period', 'Verify deductions', 'Resolve discrepancies', 'Generate report'],
      color: 'bg-success',
    },
  ];

  const currentFlow = flows.find(f => f.id === selectedFlow);

  const getStepNumber = (): number => {
    switch (currentStep) {
      case 'welcome': return 0;
      case 'select-flow': return 0;
      case 'import': return 1;
      case 'review-matches': return 2;
      case 'resolve-pending': return 3;
      case 'summary': return 4;
      default: return 0;
    }
  };

  const progressPercent = currentFlow ? (getStepNumber() / currentFlow.steps.length) * 100 : 0;

  const getMessage = (): { title: string; message: string; tip?: string } => {
    switch (currentStep) {
      case 'welcome':
        return {
          title: language === 'es' ? '¡Hola! Soy tu asistente de conciliación 👋' : 'Hi! I am your reconciliation assistant 👋',
          message: language === 'es' 
            ? 'Estoy aquí para ayudarte a mantener tus finanzas en orden. Juntos vamos a comparar tus gastos con tu estado bancario para asegurarnos que todo cuadre perfectamente.'
            : 'I am here to help you keep your finances in order. Together we will compare your expenses with your bank statement to ensure everything matches perfectly.',
        };
      case 'select-flow':
        return {
          title: language === 'es' ? '¿Qué te gustaría hacer hoy?' : 'What would you like to do today?',
          message: language === 'es'
            ? 'Elige el flujo que mejor se adapte a tu necesidad. Cada uno está diseñado para un objetivo específico.'
            : 'Choose the flow that best suits your needs. Each one is designed for a specific objective.',
          tip: language === 'es'
            ? '💡 Si es tu primera vez, te recomiendo "Conciliación Mensual" - es el más completo'
            : '💡 If it is your first time, I recommend "Monthly Reconciliation" - it is the most complete',
        };
      case 'import':
        return {
          title: language === 'es' ? '¡Excelente elección! 🎯' : 'Excellent choice! 🎯',
          message: language === 'es'
            ? `Has elegido "${currentFlow?.title}". El primer paso es importar tu estado de cuenta bancario. Puedes hacerlo subiendo un archivo CSV o tomando una foto.`
            : `You have chosen "${currentFlow?.title}". The first step is to import your bank statement. You can do this by uploading a CSV file or taking a photo.`,
          tip: language === 'es'
            ? '💡 La mayoría de bancos te permiten descargar tu estado en CSV desde la banca en línea'
            : '💡 Most banks allow you to download your statement as CSV from online banking',
        };
      case 'review-matches':
        const matchCount = transactionsWithMatches.filter(t => t.suggestedMatches.length > 0).length;
        return {
          title: matchCount > 0 
            ? (language === 'es' ? '¡Encontré coincidencias! 🎉' : 'I found matches! 🎉')
            : (language === 'es' ? 'Revisando transacciones...' : 'Reviewing transactions...'),
          message: language === 'es'
            ? `He analizado ${pendingTransactions.length} transacciones y encontré ${matchCount} posibles coincidencias con tus gastos registrados. Revísalas y confirma las correctas.`
            : `I analyzed ${pendingTransactions.length} transactions and found ${matchCount} possible matches with your recorded expenses. Review and confirm the correct ones.`,
          tip: matchCount > 0 
            ? (language === 'es' 
                ? '💡 Las coincidencias con más del 90% son casi seguras - puedes confirmarlas rápidamente'
                : '💡 Matches above 90% are almost certain - you can confirm them quickly')
            : undefined,
        };
      case 'resolve-pending':
        return {
          title: language === 'es' ? 'Resolviendo pendientes 📋' : 'Resolving pending 📋',
          message: language === 'es'
            ? `Quedan ${pendingTransactions.length} transacciones sin conciliar. Para cada una, puedes: vincularla a un gasto existente, marcarla como discrepancia, o crear un nuevo gasto.`
            : `There are ${pendingTransactions.length} transactions left to reconcile. For each one, you can: link it to an existing expense, mark it as a discrepancy, or create a new expense.`,
          tip: language === 'es'
            ? '💡 Las discrepancias son transacciones que no tienen un gasto correspondiente - revísalas con cuidado'
            : '💡 Discrepancies are transactions without a corresponding expense - review them carefully',
        };
      case 'summary':
        const allMatched = pendingTransactions.length === 0;
        return {
          title: allMatched 
            ? (language === 'es' ? '¡Felicitaciones! Todo conciliado 🎊' : 'Congratulations! All reconciled 🎊')
            : (language === 'es' ? 'Resumen de tu conciliación 📊' : 'Your reconciliation summary 📊'),
          message: language === 'es'
            ? allMatched 
              ? '¡Excelente trabajo! Todas tus transacciones bancarias están conciliadas con tus gastos. Tu contabilidad está al día.'
              : `Has avanzado mucho. Tienes ${matchedTransactions.length} transacciones conciliadas. ${pendingTransactions.length > 0 ? `Aún quedan ${pendingTransactions.length} pendientes para revisar.` : ''}`
            : allMatched
              ? 'Excellent work! All your bank transactions are reconciled with your expenses. Your accounting is up to date.'
              : `You have made great progress. You have ${matchedTransactions.length} reconciled transactions. ${pendingTransactions.length > 0 ? `There are still ${pendingTransactions.length} pending to review.` : ''}`,
        };
      default:
        return { title: '', message: '' };
    }
  };

  const handleOpenLinkDialog = (transaction: TransactionForExpense) => {
    setTransactionToLink(transaction);
    setLinkDialogOpen(true);
  };

  const handleLinkExpense = (transactionId: string, expenseId: string) => {
    matchTransaction.mutate({ transactionId, expenseId }, {
      onSuccess: () => {
        setMatchedCount(prev => prev + 1);
        if (soundEnabled) playSuccessSound();
        toast.success(
          language === 'es' 
            ? '¡Transacción vinculada correctamente!' 
            : 'Transaction linked successfully!'
        );
        setLinkDialogOpen(false);
        setTransactionToLink(null);
      }
    });
  };


  const handleMarkDiscrepancy = (transactionId: string) => {
    markAsDiscrepancy.mutate(transactionId, {
      onSuccess: () => setDiscrepancyCount(prev => prev + 1)
    });
  };

  const handleOpenCreateExpense = (transaction: TransactionForExpense) => {
    setSelectedTransaction(transaction);
    setCreateExpenseDialogOpen(true);
  };

  const handleCreateExpenseSubmit = async (data: ExpenseFormValues) => {
    if (!selectedTransaction) return;

    const expenseData = {
      date: data.date.toISOString().split('T')[0],
      vendor: data.vendor,
      amount: data.amount,
      category: data.category,
      description: data.description || null,
      notes: data.notes || null,
      client_id: data.client_id === '__none__' ? null : data.client_id || null,
      status: data.status || 'pending',
      currency: 'CAD',
    };

    try {
      const createdExpense = await createExpense.mutateAsync(expenseData as any);
      
      // Auto-match the new expense with the transaction
      await matchTransaction.mutateAsync({ 
        transactionId: selectedTransaction.id, 
        expenseId: createdExpense.id 
      });
      
      setCreatedExpensesCount(prev => prev + 1);
      setMatchedCount(prev => prev + 1);
      setCreateExpenseDialogOpen(false);
      setSelectedTransaction(null);
      
      toast.success(
        language === 'es' 
          ? '¡Gasto creado y vinculado automáticamente!' 
          : 'Expense created and auto-linked!'
      );
    } catch (error) {
      // Error handling done in mutations
    }
  };

  const handleOpenSplitTransaction = (transaction: TransactionForExpense) => {
    setTransactionToSplit(transaction);
    setSplitDialogOpen(true);
  };

  const handleSplitSave = async (items: Array<{
    id: string;
    vendor: string;
    amount: number;
    category: string;
    client_id: string | null;
  }>, transactionId: string) => {
    setIsSplitting(true);
    
    try {
      let firstExpenseId: string | null = null;
      
      for (const item of items) {
        const expenseData = {
          date: transactionToSplit?.transaction_date || new Date().toISOString().split('T')[0],
          vendor: item.vendor,
          amount: item.amount,
          category: item.category,
          description: `${language === 'es' ? 'División de:' : 'Split from:'} ${transactionToSplit?.description || ''}`,
          notes: null,
          client_id: item.client_id,
          status: 'pending' as const,
          currency: 'CAD',
        };

        const createdExpense = await createExpense.mutateAsync(expenseData as any);
        
        // Link first expense to the transaction
        if (!firstExpenseId) {
          firstExpenseId = createdExpense.id;
        }
        
        setCreatedExpensesCount(prev => prev + 1);
      }
      
      // Match the transaction with the first expense
      if (firstExpenseId) {
        await matchTransaction.mutateAsync({ 
          transactionId, 
          expenseId: firstExpenseId 
        });
        setMatchedCount(prev => prev + 1);
      }
      
      if (soundEnabled) playSuccessSound();
      
      toast.success(
        language === 'es' 
          ? `¡${items.length} gastos creados desde la transacción dividida!` 
          : `${items.length} expenses created from split transaction!`
      );
    } catch (error) {
      toast.error(
        language === 'es' 
          ? 'Error al dividir la transacción' 
          : 'Error splitting transaction'
      );
    } finally {
      setIsSplitting(false);
    }
  };

  const renderContent = () => {
    const msg = getMessage();

    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-6 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="h-10 w-10 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">{msg.title}</h2>
            <p className="text-muted-foreground text-lg">{msg.message}</p>
            
            {/* Sound toggle */}
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full">
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">
                {language === 'es' ? 'Sonidos de celebración' : 'Celebration sounds'}
              </span>
              <Switch 
                checked={soundEnabled} 
                onCheckedChange={setSoundEnabled}
              />
            </div>
            
            <Button size="lg" onClick={() => setCurrentStep('select-flow')} className="bg-gradient-primary">
              {language === 'es' ? '¡Comencemos!' : "Let's begin!"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        );

      case 'select-flow':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">{msg.title}</h2>
              <p className="text-muted-foreground mt-2">{msg.message}</p>
              {msg.tip && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span>{msg.tip}</span>
                </div>
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              {flows.map((flow) => (
                <Card 
                  key={flow.id}
                  className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                    selectedFlow === flow.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedFlow(flow.id)}
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={`w-16 h-16 rounded-2xl ${flow.color}/10 flex items-center justify-center mx-auto`}>
                      <div className={`${flow.color.replace('bg-', 'text-')}`}>{flow.icon}</div>
                    </div>
                    <h3 className="font-bold text-lg">{flow.title}</h3>
                    <p className="text-sm text-muted-foreground">{flow.description}</p>
                    <div className="space-y-1">
                      {flow.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedFlow && (
              <div className="text-center">
                <Button size="lg" onClick={() => setCurrentStep('import')} className="bg-gradient-primary">
                  {language === 'es' ? 'Continuar con este flujo' : 'Continue with this flow'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'import':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">{msg.title}</h2>
              <p className="text-muted-foreground mt-2">{msg.message}</p>
              {msg.tip && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span>{msg.tip}</span>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => setImportDialogOpen(true)}
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold">{language === 'es' ? 'Subir archivo CSV' : 'Upload CSV file'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' 
                      ? 'Descarga tu estado de cuenta desde tu banca en línea'
                      : 'Download your statement from your online banking'}
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => setImportDialogOpen(true)}
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
                    <Camera className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="font-bold">{language === 'es' ? 'Tomar foto con IA' : 'Take photo with AI'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' 
                      ? 'Fotografía tu estado impreso y la IA extraerá los datos'
                      : 'Photograph your printed statement and AI will extract the data'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {transactions.length > 0 && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="font-medium">
                    {language === 'es' 
                      ? `¡Perfecto! Ya tienes ${transactions.length} transacciones importadas`
                      : `Perfect! You already have ${transactions.length} imported transactions`}
                  </span>
                </div>
                <div>
                  <Button size="lg" onClick={() => setCurrentStep('review-matches')} className="bg-gradient-primary">
                    {language === 'es' ? 'Continuar al siguiente paso' : 'Continue to next step'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'review-matches':
        const withMatches = transactionsWithMatches.filter(t => t.suggestedMatches.length > 0);
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">{msg.title}</h2>
              <p className="text-muted-foreground mt-2">{msg.message}</p>
              {msg.tip && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span>{msg.tip}</span>
                </div>
              )}
            </div>

            {matchedCount > 0 && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-3 bg-success/10 rounded-full animate-bounce">
                  <PartyPopper className="h-5 w-5 text-success" />
                  <span className="font-medium text-success">
                    {language === 'es' 
                      ? `¡Genial! Has conciliado ${matchedCount} transacción(es) 🎉`
                      : `Great! You have reconciled ${matchedCount} transaction(s) 🎉`}
                  </span>
                </div>
              </div>
            )}

            <div className="max-w-3xl mx-auto space-y-3 max-h-96 overflow-y-auto">
              {withMatches.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      {language === 'es' 
                        ? 'No encontré coincidencias automáticas. Esto puede significar que tus gastos ya están todos registrados o que necesitas revisar manualmente.'
                        : 'I did not find automatic matches. This may mean your expenses are already all recorded or you need to review manually.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                withMatches.slice(0, 5).map((tx) => (
                  <Card key={tx.id} className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{tx.description || 'Sin descripción'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(tx.transaction_date), 'dd MMM yyyy', { locale: language === 'es' ? es : undefined })}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-lg">${Number(tx.amount).toFixed(2)}</span>
                      </div>
                      <div className="pl-13 space-y-2">
                        <p className="text-sm text-muted-foreground font-medium">
                          {language === 'es' ? 'Posibles coincidencias:' : 'Possible matches:'}
                        </p>
                        {tx.suggestedMatches.map((match) => (
                          <div key={match.expense.id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{match.expense.vendor || match.expense.description}</span>
                              <Badge variant="secondary" className="text-xs">
                                {match.score}%
                              </Badge>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleMatch(tx.id, match.expense.id)}
                              disabled={matchTransaction.isPending}
                              className="bg-success hover:bg-success/90"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {language === 'es' ? 'Confirmar' : 'Confirm'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="text-center">
              <Button size="lg" onClick={() => setCurrentStep('resolve-pending')} className="bg-gradient-primary">
                {language === 'es' ? 'Continuar con pendientes' : 'Continue with pending'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );

      case 'resolve-pending':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">{msg.title}</h2>
              <p className="text-muted-foreground mt-2">{msg.message}</p>
              {msg.tip && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-warning/10 rounded-full text-sm">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  <span>{msg.tip}</span>
                </div>
              )}
            </div>

            {(discrepancyCount > 0 || createdExpensesCount > 0) && (
              <div className="text-center flex flex-wrap gap-2 justify-center">
                {createdExpensesCount > 0 && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full">
                    <Plus className="h-5 w-5 text-success" />
                    <span className="font-medium text-success">
                      {language === 'es' 
                        ? `Has creado ${createdExpensesCount} gasto(s) nuevo(s)`
                        : `You have created ${createdExpensesCount} new expense(s)`}
                    </span>
                  </div>
                )}
                {discrepancyCount > 0 && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <span className="font-medium">
                      {language === 'es' 
                        ? `Has marcado ${discrepancyCount} discrepancia(s) para revisar después`
                        : `You have marked ${discrepancyCount} discrepancy(ies) to review later`}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="max-w-3xl mx-auto space-y-3 max-h-96 overflow-y-auto">
              {pendingTransactions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-success" />
                    </div>
                    <p className="font-medium text-lg">
                      {language === 'es' 
                        ? '¡Todas las transacciones están procesadas!'
                        : 'All transactions are processed!'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingTransactions.slice(0, 5).map((tx) => (
                  <Card key={tx.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-warning" />
                          </div>
                          <div>
                            <p className="font-medium">{tx.description || 'Sin descripción'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(tx.transaction_date), 'dd MMM yyyy', { locale: language === 'es' ? es : undefined })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold">${Number(tx.amount).toFixed(2)}</span>
                          <Button 
                            size="sm" 
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleOpenCreateExpense({
                              id: tx.id,
                              amount: Number(tx.amount),
                              description: tx.description,
                              transaction_date: tx.transaction_date
                            })}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {language === 'es' ? 'Crear' : 'Create'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleOpenLinkDialog({
                              id: tx.id,
                              amount: Number(tx.amount),
                              description: tx.description,
                              transaction_date: tx.transaction_date
                            })}
                          >
                            <Link2 className="h-3 w-3 mr-1" />
                            {language === 'es' ? 'Vincular' : 'Link'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => handleOpenSplitTransaction({
                              id: tx.id,
                              amount: Number(tx.amount),
                              description: tx.description,
                              transaction_date: tx.transaction_date
                            })}
                          >
                            <Split className="h-3 w-3 mr-1" />
                            {language === 'es' ? 'Dividir' : 'Split'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkDiscrepancy(tx.id)}
                            disabled={markAsDiscrepancy.isPending}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {language === 'es' ? 'Discr.' : 'Disc.'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="text-center">
              <Button size="lg" onClick={() => setCurrentStep('summary')} className="bg-gradient-primary">
                {language === 'es' ? 'Ver resumen final' : 'View final summary'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );

      case 'summary':
        const allComplete = pendingTransactions.length === 0;
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
              {allComplete ? (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success to-success/60 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <PartyPopper className="h-12 w-12 text-success-foreground animate-pulse" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 animate-scale-in">
                  <TrendingUp className="h-12 w-12 text-primary-foreground" />
                </div>
              )}
              <h2 className="text-2xl font-bold animate-fade-in">{msg.title}</h2>
              <p className="text-muted-foreground mt-2 animate-fade-in">{msg.message}</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'es' ? 'Resumen de tu conciliación' : 'Your reconciliation summary'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">{transactions.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' ? 'Transacciones totales' : 'Total transactions'}
                    </p>
                  </div>
                  <div className="p-4 bg-success/10 rounded-lg text-center">
                    <p className="text-3xl font-bold text-success">{matchedTransactions.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es' ? 'Conciliadas' : 'Matched'}
                    </p>
                  </div>
                </div>

                {pendingTransactions.length > 0 && (
                  <div className="p-4 bg-warning/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <span className="font-medium">
                        {language === 'es' ? 'Pendientes por resolver' : 'Pending to resolve'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es'
                        ? `Tienes ${pendingTransactions.length} transacciones que aún necesitan revisión. Puedes continuar en el modo normal para resolverlas.`
                        : `You have ${pendingTransactions.length} transactions that still need review. You can continue in normal mode to resolve them.`}
                    </p>
                  </div>
                )}

                {allComplete && (
                  <div className="p-4 bg-success/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="font-medium text-success">
                        {language === 'es' ? '¡Todo en orden!' : 'All in order!'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'es'
                        ? 'Tu contabilidad está completamente conciliada. ¡Excelente trabajo manteniendo tus finanzas organizadas!'
                        : 'Your accounting is completely reconciled. Excellent job keeping your finances organized!'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center space-y-4">
              <Button size="lg" onClick={onExitWizard} className="bg-gradient-primary">
                {language === 'es' ? 'Continuar en modo normal' : 'Continue in normal mode'}
              </Button>
              <p className="text-sm text-muted-foreground">
                {language === 'es' 
                  ? '¿Tienes dudas? Puedes volver al asistente cuando quieras.'
                  : 'Have questions? You can return to the assistant anytime.'}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[60vh] space-y-8">
      {/* Progress bar for flow */}
      {currentFlow && currentStep !== 'welcome' && currentStep !== 'select-flow' && (
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep('select-flow')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {language === 'es' ? 'Cambiar flujo' : 'Change flow'}
            </Button>
            <span className="text-muted-foreground">
              {currentFlow.title} - {language === 'es' ? 'Paso' : 'Step'} {getStepNumber()} / {currentFlow.steps.length}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {currentFlow.steps.map((step, i) => (
              <span key={i} className={i < getStepNumber() ? 'text-primary font-medium' : ''}>
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      {renderContent()}

      {/* Import dialog */}
      <BankImportDialog 
        open={importDialogOpen} 
        onClose={() => {
          setImportDialogOpen(false);
          if (transactions.length > 0) {
            setCurrentStep('review-matches');
          }
        }} 
      />

      {/* Create Expense from Transaction dialog */}
      <Dialog open={createExpenseDialogOpen} onOpenChange={setCreateExpenseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-success" />
              {language === 'es' ? 'Crear Gasto desde Transacción' : 'Create Expense from Transaction'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">
                {language === 'es' ? 'Transacción bancaria:' : 'Bank transaction:'}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedTransaction.description || (language === 'es' ? 'Sin descripción' : 'No description')}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedTransaction.transaction_date), 'dd MMM yyyy', { locale: language === 'es' ? es : undefined })}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  ${selectedTransaction.amount.toFixed(2)}
                </Badge>
              </div>
            </div>
          )}

          <ExpenseForm
            expense={selectedTransaction ? {
              id: '',
              user_id: '',
              date: selectedTransaction.transaction_date,
              vendor: selectedTransaction.description || '',
              amount: selectedTransaction.amount,
              category: null,
              description: selectedTransaction.description,
              notes: language === 'es' 
                ? `Creado desde transacción bancaria del ${format(new Date(selectedTransaction.transaction_date), 'dd/MM/yyyy')}`
                : `Created from bank transaction on ${format(new Date(selectedTransaction.transaction_date), 'MM/dd/yyyy')}`,
              client_id: null,
              status: 'pending',
              currency: 'CAD',
              document_id: null,
              created_at: null,
              updated_at: null,
              client: null,
              tags: []
            } : undefined}
            onSubmit={handleCreateExpenseSubmit}
            onCancel={() => {
              setCreateExpenseDialogOpen(false);
              setSelectedTransaction(null);
            }}
            isLoading={createExpense.isPending || matchTransaction.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Split Transaction Dialog */}
      <SplitTransactionDialog
        open={splitDialogOpen}
        onClose={() => {
          setSplitDialogOpen(false);
          setTransactionToSplit(null);
        }}
        transaction={transactionToSplit}
        onSave={handleSplitSave}
        isLoading={isSplitting}
      />

      {/* Link Expense Dialog */}
      <LinkExpenseDialog
        open={linkDialogOpen}
        onClose={() => {
          setLinkDialogOpen(false);
          setTransactionToLink(null);
        }}
        transaction={transactionToLink}
        expenses={expenses}
        onLink={handleLinkExpense}
        isLoading={matchTransaction.isPending}
      />
    </div>
  );
}
