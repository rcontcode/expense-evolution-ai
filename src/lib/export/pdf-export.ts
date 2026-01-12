import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ExpenseWithRelations } from '@/types/expense.types';
import { TAX_DEDUCTION_RULES } from '@/hooks/data/useTaxCalculations';
import { T2125_LINES, calculateT2125Totals } from './t2125-export';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  meals: 'Comidas / Meals',
  travel: 'Viajes / Travel',
  equipment: 'Equipo / Equipment',
  software: 'Software',
  office_supplies: 'Suministros / Supplies',
  utilities: 'Servicios / Utilities',
  professional_services: 'Serv. Prof. / Prof. Services',
  home_office: 'Oficina Casa / Home Office',
  mileage: 'Kilometraje / Mileage',
  other: 'Otros / Other',
  fuel: 'Combustible / Fuel',
  materials: 'Materiales / Materials',
  tools: 'Herramientas / Tools',
  advertising: 'Publicidad / Advertising',
  insurance: 'Seguros / Insurance',
  communications: 'Comunicaciones / Communications',
  subscriptions: 'Suscripciones / Subscriptions',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  classified: 'Clasificado',
  deductible: 'Deducible',
  non_deductible: 'No Deducible',
  reimbursable: 'Reembolsable',
  rejected: 'Rechazado',
};

interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  year?: number;
  language?: 'es' | 'en';
  includeCharts?: boolean;
}

// Helper to format currency
const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Calculate deduction for tax purposes
function calculateDeduction(amount: number, category: string | null, status: string | null): { deductible: number; nonDeductible: number; rate: number } {
  if (status === 'reimbursable') {
    return { deductible: 0, nonDeductible: 0, rate: 0 };
  }
  
  if (status !== 'deductible') {
    return { deductible: 0, nonDeductible: amount, rate: 0 };
  }

  const rule = TAX_DEDUCTION_RULES.find(r => r.category === category);
  const rate = rule?.deductionRate || 1.0;
  const deductible = amount * rate;
  
  return { deductible, nonDeductible: amount - deductible, rate };
}

// Add header with logo/branding
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background
  doc.setFillColor(79, 70, 229); // Indigo
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 28);
  }
  
  // EvoFinz branding
  doc.setFontSize(10);
  doc.text('EvoFinz', pageWidth - 30, 18);
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
}

// Add footer with page numbers
function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, pageHeight - 10);
  doc.text('EvoFinz - Gestión Financiera Inteligente', pageWidth - 14, pageHeight - 10, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

// Export general expenses to PDF
export function exportExpensesToPDF(expenses: ExpenseWithRelations[], options: PDFExportOptions = {}): void {
  const doc = new jsPDF();
  const { title = 'REPORTE DE GASTOS', subtitle, year } = options;
  
  const filteredExpenses = year 
    ? expenses.filter(e => new Date(e.date).getFullYear() === year)
    : expenses;
  
  if (filteredExpenses.length === 0) {
    throw new Error('No hay gastos para exportar');
  }

  // Calculate summary
  let totalExpenses = 0;
  let totalDeductible = 0;
  let totalReimbursable = 0;
  let totalNonDeductible = 0;
  const categoryTotals: Record<string, { total: number; deductible: number; count: number }> = {};

  filteredExpenses.forEach(expense => {
    const amount = parseFloat(expense.amount?.toString() || '0');
    totalExpenses += amount;

    if (expense.status === 'reimbursable') {
      totalReimbursable += amount;
    } else if (expense.status === 'deductible') {
      const { deductible, nonDeductible } = calculateDeduction(amount, expense.category, expense.status);
      totalDeductible += deductible;
      totalNonDeductible += nonDeductible;

      const cat = expense.category || 'other';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { total: 0, deductible: 0, count: 0 };
      }
      categoryTotals[cat].total += amount;
      categoryTotals[cat].deductible += deductible;
      categoryTotals[cat].count += 1;
    } else {
      totalNonDeductible += amount;
    }
  });

  // Add header
  const fullSubtitle = subtitle || (year ? `Año Fiscal: ${year}` : `Período: Todos los años`);
  addHeader(doc, title, fullSubtitle);

  // Summary section
  let yPos = 45;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('RESUMEN EJECUTIVO', 14, yPos);
  
  // Summary boxes
  yPos += 10;
  const boxWidth = 42;
  const summaryData = [
    { label: 'Total Gastos', value: formatCurrency(totalExpenses), color: [59, 130, 246] as [number, number, number] },
    { label: 'Deducible', value: formatCurrency(totalDeductible), color: [16, 185, 129] as [number, number, number] },
    { label: 'Reembolsable', value: formatCurrency(totalReimbursable), color: [245, 158, 11] as [number, number, number] },
    { label: 'No Deducible', value: formatCurrency(totalNonDeductible), color: [239, 68, 68] as [number, number, number] },
  ];

  summaryData.forEach((item, idx) => {
    const x = 14 + (idx * (boxWidth + 4));
    doc.setFillColor(...item.color);
    doc.roundedRect(x, yPos, boxWidth, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(item.label, x + boxWidth / 2, yPos + 6, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x + boxWidth / 2, yPos + 14, { align: 'center' });
  });

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  // Category breakdown table
  yPos += 30;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Desglose por Categoría', 14, yPos);
  
  const categoryRows = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([cat, data]) => [
      CATEGORY_LABELS[cat] || cat,
      data.count.toString(),
      formatCurrency(data.total),
      formatCurrency(data.deductible),
      `${((data.deductible / data.total) * 100).toFixed(0)}%`,
    ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Categoría', 'Cant.', 'Total', 'Deducible', 'Tasa']],
    body: categoryRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 25, halign: 'center' },
    },
  });

  // Expenses detail table
  doc.addPage();
  addHeader(doc, 'DETALLE DE GASTOS', `${filteredExpenses.length} registros`);

  const expenseRows = filteredExpenses.map(e => {
    const amount = parseFloat(e.amount?.toString() || '0');
    return [
      e.date,
      (e.vendor || '').substring(0, 20),
      CATEGORY_LABELS[e.category || 'other'] || e.category || '',
      STATUS_LABELS[e.status || 'pending'] || e.status || '',
      formatCurrency(amount),
      e.client?.name?.substring(0, 15) || '',
    ];
  });

  autoTable(doc, {
    startY: 45,
    head: [['Fecha', 'Proveedor', 'Categoría', 'Estado', 'Monto', 'Cliente']],
    body: expenseRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 35 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 30 },
    },
    didDrawPage: (data) => {
      addHeader(doc, 'DETALLE DE GASTOS', `${filteredExpenses.length} registros`);
    },
  });

  // Add footers to all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  // Download
  const filename = year 
    ? `gastos_${year}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
    : `gastos_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  
  doc.save(filename);
}

// Export T2125 report to PDF
export function exportT2125ToPDF(expenses: ExpenseWithRelations[], year?: number): void {
  const doc = new jsPDF();
  
  const filteredExpenses = year 
    ? expenses.filter(e => new Date(e.date).getFullYear() === year)
    : expenses;
  
  const deductibleExpenses = filteredExpenses.filter(e => e.status === 'deductible');
  const lineTotals = calculateT2125Totals(filteredExpenses);
  
  const totalGross = lineTotals.reduce((sum, l) => sum + l.grossAmount, 0);
  const totalDeductible = lineTotals.reduce((sum, l) => sum + l.netDeductible, 0);

  // HST/GST calculations
  const HST_RATE = 0.13;
  const totalHstGst = totalGross - (totalGross / (1 + HST_RATE));
  const itcClaimable = totalDeductible - (totalDeductible / (1 + HST_RATE));

  // Header
  addHeader(doc, 'REPORTE T2125 - CRA', `Año Fiscal: ${year || 'Todos'}`);

  // Summary section
  let yPos = 45;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('RESUMEN DE GASTOS DE NEGOCIO', 14, yPos);
  
  // KPI boxes
  yPos += 10;
  const kpis = [
    { label: 'Total Bruto', value: formatCurrency(totalGross), color: [59, 130, 246] as [number, number, number] },
    { label: 'Total Deducible', value: formatCurrency(totalDeductible), color: [16, 185, 129] as [number, number, number] },
    { label: 'HST/GST Pagado', value: formatCurrency(totalHstGst), color: [245, 158, 11] as [number, number, number] },
    { label: 'ITC Reclamable', value: formatCurrency(itcClaimable), color: [139, 92, 246] as [number, number, number] },
  ];

  const boxWidth = 42;
  kpis.forEach((item, idx) => {
    const x = 14 + (idx * (boxWidth + 4));
    doc.setFillColor(...item.color);
    doc.roundedRect(x, yPos, boxWidth, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(item.label, x + boxWidth / 2, yPos + 6, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x + boxWidth / 2, yPos + 14, { align: 'center' });
  });

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  // T2125 Lines table
  yPos += 30;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Gastos por Línea T2125', 14, yPos);

  const lineRows = lineTotals.map(line => [
    line.line,
    line.nameEs.substring(0, 30),
    formatCurrency(line.grossAmount),
    `${(line.deductionRate * 100).toFixed(0)}%`,
    formatCurrency(line.netDeductible),
    line.expenseCount.toString(),
  ]);

  // Add totals row
  lineRows.push([
    'TOTAL',
    '',
    formatCurrency(totalGross),
    '',
    formatCurrency(totalDeductible),
    deductibleExpenses.length.toString(),
  ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Línea', 'Descripción', 'Monto Bruto', 'Tasa', 'Deducible', 'Cant.']],
    body: lineRows,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 60 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: (data) => {
      // Style the totals row
      if (data.row.index === lineRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [209, 250, 229];
      }
    },
  });

  // Notes section
  const notesY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('NOTAS IMPORTANTES', 14, notesY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  
  const notes = [
    '• Comidas y entretenimiento (Línea 8523) solo son 50% deducibles según CRA.',
    '• ITC calculado asumiendo HST 13% (Ontario). Ajustar según su provincia.',
    '• CCA requiere cálculo separado según la clase del activo.',
    '• Este reporte es solo para referencia. Consulte con un contador profesional.',
    '',
    'Referencias:',
    '• T2125: canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html',
  ];
  
  notes.forEach((note, idx) => {
    doc.text(note, 14, notesY + 7 + (idx * 5));
  });

  // Add footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  // Download
  const filename = `T2125_Report_${year || 'All'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

// Reimbursement Report PDF
interface ClientGroup {
  clientId: string;
  clientName: string;
  expenses: ExpenseWithRelations[];
  total: number;
  count: number;
  categories: Record<string, { count: number; total: number }>;
}

export function exportReimbursementToPDF(
  clientGroups: ClientGroup[],
  totalReimbursable: number,
  filteredExpenses: ExpenseWithRelations[],
  categoryTotals: Record<string, number>,
  dateRange?: { from?: Date; to?: Date }
): void {
  const doc = new jsPDF();
  
  const periodStr = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
    : 'Todos los períodos';

  // Header
  addHeader(doc, 'REPORTE DE REEMBOLSOS', periodStr);

  // Summary section
  let yPos = 45;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('RESUMEN EJECUTIVO', 14, yPos);
  
  // KPI boxes
  yPos += 10;
  const avgPerExpense = filteredExpenses.length > 0 ? totalReimbursable / filteredExpenses.length : 0;
  
  const kpis = [
    { label: 'Total a Facturar', value: formatCurrency(totalReimbursable), color: [16, 185, 129] as [number, number, number] },
    { label: 'Gastos Procesados', value: filteredExpenses.length.toString(), color: [59, 130, 246] as [number, number, number] },
    { label: 'Promedio por Gasto', value: formatCurrency(avgPerExpense), color: [245, 158, 11] as [number, number, number] },
    { label: 'Clientes Activos', value: clientGroups.length.toString(), color: [139, 92, 246] as [number, number, number] },
  ];

  const boxWidth = 42;
  kpis.forEach((item, idx) => {
    const x = 14 + (idx * (boxWidth + 4));
    doc.setFillColor(...item.color);
    doc.roundedRect(x, yPos, boxWidth, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(item.label, x + boxWidth / 2, yPos + 6, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x + boxWidth / 2, yPos + 14, { align: 'center' });
  });

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  // Client breakdown table
  yPos += 30;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Desglose por Cliente', 14, yPos);

  const clientRows = clientGroups.map(group => {
    const percentage = totalReimbursable > 0 ? (group.total / totalReimbursable) * 100 : 0;
    return [
      group.clientName.substring(0, 25),
      group.count.toString(),
      formatCurrency(group.total),
      `${percentage.toFixed(1)}%`,
    ];
  });

  // Add totals
  clientRows.push([
    'TOTAL',
    filteredExpenses.length.toString(),
    formatCurrency(totalReimbursable),
    '100%',
  ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Cliente', 'Gastos', 'Monto Total', '% del Total']],
    body: clientRows,
    theme: 'striped',
    headStyles: { fillColor: [245, 158, 11], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 30, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.row.index === clientRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [254, 243, 199];
      }
    },
  });

  // Category breakdown
  const catY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Desglose por Categoría', 14, catY);

  const catRows = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, total]) => {
      const percentage = totalReimbursable > 0 ? (total / totalReimbursable) * 100 : 0;
      return [
        CATEGORY_LABELS[cat] || cat,
        formatCurrency(total),
        `${percentage.toFixed(1)}%`,
      ];
    });

  autoTable(doc, {
    startY: catY + 5,
    head: [['Categoría', 'Monto', '% del Total']],
    body: catRows,
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 45, halign: 'right' },
      2: { cellWidth: 35, halign: 'center' },
    },
  });

  // Detailed expenses page
  doc.addPage();
  addHeader(doc, 'DETALLE DE GASTOS', `${filteredExpenses.length} registros reembolsables`);

  const expenseRows = filteredExpenses.map(e => {
    const amount = parseFloat(e.amount?.toString() || '0');
    return [
      e.date,
      e.client?.name?.substring(0, 15) || '',
      (e.vendor || '').substring(0, 18),
      CATEGORY_LABELS[e.category || 'other']?.substring(0, 18) || e.category || '',
      formatCurrency(amount),
    ];
  });

  autoTable(doc, {
    startY: 45,
    head: [['Fecha', 'Cliente', 'Proveedor', 'Categoría', 'Monto']],
    body: expenseRows,
    theme: 'striped',
    headStyles: { fillColor: [245, 158, 11], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 35 },
      2: { cellWidth: 40 },
      3: { cellWidth: 45 },
      4: { cellWidth: 30, halign: 'right' },
    },
    didDrawPage: () => {
      addHeader(doc, 'DETALLE DE GASTOS', `${filteredExpenses.length} registros reembolsables`);
    },
  });

  // Add footers
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  // Download
  const dateStr = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}`
    : format(new Date(), 'yyyy-MM-dd');
  
  const filename = `Reembolsos_${dateStr}.pdf`;
  doc.save(filename);
}
