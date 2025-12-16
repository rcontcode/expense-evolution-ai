import ExcelJS from 'exceljs';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ExpenseData {
  id: string;
  date: string;
  amount: number;
  vendor?: string | null;
  category?: string | null;
  description?: string | null;
  status?: string | null;
  currency?: string | null;
  notes?: string | null;
  reimbursement_type?: string | null;
  project_id?: string | null;
  contract_id?: string | null;
  client?: { name: string } | null;
}

interface ClientGroup {
  clientId: string;
  clientName: string;
  expenses: ExpenseData[];
  total: number;
  count: number;
  categories: Record<string, { count: number; total: number }>;
}

interface ExportData {
  clientGroups: ClientGroup[];
  totalReimbursable: number;
  totalExpenses: number;
  filteredExpenses: ExpenseData[];
  categoryTotals: Record<string, number>;
  averagePerExpense: number;
  dateRange: { from?: Date; to?: Date };
  language: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  meals: 'Comidas',
  meals_entertainment: 'Comidas y Entretenimiento',
  travel: 'Viajes',
  equipment: 'Equipos',
  software: 'Software',
  mileage: 'Kilometraje',
  home_office: 'Oficina en casa',
  professional_services: 'Servicios profesionales',
  office_supplies: 'Suministros de oficina',
  utilities: 'Servicios públicos',
  fuel: 'Combustible',
  materials: 'Materiales',
  tools: 'Herramientas',
  advertising: 'Publicidad',
  insurance: 'Seguros',
  communications: 'Comunicaciones',
  bank_fees: 'Comisiones Bancarias',
  subscriptions: 'Suscripciones',
  other: 'Otros',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  classified: 'Clasificado',
  deductible: 'Deducible CRA',
  non_deductible: 'No Deducible',
  reimbursable: 'Reembolsable',
  rejected: 'Rechazado',
  under_review: 'En Revisión',
  finalized: 'Finalizado',
  client_reimbursable: 'Reembolsable Cliente'
};

const CHART_COLORS = [
  'FF6384', 'FF9F40', 'FFCD56', '4BC0C0', '36A2EB', 
  '9966FF', 'C9CBCF', '7BC043', 'EE4035', '0392CF'
];

export async function exportReimbursementReportWithCharts(data: ExportData): Promise<void> {
  const { clientGroups, totalReimbursable, totalExpenses, filteredExpenses, categoryTotals, averagePerExpense, dateRange, language } = data;
  const dateLocale = language === 'es' ? es : enUS;
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EvoFinz';
  workbook.created = new Date();
  
  const dateStr = dateRange.from && dateRange.to 
    ? `${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}`
    : format(new Date(), 'yyyy-MM-dd');
  const reportDate = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: dateLocale });
  const periodStart = dateRange.from ? format(dateRange.from, "dd 'de' MMMM 'de' yyyy", { locale: dateLocale }) : 'Sin definir';
  const periodEnd = dateRange.to ? format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: dateLocale }) : 'Sin definir';

  // ========== SHEET 1: RESUMEN EJECUTIVO CON GRÁFICOS ==========
  const summarySheet = workbook.addWorksheet('Resumen Ejecutivo', {
    properties: { tabColor: { argb: '4F46E5' } }
  });

  // Title and header styling
  summarySheet.mergeCells('A1:H1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = '📊 REPORTE DE GASTOS REEMBOLSABLES - EVOFINZ';
  titleCell.font = { bold: true, size: 18, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 35;

  // Report info section
  summarySheet.mergeCells('A3:B3');
  summarySheet.getCell('A3').value = 'INFORMACIÓN DEL REPORTE';
  summarySheet.getCell('A3').font = { bold: true, size: 12, color: { argb: '4F46E5' } };
  
  const infoData = [
    ['Fecha de generación:', reportDate],
    ['Período:', `${periodStart} al ${periodEnd}`],
    ['Total de clientes:', clientGroups.length.toString()],
    ['Total de gastos:', totalExpenses.toString()],
  ];
  
  infoData.forEach((row, idx) => {
    summarySheet.getCell(`A${4 + idx}`).value = row[0];
    summarySheet.getCell(`A${4 + idx}`).font = { bold: true };
    summarySheet.getCell(`B${4 + idx}`).value = row[1];
  });

  // KPI Section with colored boxes
  summarySheet.mergeCells('A9:H9');
  summarySheet.getCell('A9').value = '💰 MÉTRICAS CLAVE';
  summarySheet.getCell('A9').font = { bold: true, size: 14 };
  summarySheet.getCell('A9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8E8E8' } };

  // KPI boxes
  const kpis = [
    { label: 'TOTAL A FACTURAR', value: `$${totalReimbursable.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, color: '10B981' },
    { label: 'GASTOS PROCESADOS', value: totalExpenses.toString(), color: '3B82F6' },
    { label: 'PROMEDIO POR GASTO', value: `$${averagePerExpense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, color: 'F59E0B' },
    { label: 'CLIENTES ACTIVOS', value: clientGroups.length.toString(), color: '8B5CF6' },
  ];

  kpis.forEach((kpi, idx) => {
    const col = String.fromCharCode(65 + (idx * 2)); // A, C, E, G
    const nextCol = String.fromCharCode(66 + (idx * 2)); // B, D, F, H
    summarySheet.mergeCells(`${col}11:${nextCol}11`);
    summarySheet.mergeCells(`${col}12:${nextCol}12`);
    
    const labelCell = summarySheet.getCell(`${col}11`);
    labelCell.value = kpi.label;
    labelCell.font = { bold: true, size: 9, color: { argb: 'FFFFFF' } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.color } };
    labelCell.alignment = { horizontal: 'center' };
    
    const valueCell = summarySheet.getCell(`${col}12`);
    valueCell.value = kpi.value;
    valueCell.font = { bold: true, size: 14, color: { argb: kpi.color } };
    valueCell.alignment = { horizontal: 'center' };
    valueCell.border = { bottom: { style: 'thick', color: { argb: kpi.color } } };
  });

  // ========== DISTRIBUCIÓN POR CATEGORÍA (con datos para gráfico) ==========
  summarySheet.getCell('A15').value = '📈 DISTRIBUCIÓN POR CATEGORÍA';
  summarySheet.getCell('A15').font = { bold: true, size: 12 };
  
  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
  
  // Headers
  const catHeaders = ['Categoría', 'Monto', 'Porcentaje', 'Barra Visual'];
  catHeaders.forEach((header, idx) => {
    const cell = summarySheet.getCell(16, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } };
    cell.alignment = { horizontal: 'center' };
  });

  sortedCategories.forEach(([category, total], idx) => {
    const row = 17 + idx;
    const percentage = totalReimbursable > 0 ? (total / totalReimbursable) * 100 : 0;
    const barLength = Math.round(percentage / 5); // Max 20 chars for 100%
    
    summarySheet.getCell(row, 1).value = CATEGORY_LABELS[category] || category;
    summarySheet.getCell(row, 2).value = total;
    summarySheet.getCell(row, 2).numFmt = '"$"#,##0.00';
    summarySheet.getCell(row, 3).value = percentage / 100;
    summarySheet.getCell(row, 3).numFmt = '0.0%';
    summarySheet.getCell(row, 4).value = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    summarySheet.getCell(row, 4).font = { color: { argb: CHART_COLORS[idx % CHART_COLORS.length] } };
    
    // Alternate row colors
    if (idx % 2 === 0) {
      for (let c = 1; c <= 4; c++) {
        summarySheet.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };
      }
    }
  });

  // ========== TOP CLIENTES ==========
  const clientStartRow = 17 + sortedCategories.length + 2;
  summarySheet.getCell(`A${clientStartRow}`).value = '🏢 TOP CLIENTES POR MONTO';
  summarySheet.getCell(`A${clientStartRow}`).font = { bold: true, size: 12 };
  
  const clientHeaders = ['#', 'Cliente', 'Gastos', 'Monto Total', '% del Total', 'Barra'];
  clientHeaders.forEach((header, idx) => {
    const cell = summarySheet.getCell(clientStartRow + 1, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } };
    cell.alignment = { horizontal: 'center' };
  });

  clientGroups.slice(0, 10).forEach((group, idx) => {
    const row = clientStartRow + 2 + idx;
    const percentage = totalReimbursable > 0 ? (group.total / totalReimbursable) * 100 : 0;
    const barLength = Math.round(percentage / 5);
    
    summarySheet.getCell(row, 1).value = idx + 1;
    summarySheet.getCell(row, 2).value = group.clientName;
    summarySheet.getCell(row, 3).value = group.count;
    summarySheet.getCell(row, 4).value = group.total;
    summarySheet.getCell(row, 4).numFmt = '"$"#,##0.00';
    summarySheet.getCell(row, 5).value = percentage / 100;
    summarySheet.getCell(row, 5).numFmt = '0.0%';
    summarySheet.getCell(row, 6).value = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    summarySheet.getCell(row, 6).font = { color: { argb: CHART_COLORS[idx % CHART_COLORS.length] } };
    
    if (idx % 2 === 0) {
      for (let c = 1; c <= 6; c++) {
        summarySheet.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
      }
    }
  });

  // Column widths
  summarySheet.columns = [
    { width: 30 }, { width: 25 }, { width: 15 }, { width: 25 }, { width: 15 }, { width: 25 }, { width: 15 }, { width: 15 }
  ];

  // ========== SHEET 2: ANÁLISIS POR CLIENTE ==========
  const clientSheet = workbook.addWorksheet('Análisis por Cliente', {
    properties: { tabColor: { argb: '10B981' } }
  });
  
  // Title
  clientSheet.mergeCells('A1:G1');
  clientSheet.getCell('A1').value = '🏢 ANÁLISIS DETALLADO POR CLIENTE';
  clientSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  clientSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
  clientSheet.getCell('A1').alignment = { horizontal: 'center' };
  
  clientSheet.getCell('A2').value = `Generado: ${reportDate}`;
  clientSheet.getCell('A3').value = `Período: ${periodStart} al ${periodEnd}`;

  // Headers
  const cHeaders = ['Cliente', 'Total Gastos', 'Monto Total', 'Promedio', '% del Total', 'Categoría Principal', 'Monto Cat.'];
  cHeaders.forEach((header, idx) => {
    const cell = clientSheet.getCell(5, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
    cell.alignment = { horizontal: 'center' };
    cell.border = { bottom: { style: 'thin' } };
  });

  clientGroups.forEach((group, idx) => {
    const row = 6 + idx;
    const percentage = totalReimbursable > 0 ? (group.total / totalReimbursable) * 100 : 0;
    const topCategory = Object.entries(group.categories).sort(([, a], [, b]) => b.total - a.total)[0];
    
    clientSheet.getCell(row, 1).value = group.clientName;
    clientSheet.getCell(row, 2).value = group.count;
    clientSheet.getCell(row, 3).value = group.total;
    clientSheet.getCell(row, 3).numFmt = '"$"#,##0.00';
    clientSheet.getCell(row, 4).value = group.total / group.count;
    clientSheet.getCell(row, 4).numFmt = '"$"#,##0.00';
    clientSheet.getCell(row, 5).value = percentage / 100;
    clientSheet.getCell(row, 5).numFmt = '0.0%';
    clientSheet.getCell(row, 6).value = topCategory ? (CATEGORY_LABELS[topCategory[0]] || topCategory[0]) : 'N/A';
    clientSheet.getCell(row, 7).value = topCategory ? topCategory[1].total : 0;
    clientSheet.getCell(row, 7).numFmt = '"$"#,##0.00';
    
    // Conditional formatting for percentage
    if (percentage >= 20) {
      clientSheet.getCell(row, 5).font = { bold: true, color: { argb: '059669' } };
    }
    
    if (idx % 2 === 0) {
      for (let c = 1; c <= 7; c++) {
        clientSheet.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0FDF4' } };
      }
    }
  });

  // Total row
  const totalRow = 6 + clientGroups.length;
  clientSheet.getCell(totalRow, 1).value = 'TOTAL GENERAL';
  clientSheet.getCell(totalRow, 1).font = { bold: true };
  clientSheet.getCell(totalRow, 2).value = totalExpenses;
  clientSheet.getCell(totalRow, 2).font = { bold: true };
  clientSheet.getCell(totalRow, 3).value = totalReimbursable;
  clientSheet.getCell(totalRow, 3).numFmt = '"$"#,##0.00';
  clientSheet.getCell(totalRow, 3).font = { bold: true };
  clientSheet.getCell(totalRow, 4).value = averagePerExpense;
  clientSheet.getCell(totalRow, 4).numFmt = '"$"#,##0.00';
  clientSheet.getCell(totalRow, 5).value = 1;
  clientSheet.getCell(totalRow, 5).numFmt = '0%';
  
  for (let c = 1; c <= 7; c++) {
    clientSheet.getCell(totalRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
    clientSheet.getCell(totalRow, c).border = { top: { style: 'double' } };
  }

  clientSheet.columns = [
    { width: 35 }, { width: 15 }, { width: 18 }, { width: 15 }, { width: 12 }, { width: 25 }, { width: 18 }
  ];

  // ========== SHEET 3: ANÁLISIS POR CATEGORÍA ==========
  const catSheet = workbook.addWorksheet('Análisis por Categoría', {
    properties: { tabColor: { argb: 'F59E0B' } }
  });
  
  catSheet.mergeCells('A1:F1');
  catSheet.getCell('A1').value = '📊 ANÁLISIS DETALLADO POR CATEGORÍA';
  catSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  catSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F59E0B' } };
  catSheet.getCell('A1').alignment = { horizontal: 'center' };

  // Calculate category stats
  const categoryStats: Record<string, { count: number; total: number; clients: Set<string> }> = {};
  filteredExpenses.forEach(e => {
    const cat = e.category || 'other';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, total: 0, clients: new Set() };
    }
    categoryStats[cat].count += 1;
    categoryStats[cat].total += Number(e.amount);
    categoryStats[cat].clients.add(e.client?.name || 'Desconocido');
  });

  const categoryHeaders = ['Categoría', 'Cantidad', 'Monto Total', '% del Total', 'Promedio', 'Clientes'];
  categoryHeaders.forEach((header, idx) => {
    const cell = catSheet.getCell(3, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F59E0B' } };
  });

  Object.entries(categoryStats)
    .sort(([, a], [, b]) => b.total - a.total)
    .forEach(([category, stats], idx) => {
      const row = 4 + idx;
      const percentage = totalReimbursable > 0 ? (stats.total / totalReimbursable) * 100 : 0;
      
      catSheet.getCell(row, 1).value = CATEGORY_LABELS[category] || category;
      catSheet.getCell(row, 2).value = stats.count;
      catSheet.getCell(row, 3).value = stats.total;
      catSheet.getCell(row, 3).numFmt = '"$"#,##0.00';
      catSheet.getCell(row, 4).value = percentage / 100;
      catSheet.getCell(row, 4).numFmt = '0.0%';
      catSheet.getCell(row, 5).value = stats.total / stats.count;
      catSheet.getCell(row, 5).numFmt = '"$"#,##0.00';
      catSheet.getCell(row, 6).value = stats.clients.size;
      
      if (idx % 2 === 0) {
        for (let c = 1; c <= 6; c++) {
          catSheet.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEB' } };
        }
      }
    });

  catSheet.columns = [
    { width: 28 }, { width: 12 }, { width: 18 }, { width: 12 }, { width: 18 }, { width: 12 }
  ];

  // ========== SHEET 4: ANÁLISIS MENSUAL CON TENDENCIA ==========
  const monthlySheet = workbook.addWorksheet('Tendencia Mensual', {
    properties: { tabColor: { argb: '3B82F6' } }
  });
  
  monthlySheet.mergeCells('A1:F1');
  monthlySheet.getCell('A1').value = '📈 ANÁLISIS MENSUAL Y TENDENCIA';
  monthlySheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  monthlySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } };
  monthlySheet.getCell('A1').alignment = { horizontal: 'center' };

  // Monthly stats
  const monthlyStats: Record<string, { count: number; total: number }> = {};
  filteredExpenses.forEach(e => {
    const monthKey = format(parseISO(e.date), 'yyyy-MM');
    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = { count: 0, total: 0 };
    }
    monthlyStats[monthKey].count += 1;
    monthlyStats[monthKey].total += Number(e.amount);
  });

  const mHeaders = ['Mes', 'Cantidad', 'Monto Total', '% del Total', 'Promedio', 'Variación', 'Tendencia Visual'];
  mHeaders.forEach((header, idx) => {
    const cell = monthlySheet.getCell(3, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } };
  });

  const sortedMonths = Object.entries(monthlyStats).sort(([a], [b]) => a.localeCompare(b));
  let previousTotal = 0;
  let maxMonthTotal = Math.max(...sortedMonths.map(([, s]) => s.total));

  sortedMonths.forEach(([monthKey, stats], idx) => {
    const row = 4 + idx;
    const monthLabel = format(parseISO(`${monthKey}-01`), "MMMM yyyy", { locale: dateLocale });
    const percentage = totalReimbursable > 0 ? (stats.total / totalReimbursable) * 100 : 0;
    const variation = idx > 0 && previousTotal > 0 
      ? ((stats.total - previousTotal) / previousTotal * 100)
      : 0;
    const barLength = Math.round((stats.total / maxMonthTotal) * 20);
    
    monthlySheet.getCell(row, 1).value = monthLabel;
    monthlySheet.getCell(row, 2).value = stats.count;
    monthlySheet.getCell(row, 3).value = stats.total;
    monthlySheet.getCell(row, 3).numFmt = '"$"#,##0.00';
    monthlySheet.getCell(row, 4).value = percentage / 100;
    monthlySheet.getCell(row, 4).numFmt = '0.0%';
    monthlySheet.getCell(row, 5).value = stats.total / stats.count;
    monthlySheet.getCell(row, 5).numFmt = '"$"#,##0.00';
    
    if (idx === 0) {
      monthlySheet.getCell(row, 6).value = 'N/A';
    } else {
      monthlySheet.getCell(row, 6).value = variation / 100;
      monthlySheet.getCell(row, 6).numFmt = '+0.0%;-0.0%';
      monthlySheet.getCell(row, 6).font = { 
        color: { argb: variation >= 0 ? '10B981' : 'EF4444' },
        bold: true
      };
    }
    
    monthlySheet.getCell(row, 7).value = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    monthlySheet.getCell(row, 7).font = { color: { argb: '3B82F6' } };
    
    previousTotal = stats.total;
    
    if (idx % 2 === 0) {
      for (let c = 1; c <= 7; c++) {
        monthlySheet.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } };
      }
    }
  });

  monthlySheet.columns = [
    { width: 20 }, { width: 12 }, { width: 18 }, { width: 12 }, { width: 15 }, { width: 15 }, { width: 25 }
  ];

  // ========== SHEET 5: ANÁLISIS POR PROVEEDOR ==========
  const vendorSheet = workbook.addWorksheet('Análisis por Proveedor', {
    properties: { tabColor: { argb: '8B5CF6' } }
  });
  
  vendorSheet.mergeCells('A1:G1');
  vendorSheet.getCell('A1').value = '🏪 ANÁLISIS POR PROVEEDOR';
  vendorSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  vendorSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } };
  vendorSheet.getCell('A1').alignment = { horizontal: 'center' };

  const vendorStats: Record<string, { count: number; total: number; categories: Set<string>; clients: Set<string> }> = {};
  filteredExpenses.forEach(e => {
    const vendor = e.vendor || 'Sin especificar';
    if (!vendorStats[vendor]) {
      vendorStats[vendor] = { count: 0, total: 0, categories: new Set(), clients: new Set() };
    }
    vendorStats[vendor].count += 1;
    vendorStats[vendor].total += Number(e.amount);
    vendorStats[vendor].categories.add(CATEGORY_LABELS[e.category || 'other'] || e.category || 'Otro');
    vendorStats[vendor].clients.add(e.client?.name || 'Desconocido');
  });

  const vHeaders = ['Proveedor', 'Transacciones', 'Monto Total', '% Total', 'Promedio', 'Categorías', 'Clientes'];
  vHeaders.forEach((header, idx) => {
    const cell = vendorSheet.getCell(3, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } };
  });

  Object.entries(vendorStats)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 30)
    .forEach(([vendor, stats], idx) => {
      const row = 4 + idx;
      const percentage = totalReimbursable > 0 ? (stats.total / totalReimbursable) * 100 : 0;
      
      vendorSheet.getCell(row, 1).value = vendor;
      vendorSheet.getCell(row, 2).value = stats.count;
      vendorSheet.getCell(row, 3).value = stats.total;
      vendorSheet.getCell(row, 3).numFmt = '"$"#,##0.00';
      vendorSheet.getCell(row, 4).value = percentage / 100;
      vendorSheet.getCell(row, 4).numFmt = '0.0%';
      vendorSheet.getCell(row, 5).value = stats.total / stats.count;
      vendorSheet.getCell(row, 5).numFmt = '"$"#,##0.00';
      vendorSheet.getCell(row, 6).value = Array.from(stats.categories).join(', ');
      vendorSheet.getCell(row, 7).value = Array.from(stats.clients).join(', ');
      
      if (idx % 2 === 0) {
        for (let c = 1; c <= 7; c++) {
          vendorSheet.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F3FF' } };
        }
      }
    });

  vendorSheet.columns = [
    { width: 25 }, { width: 15 }, { width: 18 }, { width: 12 }, { width: 15 }, { width: 35 }, { width: 35 }
  ];

  // ========== SHEET 6: DETALLE COMPLETO ==========
  const detailSheet = workbook.addWorksheet('Detalle Completo', {
    properties: { tabColor: { argb: 'EF4444' } }
  });
  
  detailSheet.mergeCells('A1:M1');
  detailSheet.getCell('A1').value = '📋 DETALLE COMPLETO DE GASTOS REEMBOLSABLES';
  detailSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  detailSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } };
  detailSheet.getCell('A1').alignment = { horizontal: 'center' };
  
  detailSheet.getCell('A2').value = `Período: ${periodStart} al ${periodEnd} | Total: ${filteredExpenses.length} gastos`;

  const dHeaders = ['#', 'Fecha', 'Cliente', 'Proveedor', 'Categoría', 'Descripción', 'Monto', 'Moneda', 'Estado', 'Tipo', 'ID Proyecto', 'ID Contrato', 'Notas'];
  dHeaders.forEach((header, idx) => {
    const cell = detailSheet.getCell(4, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } };
    cell.alignment = { horizontal: 'center' };
  });

  filteredExpenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach((expense, idx) => {
      const row = 5 + idx;
      
      detailSheet.getCell(row, 1).value = idx + 1;
      detailSheet.getCell(row, 2).value = format(parseISO(expense.date), 'dd/MM/yyyy');
      detailSheet.getCell(row, 3).value = expense.client?.name || 'Sin asignar';
      detailSheet.getCell(row, 4).value = expense.vendor || '';
      detailSheet.getCell(row, 5).value = CATEGORY_LABELS[expense.category || 'other'] || expense.category || 'Otro';
      detailSheet.getCell(row, 6).value = expense.description || '';
      detailSheet.getCell(row, 7).value = Number(expense.amount);
      detailSheet.getCell(row, 7).numFmt = '"$"#,##0.00';
      detailSheet.getCell(row, 8).value = expense.currency || 'CAD';
      detailSheet.getCell(row, 9).value = STATUS_LABELS[expense.status || 'pending'] || expense.status || '';
      detailSheet.getCell(row, 10).value = expense.reimbursement_type || 'Sin clasificar';
      detailSheet.getCell(row, 11).value = expense.project_id || '';
      detailSheet.getCell(row, 12).value = expense.contract_id || '';
      detailSheet.getCell(row, 13).value = expense.notes || '';
      
      if (idx % 2 === 0) {
        for (let c = 1; c <= 13; c++) {
          detailSheet.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
        }
      }
    });

  // Total row
  const dTotalRow = 5 + filteredExpenses.length;
  detailSheet.getCell(dTotalRow, 1).value = '';
  detailSheet.getCell(dTotalRow, 2).value = 'TOTAL';
  detailSheet.getCell(dTotalRow, 2).font = { bold: true };
  detailSheet.getCell(dTotalRow, 7).value = totalReimbursable;
  detailSheet.getCell(dTotalRow, 7).numFmt = '"$"#,##0.00';
  detailSheet.getCell(dTotalRow, 7).font = { bold: true };
  for (let c = 1; c <= 13; c++) {
    detailSheet.getCell(dTotalRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FECACA' } };
    detailSheet.getCell(dTotalRow, c).border = { top: { style: 'double' } };
  }

  detailSheet.columns = [
    { width: 5 }, { width: 12 }, { width: 25 }, { width: 20 }, { width: 20 },
    { width: 35 }, { width: 15 }, { width: 8 }, { width: 15 }, { width: 18 },
    { width: 15 }, { width: 15 }, { width: 30 }
  ];

  // Enable filters
  detailSheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4 + filteredExpenses.length, column: 13 }
  };

  // ========== SHEET 7: RANGOS DE MONTOS ==========
  const rangeSheet = workbook.addWorksheet('Rangos de Montos', {
    properties: { tabColor: { argb: '06B6D4' } }
  });
  
  rangeSheet.mergeCells('A1:E1');
  rangeSheet.getCell('A1').value = '💵 DISTRIBUCIÓN POR RANGOS DE MONTOS';
  rangeSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  rangeSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '06B6D4' } };
  rangeSheet.getCell('A1').alignment = { horizontal: 'center' };

  const ranges = [
    { label: '$0 - $50', min: 0, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100 - $250', min: 100, max: 250 },
    { label: '$250 - $500', min: 250, max: 500 },
    { label: '$500 - $1,000', min: 500, max: 1000 },
    { label: '$1,000 - $2,500', min: 1000, max: 2500 },
    { label: '$2,500 - $5,000', min: 2500, max: 5000 },
    { label: '$5,000+', min: 5000, max: Infinity },
  ];

  const rHeaders = ['Rango', 'Cantidad', 'Monto Total', '% del Total', 'Distribución'];
  rHeaders.forEach((header, idx) => {
    const cell = rangeSheet.getCell(3, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '06B6D4' } };
  });

  ranges.forEach((range, idx) => {
    const expensesInRange = filteredExpenses.filter(
      e => Number(e.amount) >= range.min && Number(e.amount) < range.max
    );
    const total = expensesInRange.reduce((sum, e) => sum + Number(e.amount), 0);
    const percentage = totalReimbursable > 0 ? (total / totalReimbursable) * 100 : 0;
    const barLength = Math.round(percentage / 5);
    
    const row = 4 + idx;
    rangeSheet.getCell(row, 1).value = range.label;
    rangeSheet.getCell(row, 2).value = expensesInRange.length;
    rangeSheet.getCell(row, 3).value = total;
    rangeSheet.getCell(row, 3).numFmt = '"$"#,##0.00';
    rangeSheet.getCell(row, 4).value = percentage / 100;
    rangeSheet.getCell(row, 4).numFmt = '0.0%';
    rangeSheet.getCell(row, 5).value = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    rangeSheet.getCell(row, 5).font = { color: { argb: '06B6D4' } };
    
    if (idx % 2 === 0) {
      for (let c = 1; c <= 5; c++) {
        rangeSheet.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFEFF' } };
      }
    }
  });

  rangeSheet.columns = [
    { width: 18 }, { width: 12 }, { width: 18 }, { width: 12 }, { width: 25 }
  ];

  // ========== SHEET 8: CLIENTE-CATEGORÍA MATRIZ ==========
  const matrixSheet = workbook.addWorksheet('Matriz Cliente-Categoría', {
    properties: { tabColor: { argb: 'EC4899' } }
  });
  
  matrixSheet.mergeCells('A1:F1');
  matrixSheet.getCell('A1').value = '🔀 MATRIZ CLIENTE × CATEGORÍA';
  matrixSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  matrixSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EC4899' } };
  matrixSheet.getCell('A1').alignment = { horizontal: 'center' };

  const mxHeaders = ['Cliente', 'Categoría', 'Cantidad', 'Monto', '% Cliente', '% Total'];
  mxHeaders.forEach((header, idx) => {
    const cell = matrixSheet.getCell(3, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EC4899' } };
  });

  let mxRow = 4;
  clientGroups.forEach((group) => {
    Object.entries(group.categories)
      .sort(([, a], [, b]) => b.total - a.total)
      .forEach(([category, catData]) => {
        const clientPct = (catData.total / group.total) * 100;
        const totalPct = totalReimbursable > 0 ? (catData.total / totalReimbursable) * 100 : 0;
        
        matrixSheet.getCell(mxRow, 1).value = group.clientName;
        matrixSheet.getCell(mxRow, 2).value = CATEGORY_LABELS[category] || category;
        matrixSheet.getCell(mxRow, 3).value = catData.count;
        matrixSheet.getCell(mxRow, 4).value = catData.total;
        matrixSheet.getCell(mxRow, 4).numFmt = '"$"#,##0.00';
        matrixSheet.getCell(mxRow, 5).value = clientPct / 100;
        matrixSheet.getCell(mxRow, 5).numFmt = '0.0%';
        matrixSheet.getCell(mxRow, 6).value = totalPct / 100;
        matrixSheet.getCell(mxRow, 6).numFmt = '0.0%';
        
        if ((mxRow - 4) % 2 === 0) {
          for (let c = 1; c <= 6; c++) {
            matrixSheet.getCell(mxRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FDF2F8' } };
          }
        }
        mxRow++;
      });
  });

  matrixSheet.columns = [
    { width: 30 }, { width: 25 }, { width: 12 }, { width: 18 }, { width: 12 }, { width: 12 }
  ];

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-reembolsos-profesional-${dateStr}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
