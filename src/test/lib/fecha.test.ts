import { describe, it, expect } from 'vitest';
import { fechaLocal, aFechaISO, hoyLocal } from '@/lib/fecha';

/**
 * Estas pruebas existen por un defecto real: las columnas DATE de la base llegan
 * como "2026-09-03" y `new Date()` las interpreta como medianoche UTC. En Chile y
 * en Canada eso cae el dia anterior, asi que un gasto del 3 se veia como del 2 y
 * un gasto del 1 de enero contaba en el ano tributario anterior.
 */
describe('fechaLocal', () => {
  it('arma una fecha sin hora en el dia del usuario, no en el de Greenwich', () => {
    const d = fechaLocal('2026-09-03');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // septiembre
    expect(d.getDate()).toBe(3);
    expect(d.getHours()).toBe(0);
  });

  it('no cambia de ano el 1 de enero', () => {
    // Era el caso mas caro: `new Date('2026-01-01').getFullYear()` devolvia 2025
    // en toda America, y el reporte anual dejaba ese gasto en el ano equivocado.
    const d = fechaLocal('2026-01-01');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it('respeta una marca de tiempo completa tal como viene', () => {
    const conZona = fechaLocal('2026-09-03T15:30:00Z');
    expect(conZona.toISOString()).toBe('2026-09-03T15:30:00.000Z');
  });

  it('devuelve el mismo instante cuando ya le pasan un Date', () => {
    const original = new Date(2026, 8, 3, 14, 5);
    expect(fechaLocal(original).getTime()).toBe(original.getTime());
  });

  it('no revienta con nulo ni con indefinido', () => {
    expect(() => fechaLocal(null)).not.toThrow();
    expect(() => fechaLocal(undefined)).not.toThrow();
    expect(Number.isNaN(fechaLocal(undefined).getTime())).toBe(true);
  });
});

describe('aFechaISO', () => {
  it('escribe el dia del usuario, no el de Greenwich', () => {
    expect(aFechaISO(new Date(2026, 8, 3))).toBe('2026-09-03');
    expect(aFechaISO(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('rellena con cero el mes y el dia de una cifra', () => {
    expect(aFechaISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('sigue dando el mismo dia a las once de la noche', () => {
    // `toISOString()` a las 23:00 en cualquier pais de America ya devolvia manana.
    expect(aFechaISO(new Date(2026, 8, 3, 23, 59))).toBe('2026-09-03');
  });

  it('da la vuelta completa con fechaLocal', () => {
    expect(aFechaISO(fechaLocal('2026-02-28'))).toBe('2026-02-28');
    expect(aFechaISO(fechaLocal('2026-12-31'))).toBe('2026-12-31');
  });
});

describe('hoyLocal', () => {
  it('devuelve el dia de hoy segun el reloj de la maquina', () => {
    const ahora = new Date();
    expect(hoyLocal()).toBe(aFechaISO(ahora));
    expect(hoyLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
