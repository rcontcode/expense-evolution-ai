import { useMemo } from 'react';
import { useDocumentsForReview } from '@/hooks/data/useDocumentReview';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useClients } from '@/hooks/data/useClients';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useContracts } from '@/hooks/data/useContracts';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { calculateClientCompleteness } from '@/lib/constants/client-completeness';
import { differenceInDays, parseISO, isBefore } from 'date-fns';

export type CategoryStatus = 'complete' | 'good' | 'needs_attention' | 'urgent';

export interface CategoryMetrics {
  key: string;
  label: { es: string; en: string };
  emoji: string;
  total: number;
  complete: number;
  percentage: number;
  urgentCount: number;
  pendingCount: number;
  status: CategoryStatus;
  pipeline: PipelineStage[];
  actionUrl: string;
  details: DetailItem[];
}

export interface PipelineStage {
  label: { es: string; en: string };
  count: number;
}

export interface DetailItem {
  label: string;
  isUrgent: boolean;
}

export interface UnapprovedInUse {
  type: 'expense' | 'income';
  id: string;
  vendor: string;
  amount: number;
  documentStatus: string;
}

export interface MissionControlData {
  globalScore: number;
  globalLevel: { es: string; en: string };
  categories: CategoryMetrics[];
  urgentTotal: number;
  pendingTotal: number;
  okTotal: number;
  unapprovedInUse: UnapprovedInUse[];
  isLoading: boolean;
}

function getStatus(percentage: number, urgentCount: number): CategoryStatus {
  if (urgentCount > 0) return 'urgent';
  if (percentage >= 100) return 'complete';
  if (percentage >= 70) return 'good';
  return 'needs_attention';
}

function getLevel(score: number): { es: string; en: string } {
  if (score >= 95) return { es: 'Maestro', en: 'Master' };
  if (score >= 80) return { es: 'Experto', en: 'Expert' };
  if (score >= 50) return { es: 'Organizado', en: 'Organized' };
  return { es: 'Principiante', en: 'Beginner' };
}

export function useMissionControl(): MissionControlData {
  const { data: documents = [], isLoading: docsLoading } = useDocumentsForReview();
  const { data: expenses = [], isLoading: expLoading } = useExpenses();
  const { data: income = [], isLoading: incLoading } = useIncome();
  const { data: clients = [], isLoading: cliLoading } = useClients();
  const { data: bankTx = [], isLoading: bankLoading } = useBankTransactions();
  const { data: contracts = [], isLoading: conLoading } = useContracts();
  const { data: bills = [], isLoading: billsLoading } = useRecurringBills();

  const isLoading = docsLoading || expLoading || incLoading || cliLoading || bankLoading || conLoading || billsLoading;

  return useMemo(() => {
    const now = new Date();

    // ── Documents ──
    const docsTotal = documents.length;
    const docsProcessed = documents.filter(d => d.status === 'classified' || d.status === 'processed' || d.review_status === 'approved').length;
    const docsApproved = documents.filter(d => d.review_status === 'approved').length;
    const docsPending = documents.filter(d => d.review_status === 'pending_review' || d.review_status === 'needs_correction').length;
    const docsUrgent = documents.filter(d => {
      if (d.review_status !== 'pending_review') return false;
      const created = d.created_at ? parseISO(d.created_at) : now;
      return differenceInDays(now, created) > 3;
    }).length;
    const docsPct = docsTotal > 0 ? Math.round((docsApproved / docsTotal) * 100) : 100;
    const docsDetails: DetailItem[] = [];
    if (docsUrgent > 0) docsDetails.push({ label: `${docsUrgent} pendientes > 3 días`, isUrgent: true });
    if (docsPending > 0) docsDetails.push({ label: `${docsPending} por revisar`, isUrgent: false });

    const docsCategory: CategoryMetrics = {
      key: 'documents',
      label: { es: 'Documentos', en: 'Documents' },
      emoji: '📄',
      total: docsTotal,
      complete: docsApproved,
      percentage: docsPct,
      urgentCount: docsUrgent,
      pendingCount: docsPending,
      status: getStatus(docsPct, docsUrgent),
      pipeline: [
        { label: { es: 'Subidos', en: 'Uploaded' }, count: docsTotal },
        { label: { es: 'Procesados', en: 'Processed' }, count: docsProcessed },
        { label: { es: 'Aprobados', en: 'Approved' }, count: docsApproved },
      ],
      actionUrl: '/chaos',
      details: docsDetails,
    };

    // ── Expenses ──
    const expTotal = expenses.length;
    const expWithReceipt = expenses.filter(e => e.document_id).length;
    const expWithCategory = expenses.filter(e => e.category && e.category !== 'other').length;
    const expWithClassification = expenses.filter(e => e.reimbursement_type && e.reimbursement_type !== 'pending_classification').length;
    const expUnclassified = expTotal - expWithClassification;
    const expNoCat = expTotal - expWithCategory;
    // Weighted completeness: category 40%, classification 40%, receipt 20%
    const expPct = expTotal > 0
      ? Math.round(
          ((expWithCategory / expTotal) * 40 +
          (expWithClassification / expTotal) * 40 +
          (expWithReceipt / expTotal) * 20)
        )
      : 100;
    const expUrgent = expUnclassified > 5 ? expUnclassified : 0;
    const expDetails: DetailItem[] = [];
    if (expUnclassified > 0) expDetails.push({ label: `${expUnclassified} sin clasificar`, isUrgent: expUnclassified > 5 });
    if (expNoCat > 0) expDetails.push({ label: `${expNoCat} sin categoría`, isUrgent: false });

    const expCategory: CategoryMetrics = {
      key: 'expenses',
      label: { es: 'Gastos', en: 'Expenses' },
      emoji: '💰',
      total: expTotal,
      complete: expWithClassification,
      percentage: expPct,
      urgentCount: expUrgent,
      pendingCount: expUnclassified,
      status: getStatus(expPct, expUrgent),
      pipeline: [
        { label: { es: 'Registrados', en: 'Recorded' }, count: expTotal },
        { label: { es: 'Con recibo', en: 'With receipt' }, count: expWithReceipt },
        { label: { es: 'Clasificados', en: 'Classified' }, count: expWithClassification },
      ],
      actionUrl: '/expenses',
      details: expDetails,
    };

    // ── Income ──
    const incTotal = income.length;
    const incWithClient = income.filter((i: any) => i.client_id).length;
    const incWithProject = income.filter((i: any) => i.project_id).length;
    const incPct = incTotal > 0
      ? Math.round(((incWithClient / incTotal) * 60 + (incWithProject / incTotal) * 40))
      : 100;
    const incPending = incTotal - incWithClient;
    const incDetails: DetailItem[] = [];
    if (incPending > 0) incDetails.push({ label: `${incPending} sin cliente asignado`, isUrgent: false });

    const incCategory: CategoryMetrics = {
      key: 'income',
      label: { es: 'Ingresos', en: 'Income' },
      emoji: '📊',
      total: incTotal,
      complete: incWithClient,
      percentage: incPct,
      urgentCount: 0,
      pendingCount: incPending,
      status: getStatus(incPct, 0),
      pipeline: [
        { label: { es: 'Registrados', en: 'Recorded' }, count: incTotal },
        { label: { es: 'Con cliente', en: 'With client' }, count: incWithClient },
        { label: { es: 'Con proyecto', en: 'With project' }, count: incWithProject },
      ],
      actionUrl: '/income',
      details: incDetails,
    };

    // ── Clients ──
    const cliTotal = clients.length;
    const cliComplete = clients.filter(c => {
      const comp = calculateClientCompleteness(c, true);
      return comp.percentage >= 80;
    }).length;
    const cliIncomplete = clients.filter(c => !c.contact_email && !c.contact_phone).length;
    const cliPct = cliTotal > 0 ? Math.round((cliComplete / cliTotal) * 100) : 100;
    const cliDetails: DetailItem[] = [];
    if (cliIncomplete > 0) cliDetails.push({ label: `${cliIncomplete} sin contacto`, isUrgent: false });

    const cliCategory: CategoryMetrics = {
      key: 'clients',
      label: { es: 'Clientes', en: 'Clients' },
      emoji: '👥',
      total: cliTotal,
      complete: cliComplete,
      percentage: cliPct,
      urgentCount: 0,
      pendingCount: cliIncomplete,
      status: getStatus(cliPct, 0),
      pipeline: [
        { label: { es: 'Total', en: 'Total' }, count: cliTotal },
        { label: { es: 'Completos', en: 'Complete' }, count: cliComplete },
      ],
      actionUrl: '/clients',
      details: cliDetails,
    };

    // ── Bank Transactions ──
    const bankTotal = bankTx.length;
    const bankMatched = bankTx.filter(t => t.matched_expense_id).length;
    const bankPending = bankTotal - bankMatched;
    const bankPct = bankTotal > 0 ? Math.round((bankMatched / bankTotal) * 100) : 100;
    const bankDetails: DetailItem[] = [];
    if (bankPending > 0) bankDetails.push({ label: `${bankPending} sin vincular`, isUrgent: bankPending > 10 });

    const bankCategory: CategoryMetrics = {
      key: 'bank',
      label: { es: 'Banco', en: 'Bank' },
      emoji: '🏦',
      total: bankTotal,
      complete: bankMatched,
      percentage: bankPct,
      urgentCount: bankPending > 10 ? bankPending : 0,
      pendingCount: bankPending,
      status: getStatus(bankPct, bankPending > 10 ? bankPending : 0),
      pipeline: [
        { label: { es: 'Importadas', en: 'Imported' }, count: bankTotal },
        { label: { es: 'Conciliadas', en: 'Matched' }, count: bankMatched },
      ],
      actionUrl: '/bank',
      details: bankDetails,
    };

    // ── Contracts ──
    const conTotal = contracts.length;
    const conActive = contracts.filter((c: any) => c.status === 'active').length;
    const conExpired = contracts.filter((c: any) => {
      if (!c.end_date) return false;
      return isBefore(parseISO(c.end_date), now);
    }).length;
    const conLinked = contracts.filter((c: any) => c.client_id).length;
    const conPct = conTotal > 0 ? Math.round((conLinked / conTotal) * 100) : 100;
    const conDetails: DetailItem[] = [];
    if (conExpired > 0) conDetails.push({ label: `${conExpired} vencidos`, isUrgent: true });

    const conCategory: CategoryMetrics = {
      key: 'contracts',
      label: { es: 'Contratos', en: 'Contracts' },
      emoji: '📋',
      total: conTotal,
      complete: conLinked,
      percentage: conPct,
      urgentCount: conExpired,
      pendingCount: conTotal - conLinked,
      status: getStatus(conPct, conExpired),
      pipeline: [
        { label: { es: 'Total', en: 'Total' }, count: conTotal },
        { label: { es: 'Activos', en: 'Active' }, count: conActive },
        { label: { es: 'Con cliente', en: 'With client' }, count: conLinked },
      ],
      actionUrl: '/contracts',
      details: conDetails,
    };

    // ── Recurring Bills ──
    const billTotal = bills.length;
    const billOverdue = bills.filter(b => {
      if (!b.next_due_date) return false;
      return isBefore(parseISO(b.next_due_date), now) && b.status !== 'paid';
    }).length;
    const billActive = bills.filter(b => b.status === 'active' || b.status === 'upcoming').length;
    const billPct = billTotal > 0 ? Math.round(((billTotal - billOverdue) / billTotal) * 100) : 100;
    const billDetails: DetailItem[] = [];
    if (billOverdue > 0) billDetails.push({ label: `${billOverdue} vencidos`, isUrgent: true });

    const billCategory: CategoryMetrics = {
      key: 'bills',
      label: { es: 'Pagos Fijos', en: 'Fixed Payments' },
      emoji: '🔄',
      total: billTotal,
      complete: billTotal - billOverdue,
      percentage: billPct,
      urgentCount: billOverdue,
      pendingCount: billOverdue,
      status: getStatus(billPct, billOverdue),
      pipeline: [
        { label: { es: 'Configurados', en: 'Configured' }, count: billTotal },
        { label: { es: 'Activos', en: 'Active' }, count: billActive },
      ],
      actionUrl: '/bills',
      details: billDetails,
    };

    // ── Unapproved data in use ──
    const docMap = new Map(documents.map(d => [d.id, d]));
    const unapprovedInUse: UnapprovedInUse[] = expenses
      .filter(e => {
        if (!e.document_id) return false;
        const doc = docMap.get(e.document_id);
        return doc && doc.review_status !== 'approved';
      })
      .map(e => ({
        type: 'expense' as const,
        id: e.id,
        vendor: e.vendor || 'Unknown',
        amount: e.amount,
        documentStatus: docMap.get(e.document_id!)?.review_status || 'unknown',
      }));

    // ── Aggregate ──
    const categories = [docsCategory, expCategory, incCategory, cliCategory, bankCategory, conCategory, billCategory]
      .filter(c => c.total > 0); // Only show categories with data

    const weights: Record<string, number> = {
      documents: 20, expenses: 25, income: 20, clients: 10, bank: 10, contracts: 10, bills: 5,
    };
    const activeCategories = categories.length > 0 ? categories : [];
    const totalWeight = activeCategories.reduce((s, c) => s + (weights[c.key] || 10), 0);
    const globalScore = totalWeight > 0
      ? Math.round(activeCategories.reduce((s, c) => s + c.percentage * (weights[c.key] || 10), 0) / totalWeight)
      : 100;

    const urgentTotal = categories.reduce((s, c) => s + (c.status === 'urgent' ? 1 : 0), 0);
    const pendingTotal = categories.reduce((s, c) => s + (c.status === 'needs_attention' ? 1 : 0), 0);
    const okTotal = categories.reduce((s, c) => s + (c.status === 'complete' || c.status === 'good' ? 1 : 0), 0);

    return {
      globalScore,
      globalLevel: getLevel(globalScore),
      categories,
      urgentTotal,
      pendingTotal,
      okTotal,
      unapprovedInUse,
      isLoading,
    };
  }, [documents, expenses, income, clients, bankTx, contracts, bills, isLoading]);
}
