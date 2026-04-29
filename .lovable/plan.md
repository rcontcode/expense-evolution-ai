# Cerrar los huecos críticos del sistema de límites

## Contexto

Tras el repaso, las únicas invocaciones a edge functions con cuota que **hoy fallan en silencio** (no muestran modal de upgrade ni mensaje claro al usuario) están en `useUnifiedChaosInbox.ts`. El resto del frontend ya pasa por `handleAIError`.

También quedan dos pulidos de mensajería para que el modal sea preciso siempre.

## Cambios

### 1. `src/hooks/data/useUnifiedChaosInbox.ts` — añadir `handleAIError` a 4 puntos

En cada uno de los 4 `supabase.functions.invoke('process-receipt'|'process-bank-statement', ...)` sustituir el actual:

```ts
if (error) throw error;
```

por:

```ts
if (error) {
  if (handleAIError(error, { feature: 'ocr', requiredPlan: 'premium' })) return;
  throw error;
}
if (result?.error && handleAIError(result, { feature: 'ocr', requiredPlan: 'premium' })) return;
```

(usar `feature: 'bank_analysis'` para `process-bank-statement`).

Líneas afectadas: 324, 453, 487, 533. El hook ya importa `useAIErrorHandler`, no requiere imports nuevos.

### 2. `src/contexts/UpgradePromptContext.tsx` — añadir keys faltantes al tipo

Hoy `mileage` y `net_worth` se castean a `UpgradeFeatureKey as never` desde `featureMatrix.ts`. Añadirlas oficialmente al union:

```ts
export type UpgradeFeatureKey =
  | 'expenses' | 'incomes' | 'ocr' | 'clients' | 'projects'
  | 'contracts' | 'mileage' | 'net_worth' | 'fire_calculator'
  | 'mentorship' | 'voice_assistant'
  | 'voice_premium' | 'bank_analysis' | 'ai_reconcile'
  | 'predictions' | 'autopilot' | 'coaching' | 'ai_credits';
```

Y eliminar los `as UpgradeFeatureKey` redundantes en `src/config/featureMatrix.ts` (ya están).

### 3. `src/components/UpgradePrompt.tsx` — copy específico para keys nuevas

Verificar que `friendlyMessages` (o equivalente) tenga entradas ES/EN para `mileage`, `net_worth`, `fire_calculator`, `predictions`, `autopilot`, `coaching`, `bank_analysis`, `ai_reconcile`, `voice_premium`. Si alguna cae al fallback genérico, agregar mensaje breve y educativo (sin FOMO) en ambos idiomas.

## Lo que NO se hace (decisión consciente)

- **`classify-document`, `parse-smart-input`, `suggest-tags`**: features base de captura. Bloquearlas rompería onboarding del plan free. Quedan sin guard de plan.
- **`classify-bank-transactions`**: clasificación interna post-import; el flujo principal ya validó cuota antes. Silenciar errores aquí es aceptable.
- **`process-bank-statement` backend**: ya tiene su propio guard local con payload 429 estándar. No requiere migración al helper compartido.
- **FeatureGate envolvente en páginas Pro completas (TaxOptimizer, RRSP/TFSA, Predictions, Autopilot, FIRE, NetWorth, Mileage)**: pendiente para una iteración posterior; los gates inline + guards backend ya bloquean ejecución, pero la página entera carga UI inútil para planes que no la tienen. Lo dejamos como tarea de pulido futuro.
- **Migración global a `useGuardedInvoke`**: refactor opcional; el patrón actual con `handleAIError` funciona.
- **Tests de `plan-guard` / `useFeatureAccess`**: fuera del alcance de este turno.

## Resultado esperado

Tras estos 3 cambios:
- Ningún flujo del Chaos Inbox falla en silencio al alcanzar cuota.
- El modal de upgrade muestra el mensaje correcto para todas las features (sin caer al fallback genérico para mileage/net_worth).
- Tipos consistentes entre `featureMatrix.ts` y `UpgradePromptContext.tsx`.
