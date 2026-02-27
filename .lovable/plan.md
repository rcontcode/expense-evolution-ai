

## Revision: Alineacion de Suscripciones EvoFinz ↔ Fokuspark

### Estado actual -- Ya funciona correctamente

Ambas apps ya comparten los **mismos Stripe Price IDs** para el Bundle:
- Monthly: `price_1T4U9U3wR30iWwFnq9YJeIHe`
- Annual: `price_1T4UEy3wR30iWwFnbIfKJtUb`

Y ambos webhooks detectan el Bundle correctamente:

```text
COMPRA DESDE EVOFINZ                    COMPRA DESDE FOKUSPARK
─────────────────────                    ──────────────────────
SubscriptionManager.tsx                  PricingPage.tsx
   → create-checkout (EvoFinz)              → stripe-create-checkout-session (Fokuspark)
   → mismos Price IDs                       → mismos Price IDs
         │                                        │
         └──────────────┐    ┌────────────────────┘
                        ▼    ▼
                   STRIPE CHECKOUT
                        │
                        ▼
              Stripe Webhook (x2)
        EvoFinz: stripe-webhook → user_subscriptions.has_bundle = true
        Fokuspark: stripe-webhook → profiles.has_bundle = true
```

### Diferencia arquitectonica (no es un problema, es un dato)

| Aspecto | EvoFinz | Fokuspark |
|---------|---------|-----------|
| Donde guarda suscripcion | `user_subscriptions` (tabla separada) | `profiles.subscription_tier` (columna directa) |
| Donde guarda bundle | `user_subscriptions.has_bundle` | `profiles.has_bundle` |
| Plans en la UI | Free, Premium, Pro, Bundle (en Settings) | Free, Premium, Pro, Bundle (pagina dedicada `/pricing`) |
| Edge function checkout | `create-checkout` | `stripe-create-checkout-session` |
| Planes individuales | Premium y Pro son de EvoFinz solamente | Premium y Pro son de Fokuspark solamente |

### Modelo de negocio confirmado -- Ya esta implementado asi

```text
USUARIO COMPRA...          ACCEDE A...
─────────────────          ─────────────
EvoFinz Premium    →       Solo EvoFinz Premium
EvoFinz Pro        →       Solo EvoFinz Pro
Fokuspark Premium  →       Solo Fokuspark Premium
Fokuspark Pro      →       Solo Fokuspark Pro
Evo Bundle         →       EvoFinz Pro + Fokuspark Pro + features cruzados
```

Cada app tiene sus propios Price IDs para Premium y Pro. El Bundle usa Price IDs compartidos. Un usuario que paga Premium en EvoFinz no obtiene nada gratis en Fokuspark (y viceversa). Esto ya funciona correctamente.

### Gaps reales encontrados (4 puntos)

#### 1. Fokuspark `useSubscription` no consulta la DB
El hook `useSubscription.tsx` de Fokuspark lee `subscription_tier` directamente del `profile` object en memoria (linea 21). No hace un `check-subscription` call al backend como EvoFinz. Esto significa que si el usuario compra una suscripcion en otra pestana, Fokuspark no se entera hasta que recarga la pagina.

**Fix**: Crear un edge function `check-subscription` en Fokuspark (o reusar el patron de EvoFinz) que consulte Stripe en tiempo real.

#### 2. Fokuspark no tiene `SubscriptionManager` en Settings
La pagina de pricing existe en `/pricing`, pero no hay forma de ver/gestionar la suscripcion desde Settings. EvoFinz tiene `SubscriptionManager.tsx` integrado en Settings.

**Fix**: Agregar una card de suscripcion en la pagina de Settings de Fokuspark.

#### 3. Bundle texto diferente pero correcto
EvoFinz dice "EvoFinz Pro + Fokuspark Premium". Fokuspark dice "FokusPark + EvoFinz". Ambos son correctos pero la descripcion de Fokuspark es mas precisa porque dice "Full access to EvoFinz". No requiere cambio obligatorio.

#### 4. Fokuspark webhook almacena en `profiles`, no en tabla separada
Fokuspark guarda `subscription_tier` y `has_bundle` directamente en `profiles`. EvoFinz usa `user_subscriptions`. Esto no es un bug -- son arquitecturas distintas pero funcionales. Sin embargo, significa que las feature flags del ecosistema deben consultar **ambas** fuentes dependiendo de la app.

### Conclusion

No hay complicacion. El sistema ya funciona como describes. Cada app tiene sus planes independientes + el Bundle compartido. El Bundle se puede comprar desde cualquiera de las dos apps y ambos webhooks lo detectan. Los 4 gaps son mejoras de calidad, no bloqueadores.

### Plan de accion (en Fokuspark, no aqui)

1. Crear edge function `check-subscription` que consulte Stripe (como EvoFinz)
2. Actualizar `useSubscription.tsx` para usar ese edge function en vez de leer del profile estático
3. Agregar card de gestion de suscripcion en Settings
4. (Opcional) Alinear texto del Bundle para que sea mas descriptivo

Estos cambios deben hacerse en el proyecto [Fokuspark](/projects/032ad91f-4637-425e-afee-679078dda344), no en EvoFinz.

