

# Plan: Corregir Bug del Stripe Webhook

## Problema Identificado

El webhook está fallando con el error:
```
SubtleCryptoProvider cannot be used in a synchronous context.
Use `await constructEventAsync(...)` instead of `constructEvent(...)`
```

Este error ocurre porque en Deno (el runtime de Edge Functions), la verificación de firma de Stripe requiere usar el método **asíncrono** `constructEventAsync` en lugar del síncrono `constructEvent`.

## Estado Actual de Tu Suscripción

**¡Tu pago fue exitoso!** La suscripción está activa en la base de datos:
- Plan: Premium Monthly
- Estado: Activo
- Customer ID: cus_TuqoUrFY1eCBSn
- Subscription ID: sub_1Sx1Be3wR30iWwFnG9oSzBsS

## Cambio Requerido

### Archivo: `supabase/functions/stripe-webhook/index.ts`

**Problema en líneas 59-66:**
```typescript
// Código actual (INCORRECTO para Deno)
try {
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
} catch (err) {
  // ...
}
```

**Solución:**
```typescript
// Código corregido (CORRECTO para Deno)
try {
  event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
} catch (err) {
  // ...
}
```

## Por Qué Es Importante

Aunque tu suscripción actual funciona (porque `check-subscription` consulta directamente a Stripe), el webhook es necesario para:
- Actualizar la base de datos cuando se cancele una suscripción
- Procesar upgrades/downgrades de plan
- Manejar pagos fallidos y reactivaciones
- Mantener la base de datos sincronizada con Stripe

## Flujo Después de la Corrección

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Stripe envía   │────▶│ stripe-webhook   │────▶│ Verifica firma  │
│  evento         │     │ (Edge Function)  │     │ con             │
│                 │     │                  │     │ constructEvent- │
│                 │     │                  │     │ Async()         │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Base de datos  │◀────│ Procesa evento   │◀────│ Firma válida    │
│  actualizada    │     │ (create/update/  │     │ ✅              │
│  correctamente  │     │ delete)          │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Implementación

1. Cambiar `constructEvent` a `constructEventAsync` (añadir `await`)
2. Desplegar la función actualizada
3. Reenviar los eventos fallidos desde Stripe Dashboard

## Pasos Post-Implementación

1. En Stripe Dashboard → Webhooks → Ver eventos fallidos
2. Hacer clic en "Resend" para los eventos `customer.subscription.created` e `invoice.payment_succeeded`
3. Verificar que ahora respondan con status 200

