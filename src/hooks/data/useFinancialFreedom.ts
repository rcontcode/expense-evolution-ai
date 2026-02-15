import { useMemo } from 'react';
import { useIncome } from './useIncome';
import { useExpenses } from './useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { startOfYear, endOfYear } from 'date-fns';

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

export function useFinancialFreedom(language: 'es' | 'en' = 'es'): FinancialFreedomResult {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const { data: incomeData, isLoading: incomeLoading } = useIncome({ year: currentYear });
  
  // Fix: filter expenses by current year to avoid distorted calculations
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(new Date());
  const { data: expensesData, isLoading: expensesLoading } = useExpenses({
    dateRange: { start: yearStart, end: yearEnd },
  });

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
      const monthlyGrowthRate = Math.pow(1 + annualGrowthRate, 1/12) - 1;
      
      if (monthlyGrowthRate > 0) {
        const targetRatio = monthlyExpenses / passiveIncomeMonthly;
        monthsToFreedom = Math.ceil(Math.log(targetRatio) / Math.log(1 + monthlyGrowthRate));
        
        if (monthsToFreedom > 0 && monthsToFreedom < 600) {
          estimatedFreedomDate = new Date();
          estimatedFreedomDate.setMonth(estimatedFreedomDate.getMonth() + monthsToFreedom);
        }
      }
    } else if (gapToFreedom === 0 && passiveIncomeMonthly > 0) {
      monthsToFreedom = 0;
      estimatedFreedomDate = new Date();
    }

    const isFinanciallyFree = freedomPercentage >= 100;

    // Generate bilingual recommendations
    const recommendations: string[] = [];

    if (freedomPercentage < 10) {
      recommendations.push(language === 'es' 
        ? 'Kiyosaki: "La libertad financiera es cuando tus ingresos pasivos superan tus gastos"'
        : 'Kiyosaki: "Financial freedom is when your passive income exceeds your expenses"');
      recommendations.push(language === 'es'
        ? 'Comienza invirtiendo al menos 10% de tu ingreso en activos que generen flujo de efectivo'
        : 'Start investing at least 10% of your income in cash-flow generating assets');
    } else if (freedomPercentage < 25) {
      recommendations.push(language === 'es'
        ? 'Buen inicio. Enfócate en aumentar tus inversiones en activos productivos'
        : 'Good start. Focus on increasing your investments in productive assets');
      recommendations.push(language === 'es'
        ? 'Considera inversiones en dividendos, bienes raíces o negocios pasivos'
        : 'Consider investments in dividends, real estate, or passive businesses');
    } else if (freedomPercentage < 50) {
      recommendations.push(language === 'es'
        ? '¡Excelente progreso! Estás a mitad de camino hacia la libertad'
        : 'Excellent progress! You\'re halfway to freedom');
      recommendations.push(language === 'es'
        ? 'Reinvierte todas las ganancias para acelerar tu progreso'
        : 'Reinvest all earnings to accelerate your progress');
    } else if (freedomPercentage < 100) {
      recommendations.push(language === 'es'
        ? '¡Casi libre! Mantén el rumbo y no aumentes tus gastos'
        : 'Almost free! Stay on course and don\'t increase your expenses');
      recommendations.push(language === 'es'
        ? `Te faltan $${gapToFreedom.toFixed(0)} mensuales en ingresos pasivos`
        : `You need $${gapToFreedom.toFixed(0)} more monthly in passive income`);
    } else {
      recommendations.push(language === 'es'
        ? '¡FELICIDADES! Has alcanzado la libertad financiera'
        : 'CONGRATULATIONS! You\'ve achieved financial freedom');
      recommendations.push(language === 'es'
        ? 'Ahora puedes elegir trabajar por pasión, no por necesidad'
        : 'Now you can choose to work for passion, not necessity');
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
  }, [incomeData, expensesData, currentMonth, language]);

  return {
    ...result,
    isLoading: incomeLoading || expensesLoading,
  };
}
