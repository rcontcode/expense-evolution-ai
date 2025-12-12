import { useState, useMemo } from 'react';
import { useIncome } from './useIncome';
import { useExpenses } from './useExpenses';
import { useAssets, useLiabilities } from './useNetWorth';

export interface FIREInputs {
  currentAge: number;
  targetRetirementAge: number;
  monthlyExpenses: number;
  currentSavings: number;
  expectedAnnualReturn: number;
  inflationRate: number;
  withdrawalRate: number;
}

export interface FIREResults {
  fireNumber: number;
  yearsToFIRE: number;
  monthsToFIRE: number;
  monthlySavingsNeeded: number;
  projectedRetirementAge: number;
  currentSavingsRate: number;
  coastFIRENumber: number;
  coastFIREAge: number;
  leanFIRENumber: number;
  fatFIRENumber: number;
  yearlyProjections: YearlyProjection[];
  onTrack: boolean;
  progressPercentage: number;
}

export interface YearlyProjection {
  age: number;
  year: number;
  savings: number;
  fireNumber: number;
  percentComplete: number;
}

const DEFAULT_INPUTS: FIREInputs = {
  currentAge: 30,
  targetRetirementAge: 55,
  monthlyExpenses: 4000,
  currentSavings: 50000,
  expectedAnnualReturn: 7,
  inflationRate: 2.5,
  withdrawalRate: 4,
};

export function useFIRECalculator() {
  const [inputs, setInputs] = useState<FIREInputs>(DEFAULT_INPUTS);
  
  const { data: incomeData } = useIncome({ year: new Date().getFullYear() });
  const { data: expensesData } = useExpenses({});
  const { data: assetsData } = useAssets();
  const { data: liabilitiesData } = useLiabilities();
  
  const totalAssets = assetsData?.reduce((sum, a) => sum + Number(a.current_value), 0) || 0;
  const totalLiabilities = liabilitiesData?.reduce((sum, l) => sum + Number(l.current_balance), 0) || 0;

  // Calculate actual monthly income and expenses from data
  const actualFinancials = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Calculate monthly income average
    const yearlyIncome = incomeData?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;
    const monthsWithData = currentMonth + 1;
    const avgMonthlyIncome = yearlyIncome / monthsWithData;
    
    // Calculate monthly expenses average
    const yearlyExpenses = expensesData
      ?.filter(exp => new Date(exp.date).getFullYear() === currentYear)
      .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
    const avgMonthlyExpenses = yearlyExpenses / monthsWithData;
    
    // Current net worth
    const netWorth = totalAssets - totalLiabilities;
    
    // Savings rate
    const monthlySavings = avgMonthlyIncome - avgMonthlyExpenses;
    const savingsRate = avgMonthlyIncome > 0 ? (monthlySavings / avgMonthlyIncome) * 100 : 0;
    
    return {
      avgMonthlyIncome,
      avgMonthlyExpenses,
      monthlySavings,
      savingsRate,
      netWorth,
    };
  }, [incomeData, expensesData, totalAssets, totalLiabilities]);

  const results = useMemo((): FIREResults => {
    const {
      currentAge,
      targetRetirementAge,
      monthlyExpenses,
      currentSavings,
      expectedAnnualReturn,
      inflationRate,
      withdrawalRate,
    } = inputs;

    // Real return after inflation
    const realReturn = (1 + expectedAnnualReturn / 100) / (1 + inflationRate / 100) - 1;
    const monthlyReturn = realReturn / 12;
    
    // FIRE Number (how much you need to retire)
    const annualExpenses = monthlyExpenses * 12;
    const fireNumber = annualExpenses / (withdrawalRate / 100);
    
    // Lean FIRE (50% of expenses) and Fat FIRE (150% of expenses)
    const leanFIRENumber = (annualExpenses * 0.5) / (withdrawalRate / 100);
    const fatFIRENumber = (annualExpenses * 1.5) / (withdrawalRate / 100);
    
    // Years until target retirement
    const yearsToTarget = targetRetirementAge - currentAge;
    
    // Calculate monthly savings needed to reach FIRE by target age
    // Using future value of annuity formula: FV = PMT * ((1 + r)^n - 1) / r + PV * (1 + r)^n
    // Solving for PMT: PMT = (FV - PV * (1 + r)^n) * r / ((1 + r)^n - 1)
    const months = yearsToTarget * 12;
    const futureValueCurrentSavings = currentSavings * Math.pow(1 + monthlyReturn, months);
    const amountNeeded = fireNumber - futureValueCurrentSavings;
    
    let monthlySavingsNeeded = 0;
    if (amountNeeded > 0 && months > 0) {
      const factor = (Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn;
      monthlySavingsNeeded = amountNeeded / factor;
    }
    
    // Calculate when they'll actually reach FIRE with current savings rate
    const currentMonthlySavings = actualFinancials.monthlySavings > 0 
      ? actualFinancials.monthlySavings 
      : monthlySavingsNeeded * 0.5; // Assume 50% if no data
    
    let projectedMonths = 0;
    let projectedSavings = currentSavings;
    const maxMonths = 600; // 50 years max
    
    while (projectedSavings < fireNumber && projectedMonths < maxMonths) {
      projectedSavings = projectedSavings * (1 + monthlyReturn) + currentMonthlySavings;
      projectedMonths++;
    }
    
    const projectedYears = projectedMonths / 12;
    const projectedRetirementAge = currentAge + projectedYears;
    
    // Coast FIRE - amount needed now to coast to traditional retirement (65)
    const yearsToTraditional = 65 - currentAge;
    const coastFIRENumber = fireNumber / Math.pow(1 + realReturn, yearsToTraditional);
    const coastFIREAge = currentSavings >= coastFIRENumber ? currentAge : 
      currentAge + Math.log(coastFIRENumber / currentSavings) / Math.log(1 + realReturn);
    
    // Generate yearly projections
    const yearlyProjections: YearlyProjection[] = [];
    let runningBalance = currentSavings;
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i <= yearsToTarget + 10; i++) {
      const age = currentAge + i;
      const year = currentYear + i;
      
      // Compound growth + monthly contributions for the year
      for (let month = 0; month < 12; month++) {
        runningBalance = runningBalance * (1 + monthlyReturn) + currentMonthlySavings;
      }
      
      yearlyProjections.push({
        age,
        year,
        savings: Math.round(runningBalance),
        fireNumber: Math.round(fireNumber),
        percentComplete: Math.min((runningBalance / fireNumber) * 100, 100),
      });
      
      if (runningBalance >= fireNumber && i > yearsToTarget) break;
    }
    
    // Progress percentage
    const progressPercentage = Math.min((currentSavings / fireNumber) * 100, 100);
    
    // On track if projected retirement age <= target
    const onTrack = projectedRetirementAge <= targetRetirementAge;
    
    return {
      fireNumber: Math.round(fireNumber),
      yearsToFIRE: Math.round(projectedYears * 10) / 10,
      monthsToFIRE: projectedMonths,
      monthlySavingsNeeded: Math.round(monthlySavingsNeeded),
      projectedRetirementAge: Math.round(projectedRetirementAge * 10) / 10,
      currentSavingsRate: Math.round(actualFinancials.savingsRate * 10) / 10,
      coastFIRENumber: Math.round(coastFIRENumber),
      coastFIREAge: Math.round(coastFIREAge * 10) / 10,
      leanFIRENumber: Math.round(leanFIRENumber),
      fatFIRENumber: Math.round(fatFIRENumber),
      yearlyProjections,
      onTrack,
      progressPercentage: Math.round(progressPercentage * 10) / 10,
    };
  }, [inputs, actualFinancials]);

  const updateInputs = (newInputs: Partial<FIREInputs>) => {
    setInputs(prev => ({ ...prev, ...newInputs }));
  };

  const initializeFromData = () => {
    setInputs(prev => ({
      ...prev,
      currentSavings: actualFinancials.netWorth > 0 ? actualFinancials.netWorth : prev.currentSavings,
      monthlyExpenses: actualFinancials.avgMonthlyExpenses > 0 ? Math.round(actualFinancials.avgMonthlyExpenses) : prev.monthlyExpenses,
    }));
  };

  return {
    inputs,
    results,
    actualFinancials,
    updateInputs,
    initializeFromData,
  };
}
