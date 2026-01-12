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

// ========== TRANSLATIONS ==========
const PDF_TRANSLATIONS = {
  es: {
    // Headers
    expenseReport: 'REPORTE DE GASTOS',
    t2125Report: 'REPORTE T2125 - CRA',
    reimbursementReport: 'REPORTE DE REEMBOLSOS',
    detailTitle: 'DETALLE DE GASTOS',
    
    // Summary
    executiveSummary: 'RESUMEN EJECUTIVO',
    businessExpenses: 'RESUMEN DE GASTOS DE NEGOCIO',
    categoryBreakdown: 'Desglose por Categoría',
    clientBreakdown: 'Desglose por Cliente',
    monthlyBreakdown: 'Desglose por Mes',
    
    // KPIs
    totalExpenses: 'Total Gastos',
    deductible: 'Deducible',
    reimbursable: 'Reembolsable',
    nonDeductible: 'No Deducible',
    totalGross: 'Total Bruto',
    totalDeductible: 'Total Deducible',
    hstGstPaid: 'HST/GST Pagado',
    itcClaimable: 'ITC Reclamable',
    totalToBill: 'Total a Facturar',
    processedExpenses: 'Gastos Procesados',
    avgPerExpense: 'Promedio por Gasto',
    activeClients: 'Clientes Activos',
    
    // Table headers
    category: 'Categoría',
    quantity: 'Cant.',
    total: 'Total',
    rate: 'Tasa',
    date: 'Fecha',
    vendor: 'Proveedor',
    status: 'Estado',
    amount: 'Monto',
    client: 'Cliente',
    expenses: 'Gastos',
    totalAmount: 'Monto Total',
    percentTotal: '% del Total',
    line: 'Línea',
    description: 'Descripción',
    grossAmount: 'Monto Bruto',
    netDeductible: 'Deducible',
    month: 'Mes',
    
    // Notes
    importantNotes: 'NOTAS IMPORTANTES',
    t2125Notes: [
      '• Comidas y entretenimiento (Línea 8523) solo son 50% deducibles según CRA.',
      '• ITC calculado asumiendo HST 13% (Ontario). Ajustar según su provincia.',
      '• CCA requiere cálculo separado según la clase del activo.',
      '• Este reporte es solo para referencia. Consulte con un contador profesional.',
    ],
    t2125References: 'Referencias:',
    t2125Link: '• T2125: canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html',
    
    // Footer
    page: 'Página',
    of: 'de',
    generated: 'Generado',
    tagline: 'EvoFinz - Gestión Financiera Inteligente',
    
    // Misc
    fiscalYear: 'Año Fiscal',
    allPeriods: 'Todos los períodos',
    records: 'registros',
    reimbursableRecords: 'registros reembolsables',
    draft: 'BORRADOR',
    final: 'FINAL',
    preparedBy: 'Preparado por',
    businessName: 'Empresa',
    generatedOn: 'Generado el',
    period: 'Período',
    noExpenses: 'No hay gastos para exportar',
    
    // Months
    months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  },
  en: {
    // Headers
    expenseReport: 'EXPENSE REPORT',
    t2125Report: 'T2125 REPORT - CRA',
    reimbursementReport: 'REIMBURSEMENT REPORT',
    detailTitle: 'EXPENSE DETAILS',
    
    // Summary
    executiveSummary: 'EXECUTIVE SUMMARY',
    businessExpenses: 'BUSINESS EXPENSES SUMMARY',
    categoryBreakdown: 'Breakdown by Category',
    clientBreakdown: 'Breakdown by Client',
    monthlyBreakdown: 'Breakdown by Month',
    
    // KPIs
    totalExpenses: 'Total Expenses',
    deductible: 'Deductible',
    reimbursable: 'Reimbursable',
    nonDeductible: 'Non-Deductible',
    totalGross: 'Gross Total',
    totalDeductible: 'Total Deductible',
    hstGstPaid: 'HST/GST Paid',
    itcClaimable: 'ITC Claimable',
    totalToBill: 'Total to Bill',
    processedExpenses: 'Processed Expenses',
    avgPerExpense: 'Avg per Expense',
    activeClients: 'Active Clients',
    
    // Table headers
    category: 'Category',
    quantity: 'Qty',
    total: 'Total',
    rate: 'Rate',
    date: 'Date',
    vendor: 'Vendor',
    status: 'Status',
    amount: 'Amount',
    client: 'Client',
    expenses: 'Expenses',
    totalAmount: 'Total Amount',
    percentTotal: '% of Total',
    line: 'Line',
    description: 'Description',
    grossAmount: 'Gross Amount',
    netDeductible: 'Deductible',
    month: 'Month',
    
    // Notes
    importantNotes: 'IMPORTANT NOTES',
    t2125Notes: [
      '• Meals and entertainment (Line 8523) are only 50% deductible per CRA.',
      '• ITC calculated assuming HST 13% (Ontario). Adjust for your province.',
      '• CCA requires separate calculation based on asset class.',
      '• This report is for reference only. Consult a professional accountant.',
    ],
    t2125References: 'References:',
    t2125Link: '• T2125: canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html',
    
    // Footer
    page: 'Page',
    of: 'of',
    generated: 'Generated',
    tagline: 'EvoFinz - Intelligent Financial Management',
    
    // Misc
    fiscalYear: 'Fiscal Year',
    allPeriods: 'All periods',
    records: 'records',
    reimbursableRecords: 'reimbursable records',
    draft: 'DRAFT',
    final: 'FINAL',
    preparedBy: 'Prepared by',
    businessName: 'Business',
    generatedOn: 'Generated on',
    period: 'Period',
    noExpenses: 'No expenses to export',
    
    // Months
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
};

// ========== CATEGORY & STATUS LABELS ==========
const CATEGORY_LABELS: Record<string, { es: string; en: string }> = {
  meals: { es: 'Comidas', en: 'Meals' },
  travel: { es: 'Viajes', en: 'Travel' },
  equipment: { es: 'Equipo', en: 'Equipment' },
  software: { es: 'Software', en: 'Software' },
  office_supplies: { es: 'Suministros', en: 'Supplies' },
  utilities: { es: 'Servicios', en: 'Utilities' },
  professional_services: { es: 'Serv. Profesionales', en: 'Prof. Services' },
  home_office: { es: 'Oficina Casa', en: 'Home Office' },
  mileage: { es: 'Kilometraje', en: 'Mileage' },
  other: { es: 'Otros', en: 'Other' },
  fuel: { es: 'Combustible', en: 'Fuel' },
  materials: { es: 'Materiales', en: 'Materials' },
  tools: { es: 'Herramientas', en: 'Tools' },
  advertising: { es: 'Publicidad', en: 'Advertising' },
  insurance: { es: 'Seguros', en: 'Insurance' },
  communications: { es: 'Comunicaciones', en: 'Communications' },
  subscriptions: { es: 'Suscripciones', en: 'Subscriptions' },
};

const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  pending: { es: 'Pendiente', en: 'Pending' },
  classified: { es: 'Clasificado', en: 'Classified' },
  deductible: { es: 'Deducible', en: 'Deductible' },
  non_deductible: { es: 'No Deducible', en: 'Non-Deductible' },
  reimbursable: { es: 'Reembolsable', en: 'Reimbursable' },
  rejected: { es: 'Rechazado', en: 'Rejected' },
};

// ========== EXPORT OPTIONS ==========
export interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  year?: number;
  language?: 'es' | 'en';
  includeCharts?: boolean;
  groupBy?: 'none' | 'month' | 'category' | 'client';
  isDraft?: boolean;
  // User/Business info
  userName?: string;
  businessName?: string;
  businessNumber?: string;
  country?: string;
}

// ========== HELPER FUNCTIONS ==========
const formatCurrency = (amount: number, country?: string): string => {
  if (country === 'CL') {
    return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

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

function getCategoryLabel(category: string, lang: 'es' | 'en'): string {
  return CATEGORY_LABELS[category]?.[lang] || category;
}

function getStatusLabel(status: string, lang: 'es' | 'en'): string {
  return STATUS_LABELS[status]?.[lang] || status;
}

// ========== HEADER WITH LOGO ==========
function addHeader(doc: jsPDF, title: string, subtitle?: string, options: PDFExportOptions = {}) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const t = PDF_TRANSLATIONS[options.language || 'es'];
  
  // Header background gradient effect (using multiple rects)
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFillColor(99, 90, 255);
  doc.rect(0, 0, pageWidth, 2, 'F');
  
  // Phoenix Logo placeholder (circle with flame icon representation)
  doc.setFillColor(251, 191, 36); // Amber
  doc.circle(22, 20, 10, 'F');
  doc.setFillColor(249, 115, 22); // Orange
  doc.circle(22, 18, 6, 'F');
  doc.setFillColor(239, 68, 68); // Red flame
  doc.circle(22, 16, 3, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 38, 18);
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 38, 28);
  }
  
  // EvoFinz branding
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('EvoFinz', pageWidth - 35, 15);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(options.country === 'CL' ? 'Chile' : 'Canada', pageWidth - 35, 22);
  
  // User/Business info if available
  if (options.userName || options.businessName) {
    doc.setFontSize(8);
    const infoY = 30;
    if (options.businessName) {
      doc.text(options.businessName, pageWidth - 35, infoY);
    }
  }
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
}

// ========== WATERMARK ==========
function addWatermark(doc: jsPDF, isDraft: boolean, lang: 'es' | 'en') {
  if (!isDraft) return;
  
  const t = PDF_TRANSLATIONS[lang];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(60);
  doc.setFont('helvetica', 'bold');
  
  // Diagonal watermark
  doc.text(t.draft, pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45,
  });
  
  doc.setTextColor(0, 0, 0);
}

// ========== FOOTER ==========
function addFooter(doc: jsPDF, pageNumber: number, totalPages: number, options: PDFExportOptions = {}) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const t = PDF_TRANSLATIONS[options.language || 'es'];
  
  // Footer line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
  
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  
  // Left: Generated date + user
  let leftText = `${t.generated}: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
  if (options.userName) {
    leftText += ` | ${t.preparedBy}: ${options.userName}`;
  }
  doc.text(leftText, 14, pageHeight - 10);
  
  // Center: Page numbers
  doc.text(`${t.page} ${pageNumber} ${t.of} ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // Right: Tagline
  doc.text(t.tagline, pageWidth - 14, pageHeight - 10, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
}

// ========== INFO BOX ==========
function addInfoBox(doc: jsPDF, yPos: number, options: PDFExportOptions) {
  const t = PDF_TRANSLATIONS[options.language || 'es'];
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Light background box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, yPos, pageWidth - 28, 25, 3, 3, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(14, yPos, pageWidth - 28, 25, 3, 3, 'S');
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  
  let infoY = yPos + 8;
  
  if (options.businessName) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${t.businessName}: `, 20, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(options.businessName, 50, infoY);
    infoY += 5;
  }
  
  if (options.userName) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${t.preparedBy}: `, 20, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(options.userName, 50, infoY);
  }
  
  // Right side: date
  doc.setFont('helvetica', 'bold');
  doc.text(`${t.generatedOn}: `, pageWidth - 80, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), 'dd/MM/yyyy'), pageWidth - 45, yPos + 8);
  
  doc.setTextColor(0, 0, 0);
  
  return yPos + 30;
}

// ========== PIE CHART (Simple representation) ==========
function drawSimplePieChart(
  doc: jsPDF, 
  centerX: number, 
  centerY: number, 
  radius: number, 
  data: { label: string; value: number; color: [number, number, number] }[]
) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return;
  
  let startAngle = -Math.PI / 2; // Start from top
  
  data.forEach((item) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    
    // Draw slice
    doc.setFillColor(...item.color);
    
    // Create path for pie slice
    const segments = 20;
    const path: { x: number; y: number }[] = [{ x: centerX, y: centerY }];
    
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (sliceAngle * i) / segments;
      path.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
    
    // Draw as filled polygon approximation
    if (sliceAngle > 0.01) {
      const midAngle = startAngle + sliceAngle / 2;
      const sliceRadius = radius * 0.7;
      doc.circle(centerX + sliceRadius * Math.cos(midAngle) * 0.3, centerY + sliceRadius * Math.sin(midAngle) * 0.3, radius * 0.15, 'F');
    }
    
    startAngle = endAngle;
  });
  
  // Draw legend
  let legendY = centerY - (data.length * 5) / 2;
  data.slice(0, 5).forEach((item) => {
    doc.setFillColor(...item.color);
    doc.rect(centerX + radius + 10, legendY - 2, 4, 4, 'F');
    doc.setFontSize(6);
    doc.setTextColor(80, 80, 80);
    const pct = ((item.value / total) * 100).toFixed(0);
    doc.text(`${item.label.substring(0, 12)} (${pct}%)`, centerX + radius + 16, legendY + 1);
    legendY += 7;
  });
}

// ========== KPI BOXES ==========
function drawKPIBoxes(
  doc: jsPDF, 
  yPos: number, 
  kpis: { label: string; value: string; color: [number, number, number] }[]
) {
  const boxWidth = 42;
  const boxHeight = 20;
  const gap = 4;
  
  kpis.forEach((item, idx) => {
    const x = 14 + (idx * (boxWidth + gap));
    
    // Box with rounded corners
    doc.setFillColor(...item.color);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F');
    
    // Label
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, x + boxWidth / 2, yPos + 7, { align: 'center' });
    
    // Value
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x + boxWidth / 2, yPos + 15, { align: 'center' });
  });
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  return yPos + boxHeight + 10;
}

// ========== EXPORT GENERAL EXPENSES ==========
export function exportExpensesToPDF(expenses: ExpenseWithRelations[], options: PDFExportOptions = {}): void {
  const doc = new jsPDF();
  const lang = options.language || 'es';
  const t = PDF_TRANSLATIONS[lang];
  
  const filteredExpenses = options.year 
    ? expenses.filter(e => new Date(e.date).getFullYear() === options.year)
    : expenses;
  
  if (filteredExpenses.length === 0) {
    throw new Error(t.noExpenses);
  }

  // Calculate summary
  let totalExpenses = 0;
  let totalDeductible = 0;
  let totalReimbursable = 0;
  let totalNonDeductible = 0;
  const categoryTotals: Record<string, { total: number; deductible: number; count: number }> = {};
  const monthlyTotals: Record<string, { total: number; count: number }> = {};

  filteredExpenses.forEach(expense => {
    const amount = parseFloat(expense.amount?.toString() || '0');
    totalExpenses += amount;
    
    // Monthly grouping
    const monthKey = format(new Date(expense.date), 'yyyy-MM');
    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = { total: 0, count: 0 };
    }
    monthlyTotals[monthKey].total += amount;
    monthlyTotals[monthKey].count += 1;

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

  // Page 1: Summary
  const fullSubtitle = options.subtitle || (options.year ? `${t.fiscalYear}: ${options.year}` : t.allPeriods);
  addHeader(doc, options.title || t.expenseReport, fullSubtitle, options);
  addWatermark(doc, options.isDraft || false, lang);

  let yPos = 50;
  
  // Info box with user/business data
  if (options.userName || options.businessName) {
    yPos = addInfoBox(doc, yPos, options);
  }

  // Executive Summary title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(t.executiveSummary, 14, yPos);
  yPos += 8;
  
  // KPI boxes
  const summaryKPIs = [
    { label: t.totalExpenses, value: formatCurrency(totalExpenses, options.country), color: [59, 130, 246] as [number, number, number] },
    { label: t.deductible, value: formatCurrency(totalDeductible, options.country), color: [16, 185, 129] as [number, number, number] },
    { label: t.reimbursable, value: formatCurrency(totalReimbursable, options.country), color: [245, 158, 11] as [number, number, number] },
    { label: t.nonDeductible, value: formatCurrency(totalNonDeductible, options.country), color: [239, 68, 68] as [number, number, number] },
  ];
  yPos = drawKPIBoxes(doc, yPos, summaryKPIs);

  // Category breakdown table
  yPos += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(t.categoryBreakdown, 14, yPos);
  
  const categoryRows = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([cat, data]) => [
      getCategoryLabel(cat, lang),
      data.count.toString(),
      formatCurrency(data.total, options.country),
      formatCurrency(data.deductible, options.country),
      `${((data.deductible / data.total) * 100).toFixed(0)}%`,
    ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [[t.category, t.quantity, t.total, t.deductible, t.rate]],
    body: categoryRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 22, halign: 'center' },
    },
  });

  // Monthly breakdown if groupBy = month
  if (options.groupBy === 'month' || Object.keys(monthlyTotals).length > 1) {
    const monthTableY = (doc as any).lastAutoTable.finalY + 10;
    
    if (monthTableY < 200) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(t.monthlyBreakdown, 14, monthTableY);
      
      const monthRows = Object.entries(monthlyTotals)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, data]) => {
          const [year, month] = monthKey.split('-');
          const monthName = t.months[parseInt(month) - 1];
          return [
            `${monthName} ${year}`,
            data.count.toString(),
            formatCurrency(data.total, options.country),
          ];
        });

      autoTable(doc, {
        startY: monthTableY + 5,
        head: [[t.month, t.expenses, t.total]],
        body: monthRows,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' },
        },
      });
    }
  }

  // Page 2: Expense details
  doc.addPage();
  addHeader(doc, t.detailTitle, `${filteredExpenses.length} ${t.records}`, options);
  addWatermark(doc, options.isDraft || false, lang);

  const expenseRows = filteredExpenses.map(e => {
    const amount = parseFloat(e.amount?.toString() || '0');
    return [
      e.date,
      (e.vendor || '').substring(0, 20),
      getCategoryLabel(e.category || 'other', lang),
      getStatusLabel(e.status || 'pending', lang),
      formatCurrency(amount, options.country),
      e.client?.name?.substring(0, 15) || '-',
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [[t.date, t.vendor, t.category, t.status, t.amount, t.client]],
    body: expenseRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 28 },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 30 },
    },
    didDrawPage: () => {
      addHeader(doc, t.detailTitle, `${filteredExpenses.length} ${t.records}`, options);
      addWatermark(doc, options.isDraft || false, lang);
    },
  });

  // Add footers
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages, options);
  }

  // Download
  const filename = options.year 
    ? `${lang === 'es' ? 'gastos' : 'expenses'}_${options.year}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
    : `${lang === 'es' ? 'gastos' : 'expenses'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  
  doc.save(filename);
}

// ========== EXPORT T2125 ==========
export function exportT2125ToPDF(expenses: ExpenseWithRelations[], year?: number, options: PDFExportOptions = {}): void {
  const doc = new jsPDF();
  const lang = options.language || 'es';
  const t = PDF_TRANSLATIONS[lang];
  
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
  addHeader(doc, t.t2125Report, `${t.fiscalYear}: ${year || t.allPeriods}`, options);
  addWatermark(doc, options.isDraft || false, lang);

  let yPos = 50;
  
  // Info box
  if (options.userName || options.businessName) {
    yPos = addInfoBox(doc, yPos, options);
  }

  // Summary title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(t.businessExpenses, 14, yPos);
  yPos += 8;
  
  // KPI boxes
  const t2125KPIs = [
    { label: t.totalGross, value: formatCurrency(totalGross, options.country), color: [59, 130, 246] as [number, number, number] },
    { label: t.totalDeductible, value: formatCurrency(totalDeductible, options.country), color: [16, 185, 129] as [number, number, number] },
    { label: t.hstGstPaid, value: formatCurrency(totalHstGst, options.country), color: [245, 158, 11] as [number, number, number] },
    { label: t.itcClaimable, value: formatCurrency(itcClaimable, options.country), color: [139, 92, 246] as [number, number, number] },
  ];
  yPos = drawKPIBoxes(doc, yPos, t2125KPIs);

  // T2125 Lines table
  yPos += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`${t.categoryBreakdown} T2125`, 14, yPos);

  const lineRows = lineTotals.map(line => [
    line.line,
    (lang === 'es' ? line.nameEs : line.name).substring(0, 30),
    formatCurrency(line.grossAmount, options.country),
    `${(line.deductionRate * 100).toFixed(0)}%`,
    formatCurrency(line.netDeductible, options.country),
    line.expenseCount.toString(),
  ]);

  // Add totals row
  lineRows.push([
    'TOTAL',
    '',
    formatCurrency(totalGross, options.country),
    '',
    formatCurrency(totalDeductible, options.country),
    deductibleExpenses.length.toString(),
  ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [[t.line, t.description, t.grossAmount, t.rate, t.netDeductible, t.quantity]],
    body: lineRows,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 55 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: (data) => {
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
  doc.text(t.importantNotes, 14, notesY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  
  t.t2125Notes.forEach((note, idx) => {
    doc.text(note, 14, notesY + 7 + (idx * 5));
  });
  
  doc.text('', 14, notesY + 7 + (t.t2125Notes.length * 5));
  doc.text(t.t2125References, 14, notesY + 7 + (t.t2125Notes.length * 5) + 3);
  doc.text(t.t2125Link, 14, notesY + 7 + (t.t2125Notes.length * 5) + 8);

  // Add footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages, options);
  }

  // Download
  const filename = `T2125_Report_${year || 'All'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

// ========== REIMBURSEMENT REPORT ==========
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
  dateRange?: { from?: Date; to?: Date },
  options: PDFExportOptions = {}
): void {
  const doc = new jsPDF();
  const lang = options.language || 'es';
  const t = PDF_TRANSLATIONS[lang];
  
  const periodStr = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
    : t.allPeriods;

  // Header
  addHeader(doc, t.reimbursementReport, `${t.period}: ${periodStr}`, options);
  addWatermark(doc, options.isDraft || false, lang);

  let yPos = 50;
  
  // Info box
  if (options.userName || options.businessName) {
    yPos = addInfoBox(doc, yPos, options);
  }

  // Summary title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text(t.executiveSummary, 14, yPos);
  yPos += 8;
  
  // KPI boxes
  const avgPerExpense = filteredExpenses.length > 0 ? totalReimbursable / filteredExpenses.length : 0;
  const reimbKPIs = [
    { label: t.totalToBill, value: formatCurrency(totalReimbursable, options.country), color: [16, 185, 129] as [number, number, number] },
    { label: t.processedExpenses, value: filteredExpenses.length.toString(), color: [59, 130, 246] as [number, number, number] },
    { label: t.avgPerExpense, value: formatCurrency(avgPerExpense, options.country), color: [245, 158, 11] as [number, number, number] },
    { label: t.activeClients, value: clientGroups.length.toString(), color: [139, 92, 246] as [number, number, number] },
  ];
  yPos = drawKPIBoxes(doc, yPos, reimbKPIs);

  // Client breakdown table
  yPos += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(t.clientBreakdown, 14, yPos);

  const clientRows = clientGroups.map(group => {
    const percentage = totalReimbursable > 0 ? (group.total / totalReimbursable) * 100 : 0;
    return [
      group.clientName.substring(0, 25),
      group.count.toString(),
      formatCurrency(group.total, options.country),
      `${percentage.toFixed(1)}%`,
    ];
  });

  // Add totals
  clientRows.push([
    'TOTAL',
    filteredExpenses.length.toString(),
    formatCurrency(totalReimbursable, options.country),
    '100%',
  ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [[t.client, t.expenses, t.totalAmount, t.percentTotal]],
    body: clientRows,
    theme: 'striped',
    headStyles: { fillColor: [245, 158, 11], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
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
  const catY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(t.categoryBreakdown, 14, catY);

  const catRows = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, total]) => {
      const percentage = totalReimbursable > 0 ? (total / totalReimbursable) * 100 : 0;
      return [
        getCategoryLabel(cat, lang),
        formatCurrency(total, options.country),
        `${percentage.toFixed(1)}%`,
      ];
    });

  autoTable(doc, {
    startY: catY + 5,
    head: [[t.category, t.amount, t.percentTotal]],
    body: catRows,
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 45, halign: 'right' },
      2: { cellWidth: 35, halign: 'center' },
    },
  });

  // Page 2: Detailed expenses
  doc.addPage();
  addHeader(doc, t.detailTitle, `${filteredExpenses.length} ${t.reimbursableRecords}`, options);
  addWatermark(doc, options.isDraft || false, lang);

  const expenseRows = filteredExpenses.map(e => {
    const amount = parseFloat(e.amount?.toString() || '0');
    return [
      e.date,
      e.client?.name?.substring(0, 15) || '-',
      (e.vendor || '').substring(0, 18),
      getCategoryLabel(e.category || 'other', lang).substring(0, 18),
      formatCurrency(amount, options.country),
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [[t.date, t.client, t.vendor, t.category, t.amount]],
    body: expenseRows,
    theme: 'striped',
    headStyles: { fillColor: [245, 158, 11], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 35 },
      2: { cellWidth: 40 },
      3: { cellWidth: 45 },
      4: { cellWidth: 30, halign: 'right' },
    },
    didDrawPage: () => {
      addHeader(doc, t.detailTitle, `${filteredExpenses.length} ${t.reimbursableRecords}`, options);
      addWatermark(doc, options.isDraft || false, lang);
    },
  });

  // Add footers
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages, options);
  }

  // Download
  const dateStr = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}`
    : format(new Date(), 'yyyy-MM-dd');
  
  const filename = lang === 'es' 
    ? `Reembolsos_${dateStr}.pdf`
    : `Reimbursements_${dateStr}.pdf`;
  doc.save(filename);
}

// ========== PREVIEW GENERATION (returns base64) ==========
export async function generatePDFPreview(
  expenses: ExpenseWithRelations[], 
  options: PDFExportOptions = {}
): Promise<string> {
  const doc = new jsPDF();
  const lang = options.language || 'es';
  const t = PDF_TRANSLATIONS[lang];
  
  // Just first page preview
  const fullSubtitle = options.subtitle || (options.year ? `${t.fiscalYear}: ${options.year}` : t.allPeriods);
  addHeader(doc, options.title || t.expenseReport, fullSubtitle, options);
  
  if (options.isDraft) {
    addWatermark(doc, true, lang);
  }
  
  let yPos = 50;
  if (options.userName || options.businessName) {
    yPos = addInfoBox(doc, yPos, options);
  }
  
  // Quick summary
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || '0'), 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(t.executiveSummary, 14, yPos);
  yPos += 8;
  
  const previewKPIs = [
    { label: t.totalExpenses, value: formatCurrency(totalExpenses, options.country), color: [59, 130, 246] as [number, number, number] },
    { label: t.records, value: expenses.length.toString(), color: [16, 185, 129] as [number, number, number] },
  ];
  drawKPIBoxes(doc, yPos, previewKPIs);
  
  addFooter(doc, 1, 1, options);
  
  return doc.output('datauristring');
}
