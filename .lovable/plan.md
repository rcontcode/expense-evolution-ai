
# Plan: Corregir Product IDs en check-subscription

## Problema Identificado
La función `check-subscription` tiene Product IDs obsoletos que no coinciden con los productos actuales de Stripe, causando que usuarios con suscripción activa sean identificados como "free".

## Cambio Requerido

### Archivo: `supabase/functions/check-subscription/index.ts`

**Líneas 11-16 - Actualizar PRODUCT_IDS:**

| Plan | ID Actual (incorrecto) | ID Correcto |
|------|------------------------|-------------|
| Premium Monthly | `prod_TkhJLlgoAdGcGC` | `prod_TuPUlFnv10u2OA` |
| Premium Annual | `prod_TkhL8wDZL2MPDd` | `prod_TuPUaVFFZ9bBgf` |
| Pro Monthly | `prod_TkhKMQlrqFnKYc` | `prod_TuPUJPLiqh0kC7` |
| Pro Annual | `prod_TkhLVXHrCf97Ir` | `prod_TuPVHHsOi7e4Au` |

## Implementación

1. Actualizar las líneas 11-16 con los nuevos Product IDs
2. Desplegar la función actualizada
3. Verificar con una llamada de prueba

## Verificación Post-Cambio

Después de la actualización, el flujo completo funcionará así:

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Usuario paga   │────▶│ Stripe envía     │────▶│ stripe-webhook  │
│  (checkout)     │     │ subscription.    │     │ actualiza DB    │
│                 │     │ created          │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  App muestra    │◀────│ check-subscription│◀────│ user_           │
│  plan correcto  │     │ verifica en      │     │ subscriptions   │
│  (Premium/Pro)  │     │ Stripe + DB      │     │ table           │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Pasos para Probar (Post-Implementación)

1. Ir a la app → página de suscripción
2. Seleccionar plan Premium o Pro
3. Pagar con tarjeta de prueba: `4242 4242 4242 4242`
4. Verificar en Stripe Dashboard → Webhooks que el evento muestra "200 OK"
5. Confirmar que la app muestra el plan correcto

## Detalles Técnicos

- La función `check-subscription` consulta directamente a Stripe API para obtener suscripciones activas
- Compara el `product_id` de la suscripción con los IDs hardcodeados
- Si no hay match, devuelve `plan_type: "free"` aunque el usuario tenga suscripción activa
- También actualiza la tabla `user_subscriptions` para mantener sincronía con la base de datos
