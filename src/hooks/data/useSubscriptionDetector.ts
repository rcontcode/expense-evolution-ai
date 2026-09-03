import { useMemo } from 'react';
import { ExpenseWithRelations } from '@/types/expense.types';
import { BankTransaction } from '@/hooks/data/useBankTransactions';
import { differenceInDays, format, parseISO } from 'date-fns';
import { esSalidaDeDinero } from '@/lib/banking/direccion-del-movimiento';

export interface DetectedSubscription {
  vendor: string;
  averageAmount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  occurrences: number;
  lastDate: string;
  totalSpent: number;
  annualizedCost: number;
  category: string | null;
  expenses: ExpenseWithRelations[];
  confidence: number; // 0-100 confidence score
  source: 'expenses' | 'bank' | 'both';
}

interface GroupedExpense {
  vendor: string;
  expenses: ExpenseWithRelations[];
  amounts: number[];
  dates: Date[];
}

function calculateFrequency(dates: Date[]): { frequency: DetectedSubscription['frequency'] | null; confidence: number } {
  if (dates.length < 2) return { frequency: null, confidence: 0 };

  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const intervals: number[] = [];

  for (let i = 1; i < sortedDates.length; i++) {
    intervals.push(differenceInDays(sortedDates[i], sortedDates[i - 1]));
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate confidence based on consistency of intervals
  const maxDeviation = avgInterval * 0.3; // Allow 30% deviation
  const consistencyScore = Math.max(0, 100 - (stdDev / avgInterval) * 100);
  
  // Determine frequency
  if (avgInterval >= 1 && avgInterval <= 10) {
    return { frequency: 'weekly', confidence: consistencyScore };
  } else if (avgInterval >= 25 && avgInterval <= 35) {
    return { frequency: 'monthly', confidence: consistencyScore };
  } else if (avgInterval >= 80 && avgInterval <= 100) {
    return { frequency: 'quarterly', confidence: consistencyScore };
  } else if (avgInterval >= 350 && avgInterval <= 380) {
    return { frequency: 'yearly', confidence: consistencyScore };
  }

  return { frequency: null, confidence: 0 };
}

// Un mismo pago aparece dos veces cuando la persona registra el gasto Y ademas importa la
// cartola del banco: una vez como gasto y otra como linea bancaria. Los nombres nunca calzan
// exacto ("Jumbo" contra "JUMBO 1234 SANTIAGO"), asi que compararlos por texto no sirve de nada.
// Se comparan por lo unico que es igual de los dos lados: el monto y la fecha.
const TOLERANCIA_DIAS = 3;

interface PagoSuelto { monto: number; fecha: Date }

function esElMismoPago(monto: number, fecha: Date, pagos: PagoSuelto[]): boolean {
  return pagos.some(p =>
    Math.abs(p.monto - monto) <= Math.max(1, monto * 0.01) &&
    Math.abs(differenceInDays(p.fecha, fecha)) <= TOLERANCIA_DIAS
  );
}

function calculateAnnualizedCost(amount: number, frequency: DetectedSubscription['frequency']): number {
  switch (frequency) {
    case 'weekly': return amount * 52;
    case 'monthly': return amount * 12;
    case 'quarterly': return amount * 4;
    case 'yearly': return amount;
    default: return amount * 12;
  }
}

function getFrequencyLabel(frequency: DetectedSubscription['frequency'], language: string): string {
  const labels = {
    weekly: { en: 'Weekly', es: 'Semanal' },
    monthly: { en: 'Monthly', es: 'Mensual' },
    quarterly: { en: 'Quarterly', es: 'Trimestral' },
    yearly: { en: 'Yearly', es: 'Anual' },
  };
  return labels[frequency]?.[language as 'en' | 'es'] || labels[frequency]?.en || frequency;
}

export function useSubscriptionDetector(expenses: ExpenseWithRelations[], bankTransactions?: BankTransaction[]) {
  const subscriptions = useMemo(() => {
    const detected: DetectedSubscription[] = [];

    // ── Analyze expenses ──
    if (expenses && expenses.length > 0) {
      const grouped: Record<string, GroupedExpense> = {};

      expenses.forEach((expense) => {
        if (!expense.vendor) return;
        const normalizedVendor = expense.vendor.toLowerCase().trim();
        if (!grouped[normalizedVendor]) {
          grouped[normalizedVendor] = { vendor: expense.vendor, expenses: [], amounts: [], dates: [] };
        }
        grouped[normalizedVendor].expenses.push(expense);
        grouped[normalizedVendor].amounts.push(Number(expense.amount));
        grouped[normalizedVendor].dates.push(parseISO(expense.date));
      });

      Object.values(grouped).forEach((group) => {
        if (group.expenses.length < 2) return;

        // Dos cobros del mismo comercio el mismo dia son UN pago, no dos. Sin juntarlos, un
        // colegio que cobra la mensualidad de dos hijos el mismo dia daba intervalos de 0 y 30
        // dias alternados: el promedio quedaba en 15 y no caia en ninguna frecuencia conocida,
        // asi que el colegio no se detectaba nunca desde los gastos propios.
        const porDia = new Map<string, number>();
        group.dates.forEach((fecha, i) => {
          const dia = format(fecha, 'yyyy-MM-dd');
          porDia.set(dia, (porDia.get(dia) || 0) + group.amounts[i]);
        });
        const diasOrdenados = Array.from(porDia.keys()).sort();
        const fechasDePago = diasOrdenados.map(d => parseISO(d));
        const montosDePago = diasOrdenados.map(d => porDia.get(d) as number);

        if (fechasDePago.length < 2) return;

        const avgAmount = montosDePago.reduce((a, b) => a + b, 0) / montosDePago.length;
        const amountVariance = montosDePago.every((amt) => Math.abs(amt - avgAmount) / avgAmount <= 0.1);
        if (!amountVariance) return;
        const { frequency, confidence } = calculateFrequency(fechasDePago);
        if (!frequency || confidence < 50) return;
        const totalSpent = montosDePago.reduce((a, b) => a + b, 0);
        const sortedDates = fechasDePago.sort((a, b) => b.getTime() - a.getTime());
        detected.push({
          vendor: group.vendor, averageAmount: avgAmount, frequency,
          occurrences: montosDePago.length, lastDate: format(sortedDates[0], 'yyyy-MM-dd'),
          totalSpent, annualizedCost: calculateAnnualizedCost(avgAmount, frequency),
          category: group.expenses[0]?.category || null, expenses: group.expenses,
          confidence, source: 'expenses',
        });
      });
    }

    // ── Analyze bank transactions ──
    if (bankTransactions && bankTransactions.length > 0) {
      const bankGrouped: Record<string, { description: string; amounts: number[]; dates: Date[] }> = {};

      bankTransactions.forEach((tx) => {
        if (!tx.description) return;
        // Una suscripcion es dinero que SALE. Sin esta linea, cada sueldo, transferencia recibida
        // o devolucion que se repitiera entraba a la lista como si fuera un cobro.
        if (!esSalidaDeDinero(tx)) return;
        const key = tx.description.toLowerCase().trim();
        if (!bankGrouped[key]) {
          bankGrouped[key] = { description: tx.description, amounts: [], dates: [] };
        }
        bankGrouped[key].amounts.push(Math.abs(Number(tx.amount)));
        bankGrouped[key].dates.push(parseISO(tx.transaction_date));
      });

      // Check which vendors are already detected from expenses
      const existingVendors = new Set(detected.map(d => d.vendor.toLowerCase().trim()));

      // Los pagos que ya se contaron desde los gastos, para no contarlos otra vez desde el banco.
      const yaContados = detected.map(d => ({
        entrada: d,
        pagos: d.expenses.map(e => ({ monto: Math.abs(Number(e.amount)), fecha: parseISO(e.date) })),
      })).filter(c => c.pagos.length > 0);

      Object.values(bankGrouped).forEach((group) => {
        if (group.amounts.length < 2) return;
        // Skip if already found in expenses
        if (existingVendors.has(group.description.toLowerCase().trim())) {
          // Upgrade source to 'both'
          const existing = detected.find(d => d.vendor.toLowerCase().trim() === group.description.toLowerCase().trim());
          if (existing) existing.source = 'both';
          return;
        }
        // Si la mayoria de las lineas de este grupo calza en monto y fecha con un pago que ya
        // entro desde los gastos, es el mismo pago visto dos veces: se marca la entrada que ya
        // existe como vista tambien en el banco, y esta no se agrega. Sin esto, quien registra
        // sus gastos Y importa la cartola —que es justo el flujo que la app recomienda— veia el
        // total mensual al doble.
        const minimoParaSerElMismo = Math.ceil(group.amounts.length * 0.6);
        const yaEstaba = yaContados.find(cand =>
          group.amounts.filter((monto, i) => esElMismoPago(monto, group.dates[i], cand.pagos)).length
            >= minimoParaSerElMismo
        );
        if (yaEstaba) {
          yaEstaba.entrada.source = 'both';
          return;
        }

        const avgAmount = group.amounts.reduce((a, b) => a + b, 0) / group.amounts.length;
        const amountVariance = group.amounts.every((amt) => Math.abs(amt - avgAmount) / avgAmount <= 0.15);
        if (!amountVariance) return;
        const { frequency, confidence } = calculateFrequency(group.dates);
        if (!frequency || confidence < 40) return;
        const totalSpent = group.amounts.reduce((a, b) => a + b, 0);
        const sortedDates = group.dates.sort((a, b) => b.getTime() - a.getTime());
        detected.push({
          vendor: group.description, averageAmount: avgAmount, frequency,
          occurrences: group.amounts.length, lastDate: format(sortedDates[0], 'yyyy-MM-dd'),
          totalSpent, annualizedCost: calculateAnnualizedCost(avgAmount, frequency),
          category: null, expenses: [], confidence, source: 'bank',
        });
      });
    }

    return detected.sort((a, b) => b.annualizedCost - a.annualizedCost);
  }, [expenses, bankTransactions]);

  const totalAnnualSubscriptionCost = useMemo(() => {
    return subscriptions.reduce((sum, sub) => sum + sub.annualizedCost, 0);
  }, [subscriptions]);

  const totalMonthlySubscriptionCost = useMemo(() => {
    return totalAnnualSubscriptionCost / 12;
  }, [totalAnnualSubscriptionCost]);

  return {
    subscriptions,
    totalAnnualSubscriptionCost,
    totalMonthlySubscriptionCost,
    getFrequencyLabel,
  };
}
