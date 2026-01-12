import * as XLSX from 'xlsx';
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

export function exportToExcel(expenses: ExpenseWithRelations[], filename: string = 'expenses'): void {
  const rows = expenses.map(formatExpenseForExport);
  
  if (rows.length === 0) {
    throw new Error('No hay gastos para exportar');
  }

  const summary = calculateSummary(expenses);

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: All Expenses
  const ws = XLSX.utils.json_to_sheet(rows);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 25 }, // Vendor
    { wch: 30 }, // Description
    { wch: 25 }, // Category
    { wch: 40 }, // Category (CRA)
    { wch: 12 }, // Amount
    { wch: 8 },  // Currency
    { wch: 20 }, // Status
    { wch: 20 }, // Client
    { wch: 15 }, // Deduction Rate
    { wch: 18 }, // Deductible Amount
    { wch: 20 }, // Non-Deductible Amount
    { wch: 25 }, // Tags
    { wch: 30 }, // Notes
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Gastos / Expenses');

  // Sheet 2: Tax Summary
  const summaryData = [
    ['RESUMEN FISCAL / TAX SUMMARY', ''],
    ['', ''],
    ['Total de Gastos / Total Expenses', `$${summary.totalExpenses.toFixed(2)}`],
    ['Total Deducible / Total Deductible', `$${summary.totalDeductible.toFixed(2)}`],
    ['Total Reembolsable / Total Reimbursable', `$${summary.totalReimbursable.toFixed(2)}`],
    ['Total No Deducible / Total Non-Deductible', `$${summary.totalNonDeductible.toFixed(2)}`],
    ['', ''],
    ['DESGLOSE POR CATEGORÍA / BREAKDOWN BY CATEGORY', '', ''],
    ['Categoría', 'Total', 'Deducible', 'Cantidad'],
  ];

  Object.entries(summary.categoryTotals).forEach(([cat, data]) => {
    summaryData.push([
      CATEGORY_LABELS[cat] || cat,
      `$${data.total.toFixed(2)}`,
      `$${data.deductible.toFixed(2)}`,
      data.count.toString(),
    ]);
  });

  summaryData.push(['', '']);
  summaryData.push(['INFORMACIÓN CRA / CRA INFORMATION', '']);
  summaryData.push(['', '']);
  
  TAX_DEDUCTION_RULES.forEach(rule => {
    summaryData.push([
      CATEGORY_LABELS[rule.category] || rule.category,
      `${(rule.deductionRate * 100).toFixed(0)}%`,
      rule.description,
    ]);
  });

  summaryData.push(['', '']);
  summaryData.push(['Fecha de Exportación / Export Date', format(new Date(), 'yyyy-MM-dd HH:mm')]);
  summaryData.push(['', '']);
  summaryData.push(['NOTA: Este reporte es para referencia. Consulte con un contador para su declaración de impuestos oficial.']);
  summaryData.push(['NOTE: This report is for reference. Consult with an accountant for your official tax filing.']);

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 50 }, { wch: 15 }];
  
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen Fiscal / Tax Summary');

  // Generate and download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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

export function exportExpenses(expenses: ExpenseWithRelations[], options: ExportOptions): void {
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
    exportToExcel(expenses, filename);
  }
}
