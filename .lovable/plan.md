# Plan: Mensajería de límites + Upgrade contextual en TODA la app

## Problema detectado

Tu cuenta admin pasa los límites (modo "dios"), pero cuentas normales **fallan en silencio o con mensajes genéricos** en muchos flujos. El backend SÍ bloquea (devuelve `429 quota_exceeded` o `402 credits exhausted`), pero el frontend en muchos casos:

1. Solo muestra `toast.error('Failed to process')` sin explicar el motivo
2. No detecta el código `429` vs un error real → el usuario cree que está roto
3. **No ofrece la ruta de upgrade** al plan que desbloquearía la función

### Caso concreto del usuario (Chaos Inbox + Contrato)
En `useUnifiedChaosInbox.ts` (línea 597-622), cuando se llama `analyze-contract`:
- El plan **Free** y **Premium** tienen `contract_analyses_per_month = 0` → siempre devuelve `429`
- El frontend hace `try { ... } catch { processedResult = { analysisError: true } }` y **no muestra nada explicativo**

## Estado actual: dónde SÍ funciona vs dónde NO

```text
✅ Bien implementado (UpgradePrompt visible)
   - ExpenseDialog        → bloquea + muestra prompt (pero solo conteo, no IA)
   - IncomeDialog         → ídem
   - ClientDialog         → ídem
   - PlanUsageCard        → tarjeta de settings

❌ Falla silenciosa o solo toast genérico
   - Chaos Inbox  → contratos / banco / OCR
   - QuickCapture / ReceiptReviewDialog  → process-receipt (límite OCR)
   - BankImportDialog + useBankImportFlow  → process-bank-statement
   - ContractTermsViewer  → analyze-contract directo
   - SmartTextInput  → parse-smart-input (créditos IA agotados)
   - SmartReconciliationPanel  → ai-reconcile (créditos IA)
   - FinancialAutopilot  → financial-autopilot (créditos IA)
   - ExpensePredictions  → predict-expenses (créditos IA)
   - useTagSuggestions  → suggest-tags (créditos IA)
   - EcosystemSmartCoaching  → ecosystem-coaching (créditos IA)
   - ChatAssistant voz  → 429 voice limit / 402 credits
   - VoicePreferencesCard preview voz  → ídem
   - useElevenLabsTTS (TTS general)  → ídem (parcial)
```

## Solución propuesta

### 1. Hook centralizado `useAIErrorHandler`
Nuevo archivo: `src/hooks/utils/useAIErrorHandler.ts`

Toma cualquier error de `supabase.functions.invoke()` o respuesta y:
- Detecta `quota_exceeded` (429), `credits_exhausted` (402), `plan_required`
- Mapea el feature → plan requerido (contracts → Pro, OCR → Premium, voz Premium → Premium, etc.)
- Abre un `UpgradePrompt` específico, o muestra un toast con CTA "Ver planes"

API:
```ts
const { handleAIError } = useAIErrorHandler();
const { data, error } = await supabase.functions.invoke('analyze-contract', {...});
if (error || data?.error) {
  handleAIError(error || data, { feature: 'contracts' });
  return;
}
```

### 2. Estandarizar respuestas de error en edge functions
Algunas funciones devuelven `{ error: 'AI credits exhausted' }`, otras `{ error: 'quota_exceeded', message, currentUsage, limit }`. Unificar a:
```json
{ "error": "quota_exceeded" | "credits_exhausted" | "plan_required",
  "feature": "contracts",
  "currentPlan": "free",
  "requiredPlan": "pro",
  "message": "...",
  "currentUsage": 0, "limit": 0 }
```
Funciones a actualizar: `analyze-contract`, `process-receipt`, `process-bank-statement`, `elevenlabs-tts`, `parse-smart-input`, `ai-reconcile`, `financial-autopilot`, `predict-expenses`, `suggest-tags`, `ecosystem-coaching`, `classify-document`, `classify-bank-transactions`.

Para las que sólo tienen 402 (créditos IA del gateway), añadir además **chequeo previo de plan** cuando la feature es premium-only (ej: `financial-autopilot` debería requerir Premium+).

### 3. Pre-chequeo en el cliente antes de enviar
En cada flujo que invoca IA, **antes** de subir el archivo / enviar la petición, llamar al hook:

```tsx
const { canAnalyzeContract, canUseOCR, canAnalyzeBank, hasFeature, planType } = usePlanLimits();

// Chaos Inbox - antes de procesar contrato
if (type === 'contract' && !canAnalyzeContract()) {
  setUpgradeFeature('contracts'); setUpgradeOpen(true); return;
}
```

Puntos a parchar:
| Archivo | Feature a chequear | Plan requerido |
|---|---|---|
| `useUnifiedChaosInbox.ts` (3 casos) | OCR / contracts / bank | Premium / Pro / Pro |
| `ChaosInbox.tsx` (2 casos) | OCR | Premium |
| `ReceiptReviewDialog.tsx` | OCR | Premium |
| `QuickCapture.tsx` | OCR | Premium |
| `BankImportDialog.tsx` + `useBankImportFlow.ts` | bank | Pro |
| `ContractTermsViewer.tsx` | contracts | Pro |
| `FinancialAutopilot.tsx` | autopilot (nuevo flag) | Premium |
| `SmartReconciliationPanel.tsx` | reconcile | Premium |
| `ExpensePredictions.tsx` | predictions | Premium |
| `EcosystemSmartCoaching.tsx` | coaching | Bundle |
| `useElevenLabsTTS.ts` | premium voice (minutos) | Premium |
| `ChatAssistant.tsx` | voice | Premium |

### 4. Banner permanente "feature bloqueada" en lugar de botón roto
Para botones/secciones de features Pro a las que un usuario Free entra (ej: tab de Banking, tab de Contratos), envolver en un componente `<FeatureGate feature="contracts">` que:
- Si tiene acceso → renderiza children
- Si no → muestra una tarjeta locked con icono, descripción del valor, y botón "Desbloquear con Pro – $14.99/mes"

Nuevo componente: `src/components/FeatureGate.tsx`

### 5. Mejorar `UpgradePrompt` con feature `contracts` ya existente
El componente ya tiene mensajería rica para `contracts`, `ocr`, `mileage`, etc. **Solo falta dispararlo desde los flujos faltantes**. Añadir mensajería para:
- `voice_premium` (minutos voz Eleven Labs)
- `bank_analysis`
- `ai_reconcile`
- `predictions`
- `autopilot`

## Detalles técnicos

### Archivos nuevos
- `src/hooks/utils/useAIErrorHandler.ts` — handler único + estado del modal
- `src/components/FeatureGate.tsx` — wrapper UI para gating
- `src/contexts/UpgradePromptContext.tsx` — provider global para abrir UpgradePrompt desde cualquier hook (opcional pero limpio)

### Edits
- `src/components/UpgradePrompt.tsx` — añadir 5 entradas al `friendlyMessages`
- 12 ediciones en componentes/hooks listados arriba
- 6-8 ediciones en edge functions para estandarizar payload de error

### Tests rápidos a hacer manualmente tras implementar
1. Cuenta Free sube contrato en Chaos Inbox → debe ver modal "Pro necesario para análisis de contratos"
2. Cuenta Free intenta OCR de recibo nº 6 → modal "OCR limit – Premium"
3. Cuenta Premium sube extracto bancario → modal "Análisis bancario – Pro"
4. Cuenta Free habla con asistente >3 min → modal "Voz Premium – Premium"
5. Cuenta Free abre Autopilot → tarjeta locked con CTA upgrade

## Entregables
- 3 archivos nuevos (`useAIErrorHandler`, `FeatureGate`, opcional `UpgradePromptContext`)
- ~12 ediciones de hooks/componentes para integrar el handler
- ~8 ediciones de edge functions para estandarizar errores
- Ampliación de mensajes en `UpgradePrompt.tsx`

## Fuera del alcance
- Cambios al sistema de planes/precios
- Refactor del sistema de pagos Stripe
- Lógica nueva de tracking de uso (ya existe)
