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
  categoryBreakdown: {
    category: string;
    total: number;
    deductible: number;
    rate: number;
  }[];
}

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

export const useTaxCalculations = (expenses: any[]) => {
  const taxSummary = useMemo((): TaxSummary => {
    let totalExpenses = 0;
    let deductibleAmount = 0;
    let reimbursableAmount = 0;
    let nonDeductibleAmount = 0;

    const categoryMap = new Map<string, { total: number; deductible: number; rate: number }>();

    expenses.forEach((expense) => {
      const amount = parseFloat(expense.amount.toString());
      totalExpenses += amount;

      // Calcular deducción según categoría y estado
      if (expense.status === 'reimbursable') {
        reimbursableAmount += amount;
      } else if (expense.status === 'deductible') {
        const rule = TAX_DEDUCTION_RULES.find((r) => r.category === expense.category);
        const rate = rule?.deductionRate || 1.0;
        const deductible = amount * rate;
        
        deductibleAmount += deductible;
        nonDeductibleAmount += amount - deductible;

        // Agregar a breakdown por categoría
        const category = expense.category || 'other';
        const existing = categoryMap.get(category) || { total: 0, deductible: 0, rate };
        categoryMap.set(category, {
          total: existing.total + amount,
          deductible: existing.deductible + deductible,
          rate,
        });
      } else {
        nonDeductibleAmount += amount;
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
      categoryBreakdown,
    };
  }, [expenses]);

  return { taxSummary, taxRules: TAX_DEDUCTION_RULES };
};
