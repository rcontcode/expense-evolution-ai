import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle,
  DollarSign, RefreshCw, Building2, FolderKanban, PiggyBank,
  Target, Loader2, FileText, TrendingUp, Wallet, Home
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';
import { useIncome } from '@/hooks/data/useIncome';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useCategoryBudgets, useUpsertCategoryBudget } from '@/hooks/data/useCategoryBudgets';
import { useBudgetSuggestions } from '@/hooks/data/useBudgetSuggestions';
import { useSavingsGoals, useCreateSavingsGoal } from '@/hooks/data/useSavingsGoals';
import { useUpdateExpense } from '@/hooks/data/useExpenses';
import { useUpdateUserPreferences, useUserSettings } from '@/hooks/data/useUserSettings';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
type FormatFn = (amount: number, opts?: { decimals?: number; currency?: string }) => string;
import { EXPENSE_CATEGORIES, getCategoryLabel } from '@/lib/constants/expense-categories';
import { HistoryEntry } from '@/hooks/data/useUnifiedChaosInbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toast } from 'sonner';

interface PostUploadWizardProps {
  open: boolean;
  onClose: () => void;
  processedHistory: HistoryEntry[];
}

type WizardStep = 'summary' | 'income' | 'recurrences' | 'assignments' | 'budget' | 'savings' | 'done';

const STEPS: WizardStep[] = ['summary', 'income', 'recurrences', 'assignments', 'budget', 'savings', 'done'];

export function PostUploadWizard({ open, onClose, processedHistory }: PostUploadWizardProps) {
  const { language } = useLanguage();
  const l = language === 'es';
  const navigate = useNavigate();
  const { formatCurrency } = useFormatCurrency();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('summary');
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());
  
  // Data hooks
  const { data: clients } = useClients();
  const { data: projects } = useProjects();
  const { data: income } = useIncome();
  const { data: expenses } = useExpenses({
    dateRange: { start: startOfMonth(subMonths(new Date(), 3)), end: endOfMonth(new Date()) }
  });
  const { data: recurringBills } = useRecurringBills();
  const { data: existingBudgets } = useCategoryBudgets();
  const { data: savingsGoals } = useSavingsGoals();
  const { data: settings } = useUserSettings();
  const budgetSuggestions = useBudgetSuggestions({ monthsToConsider: 3 });
  
  // Mutations
  const updateExpense = useUpdateExpense();
  const upsertBudget = useUpsertCategoryBudget();
  const createSavingsGoal = useCreateSavingsGoal();
  const updatePreferences = useUpdateUserPreferences();
  
  // State for each step
  const [selectedAssignments, setSelectedAssignments] = useState<Record<string, { clientId?: string; projectId?: string }>>({});
  const [budgetsToApply, setBudgetsToApply] = useState<Record<string, number>>({});
  const [savingsGoalData, setSavingsGoalData] = useState({ name: '', target: 0 });
  const [isApplying, setIsApplying] = useState(false);
  
  // Analyze processed documents
  const analysis = useMemo(() => {
    const byType: Record<string, number> = {};
    let totalAmount = 0;
    const receiptsProcessed: string[] = [];
    const contractsProcessed: string[] = [];
    const bankStatementsProcessed: string[] = [];
    const incomeProofsProcessed: string[] = [];
    const billsProcessed: string[] = [];

    processedHistory.forEach(h => {
      byType[h.documentType] = (byType[h.documentType] || 0) + 1;
      if (h.extractedPreview?.amount) totalAmount += Number(h.extractedPreview.amount);
      
      if (h.documentType === 'receipt') receiptsProcessed.push(h.fileName);
      if (h.documentType === 'contract') contractsProcessed.push(h.fileName);
      if (h.documentType === 'bank_statement') bankStatementsProcessed.push(h.fileName);
      if (h.documentType === 'income_proof' || h.documentType === 'invoice') incomeProofsProcessed.push(h.fileName);
      if (h.documentType === 'utility_bill') billsProcessed.push(h.fileName);
    });

    return { byType, totalAmount, receiptsProcessed, contractsProcessed, bankStatementsProcessed, incomeProofsProcessed, billsProcessed };
  }, [processedHistory]);

  // Detect issues
  const issues = useMemo(() => {
    const list: Array<{ type: string; icon: React.ElementType; title: string; description: string; step: WizardStep }> = [];
    
    // No income detected
    const hasIncome = (income?.length ?? 0) > 0;
    if (!hasIncome) {
      list.push({
        type: 'no_income',
        icon: DollarSign,
        title: l ? '💰 No se detectó salario/ingreso' : '💰 No salary/income detected',
        description: l ? 'Registra tu ingreso para proyecciones precisas' : 'Register your income for accurate projections',
        step: 'income',
      });
    }

    // Unassigned expenses
    const unassigned = expenses?.filter(e => !e.client_id && e.reimbursement_type === 'pending_classification') || [];
    if (unassigned.length > 3) {
      list.push({
        type: 'unassigned',
        icon: Building2,
        title: l ? `📋 ${unassigned.length} gastos sin asignar` : `📋 ${unassigned.length} unassigned expenses`,
        description: l ? 'Asigna cliente/proyecto para reportes de reembolso' : 'Assign client/project for reimbursement reports',
        step: 'assignments',
      });
    }

    // No budget set
    const hasBudgets = (existingBudgets?.length ?? 0) > 0 || (settings as any)?.monthly_budget_limit > 0;
    if (!hasBudgets && budgetSuggestions.globalSuggestion > 0) {
      list.push({
        type: 'no_budget',
        icon: Wallet,
        title: l ? '📊 Sin presupuesto configurado' : '📊 No budget configured',
        description: l ? 'Te sugerimos presupuestos basados en tu historial' : 'We suggest budgets based on your history',
        step: 'budget',
      });
    }

    // No savings goals
    if ((savingsGoals?.length ?? 0) === 0) {
      list.push({
        type: 'no_savings',
        icon: PiggyBank,
        title: l ? '🎯 Sin metas de ahorro' : '🎯 No savings goals',
        description: l ? 'Crea tu primera meta basada en tu capacidad real' : 'Create your first goal based on your actual capacity',
        step: 'savings',
      });
    }

    return list;
  }, [income, expenses, existingBudgets, settings, savingsGoals, budgetSuggestions, l]);

  // Calculate real savings capacity
  const savingsCapacity = useMemo(() => {
    const monthlyIncome = income?.reduce((sum, i) => {
      const monthsAgo = (new Date().getTime() - new Date(i.date).getTime()) / (30 * 24 * 60 * 60 * 1000);
      if (monthsAgo <= 3) return sum + Number(i.amount);
      return sum;
    }, 0) || 0;
    
    const avgMonthlyIncome = monthlyIncome / 3;
    const avgMonthlyExpenses = budgetSuggestions.globalAverage;
    const monthlySurplus = avgMonthlyIncome - avgMonthlyExpenses;
    
    // Suggest 20% of surplus as savings target
    const suggestedMonthlySavings = Math.max(0, Math.round(monthlySurplus * 0.2));
    const suggested6MonthGoal = suggestedMonthlySavings * 6;
    const suggestedEmergencyFund = Math.round(avgMonthlyExpenses * 3);
    
    return { avgMonthlyIncome, avgMonthlyExpenses, monthlySurplus, suggestedMonthlySavings, suggested6MonthGoal, suggestedEmergencyFund };
  }, [income, budgetSuggestions]);

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  
  const goNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEPS.length) setCurrentStep(STEPS[nextIdx]);
  };
  
  const goBack = () => {
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) setCurrentStep(STEPS[prevIdx]);
  };

  const skipToEnd = () => setCurrentStep('done');

  // Apply budget suggestions
  const handleApplyBudgets = async () => {
    setIsApplying(true);
    try {
      for (const [category, amount] of Object.entries(budgetsToApply)) {
        if (amount > 0) {
          await upsertBudget.mutateAsync({ category, monthly_budget: amount, alert_threshold: 80 });
        }
      }
      if (budgetSuggestions.globalSuggestion > 0) {
        await updatePreferences.mutateAsync({ global_monthly_budget: budgetSuggestions.globalSuggestion });
      }
      toast.success(l ? '✅ Presupuestos aplicados' : '✅ Budgets applied');
      goNext();
    } catch {
      toast.error(l ? 'Error al aplicar presupuestos' : 'Error applying budgets');
    } finally {
      setIsApplying(false);
    }
  };

  // Create savings goal
  const handleCreateSavingsGoal = async () => {
    if (!savingsGoalData.name || savingsGoalData.target <= 0) return;
    setIsApplying(true);
    try {
      await createSavingsGoal.mutateAsync({
        name: savingsGoalData.name,
        target_amount: savingsGoalData.target,
      });
      toast.success(l ? '🎯 Meta creada' : '🎯 Goal created');
      goNext();
    } catch {
      toast.error(l ? 'Error al crear meta' : 'Error creating goal');
    } finally {
      setIsApplying(false);
    }
  };

  // Initialize budget suggestions
  const initBudgets = () => {
    if (Object.keys(budgetsToApply).length === 0) {
      const initial: Record<string, number> = {};
      Object.entries(budgetSuggestions.categorySuggestions).forEach(([cat, sug]) => {
        initial[cat] = sug.suggestedBudget;
      });
      setBudgetsToApply(initial);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {l ? 'Asistente Post-Procesamiento' : 'Post-Processing Assistant'}
          </DialogTitle>
          <DialogDescription>
            {l ? `${processedHistory.length} documentos procesados. Revisemos qué más necesita tu atención.` 
               : `${processedHistory.length} documents processed. Let's review what else needs your attention.`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-3 px-1">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground font-mono">
            {stepIndex + 1}/{STEPS.length}
          </span>
        </div>

        <ScrollArea className="flex-1 pr-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 py-2"
            >
              {/* STEP: Summary */}
              {currentStep === 'summary' && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold">
                      {l ? '¡Procesamiento completado!' : 'Processing complete!'}
                    </h3>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(analysis.byType).map(([type, count]) => (
                      <Card key={type} className="border-muted">
                        <CardContent className="p-3 text-center">
                          <span className="text-2xl">{
                            type === 'receipt' ? '🧾' : type === 'contract' ? '📄' : 
                            type === 'bank_statement' ? '🏦' : type === 'utility_bill' ? '💡' : 
                            type === 'income_proof' ? '💰' : type === 'invoice' ? '🧾' : '📎'
                          }</span>
                          <p className="text-lg font-bold mt-1">{count}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {type === 'receipt' ? (l ? 'Recibos' : 'Receipts') :
                             type === 'contract' ? (l ? 'Contratos' : 'Contracts') :
                             type === 'bank_statement' ? (l ? 'Extractos' : 'Statements') :
                             type === 'utility_bill' ? (l ? 'Boletas' : 'Bills') :
                             type === 'income_proof' ? (l ? 'Ingresos' : 'Income') :
                             type === 'invoice' ? (l ? 'Facturas' : 'Invoices') : type}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Issues detected */}
                  {issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        {l ? 'Necesita tu atención:' : 'Needs your attention:'}
                      </h4>
                      {issues.map((issue) => {
                        const Icon = issue.icon;
                        return (
                          <Card key={issue.type} className="border-amber-500/30 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-colors"
                            onClick={() => setCurrentStep(issue.step)}>
                            <CardContent className="p-3 flex items-center gap-3">
                              <Icon className="h-5 w-5 text-amber-600 shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{issue.title}</p>
                                <p className="text-xs text-muted-foreground">{issue.description}</p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {issues.length === 0 && (
                    <Card className="border-green-500/30 bg-green-500/5">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-green-700 dark:text-green-400">
                          {l ? '✨ Todo se ve bien. Tu información financiera está organizada.' 
                             : '✨ Everything looks good. Your financial information is organized.'}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* STEP: Income */}
              {currentStep === 'income' && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <DollarSign className="h-10 w-10 text-green-500 mx-auto" />
                    <h3 className="text-lg font-bold">{l ? 'Ingresos' : 'Income'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {(income?.length ?? 0) === 0
                        ? (l ? 'No hemos detectado ingresos registrados. Sin ingresos, las proyecciones no serán precisas.'
                             : 'We haven\'t detected any registered income. Without income, projections won\'t be accurate.')
                        : (l ? `Tienes ${income?.length} ingreso(s) registrado(s).` : `You have ${income?.length} income(s) registered.`)}
                    </p>
                  </div>
                  
                  {(income?.length ?? 0) === 0 && (
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => { onClose(); navigate('/income'); }} className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        {l ? 'Registrar ingreso' : 'Register income'}
                      </Button>
                      <Button variant="outline" onClick={goNext}>
                        {l ? 'Omitir' : 'Skip'}
                      </Button>
                    </div>
                  )}
                  
                  {(income?.length ?? 0) > 0 && (
                    <Card className="border-green-500/30 bg-green-500/5">
                      <CardContent className="p-4">
                        <p className="text-sm text-green-700 dark:text-green-400">
                          ✅ {l ? 'Ingresos registrados correctamente' : 'Income properly registered'}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* STEP: Recurrences */}
              {currentStep === 'recurrences' && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <RefreshCw className="h-10 w-10 text-blue-500 mx-auto" />
                    <h3 className="text-lg font-bold">{l ? 'Pagos Recurrentes' : 'Recurring Payments'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {(recurringBills?.length ?? 0) > 0
                        ? (l ? `Tienes ${recurringBills?.length} pago(s) fijo(s) configurado(s).` 
                             : `You have ${recurringBills?.length} fixed payment(s) configured.`)
                        : (l ? 'No hay pagos fijos configurados aún. Si subiste boletas de servicios, revísalas en Pagos Fijos.'
                             : 'No fixed payments configured yet. If you uploaded utility bills, review them in Fixed Payments.')}
                    </p>
                  </div>
                  
                  {analysis.billsProcessed.length > 0 && (
                    <Card className="border-blue-500/30 bg-blue-500/5">
                      <CardContent className="p-4 space-y-2">
                        <p className="text-sm font-medium">
                          {l ? `Se procesaron ${analysis.billsProcessed.length} boleta(s) de servicio:` 
                             : `${analysis.billsProcessed.length} utility bill(s) were processed:`}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {analysis.billsProcessed.map((name, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => { onClose(); navigate('/recurring'); }} className="gap-1">
                          <ArrowRight className="h-3 w-3" />
                          {l ? 'Revisar en Pagos Fijos' : 'Review in Fixed Payments'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* STEP: Assignments */}
              {currentStep === 'assignments' && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <Building2 className="h-10 w-10 text-indigo-500 mx-auto" />
                    <h3 className="text-lg font-bold">{l ? 'Asignación de Gastos' : 'Expense Assignment'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {l ? 'Asigna gastos pendientes a clientes y proyectos para reportes de reembolso.'
                         : 'Assign pending expenses to clients and projects for reimbursement reports.'}
                    </p>
                  </div>
                  
                  {(() => {
                    const unassigned = expenses?.filter(e => !e.client_id && e.reimbursement_type === 'pending_classification') || [];
                    if (unassigned.length === 0) {
                      return (
                        <Card className="border-green-500/30 bg-green-500/5">
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-green-700 dark:text-green-400">
                              ✅ {l ? 'Todos los gastos están asignados' : 'All expenses are assigned'}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        <Badge variant="outline" className="text-xs">
                          {unassigned.length} {l ? 'gastos pendientes de asignar' : 'expenses pending assignment'}
                        </Badge>
                        <Button onClick={() => { onClose(); navigate('/expenses'); setTimeout(() => window.dispatchEvent(new Event('open-bulk-assign')), 500); }} className="gap-2 w-full">
                          <FolderKanban className="h-4 w-4" />
                          {l ? 'Abrir Asignación Masiva' : 'Open Bulk Assignment'}
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* STEP: Budget */}
              {currentStep === 'budget' && (() => {
                if (Object.keys(budgetsToApply).length === 0) initBudgets();
                const hasBudgets = (existingBudgets?.length ?? 0) > 0;
                
                return (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <Wallet className="h-10 w-10 text-emerald-500 mx-auto" />
                      <h3 className="text-lg font-bold">{l ? 'Presupuesto Inteligente' : 'Smart Budget'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {hasBudgets
                          ? (l ? 'Ya tienes presupuestos configurados.' : 'You already have budgets configured.')
                          : (l ? 'Basado en tus últimos 3 meses de gastos, te sugerimos estos presupuestos:' 
                               : 'Based on your last 3 months of expenses, we suggest these budgets:')}
                      </p>
                    </div>

                    {!hasBudgets && budgetSuggestions.globalSuggestion > 0 && (
                      <>
                        <Card className="border-emerald-500/30 bg-emerald-500/5">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{l ? 'Presupuesto global sugerido' : 'Suggested global budget'}</p>
                              <p className="text-xs text-muted-foreground">
                                {l ? `Promedio: ${formatCurrency(budgetSuggestions.globalAverage)} + 10% margen` 
                                   : `Average: ${formatCurrency(budgetSuggestions.globalAverage)} + 10% margin`}
                              </p>
                            </div>
                            <span className="text-xl font-bold text-emerald-600">
                              {formatCurrency(budgetSuggestions.globalSuggestion)}
                            </span>
                          </CardContent>
                        </Card>

                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">{l ? 'Por categoría:' : 'By category:'}</h4>
                          {Object.entries(budgetSuggestions.categorySuggestions).map(([cat, sug]) => (
                            <div key={cat} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                              <span className="text-sm flex-1">{getCategoryLabel(cat as any)}</span>
                              <span className="text-xs text-muted-foreground">
                                {l ? 'Prom:' : 'Avg:'} {formatCurrency(sug.averageSpent)}
                              </span>
                              <Input
                                type="number"
                                value={budgetsToApply[cat] || sug.suggestedBudget}
                                onChange={(e) => setBudgetsToApply(prev => ({ ...prev, [cat]: Number(e.target.value) }))}
                                className="w-24 h-8 text-xs text-right"
                              />
                            </div>
                          ))}
                        </div>

                        <Button onClick={handleApplyBudgets} disabled={isApplying} className="w-full gap-2">
                          {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          {l ? 'Aplicar presupuestos' : 'Apply budgets'}
                        </Button>
                      </>
                    )}

                    {hasBudgets && (
                      <Card className="border-green-500/30 bg-green-500/5">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-green-700 dark:text-green-400">
                            ✅ {l ? 'Presupuestos ya configurados' : 'Budgets already configured'}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {!hasBudgets && budgetSuggestions.globalSuggestion === 0 && (
                      <Card className="border-muted">
                        <CardContent className="p-4 text-center text-muted-foreground">
                          <p className="text-sm">
                            {l ? 'No hay suficientes datos históricos para sugerir presupuestos. Sigue registrando gastos.' 
                               : 'Not enough historical data to suggest budgets. Keep logging expenses.'}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })()}

              {/* STEP: Savings */}
              {currentStep === 'savings' && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <PiggyBank className="h-10 w-10 text-pink-500 mx-auto" />
                    <h3 className="text-lg font-bold">{l ? 'Metas de Ahorro' : 'Savings Goals'}</h3>
                  </div>

                  {(savingsGoals?.length ?? 0) > 0 ? (
                    <Card className="border-green-500/30 bg-green-500/5">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-green-700 dark:text-green-400">
                          ✅ {l ? `Tienes ${savingsGoals?.length} meta(s) activa(s)` : `You have ${savingsGoals?.length} active goal(s)`}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {savingsCapacity.monthlySurplus > 0 ? (
                        <Card className="border-pink-500/30 bg-pink-500/5">
                          <CardContent className="p-4 space-y-3">
                            <p className="text-sm font-medium">
                              {l ? '📊 Tu capacidad real de ahorro:' : '📊 Your real savings capacity:'}
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-center">
                              <div>
                                <p className="text-xs text-muted-foreground">{l ? 'Ingreso promedio' : 'Avg income'}</p>
                                <p className="font-bold text-green-600">{formatCurrency(savingsCapacity.avgMonthlyIncome)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{l ? 'Gasto promedio' : 'Avg expense'}</p>
                                <p className="font-bold text-red-500">{formatCurrency(savingsCapacity.avgMonthlyExpenses)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{l ? 'Superávit mensual' : 'Monthly surplus'}</p>
                                <p className="font-bold text-emerald-600">{formatCurrency(savingsCapacity.monthlySurplus)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{l ? 'Ahorro sugerido/mes' : 'Suggested savings/mo'}</p>
                                <p className="font-bold text-primary">{formatCurrency(savingsCapacity.suggestedMonthlySavings)}</p>
                              </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t">
                              <h4 className="text-sm font-semibold">{l ? 'Crea tu primera meta:' : 'Create your first goal:'}</h4>
                              
                              <div className="grid grid-cols-1 gap-2">
                                {/* Suggested goals */}
                                {[
                                  { 
                                    name: l ? 'Fondo de Emergencia' : 'Emergency Fund', 
                                    amount: savingsCapacity.suggestedEmergencyFund,
                                    icon: '🛡️'
                                  },
                                  { 
                                    name: l ? 'Meta 6 meses' : '6-Month Goal', 
                                    amount: savingsCapacity.suggested6MonthGoal,
                                    icon: '🎯'
                                  },
                                ].map(suggestion => (
                                  <Button
                                    key={suggestion.name}
                                    variant="outline"
                                    className="justify-between h-auto py-2"
                                    onClick={() => setSavingsGoalData({ name: suggestion.name, target: suggestion.amount })}
                                  >
                                    <span>{suggestion.icon} {suggestion.name}</span>
                                    <Badge variant="secondary">{formatCurrency(suggestion.amount)}</Badge>
                                  </Button>
                                ))}
                              </div>

                              <div className="flex gap-2">
                                <Input
                                  placeholder={l ? 'Nombre de la meta...' : 'Goal name...'}
                                  value={savingsGoalData.name}
                                  onChange={(e) => setSavingsGoalData(prev => ({ ...prev, name: e.target.value }))}
                                  className="flex-1"
                                />
                                <Input
                                  type="number"
                                  placeholder="$"
                                  value={savingsGoalData.target || ''}
                                  onChange={(e) => setSavingsGoalData(prev => ({ ...prev, target: Number(e.target.value) }))}
                                  className="w-28"
                                />
                              </div>

                              <Button 
                                onClick={handleCreateSavingsGoal} 
                                disabled={isApplying || !savingsGoalData.name || savingsGoalData.target <= 0} 
                                className="w-full gap-2"
                              >
                                {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                                {l ? 'Crear meta' : 'Create goal'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="border-muted">
                          <CardContent className="p-4 text-center text-muted-foreground">
                            <p className="text-sm">
                              {l ? 'Registra ingresos y gastos para que podamos sugerir metas alcanzables.'
                                 : 'Register income and expenses so we can suggest achievable goals.'}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* STEP: Done */}
              {currentStep === 'done' && (
                <div className="space-y-4 text-center py-6">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold">
                    {l ? '🎉 ¡Todo listo!' : '🎉 All set!'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {l ? 'Tu información financiera ha sido procesada y organizada. Revisa tu dashboard para ver tus proyecciones actualizadas.'
                       : 'Your financial information has been processed and organized. Check your dashboard for updated projections.'}
                  </p>
                  <div className="flex gap-3 justify-center pt-2">
                    <Button onClick={() => { onClose(); navigate('/dashboard'); }} className="gap-2">
                      <Home className="h-4 w-4" />
                      {l ? 'Ir al Dashboard' : 'Go to Dashboard'}
                    </Button>
                    <Button variant="outline" onClick={() => { onClose(); navigate('/budget'); }}>
                      {l ? 'Ver Presupuesto' : 'View Budget'}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        {/* Navigation */}
        {currentStep !== 'done' && (
          <div className="flex items-center justify-between pt-3 border-t">
            <Button variant="ghost" size="sm" onClick={goBack} disabled={stepIndex === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              {l ? 'Anterior' : 'Back'}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={skipToEnd} className="text-muted-foreground">
              {l ? 'Saltar todo' : 'Skip all'}
            </Button>

            <Button size="sm" onClick={goNext}>
              {l ? 'Siguiente' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
