import ExcelJS from 'exceljs';
import { ExpenseWithRelations } from '@/types/expense.types';
import { TAX_DEDUCTION_RULES, getTaxDeductionRules } from '@/hooks/data/useTaxCalculations';
import { format } from 'date-fns';
import { exportExpensesToPDF } from './pdf-export';
import { EXPENSE_CATEGORY_TRANSLATIONS, ExpenseCategory, getCategoryLabelByLanguage, getCategoryIcon } from '@/lib/constants/expense-categories';

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  includeAll?: boolean;
  year?: number;
  language?: 'es' | 'en';
  country?: string;
  userName?: string;
  businessName?: string;
}

interface ExportRow {
  Date: string;
  Vendor: string;
  Description: string;
  Category: string;
  'Tax Category': string;
  Amount: number;
  Currency: string;
  Status: string;
  Client: string;
  'Deduction Rate': string;
  'Deductible Amount': number;
  'Non-Deductible Amount': number;
  Tags: string;
  Notes: string;
}

const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  pending: { es: 'Pendiente', en: 'Pending' },
  classified: { es: 'Clasificado', en: 'Classified' },
  deductible: { es: 'Deducible', en: 'Deductible' },
  non_deductible: { es: 'No Deducible', en: 'Non-Deductible' },
  reimbursable: { es: 'Reembolsable', en: 'Reimbursable' },
  rejected: { es: 'Rechazado', en: 'Rejected' },
  under_review: { es: 'En Revisión', en: 'Under Review' },
  finalized: { es: 'Finalizado', en: 'Finalized' },
};

function getCurrencyFormat(country?: string): { numFmt: string; code: string; symbol: string; decimals: number } {
  if (country === 'CL') {
    return { numFmt: '"$"#,##0', code: 'CLP', symbol: '$', decimals: 0 };
  }
  return { numFmt: '"$"#,##0.00', code: 'CAD', symbol: '$', decimals: 2 };
}

function calculateDeduction(amount: number, category: string | null, status: string | null, country?: string): { deductible: number; nonDeductible: number; rate: number } {
  if (status === 'reimbursable') {
    return { deductible: 0, nonDeductible: 0, rate: 0 };
  }
  
  if (status !== 'deductible') {
    return { deductible: 0, nonDeductible: amount, rate: 0 };
  }

  const rules = getTaxDeductionRules(country || 'CA');
  const rule = rules.find(r => r.category === category);
  const rate = rule?.deductionRate || 1.0;
  const deductible = amount * rate;
  
  return {
    deductible,
    nonDeductible: amount - deductible,
    rate,
  };
}

function formatExpenseForExport(expense: ExpenseWithRelations, lang: 'es' | 'en', country?: string): ExportRow {
  const amount = parseFloat(expense.amount?.toString() || '0');
  const { deductible, nonDeductible, rate } = calculateDeduction(amount, expense.category, expense.status, country);
  const rules = getTaxDeductionRules(country || 'CA');
  const rule = rules.find(r => r.category === expense.category);
  const curr = getCurrencyFormat(country);

  return {
    Date: expense.date || '',
    Vendor: expense.vendor || '',
    Description: expense.description || '',
    Category: getCategoryLabelByLanguage(expense.category || 'other', lang),
    'Tax Category': rule?.description || 'N/A',
    Amount: amount,
    Currency: expense.currency || curr.code,
    Status: STATUS_LABELS[expense.status || 'pending']?.[lang] || expense.status || '',
    Client: expense.client?.name || '',
    'Deduction Rate': rate > 0 ? `${(rate * 100).toFixed(0)}%` : 'N/A',
    'Deductible Amount': Math.round(deductible * 100) / 100,
    'Non-Deductible Amount': Math.round(nonDeductible * 100) / 100,
    Tags: expense.tags?.map(t => t.name).join(', ') || '',
    Notes: expense.notes || '',
  };
}

function calculateSummary(expenses: ExpenseWithRelations[], country?: string) {
  let totalExpenses = 0;
  let totalDeductible = 0;
  let totalReimbursable = 0;
  let totalNonDeductible = 0;
  
  const categoryTotals: Record<string, { total: number; deductible: number; count: number }> = {};

  expenses.forEach(expense => {
    const amount = parseFloat(expense.amount?.toString() || '0');
    totalExpenses += amount;

    if (expense.status === 'reimbursable') {
      totalReimbursable += amount;
    } else if (expense.status === 'deductible') {
      const { deductible, nonDeductible } = calculateDeduction(amount, expense.category, expense.status, country);
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

  return {
    totalExpenses,
    totalDeductible,
    totalReimbursable,
    totalNonDeductible,
    categoryTotals,
  };
}

export function exportToCSV(expenses: ExpenseWithRelations[], filename: string = 'expenses', options?: ExportOptions): void {
  const lang = options?.language || 'es';
  const rows = expenses.map(e => formatExpenseForExport(e, lang, options?.country));
  
  if (rows.length === 0) {
    throw new Error(lang === 'es' ? 'No hay gastos para exportar' : 'No expenses to export');
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const value = row[header as keyof ExportRow];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
}

export async function exportToExcel(expenses: ExpenseWithRelations[], filename: string = 'expenses', options?: ExportOptions): Promise<void> {
  const lang = options?.language || 'es';
  const country = options?.country || 'CA';
  const l = lang === 'es';
  const curr = getCurrencyFormat(country);
  const rows = expenses.map(e => formatExpenseForExport(e, lang, country));
  
  if (rows.length === 0) {
    throw new Error(l ? 'No hay gastos para exportar' : 'No expenses to export');
  }

  const summary = calculateSummary(expenses, country);
  const taxRules = getTaxDeductionRules(country);
  const taxAuthority = country === 'CL' ? 'SII' : 'CRA';

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EvoFinz';
  workbook.created = new Date();

  const headerFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  const accentFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FFF0' } };
  const altRowFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };

  // ═══ Sheet 1: All Expenses ═══
  const expensesSheet = workbook.addWorksheet(l ? 'Gastos' : 'Expenses', {
    properties: { tabColor: { argb: '4F46E5' } }
  });

  // Title
  expensesSheet.mergeCells('A1:N1');
  const titleCell = expensesSheet.getCell('A1');
  titleCell.value = l
    ? `📊 REPORTE DE GASTOS — ${options?.businessName || 'EVOFINZ'}`
    : `📊 EXPENSE REPORT — ${options?.businessName || 'EVOFINZ'}`;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = headerFill;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  expensesSheet.getRow(1).height = 32;

  // Subtitle with metadata
  expensesSheet.mergeCells('A2:N2');
  const subtitleCell = expensesSheet.getCell('A2');
  subtitleCell.value = l
    ? `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')} | ${country === 'CL' ? 'Chile' : 'Canadá'} | ${rows.length} registros`
    : `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')} | ${country === 'CL' ? 'Chile' : 'Canada'} | ${rows.length} records`;
  subtitleCell.font = { italic: true, size: 9, color: { argb: 'FF666666' } };
  subtitleCell.alignment = { horizontal: 'center' };

  // Headers
  const headers = Object.keys(rows[0]);
  headers.forEach((header, idx) => {
    const cell = expensesSheet.getCell(4, idx + 1);
    cell.value = header;
    cell.font = headerFont;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF333333' } } };
  });
  expensesSheet.getRow(4).height = 22;

  // Data rows
  rows.forEach((row, rowIdx) => {
    headers.forEach((header, colIdx) => {
      const cell = expensesSheet.getCell(5 + rowIdx, colIdx + 1);
      cell.value = row[header as keyof ExportRow];
      
      if (header === 'Amount' || header === 'Deductible Amount' || header === 'Non-Deductible Amount') {
        cell.numFmt = curr.numFmt;
      }
      
      if (rowIdx % 2 === 0) {
        cell.fill = altRowFill;
      }
    });
  });

  expensesSheet.columns = [
    { width: 12 }, { width: 24 }, { width: 30 }, { width: 24 }, { width: 36 },
    { width: 14 }, { width: 8 }, { width: 18 }, { width: 20 }, { width: 14 },
    { width: 16 }, { width: 18 }, { width: 24 }, { width: 28 },
  ];

  expensesSheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4 + rows.length, column: headers.length }
  };

  // ═══ Sheet 2: Tax Summary ═══
  const summarySheet = workbook.addWorksheet(l ? 'Resumen Fiscal' : 'Tax Summary', {
    properties: { tabColor: { argb: '10B981' } }
  });

  // Title
  summarySheet.mergeCells('A1:E1');
  const summaryTitle = summarySheet.getCell('A1');
  summaryTitle.value = l ? `💰 RESUMEN FISCAL — ${taxAuthority}` : `💰 TAX SUMMARY — ${taxAuthority}`;
  summaryTitle.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  summaryTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
  summaryTitle.alignment = { horizontal: 'center' };
  summarySheet.getRow(1).height = 32;

  // KPI Section
  const kpis = [
    [l ? '📈 Total de Gastos' : '📈 Total Expenses', summary.totalExpenses],
    [l ? '✅ Total Deducible' : '✅ Total Deductible', summary.totalDeductible],
    [l ? '🔄 Total Reembolsable' : '🔄 Total Reimbursable', summary.totalReimbursable],
    [l ? '❌ Total No Deducible' : '❌ Total Non-Deductible', summary.totalNonDeductible],
  ];

  kpis.forEach(([label, value], idx) => {
    const row = 3 + idx;
    summarySheet.getCell(row, 1).value = label as string;
    summarySheet.getCell(row, 1).font = { bold: true, size: 11 };
    const valCell = summarySheet.getCell(row, 2);
    valCell.value = value as number;
    valCell.numFmt = curr.numFmt;
    valCell.font = { bold: true, size: 12 };
    if (idx === 1) valCell.font = { bold: true, size: 12, color: { argb: 'FF10B981' } };
  });

  // Category breakdown
  let sRow = 9;
  summarySheet.getCell(sRow, 1).value = l ? '📊 DESGLOSE POR CATEGORÍA' : '📊 BREAKDOWN BY CATEGORY';
  summarySheet.getCell(sRow, 1).font = { bold: true, size: 12 };
  sRow++;

  const catHeaders = l
    ? ['Categoría', 'Cantidad', 'Total', 'Deducible', 'Tasa']
    : ['Category', 'Count', 'Total', 'Deductible', 'Rate'];
  catHeaders.forEach((h, idx) => {
    const cell = summarySheet.getCell(sRow, idx + 1);
    cell.value = h;
    cell.font = headerFont;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    cell.alignment = { horizontal: 'center' };
  });
  sRow++;

  Object.entries(summary.categoryTotals)
    .sort(([, a], [, b]) => b.total - a.total)
    .forEach(([cat, data], idx) => {
      const icon = getCategoryIcon(cat);
      summarySheet.getCell(sRow, 1).value = `${icon} ${getCategoryLabelByLanguage(cat, lang)}`;
      summarySheet.getCell(sRow, 2).value = data.count;
      summarySheet.getCell(sRow, 2).alignment = { horizontal: 'center' };
      summarySheet.getCell(sRow, 3).value = data.total;
      summarySheet.getCell(sRow, 3).numFmt = curr.numFmt;
      summarySheet.getCell(sRow, 4).value = data.deductible;
      summarySheet.getCell(sRow, 4).numFmt = curr.numFmt;
      if (data.deductible >= data.total) summarySheet.getCell(sRow, 4).fill = accentFill;
      summarySheet.getCell(sRow, 5).value = data.total > 0 ? data.deductible / data.total : 0;
      summarySheet.getCell(sRow, 5).numFmt = '0%';
      summarySheet.getCell(sRow, 5).alignment = { horizontal: 'center' };

      if (idx % 2 === 0) {
        for (let c = 1; c <= 5; c++) {
          summarySheet.getCell(sRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
        }
      }
      sRow++;
    });

  // Tax authority reference section
  sRow += 2;
  summarySheet.getCell(sRow, 1).value = l
    ? `📋 REGLAS DE DEDUCCIÓN — ${taxAuthority}`
    : `📋 DEDUCTION RULES — ${taxAuthority}`;
  summarySheet.getCell(sRow, 1).font = { bold: true, size: 12 };
  sRow++;

  const ruleHeaders = l ? ['Categoría', 'Tasa', 'Descripción', 'Fuente'] : ['Category', 'Rate', 'Description', 'Source'];
  ruleHeaders.forEach((h, idx) => {
    const cell = summarySheet.getCell(sRow, idx + 1);
    cell.value = h;
    cell.font = headerFont;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
  });
  sRow++;

  taxRules.forEach((rule, idx) => {
    const icon = getCategoryIcon(rule.category);
    summarySheet.getCell(sRow, 1).value = `${icon} ${getCategoryLabelByLanguage(rule.category, lang)}`;
    summarySheet.getCell(sRow, 2).value = rule.deductionRate;
    summarySheet.getCell(sRow, 2).numFmt = '0%';
    summarySheet.getCell(sRow, 3).value = rule.description;
    summarySheet.getCell(sRow, 4).value = rule.source || taxAuthority;
    summarySheet.getCell(sRow, 4).font = { size: 9, color: { argb: 'FF666666' } };
    sRow++;
  });

  // Footer notes
  sRow += 2;
  summarySheet.getCell(sRow, 1).value = l
    ? `📅 Fecha de exportación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
    : `📅 Export date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
  sRow += 2;
  summarySheet.getCell(sRow, 1).value = l
    ? '⚠️ NOTA: Este reporte es solo para referencia. Consulte con un contador profesional para su declaración oficial.'
    : '⚠️ NOTE: This report is for reference only. Consult a professional accountant for your official tax filing.';
  summarySheet.getCell(sRow, 1).font = { italic: true, size: 9, color: { argb: 'FF888888' } };

  summarySheet.columns = [
    { width: 36 }, { width: 14 }, { width: 42 }, { width: 18 }, { width: 14 }
  ];

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(expenses: ExpenseWithRelations[], filename: string = 'expenses', options?: ExportOptions): void {
  const lang = options?.language || 'es';
  const rows = expenses.map(e => formatExpenseForExport(e, lang, options?.country));
  
  if (rows.length === 0) {
    throw new Error(lang === 'es' ? 'No hay gastos para exportar' : 'No expenses to export');
  }

  const summary = calculateSummary(expenses, options?.country);
  
  const exportData = {
    exportDate: format(new Date(), 'yyyy-MM-dd HH:mm'),
    totalRecords: rows.length,
    country: options?.country || 'CA',
    summary: {
      totalExpenses: summary.totalExpenses,
      totalDeductible: summary.totalDeductible,
      totalReimbursable: summary.totalReimbursable,
      totalNonDeductible: summary.totalNonDeductible,
      byCategory: Object.entries(summary.categoryTotals).map(([cat, data]) => ({
        category: getCategoryLabelByLanguage(cat, lang),
        total: data.total,
        deductible: data.deductible,
        count: data.count,
      })),
    },
    expenses: rows,
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.json`);
}

export async function exportExpenses(expenses: ExpenseWithRelations[], options: ExportOptions): Promise<void> {
  const filename = options.year 
    ? `gastos_fiscales_${options.year}` 
    : 'gastos_fiscales';

  if (options.format === 'csv') {
    exportToCSV(expenses, filename, options);
  } else if (options.format === 'json') {
    exportToJSON(expenses, filename, options);
  } else if (options.format === 'pdf') {
    exportExpensesToPDF(expenses, { year: options.year, language: options.language, country: options.country });
  } else {
    await exportToExcel(expenses, filename, options);
  }
}
