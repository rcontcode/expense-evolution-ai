

# Plan de Implementacion: Evo Ecosystem

## Fase 1: Fundamentos del Ecosistema ✅ COMPLETADA

### Paso 1: Migracion de Base de Datos ✅
- Tabla `feature_flags` con RLS
- Columna `has_bundle` en `user_subscriptions`
- Tabla `financial_focus_sessions`
- Tabla `financial_worry_entries`

### Paso 2: Hook `useFeatureFlags` ✅
### Paso 3: Panel Admin `FeatureFlagManager` ✅
### Paso 4: Componentes de Bienestar ✅
### Paso 5: Constantes de Frases Unificadas ✅
### Paso 6: Integracion en Mentorship ✅
### Paso 7: Instrucciones para Fokuspark ✅

---

## Fase 1.5: Pulido y Testing ✅ COMPLETADA

- Fix: stale closure en breathing timer
- Fix: eliminados `(supabase as any)` casts
- Browser test de todos los componentes

---

## Fase 2: Stripe Bundle + Deteccion Automatica ✅ COMPLETADA

### Paso 1: Productos Stripe Bundle ✅
- Bundle Monthly: prod_U2ZIfWwlezukmF / price_1T4U9U3wR30iWwFnq9YJeIHe ($14.99/mo)
- Bundle Annual: prod_U2ZNNkNSSVCIp5 / price_1T4UEy3wR30iWwFnbIfKJtUb ($119.90/yr)

### Paso 2: Webhook actualizado ✅
- `getPlanFromProductId` ahora retorna `isBundle`
- Bundle products → planType "pro" + has_bundle = true
- Cancellation resets has_bundle = false

### Paso 3: check-subscription actualizado ✅
- Detecta bundle products
- Retorna `has_bundle` en response
- Upsert incluye has_bundle

### Paso 4: Frontend STRIPE_CONFIG actualizado ✅
- Bundle products/prices/pricing agregados a useSubscription.ts

---

## Fase 3: UI de Pricing + Bundle ✅ EN PROGRESO

### Paso 1: UI de Pricing con opción Bundle ✅
- SubscriptionManager muestra 3 planes (Premium, Pro, Bundle)
- Bundle card con badge "Mejor valor" y features de ambas apps
- createCheckout soporta planType 'bundle'
- Traducciones ES/EN completas

### Próximos pasos
- Dashboard de datos cruzados para Bundle users
- Onboarding del ecosistema
- Cross-app correlation insights UI
