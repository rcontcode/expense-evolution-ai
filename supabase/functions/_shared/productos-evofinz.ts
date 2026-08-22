// Productos que VENDE EvoFinz. Existe para una sola cosa: poder distinguir una suscripcion
// de esta app de una de las otras.
//
// Por que hace falta: las tres apps de Rudy (EvoFinz, Fokuspark y Universmind Little)
// comparten UNA sola cuenta de Stripe y, muchas veces, el MISMO customer — la misma persona
// con el mismo correo. Entonces "este cliente ya tiene una suscripcion viva" no significa
// "ya tiene EvoFinz": puede ser su Fokuspark. Sin esta lista, la guardia contra el cobro
// doble bloquearia una venta legitima mandando al cliente al portal, donde no puede
// contratar nada.
//
// El Evo Bundle SI esta en la lista a proposito: ese plan YA incluye EvoFinz Pro, asi que
// quien lo tiene no debe poder comprar EvoFinz aparte.
//
// Se usan IDs de PRODUCTO y no de precio porque aguantan mejor: si se cambia el monto se
// crea un precio nuevo, pero el producto sigue siendo el mismo.
//
// FUENTE DE VERDAD: `stripe-webhook/index.ts` (tabla PRODUCT_ID_MAP). Si se crea un producto
// nuevo en Stripe, se agrega en los dos lugares.

export const PRODUCTOS_DE_EVOFINZ = new Set<string>([
  'prod_U4OdR9JHiXuKho', // Premium mensual
  'prod_U4Ofsc9SskEad8', // Premium anual
  'prod_TuPUlFnv10u2OA', // Premium mensual (viejo, sigue vivo en algunas suscripciones)
  'prod_TuPUaVFFZ9bBgf', // Premium anual (viejo)
  'prod_TuPUJPLiqh0kC7', // Pro mensual
  'prod_TuPVHHsOi7e4Au', // Pro anual
  'prod_U4OgGM4CrkdVOP', // Evo Bundle mensual (incluye EvoFinz Pro)
  'prod_U4Ohr9YUiCNX76', // Evo Bundle anual (incluye EvoFinz Pro)
  'prod_U2ZIfWwlezukmF', // Evo Bundle mensual viejo
  'prod_U2ZNNkNSSVCIp5', // Evo Bundle anual viejo
])

/** true si esa suscripcion de Stripe es de EvoFinz (o de un bundle que lo incluye). */
export function esSuscripcionDeEvoFinz(
  subscription: { items?: { data?: Array<{ price?: { product?: unknown } }> } },
): boolean {
  const items = subscription?.items?.data ?? []
  return items.some((item) => {
    const producto = item?.price?.product
    const id = typeof producto === 'string' ? producto : (producto as { id?: string })?.id
    return typeof id === 'string' && PRODUCTOS_DE_EVOFINZ.has(id)
  })
}
