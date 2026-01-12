import ExcelJS from 'exceljs';
import { ExpenseWithRelations } from '@/types/expense.types';
import { format } from 'date-fns';

// T2125 Form Lines mapping - Part 5: Business expenses
// https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html
export const T2125_LINES = {
  // Part 5 - Calculation of net income (loss)
  '8521': {
    line: '8521',
    name: 'Advertising',
    nameEs: 'Publicidad',
    categories: ['advertising', 'marketing'],
    deductionRate: 1.0,
  },
  '8523': {
    line: '8523',
    name: 'Meals and entertainment',
    nameEs: 'Comidas y entretenimiento',
    categories: ['meals', 'entertainment'],
    deductionRate: 0.5, // 50% deductible
    note: 'Only 50% deductible per CRA rules',
    noteEs: 'Solo 50% deducible según reglas CRA',
  },
  '8590': {
    line: '8590',
    name: 'Bad debts',
    nameEs: 'Deudas incobrables',
    categories: ['bad_debts'],
    deductionRate: 1.0,
  },
  '8690': {
    line: '8690',
    name: 'Insurance',
    nameEs: 'Seguros',
    categories: ['insurance'],
    deductionRate: 1.0,
  },
  '8710': {
    line: '8710',
    name: 'Interest and bank charges',
    nameEs: 'Intereses y cargos bancarios',
    categories: ['bank_charges', 'interest'],
    deductionRate: 1.0,
  },
  '8760': {
    line: '8760',
    name: 'Business taxes, licences, and memberships',
    nameEs: 'Impuestos comerciales, licencias y membresías',
    categories: ['licenses', 'memberships', 'business_taxes'],
    deductionRate: 1.0,
  },
  '8810': {
    line: '8810',
    name: 'Office expenses',
    nameEs: 'Gastos de oficina',
    categories: ['office_supplies', 'software'],
    deductionRate: 1.0,
  },
  '8860': {
    line: '8860',
    name: 'Professional fees (legal, accounting, etc.)',
    nameEs: 'Honorarios profesionales (legal, contabilidad, etc.)',
    categories: ['professional_services'],
    deductionRate: 1.0,
  },
  '8871': {
    line: '8871',
    name: 'Management and administration fees',
    nameEs: 'Honorarios de administración',
    categories: ['management_fees'],
    deductionRate: 1.0,
  },
  '8910': {
    line: '8910',
    name: 'Rent',
    nameEs: 'Alquiler',
    categories: ['rent'],
    deductionRate: 1.0,
  },
  '9060': {
    line: '9060',
    name: 'Salaries, wages, and benefits',
    nameEs: 'Salarios y beneficios',
    categories: ['salaries', 'wages'],
    deductionRate: 1.0,
  },
  '9180': {
    line: '9180',
    name: 'Property taxes',
    nameEs: 'Impuestos de propiedad',
    categories: ['property_taxes'],
    deductionRate: 1.0,
  },
  '9200': {
    line: '9200',
    name: 'Travel expenses',
    nameEs: 'Gastos de viaje',
    categories: ['travel'],
    deductionRate: 1.0,
  },
  '9220': {
    line: '9220',
    name: 'Utilities',
    nameEs: 'Servicios públicos',
    categories: ['utilities'],
    deductionRate: 1.0,
  },
  '9275': {
    line: '9275',
    name: 'Motor vehicle expenses (not including CCA)',
    nameEs: 'Gastos de vehículo (sin CCA)',
    categories: ['mileage', 'vehicle', 'gas', 'parking'],
    deductionRate: 1.0,
  },
  '9281': {
    line: '9281',
    name: 'Capital cost allowance (CCA)',
    nameEs: 'Deducción por costo de capital (CCA)',
    categories: ['equipment'],
    deductionRate: 1.0,
    note: 'Computer equipment typically Class 50 (55%) or Class 10 (30%)',
    noteEs: 'Equipos informáticos típicamente Clase 50 (55%) o Clase 10 (30%)',
  },
  '9270': {
    line: '9270',
    name: 'Other expenses',
    nameEs: 'Otros gastos',
    categories: ['other', 'home_office'],
    deductionRate: 1.0,
  },
};

// Map our app categories to T2125 lines
const CATEGORY_TO_T2125: Record<string, string> = {
  meals: '8523',
  entertainment: '8523',
  travel: '9200',
  equipment: '9281',
  software: '8810',
  office_supplies: '8810',
  utilities: '9220',
  professional_services: '8860',
  home_office: '9270',
  mileage: '9275',
  vehicle: '9275',
  insurance: '8690',
  rent: '8910',
  advertising: '8521',
  other: '9270',
};

interface T2125LineTotal {
  line: string;
  name: string;
  nameEs: string;
  grossAmount: number;
  deductionRate: number;
  netDeductible: number;
  expenseCount: number;
  note?: string;
  noteEs?: string;
}

export function calculateT2125Totals(expenses: ExpenseWithRelations[]): T2125LineTotal[] {
  const lineTotals: Record<string, T2125LineTotal> = {};

  // Initialize all lines with zero
  Object.entries(T2125_LINES).forEach(([lineNum, lineInfo]) => {
    lineTotals[lineNum] = {
      line: lineNum,
      name: lineInfo.name,
      nameEs: lineInfo.nameEs,
      grossAmount: 0,
      deductionRate: lineInfo.deductionRate,
      netDeductible: 0,
      expenseCount: 0,
      note: 'note' in lineInfo ? lineInfo.note : undefined,
      noteEs: 'noteEs' in lineInfo ? lineInfo.noteEs : undefined,
    };
  });

  // Process expenses
  expenses.forEach(expense => {
    if (expense.status !== 'deductible') return;

    const category = expense.category || 'other';
    const lineNum = CATEGORY_TO_T2125[category] || '9270';
    const amount = parseFloat(expense.amount?.toString() || '0');
    const lineInfo = T2125_LINES[lineNum as keyof typeof T2125_LINES];

    if (lineTotals[lineNum]) {
      lineTotals[lineNum].grossAmount += amount;
      lineTotals[lineNum].netDeductible += amount * lineInfo.deductionRate;
      lineTotals[lineNum].expenseCount += 1;
    }
  });

  // Return only lines with amounts, sorted by line number
  return Object.values(lineTotals)
    .filter(line => line.grossAmount > 0)
    .sort((a, b) => parseInt(a.line) - parseInt(b.line));
}

export async function exportT2125Report(expenses: ExpenseWithRelations[], year?: number): Promise<void> {
  const filteredExpenses = year 
    ? expenses.filter(e => new Date(e.date).getFullYear() === year)
    : expenses;

  const deductibleExpenses = filteredExpenses.filter(e => e.status === 'deductible');
  const lineTotals = calculateT2125Totals(filteredExpenses);
  
  const totalGross = lineTotals.reduce((sum, l) => sum + l.grossAmount, 0);
  const totalDeductible = lineTotals.reduce((sum, l) => sum + l.netDeductible, 0);

  // Calculate HST/GST (assuming 13% Ontario HST as default)
  const HST_RATE = 0.13;
  const totalHstGst = totalGross - (totalGross / (1 + HST_RATE));
  const itcClaimable = totalDeductible - (totalDeductible / (1 + HST_RATE));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EvoFinz';
  workbook.created = new Date();

  // ========== Sheet 1: T2125 Summary ==========
  const summarySheet = workbook.addWorksheet('T2125 Resumen', {
    properties: { tabColor: { argb: 'DC2626' } }
  });

  // Title
  summarySheet.mergeCells('A1:G1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = '📋 FORMULARIO T2125 - RESUMEN DE GASTOS DE NEGOCIO';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } };
  titleCell.alignment = { horizontal: 'center' };
  summarySheet.getRow(1).height = 30;

  // Subtitle
  summarySheet.mergeCells('A2:G2');
  summarySheet.getCell('A2').value = 'T2125 FORM - STATEMENT OF BUSINESS EXPENSES';
  summarySheet.getCell('A2').font = { italic: true, color: { argb: '666666' } };
  summarySheet.getCell('A2').alignment = { horizontal: 'center' };

  // Info section
  summarySheet.getCell('A4').value = `Año Fiscal / Tax Year: ${year || 'Todos / All'}`;
  summarySheet.getCell('A4').font = { bold: true };
  summarySheet.getCell('A5').value = `Fecha de Generación / Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;

  // Section header
  summarySheet.mergeCells('A7:G7');
  summarySheet.getCell('A7').value = 'PARTE 5 - GASTOS DE NEGOCIO / PART 5 - BUSINESS EXPENSES';
  summarySheet.getCell('A7').font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
  summarySheet.getCell('A7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '991B1B' } };

  // Headers
  const headers = ['Línea/Line', 'Descripción (ES)', 'Description (EN)', 'Monto Bruto', 'Tasa', 'Monto Deducible', 'Cantidad'];
  headers.forEach((header, idx) => {
    const cell = summarySheet.getCell(9, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'B91C1C' } };
    cell.alignment = { horizontal: 'center' };
  });

  // Data rows
  lineTotals.forEach((line, idx) => {
    const row = 10 + idx;
    summarySheet.getCell(row, 1).value = line.line;
    summarySheet.getCell(row, 2).value = line.nameEs;
    summarySheet.getCell(row, 3).value = line.name;
    summarySheet.getCell(row, 4).value = line.grossAmount;
    summarySheet.getCell(row, 4).numFmt = '"$"#,##0.00';
    summarySheet.getCell(row, 5).value = line.deductionRate;
    summarySheet.getCell(row, 5).numFmt = '0%';
    summarySheet.getCell(row, 6).value = line.netDeductible;
    summarySheet.getCell(row, 6).numFmt = '"$"#,##0.00';
    summarySheet.getCell(row, 7).value = line.expenseCount;

    // Alternate row colors
    if (idx % 2 === 0) {
      for (let c = 1; c <= 7; c++) {
        summarySheet.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
      }
    }

    // Add note if exists
    if (line.note) {
      const noteRow = row + 0.5; // Can't do half rows, we'll add notes separately
    }
  });

  // Totals row
  const totalRow = 10 + lineTotals.length + 1;
  summarySheet.getCell(totalRow, 1).value = 'TOTAL';
  summarySheet.getCell(totalRow, 1).font = { bold: true };
  summarySheet.getCell(totalRow, 2).value = 'Total de Gastos de Negocio';
  summarySheet.getCell(totalRow, 3).value = 'Total Business Expenses';
  summarySheet.getCell(totalRow, 4).value = totalGross;
  summarySheet.getCell(totalRow, 4).numFmt = '"$"#,##0.00';
  summarySheet.getCell(totalRow, 4).font = { bold: true };
  summarySheet.getCell(totalRow, 6).value = totalDeductible;
  summarySheet.getCell(totalRow, 6).numFmt = '"$"#,##0.00';
  summarySheet.getCell(totalRow, 6).font = { bold: true };
  summarySheet.getCell(totalRow, 7).value = deductibleExpenses.length;
  
  for (let c = 1; c <= 7; c++) {
    summarySheet.getCell(totalRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FECACA' } };
    summarySheet.getCell(totalRow, c).border = { top: { style: 'double' } };
  }

  // HST/GST Section
  const hstStartRow = totalRow + 3;
  summarySheet.mergeCells(`A${hstStartRow}:G${hstStartRow}`);
  summarySheet.getCell(`A${hstStartRow}`).value = 'RESUMEN HST/GST - INPUT TAX CREDITS (ITC)';
  summarySheet.getCell(`A${hstStartRow}`).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
  summarySheet.getCell(`A${hstStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0369A1' } };

  const hstData = [
    ['Total HST/GST pagado en gastos deducibles', 'Total HST/GST paid on deductible expenses', totalHstGst],
    ['ITC Reclamable (según tasas de deducción)', 'Claimable ITC (per deduction rates)', itcClaimable],
    ['Tasa de recuperación', 'Recovery rate', totalHstGst > 0 ? (itcClaimable / totalHstGst) : 0],
  ];

  hstData.forEach((row, idx) => {
    const rowNum = hstStartRow + 2 + idx;
    summarySheet.getCell(rowNum, 2).value = row[0];
    summarySheet.getCell(rowNum, 3).value = row[1];
    summarySheet.getCell(rowNum, 4).value = row[2];
    if (idx < 2) {
      summarySheet.getCell(rowNum, 4).numFmt = '"$"#,##0.00';
    } else {
      summarySheet.getCell(rowNum, 4).numFmt = '0.0%';
    }
  });

  // Notes section
  const notesStartRow = hstStartRow + 7;
  const notes = [
    ['1.', 'Los montos en "Monto Deducible" ya tienen aplicadas las tasas de deducción CRA'],
    ['', 'Amounts in "Deductible Amount" already have CRA deduction rates applied'],
    ['2.', 'Comidas y entretenimiento (Línea 8523) solo son 50% deducibles'],
    ['', 'Meals and entertainment (Line 8523) are only 50% deductible'],
    ['3.', 'CCA (Línea 9281) requiere cálculo separado según la clase del activo'],
    ['', 'CCA (Line 9281) requires separate calculation based on asset class'],
    ['4.', 'ITC calculado asumiendo HST 13% (Ontario). Ajustar según su provincia.'],
    ['', 'ITC calculated assuming 13% HST (Ontario). Adjust for your province.'],
    ['5.', 'Este reporte es solo para referencia. Consulte con un contador profesional.'],
    ['', 'This report is for reference only. Consult a professional accountant.'],
  ];

  summarySheet.getCell(notesStartRow, 1).value = 'NOTAS IMPORTANTES / IMPORTANT NOTES';
  summarySheet.getCell(notesStartRow, 1).font = { bold: true };

  notes.forEach((note, idx) => {
    summarySheet.getCell(notesStartRow + 1 + idx, 1).value = note[0];
    summarySheet.getCell(notesStartRow + 1 + idx, 2).value = note[1];
  });

  // References
  const refRow = notesStartRow + notes.length + 3;
  summarySheet.getCell(refRow, 1).value = 'Referencias / References:';
  summarySheet.getCell(refRow, 1).font = { bold: true };
  summarySheet.getCell(refRow + 1, 1).value = 'T2125: https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html';
  summarySheet.getCell(refRow + 2, 1).value = 'ITC: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/complete-file-input-tax-credit.html';

  // Column widths
  summarySheet.columns = [
    { width: 10 }, { width: 40 }, { width: 40 }, { width: 15 }, { width: 10 }, { width: 18 }, { width: 12 }
  ];

  // ========== Sheet 2: Detailed expenses by T2125 line ==========
  const detailSheet = workbook.addWorksheet('Detalle por Línea', {
    properties: { tabColor: { argb: 'F59E0B' } }
  });

  detailSheet.mergeCells('A1:E1');
  detailSheet.getCell('A1').value = '📝 DETALLE DE GASTOS POR LÍNEA T2125';
  detailSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  detailSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F59E0B' } };
  detailSheet.getCell('A1').alignment = { horizontal: 'center' };

  let currentRow = 3;
  lineTotals.forEach(line => {
    // Line header
    detailSheet.mergeCells(`A${currentRow}:E${currentRow}`);
    detailSheet.getCell(`A${currentRow}`).value = `═══ LÍNEA ${line.line}: ${line.nameEs} / ${line.name} ═══`;
    detailSheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FFFFFF' } };
    detailSheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D97706' } };
    currentRow++;

    // Column headers
    ['Fecha', 'Proveedor', 'Descripción', 'Monto', 'Cliente'].forEach((header, idx) => {
      const cell = detailSheet.getCell(currentRow, idx + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
    });
    currentRow++;

    // Line expenses
    const lineExpenses = deductibleExpenses.filter(e => {
      const cat = e.category || 'other';
      return CATEGORY_TO_T2125[cat] === line.line || 
             (CATEGORY_TO_T2125[cat] === undefined && line.line === '9270');
    });

    lineExpenses.forEach(exp => {
      detailSheet.getCell(currentRow, 1).value = exp.date;
      detailSheet.getCell(currentRow, 2).value = exp.vendor || '';
      detailSheet.getCell(currentRow, 3).value = exp.description || '';
      detailSheet.getCell(currentRow, 4).value = parseFloat(exp.amount?.toString() || '0');
      detailSheet.getCell(currentRow, 4).numFmt = '"$"#,##0.00';
      detailSheet.getCell(currentRow, 5).value = exp.client?.name || '';
      currentRow++;
    });

    // Subtotal
    detailSheet.getCell(currentRow, 3).value = 'Subtotal:';
    detailSheet.getCell(currentRow, 3).font = { bold: true };
    detailSheet.getCell(currentRow, 4).value = line.grossAmount;
    detailSheet.getCell(currentRow, 4).numFmt = '"$"#,##0.00';
    detailSheet.getCell(currentRow, 4).font = { bold: true };
    currentRow += 2;
  });

  detailSheet.columns = [
    { width: 12 }, { width: 25 }, { width: 35 }, { width: 15 }, { width: 20 }
  ];

  // ========== Sheet 3: Raw data ==========
  const rawSheet = workbook.addWorksheet('Datos Completos', {
    properties: { tabColor: { argb: '6366F1' } }
  });

  rawSheet.mergeCells('A1:H1');
  rawSheet.getCell('A1').value = '📊 DATOS COMPLETOS DE GASTOS DEDUCIBLES';
  rawSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  rawSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } };
  rawSheet.getCell('A1').alignment = { horizontal: 'center' };

  const rawHeaders = ['Fecha / Date', 'Proveedor / Vendor', 'Descripción', 'Categoría', 'Línea T2125', 'Monto', 'Cliente', 'Notas'];
  rawHeaders.forEach((header, idx) => {
    const cell = rawSheet.getCell(3, idx + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
  });

  deductibleExpenses.forEach((exp, idx) => {
    const row = 4 + idx;
    rawSheet.getCell(row, 1).value = exp.date;
    rawSheet.getCell(row, 2).value = exp.vendor || '';
    rawSheet.getCell(row, 3).value = exp.description || '';
    rawSheet.getCell(row, 4).value = exp.category || '';
    rawSheet.getCell(row, 5).value = CATEGORY_TO_T2125[exp.category || 'other'] || '9270';
    rawSheet.getCell(row, 6).value = parseFloat(exp.amount?.toString() || '0');
    rawSheet.getCell(row, 6).numFmt = '"$"#,##0.00';
    rawSheet.getCell(row, 7).value = exp.client?.name || '';
    rawSheet.getCell(row, 8).value = exp.notes || '';

    if (idx % 2 === 0) {
      for (let c = 1; c <= 8; c++) {
        rawSheet.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EEF2FF' } };
      }
    }
  });

  // Auto filter
  rawSheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3 + deductibleExpenses.length, column: 8 }
  };

  rawSheet.columns = [
    { width: 12 }, { width: 25 }, { width: 35 }, { width: 20 },
    { width: 12 }, { width: 12 }, { width: 20 }, { width: 30 }
  ];

  // Generate and download
  const filename = `T2125_Report_${year || 'All'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
