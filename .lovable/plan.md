# Plan: Sistema unificado de límites y upgrade

Objetivo: que para **cualquier combinación** de plan (free / premium / pro / pro_beta / admin) y situación (función IA, voz, OCR, banca, contratos, optimizadores), el usuario vea:
- Un mensaje claro de **por qué** se bloqueó.
- El **plan correcto** al que debe subir (no adivinado por el frontend).
- Su **uso actual vs límite** y, cuando aplique, **cuándo se renueva**.
- Un botón directo para mejorar plan, o un mensaje de "ya estás en el plan máximo" cuando corresponde.

## 1. Backend: helper único `plan-guard.ts`

Crear `supabase/functions/_shared/plan-guard.ts` con una sola función `checkPlanAccess()` que toda edge function IA llamará al inicio.

Hace 4 cosas:
1. Valida JWT y obtiene `user_id`.
2. Lee `plan_configurations` (fuente única) + `user_subscriptions` + `usage_tracking` + `profiles.is_beta_tester` + `user_roles` (para detectar admin → bypass).
3. Determina si la feature está habilitada y si queda cuota mensual.
4. Devuelve `{ allowed: true, plan, usage, limit }` o lanza una respuesta HTTP estandarizada **429** con el payload que `useAIErrorHandler` ya entiende:

```json
{
  "error": "quota_exceeded",
  "feature": "ocr",
  "currentPlan": "free",
  "requiredPlan": "premium",
  "currentUsage": 5,
  "limit": 5,
  "resetDate": "2026-05-01T00:00:00Z",
  "message": "Has usado 5 de 5 escaneos OCR este mes."
}
```

Aplicarlo en las ~12 edge functions IA: `analyze-contract`, `process-receipt`, `process-bank-statement`, `analyze-bank-statement`, `classify-bank-transactions`, `app-assistant`, `elevenlabs-tts`, `optimize-taxes`, `optimize-rrsp-tfsa`, `optimize-apv-chile`, `predict-expenses`, `financial-autopilot`, `ecosystem-coaching`, `ecosystem-dashboard`, `ai-reconcile`, `parse-smart-input`, `generate-lead-message`, `classify-document`.

Cada función pasa su `feature` ("ocr", "bank_analysis", etc.) y el `requiredPlan` se calcula del lado backend a partir de `plan_configurations` (qué plan más bajo habilita esa feature) — el frontend deja de adivinarlo.

## 2. Frontend: matriz única `featureMatrix.ts`

Crear `src/config/featureMatrix.ts`. Una constante con cada feature, su clave en `usePlanLimits`, su `requiredPlan` y su nombre amigable ES/EN. Es la misma matriz que el backend deriva de `plan_configurations` — sirve para gating preventivo sin pegarle al backend.

```ts
export const FEATURE_MATRIX = {
  ocr:           { limitKey: 'ocr_scans_per_month',          requiredPlan: 'premium' },
  contracts:     { limitKey: 'contract_analyses_per_month',  requiredPlan: 'pro' },
  bank_analysis: { limitKey: 'bank_analyses_per_month',      requiredPlan: 'premium' },
  voice_premium: { limitKey: 'voice_minutes_per_month',      requiredPlan: 'premium' },
  // ...
} as const;
```

## 3. `useFeatureAccess(feature)` — hook reactivo

Devuelve `{ allowed, reason, currentUsage, limit, requiredPlan, resetDate, openUpgrade() }`. Combina `usePlanLimits` (límites del plan actual del usuario) + `useUsage` (consumo del mes). Usado por:

- **`FeatureGate`** (gating preventivo): bloquea botones con candado y tooltip "Disponible en Premium" antes de que el usuario gaste tiempo subiendo un PDF.
- Pantallas que muestran progreso de cuota ("47/50 escaneos este mes").

## 4. Mejoras al `UpgradePrompt`

- Mostrar `resetDate` cuando viene del backend ("Se renueva el 1 de mayo").
- Si el usuario ya está en el plan máximo (`pro` y feature bloqueada por cuota mensual): cambiar el CTA de "Mejorar plan" a "Entendido" + mostrar fecha de reseteo, en vez de invitar a un upgrade que no existe.
- Caso admin: nunca debería abrirse — añadir guard.
- Limpiar mensajes para que cumplan la regla del proyecto: **sin FOMO, sin urgencia, sin testimoniales inventados** (memoria Core: "Clean Pricing — NEVER use strikethroughs, urgency, or FOMO tactics"). Reescribir los `friendlyMessages` a tono educativo neutro.

## 5. Aplicar `FeatureGate` preventivo en los puntos de entrada

Envolver con `FeatureGate` los CTAs principales para que el bloqueo se vea **antes** de la acción:

- Botón "Subir contrato" en ChaosInbox y ContractsPage.
- Botón "Importar estado de cuenta" en BankImportDialog.
- Botón "Escanear recibo" en capture.
- Botón "Probar voz" en VoicePreferencesCard.
- Tarjetas de Optimizadores (impuestos / RRSP / APV).
- Tarjeta "Predicciones" y "Autopilot".

Resultado visible: candado + tooltip + click abre el modal de upgrade en vez de fallar después.

## 6. Auditoría y QA

- Script de prueba que llama cada edge function con un JWT de cuenta free → debe devolver 429 con payload correcto.
- Checklist manual: con cuenta free, premium y pro, recorrer cada flujo y confirmar mensaje + plan sugerido + CTA correcto.

## Archivos

**Crear**
- `supabase/functions/_shared/plan-guard.ts`
- `src/config/featureMatrix.ts`
- `src/hooks/data/useFeatureAccess.ts`

**Editar**
- `src/components/UpgradePrompt.tsx` (resetDate, plan máximo, limpieza tono)
- `src/contexts/UpgradePromptContext.tsx` (acepta `resetDate`, guard admin)
- ~12 edge functions IA (insertar `await checkPlanAccess(req, 'feature_name')` al inicio)
- ~8 componentes con CTAs principales (envolver con `FeatureGate`)

## Detalles técnicos

- `plan-guard.ts` usa `SUPABASE_SERVICE_ROLE_KEY` para leer `plan_configurations` y `user_roles` sin chocar con RLS, pero deriva el `user_id` del JWT del request, nunca del body.
- Admin (`is_admin(user_id)` en BD) → siempre `allowed: true`, sin contar uso.
- `pro_beta` se mapea a límites de `pro`.
- Funciones IA llaman `increment_usage(user_id, type)` solo **después** del éxito, para no consumir cuota en errores.
- `useFeatureAccess` mira `Infinity` correctamente: features ilimitadas siempre `allowed: true`.
- El backend es la **fuente de verdad**: si frontend y backend discrepan (cache stale), gana el 429 del backend.
