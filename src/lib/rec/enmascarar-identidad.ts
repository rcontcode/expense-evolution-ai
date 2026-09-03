/**
 * Nombres de terceros al grabar.
 *
 * POR QUE EXISTE (3-sep-2026). El tablero, con REC Mode activo y el escenario de la familia
 * cargado, saludaba correctamente como "Demo" y en el bloque de al lado decia: «Tienes 1 cliente:
 * Vertogen». El nombre real de un cliente de verdad, en pantalla, listo para quedar grabado en un
 * video publico. La mascara del perfil solo cubre al dueño de la cuenta; los nombres de sus
 * clientes son datos de OTRA gente, y esos no se piden permiso a uno mismo.
 *
 * El reemplazo es estable: el mismo cliente recibe siempre el mismo nombre inventado, asi que un
 * video no muestra "Andes Digital" en una pantalla y "Grupo Aurora" en la siguiente para el mismo
 * cliente. Se elige por el identificador, que no cambia.
 */
const NOMBRES_INVENTADOS = [
  'Andes Digital',
  'Grupo Aurora',
  'Estudio Norte',
  'Comercial Litoral',
  'Vega y Asociados',
  'Constructora Pehuen',
  'Marea Studio',
  'Altiplano SpA',
  'Casa Bruma',
  'Taller Origen',
  'Nodo Creativo',
  'Cumbre Consultores',
];

function numeroEstable(texto: string): number {
  let n = 0;
  for (let i = 0; i < texto.length; i++) n = (n * 31 + texto.charCodeAt(i)) >>> 0;
  return n;
}

export function nombreInventado(id: string | null | undefined, respaldo = 'Cliente Demo'): string {
  if (!id) return respaldo;
  return NOMBRES_INVENTADOS[numeroEstable(id) % NOMBRES_INVENTADOS.length];
}

/** Devuelve el cliente con nombre inventado si se esta grabando; tal cual si no. */
export function enmascararCliente<T extends { id?: string | null; name?: string | null }>(
  cliente: T | null | undefined,
  grabando: boolean,
): T | null | undefined {
  if (!grabando || !cliente) return cliente;
  return { ...cliente, name: nombreInventado(cliente.id) };
}

/** Igual que el anterior, para una lista. */
export function enmascararClientes<T extends { id?: string | null; name?: string | null }>(
  clientes: T[] | null | undefined,
  grabando: boolean,
): T[] | null | undefined {
  if (!grabando || !clientes) return clientes;
  return clientes.map((c) => ({ ...c, name: nombreInventado(c.id) }));
}
