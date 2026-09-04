import { describe, it, expect } from 'vitest';
import { calculatePayoffSchedule } from '@/hooks/data/useDebtManager';
import type { Liability } from '@/hooks/data/useNetWorth';

function deuda(p: Partial<Liability> & { name: string; current_balance: number }): Liability {
  return {
    id: p.name,
    user_id: 'u',
    category: 'credit_card',
    original_amount: p.current_balance,
    interest_rate: 0,
    minimum_payment: null,
    due_date: null,
    currency: 'CAD',
    notes: null,
    created_at: '',
    updated_at: '',
    ...p,
  } as Liability;
}

describe('calculatePayoffSchedule', () => {
  it('no inventa dinero el mes en que se salda una deuda', () => {
    // Presupuesto real: 200 al mes. La deuda chica se salda el primer mes y su
    // minimo queda libre DESDE EL MES SIGUIENTE, no ese mismo mes.
    const plan = calculatePayoffSchedule(
      [
        deuda({ name: 'chica', current_balance: 100, minimum_payment: 100 }),
        deuda({ name: 'grande', current_balance: 1000, minimum_payment: 100 }),
      ],
      0,
      'snowball',
    );
    expect(plan.totalMonths).toBe(6);
  });

  it('marca como sin fecha la deuda cuyo minimo no cubre ni el interes', () => {
    const plan = calculatePayoffSchedule(
      [deuda({ name: 'tarjeta', current_balance: 1000, interest_rate: 24, minimum_payment: 10 })],
      0,
      'avalanche',
    );
    expect(Number.isFinite(plan.totalMonths)).toBe(false);
    expect(Number.isFinite(plan.payoffOrder[0].monthsToPayoff)).toBe(false);
  });

  it('el pago extra acelera el plan', () => {
    const base = [deuda({ name: 'prestamo', current_balance: 1200, minimum_payment: 100 })];
    expect(calculatePayoffSchedule(base, 0, 'snowball').totalMonths).toBe(12);
    expect(calculatePayoffSchedule(base, 100, 'snowball').totalMonths).toBe(6);
  });

  it('ordena la lista dejando al final lo que no se salda', () => {
    const plan = calculatePayoffSchedule(
      [
        deuda({ name: 'nunca', current_balance: 5000, interest_rate: 30, minimum_payment: 5 }),
        deuda({ name: 'corta', current_balance: 200, minimum_payment: 200 }),
      ],
      0,
      'snowball',
    );
    expect(plan.payoffOrder[0].name).toBe('corta');
  });
});
