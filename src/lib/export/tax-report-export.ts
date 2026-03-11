import ExcelJS from 'exceljs';
import { ExpenseWithRelations } from '@/types/expense.types';
import { EXPENSE_CATEGORY_TRANSLATIONS, ExpenseCategory } from '@/lib/constants/expense-categories';
import { getTaxDeductionRules, getTaxRate, TaxDeductionRule } from '@/hooks/data/useTaxCalculations';
import { format } from 'date-fns';

interface TaxReportOptions {
  year?: number;
  country: string;
  province?: string;
  language: 'es' | 'en';
  userName?: string;
  businessName?: string;
  businessNumber?: string;
  documents?: Array<{ file_name: string; extracted_data: any; created_at: string }>;
}

export async function exportTaxReport(
  expenses: ExpenseWithRelations[],
  options: TaxReportOptions
) {
  const { year, country, province, language: lang, userName, businessName, businessNumber, documents } = options;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EvoFinz';
  wb.created = new Date();

  const l = lang === 'es';
  const taxRules = getTaxDeductionRules(country);
  const taxRate = getTaxRate(country, province || 'ON');
  const currencySymbol = country === 'CL' ? '$' : '$';
  const currencyCode = country === 'CL' ? 'CLP' : 'CAD';

  const filtered = year ? expenses.filter(e => new Date(e.date).getFullYear() === year) : expenses;

  // ═══ Sheet 1: Summary ═══
  const summary = wb.addWorksheet(l ? 'Resumen Fiscal' : 'Tax Summary');
  
  const headerFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  const accentFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FFF0' } };
  const warningFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };

  // Title
  summary.mergeCells('A1:F1');
  const titleCell = summary.getCell('A1');
  titleCell.value = l 
    ? `📊 Reporte Fiscal — ${businessName || userName || 'Sin nombre'} — ${year || 'Todos'}` 
    : `📊 Tax Report — ${businessName || userName || 'N/A'} — ${year || 'All'}`;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1A1A2E' } };

  // Business info
  let row = 3;
  const infoLabels = l
    ? [['Contribuyente:', userName || '—'], ['Negocio:', businessName || '—'], ['RUT/BN:', businessNumber || '—'], ['País:', country === 'CL' ? 'Chile' : 'Canadá'], ['Período:', year ? `Enero - Diciembre ${year}` : 'Todos los períodos'], ['Generado:', format(new Date(), 'dd/MM/yyyy HH:mm')]]
    : [['Taxpayer:', userName || '—'], ['Business:', businessName || '—'], ['BN/RUT:', businessNumber || '—'], ['Country:', country === 'CL' ? 'Chile' : 'Canada'], ['Period:', year ? `January - December ${year}` : 'All periods'], ['Generated:', format(new Date(), 'yyyy-MM-dd HH:mm')]];
  
  infoLabels.forEach(([label, value]) => {
    summary.getCell(`A${row}`).value = label;
    summary.getCell(`A${row}`).font = { bold: true, size: 10 };
    summary.getCell(`B${row}`).value = value;
    row++;
  });

  // Category breakdown
  row += 2;
  const catHeaderRow = summary.getRow(row);
  const catHeaders = l 
    ? ['Categoría', 'Cant.', 'Total Bruto', 'Tasa Deducción', 'Deducible Neto', 'Fuente Legal']
    : ['Category', 'Count', 'Gross Total', 'Deduction Rate', 'Net Deductible', 'Legal Source'];
  catHeaders.forEach((h, i) => {
    const cell = catHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center' };
  });
  row++;

  // Group expenses by category
  const catMap = new Map<string, { total: number; count: number }>();
  filtered.forEach(e => {
    const cat = e.category || 'other';
    const existing = catMap.get(cat) || { total: 0, count: 0 };
    catMap.set(cat, { total: existing.total + e.amount, count: existing.count + 1 });
  });

  let totalGross = 0;
  let totalDeductible = 0;

  const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1].total - a[1].total);
  
  sortedCats.forEach(([cat, data]) => {
    const rule = taxRules.find(r => r.category === cat);
    const rate = rule?.deductionRate ?? 0;
    const deductible = data.total * rate;
    totalGross += data.total;
    totalDeductible += deductible;

    const catInfo = EXPENSE_CATEGORY_TRANSLATIONS[cat as ExpenseCategory];
    const catLabel = catInfo ? (l ? catInfo.es : catInfo.en) : cat;

    const r = summary.getRow(row);
    r.getCell(1).value = `${catInfo?.icon || '📋'} ${catLabel}`;
    r.getCell(2).value = data.count;
    r.getCell(2).alignment = { horizontal: 'center' };
    r.getCell(3).value = data.total;
    r.getCell(3).numFmt = `${currencySymbol}#,##0.00`;
    r.getCell(4).value = rate;
    r.getCell(4).numFmt = '0%';
    r.getCell(4).alignment = { horizontal: 'center' };
    r.getCell(5).value = deductible;
    r.getCell(5).numFmt = `${currencySymbol}#,##0.00`;
    if (rate >= 1) r.getCell(5).fill = accentFill;
    r.getCell(6).value = rule?.source || '—';
    r.getCell(6).font = { size: 9, color: { argb: 'FF666666' } };
    row++;
  });

  // Totals
  row++;
  const totalsRow = summary.getRow(row);
  totalsRow.getCell(1).value = l ? '💰 TOTALES' : '💰 TOTALS';
  totalsRow.getCell(1).font = { bold: true, size: 12 };
  totalsRow.getCell(2).value = filtered.length;
  totalsRow.getCell(2).font = { bold: true };
  totalsRow.getCell(3).value = totalGross;
  totalsRow.getCell(3).numFmt = `${currencySymbol}#,##0.00`;
  totalsRow.getCell(3).font = { bold: true };
  totalsRow.getCell(5).value = totalDeductible;
  totalsRow.getCell(5).numFmt = `${currencySymbol}#,##0.00`;
  totalsRow.getCell(5).font = { bold: true, color: { argb: 'FF008000' } };

  // Tax savings estimate
  row += 2;
  const taxSaved = totalDeductible * (country === 'CL' ? 0.27 : 0.30); // Approx marginal rate
  summary.getCell(`A${row}`).value = l ? '🎯 Ahorro Fiscal Estimado:' : '🎯 Estimated Tax Savings:';
  summary.getCell(`A${row}`).font = { bold: true, size: 12 };
  summary.getCell(`C${row}`).value = taxSaved;
  summary.getCell(`C${row}`).numFmt = `${currencySymbol}#,##0.00`;
  summary.getCell(`C${row}`).font = { bold: true, size: 14, color: { argb: 'FF008000' } };

  // ITC/IVA
  row++;
  const taxInExpenses = totalGross - (totalGross / (1 + taxRate));
  summary.getCell(`A${row}`).value = country === 'CL' ? '🧾 IVA Crédito Fiscal:' : '🧾 Input Tax Credits (ITC):';
  summary.getCell(`A${row}`).font = { bold: true };
  summary.getCell(`C${row}`).value = taxInExpenses;
  summary.getCell(`C${row}`).numFmt = `${currencySymbol}#,##0.00`;

  summary.columns = [{ width: 32 }, { width: 8 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 30 }];

  // ═══ Sheet 2: All Expenses Detail ═══
  const detail = wb.addWorksheet(l ? 'Detalle de Gastos' : 'Expense Detail');
  
  const detHeaders = l
    ? ['Fecha', 'Proveedor', 'Categoría', 'Monto', 'Moneda', 'Descripción', 'Deducible', 'Tasa', 'Cliente', 'Comprobante']
    : ['Date', 'Vendor', 'Category', 'Amount', 'Currency', 'Description', 'Deductible', 'Rate', 'Client', 'Receipt'];
  
  const detHeaderRow = detail.getRow(1);
  detHeaders.forEach((h, i) => {
    const cell = detHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.fill = headerFill;
    cell.font = headerFont;
  });

  filtered
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((e, idx) => {
      const r = detail.getRow(idx + 2);
      const catInfo = EXPENSE_CATEGORY_TRANSLATIONS[e.category as ExpenseCategory];
      const rule = taxRules.find(ru => ru.category === e.category);
      
      r.getCell(1).value = format(new Date(e.date), 'yyyy-MM-dd');
      r.getCell(2).value = e.vendor || '—';
      r.getCell(3).value = catInfo ? (l ? catInfo.es : catInfo.en) : (e.category || 'Otro');
      r.getCell(4).value = e.amount;
      r.getCell(4).numFmt = '#,##0.00';
      r.getCell(5).value = e.currency || currencyCode;
      r.getCell(6).value = e.description || '';
      r.getCell(7).value = rule ? (l ? 'Sí' : 'Yes') : (l ? 'No' : 'No');
      r.getCell(8).value = rule?.deductionRate ?? 0;
      r.getCell(8).numFmt = '0%';
      r.getCell(9).value = (e as any).client?.name || '—';
      r.getCell(10).value = e.document_id ? '✅' : '❌';
      r.getCell(10).alignment = { horizontal: 'center' };

      if (!e.document_id) {
        r.getCell(10).fill = warningFill;
      }
    });

  detail.columns = [
    { width: 12 }, { width: 22 }, { width: 22 }, { width: 14 }, { width: 8 },
    { width: 30 }, { width: 10 }, { width: 8 }, { width: 18 }, { width: 12 },
  ];

  // ═══ Sheet 3: Document Checklist ═══
  const checklist = wb.addWorksheet(l ? 'Checklist Documentos' : 'Document Checklist');
  
  const checkHeaders = l
    ? ['Documento', 'Estado', 'Prioridad', 'Notas']
    : ['Document', 'Status', 'Priority', 'Notes'];
  
  const checkHeaderRow = checklist.getRow(1);
  checkHeaders.forEach((h, i) => {
    const cell = checkHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.fill = headerFill;
    cell.font = headerFont;
  });

  // Determine which doc types exist
  const uploadedTypes = new Set<string>();
  documents?.forEach(doc => {
    const ext = doc.extracted_data as Record<string, any> | null;
    if (ext?.document_classification) uploadedTypes.add(ext.document_classification);
  });

  const checklistItems = getChecklistForCountry(country, l);
  checklistItems.forEach((item, idx) => {
    const r = checklist.getRow(idx + 2);
    const hasDoc = item.types.some(t => uploadedTypes.has(t));
    r.getCell(1).value = `${item.icon} ${item.label}`;
    r.getCell(2).value = hasDoc ? '✅' : '❌';
    r.getCell(2).alignment = { horizontal: 'center' };
    r.getCell(3).value = item.priority;
    r.getCell(4).value = hasDoc ? (l ? 'Subido' : 'Uploaded') : (l ? 'Pendiente — subir en Bandeja del Caos' : 'Missing — upload in Chaos Inbox');
    if (!hasDoc && item.priority === (l ? 'Alta' : 'High')) {
      r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
      r.getCell(4).fill = warningFill;
    }
  });

  checklist.columns = [{ width: 35 }, { width: 10 }, { width: 12 }, { width: 40 }];

  // ═══ Sheet 4: Missing Receipts ═══
  const missing = wb.addWorksheet(l ? 'Sin Comprobante' : 'Missing Receipts');
  
  const missHeaders = l
    ? ['Fecha', 'Proveedor', 'Monto', 'Categoría', 'Descripción']
    : ['Date', 'Vendor', 'Amount', 'Category', 'Description'];
  
  const missHeaderRow = missing.getRow(1);
  missHeaders.forEach((h, i) => {
    const cell = missHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC3545' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  const noReceipt = filtered.filter(e => !e.document_id);
  noReceipt.forEach((e, idx) => {
    const r = missing.getRow(idx + 2);
    const catInfo = EXPENSE_CATEGORY_TRANSLATIONS[e.category as ExpenseCategory];
    r.getCell(1).value = format(new Date(e.date), 'yyyy-MM-dd');
    r.getCell(2).value = e.vendor || '—';
    r.getCell(3).value = e.amount;
    r.getCell(3).numFmt = '#,##0.00';
    r.getCell(4).value = catInfo ? (l ? catInfo.es : catInfo.en) : (e.category || '');
    r.getCell(5).value = e.description || '';
  });

  // Summary at top
  if (noReceipt.length > 0) {
    missing.insertRow(1, []);
    missing.getCell('A1').value = l 
      ? `⚠️ ${noReceipt.length} gastos sin comprobante — tu contador los necesita` 
      : `⚠️ ${noReceipt.length} expenses without receipt — your accountant needs these`;
    missing.getCell('A1').font = { bold: true, color: { argb: 'FFDC3545' }, size: 11 };
    missing.mergeCells('A1:E1');
  }

  missing.columns = [{ width: 12 }, { width: 22 }, { width: 14 }, { width: 22 }, { width: 30 }];

  // ═══ Generate file ═══
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tax-report-${businessName || 'evofinz'}-${year || 'all'}-${format(new Date(), 'yyyyMMdd')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

function getChecklistForCountry(country: string, l: boolean) {
  const items = [];
  
  if (country === 'CA' || country !== 'CL') {
    items.push(
      { icon: '📑', label: l ? 'T4 — Empleo' : 'T4 — Employment', types: ['tax_slip'], priority: l ? 'Alta' : 'High' },
      { icon: '📑', label: l ? 'T5 — Inversiones' : 'T5 — Investments', types: ['tax_slip', 'investment_statement'], priority: l ? 'Alta' : 'High' },
      { icon: '📈', label: l ? 'Recibos RRSP' : 'RRSP Receipts', types: ['tax_slip', 'investment_statement'], priority: l ? 'Alta' : 'High' },
      { icon: '🎓', label: l ? 'T2202 — Educación' : 'T2202 — Tuition', types: ['tax_slip'], priority: l ? 'Media' : 'Medium' },
      { icon: '🏢', label: l ? 'Recibos de Arriendo' : 'Rent Receipts', types: ['rental_receipt'], priority: l ? 'Media' : 'Medium' },
    );
  }
  
  if (country === 'CL') {
    items.push(
      { icon: '📑', label: l ? 'Certificado AFP' : 'AFP Certificate', types: ['tax_slip'], priority: l ? 'Alta' : 'High' },
      { icon: '📈', label: l ? 'Certificado APV' : 'APV Certificate', types: ['tax_slip', 'investment_statement'], priority: l ? 'Alta' : 'High' },
      { icon: '🏥', label: l ? 'Certificado Isapre/Fonasa' : 'Isapre/Fonasa', types: ['tax_slip', 'insurance_policy'], priority: l ? 'Alta' : 'High' },
      { icon: '🏠', label: l ? 'Intereses Hipotecarios' : 'Mortgage Interest', types: ['tax_slip'], priority: l ? 'Media' : 'Medium' },
    );
  }

  // Both countries
  items.push(
    { icon: '🧾', label: l ? 'Recibos de Gastos' : 'Expense Receipts', types: ['receipt'], priority: l ? 'Alta' : 'High' },
    { icon: '🧾', label: l ? 'Facturas' : 'Invoices', types: ['invoice'], priority: l ? 'Alta' : 'High' },
    { icon: '🏥', label: l ? 'Gastos Médicos' : 'Medical Expenses', types: ['medical_receipt'], priority: l ? 'Alta' : 'High' },
    { icon: '💝', label: l ? 'Recibos de Donaciones' : 'Donation Receipts', types: ['donation_receipt'], priority: l ? 'Media' : 'Medium' },
    { icon: '🏦', label: l ? 'Extractos Bancarios' : 'Bank Statements', types: ['bank_statement'], priority: l ? 'Media' : 'Medium' },
    { icon: '📄', label: l ? 'Contratos' : 'Contracts', types: ['contract'], priority: l ? 'Media' : 'Medium' },
    { icon: '🛡️', label: l ? 'Pólizas de Seguro' : 'Insurance Policies', types: ['insurance_policy'], priority: l ? 'Baja' : 'Low' },
    { icon: '📈', label: l ? 'Estados de Inversión' : 'Investment Statements', types: ['investment_statement'], priority: l ? 'Baja' : 'Low' },
  );

  return items;
}
