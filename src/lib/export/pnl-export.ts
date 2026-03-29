import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { getCategoryLabelByLanguage, ExpenseCategory } from '@/lib/constants/expense-categories';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

export interface PnLData {
  year: number;
  language: 'es' | 'en';
  userName?: string;
  businessName?: string;
  incomes: Array<{ amount: number; date: string; income_type: string; source: string | null; description: string | null }>;
  expenses: Array<{ amount: number; date: string; category: string | null; vendor: string | null }>;
}

interface CategoryRow {
  category: string;
  label: string;
  total: number;
  monthly: number[];
}

function buildPnLStructure(data: PnLData) {
  const { year, incomes, expenses, language } = data;
  const l = language === 'es';
  const months = eachMonthOfInterval({ start: startOfYear(new Date(year, 0)), end: endOfYear(new Date(year, 0)) });

  // Group incomes by type
  const incomeTypes: Record<string, { label: string; total: number; monthly: number[] }> = {};
  incomes.forEach(inc => {
    const type = inc.income_type || 'other';
    if (!incomeTypes[type]) {
      incomeTypes[type] = { label: type, total: 0, monthly: new Array(12).fill(0) };
    }
    const m = new Date(inc.date).getMonth();
    incomeTypes[type].total += inc.amount;
    incomeTypes[type].monthly[m] += inc.amount;
  });

  // Group expenses by category
  const expenseCategories: Record<string, CategoryRow> = {};
  expenses.forEach(exp => {
    const cat = exp.category || 'other';
    if (!expenseCategories[cat]) {
      expenseCategories[cat] = {
        category: cat,
        label: getCategoryLabelByLanguage(cat as ExpenseCategory, language) || cat,
        total: 0,
        monthly: new Array(12).fill(0),
      };
    }
    const m = new Date(exp.date).getMonth();
    expenseCategories[cat].total += exp.amount;
    expenseCategories[cat].monthly[m] += exp.amount;
  });

  const totalRevenue = Object.values(incomeTypes).reduce((s, r) => s + r.total, 0);
  const totalExpenses = Object.values(expenseCategories).reduce((s, r) => s + r.total, 0);
  const netIncome = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  // Monthly totals
  const monthlyRevenue = new Array(12).fill(0);
  const monthlyExpenses = new Array(12).fill(0);
  Object.values(incomeTypes).forEach(r => r.monthly.forEach((v, i) => { monthlyRevenue[i] += v; }));
  Object.values(expenseCategories).forEach(r => r.monthly.forEach((v, i) => { monthlyExpenses[i] += v; }));
  const monthlyNet = monthlyRevenue.map((r, i) => r - monthlyExpenses[i]);

  const monthLabels = months.map(m => format(m, 'MMM', { locale: l ? es : enUS }));

  return {
    incomeTypes: Object.values(incomeTypes).sort((a, b) => b.total - a.total),
    expenseCategories: Object.values(expenseCategories).sort((a, b) => b.total - a.total),
    totalRevenue,
    totalExpenses,
    netIncome,
    margin,
    monthlyRevenue,
    monthlyExpenses,
    monthlyNet,
    monthLabels,
  };
}

const INCOME_TYPE_LABELS: Record<string, { es: string; en: string }> = {
  salary: { es: 'Salario', en: 'Salary' },
  client_payment: { es: 'Pago de Cliente', en: 'Client Payment' },
  bonus: { es: 'Bono', en: 'Bonus' },
  gift: { es: 'Regalo', en: 'Gift' },
  refund: { es: 'Reembolso', en: 'Refund' },
  freelance: { es: 'Freelance', en: 'Freelance' },
  investment_stocks: { es: 'Inversión (Acciones)', en: 'Investment (Stocks)' },
  investment_crypto: { es: 'Inversión (Crypto)', en: 'Investment (Crypto)' },
  investment_funds: { es: 'Inversión (Fondos)', en: 'Investment (Funds)' },
  passive_rental: { es: 'Renta Pasiva', en: 'Passive (Rental)' },
  passive_royalties: { es: 'Regalías', en: 'Royalties' },
  online_business: { es: 'Negocio Online', en: 'Online Business' },
  other: { es: 'Otros', en: 'Other' },
};

function getIncomeTypeLabel(type: string, lang: 'es' | 'en'): string {
  return INCOME_TYPE_LABELS[type]?.[lang] || type;
}

// ========== EXCEL EXPORT ==========

export async function exportPnLToExcel(data: PnLData) {
  const l = data.language === 'es';
  const pnl = buildPnLStructure(data);
  const wb = new ExcelJS.Workbook();

  // ---- P&L Sheet ----
  const ws = wb.addWorksheet(l ? 'Estado de Resultados' : 'Profit & Loss');

  // Styles
  const headerFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1a1a2e' } };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  const sectionFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'f0f9ff' } };
  const totalFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ecfdf5' } };
  const netFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: pnl.netIncome >= 0 ? 'dcfce7' : 'fee2e2' } };
  const currFmt = '#,##0.00';

  // Column widths
  ws.columns = [
    { width: 30 },
    ...pnl.monthLabels.map(() => ({ width: 13 })),
    { width: 16 },
  ];

  // Title
  const titleRow = ws.addRow([
    data.businessName || 'EvoFinz',
    ...new Array(12).fill(''),
    '',
  ]);
  titleRow.font = { bold: true, size: 16 };
  ws.mergeCells(titleRow.number, 1, titleRow.number, 14);

  const subtitleRow = ws.addRow([
    `${l ? 'Estado de Resultados' : 'Profit & Loss Statement'} — ${data.year}`,
  ]);
  subtitleRow.font = { size: 12, color: { argb: '666666' } };
  ws.mergeCells(subtitleRow.number, 1, subtitleRow.number, 14);
  ws.addRow([]);

  // Header row
  const hRow = ws.addRow([l ? 'Concepto' : 'Item', ...pnl.monthLabels, 'Total']);
  hRow.eachCell(c => { c.fill = headerFill; c.font = headerFont; c.alignment = { horizontal: 'center' }; });
  hRow.getCell(1).alignment = { horizontal: 'left' };

  // === REVENUE SECTION ===
  const revSection = ws.addRow([l ? '📈 INGRESOS' : '📈 REVENUE']);
  revSection.font = { bold: true, size: 11 };
  revSection.getCell(1).fill = sectionFill;

  pnl.incomeTypes.forEach(inc => {
    const row = ws.addRow([`  ${getIncomeTypeLabel(inc.label, data.language)}`, ...inc.monthly, inc.total]);
    for (let i = 2; i <= 14; i++) row.getCell(i).numFmt = currFmt;
  });

  const totalRevRow = ws.addRow([l ? 'TOTAL INGRESOS' : 'TOTAL REVENUE', ...pnl.monthlyRevenue, pnl.totalRevenue]);
  totalRevRow.font = { bold: true };
  totalRevRow.eachCell(c => { c.fill = totalFill; });
  for (let i = 2; i <= 14; i++) totalRevRow.getCell(i).numFmt = currFmt;

  ws.addRow([]);

  // === EXPENSES SECTION ===
  const expSection = ws.addRow([l ? '📉 GASTOS OPERATIVOS' : '📉 OPERATING EXPENSES']);
  expSection.font = { bold: true, size: 11 };
  expSection.getCell(1).fill = sectionFill;

  pnl.expenseCategories.forEach(cat => {
    const row = ws.addRow([`  ${cat.label}`, ...cat.monthly, cat.total]);
    for (let i = 2; i <= 14; i++) row.getCell(i).numFmt = currFmt;
  });

  const totalExpRow = ws.addRow([l ? 'TOTAL GASTOS' : 'TOTAL EXPENSES', ...pnl.monthlyExpenses, pnl.totalExpenses]);
  totalExpRow.font = { bold: true };
  totalExpRow.eachCell(c => { c.fill = totalFill; });
  for (let i = 2; i <= 14; i++) totalExpRow.getCell(i).numFmt = currFmt;

  ws.addRow([]);

  // === NET INCOME ===
  const netRow = ws.addRow([l ? '💰 RESULTADO NETO' : '💰 NET INCOME', ...pnl.monthlyNet, pnl.netIncome]);
  netRow.font = { bold: true, size: 12 };
  netRow.eachCell(c => { c.fill = netFill; });
  for (let i = 2; i <= 14; i++) netRow.getCell(i).numFmt = currFmt;

  const marginRow = ws.addRow([l ? '  Margen Neto' : '  Net Margin', ...pnl.monthlyNet.map((n, i) => pnl.monthlyRevenue[i] > 0 ? n / pnl.monthlyRevenue[i] : 0), pnl.margin / 100]);
  for (let i = 2; i <= 14; i++) marginRow.getCell(i).numFmt = '0.0%';

  // Footer
  ws.addRow([]);
  const footerRow = ws.addRow([`${l ? 'Generado por' : 'Generated by'} EvoFinz — ${format(new Date(), 'PPp', { locale: l ? es : enUS })}`]);
  footerRow.font = { size: 9, color: { argb: '999999' } };

  // Save
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pnl-${data.year}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ========== PDF EXPORT ==========

export function exportPnLToPDF(data: PnLData) {
  const l = data.language === 'es';
  const pnl = buildPnLStructure(data);
  const doc = new jsPDF({ orientation: 'landscape' });
  const fc = (n: number) => n.toLocaleString(l ? 'es-ES' : 'en-US', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 });

  // Header
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, 297, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(data.businessName || 'EvoFinz', 14, 14);
  doc.setFontSize(11);
  doc.text(`${l ? 'Estado de Resultados' : 'Profit & Loss Statement'} — ${data.year}`, 14, 22);

  // KPI boxes
  doc.setTextColor(0);
  const kpis = [
    { label: l ? 'Ingresos' : 'Revenue', value: fc(pnl.totalRevenue), color: [16, 185, 129] as [number, number, number] },
    { label: l ? 'Gastos' : 'Expenses', value: fc(pnl.totalExpenses), color: [239, 68, 68] as [number, number, number] },
    { label: l ? 'Resultado' : 'Net Income', value: fc(pnl.netIncome), color: pnl.netIncome >= 0 ? [16, 185, 129] as [number, number, number] : [239, 68, 68] as [number, number, number] },
    { label: l ? 'Margen' : 'Margin', value: `${pnl.margin.toFixed(1)}%`, color: [59, 130, 246] as [number, number, number] },
  ];

  let kpiX = 14;
  kpis.forEach(kpi => {
    doc.setFillColor(...kpi.color);
    doc.roundedRect(kpiX, 34, 63, 18, 3, 3, 'F');
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.text(kpi.label, kpiX + 4, 42);
    doc.setFontSize(14);
    doc.text(kpi.value, kpiX + 4, 49);
    kpiX += 68;
  });

  // Revenue table
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text(l ? '📈 Ingresos' : '📈 Revenue', 14, 62);

  autoTable(doc, {
    startY: 65,
    head: [[l ? 'Tipo' : 'Type', ...pnl.monthLabels, 'Total']],
    body: [
      ...pnl.incomeTypes.map(inc => [
        getIncomeTypeLabel(inc.label, data.language),
        ...inc.monthly.map(v => fc(v)),
        fc(inc.total),
      ]),
      [{ content: l ? 'TOTAL' : 'TOTAL', styles: { fontStyle: 'bold' } },
        ...pnl.monthlyRevenue.map(v => ({ content: fc(v), styles: { fontStyle: 'bold' as const } })),
        { content: fc(pnl.totalRevenue), styles: { fontStyle: 'bold' as const } },
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], fontSize: 7 },
    styles: { fontSize: 7, cellPadding: 1.5 },
  });

  // Expenses table
  const expY = doc.lastAutoTable.finalY + 6;
  doc.text(l ? '📉 Gastos Operativos' : '📉 Operating Expenses', 14, expY);

  autoTable(doc, {
    startY: expY + 3,
    head: [[l ? 'Categoría' : 'Category', ...pnl.monthLabels, 'Total']],
    body: [
      ...pnl.expenseCategories.map(cat => [
        cat.label,
        ...cat.monthly.map(v => fc(v)),
        fc(cat.total),
      ]),
      [{ content: l ? 'TOTAL' : 'TOTAL', styles: { fontStyle: 'bold' } },
        ...pnl.monthlyExpenses.map(v => ({ content: fc(v), styles: { fontStyle: 'bold' as const } })),
        { content: fc(pnl.totalExpenses), styles: { fontStyle: 'bold' as const } },
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [239, 68, 68], fontSize: 7 },
    styles: { fontSize: 7, cellPadding: 1.5 },
  });

  // Net Income row
  const netY = doc.lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: netY,
    body: [[
      { content: l ? '💰 RESULTADO NETO' : '💰 NET INCOME', styles: { fontStyle: 'bold' as const } },
      ...pnl.monthlyNet.map(v => ({ content: fc(v), styles: { fontStyle: 'bold' as const, textColor: v >= 0 ? [16, 130, 90] : [200, 50, 50] } })),
      { content: fc(pnl.netIncome), styles: { fontStyle: 'bold' as const, textColor: pnl.netIncome >= 0 ? [16, 130, 90] : [200, 50, 50] } },
    ]],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, fillColor: pnl.netIncome >= 0 ? [220, 252, 231] : [254, 226, 226] },
  });

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `EvoFinz — ${l ? 'Generado' : 'Generated'} ${format(new Date(), 'PPp', { locale: l ? es : enUS })}${data.userName ? ` — ${data.userName}` : ''}`,
    14, pageH - 8
  );

  doc.save(`pnl-${data.year}.pdf`);
}
