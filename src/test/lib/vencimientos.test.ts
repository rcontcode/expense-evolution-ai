import { describe, it, expect } from 'vitest';
import { getNextDueDate, sumarMeses } from '@/lib/constants/bill-categories';
import { aFechaISO, mesLocal } from '@/lib/fecha';

describe('sumarMeses', () => {
  it('no se desborda al mes siguiente cuando el dia no existe', () => {
    // 31 de enero + 1 mes: febrero no tiene 31, asi que el dia se recorta al 28
    expect(aFechaISO(sumarMeses(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
  });

  it('respeta el 29 de febrero en anio bisiesto', () => {
    expect(aFechaISO(sumarMeses(new Date(2028, 0, 31), 1))).toBe('2028-02-29');
  });

  it('vuelve al dia original cuando el mes de destino si lo tiene', () => {
    // con el dia ancla, una cuenta del 31 vuelve al 31 en marzo
    expect(aFechaISO(sumarMeses(new Date(2026, 1, 28), 1, 31))).toBe('2026-03-31');
  });

  it('cruza el fin de anio', () => {
    expect(aFechaISO(sumarMeses(new Date(2026, 11, 15), 1))).toBe('2027-01-15');
  });
});

describe('getNextDueDate', () => {
  it('una cuenta mensual del 31 no se corre sola mes a mes', () => {
    let f = new Date(2026, 0, 31);
    const dias: number[] = [];
    for (let i = 0; i < 4; i++) {
      f = getNextDueDate(f, 'monthly', undefined, 31);
      dias.push(f.getDate());
    }
    // feb 28, mar 31, abr 30, may 31 — nunca se pasa al mes siguiente
    expect(dias).toEqual([28, 31, 30, 31]);
  });

  it('semanal suma siete dias', () => {
    expect(aFechaISO(getNextDueDate(new Date(2026, 0, 28), 'weekly'))).toBe('2026-02-04');
  });

  it('quincenal suma catorce dias', () => {
    expect(aFechaISO(getNextDueDate(new Date(2026, 0, 28), 'bi_weekly'))).toBe('2026-02-11');
  });
});

describe('mesLocal', () => {
  it('da el mes del usuario, no el de UTC', () => {
    // 31 de enero a las 20:00 locales: en UTC ya es febrero en varias zonas
    expect(mesLocal(new Date(2026, 0, 31, 20, 0, 0))).toBe('2026-01');
  });

  it('lee una fecha guardada sin correrla de mes', () => {
    expect(mesLocal('2026-09-01')).toBe('2026-09');
  });

  it('rellena el mes con cero', () => {
    expect(mesLocal(new Date(2026, 2, 5))).toBe('2026-03');
  });
});
