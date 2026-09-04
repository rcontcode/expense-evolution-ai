import { porcentaje } from '@/lib/numeros';
import { useState, useMemo } from 'react';
import { useIncome } from './useIncome';
import { useExpenses } from './useExpenses';
import { useAssets, useLiabilities } from './useNetWorth';
import { fechaLocal } from '@/lib/fecha';
import {
  clamp, MAX_PROJECTION_YEARS, MIN_AGE, MAX_AGE,
  MIN_RETURN_RATE, MAX_RETURN_RATE, MIN_WITHDRAWAL_RATE, MAX_WITHDRAWAL_RATE,
} from '@/lib/constants/resource-limits';

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
    
    // El promedio se divide por los meses que TIENEN datos, no por los meses que lleva el año.
    // Antes se dividia por `currentMonth + 1`: quien empieza a usar la app en agosto veia su
    // sueldo repartido entre ocho meses, o sea un octavo de lo que gana, y la tasa de ahorro y la
    // fecha de independencia financiera salian de ese numero. En el tablero se veia el ingreso
    // mensual diciendo una cifra y este bloque diciendo otra, en la misma pantalla.
    const mesesConMovimiento = new Set<number>();
    for (const inc of incomeData || []) {
      const d = fechaLocal(inc.date);
      if (d.getFullYear() === currentYear) mesesConMovimiento.add(d.getMonth());
    }
    for (const exp of expensesData || []) {
      const d = fechaLocal(exp.date);
      if (d.getFullYear() === currentYear) mesesConMovimiento.add(d.getMonth());
    }
    // Se toma el tramo entre el primer mes con movimiento y hoy: asi un mes intermedio sin gastos
    // sigue contando (y baja el promedio, que es lo correcto), pero los meses anteriores a que la
    // persona empezara a registrar no.
    const primerMes = mesesConMovimiento.size ? Math.min(...mesesConMovimiento) : currentMonth;
    const monthsWithData = Math.max(1, currentMonth - primerMes + 1);

    // Calculate monthly income average
    const yearlyIncome = incomeData
      ?.filter(inc => fechaLocal(inc.date).getFullYear() === currentYear)
      .reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;
    const avgMonthlyIncome = yearlyIncome / monthsWithData;

    // Calculate monthly expenses average
    const yearlyExpenses = expensesData
      ?.filter(exp => fechaLocal(exp.date).getFullYear() === currentYear)
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
    // Clamp all inputs to safe ranges
    const currentAge = clamp(inputs.currentAge, MIN_AGE, MAX_AGE);
    const targetRetirementAge = clamp(inputs.targetRetirementAge, currentAge + 1, MAX_AGE);
    const monthlyExpenses = Math.max(0, inputs.monthlyExpenses);
    const currentSavings = Math.max(0, inputs.currentSavings);
    const expectedAnnualReturn = clamp(inputs.expectedAnnualReturn, MIN_RETURN_RATE, MAX_RETURN_RATE);
    const inflationRate = clamp(inputs.inflationRate, -5, 20);
    const withdrawalRate = clamp(inputs.withdrawalRate, MIN_WITHDRAWAL_RATE, MAX_WITHDRAWAL_RATE);

    // Real return after inflation
    const realReturn = (1 + expectedAnnualReturn / 100) / (1 + inflationRate / 100) - 1;
    const monthlyReturn = realReturn / 12;
    
    // FIRE Number (how much you need to retire)
    const annualExpenses = monthlyExpenses * 12;
    const fireNumber = withdrawalRate > 0 ? annualExpenses / (withdrawalRate / 100) : annualExpenses * 25;
    
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
      // Cuando el retorno real es exactamente cero —pasa con 5% de rendimiento y
      // 5% de inflacion, que no es raro— la formula de la anualidad divide por
      // cero y devuelve NaN. Ahi el ahorro necesario es simplemente el monto
      // repartido en los meses.
      const factor = monthlyReturn === 0
        ? months
        : (Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn;
      monthlySavingsNeeded = factor > 0 ? amountNeeded / factor : 0;
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

    // Si a los 50 anios todavia no llega, no llega: sin ahorro mensual y con
    // retorno real cero o negativo el saldo no crece nunca. Antes se devolvia
    // igual "50 anios" y la pantalla lo mostraba como una meta alcanzable.
    const nuncaLlega = projectedSavings < fireNumber;
    const projectedYears = nuncaLlega ? Infinity : projectedMonths / 12;
    const projectedRetirementAge = nuncaLlega ? Infinity : currentAge + projectedYears;
    
    // Coast FIRE - amount needed now to coast to traditional retirement (65)
    const yearsToTraditional = 65 - currentAge;
    const coastFIRENumber = fireNumber / Math.pow(1 + realReturn, yearsToTraditional);
    // Sin nada ahorrado (o sin retorno real positivo) no hay edad de coast FIRE
    // que calcular: `Math.log(algo / 0)` da infinito y la pantalla escribia
    // "Infinity" donde deberia ir una edad.
    const coastFIREAge = currentSavings >= coastFIRENumber
      ? currentAge
      : currentSavings > 0 && realReturn > 0
        ? currentAge + Math.log(coastFIRENumber / currentSavings) / Math.log(1 + realReturn)
        : Infinity;
    
    // Generate yearly projections (capped at MAX_PROJECTION_YEARS)
    const yearlyProjections: YearlyProjection[] = [];
    let runningBalance = currentSavings;
    const currentYear = new Date().getFullYear();
    const maxYears = Math.min(yearsToTarget + 10, MAX_PROJECTION_YEARS);
    
    for (let i = 0; i <= maxYears; i++) {
      const age = currentAge + i;
      const year = currentYear + i;
      
      yearlyProjections.push({
        age,
        year,
        savings: Math.round(runningBalance),
        fireNumber: Math.round(fireNumber),
        percentComplete: Math.min(porcentaje(runningBalance, fireNumber), 100),
      });
      
      if (runningBalance >= fireNumber && i > yearsToTarget) break;

      // El crecimiento del anio se aplica DESPUES de anotar la fila: la fila de
      // la edad actual tiene que mostrar lo que hay hoy, no lo que habra en un
      // anio. Antes el grafico empezaba adelantado un anio completo.
      for (let month = 0; month < 12; month++) {
        runningBalance = runningBalance * (1 + monthlyReturn) + currentMonthlySavings;
      }
    }
    
    // Progress percentage
    const progressPercentage = Math.min(porcentaje(currentSavings, fireNumber), 100);
    
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
