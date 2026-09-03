/**
 * Separa los pagos que se repiten en dos cosas que la gente vive distinto:
 *
 *  - "suscripcion": un servicio al que uno se suscribio y puede dar de baja manana
 *    (Netflix, Spotify, el gimnasio, una herramienta de software).
 *  - "compromiso": una cuenta o un compromiso que no se cancela con un boton
 *    (el dividendo de la casa, el colegio, la luz, el seguro, una cuota de credito).
 *
 * El detector encuentra las dos con el mismo metodo —son plata que sale con un ritmo—,
 * pero mezclarlas hacia que el total se leyera como si una familia gastara su sueldo
 * completo en suscripciones.
 */

export type TipoDePagoRecurrente = 'suscripcion' | 'compromiso';

const CATEGORIAS_DE_SUSCRIPCION = new Set([
  'suscripciones', 'subscriptions', 'subscription',
  'software', 'entretenimiento', 'entertainment', 'streaming',
]);

/** Se compara contra el nombre del comercio en minusculas, sin acentos ni signos. */
const SERVICIOS_CONOCIDOS = [
  'netflix', 'spotify', 'disney', 'hbo', 'primevideo', 'amazonprime', 'appletv', 'icloud',
  'youtube', 'crunchyroll', 'paramount', 'starplus', 'deezer', 'tidal', 'audible', 'kindle',
  'canva', 'adobe', 'notion', 'figma', 'dropbox', 'googleone', 'microsoft365', 'office365',
  'chatgpt', 'openai', 'anthropic', 'github', 'slack', 'zoom', 'linkedinpremium',
  'smartfit', 'gimnasio', 'duolingo', 'coursera', 'udemy', 'patreon', 'substack',
];

function normalizar(texto: string): string {
  // Se caen los acentos junto con el resto de lo que no es letra o numero: la lista de
  // servicios de arriba esta escrita sin acentos a proposito, asi que alcanza.
  return texto.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function tipoDePagoRecurrente(
  vendor: string,
  category: string | null | undefined,
): TipoDePagoRecurrente {
  const nombre = normalizar(vendor || '');
  if (SERVICIOS_CONOCIDOS.some(servicio => nombre.includes(servicio))) return 'suscripcion';

  const categoria = (category || '').toLowerCase().trim();
  if (CATEGORIAS_DE_SUSCRIPCION.has(categoria)) return 'suscripcion';

  // Ante la duda, compromiso: llamarle "suscripcion" a un dividendo hipotecario es el error
  // que esta separacion vino a corregir, y el titulo de la seccion ya cubre a los dos.
  return 'compromiso';
}
