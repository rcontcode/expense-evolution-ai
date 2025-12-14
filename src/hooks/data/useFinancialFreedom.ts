import { useMemo } from 'react';
import { useIncome } from './useIncome';
import { useExpenses } from './useExpenses';
import { useAuth } from '@/contexts/AuthContext';

export interface FinancialFreedomResult {
  passiveIncomeMonthly: number;
  activeIncomeMonthly: number;
  totalIncomeMonthly: number;
  monthlyExpenses: number;
  freedomPercentage: number;
  gapToFreedom: number;
  estimatedFreedomDate: Date | null;
  monthsToFreedom: number | null;
  passiveIncomeGrowthRate: number;
  isFinanciallyFree: boolean;
  recommendations: string[];
  isLoading: boolean;
}

// Passive income types based on Kiyosaki's definition
const PASSIVE_INCOME_TYPES = [
  'investment_stocks',
  'investment_crypto',
  'investment_funds',
  'passive_rental',
  'passive_royalties',
];

export function useFinancialFreedom(): FinancialFreedomResult {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const { data: incomeData, isLoading: incomeLoading } = useIncome({ year: currentYear });
  const { data: expensesData, isLoading: expensesLoading } = useExpenses({});

  const result = useMemo(() => {
    // Calculate passive vs active income
    let passiveIncomeTotal = 0;
    let activeIncomeTotal = 0;

    if (incomeData) {
      incomeData.forEach(income => {
        if (PASSIVE_INCOME_TYPES.includes(income.income_type)) {
          passiveIncomeTotal += income.amount;
        } else {
          activeIncomeTotal += income.amount;
        }
      });
    }

    // Calculate monthly averages (based on months elapsed this year)
    const monthsElapsed = currentMonth + 1;
    const passiveIncomeMonthly = passiveIncomeTotal / monthsElapsed;
    const activeIncomeMonthly = activeIncomeTotal / monthsElapsed;
    const totalIncomeMonthly = passiveIncomeMonthly + activeIncomeMonthly;

    // Calculate monthly expenses
    let totalExpenses = 0;
    if (expensesData) {
      expensesData.forEach(expense => {
        totalExpenses += expense.amount;
      });
    }
    const monthlyExpenses = totalExpenses / monthsElapsed;

    // Calculate freedom percentage
    const freedomPercentage = monthlyExpenses > 0 
      ? (passiveIncomeMonthly / monthlyExpenses) * 100 
      : 0;

    // Calculate gap to freedom
    const gapToFreedom = Math.max(0, monthlyExpenses - passiveIncomeMonthly);

    // Estimate time to freedom (assuming 10% annual growth in passive income)
    const annualGrowthRate = 0.10;
    let monthsToFreedom: number | null = null;
    let estimatedFreedomDate: Date | null = null;

    if (passiveIncomeMonthly > 0 && gapToFreedom > 0) {
      // Using compound growth formula: FV = PV * (1 + r)^n
      // We need: passiveIncomeMonthly * (1 + monthlyRate)^n >= monthlyExpenses
      const monthlyGrowthRate = Math.pow(1 + annualGrowthRate, 1/12) - 1;
      
      if (monthlyGrowthRate > 0) {
        const targetRatio = monthlyExpenses / passiveIncomeMonthly;
        monthsToFreedom = Math.ceil(Math.log(targetRatio) / Math.log(1 + monthlyGrowthRate));
        
        if (monthsToFreedom > 0 && monthsToFreedom < 600) { // Cap at 50 years
          estimatedFreedomDate = new Date();
          estimatedFreedomDate.setMonth(estimatedFreedomDate.getMonth() + monthsToFreedom);
        }
      }
    } else if (gapToFreedom === 0 && passiveIncomeMonthly > 0) {
      monthsToFreedom = 0;
      estimatedFreedomDate = new Date();
    }

    const isFinanciallyFree = freedomPercentage >= 100;

    // Generate recommendations
    const recommendations: string[] = [];

    if (freedomPercentage < 10) {
      recommendations.push('Kiyosaki: "La libertad financiera es cuando tus ingresos pasivos superan tus gastos"');
      recommendations.push('Comienza invirtiendo al menos 10% de tu ingreso en activos que generen flujo de efectivo');
    } else if (freedomPercentage < 25) {
      recommendations.push('Buen inicio. Enfócate en aumentar tus inversiones en activos productivos');
      recommendations.push('Considera inversiones en dividendos, bienes raíces o negocios pasivos');
    } else if (freedomPercentage < 50) {
      recommendations.push('¡Excelente progreso! Estás a mitad de camino hacia la libertad');
      recommendations.push('Reinvierte todas las ganancias para acelerar tu progreso');
    } else if (freedomPercentage < 100) {
      recommendations.push('¡Casi libre! Mantén el rumbo y no aumentes tus gastos');
      recommendations.push(`Te faltan $${gapToFreedom.toFixed(0)} mensuales en ingresos pasivos`);
    } else {
      recommendations.push('¡FELICIDADES! Has alcanzado la libertad financiera');
      recommendations.push('Ahora puedes elegir trabajar por pasión, no por necesidad');
    }

    return {
      passiveIncomeMonthly,
      activeIncomeMonthly,
      totalIncomeMonthly,
      monthlyExpenses,
      freedomPercentage,
      gapToFreedom,
      estimatedFreedomDate,
      monthsToFreedom,
      passiveIncomeGrowthRate: annualGrowthRate * 100,
      isFinanciallyFree,
      recommendations,
    };
  }, [incomeData, expensesData, currentMonth]);

  return {
    ...result,
    isLoading: incomeLoading || expensesLoading,
  };
}
