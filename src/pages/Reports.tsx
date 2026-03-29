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
import { FileDown, FileSpreadsheet, FileText, TrendingUp, PiggyBank, CalendarCheck, Receipt, Loader2, DollarSign, BarChart3, Car } from 'lucide-react';
import { toast } from 'sonner';
import { startOfYear, endOfYear, format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { getBillCategoryLabel, getBillFrequencyLabel, getPaymentMethodLabel } from '@/lib/constants/bill-categories';

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
}

const REPORT_CARDS: ReportCard[] = [
  {
    id: 'pnl',
    icon: <TrendingUp className="h-6 w-6" />,
    titleEs: 'Estado de Resultados (P&L)',
    titleEn: 'Profit & Loss Statement',
    descEs: 'Ingresos vs gastos con desglose mensual por categoría. El reporte financiero más importante.',
    descEn: 'Revenue vs expenses with monthly breakdown by category. The most important financial report.',
    formats: ['pdf', 'excel'],
    badge: { es: 'Nuevo', en: 'New' },
    badgeVariant: 'default',
  },
  {
    id: 'expenses',
    icon: <Receipt className="h-6 w-6" />,
    titleEs: 'Reporte de Gastos',
    titleEn: 'Expense Report',
    descEs: 'Todos tus gastos con categorías, clientes y estado de deducibilidad.',
    descEn: 'All your expenses with categories, clients, and deductibility status.',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'budget',
    icon: <PiggyBank className="h-6 w-6" />,
    titleEs: 'Plan de Presupuesto',
    titleEn: 'Budget Plan',
    descEs: 'Resumen del mes actual: ingresos, gastos fijos, disponible, ahorro proyectado.',
    descEn: 'Current month summary: income, fixed payments, available, projected savings.',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'bills',
    icon: <CalendarCheck className="h-6 w-6" />,
    titleEs: 'Pagos Recurrentes',
    titleEn: 'Recurring Bills',
    descEs: 'Lista de pagos fijos activos con frecuencia, método de pago y próximo vencimiento.',
    descEn: 'Active fixed payments with frequency, payment method, and next due date.',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'tax',
    icon: <DollarSign className="h-6 w-6" />,
    titleEs: 'Reporte Fiscal / T2125',
    titleEn: 'Tax Report / T2125',
    descEs: 'Reporte de gastos de negocio formateado para CRA con líneas T2125.',
    descEn: 'Business expenses report formatted for CRA with T2125 lines.',
    formats: ['pdf', 'excel'],
    badge: { es: 'Contador', en: 'Accountant' },
    badgeVariant: 'secondary',
  },
  {
    id: 'income_summary',
    icon: <BarChart3 className="h-6 w-6" />,
    titleEs: 'Resumen de Ingresos',
    titleEn: 'Income Summary',
    descEs: 'Todos los ingresos del año por tipo, fuente y cliente.',
    descEn: 'All income for the year by type, source, and client.',
    formats: ['excel'],
  },
  {
    id: 'mileage',
    icon: <Car className="h-6 w-6" />,
    titleEs: 'Reporte de Kilometraje',
    titleEn: 'Mileage Report',
    descEs: 'Viajes de negocio con km recorridos, rutas, clientes y deducciones fiscales.',
    descEn: 'Business trips with km driven, routes, clients, and tax deductions.',
    formats: ['pdf', 'excel'],
  },
];

export default function Reports() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [exporting, setExporting] = useState<string | null>(null);

  const yearStart = startOfYear(new Date(selectedYear, 0));
  const yearEnd = endOfYear(new Date(selectedYear, 0));

  const { data: expenses } = useExpenses({ dateRange: { start: yearStart, end: yearEnd } });
  const { data: incomes } = useIncome();
  const { data: bills } = useRecurringBills();
  const { data: payments } = useBillPayments();
  const plan = useMonthlyPlanData();

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
            exportT2125ToPDF(expenses || [], selectedYear, { language: l ? 'es' : 'en', year: selectedYear, userName: profile?.full_name, businessName: profile?.business_name });
          } else {
            const { exportT2125Report } = await import('@/lib/export/t2125-export');
            await exportT2125Report(expenses || [], selectedYear);
          }
          break;
        }
        case 'income_summary': {
          await exportIncomeSummaryExcel(l, incomes || [], selectedYear);
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

  return (
    <div className="container mx-auto max-w-5xl py-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {l ? 'Centro de Reportes' : 'Reports Center'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {l ? 'Genera y descarga reportes profesionales de tu actividad financiera.' : 'Generate and download professional reports of your financial activity.'}
          </p>
        </div>
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
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={l ? 'Gastos' : 'Expenses'} value={expenses?.length || 0} icon="📊" />
        <StatCard label={l ? 'Ingresos' : 'Incomes'} value={(incomes || []).filter(i => new Date(i.date).getFullYear() === selectedYear).length} icon="💰" />
        <StatCard label={l ? 'Pagos Fijos' : 'Bills'} value={bills?.filter(b => b.status === 'active')?.length || 0} icon="🔄" />
        <StatCard label={l ? 'Reportes' : 'Reports'} value={REPORT_CARDS.length} icon="📋" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_CARDS.map(card => (
          <Card key={card.id} className="hover:shadow-md transition-shadow border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 text-primary">
                  {card.icon}
                  <CardTitle className="text-sm font-semibold leading-tight">
                    {l ? card.titleEs : card.titleEn}
                  </CardTitle>
                </div>
                {card.badge && (
                  <Badge variant={card.badgeVariant || 'default'} className="text-[10px] px-1.5 py-0">
                    {l ? card.badge.es : card.badge.en}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-1.5">
                {l ? card.descEs : card.descEn}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                {card.formats.includes('pdf') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => handleExport(card.id, 'pdf')}
                    disabled={!!exporting}
                  >
                    {exporting === `${card.id}-pdf` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                    PDF
                  </Button>
                )}
                {card.formats.includes('excel') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 flex-1"
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
        ))}
      </div>

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
