/**
 * Convierte lo que guarda la base en una fecha del dia correcto.
 *
 * Las columnas DATE de Postgres llegan como "2026-09-03", sin hora. `new Date()`
 * interpreta ese formato como MEDIANOCHE UTC, y en cualquier pais al oeste de
 * Greenwich eso cae el dia anterior:
 *
 *   new Date('2026-09-03')  en Chile (UTC-4)  ->  2 de septiembre, 20:00
 *   new Date('2026-01-01')  en Canada (UTC-8) ->  31 de diciembre, 16:00
 *
 * O sea que un gasto del 3 se veia como del 2, y —peor— un gasto del 1 de enero
 * contaba en el ano tributario anterior, porque `getFullYear()` devolvia 2025.
 * En una app de impuestos eso no es un detalle de presentacion.
 *
 * Esta funcion es un reemplazo directo de `new Date(...)`: recibe lo mismo,
 * devuelve lo mismo y nunca lanza. Lo unico que cambia es que una fecha sin hora
 * se arma en la zona horaria del usuario, que es donde el la escribio.
 *
 * Para todo lo demas —una marca de tiempo completa, un Date que ya venia armado,
 * un nulo— se comporta identico a `new Date`, a proposito: asi se puede cambiar
 * un sitio sin revisar que le llega.
 */
export function fechaLocal(valor: string | number | Date | null | undefined): Date {
  if (typeof valor === 'string') {
    const soloDia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (soloDia) {
      return new Date(Number(soloDia[1]), Number(soloDia[2]) - 1, Number(soloDia[3]));
    }
  }
  return new Date(valor as string | number | Date);
}

/**
 * Escribe una fecha como "2026-09-03" usando el DIA DEL USUARIO, no el de Greenwich.
 *
 * `fecha.toISOString().split('T')[0]` convierte a UTC antes de cortar, asi que en
 * cualquier pais al este de Greenwich devuelve el dia anterior, y para "ahora
 * mismo" en America devuelve el dia SIGUIENTE toda la tarde: a las 18:00 en
 * Vancouver ya es medianoche en Londres.
 */
export function aFechaISO(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/**
 * El dia de hoy, segun el reloj del usuario.
 *
 * Se usaba `new Date().toISOString().slice(0, 10)`, que da el dia en UTC: un gasto
 * cargado a las 18:00 en Vancouver o a las 21:00 en Santiago quedaba fechado manana.
 */
export function hoyLocal(): string {
  return aFechaISO(new Date());
}

/**
 * El mes de una fecha en formato `YYYY-MM`, en la hora del usuario.
 *
 * `new Date().toISOString().slice(0, 7)` parece inofensivo y no lo es: el 31 a
 * las 17:00 en Vancouver el reloj UTC ya esta en el dia 1 del mes siguiente, asi
 * que las pantallas que filtran "este mes" con esa cuenta se vacian una tarde
 * antes de tiempo. Con una fecha ya guardada el error va al reves: la medianoche
 * local del 1 de septiembre es el 31 de agosto en UTC.
 */
export function mesLocal(valor?: string | number | Date | null): string {
  const f = valor === undefined || valor === null ? new Date() : fechaLocal(valor);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
}
