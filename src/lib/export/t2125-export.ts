import * as XLSX from 'xlsx';
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

export function exportT2125Report(expenses: ExpenseWithRelations[], year?: number): void {
  const filteredExpenses = year 
    ? expenses.filter(e => new Date(e.date).getFullYear() === year)
    : expenses;

  const deductibleExpenses = filteredExpenses.filter(e => e.status === 'deductible');
  const lineTotals = calculateT2125Totals(filteredExpenses);
  
  const totalGross = lineTotals.reduce((sum, l) => sum + l.grossAmount, 0);
  const totalDeductible = lineTotals.reduce((sum, l) => sum + l.netDeductible, 0);

  const wb = XLSX.utils.book_new();

  // Sheet 1: T2125 Summary by Line
  const summaryData = [
    ['FORMULARIO T2125 - RESUMEN DE GASTOS DE NEGOCIO'],
    ['T2125 FORM - STATEMENT OF BUSINESS EXPENSES'],
    [''],
    [`Año Fiscal / Tax Year: ${year || 'Todos / All'}`],
    [`Fecha de Generación / Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`],
    [''],
    ['═══════════════════════════════════════════════════════════════════════════'],
    ['PARTE 5 - GASTOS DE NEGOCIO / PART 5 - BUSINESS EXPENSES'],
    ['═══════════════════════════════════════════════════════════════════════════'],
    [''],
    ['Línea', 'Descripción (ES)', 'Description (EN)', 'Monto Bruto', 'Tasa', 'Monto Deducible', 'Cantidad'],
    ['Line', '', '', 'Gross Amount', 'Rate', 'Deductible Amount', 'Count'],
  ];

  lineTotals.forEach(line => {
    summaryData.push([
      line.line,
      line.nameEs,
      line.name,
      `$${line.grossAmount.toFixed(2)}`,
      `${(line.deductionRate * 100).toFixed(0)}%`,
      `$${line.netDeductible.toFixed(2)}`,
      line.expenseCount.toString(),
    ]);
    if (line.note) {
      summaryData.push(['', `  ⚠️ ${line.noteEs}`, `  ⚠️ ${line.note}`, '', '', '', '']);
    }
  });

  summaryData.push(['']);
  summaryData.push(['───────────────────────────────────────────────────────────────────────────']);
  summaryData.push([
    'TOTAL',
    'Total de Gastos de Negocio',
    'Total Business Expenses',
    `$${totalGross.toFixed(2)}`,
    '',
    `$${totalDeductible.toFixed(2)}`,
    deductibleExpenses.length.toString(),
  ]);
  summaryData.push(['']);
  summaryData.push(['═══════════════════════════════════════════════════════════════════════════']);
  summaryData.push(['NOTAS IMPORTANTES / IMPORTANT NOTES']);
  summaryData.push(['═══════════════════════════════════════════════════════════════════════════']);
  summaryData.push(['']);
  summaryData.push(['1. Los montos en "Monto Deducible" ya tienen aplicadas las tasas de deducción CRA']);
  summaryData.push(['   Amounts in "Deductible Amount" already have CRA deduction rates applied']);
  summaryData.push(['']);
  summaryData.push(['2. Comidas y entretenimiento (Línea 8523) solo son 50% deducibles']);
  summaryData.push(['   Meals and entertainment (Line 8523) are only 50% deductible']);
  summaryData.push(['']);
  summaryData.push(['3. CCA (Línea 9281) requiere cálculo separado según la clase del activo']);
  summaryData.push(['   CCA (Line 9281) requires separate calculation based on asset class']);
  summaryData.push(['']);
  summaryData.push(['4. Este reporte es solo para referencia. Consulte con un contador profesional.']);
  summaryData.push(['   This report is for reference only. Consult a professional accountant.']);
  summaryData.push(['']);
  summaryData.push(['Referencia / Reference: https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html']);

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [
    { wch: 8 },   // Line
    { wch: 40 },  // Description ES
    { wch: 40 },  // Description EN
    { wch: 15 },  // Gross
    { wch: 8 },   // Rate
    { wch: 18 },  // Deductible
    { wch: 10 },  // Count
  ];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'T2125 Resumen');

  // Sheet 2: Detailed expenses by T2125 line
  const detailData = [
    ['DETALLE DE GASTOS POR LÍNEA T2125 / EXPENSE DETAILS BY T2125 LINE'],
    [''],
  ];

  lineTotals.forEach(line => {
    detailData.push(['']);
    detailData.push([`═══ LÍNEA ${line.line}: ${line.nameEs} / ${line.name} ═══`]);
    detailData.push(['Fecha', 'Proveedor', 'Descripción', 'Monto', 'Cliente']);

    const lineExpenses = deductibleExpenses.filter(e => {
      const cat = e.category || 'other';
      return CATEGORY_TO_T2125[cat] === line.line || 
             (CATEGORY_TO_T2125[cat] === undefined && line.line === '9270');
    });

    lineExpenses.forEach(exp => {
      detailData.push([
        exp.date,
        exp.vendor || '',
        exp.description || '',
        `$${parseFloat(exp.amount?.toString() || '0').toFixed(2)}`,
        exp.client?.name || '',
      ]);
    });

    detailData.push([
      '',
      '',
      'Subtotal:',
      `$${line.grossAmount.toFixed(2)}`,
      '',
    ]);
  });

  const detailWs = XLSX.utils.aoa_to_sheet(detailData);
  detailWs['!cols'] = [
    { wch: 12 },  // Date
    { wch: 25 },  // Vendor
    { wch: 35 },  // Description
    { wch: 15 },  // Amount
    { wch: 20 },  // Client
  ];
  XLSX.utils.book_append_sheet(wb, detailWs, 'Detalle por Línea');

  // Sheet 3: All deductible expenses raw data
  const rawData = deductibleExpenses.map(exp => ({
    'Fecha / Date': exp.date,
    'Proveedor / Vendor': exp.vendor || '',
    'Descripción / Description': exp.description || '',
    'Categoría / Category': exp.category || '',
    'Línea T2125': CATEGORY_TO_T2125[exp.category || 'other'] || '9270',
    'Monto / Amount': parseFloat(exp.amount?.toString() || '0'),
    'Cliente / Client': exp.client?.name || '',
    'Notas / Notes': exp.notes || '',
  }));

  const rawWs = XLSX.utils.json_to_sheet(rawData);
  rawWs['!cols'] = [
    { wch: 12 }, { wch: 25 }, { wch: 35 }, { wch: 20 },
    { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, rawWs, 'Datos Completos');

  // Generate and download
  const filename = `T2125_Report_${year || 'All'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
