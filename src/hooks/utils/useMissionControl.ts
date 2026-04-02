import { useMemo } from 'react';
import { useDocumentsForReview } from '@/hooks/data/useDocumentReview';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useClients } from '@/hooks/data/useClients';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useContracts } from '@/hooks/data/useContracts';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useCategoryBudgets } from '@/hooks/data/useCategoryBudgets';
import { useFinancialProfile } from '@/hooks/data/useFinancialProfile';
import { calculateClientCompleteness } from '@/lib/constants/client-completeness';
import { differenceInDays, parseISO, isBefore } from 'date-fns';

export type CategoryStatus = 'complete' | 'good' | 'needs_attention' | 'urgent';
export type FeatureReadiness = 'ready' | 'partial' | 'blocked';

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

export interface FeatureRequirement {
  key: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  emoji: string;
  readiness: FeatureReadiness;
  percentage: number;
  missingData: { label: { es: string; en: string }; actionUrl: string; priority: 'critical' | 'important' | 'nice' }[];
  actionUrl: string;
}

export interface MissionControlData {
  globalScore: number;
  globalLevel: { es: string; en: string };
  categories: CategoryMetrics[];
  urgentTotal: number;
  pendingTotal: number;
  okTotal: number;
  unapprovedInUse: UnapprovedInUse[];
  featureReadiness: FeatureRequirement[];
  systemFuelScore: number;
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
  const { data: budgets = [], isLoading: budgetsLoading } = useCategoryBudgets();
  const { data: financialProfile, isLoading: fpLoading } = useFinancialProfile();

  const isLoading = docsLoading || expLoading || incLoading || cliLoading || bankLoading || conLoading || billsLoading || budgetsLoading || fpLoading;

  return useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

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
      key: 'documents', label: { es: 'Documentos', en: 'Documents' }, emoji: '📄',
      total: docsTotal, complete: docsApproved, percentage: docsPct,
      urgentCount: docsUrgent, pendingCount: docsPending,
      status: getStatus(docsPct, docsUrgent),
      pipeline: [
        { label: { es: 'Subidos', en: 'Uploaded' }, count: docsTotal },
        { label: { es: 'Procesados', en: 'Processed' }, count: docsProcessed },
        { label: { es: 'Aprobados', en: 'Approved' }, count: docsApproved },
      ],
      actionUrl: '/chaos', details: docsDetails,
    };

    // ── Expenses ──
    const expTotal = expenses.length;
    const expThisMonth = expenses.filter(e => {
      const d = parseISO(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const expWithReceipt = expenses.filter(e => e.document_id).length;
    const expWithCategory = expenses.filter(e => e.category && e.category !== 'other').length;
    const expWithClassification = expenses.filter(e => e.reimbursement_type && e.reimbursement_type !== 'pending_classification').length;
    const expUnclassified = expTotal - expWithClassification;
    const expNoCat = expTotal - expWithCategory;
    const expPct = expTotal > 0
      ? Math.round(((expWithCategory / expTotal) * 40 + (expWithClassification / expTotal) * 40 + (expWithReceipt / expTotal) * 20))
      : 100;
    const expUrgent = expUnclassified > 5 ? expUnclassified : 0;
    const expDetails: DetailItem[] = [];
    if (expUnclassified > 0) expDetails.push({ label: `${expUnclassified} sin clasificar`, isUrgent: expUnclassified > 5 });
    if (expNoCat > 0) expDetails.push({ label: `${expNoCat} sin categoría`, isUrgent: false });

    const expCategory: CategoryMetrics = {
      key: 'expenses', label: { es: 'Gastos', en: 'Expenses' }, emoji: '💰',
      total: expTotal, complete: expWithClassification, percentage: expPct,
      urgentCount: expUrgent, pendingCount: expUnclassified,
      status: getStatus(expPct, expUrgent),
      pipeline: [
        { label: { es: 'Registrados', en: 'Recorded' }, count: expTotal },
        { label: { es: 'Con recibo', en: 'With receipt' }, count: expWithReceipt },
        { label: { es: 'Clasificados', en: 'Classified' }, count: expWithClassification },
      ],
      actionUrl: '/expenses', details: expDetails,
    };

    // ── Income ──
    const incTotal = income.length;
    const incThisMonth = income.filter((i: any) => {
      const d = parseISO(i.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const incWithClient = income.filter((i: any) => i.client_id).length;
    const incWithProject = income.filter((i: any) => i.project_id).length;
    const incPct = incTotal > 0
      ? Math.round(((incWithClient / incTotal) * 60 + (incWithProject / incTotal) * 40))
      : 100;
    const incPending = incTotal - incWithClient;
    const incDetails: DetailItem[] = [];
    if (incPending > 0) incDetails.push({ label: `${incPending} sin cliente asignado`, isUrgent: false });

    const incCategory: CategoryMetrics = {
      key: 'income', label: { es: 'Ingresos', en: 'Income' }, emoji: '📊',
      total: incTotal, complete: incWithClient, percentage: incPct,
      urgentCount: 0, pendingCount: incPending,
      status: getStatus(incPct, 0),
      pipeline: [
        { label: { es: 'Registrados', en: 'Recorded' }, count: incTotal },
        { label: { es: 'Con cliente', en: 'With client' }, count: incWithClient },
        { label: { es: 'Con proyecto', en: 'With project' }, count: incWithProject },
      ],
      actionUrl: '/income', details: incDetails,
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
      key: 'clients', label: { es: 'Clientes', en: 'Clients' }, emoji: '👥',
      total: cliTotal, complete: cliComplete, percentage: cliPct,
      urgentCount: 0, pendingCount: cliIncomplete,
      status: getStatus(cliPct, 0),
      pipeline: [
        { label: { es: 'Total', en: 'Total' }, count: cliTotal },
        { label: { es: 'Completos', en: 'Complete' }, count: cliComplete },
      ],
      actionUrl: '/clients', details: cliDetails,
    };

    // ── Bank ──
    const bankTotal = bankTx.length;
    const bankMatched = bankTx.filter(t => t.matched_expense_id).length;
    const bankPending = bankTotal - bankMatched;
    const bankPct = bankTotal > 0 ? Math.round((bankMatched / bankTotal) * 100) : 100;
    const bankDetails: DetailItem[] = [];
    if (bankPending > 0) bankDetails.push({ label: `${bankPending} sin vincular`, isUrgent: bankPending > 10 });

    const bankCategory: CategoryMetrics = {
      key: 'bank', label: { es: 'Banco', en: 'Bank' }, emoji: '🏦',
      total: bankTotal, complete: bankMatched, percentage: bankPct,
      urgentCount: bankPending > 10 ? bankPending : 0, pendingCount: bankPending,
      status: getStatus(bankPct, bankPending > 10 ? bankPending : 0),
      pipeline: [
        { label: { es: 'Importadas', en: 'Imported' }, count: bankTotal },
        { label: { es: 'Conciliadas', en: 'Matched' }, count: bankMatched },
      ],
      actionUrl: '/bank', details: bankDetails,
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
      key: 'contracts', label: { es: 'Contratos', en: 'Contracts' }, emoji: '📋',
      total: conTotal, complete: conLinked, percentage: conPct,
      urgentCount: conExpired, pendingCount: conTotal - conLinked,
      status: getStatus(conPct, conExpired),
      pipeline: [
        { label: { es: 'Total', en: 'Total' }, count: conTotal },
        { label: { es: 'Activos', en: 'Active' }, count: conActive },
        { label: { es: 'Con cliente', en: 'With client' }, count: conLinked },
      ],
      actionUrl: '/contracts', details: conDetails,
    };

    // ── Bills ──
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
      key: 'bills', label: { es: 'Pagos Fijos', en: 'Fixed Payments' }, emoji: '🔄',
      total: billTotal, complete: billTotal - billOverdue, percentage: billPct,
      urgentCount: billOverdue, pendingCount: billOverdue,
      status: getStatus(billPct, billOverdue),
      pipeline: [
        { label: { es: 'Configurados', en: 'Configured' }, count: billTotal },
        { label: { es: 'Activos', en: 'Active' }, count: billActive },
      ],
      actionUrl: '/bills', details: billDetails,
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
        type: 'expense' as const, id: e.id,
        vendor: e.vendor || 'Unknown', amount: e.amount,
        documentStatus: docMap.get(e.document_id!)?.review_status || 'unknown',
      }));

    // ══════════════════════════════════════════════
    // ── FEATURE READINESS — What the system needs ──
    // ══════════════════════════════════════════════

    const hasExpenses = expTotal > 0;
    const hasIncome = incTotal > 0;
    const hasClients = cliTotal > 0;
    const hasBudgets = budgets.length > 0;
    const hasBills = billTotal > 0;
    const hasBankData = bankTotal > 0;
    const hasContracts = conTotal > 0;
    const hasFinProfile = !!financialProfile;
    const hasThisMonthExpenses = expThisMonth >= 3;
    const hasThisMonthIncome = incThisMonth > 0;
    const hasClassifiedExpenses = expWithClassification > 0;

    const featureReadiness: FeatureRequirement[] = [];

    // 1. Proyecciones de fin de mes
    {
      const missing: FeatureRequirement['missingData'] = [];
      if (!hasThisMonthExpenses) missing.push({ label: { es: 'Gastos del mes actual (mín. 3)', en: 'Current month expenses (min. 3)' }, actionUrl: '/expenses', priority: 'critical' });
      if (!hasThisMonthIncome) missing.push({ label: { es: 'Ingresos del mes actual', en: 'Current month income' }, actionUrl: '/income', priority: 'critical' });
      if (!hasBills) missing.push({ label: { es: 'Pagos fijos recurrentes', en: 'Recurring fixed payments' }, actionUrl: '/bills', priority: 'important' });
      const pct = Math.round(([hasThisMonthExpenses, hasThisMonthIncome, hasBills].filter(Boolean).length / 3) * 100);
      featureReadiness.push({
        key: 'projections', name: { es: 'Proyecciones de Fin de Mes', en: 'End-of-Month Projections' },
        emoji: '🔮', readiness: pct >= 100 ? 'ready' : pct >= 50 ? 'partial' : 'blocked',
        percentage: pct, missingData: missing, actionUrl: '/budget',
      });
    }

    // 2. Presupuesto inteligente
    {
      const missing: FeatureRequirement['missingData'] = [];
      if (!hasBudgets) missing.push({ label: { es: 'Límites de presupuesto por categoría', en: 'Budget limits by category' }, actionUrl: '/budget', priority: 'critical' });
      if (!hasExpenses) missing.push({ label: { es: 'Gastos registrados', en: 'Recorded expenses' }, actionUrl: '/expenses', priority: 'critical' });
      if (!hasIncome) missing.push({ label: { es: 'Ingresos registrados', en: 'Recorded income' }, actionUrl: '/income', priority: 'important' });
      const pct = Math.round(([hasBudgets, hasExpenses, hasIncome].filter(Boolean).length / 3) * 100);
      featureReadiness.push({
        key: 'budget', name: { es: 'Presupuesto Inteligente', en: 'Smart Budget' },
        emoji: '📋', readiness: pct >= 100 ? 'ready' : pct >= 50 ? 'partial' : 'blocked',
        percentage: pct, missingData: missing, actionUrl: '/budget',
      });
    }

    // 3. Reportes fiscales
    {
      const missing: FeatureRequirement['missingData'] = [];
      if (!hasClassifiedExpenses) missing.push({ label: { es: 'Gastos clasificados (deducible/reembolsable)', en: 'Classified expenses (deductible/reimbursable)' }, actionUrl: '/expenses', priority: 'critical' });
      if (!hasIncome) missing.push({ label: { es: 'Ingresos registrados', en: 'Recorded income' }, actionUrl: '/income', priority: 'critical' });
      if (!hasClients) missing.push({ label: { es: 'Clientes con datos fiscales', en: 'Clients with tax info' }, actionUrl: '/clients', priority: 'important' });
      const pct = Math.round(([hasClassifiedExpenses, hasIncome, hasClients].filter(Boolean).length / 3) * 100);
      featureReadiness.push({
        key: 'tax_reports', name: { es: 'Reportes Fiscales', en: 'Tax Reports' },
        emoji: '🧾', readiness: pct >= 100 ? 'ready' : pct >= 50 ? 'partial' : 'blocked',
        percentage: pct, missingData: missing, actionUrl: '/reports',
      });
    }

    // 4. Tasa de ahorro y salud financiera
    {
      const missing: FeatureRequirement['missingData'] = [];
      if (!hasThisMonthIncome) missing.push({ label: { es: 'Ingresos de este mes', en: 'This month\'s income' }, actionUrl: '/income', priority: 'critical' });
      if (!hasThisMonthExpenses) missing.push({ label: { es: 'Gastos de este mes', en: 'This month\'s expenses' }, actionUrl: '/expenses', priority: 'critical' });
      const pct = Math.round(([hasThisMonthIncome, hasThisMonthExpenses].filter(Boolean).length / 2) * 100);
      featureReadiness.push({
        key: 'savings_rate', name: { es: 'Tasa de Ahorro', en: 'Savings Rate' },
        emoji: '💪', readiness: pct >= 100 ? 'ready' : pct >= 50 ? 'partial' : 'blocked',
        percentage: pct, missingData: missing, actionUrl: '/dashboard',
      });
    }

    // 5. Cash Flow Runway
    {
      const missing: FeatureRequirement['missingData'] = [];
      if (!hasIncome) missing.push({ label: { es: 'Historial de ingresos', en: 'Income history' }, actionUrl: '/income', priority: 'critical' });
      if (!hasExpenses) missing.push({ label: { es: 'Historial de gastos', en: 'Expense history' }, actionUrl: '/expenses', priority: 'critical' });
      if (!hasBills) missing.push({ label: { es: 'Obligaciones fijas mensuales', en: 'Monthly fixed obligations' }, actionUrl: '/bills', priority: 'important' });
      if (!hasBankData) missing.push({ label: { es: 'Estado de cuenta bancario', en: 'Bank statement' }, actionUrl: '/bank', priority: 'nice' });
      const pct = Math.round(([hasIncome, hasExpenses, hasBills, hasBankData].filter(Boolean).length / 4) * 100);
      featureReadiness.push({
        key: 'cashflow', name: { es: 'Runway y Flujo de Caja', en: 'Cash Flow Runway' },
        emoji: '🛫', readiness: pct >= 100 ? 'ready' : pct >= 50 ? 'partial' : 'blocked',
        percentage: pct, missingData: missing, actionUrl: '/dashboard?area=negocio',
      });
    }

    // 6. Rentabilidad por cliente
    {
      const missing: FeatureRequirement['missingData'] = [];
      if (!hasClients) missing.push({ label: { es: 'Clientes registrados', en: 'Registered clients' }, actionUrl: '/clients', priority: 'critical' });
      if (!hasIncome) missing.push({ label: { es: 'Ingresos vinculados a clientes', en: 'Income linked to clients' }, actionUrl: '/income', priority: 'critical' });
      if (!hasContracts) missing.push({ label: { es: 'Contratos activos', en: 'Active contracts' }, actionUrl: '/contracts', priority: 'nice' });
      const clientsWithIncome = hasClients && incWithClient > 0;
      const pct = Math.round(([hasClients, clientsWithIncome, hasContracts].filter(Boolean).length / 3) * 100);
      featureReadiness.push({
        key: 'client_profit', name: { es: 'Rentabilidad por Cliente', en: 'Client Profitability' },
        emoji: '📈', readiness: pct >= 100 ? 'ready' : pct >= 50 ? 'partial' : 'blocked',
        percentage: pct, missingData: missing, actionUrl: '/dashboard?area=negocio',
      });
    }

    // 7. Perfil de inversión / FIRE
    {
      const missing: FeatureRequirement['missingData'] = [];
      if (!hasFinProfile) missing.push({ label: { es: 'Perfil financiero personal', en: 'Personal financial profile' }, actionUrl: '/dashboard?area=crecimiento', priority: 'critical' });
      if (!hasIncome) missing.push({ label: { es: 'Ingresos registrados', en: 'Recorded income' }, actionUrl: '/income', priority: 'critical' });
      if (!hasExpenses) missing.push({ label: { es: 'Gastos registrados', en: 'Recorded expenses' }, actionUrl: '/expenses', priority: 'important' });
      const pct = Math.round(([hasFinProfile, hasIncome, hasExpenses].filter(Boolean).length / 3) * 100);
      featureReadiness.push({
        key: 'fire', name: { es: 'Calculadora FIRE e Inversión', en: 'FIRE & Investment Calculator' },
        emoji: '🔥', readiness: pct >= 100 ? 'ready' : pct >= 50 ? 'partial' : 'blocked',
        percentage: pct, missingData: missing, actionUrl: '/dashboard?area=crecimiento',
      });
    }

    // 8. Conciliación bancaria
    {
      const missing: FeatureRequirement['missingData'] = [];
      if (!hasBankData) missing.push({ label: { es: 'Importar estado de cuenta', en: 'Import bank statement' }, actionUrl: '/bank', priority: 'critical' });
      if (!hasExpenses) missing.push({ label: { es: 'Gastos registrados para vincular', en: 'Expenses recorded to match' }, actionUrl: '/expenses', priority: 'critical' });
      const pct = Math.round(([hasBankData, hasExpenses].filter(Boolean).length / 2) * 100);
      featureReadiness.push({
        key: 'reconciliation', name: { es: 'Conciliación Bancaria', en: 'Bank Reconciliation' },
        emoji: '🏦', readiness: pct >= 100 ? 'ready' : pct >= 50 ? 'partial' : 'blocked',
        percentage: pct, missingData: missing, actionUrl: '/bank',
      });
    }

    // Sort: blocked first, then partial, then ready
    featureReadiness.sort((a, b) => {
      const order: Record<FeatureReadiness, number> = { blocked: 0, partial: 1, ready: 2 };
      return order[a.readiness] - order[b.readiness];
    });

    // System fuel score = average of feature readiness
    const systemFuelScore = featureReadiness.length > 0
      ? Math.round(featureReadiness.reduce((s, f) => s + f.percentage, 0) / featureReadiness.length)
      : 100;

    // ── Aggregate categories ──
    const categories = [docsCategory, expCategory, incCategory, cliCategory, bankCategory, conCategory, billCategory]
      .filter(c => c.total > 0);

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
      globalScore, globalLevel: getLevel(globalScore),
      categories, urgentTotal, pendingTotal, okTotal,
      unapprovedInUse, featureReadiness, systemFuelScore, isLoading,
    };
  }, [documents, expenses, income, clients, bankTx, contracts, bills, budgets, financialProfile, isLoading]);
}
