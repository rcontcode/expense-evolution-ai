import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WorkflowProgress {
  workflowId: string;
  currentStep: number;
  totalSteps: number;
  stepDetails: {
    stepId: string;
    status: 'completed' | 'current' | 'pending';
    count?: number;
  }[];
  stats: {
    label: { es: string; en: string };
    value: number;
    type: 'count' | 'currency';
  }[];
}

export function useWorkflowProgress(workflowId: string) {
  return useQuery({
    queryKey: ['workflow-progress', workflowId],
    queryFn: async (): Promise<WorkflowProgress> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      switch (workflowId) {
        case 'expense-capture':
          return await getExpenseCaptureProgress(user.id);
        case 'client-billing':
          return await getClientBillingProgress(user.id);
        case 'tax-preparation':
          return await getTaxPreparationProgress(user.id);
        case 'bank-reconciliation':
          return await getBankReconciliationProgress(user.id);
        case 'wealth-building':
          return await getWealthBuildingProgress(user.id);
        default:
          return getDefaultProgress(workflowId);
      }
    },
    staleTime: 30000, // Refresh every 30 seconds
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

async function getExpenseCaptureProgress(userId: string): Promise<WorkflowProgress> {
  // Get documents pending review
  const { data: pendingDocs } = await supabase
    .from('documents')
    .select('id, status, review_status')
    .eq('user_id', userId);

  // Get expenses by status
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, status, reimbursement_type, client_id, category')
    .eq('user_id', userId);

  const pendingAICount = pendingDocs?.filter(d => d.status === 'pending').length || 0;
  const pendingReviewCount = pendingDocs?.filter(d => d.review_status === 'pending' || d.status === 'classified').length || 0;
  const unclassifiedCount = expenses?.filter(e => e.reimbursement_type === 'pending_classification').length || 0;
  const classifiedCount = expenses?.filter(e => e.reimbursement_type !== 'pending_classification' && e.client_id).length || 0;
  const totalExpenses = expenses?.length || 0;

  // Determine current step based on data
  let currentStep = 0;
  if (totalExpenses === 0 && pendingDocs?.length === 0) {
    currentStep = 0; // Need to capture
  } else if (pendingAICount > 0) {
    currentStep = 1; // AI extracting
  } else if (pendingReviewCount > 0) {
    currentStep = 2; // Need to review
  } else if (unclassifiedCount > 0) {
    currentStep = 3; // Need to classify
  } else {
    currentStep = 4; // All done
  }

  return {
    workflowId: 'expense-capture',
    currentStep,
    totalSteps: 5,
    stepDetails: [
      { stepId: 'capture', status: totalExpenses > 0 || pendingDocs?.length ? 'completed' : 'current', count: pendingAICount },
      { stepId: 'extract', status: pendingAICount > 0 ? 'current' : (currentStep > 1 ? 'completed' : 'pending'), count: pendingAICount },
      { stepId: 'review', status: pendingReviewCount > 0 ? 'current' : (currentStep > 2 ? 'completed' : 'pending'), count: pendingReviewCount },
      { stepId: 'classify', status: unclassifiedCount > 0 ? 'current' : (currentStep > 3 ? 'completed' : 'pending'), count: unclassifiedCount },
      { stepId: 'done', status: currentStep === 4 ? 'completed' : 'pending', count: classifiedCount },
    ],
    stats: [
      { label: { es: 'Por revisar', en: 'To review' }, value: pendingReviewCount, type: 'count' },
      { label: { es: 'Sin clasificar', en: 'Unclassified' }, value: unclassifiedCount, type: 'count' },
      { label: { es: 'Completados', en: 'Completed' }, value: classifiedCount, type: 'count' },
    ],
  };
}

async function getClientBillingProgress(userId: string): Promise<WorkflowProgress> {
  // Get clients
  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId);

  // Get contracts
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, client_id')
    .eq('user_id', userId);

  // Get expenses assigned to clients
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, client_id, reimbursement_type')
    .eq('user_id', userId);

  const clientCount = clients?.length || 0;
  const contractCount = contracts?.length || 0;
  const assignedExpenses = expenses?.filter(e => e.client_id).length || 0;
  const reimbursableExpenses = expenses?.filter(e => e.reimbursement_type === 'client_reimbursable').length || 0;

  let currentStep = 0;
  if (clientCount === 0) currentStep = 0;
  else if (contractCount === 0) currentStep = 1;
  else if (assignedExpenses === 0) currentStep = 2;
  else if (reimbursableExpenses > 0) currentStep = 3;
  else currentStep = 4;

  return {
    workflowId: 'client-billing',
    currentStep,
    totalSteps: 5,
    stepDetails: [
      { stepId: 'client', status: clientCount > 0 ? 'completed' : 'current', count: clientCount },
      { stepId: 'contract', status: contractCount > 0 ? 'completed' : (currentStep >= 1 ? 'current' : 'pending'), count: contractCount },
      { stepId: 'assign', status: assignedExpenses > 0 ? 'completed' : (currentStep >= 2 ? 'current' : 'pending'), count: assignedExpenses },
      { stepId: 'generate', status: currentStep >= 3 ? 'current' : 'pending', count: reimbursableExpenses },
      { stepId: 'send', status: currentStep >= 4 ? 'completed' : 'pending' },
    ],
    stats: [
      { label: { es: 'Clientes', en: 'Clients' }, value: clientCount, type: 'count' },
      { label: { es: 'Contratos', en: 'Contracts' }, value: contractCount, type: 'count' },
      { label: { es: 'Reembolsables', en: 'Reimbursable' }, value: reimbursableExpenses, type: 'count' },
    ],
  };
}

async function getTaxPreparationProgress(userId: string): Promise<WorkflowProgress> {
  // Get expenses by category and deductibility
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, category, reimbursement_type, amount')
    .eq('user_id', userId);

  const categorizedCount = expenses?.filter(e => e.category).length || 0;
  const deductibleCount = expenses?.filter(e => e.reimbursement_type === 'cra_deductible').length || 0;
  const totalAmount = expenses?.filter(e => e.reimbursement_type === 'cra_deductible')
    .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const uncategorizedCount = expenses?.filter(e => !e.category).length || 0;

  let currentStep = 0;
  if (uncategorizedCount > 0) currentStep = 0;
  else if (deductibleCount === 0) currentStep = 1;
  else if (deductibleCount > 0) currentStep = 2;
  else currentStep = 3;

  return {
    workflowId: 'tax-preparation',
    currentStep,
    totalSteps: 5,
    stepDetails: [
      { stepId: 'categorize', status: uncategorizedCount === 0 ? 'completed' : 'current', count: uncategorizedCount },
      { stepId: 'calculate', status: currentStep >= 1 ? (currentStep === 1 ? 'current' : 'completed') : 'pending', count: deductibleCount },
      { stepId: 'optimize', status: currentStep >= 2 ? 'current' : 'pending' },
      { stepId: 'export', status: currentStep >= 3 ? 'current' : 'pending' },
      { stepId: 'file', status: currentStep >= 4 ? 'completed' : 'pending' },
    ],
    stats: [
      { label: { es: 'Sin categoría', en: 'Uncategorized' }, value: uncategorizedCount, type: 'count' },
      { label: { es: 'Deducibles', en: 'Deductible' }, value: deductibleCount, type: 'count' },
      { label: { es: 'Total deducible', en: 'Total deductible' }, value: totalAmount, type: 'currency' },
    ],
  };
}

async function getBankReconciliationProgress(userId: string): Promise<WorkflowProgress> {
  // Get bank transactions by status
  const { data: transactions } = await supabase
    .from('bank_transactions')
    .select('id, status')
    .eq('user_id', userId);

  const totalCount = transactions?.length || 0;
  const pendingCount = transactions?.filter(t => t.status === 'pending').length || 0;
  const matchedCount = transactions?.filter(t => t.status === 'matched').length || 0;
  const discrepancyCount = transactions?.filter(t => t.status === 'discrepancy').length || 0;

  let currentStep = 0;
  if (totalCount === 0) currentStep = 0;
  else if (pendingCount > 0 && matchedCount === 0) currentStep = 1;
  else if (pendingCount > 0) currentStep = 2;
  else if (discrepancyCount > 0) currentStep = 3;
  else currentStep = 4;

  return {
    workflowId: 'bank-reconciliation',
    currentStep,
    totalSteps: 5,
    stepDetails: [
      { stepId: 'import', status: totalCount > 0 ? 'completed' : 'current', count: totalCount },
      { stepId: 'analyze', status: currentStep >= 1 ? (currentStep === 1 ? 'current' : 'completed') : 'pending' },
      { stepId: 'match', status: pendingCount > 0 ? 'current' : (matchedCount > 0 ? 'completed' : 'pending'), count: pendingCount },
      { stepId: 'review-unmatched', status: discrepancyCount > 0 ? 'current' : (currentStep > 3 ? 'completed' : 'pending'), count: discrepancyCount },
      { stepId: 'reconciled', status: currentStep === 4 ? 'completed' : 'pending', count: matchedCount },
    ],
    stats: [
      { label: { es: 'Pendientes', en: 'Pending' }, value: pendingCount, type: 'count' },
      { label: { es: 'Conciliadas', en: 'Matched' }, value: matchedCount, type: 'count' },
      { label: { es: 'Discrepancias', en: 'Discrepancies' }, value: discrepancyCount, type: 'count' },
    ],
  };
}

async function getWealthBuildingProgress(userId: string): Promise<WorkflowProgress> {
  // Get income, expenses, assets, liabilities, and goals
  const [
    { data: income },
    { data: expenses },
    { data: assets },
    { data: liabilities },
    { data: goals }
  ] = await Promise.all([
    supabase.from('income').select('id, amount').eq('user_id', userId),
    supabase.from('expenses').select('id, amount').eq('user_id', userId),
    supabase.from('assets').select('id, current_value').eq('user_id', userId),
    supabase.from('liabilities').select('id, current_balance').eq('user_id', userId),
    supabase.from('investment_goals').select('id, status').eq('user_id', userId),
  ]);

  const hasTracking = (income?.length || 0) > 0 || (expenses?.length || 0) > 0;
  const hasAssets = (assets?.length || 0) > 0;
  const hasGoals = (goals?.length || 0) > 0;
  const totalAssets = assets?.reduce((sum, a) => sum + Number(a.current_value), 0) || 0;
  const totalLiabilities = liabilities?.reduce((sum, l) => sum + Number(l.current_balance), 0) || 0;
  const netWorth = totalAssets - totalLiabilities;
  const completedGoals = goals?.filter(g => g.status === 'completed').length || 0;

  let currentStep = 0;
  if (!hasTracking) currentStep = 0;
  else if (!hasAssets) currentStep = 1;
  else if (!hasGoals) currentStep = 2;
  else if (completedGoals === 0) currentStep = 3;
  else currentStep = 4;

  return {
    workflowId: 'wealth-building',
    currentStep,
    totalSteps: 5,
    stepDetails: [
      { stepId: 'track', status: hasTracking ? 'completed' : 'current' },
      { stepId: 'save', status: currentStep >= 1 ? (currentStep === 1 ? 'current' : 'completed') : 'pending' },
      { stepId: 'invest', status: currentStep >= 2 ? (currentStep === 2 ? 'current' : 'completed') : 'pending' },
      { stepId: 'grow', status: currentStep >= 3 ? (currentStep === 3 ? 'current' : 'completed') : 'pending' },
      { stepId: 'freedom', status: currentStep >= 4 ? 'completed' : 'pending' },
    ],
    stats: [
      { label: { es: 'Patrimonio neto', en: 'Net worth' }, value: netWorth, type: 'currency' },
      { label: { es: 'Activos', en: 'Assets' }, value: assets?.length || 0, type: 'count' },
      { label: { es: 'Metas activas', en: 'Active goals' }, value: goals?.length || 0, type: 'count' },
    ],
  };
}

function getDefaultProgress(workflowId: string): WorkflowProgress {
  return {
    workflowId,
    currentStep: 0,
    totalSteps: 5,
    stepDetails: [],
    stats: [],
  };
}
