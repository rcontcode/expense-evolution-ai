/**
 * Que parte del total es una cifra, en porcentaje, sin reventar cuando no hay total.
 *
 * `(parte / total) * 100` con el total en cero da NaN —o Infinity si la parte no
 * es cero—, y `toFixed()` sobre eso escribe literalmente "NaN" en la pantalla.
 * Pasa justo donde peor se ve: una cuenta recien creada, donde casi todos los
 * totales todavia son cero.
 *
 * Devuelve 0 cuando no hay de que sacar porcentaje, que es lo que la pantalla
 * quiere decir de todos modos.
 */
export function porcentaje(parte: number, total: number): number {
  if (!Number.isFinite(parte) || !Number.isFinite(total) || total === 0) return 0;
  return (parte / total) * 100;
}
