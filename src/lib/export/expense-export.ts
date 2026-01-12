import ExcelJS from 'exceljs';
import { ExpenseWithRelations } from '@/types/expense.types';
import { TAX_DEDUCTION_RULES } from '@/hooks/data/useTaxCalculations';
import { format } from 'date-fns';
import { exportExpensesToPDF } from './pdf-export';

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  includeAll?: boolean;
  year?: number;
}

interface ExportRow {
  Date: string;
  Vendor: string;
  Description: string;
  Category: string;
  'Category (CRA)': string;
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

const CATEGORY_LABELS: Record<string, string> = {
  meals: 'Comidas / Meals',
  travel: 'Viajes / Travel',
  equipment: 'Equipo / Equipment',
  software: 'Software',
  office_supplies: 'Suministros de Oficina / Office Supplies',
  utilities: 'Servicios Públicos / Utilities',
  professional_services: 'Servicios Profesionales / Professional Services',
  home_office: 'Oficina en Casa / Home Office',
  mileage: 'Kilometraje / Mileage',
  other: 'Otros / Other',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente / Pending',
  classified: 'Clasificado / Classified',
  deductible: 'Deducible / Deductible',
  non_deductible: 'No Deducible / Non-Deductible',
  reimbursable: 'Reembolsable / Reimbursable',
  rejected: 'Rechazado / Rejected',
  under_review: 'En Revisión / Under Review',
  finalized: 'Finalizado / Finalized',
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
  
  return {
    deductible,
    nonDeductible: amount - deductible,
    rate,
  };
}

function formatExpenseForExport(expense: ExpenseWithRelations): ExportRow {
  const amount = parseFloat(expense.amount?.toString() || '0');
  const { deductible, nonDeductible, rate } = calculateDeduction(amount, expense.category, expense.status);
  const rule = TAX_DEDUCTION_RULES.find(r => r.category === expense.category);

  return {
    Date: expense.date || '',
    Vendor: expense.vendor || '',
    Description: expense.description || '',
    Category: CATEGORY_LABELS[expense.category || 'other'] || expense.category || '',
    'Category (CRA)': rule?.description || 'N/A',
    Amount: amount,
    Currency: expense.currency || 'CAD',
    Status: STATUS_LABELS[expense.status || 'pending'] || expense.status || '',
    Client: expense.client?.name || '',
    'Deduction Rate': rate > 0 ? `${(rate * 100).toFixed(0)}%` : 'N/A',
    'Deductible Amount': Math.round(deductible * 100) / 100,
    'Non-Deductible Amount': Math.round(nonDeductible * 100) / 100,
    Tags: expense.tags?.map(t => t.name).join(', ') || '',
    Notes: expense.notes || '',
  };
}

function calculateSummary(expenses: ExpenseWithRelations[]) {
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

  return {
    totalExpenses,
    totalDeductible,
    totalReimbursable,
    totalNonDeductible,
    categoryTotals,
  };
}

export function exportToCSV(expenses: ExpenseWithRelations[], filename: string = 'expenses'): void {
  const rows = expenses.map(formatExpenseForExport);
  
  if (rows.length === 0) {
    throw new Error('No hay gastos para exportar');
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const value = row[header as keyof ExportRow];
        // Escape commas and quotes
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

export async function exportToExcel(expenses: ExpenseWithRelations[], filename: string = 'expenses'): Promise<void> {
  const rows = expenses.map(formatExpenseForExport);
  
  if (rows.length === 0) {
    throw new Error('No hay gastos para exportar');
  }

  const summary = calculateSummary(expenses);

  // Create workbook with ExcelJS
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EvoFinz';
  workbook.created = new Date();

  // Sheet 1: All Expenses
  const expensesSheet = workbook.addWorksheet('Gastos / Expenses', {
    properties: { tabColor: { argb: '4F46E5' } }
  });

  // Add title
  expensesSheet.mergeCells('A1:N1');
  const titleCell = expensesSheet.getCell('A1');
  titleCell.value = '📊 REPORTE DE GASTOS - EVOFINZ';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
  titleCell.alignment = { horizontal: 'center' };
  expensesSheet.getRow(1).height = 30;

  // Headers
  const headers = Object.keys(rows[0]);
  headers.forEach((header, idx) => {
    const cell = expensesSheet.getCell(3, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } };
    cell.alignment = { horizontal: 'center' };
  });

  // Data rows
  rows.forEach((row, rowIdx) => {
    headers.forEach((header, colIdx) => {
      const cell = expensesSheet.getCell(4 + rowIdx, colIdx + 1);
      cell.value = row[header as keyof ExportRow];
      
      // Format currency columns
      if (header === 'Amount' || header === 'Deductible Amount' || header === 'Non-Deductible Amount') {
        cell.numFmt = '"$"#,##0.00';
      }
      
      // Alternate row colors
      if (rowIdx % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };
      }
    });
  });

  // Set column widths
  expensesSheet.columns = [
    { width: 12 }, // Date
    { width: 25 }, // Vendor
    { width: 30 }, // Description
    { width: 25 }, // Category
    { width: 40 }, // Category (CRA)
    { width: 12 }, // Amount
    { width: 8 },  // Currency
    { width: 20 }, // Status
    { width: 20 }, // Client
    { width: 15 }, // Deduction Rate
    { width: 18 }, // Deductible Amount
    { width: 20 }, // Non-Deductible Amount
    { width: 25 }, // Tags
    { width: 30 }, // Notes
  ];

  // Auto filter
  expensesSheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3 + rows.length, column: headers.length }
  };

  // Sheet 2: Tax Summary
  const summarySheet = workbook.addWorksheet('Resumen Fiscal / Tax Summary', {
    properties: { tabColor: { argb: '10B981' } }
  });

  // Title
  summarySheet.mergeCells('A1:D1');
  const summaryTitle = summarySheet.getCell('A1');
  summaryTitle.value = '💰 RESUMEN FISCAL / TAX SUMMARY';
  summaryTitle.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  summaryTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
  summaryTitle.alignment = { horizontal: 'center' };

  // Summary totals
  const summaryData = [
    ['', ''],
    ['Total de Gastos / Total Expenses', summary.totalExpenses],
    ['Total Deducible / Total Deductible', summary.totalDeductible],
    ['Total Reembolsable / Total Reimbursable', summary.totalReimbursable],
    ['Total No Deducible / Total Non-Deductible', summary.totalNonDeductible],
    ['', ''],
    ['DESGLOSE POR CATEGORÍA / BREAKDOWN BY CATEGORY', '', '', ''],
  ];

  summaryData.forEach((row, idx) => {
    summarySheet.getCell(3 + idx, 1).value = row[0];
    if (row[1] !== undefined && row[1] !== '') {
      const valueCell = summarySheet.getCell(3 + idx, 2);
      valueCell.value = row[1];
      if (typeof row[1] === 'number') {
        valueCell.numFmt = '"$"#,##0.00';
      }
    }
  });

  // Category headers
  const catHeaderRow = 10;
  ['Categoría', 'Total', 'Deducible', 'Cantidad'].forEach((header, idx) => {
    const cell = summarySheet.getCell(catHeaderRow, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } };
  });

  // Category data
  let catRowOffset = 0;
  Object.entries(summary.categoryTotals).forEach(([cat, data], idx) => {
    const row = catHeaderRow + 1 + idx;
    summarySheet.getCell(row, 1).value = CATEGORY_LABELS[cat] || cat;
    summarySheet.getCell(row, 2).value = data.total;
    summarySheet.getCell(row, 2).numFmt = '"$"#,##0.00';
    summarySheet.getCell(row, 3).value = data.deductible;
    summarySheet.getCell(row, 3).numFmt = '"$"#,##0.00';
    summarySheet.getCell(row, 4).value = data.count;
    
    if (idx % 2 === 0) {
      for (let c = 1; c <= 4; c++) {
        summarySheet.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
      }
    }
    catRowOffset = idx;
  });

  // CRA Information section
  const craStartRow = catHeaderRow + catRowOffset + 4;
  summarySheet.getCell(craStartRow, 1).value = 'INFORMACIÓN CRA / CRA INFORMATION';
  summarySheet.getCell(craStartRow, 1).font = { bold: true, size: 12 };

  TAX_DEDUCTION_RULES.forEach((rule, idx) => {
    const row = craStartRow + 1 + idx;
    summarySheet.getCell(row, 1).value = CATEGORY_LABELS[rule.category] || rule.category;
    summarySheet.getCell(row, 2).value = `${(rule.deductionRate * 100).toFixed(0)}%`;
    summarySheet.getCell(row, 3).value = rule.description;
  });

  // Footer notes
  const footerRow = craStartRow + TAX_DEDUCTION_RULES.length + 3;
  summarySheet.getCell(footerRow, 1).value = `Fecha de Exportación / Export Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
  summarySheet.getCell(footerRow + 2, 1).value = 'NOTA: Este reporte es para referencia. Consulte con un contador para su declaración de impuestos oficial.';
  summarySheet.getCell(footerRow + 3, 1).value = 'NOTE: This report is for reference. Consult with an accountant for your official tax filing.';

  summarySheet.columns = [
    { width: 45 }, { width: 20 }, { width: 50 }, { width: 15 }
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

export function exportToJSON(expenses: ExpenseWithRelations[], filename: string = 'expenses'): void {
  const rows = expenses.map(formatExpenseForExport);
  
  if (rows.length === 0) {
    throw new Error('No hay gastos para exportar');
  }

  const summary = calculateSummary(expenses);
  
  const exportData = {
    exportDate: format(new Date(), 'yyyy-MM-dd HH:mm'),
    totalRecords: rows.length,
    summary: {
      totalExpenses: summary.totalExpenses,
      totalDeductible: summary.totalDeductible,
      totalReimbursable: summary.totalReimbursable,
      totalNonDeductible: summary.totalNonDeductible,
      byCategory: Object.entries(summary.categoryTotals).map(([cat, data]) => ({
        category: CATEGORY_LABELS[cat] || cat,
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
    exportToCSV(expenses, filename);
  } else if (options.format === 'json') {
    exportToJSON(expenses, filename);
  } else if (options.format === 'pdf') {
    exportExpensesToPDF(expenses, { year: options.year });
  } else {
    await exportToExcel(expenses, filename);
  }
}
