
## Objetivo
Hacer que el botón **Resend** en Stripe funcione (que los eventos de webhook dejen de responder 500) corrigiendo el error actual del backend: **`"Invalid time value"`** en `stripe-webhook`.

## Qué está pasando (diagnóstico)
1. En Stripe, los eventos `customer.subscription.created` están llegando al endpoint del webhook, pero Stripe marca la entrega como **500 ERR**.
2. En los logs del backend se repite:  
   `"[STRIPE-WEBHOOK] ERROR in stripe-webhook - {"message":"Invalid time value"}"`
3. En el archivo `supabase/functions/stripe-webhook/index.ts` se construye la fecha así:
   - `const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();`
4. El error **`Invalid time value`** ocurre cuando `toISOString()` se llama sobre un `Date` inválido (por ejemplo cuando `current_period_end` viene `undefined`, `null`, o como string no numérico/ISO compatible).

Conclusión: El webhook ya pasa la verificación de firma (gracias a `constructEventAsync`), pero está fallando al convertir `current_period_end` a fecha ISO.

## Solución propuesta (cambio de código)
### A) Hacer el parseo de `current_period_end` robusto y “no-crash”
Implementar un helper pequeño para convertir el valor de Stripe a ISO de forma segura:

- Si es **number** (segundos unix) -> `new Date(n * 1000)`
- Si es **string numérico** (p.ej. `"1700000000"`) -> parse a number y multiplicar por 1000
- Si es **string ISO** (p.ej. `"2026-02-04T..."`) -> `new Date(isoString)`
- Si no se puede parsear -> devolver `null` y continuar (sin lanzar excepción)

### B) Solo calcular `expiresAt` cuando haga falta
En tu código actual `expiresAt` se calcula siempre, aunque la suscripción no esté activa.  
Cambiarlo para que:
- `expiresAt` se calcule únicamente si `isActive === true`
- Si no hay fecha válida, dejar `expires_at: null` (pero no romper el webhook)

### C) Añadir logs útiles (para confirmar el valor real que llega)
Antes de actualizar la base de datos, loggear campos “seguros”:
- `subscription.status`
- `subscription.current_period_end` y `typeof`
- `productId`
Esto nos permitirá confirmar si Stripe está mandando un formato nuevo (por ejemplo ISO string en vez de unix seconds) en tu cuenta.

### D) (Recomendado) Verificar errores del upsert
Hoy el `upsert(...)` no valida si hubo error. Añadir:
- captura del `{ error }` y loggear si existe
Esto no causa “Invalid time value”, pero ayuda a evitar que Stripe siga marcando fallos silenciosos.

## Archivos a tocar
- `supabase/functions/stripe-webhook/index.ts`
  - Reemplazar el cálculo de `expiresAt`
  - Agregar helper de parseo
  - Agregar logs y manejo de errores del `upsert`

## Pasos de verificación (después del cambio)
1. En Stripe → el mismo evento `customer.subscription.created` → **Resend**
2. Confirmar que el delivery ahora aparece como **200** (Succeeded).
3. Revisar logs del backend:
   - Debe aparecer “Webhook received …”
   - Debe aparecer “Updating subscription …”
   - Debe aparecer “Subscription updated successfully”
4. Verificar en tu app (Settings → Suscripción) que el plan y la fecha se reflejan sin inconsistencias.

## Notas importantes (para evitar confusión de plan)
En tus capturas, el evento y la factura muestran **Premium mensual (6.99 USD)**.  
Si tú intentabas comprar **Pro**, después de estabilizar el webhook revisaremos el flujo de UI/selección para asegurarnos de que al hacer checkout realmente se use el `priceId` de Pro (esto es un tema separado del “resend”, pero lo podemos arreglar enseguida).

## Riesgo y rollback
- Cambio de bajo riesgo: solo afecta cómo convertimos `current_period_end`.
- Si algo sale mal, el rollback es revertir el helper y volver al comportamiento previo (aunque ese comportamiento hoy rompe el webhook).

## Resultado esperado
- Stripe deja de ver 500 en deliveries.
- **Resend** funciona.
- La base de datos queda sincronizada automáticamente cuando se creen/actualicen/cancelen suscripciones.
