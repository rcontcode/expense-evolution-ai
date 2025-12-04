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

// HST/GST rates by province (default to Ontario 13%)
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

export const DEFAULT_HST_RATE = 0.13; // Ontario default

// Tasas de deducción basadas en CRA (Canada Revenue Agency)
export const TAX_DEDUCTION_RULES: TaxDeductionRule[] = [
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
    description: 'Kilometraje: $0.68/km primeros 5,000 km, $0.62/km después (2024)',
    source: 'CRA - Automobile and Motor Vehicle Allowances',
    sourceUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/benefits-allowances/automobile/automobile-motor-vehicle-allowances/automobile-allowance-rates.html',
  },
];

export const useTaxCalculations = (expenses: any[], hstRate: number = DEFAULT_HST_RATE) => {
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

      // Calculate HST/GST from the total (assuming prices include tax)
      // Formula: HST = Total - (Total / (1 + rate))
      const hstGstInAmount = amount - (amount / (1 + hstRate));

      // Calcular deducción según categoría y estado
      if (expense.status === 'reimbursable') {
        reimbursableAmount += amount;
        // Reimbursable expenses - no ITC claim (client pays)
      } else if (expense.status === 'deductible') {
        const rule = TAX_DEDUCTION_RULES.find((r) => r.category === expense.category);
        const rate = rule?.deductionRate || 1.0;
        const deductible = amount * rate;
        
        deductibleAmount += deductible;
        nonDeductibleAmount += amount - deductible;
        
        // ITC is claimable at the same rate as expense deduction
        const itcForExpense = hstGstInAmount * rate;
        hstGstPaid += hstGstInAmount;
        itcClaimable += itcForExpense;

        // Agregar a breakdown por categoría
        const category = expense.category || 'other';
        const existing = categoryMap.get(category) || { total: 0, deductible: 0, rate, hstGst: 0, itc: 0 };
        categoryMap.set(category, {
          total: existing.total + amount,
          deductible: existing.deductible + deductible,
          rate,
          hstGst: existing.hstGst + hstGstInAmount,
          itc: existing.itc + itcForExpense,
        });
      } else {
        nonDeductibleAmount += amount;
        // Pending/other status - track HST but no ITC until classified
        hstGstPaid += hstGstInAmount;
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
  }, [expenses, hstRate]);

  return { taxSummary, taxRules: TAX_DEDUCTION_RULES, hstRates: HST_GST_RATES };
};
