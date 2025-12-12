import { useMemo } from 'react';
import { useLiabilities, Liability } from './useNetWorth';

export interface DebtPayoffItem {
  id: string;
  name: string;
  category: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  monthsToPayoff: number;
  totalInterestPaid: number;
  payoffDate: Date;
  payoffOrder: number;
}

export interface DebtStrategy {
  name: 'avalanche' | 'snowball';
  description: string;
  totalMonths: number;
  totalInterestPaid: number;
  debtFreeDate: Date;
  payoffOrder: DebtPayoffItem[];
  monthlySavingsVsMinimum: number;
}

export interface DebtManagerData {
  totalDebt: number;
  totalMinimumPayments: number;
  averageInterestRate: number;
  highestInterestRate: number;
  lowestBalance: number;
  debtsCount: number;
  avalancheStrategy: DebtStrategy | null;
  snowballStrategy: DebtStrategy | null;
  recommendedStrategy: 'avalanche' | 'snowball';
  potentialSavings: number;
  liabilities: Liability[];
  isLoading: boolean;
}

function calculatePayoffSchedule(
  debts: Liability[],
  extraPayment: number,
  strategy: 'avalanche' | 'snowball'
): DebtStrategy {
  if (debts.length === 0) {
    return {
      name: strategy,
      description: '',
      totalMonths: 0,
      totalInterestPaid: 0,
      debtFreeDate: new Date(),
      payoffOrder: [],
      monthlySavingsVsMinimum: 0,
    };
  }

  // Sort debts based on strategy
  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'avalanche') {
      // Highest interest rate first
      return (b.interest_rate || 0) - (a.interest_rate || 0);
    } else {
      // Lowest balance first (snowball)
      return a.current_balance - b.current_balance;
    }
  });

  // Create working copies of debt balances
  const workingDebts = sortedDebts.map((debt, index) => ({
    id: debt.id,
    name: debt.name,
    category: debt.category,
    balance: debt.current_balance,
    interestRate: debt.interest_rate || 0,
    minimumPayment: debt.minimum_payment || Math.max(debt.current_balance * 0.02, 25),
    originalBalance: debt.current_balance,
    paidOff: false,
    payoffMonth: 0,
    totalInterestPaid: 0,
    payoffOrder: index + 1,
  }));

  const totalMinPayments = workingDebts.reduce((sum, d) => sum + d.minimumPayment, 0);
  let monthlyBudget = totalMinPayments + extraPayment;
  let month = 0;
  let totalInterest = 0;
  const maxMonths = 360; // 30 years max

  while (workingDebts.some(d => !d.paidOff) && month < maxMonths) {
    month++;
    let availableExtra = monthlyBudget;

    // Pay minimum on all debts and apply interest
    for (const debt of workingDebts) {
      if (debt.paidOff) continue;

      // Apply monthly interest
      const monthlyInterest = (debt.balance * (debt.interestRate / 100)) / 12;
      debt.balance += monthlyInterest;
      debt.totalInterestPaid += monthlyInterest;
      totalInterest += monthlyInterest;

      // Pay minimum
      const payment = Math.min(debt.minimumPayment, debt.balance);
      debt.balance -= payment;
      availableExtra -= payment;

      if (debt.balance <= 0) {
        debt.balance = 0;
        debt.paidOff = true;
        debt.payoffMonth = month;
        // Free up minimum payment for next debt
        availableExtra += debt.minimumPayment;
      }
    }

    // Apply extra payment to target debt (first non-paid-off in sorted order)
    for (const debt of workingDebts) {
      if (debt.paidOff || availableExtra <= 0) continue;

      const extraPaymentAmount = Math.min(availableExtra, debt.balance);
      debt.balance -= extraPaymentAmount;
      availableExtra -= extraPaymentAmount;

      if (debt.balance <= 0) {
        debt.balance = 0;
        debt.paidOff = true;
        debt.payoffMonth = month;
      }
      break; // Only apply extra to first target debt
    }
  }

  const debtFreeDate = new Date();
  debtFreeDate.setMonth(debtFreeDate.getMonth() + month);

  const payoffOrder: DebtPayoffItem[] = workingDebts.map(debt => {
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + debt.payoffMonth);
    
    return {
      id: debt.id,
      name: debt.name,
      category: debt.category,
      balance: debt.originalBalance,
      interestRate: debt.interestRate,
      minimumPayment: debt.minimumPayment,
      monthsToPayoff: debt.payoffMonth,
      totalInterestPaid: debt.totalInterestPaid,
      payoffDate,
      payoffOrder: debt.payoffOrder,
    };
  });

  return {
    name: strategy,
    description: strategy === 'avalanche' 
      ? 'Paga primero las deudas con mayor tasa de interés para minimizar el interés total pagado.'
      : 'Paga primero las deudas más pequeñas para obtener victorias rápidas y motivación.',
    totalMonths: month,
    totalInterestPaid: totalInterest,
    debtFreeDate,
    payoffOrder: payoffOrder.sort((a, b) => a.monthsToPayoff - b.monthsToPayoff),
    monthlySavingsVsMinimum: 0,
  };
}

export function useDebtManager(extraMonthlyPayment: number = 0): DebtManagerData {
  const { data: liabilities, isLoading } = useLiabilities();

  return useMemo(() => {
    if (!liabilities || liabilities.length === 0) {
      return {
        totalDebt: 0,
        totalMinimumPayments: 0,
        averageInterestRate: 0,
        highestInterestRate: 0,
        lowestBalance: 0,
        debtsCount: 0,
        avalancheStrategy: null,
        snowballStrategy: null,
        recommendedStrategy: 'avalanche',
        potentialSavings: 0,
        liabilities: [],
        isLoading,
      };
    }

    const totalDebt = liabilities.reduce((sum, l) => sum + l.current_balance, 0);
    const totalMinimumPayments = liabilities.reduce(
      (sum, l) => sum + (l.minimum_payment || Math.max(l.current_balance * 0.02, 25)), 
      0
    );
    
    const interestRates = liabilities
      .map(l => l.interest_rate || 0)
      .filter(r => r > 0);
    
    const averageInterestRate = interestRates.length > 0
      ? interestRates.reduce((sum, r) => sum + r, 0) / interestRates.length
      : 0;
    
    const highestInterestRate = Math.max(...liabilities.map(l => l.interest_rate || 0));
    const lowestBalance = Math.min(...liabilities.map(l => l.current_balance));

    // Calculate both strategies
    const avalancheStrategy = calculatePayoffSchedule(liabilities, extraMonthlyPayment, 'avalanche');
    const snowballStrategy = calculatePayoffSchedule(liabilities, extraMonthlyPayment, 'snowball');

    // Calculate potential savings (avalanche vs snowball interest difference)
    const potentialSavings = snowballStrategy.totalInterestPaid - avalancheStrategy.totalInterestPaid;

    // Recommend avalanche if savings are significant, otherwise snowball for psychology
    const recommendedStrategy: 'avalanche' | 'snowball' = 
      potentialSavings > 100 ? 'avalanche' : 'snowball';

    return {
      totalDebt,
      totalMinimumPayments,
      averageInterestRate,
      highestInterestRate,
      lowestBalance,
      debtsCount: liabilities.length,
      avalancheStrategy,
      snowballStrategy,
      recommendedStrategy,
      potentialSavings,
      liabilities,
      isLoading,
    };
  }, [liabilities, extraMonthlyPayment, isLoading]);
}
