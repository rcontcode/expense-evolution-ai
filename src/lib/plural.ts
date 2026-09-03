/**
 * Devuelve la forma singular o la plural segun la cantidad.
 *
 * Las dos formas se escriben completas —con su adjetivo si lo lleva— porque en
 * espanol el adjetivo tambien concuerda: "1 pago vencido" pero "3 pagos vencidos".
 * Un solo "(s)" pegado al sustantivo no alcanza, y ademas "pago(s) vencido(s)"
 * en pantalla delata software a medio terminar.
 *
 *   `${n} ${plural(n, 'pago vencido', 'pagos vencidos')}`
 */
export function plural(cantidad: number, uno: string, varios: string): string {
  return Math.abs(cantidad) === 1 ? uno : varios;
}
