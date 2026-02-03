
# Plan: Arreglar Integración Stripe

## Resumen Ejecutivo
Corregir 2 bugs en las Edge Functions de Stripe que impiden crear checkouts y abrir el Customer Portal.

---

## Cambios Requeridos

### 1. Arreglar `create-checkout/index.ts`

**Problema**: El parámetro `custom_text.terms_of_service_acceptance` requiere `consent_collection.terms_of_service = 'required'`.

**Solución**: Agregar la configuración de consentimiento o remover el texto personalizado de términos.

```text
Archivo: supabase/functions/create-checkout/index.ts

Agregar en stripe.checkout.sessions.create():

consent_collection: {
  terms_of_service: 'required',
},
```

---

### 2. Resolver Permisos del Customer Portal

**Problema**: La API key actual (`rk_live_...`) es una Restricted Key sin permisos para el Customer Portal.

**Opciones**:
| Opción | Acción | Riesgo |
|--------|--------|--------|
| A (Recomendada) | Editar la Restricted Key en Stripe y agregar permiso `Customer Portal: Write` | Bajo |
| B | Usar la Secret Key completa (`sk_live_`) | Medio (más acceso) |

**Pasos en Stripe Dashboard**:
1. Ir a https://dashboard.stripe.com/apikeys
2. Click en la Restricted Key → Edit
3. En "Customer Portal" seleccionar **Write**
4. Guardar

---

## Secuencia de Implementación

```text
┌─────────────────────────────────────┐
│ 1. Corregir create-checkout         │
│    • Agregar consent_collection     │
│    • Desplegar función              │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ 2. Usuario actualiza permisos       │
│    en Stripe Dashboard              │
│    (Customer Portal: Write)         │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ 3. Pruebas end-to-end               │
│    • Test create-checkout           │
│    • Test customer-portal           │
│    • Simular webhook con test event │
└─────────────────────────────────────┘
```

---

## Detalles Técnicos

### Archivo: `supabase/functions/create-checkout/index.ts`

Modificar la llamada a `stripe.checkout.sessions.create()` (línea 95-133):

**Antes** (líneas 119-129):
```typescript
custom_text: {
  submit: { ... },
  terms_of_service_acceptance: {
    message: 'Al suscribirte...',
  },
},
```

**Después**:
```typescript
consent_collection: {
  terms_of_service: 'required',
},
custom_text: {
  submit: { ... },
  terms_of_service_acceptance: {
    message: 'Al suscribirte...',
  },
},
```

---

## Verificación Post-Implementación

1. **create-checkout**: Llamar la función → debe retornar URL de Stripe Checkout
2. **customer-portal**: Llamar la función → debe retornar URL del portal (después de actualizar permisos)
3. **stripe-webhook**: Enviar test event desde Stripe → verificar logs

---

## Notas Importantes

- El webhook (`stripe-webhook`) no ha recibido eventos todavía (logs vacíos), lo cual es normal porque aún no hay suscripciones completadas
- Una vez arreglado `create-checkout`, podrás completar una suscripción de prueba para validar el webhook
