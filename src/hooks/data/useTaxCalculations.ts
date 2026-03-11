import { useMemo } from 'react';

export interface TaxDeductionRule {
  category: string;
  deductionRate: number;
  description: string;
  source: string;
  sourceUrl: string;
}

export interface TaxSummary {
  totalExpenses: number;
  deductibleAmount: number;
  reimbursableAmount: number;
  nonDeductibleAmount: number;
  hstGstPaid: number;
  itcClaimable: number;
  categoryBreakdown: {
    category: string;
    total: number;
    deductible: number;
    rate: number;
    hstGst: number;
    itc: number;
  }[];
}

// HST/GST rates by province (Canada)
export const HST_GST_RATES: Record<string, number> = {
  ON: 0.13,  // Ontario HST
  BC: 0.12,  // BC PST+GST
  AB: 0.05,  // Alberta GST only
  SK: 0.11,  // Saskatchewan PST+GST
  MB: 0.12,  // Manitoba PST+GST
  QC: 0.14975, // Quebec QST+GST
  NB: 0.15,  // New Brunswick HST
  NS: 0.15,  // Nova Scotia HST
  PE: 0.15,  // PEI HST
  NL: 0.15,  // Newfoundland HST
  NT: 0.05,  // Northwest Territories GST
  NU: 0.05,  // Nunavut GST
  YT: 0.05,  // Yukon GST
};

// Chile: IVA rate (19% uniform across all regions)
export const CHILE_IVA_RATE = 0.19;

export const DEFAULT_HST_RATE = 0.13; // Ontario default

// Canadian CRA deduction rules
export const TAX_DEDUCTION_RULES_CA: TaxDeductionRule[] = [
  {
    category: 'meals',
    deductionRate: 0.5,
    description: 'Comidas y entretenimiento: 50% deducible',
    source: 'CRA - Meals and Entertainment',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/meals-entertainment.html',
  },
  {
    category: 'travel',
    deductionRate: 1.0,
    description: 'Gastos de viaje de negocios: 100% deducible',
    source: 'CRA - Motor Vehicle and Travel Expenses',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/motor-vehicle-expenses.html',
  },
  {
    category: 'equipment',
    deductionRate: 1.0,
    description: 'Equipo de oficina: 100% deducible (vía CCA)',
    source: 'CRA - Capital Cost Allowance',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/claiming-capital-cost-allowance.html',
  },
  {
    category: 'software',
    deductionRate: 1.0,
    description: 'Software y suscripciones: 100% deducible',
    source: 'CRA - Office Expenses',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/office-expenses.html',
  },
  {
    category: 'office_supplies',
    deductionRate: 1.0,
    description: 'Suministros de oficina: 100% deducible',
    source: 'CRA - Office Expenses',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/office-expenses.html',
  },
  {
    category: 'utilities',
    deductionRate: 1.0,
    description: 'Servicios públicos (uso comercial): 100% deducible',
    source: 'CRA - Office Expenses',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/office-expenses.html',
  },
  {
    category: 'professional_services',
    deductionRate: 1.0,
    description: 'Servicios profesionales: 100% deducible',
    source: 'CRA - Professional Fees',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/legal-accounting-other-professional-fees.html',
  },
  {
    category: 'home_office',
    deductionRate: 1.0,
    description: 'Oficina en casa (porción de uso comercial): deducible según área',
    source: 'CRA - Business Use of Home',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/business-use-home-expenses.html',
  },
  {
    category: 'mileage',
    deductionRate: 1.0,
    description: 'Kilometraje: $0.70/km primeros 5,000 km, $0.64/km después (2025)',
    source: 'CRA - Automobile and Motor Vehicle Allowances',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/benefits-allowances/automobile/automobile-motor-vehicle-allowances/automobile-allowance-rates.html',
  },
  {
    category: 'medical',
    deductionRate: 1.0,
    description: 'Gastos médicos: Crédito fiscal por monto que exceda 3% del ingreso neto o $2,635',
    source: 'CRA - Medical Expenses',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/lines-33099-33199-eligible-medical-expenses-you-claim-on-your-tax-return.html',
  },
  {
    category: 'insurance_business',
    deductionRate: 1.0,
    description: 'Seguros de negocio: 100% deducible',
    source: 'CRA - Business Insurance',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/insurance.html',
  },
  {
    category: 'education_training',
    deductionRate: 1.0,
    description: 'Capacitación profesional: 100% deducible si relacionada al negocio',
    source: 'CRA - Training Expenses',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses.html',
  },
  {
    category: 'donations',
    deductionRate: 0.75,
    description: 'Donaciones: Crédito fiscal 15% federal hasta $200, 29% sobre $200',
    source: 'CRA - Charitable Donations',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/charities-giving/giving-charity-information-donors.html',
  },
  {
    category: 'rent',
    deductionRate: 1.0,
    description: 'Arriendo comercial: 100% deducible; residencial proporcional al uso de negocio',
    source: 'CRA - Rent Expenses',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/rent.html',
  },
  {
    category: 'bank_fees',
    deductionRate: 1.0,
    description: 'Comisiones bancarias de cuenta comercial: 100% deducible',
    source: 'CRA - Business Expenses',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses.html',
  },
  {
    category: 'maintenance_repairs',
    deductionRate: 1.0,
    description: 'Mantención y reparaciones de bienes de negocio: 100% deducible',
    source: 'CRA - Maintenance and Repairs',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/maintenance-repairs.html',
  },
  {
    category: 'moving',
    deductionRate: 1.0,
    description: 'Gastos de mudanza: Deducible si mudanza >40km más cerca del trabajo/negocio',
    source: 'CRA - Moving Expenses',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-21900-moving-expenses.html',
  },
  {
    category: 'interest_loans',
    deductionRate: 1.0,
    description: 'Intereses de préstamos comerciales: 100% deducible',
    source: 'CRA - Interest and Bank Charges',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/interest-bank-charges.html',
  },
  {
    category: 'vehicle_maintenance',
    deductionRate: 1.0,
    description: 'Mantención de vehículo: Proporcional al uso comercial',
    source: 'CRA - Motor Vehicle Expenses',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/motor-vehicle-expenses.html',
  },
  {
    category: 'parking_tolls',
    deductionRate: 1.0,
    description: 'Estacionamiento y peajes de negocio: 100% deducible',
    source: 'CRA - Motor Vehicle Expenses',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/motor-vehicle-expenses.html',
  },
  {
    category: 'telephone',
    deductionRate: 1.0,
    description: 'Teléfono: Proporcional al uso comercial',
    source: 'CRA - Telephone and Utilities',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/business-expenses/telephone-utilities.html',
  },
];

// Chilean SII deduction rules
export const TAX_DEDUCTION_RULES_CL: TaxDeductionRule[] = [
  {
    category: 'meals',
    deductionRate: 0.0,
    description: 'Alimentación: No deducible (excepto colaciones empleados)',
    source: 'SII - Gastos Rechazados',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0574.htm',
  },
  {
    category: 'travel',
    deductionRate: 1.0,
    description: 'Viajes de negocio: 100% deducible con respaldo',
    source: 'SII - Gastos Necesarios',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'equipment',
    deductionRate: 1.0,
    description: 'Equipos: 100% deducible (depreciación según tabla SII)',
    source: 'SII - Depreciación',
    sourceUrl: 'https://www.sii.cl/valores_y_fechas/tabla_702.htm',
  },
  {
    category: 'software',
    deductionRate: 1.0,
    description: 'Software y suscripciones: 100% deducible',
    source: 'SII - Gastos Necesarios',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'office_supplies',
    deductionRate: 1.0,
    description: 'Suministros de oficina: 100% deducible',
    source: 'SII - Gastos Necesarios',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'utilities',
    deductionRate: 1.0,
    description: 'Servicios básicos (uso comercial): 100% deducible',
    source: 'SII - Gastos Necesarios',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'professional_services',
    deductionRate: 1.0,
    description: 'Honorarios profesionales: 100% deducible',
    source: 'SII - Honorarios',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0666.htm',
  },
  {
    category: 'home_office',
    deductionRate: 0.5,
    description: 'Oficina en casa: 50% deducible (proporcional uso comercial)',
    source: 'SII - Gastos Proporcionales',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'mileage',
    deductionRate: 1.0,
    description: 'Vehículo: Gastos reales con respaldo (combustible, mantención)',
    source: 'SII - Gastos de Vehículo',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'representation',
    deductionRate: 0.01,
    description: 'Gastos de representación: Límite 1% de ingresos brutos',
    source: 'SII - Gastos de Representación',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0574.htm',
  },
  {
    category: 'medical',
    deductionRate: 1.0,
    description: 'Gastos médicos: Deducible vía crédito Isapre/Fonasa (7% cotización)',
    source: 'SII - Créditos Personales',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'insurance_business',
    deductionRate: 1.0,
    description: 'Seguros de negocio: 100% deducible como gasto necesario',
    source: 'SII - Gastos Necesarios',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'education_training',
    deductionRate: 1.0,
    description: 'Capacitación: 100% deducible (Ley SENCE o gasto necesario)',
    source: 'SII - Capacitación',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'donations',
    deductionRate: 0.5,
    description: 'Donaciones: Crédito fiscal 50% según Ley de Donaciones',
    source: 'SII - Donaciones',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/donaciones/001_001_0001.htm',
  },
  {
    category: 'rent',
    deductionRate: 1.0,
    description: 'Arriendo comercial: 100% deducible como gasto necesario',
    source: 'SII - Arriendos',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'bank_fees',
    deductionRate: 1.0,
    description: 'Comisiones bancarias: 100% deducible',
    source: 'SII - Gastos Financieros',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'maintenance_repairs',
    deductionRate: 1.0,
    description: 'Mantención y reparaciones: 100% deducible con factura',
    source: 'SII - Gastos Necesarios',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'interest_loans',
    deductionRate: 1.0,
    description: 'Intereses de créditos comerciales: 100% deducible',
    source: 'SII - Gastos Financieros',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'vehicle_maintenance',
    deductionRate: 1.0,
    description: 'Mantención vehículo: Deducible según uso comercial demostrable',
    source: 'SII - Gastos de Vehículo',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'parking_tolls',
    deductionRate: 1.0,
    description: 'Estacionamiento y peajes: Deducible con respaldo de uso comercial',
    source: 'SII - Gastos de Vehículo',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
  {
    category: 'telephone',
    deductionRate: 1.0,
    description: 'Teléfono: Proporcional al uso comercial',
    source: 'SII - Gastos Necesarios',
    sourceUrl: 'https://www.sii.cl/preguntas_frecuentes/renta/001_002_0560.htm',
  },
];

// Legacy export for backwards compatibility
export const TAX_DEDUCTION_RULES = TAX_DEDUCTION_RULES_CA;

export const getTaxDeductionRules = (country: string = 'CA'): TaxDeductionRule[] => {
  return country === 'CL' ? TAX_DEDUCTION_RULES_CL : TAX_DEDUCTION_RULES_CA;
};

export const getTaxRate = (country: string, province: string): number => {
  if (country === 'CL') {
    return CHILE_IVA_RATE;
  }
  return HST_GST_RATES[province] || DEFAULT_HST_RATE;
};

export const useTaxCalculations = (
  expenses: any[], 
  hstRate: number = DEFAULT_HST_RATE,
  country: string = 'CA'
) => {
  const taxRules = getTaxDeductionRules(country);

  const taxSummary = useMemo((): TaxSummary => {
    let totalExpenses = 0;
    let deductibleAmount = 0;
    let reimbursableAmount = 0;
    let nonDeductibleAmount = 0;
    let hstGstPaid = 0;
    let itcClaimable = 0;

    const categoryMap = new Map<string, { total: number; deductible: number; rate: number; hstGst: number; itc: number }>();

    expenses.forEach((expense) => {
      const amount = parseFloat(expense.amount.toString());
      totalExpenses += amount;

      // Calculate HST/GST/IVA from the total (assuming prices include tax)
      const taxInAmount = amount - (amount / (1 + hstRate));

      if (expense.status === 'reimbursable') {
        reimbursableAmount += amount;
      } else if (expense.status === 'deductible') {
        const rule = taxRules.find((r) => r.category === expense.category);
        const rate = rule?.deductionRate || 1.0;
        const deductible = amount * rate;
        
        deductibleAmount += deductible;
        nonDeductibleAmount += amount - deductible;
        
        const itcForExpense = taxInAmount * rate;
        hstGstPaid += taxInAmount;
        itcClaimable += itcForExpense;

        const category = expense.category || 'other';
        const existing = categoryMap.get(category) || { total: 0, deductible: 0, rate, hstGst: 0, itc: 0 };
        categoryMap.set(category, {
          total: existing.total + amount,
          deductible: existing.deductible + deductible,
          rate,
          hstGst: existing.hstGst + taxInAmount,
          itc: existing.itc + itcForExpense,
        });
      } else {
        nonDeductibleAmount += amount;
        hstGstPaid += taxInAmount;
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
    }));

    return {
      totalExpenses,
      deductibleAmount,
      reimbursableAmount,
      nonDeductibleAmount,
      hstGstPaid,
      itcClaimable,
      categoryBreakdown,
    };
  }, [expenses, hstRate, taxRules]);

  return { 
    taxSummary, 
    taxRules, 
    hstRates: HST_GST_RATES,
    ivaRate: CHILE_IVA_RATE 
  };
};
