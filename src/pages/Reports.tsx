import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useRecurringBills, useBillPayments } from '@/hooks/data/useRecurringBills';
import { useMonthlyPlanData } from '@/hooks/data/useMonthlyPlanData';
import { useMileage, useMileageSummary, MileageWithClient, calculateMileageDeductionByCountry } from '@/hooks/data/useMileage';
import { useEntity } from '@/contexts/EntityContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileDown, FileSpreadsheet, FileText, TrendingUp, PiggyBank, CalendarCheck, Receipt, Loader2, DollarSign, BarChart3, Car, Eye, X, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { startOfYear, endOfYear, format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { getBillCategoryLabel, getBillFrequencyLabel, getPaymentMethodLabel } from '@/lib/constants/bill-categories';
import { PageHeader } from '@/components/PageHeader';

interface ReportCard {
  id: string;
  icon: React.ReactNode;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  formats: ('pdf' | 'excel')[];
  badge?: { es: string; en: string };
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string; // tailwind color key for accents
}

const REPORT_CARDS: ReportCard[] = [
  {
    id: 'pnl',
    icon: <TrendingUp className="h-6 w-6" />,
    titleEs: 'Estado de Resultados (P&L)',
    titleEn: 'Profit & Loss Statement',
    descEs: 'Ingresos vs gastos con desglose mensual por categoría.',
    descEn: 'Revenue vs expenses with monthly breakdown by category.',
    formats: ['pdf', 'excel'],
    badge: { es: 'Nuevo', en: 'New' },
    badgeVariant: 'default',
    color: 'emerald',
  },
  {
    id: 'expenses',
    icon: <Receipt className="h-6 w-6" />,
    titleEs: 'Reporte de Gastos',
    titleEn: 'Expense Report',
    descEs: 'Todos tus gastos con categorías, clientes y deducibilidad.',
    descEn: 'All your expenses with categories, clients, and deductibility.',
    formats: ['pdf', 'excel'],
    color: 'blue',
  },
  {
    id: 'budget',
    icon: <PiggyBank className="h-6 w-6" />,
    titleEs: 'Plan de Presupuesto',
    titleEn: 'Budget Plan',
    descEs: 'Resumen del mes: ingresos, gastos fijos, disponible, ahorro.',
    descEn: 'Monthly summary: income, fixed payments, available, savings.',
    formats: ['pdf', 'excel'],
    color: 'violet',
  },
  {
    id: 'bills',
    icon: <CalendarCheck className="h-6 w-6" />,
    titleEs: 'Pagos Recurrentes',
    titleEn: 'Recurring Bills',
    descEs: 'Pagos fijos activos con frecuencia y próximo vencimiento.',
    descEn: 'Active fixed payments with frequency and next due date.',
    formats: ['pdf', 'excel'],
    color: 'amber',
  },
  {
    id: 'tax',
    icon: <DollarSign className="h-6 w-6" />,
    titleEs: 'Reporte Fiscal',
    titleEn: 'Tax Report',
    descEs: 'Ingresos gravables vs deducciones con ingreso neto imponible.',
    descEn: 'Taxable income vs deductions with net taxable income.',
    formats: ['pdf', 'excel'],
    badge: { es: 'Contador', en: 'Accountant' },
    badgeVariant: 'secondary',
    color: 'red',
  },
  {
    id: 'income_summary',
    icon: <BarChart3 className="h-6 w-6" />,
    titleEs: 'Resumen de Ingresos',
    titleEn: 'Income Summary',
    descEs: 'Todos los ingresos del año por tipo, fuente y cliente.',
    descEn: 'All income for the year by type, source, and client.',
    formats: ['pdf', 'excel'],
    color: 'green',
  },
  {
    id: 'mileage',
    icon: <Car className="h-6 w-6" />,
    titleEs: 'Reporte de Kilometraje',
    titleEn: 'Mileage Report',
    descEs: 'Viajes de negocio con km, rutas y deducciones fiscales.',
    descEn: 'Business trips with km, routes, and tax deductions.',
    formats: ['pdf', 'excel'],
    color: 'sky',
  },
  {
    id: 'reimbursement',
    icon: <Users className="h-6 w-6" />,
    titleEs: 'Rendición por Cliente',
    titleEn: 'Client Reimbursement',
    descEs: 'Gastos reembolsables agrupados por cliente para rendición.',
    descEn: 'Reimbursable expenses grouped by client for reporting.',
    formats: ['pdf', 'excel'],
    badge: { es: 'Pro', en: 'Pro' },
    badgeVariant: 'default',
    color: 'indigo',
  },
];

// Color maps for styling
const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; text: string; light: string }> = {
  emerald: { bg: 'bg-emerald-500/10', border: 'border-l-emerald-500', icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', light: 'bg-emerald-50 dark:bg-emerald-950/30' },
  blue: { bg: 'bg-blue-500/10', border: 'border-l-blue-500', icon: 'bg-blue-500/20 text-blue-600 dark:text-blue-400', text: 'text-blue-600 dark:text-blue-400', light: 'bg-blue-50 dark:bg-blue-950/30' },
  violet: { bg: 'bg-violet-500/10', border: 'border-l-violet-500', icon: 'bg-violet-500/20 text-violet-600 dark:text-violet-400', text: 'text-violet-600 dark:text-violet-400', light: 'bg-violet-50 dark:bg-violet-950/30' },
  amber: { bg: 'bg-amber-500/10', border: 'border-l-amber-500', icon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400', text: 'text-amber-600 dark:text-amber-400', light: 'bg-amber-50 dark:bg-amber-950/30' },
  red: { bg: 'bg-red-500/10', border: 'border-l-red-500', icon: 'bg-red-500/20 text-red-600 dark:text-red-400', text: 'text-red-600 dark:text-red-400', light: 'bg-red-50 dark:bg-red-950/30' },
  green: { bg: 'bg-green-500/10', border: 'border-l-green-500', icon: 'bg-green-500/20 text-green-600 dark:text-green-400', text: 'text-green-600 dark:text-green-400', light: 'bg-green-50 dark:bg-green-950/30' },
  sky: { bg: 'bg-sky-500/10', border: 'border-l-sky-500', icon: 'bg-sky-500/20 text-sky-600 dark:text-sky-400', text: 'text-sky-600 dark:text-sky-400', light: 'bg-sky-50 dark:bg-sky-950/30' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-l-indigo-500', icon: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400', text: 'text-indigo-600 dark:text-indigo-400', light: 'bg-indigo-50 dark:bg-indigo-950/30' },
};

interface PreviewData {
  type: string;
  title: string;
  color: string;
  kpis?: { label: string; value: string; accent?: boolean }[];
  headers: string[];
  rows: string[][];
  footer?: string[];
}

function ReportsAdvanced() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [exporting, setExporting] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const yearStart = startOfYear(new Date(selectedYear, 0));
  const yearEnd = endOfYear(new Date(selectedYear, 0));
  const { currentCountry } = useEntity();

  const { data: expenses } = useExpenses({ dateRange: { start: yearStart, end: yearEnd } });
  const { data: incomes } = useIncome();
  const { data: bills } = useRecurringBills();
  const { data: payments } = useBillPayments();
  const plan = useMonthlyPlanData();
  const { data: mileageData } = useMileage(selectedYear);
  const { data: mileageSummary } = useMileageSummary(selectedYear, currentCountry);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const yearIncomes = (incomes || []).filter(i => new Date(i.date).getFullYear() === selectedYear);
  const activeBills = bills?.filter(b => b.status === 'active') || [];

  const getPreview = (cardId: string): string | null => {
    switch (cardId) {
      case 'pnl': {
        const totalInc = yearIncomes.reduce((s, i) => s + i.amount, 0);
        const totalExp = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
        const margin = totalInc > 0 ? ((totalInc - totalExp) / totalInc * 100).toFixed(0) : '0';
        return `${yearIncomes.length} ${l ? 'ingresos' : 'incomes'} · ${(expenses || []).length} ${l ? 'gastos' : 'expenses'} · ${l ? 'Margen' : 'Margin'}: ${margin}%`;
      }
      case 'expenses': {
        const total = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
        return `${(expenses || []).length} ${l ? 'gastos' : 'expenses'} · ${fc(total)}`;
      }
      case 'budget':
        return plan.totalIncome > 0
          ? `${l ? 'Disponible' : 'Available'}: ${fc(plan.freeMoney - plan.totalSpent)} · ${l ? 'Ahorro' : 'Savings'}: ${plan.savingsRate.toFixed(0)}%`
          : null;
      case 'bills':
        return activeBills.length > 0
          ? `${activeBills.length} ${l ? 'activos' : 'active'} · ${fc(activeBills.reduce((s, b) => s + b.amount, 0))}/${l ? 'mes' : 'mo'}`
          : null;
      case 'tax': {
        const deductible = (expenses || []).filter(e => e.status === 'deductible' || (e as any).cra_deductible);
        const totalDed = deductible.reduce((s, e) => s + Number(e.amount), 0);
        const taxableIncome = yearIncomes.filter(i => i.is_taxable !== false).reduce((s, i) => s + i.amount, 0);
        const netTaxable = taxableIncome - totalDed;
        const taxLabel = currentCountry === 'CL' ? 'SII' : 'T2125';
        return `${taxLabel} · ${l ? 'Ingreso' : 'Income'}: ${fc(taxableIncome)} · ${l ? 'Deducciones' : 'Deductions'}: ${fc(totalDed)} · ${l ? 'Neto' : 'Net'}: ${fc(netTaxable)}`;
      }
      case 'income_summary':
        return yearIncomes.length > 0
          ? `${yearIncomes.length} ${l ? 'registros' : 'records'} · ${fc(yearIncomes.reduce((s, i) => s + i.amount, 0))}`
          : null;
      case 'mileage':
        return mileageSummary
          ? `${mileageSummary.totalTrips} ${l ? 'viajes' : 'trips'} · ${mileageSummary.totalKilometers.toFixed(0)} km${mileageSummary.totalDeductibleAmount > 0 ? ` · ${fc(mileageSummary.totalDeductibleAmount)}` : ''}`
          : null;
      case 'reimbursement': {
        const reimbursable = (expenses || []).filter(e => e.client_id && (e.reimbursement_type === 'client_reimbursable' || e.status === 'pending'));
        const totalReimb = reimbursable.reduce((s, e) => s + Number(e.amount), 0);
        return reimbursable.length > 0 ? `${reimbursable.length} ${l ? 'gastos' : 'expenses'} · ${fc(totalReimb)}` : null;
      }
      default:
        return null;
    }
  };

  const handlePreview = (reportId: string) => {
    const card = REPORT_CARDS.find(c => c.id === reportId);
    if (!card) return;
    const color = card.color;
    const title = l ? card.titleEs : card.titleEn;

    switch (reportId) {
      case 'pnl': {
        const totalInc = yearIncomes.reduce((s, i) => s + i.amount, 0);
        const totalExp = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
        const net = totalInc - totalExp;
        const margin = totalInc > 0 ? ((net / totalInc) * 100).toFixed(1) : '0';
        // Group by category
        const catMap: Record<string, number> = {};
        (expenses || []).forEach(e => { catMap[e.category || 'Other'] = (catMap[e.category || 'Other'] || 0) + Number(e.amount); });
        const catRows = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([cat, amt]) => [cat, fc(amt)]);
        setPreviewData({
          type: 'pnl', title, color,
          kpis: [
            { label: l ? 'Ingresos' : 'Income', value: fc(totalInc) },
            { label: l ? 'Gastos' : 'Expenses', value: fc(totalExp) },
            { label: l ? 'Ganancia Neta' : 'Net Profit', value: fc(net), accent: net >= 0 },
            { label: l ? 'Margen' : 'Margin', value: `${margin}%` },
          ],
          headers: [l ? 'Categoría' : 'Category', l ? 'Monto' : 'Amount'],
          rows: catRows,
          footer: [l ? 'Total Gastos' : 'Total Expenses', fc(totalExp)],
        });
        break;
      }
      case 'expenses': {
        const total = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
        const rows = (expenses || []).slice(0, 20).map(e => [e.date, e.vendor || e.description || '-', e.category || '-', fc(Number(e.amount))]);
        setPreviewData({
          type: 'expenses', title, color,
          kpis: [
            { label: l ? 'Total Gastos' : 'Total Expenses', value: fc(total) },
            { label: l ? 'Registros' : 'Records', value: String((expenses || []).length) },
          ],
          headers: [l ? 'Fecha' : 'Date', l ? 'Proveedor' : 'Vendor', l ? 'Categoría' : 'Category', l ? 'Monto' : 'Amount'],
          rows,
          footer: (expenses || []).length > 20 ? [`... ${l ? 'y' : 'and'} ${(expenses || []).length - 20} ${l ? 'más' : 'more'}`, '', '', fc(total)] : undefined,
        });
        break;
      }
      case 'budget': {
        setPreviewData({
          type: 'budget', title, color,
          kpis: [
            { label: l ? 'Ingresos' : 'Income', value: fc(plan.totalIncome) },
            { label: l ? 'Disponible' : 'Available', value: fc(plan.freeMoney - plan.totalSpent), accent: true },
            { label: l ? 'Ahorro' : 'Savings', value: `${plan.savingsRate.toFixed(1)}%` },
            { label: l ? 'Salud' : 'Health', value: `${plan.healthScore}/100` },
          ],
          headers: [l ? 'Concepto' : 'Item', l ? 'Monto' : 'Amount'],
          rows: [
            [l ? 'Ingresos' : 'Income', fc(plan.totalIncome)],
            [l ? 'Pagos Fijos' : 'Fixed', fc(plan.totalFixed)],
            [l ? 'Gastado' : 'Spent', fc(plan.totalSpent)],
            [l ? 'Disponible' : 'Available', fc(plan.freeMoney - plan.totalSpent)],
            [l ? 'Presupuesto Diario' : 'Daily Budget', fc(plan.dailyBudget)],
            [l ? 'Ahorro Proyectado' : 'Projected Savings', fc(plan.projectedSavings)],
          ],
        });
        break;
      }
      case 'bills': {
        if (activeBills.length === 0) { toast.info(l ? 'No hay pagos' : 'No bills'); return; }
        const lang = l ? 'es' : 'en';
        const totalMonthly = activeBills.reduce((s, b) => s + b.amount, 0);
        setPreviewData({
          type: 'bills', title, color,
          kpis: [
            { label: l ? 'Pagos Activos' : 'Active Bills', value: String(activeBills.length) },
            { label: l ? 'Total/Mes' : 'Total/Mo', value: fc(totalMonthly) },
          ],
          headers: [l ? 'Nombre' : 'Name', l ? 'Categoría' : 'Category', l ? 'Monto' : 'Amount', l ? 'Frecuencia' : 'Frequency'],
          rows: activeBills.map(b => [b.name, getBillCategoryLabel(b.category, lang), fc(b.amount), getBillFrequencyLabel(b.frequency, lang)]),
        });
        break;
      }
      case 'tax': {
        const deductible = (expenses || []).filter(e => e.status === 'deductible' || (e as any).cra_deductible);
        const totalDed = deductible.reduce((s, e) => s + Number(e.amount), 0);
        const taxableIncomes = yearIncomes.filter(i => i.is_taxable !== false);
        const totalTaxableIncome = taxableIncomes.reduce((s, i) => s + i.amount, 0);
        const netTaxable = totalTaxableIncome - totalDed;
        const taxLabel = currentCountry === 'CL' ? 'SII / F29' : 'CRA / T2125';
        setPreviewData({
          type: 'tax', title: `${title} — ${taxLabel}`, color,
          kpis: [
            { label: l ? 'Ingresos Gravables' : 'Taxable Income', value: fc(totalTaxableIncome) },
            { label: l ? 'Deducciones' : 'Deductions', value: fc(totalDed) },
            { label: l ? 'Ingreso Neto Imponible' : 'Net Taxable Income', value: fc(netTaxable), accent: netTaxable >= 0 },
            { label: l ? 'Gastos Deducibles' : 'Deductible Expenses', value: String(deductible.length) },
          ],
          headers: [l ? 'Sección' : 'Section', l ? 'Concepto' : 'Item', l ? 'Monto' : 'Amount'],
          rows: [
            [l ? '📈 Ingresos' : '📈 Income', '', ''],
            ...taxableIncomes.slice(0, 10).map(i => ['', i.source || i.income_type || '-', fc(i.amount)]),
            [l ? '📉 Deducciones' : '📉 Deductions', '', ''],
            ...deductible.slice(0, 10).map(e => ['', e.vendor || e.category || '-', fc(Number(e.amount))]),
          ],
          footer: [l ? 'Ingreso Neto Imponible' : 'Net Taxable Income', '', fc(netTaxable)],
        });
        break;
      }
      case 'income_summary': {
        if (yearIncomes.length === 0) { toast.info(l ? 'No hay ingresos' : 'No income'); return; }
        const totalInc = yearIncomes.reduce((s, i) => s + i.amount, 0);
        const typeMap: Record<string, number> = {};
        yearIncomes.forEach(i => { typeMap[i.income_type || 'Other'] = (typeMap[i.income_type || 'Other'] || 0) + i.amount; });
        setPreviewData({
          type: 'income_summary', title, color,
          kpis: [
            { label: l ? 'Total Ingresos' : 'Total Income', value: fc(totalInc), accent: true },
            { label: l ? 'Registros' : 'Records', value: String(yearIncomes.length) },
          ],
          headers: [l ? 'Tipo' : 'Type', l ? 'Monto' : 'Amount'],
          rows: Object.entries(typeMap).sort((a, b) => b[1] - a[1]).map(([type, amt]) => [type, fc(amt)]),
          footer: [l ? 'Total' : 'Total', fc(totalInc)],
        });
        break;
      }
      case 'mileage': {
        const trips = mileageData || [];
        if (trips.length === 0) { toast.info(l ? 'No hay viajes' : 'No trips'); return; }
        const sorted = [...trips].sort((a, b) => a.date.localeCompare(b.date));
        let runKm = 0;
        const rows = sorted.slice(0, 15).map(t => {
          const km = parseFloat(t.kilometers.toString());
          const ded = calculateMileageDeductionByCountry(km, runKm, currentCountry, selectedYear);
          runKm += km;
          return [t.date, t.route.replace('[SAMPLE] ', ''), `${km.toFixed(1)} km`, t.client?.name?.replace('[SAMPLE] ', '') || '-', ded ? fc(ded.deductible) : '-'];
        });
        setPreviewData({
          type: 'mileage', title, color,
          kpis: [
            { label: l ? 'Viajes' : 'Trips', value: String(trips.length) },
            { label: 'Km', value: `${mileageSummary?.totalKilometers.toFixed(0) || '0'}` },
            { label: l ? 'Deducción' : 'Deduction', value: mileageSummary ? fc(mileageSummary.totalDeductibleAmount) : '-', accent: true },
          ],
          headers: [l ? 'Fecha' : 'Date', l ? 'Ruta' : 'Route', 'Km', l ? 'Cliente' : 'Client', l ? 'Deducción' : 'Deduction'],
          rows,
          footer: trips.length > 15 ? [`... ${l ? 'y' : 'and'} ${trips.length - 15} ${l ? 'más' : 'more'}`, '', '', '', ''] : undefined,
        });
        break;
      }
      case 'reimbursement': {
        const reimbursable = (expenses || []).filter(e => e.client_id && (e.reimbursement_type === 'client_reimbursable' || e.status === 'pending'));
        if (reimbursable.length === 0) { toast.info(l ? 'No hay gastos reembolsables' : 'No reimbursable expenses'); return; }
        const totalReimb = reimbursable.reduce((s, e) => s + Number(e.amount), 0);
        // Group by client
        const clientMap: Record<string, { name: string; total: number; count: number }> = {};
        reimbursable.forEach(e => {
          const cid = e.client_id || 'no-client';
          const cname = (e as any).client?.name || (e as any).clients?.name || cid;
          if (!clientMap[cid]) clientMap[cid] = { name: cname, total: 0, count: 0 };
          clientMap[cid].total += Number(e.amount);
          clientMap[cid].count += 1;
        });
        setPreviewData({
          type: 'reimbursement', title, color,
          kpis: [
            { label: l ? 'Total Reembolsable' : 'Total Reimbursable', value: fc(totalReimb), accent: true },
            { label: l ? 'Gastos' : 'Expenses', value: String(reimbursable.length) },
            { label: l ? 'Clientes' : 'Clients', value: String(Object.keys(clientMap).length) },
          ],
          headers: [l ? 'Cliente' : 'Client', l ? 'Gastos' : 'Expenses', l ? 'Total' : 'Total'],
          rows: Object.values(clientMap).sort((a, b) => b.total - a.total).map(c => [c.name, String(c.count), fc(c.total)]),
          footer: [l ? 'Total' : 'Total', String(reimbursable.length), fc(totalReimb)],
        });
        break;
      }
    }
  };

  const handleExport = async (reportId: string, format: 'pdf' | 'excel') => {
    const key = `${reportId}-${format}`;
    setExporting(key);
    try {
      switch (reportId) {
        case 'pnl': {
          const yearIncomes = (incomes || []).filter(i => new Date(i.date).getFullYear() === selectedYear);
          const yearExpenses = expenses || [];
          const pnlData = {
            year: selectedYear,
            language: l ? 'es' as const : 'en' as const,
            userName: profile?.full_name || undefined,
            businessName: profile?.business_name || undefined,
            incomes: yearIncomes.map(i => ({ amount: i.amount, date: i.date, income_type: i.income_type, source: i.source, description: i.description })),
            expenses: yearExpenses.map(e => ({ amount: Number(e.amount), date: e.date, category: e.category, vendor: e.vendor })),
          };
          if (format === 'excel') {
            const { exportPnLToExcel } = await import('@/lib/export/pnl-export');
            await exportPnLToExcel(pnlData);
          } else {
            const { exportPnLToPDF } = await import('@/lib/export/pnl-export');
            exportPnLToPDF(pnlData);
          }
          break;
        }
        case 'expenses': {
          if (format === 'pdf') {
            const { exportExpensesToPDF } = await import('@/lib/export/pdf-export');
            exportExpensesToPDF(expenses || [], { language: l ? 'es' : 'en', year: selectedYear, userName: profile?.full_name, businessName: profile?.business_name });
          } else {
            const { exportExpenses } = await import('@/lib/export/expense-export');
            await exportExpenses(expenses || [], { format: 'xlsx', year: selectedYear, language: l ? 'es' : 'en', userName: profile?.full_name, businessName: profile?.business_name });
          }
          break;
        }
        case 'budget': {
          if (format === 'pdf') {
            await exportBudgetPDF(l, fc, plan);
          } else {
            await exportBudgetExcel(l, plan);
          }
          break;
        }
        case 'bills': {
          const activeBills = bills?.filter(b => b.status === 'active') || [];
          if (activeBills.length === 0) { toast.info(l ? 'No hay pagos para exportar' : 'No bills to export'); setExporting(null); return; }
          if (format === 'pdf') {
            await exportBillsPDF(l, activeBills, fc);
          } else {
            await exportBillsExcel(l, activeBills, payments || [], bills || []);
          }
          break;
        }
        case 'tax': {
          if (format === 'pdf') {
            const { exportT2125ToPDF } = await import('@/lib/export/pdf-export');
            exportT2125ToPDF(expenses || [], selectedYear, { language: l ? 'es' : 'en', year: selectedYear, userName: profile?.full_name, businessName: profile?.business_name, country: currentCountry });
          } else {
            const { exportT2125Report } = await import('@/lib/export/t2125-export');
            await exportT2125Report(expenses || [], selectedYear);
          }
          break;
        }
        case 'income_summary': {
          if (format === 'pdf') {
            await exportIncomeSummaryPDF(l, incomes || [], selectedYear, fc, profile?.full_name, profile?.business_name);
          } else {
            await exportIncomeSummaryExcel(l, incomes || [], selectedYear);
          }
          break;
        }
        case 'reimbursement': {
          const reimbursable = (expenses || []).filter(e => e.client_id && (e.reimbursement_type === 'client_reimbursable' || e.status === 'pending'));
          if (reimbursable.length === 0) { toast.info(l ? 'No hay gastos' : 'No expenses'); setExporting(null); return; }
          if (format === 'pdf') {
            await exportReimbursementPDF(l, reimbursable, selectedYear, fc, profile?.full_name, profile?.business_name);
          } else {
            await exportReimbursementExcel(l, reimbursable, selectedYear);
          }
          break;
        }
        case 'mileage': {
          const trips = mileageData || [];
          if (trips.length === 0) { toast.info(l ? 'No hay viajes para exportar' : 'No trips to export'); setExporting(null); return; }
          if (format === 'pdf') {
            await exportMileagePDF(l, trips, selectedYear, currentCountry, fc, profile?.full_name, profile?.business_name);
          } else {
            await exportMileageExcel(l, trips, selectedYear, currentCountry, mileageSummary);
          }
          break;
        }
      }
      toast.success(l ? `${format.toUpperCase()} exportado` : `${format.toUpperCase()} exported`);
    } catch (err) {
      console.error(err);
      toast.error(l ? 'Error al exportar' : 'Export failed');
    }
    setExporting(null);
  };

  const STAT_CARDS = [
    { label: l ? 'Gastos' : 'Expenses', value: expenses?.length || 0, icon: '📊', gradient: 'from-blue-500/20 to-blue-600/5 dark:from-blue-500/10 dark:to-blue-600/5', iconBg: 'bg-blue-500/20', ring: 'ring-blue-500/20' },
    { label: l ? 'Ingresos' : 'Incomes', value: yearIncomes.length, icon: '💰', gradient: 'from-emerald-500/20 to-emerald-600/5 dark:from-emerald-500/10 dark:to-emerald-600/5', iconBg: 'bg-emerald-500/20', ring: 'ring-emerald-500/20' },
    { label: l ? 'Pagos Fijos' : 'Bills', value: activeBills.length, icon: '🔄', gradient: 'from-violet-500/20 to-violet-600/5 dark:from-violet-500/10 dark:to-violet-600/5', iconBg: 'bg-violet-500/20', ring: 'ring-violet-500/20' },
    { label: l ? 'Reportes' : 'Reports', value: REPORT_CARDS.length, icon: '📋', gradient: 'from-amber-500/20 to-amber-600/5 dark:from-amber-500/10 dark:to-amber-600/5', iconBg: 'bg-amber-500/20', ring: 'ring-amber-500/20' },
  ];

  return (
    <div className="container mx-auto max-w-5xl py-6 px-4 space-y-6">
      <PageHeader
        title={l ? 'Centro de Reportes' : 'Reports Center'}
        description={l ? 'Genera y descarga reportes profesionales de tu actividad financiera.' : 'Generate and download professional reports of your financial activity.'}
      >
        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Stat Cards - 3D Candy Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CARDS.map((stat, i) => (
          <div
            key={i}
            className={`relative bg-gradient-to-br ${stat.gradient} border rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ring-1 ${stat.ring}`}
          >
            <div className={`${stat.iconBg} rounded-full w-10 h-10 flex items-center justify-center text-xl shadow-inner`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report Cards - Colored 3D Candy */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_CARDS.map(card => {
          const cm = COLOR_MAP[card.color] || COLOR_MAP.blue;
          return (
            <Card
              key={card.id}
              className={`border-l-4 ${cm.border} hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 overflow-hidden`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`${cm.icon} rounded-full w-9 h-9 flex items-center justify-center shadow-inner`}>
                      {card.icon}
                    </div>
                    <CardTitle className="text-sm font-bold leading-tight">
                      {l ? card.titleEs : card.titleEn}
                    </CardTitle>
                  </div>
                  {card.badge && (
                    <Badge variant={card.badgeVariant || 'default'} className="text-[10px] px-1.5 py-0 shrink-0">
                      {l ? card.badge.es : card.badge.en}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-1.5">
                  {l ? card.descEs : card.descEn}
                </CardDescription>
                {getPreview(card.id) && (
                  <p className={`text-xs font-semibold mt-2 ${cm.text} ${cm.bg} rounded-lg px-2.5 py-1.5`}>
                    {getPreview(card.id)}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  {card.formats.includes('pdf') && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1 px-2.5 ${cm.text} hover:${cm.bg}`}
                        onClick={() => handlePreview(card.id)}
                        disabled={!!exporting}
                        title={l ? 'Vista previa' : 'Preview'}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 flex-1 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleExport(card.id, 'pdf')}
                        disabled={!!exporting}
                      >
                        {exporting === `${card.id}-pdf` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                        PDF
                      </Button>
                    </>
                  )}
                  {/* Preview button for income_summary (no PDF) */}
                  {!card.formats.includes('pdf') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-1 px-2.5 ${cm.text}`}
                      onClick={() => handlePreview(card.id)}
                      disabled={!!exporting}
                      title={l ? 'Vista previa' : 'Preview'}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {card.formats.includes('excel') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 flex-1 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      onClick={() => handleExport(card.id, 'excel')}
                      disabled={!!exporting}
                    >
                      {exporting === `${card.id}-excel` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                      Excel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* HTML Preview Dialog */}
      <Dialog open={!!previewData} onOpenChange={(open) => { if (!open) setPreviewData(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          {previewData && (() => {
            const cm = COLOR_MAP[previewData.color] || COLOR_MAP.blue;
            return (
              <>
                <div className={`${cm.bg} px-6 py-4 border-b`}>
                  <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${cm.text} text-lg`}>
                      <Eye className="h-5 w-5" />
                      {previewData.title} — {selectedYear}
                    </DialogTitle>
                  </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* KPI Cards */}
                  {previewData.kpis && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {previewData.kpis.map((kpi, i) => (
                        <div key={i} className={`${cm.light} rounded-xl p-3 text-center border shadow-sm`}>
                          <p className="text-[11px] text-muted-foreground font-medium mb-1">{kpi.label}</p>
                          <p className={`text-lg font-bold ${kpi.accent ? cm.text : 'text-foreground'}`}>{kpi.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Data Table */}
                  <div className="rounded-xl border overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={cm.bg}>
                          {previewData.headers.map((h, i) => (
                            <th key={i} className={`px-4 py-2.5 text-left font-semibold ${cm.text} text-xs uppercase tracking-wide`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.rows.map((row, i) => (
                          <tr key={i} className={`border-t ${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/50 transition-colors`}>
                            {row.map((cell, j) => (
                              <td key={j} className={`px-4 py-2 ${j === row.length - 1 ? 'font-semibold text-right' : ''}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                        {previewData.rows.length === 0 && (
                          <tr><td colSpan={previewData.headers.length} className="px-4 py-8 text-center text-muted-foreground">{l ? 'Sin datos' : 'No data'}</td></tr>
                        )}
                      </tbody>
                      {previewData.footer && (
                        <tfoot>
                          <tr className={`border-t-2 ${cm.bg}`}>
                            {previewData.footer.map((cell, j) => (
                              <td key={j} className={`px-4 py-2.5 font-bold ${cm.text} ${j === previewData.footer!.length - 1 ? 'text-right' : ''}`}>{cell}</td>
                            ))}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                <div className="border-t px-6 py-3 flex justify-between items-center bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    {l ? '💡 Descarga el PDF o Excel para el reporte completo' : '💡 Download PDF or Excel for the full report'}
                  </p>
                  <div className="flex gap-2">
                    {REPORT_CARDS.find(c => c.id === previewData.type)?.formats.includes('pdf') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                        onClick={() => { setPreviewData(null); handleExport(previewData.type, 'pdf'); }}
                      >
                        <FileDown className="h-3.5 w-3.5 mr-1" /> PDF
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      onClick={() => { setPreviewData(null); handleExport(previewData.type, 'excel'); }}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <p className="text-xs text-center text-muted-foreground">
        {l
          ? '💡 Los reportes PDF son ideales para compartir con tu contador. Los Excel permiten edición y análisis adicional.'
          : '💡 PDF reports are ideal for sharing with your accountant. Excel allows additional editing and analysis.'}
      </p>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-card border rounded-lg px-3 py-2.5 flex items-center gap-2.5">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

async function exportBudgetPDF(l: boolean, fc: (n: number) => string, plan: any) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  const now = new Date();
  doc.setFontSize(18);
  doc.text(l ? 'Plan de Presupuesto Mensual' : 'Monthly Budget Plan', 14, 20);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(format(now, 'MMMM yyyy', { locale: l ? es : enUS }), 14, 28);
  doc.setTextColor(0);
  autoTable(doc, {
    startY: 34,
    head: [[l ? 'Concepto' : 'Item', l ? 'Monto' : 'Amount']],
    body: [
      [l ? 'Ingresos' : 'Income', fc(plan.totalIncome)],
      [l ? 'Pagos Fijos' : 'Fixed', fc(plan.totalFixed)],
      [l ? 'Gastado' : 'Spent', fc(plan.totalSpent)],
      [l ? 'Disponible' : 'Available', fc(plan.freeMoney - plan.totalSpent)],
      [l ? 'Presupuesto Diario' : 'Daily Budget', fc(plan.dailyBudget)],
      [l ? 'Ahorro Proyectado' : 'Projected Savings', fc(plan.projectedSavings)],
      [l ? 'Tasa de Ahorro' : 'Savings Rate', `${plan.savingsRate.toFixed(1)}%`],
      [l ? 'Salud Financiera' : 'Financial Health', `${plan.healthScore}/100`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
  });
  const ph = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`EvoFinz — ${format(now, 'PPp', { locale: l ? es : enUS })}`, 14, ph - 10);
  doc.save(`budget-${format(now, 'yyyy-MM')}.pdf`);
}

async function exportBudgetExcel(l: boolean, plan: any) {
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(l ? 'Resumen' : 'Summary');
  ws.columns = [{ width: 25 }, { width: 20 }];
  const now = new Date();
  ws.addRow([l ? 'Plan de Presupuesto' : 'Budget Plan', format(now, 'MMMM yyyy', { locale: l ? es : enUS })]).font = { bold: true, size: 14 };
  ws.addRow([]);
  ws.addRow([l ? 'Concepto' : 'Item', l ? 'Monto' : 'Amount']).font = { bold: true };
  ws.addRow([l ? 'Ingresos' : 'Income', plan.totalIncome]);
  ws.addRow([l ? 'Pagos Fijos' : 'Fixed', plan.totalFixed]);
  ws.addRow([l ? 'Gastado' : 'Spent', plan.totalSpent]);
  ws.addRow([l ? 'Disponible' : 'Available', plan.freeMoney - plan.totalSpent]);
  ws.addRow([l ? 'Presupuesto Diario' : 'Daily Budget', plan.dailyBudget]);
  ws.addRow([l ? 'Ahorro Proyectado' : 'Savings', plan.projectedSavings]);
  ws.addRow([l ? 'Tasa de Ahorro' : 'Savings Rate', plan.savingsRate / 100]);
  ws.addRow([l ? 'Salud Financiera' : 'Health', plan.healthScore]);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `budget-${format(now, 'yyyy-MM')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportBillsPDF(l: boolean, activeBills: any[], fc: (n: number) => string) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  const now = new Date();
  const lang = l ? 'es' : 'en';
  doc.setFontSize(18);
  doc.text(l ? 'Pagos Recurrentes' : 'Recurring Bills', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`EvoFinz — ${format(now, 'PPp', { locale: l ? es : enUS })}`, 14, 27);
  doc.setTextColor(0);
  autoTable(doc, {
    startY: 34,
    head: [[l ? 'Nombre' : 'Name', l ? 'Categoría' : 'Category', l ? 'Monto' : 'Amount', l ? 'Frecuencia' : 'Frequency', l ? 'Próximo' : 'Next Due']],
    body: activeBills.map(b => [
      b.name,
      getBillCategoryLabel(b.category, lang),
      fc(b.amount),
      getBillFrequencyLabel(b.frequency, lang),
      format(new Date(b.next_due_date), 'dd MMM yyyy', { locale: l ? es : enUS }),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  });
  const ph = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`EvoFinz — ${format(now, 'PPp', { locale: l ? es : enUS })}`, 14, ph - 10);
  doc.save(`bills-${format(now, 'yyyy-MM-dd')}.pdf`);
}

async function exportBillsExcel(l: boolean, activeBills: any[], payments: any[], allBills: any[]) {
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const lang = l ? 'es' : 'en';
  const ws = wb.addWorksheet(l ? 'Pagos Recurrentes' : 'Recurring Bills');
  ws.columns = [
    { header: l ? 'Nombre' : 'Name', width: 25 },
    { header: l ? 'Categoría' : 'Category', width: 18 },
    { header: l ? 'Monto' : 'Amount', width: 14 },
    { header: l ? 'Frecuencia' : 'Frequency', width: 14 },
    { header: l ? 'Próximo Vencimiento' : 'Next Due', width: 16 },
    { header: l ? 'Método' : 'Method', width: 16 },
    { header: l ? 'Auto-pago' : 'Auto-pay', width: 10 },
  ];
  ws.getRow(1).font = { bold: true };
  activeBills.forEach(b => {
    ws.addRow([b.name, getBillCategoryLabel(b.category, lang), b.amount, getBillFrequencyLabel(b.frequency, lang), b.next_due_date, getPaymentMethodLabel(b.payment_method_type, lang), b.auto_pay ? (l ? 'Sí' : 'Yes') : 'No']);
  });
  if (payments.length > 0) {
    const ws2 = wb.addWorksheet(l ? 'Historial' : 'History');
    ws2.columns = [{ header: l ? 'Pago' : 'Bill', width: 25 }, { header: l ? 'Fecha' : 'Date', width: 14 }, { header: l ? 'Monto' : 'Amount', width: 14 }];
    ws2.getRow(1).font = { bold: true };
    const billMap = new Map(allBills.map(b => [b.id, b.name]));
    payments.forEach(p => { ws2.addRow([billMap.get(p.bill_id) || p.bill_id, p.paid_date, p.amount_paid]); });
  }
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bills-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportIncomeSummaryExcel(l: boolean, incomes: any[], year: number) {
  const yearIncomes = incomes.filter(i => new Date(i.date).getFullYear() === year);
  if (yearIncomes.length === 0) { toast.info(l ? 'No hay ingresos para exportar' : 'No income to export'); return; }
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(l ? 'Ingresos' : 'Income');
  ws.columns = [
    { header: l ? 'Fecha' : 'Date', width: 14 },
    { header: l ? 'Tipo' : 'Type', width: 18 },
    { header: l ? 'Fuente' : 'Source', width: 20 },
    { header: l ? 'Descripción' : 'Description', width: 30 },
    { header: l ? 'Monto' : 'Amount', width: 14 },
    { header: l ? 'Moneda' : 'Currency', width: 8 },
  ];
  ws.getRow(1).font = { bold: true };
  yearIncomes.sort((a: any, b: any) => a.date.localeCompare(b.date)).forEach((inc: any) => {
    ws.addRow([inc.date, inc.income_type, inc.source || '', inc.description || '', inc.amount, inc.currency || 'CAD']);
  });
  ws.addRow([]);
  ws.addRow([l ? 'Total' : 'Total', '', '', '', yearIncomes.reduce((s: number, i: any) => s + i.amount, 0)]).font = { bold: true };
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `income-${year}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportMileagePDF(
  l: boolean, trips: MileageWithClient[], year: number,
  country: any, fc: (n: number) => string, userName?: string | null, businessName?: string | null
) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape');
  const now = new Date();

  doc.setFontSize(18);
  doc.text(l ? 'Reporte de Kilometraje' : 'Mileage Report', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  const subtitle = [businessName, userName].filter(Boolean).join(' — ');
  doc.text(`${subtitle ? subtitle + ' · ' : ''}${year}`, 14, 27);
  doc.setTextColor(0);

  const sorted = [...trips].sort((a, b) => a.date.localeCompare(b.date));
  let runningKm = 0;

  const body = sorted.map(t => {
    const km = parseFloat(t.kilometers.toString());
    const ded = calculateMileageDeductionByCountry(km, runningKm, country, year);
    runningKm += km;
    return [
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.route.replace('[SAMPLE] ', ''),
      `${km.toFixed(1)} km`,
      t.client?.name?.replace('[SAMPLE] ', '') || '-',
      t.purpose || '-',
      ded ? fc(ded.deductible) : '-',
    ];
  });

  const totalKm = sorted.reduce((s, t) => s + parseFloat(t.kilometers.toString()), 0);

  autoTable(doc, {
    startY: 34,
    head: [[
      l ? 'Fecha' : 'Date', l ? 'Ruta' : 'Route', 'Km',
      l ? 'Cliente' : 'Client', l ? 'Propósito' : 'Purpose',
      l ? 'Deducción' : 'Deduction',
    ]],
    body,
    foot: [[l ? 'Total' : 'Total', '', `${totalKm.toFixed(1)} km`, '', '', '']],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: { 1: { cellWidth: 60 }, 4: { cellWidth: 40 } },
  });

  const ph = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`EvoFinz — ${format(now, 'PPp', { locale: l ? es : enUS })}`, 14, ph - 10);
  doc.save(`mileage-${year}.pdf`);
}

async function exportMileageExcel(
  l: boolean, trips: MileageWithClient[], year: number, country: any, summary: any
) {
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(l ? 'Viajes' : 'Trips');

  ws.columns = [
    { header: l ? 'Fecha' : 'Date', width: 12 },
    { header: l ? 'Ruta' : 'Route', width: 35 },
    { header: 'Km', width: 10 },
    { header: l ? 'Cliente' : 'Client', width: 20 },
    { header: l ? 'Propósito' : 'Purpose', width: 25 },
    { header: l ? 'Deducción' : 'Deduction', width: 14 },
  ];
  ws.getRow(1).font = { bold: true };

  const sorted = [...trips].sort((a, b) => a.date.localeCompare(b.date));
  let runningKm = 0;

  sorted.forEach(t => {
    const km = parseFloat(t.kilometers.toString());
    const ded = calculateMileageDeductionByCountry(km, runningKm, country, year);
    runningKm += km;
    ws.addRow([
      t.date, t.route.replace('[SAMPLE] ', ''), km,
      t.client?.name?.replace('[SAMPLE] ', '') || '', t.purpose || '',
      ded?.deductible || 0,
    ]);
  });

  ws.addRow([]);
  ws.addRow([l ? 'Total' : 'Total', '', runningKm, '', '', summary?.totalDeductibleAmount || 0]).font = { bold: true };

  if (summary) {
    const ws2 = wb.addWorksheet(l ? 'Resumen' : 'Summary');
    ws2.columns = [{ width: 25 }, { width: 18 }];
    ws2.addRow([l ? 'Resumen de Kilometraje' : 'Mileage Summary', year]).font = { bold: true, size: 14 };
    ws2.addRow([]);
    ws2.addRow([l ? 'Total Viajes' : 'Total Trips', summary.totalTrips]);
    ws2.addRow([l ? 'Total Km' : 'Total Km', summary.totalKilometers]);
    ws2.addRow([l ? 'Deducción Total' : 'Total Deduction', summary.totalDeductibleAmount]);
    if (summary.country === 'CA') {
      ws2.addRow([l ? 'ITC Reclamable' : 'ITC Claimable', summary.itcClaimable]);
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mileage-${year}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportIncomeSummaryPDF(l: boolean, incomes: any[], year: number, fc: (n: number) => string, userName?: string | null, businessName?: string | null) {
  const yearIncomes = incomes.filter((i: any) => new Date(i.date).getFullYear() === year);
  if (yearIncomes.length === 0) { toast.info(l ? 'No hay ingresos para exportar' : 'No income to export'); return; }
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  const now = new Date();
  doc.setFontSize(18);
  doc.text(l ? 'Resumen de Ingresos' : 'Income Summary', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  const subtitle = [businessName, userName].filter(Boolean).join(' — ');
  doc.text(`${subtitle ? subtitle + ' · ' : ''}${year}`, 14, 27);
  doc.setTextColor(0);
  const totalInc = yearIncomes.reduce((s: number, i: any) => s + i.amount, 0);
  doc.setFontSize(12);
  doc.text(`${l ? 'Total' : 'Total'}: ${fc(totalInc)}`, 14, 35);
  autoTable(doc, {
    startY: 42,
    head: [[l ? 'Fecha' : 'Date', l ? 'Tipo' : 'Type', l ? 'Fuente' : 'Source', l ? 'Descripción' : 'Description', l ? 'Monto' : 'Amount']],
    body: yearIncomes.sort((a: any, b: any) => a.date.localeCompare(b.date)).map((inc: any) => [
      inc.date, inc.income_type || '-', inc.source || '-', inc.description || '-', fc(inc.amount),
    ]),
    foot: [[l ? 'Total' : 'Total', '', '', '', fc(totalInc)]],
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
    styles: { fontSize: 8 },
  });
  const ph = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`EvoFinz — ${format(now, 'PPp', { locale: l ? es : enUS })}`, 14, ph - 10);
  doc.save(`income-${year}.pdf`);
}

async function exportReimbursementPDF(l: boolean, expenses: any[], year: number, fc: (n: number) => string, userName?: string | null, businessName?: string | null) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  const now = new Date();
  doc.setFontSize(18);
  doc.text(l ? 'Rendición de Gastos por Cliente' : 'Client Reimbursement Report', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  const subtitle = [businessName, userName].filter(Boolean).join(' — ');
  doc.text(`${subtitle ? subtitle + ' · ' : ''}${year}`, 14, 27);
  doc.setTextColor(0);
  const total = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  doc.setFontSize(12);
  doc.text(`${l ? 'Total Reembolsable' : 'Total Reimbursable'}: ${fc(total)}`, 14, 35);
  autoTable(doc, {
    startY: 42,
    head: [[l ? 'Fecha' : 'Date', l ? 'Proveedor' : 'Vendor', l ? 'Categoría' : 'Category', l ? 'Descripción' : 'Description', l ? 'Monto' : 'Amount']],
    body: expenses.map((e: any) => [e.date, e.vendor || '-', e.category || '-', e.description || '-', fc(Number(e.amount))]),
    foot: [[l ? 'Total' : 'Total', '', '', '', fc(total)]],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 8 },
  });
  const ph = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`EvoFinz — ${format(now, 'PPp', { locale: l ? es : enUS })}`, 14, ph - 10);
  doc.save(`reimbursement-${year}.pdf`);
}

async function exportReimbursementExcel(l: boolean, expenses: any[], year: number) {
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(l ? 'Rendición' : 'Reimbursement');
  ws.columns = [
    { header: l ? 'Fecha' : 'Date', width: 14 },
    { header: l ? 'Proveedor' : 'Vendor', width: 20 },
    { header: l ? 'Categoría' : 'Category', width: 18 },
    { header: l ? 'Descripción' : 'Description', width: 30 },
    { header: l ? 'Monto' : 'Amount', width: 14 },
    { header: l ? 'Moneda' : 'Currency', width: 8 },
  ];
  ws.getRow(1).font = { bold: true };
  expenses.forEach((e: any) => {
    ws.addRow([e.date, e.vendor || '', e.category || '', e.description || '', Number(e.amount), e.currency || 'CAD']);
  });
  ws.addRow([]);
  ws.addRow([l ? 'Total' : 'Total', '', '', '', expenses.reduce((s: number, e: any) => s + Number(e.amount), 0)]).font = { bold: true };
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reimbursement-${year}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { useSearchParams as _useSP } from 'react-router-dom';
import { Layout as _Layout } from '@/components/Layout';
import { SimpleReports } from '@/components/simple/SimpleReports';

export default function Reports() {
  const { uiMode } = useDisplayPreferences();
  const [sp] = _useSP();
  if (uiMode === 'simple' && sp.get('advanced') !== '1') {
    return (
      <_Layout>
        <div className="page-container section-gap">
          <SimpleReports />
        </div>
      </_Layout>
    );
  }
  return <ReportsAdvanced />;
}
