/**
 * ¿Este movimiento del banco es dinero que SALE?
 *
 * POR QUE EXISTE (2-sep-2026). El detector de suscripciones contaba como suscripcion cualquier
 * movimiento que se repitiera, sin mirar si el dinero entraba o salia: le aplicaba `Math.abs()` al
 * monto y con eso el signo desaparecia. Consecuencia medida con seis meses de datos de una familia
 * chilena: la pantalla declaraba **39 suscripciones detectadas** y un costo de **$7.225.219 al
 * mes** —mas que todo el gasto mensual de esa familia— y anunciaba como «mayor gasto recurrente»
 * la linea «TRANSF SUELDO EMPRESA CONSTRUCTORA SA», o sea **el sueldo que entra**. Tambien
 * explicaba por que el 82 % del desglose caia en «Other»: un deposito no tiene categoria de gasto.
 *
 * LA REGLA NO SE INVENTO AQUI. Es la que ya usa `BankTransactionSummary`: vale el
 * `transaction_type` si viene, y si no viene se deduce del signo del monto. `BankingSummaryCard`
 * agrega que los nombres antiguos «credit» y «debit» significan lo mismo que «income» y «expense».
 * Las dos juntas son esto, en un solo lugar, para que la proxima pantalla que necesite distinguir
 * entradas de salidas no lo vuelva a resolver por su cuenta.
 */
export interface MovimientoConDireccion {
  amount: number | string | null;
  transaction_type?: string | null;
}

const TIPOS_QUE_ENTRAN = new Set(['income', 'credit', 'deposit']);
const TIPOS_QUE_SALEN = new Set(['expense', 'debit', 'payment', 'withdrawal']);

export function esSalidaDeDinero(movimiento: MovimientoConDireccion): boolean {
  const tipo = movimiento.transaction_type?.toLowerCase().trim();

  if (tipo && TIPOS_QUE_ENTRAN.has(tipo)) return false;
  if (tipo && TIPOS_QUE_SALEN.has(tipo)) return true;

  // Sin tipo —o con uno que no reconocemos— manda el signo: negativo es dinero que sale.
  // Es la misma deduccion que hace `BankTransactionSummary`.
  return Number(movimiento.amount) < 0;
}
