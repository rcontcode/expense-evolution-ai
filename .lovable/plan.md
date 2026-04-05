

# Plan: Depurar y Completar el Sistema de Importación Bancaria

## Problemas Encontrados

1. **Tipo `BankTransaction` incompleto**: La interfaz en `useBankTransactions.ts` no incluye las columnas nuevas (`transaction_type`, `category`, `is_recurring`, `recurring_type`, `bank_name`, `original_amount`, `duplicate_hash`, `auto_categorized`, `matched_income_id`). Los componentes acceden a estos campos sin tipado correcto.

2. **Bug de closure en `runBatchClassification`**: En línea 224 de `useBankImportFlow.ts`, se usa `state.insertedIds` dentro de un `useCallback` sin incluirlo en las dependencias. Cuando se ejecuta, `state.insertedIds` todavía es `[]` porque se setea en `insertAndClassify` pero el callback ya fue creado. Resultado: el summary se construye con un array vacío.

3. **Edge Function `analyze-bank-statement` no existe**: El handler de PDF (línea 107 de `BankImportDialog.tsx`) invoca `analyze-bank-statement` pero esa función no existe en `supabase/functions/`. El upload de PDF siempre falla silenciosamente.

4. **`autoCreateRecords` inserta `vendor: undefined`**: En línea 298, `vendor: t.description || undefined` debería ser `null` en vez de `undefined` para compatibilidad con Supabase.

## Solución

### 1. Actualizar interfaz `BankTransaction` (useBankTransactions.ts)
Agregar los campos que ya existen en la DB:
- `transaction_type`, `category`, `is_recurring`, `recurring_type`
- `bank_name`, `original_amount`, `duplicate_hash`, `auto_categorized`
- `matched_income_id`

### 2. Corregir bug de closure en `useBankImportFlow.ts`
Cambiar `runBatchClassification` para que reciba `insertedIds` como parámetro en vez de leerlo del state. Pasar los IDs explícitamente desde `insertAndClassify`.

### 3. Crear Edge Function `analyze-bank-statement` para PDFs
Reusar la misma lógica del `process-bank-statement` existente pero aceptando PDF en base64. Enviar el contenido a la IA para extraer transacciones del PDF.

### 4. Corregir `undefined` → `null` en autoCreateRecords
Cambiar `vendor: t.description || undefined` a `vendor: t.description || null` y `source: t.description || undefined` a `source: t.description || null`.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/data/useBankTransactions.ts` | Actualizar interfaz `BankTransaction` con todas las columnas nuevas |
| `src/hooks/data/useBankImportFlow.ts` | Fix closure bug en `runBatchClassification`, fix `undefined` → `null` |
| `supabase/functions/analyze-bank-statement/index.ts` | **NUEVO** - Edge Function para procesar PDFs bancarios |
| `src/components/dialogs/BankImportDialog.tsx` | Ajuste menor: asegurar que el PDF handler envíe el formato correcto |

## Detalle Técnico

**Closure fix**: `insertAndClassify` ya tiene los `insertedIds`. En vez de que `runBatchClassification` lea `state.insertedIds` (que está vacío por el timing), se le pasan directamente:

```typescript
// Antes (bug):
await buildSummary(state.insertedIds.length > 0 ? state.insertedIds : transactionIds);

// Después (fix):
// runBatchClassification recibe insertedIds como segundo parámetro
await buildSummary(insertedIds);
```

**Edge Function `analyze-bank-statement`**: Acepta `{ content: base64, contentType: 'pdf' }`, envía a Gemini para extraer transacciones del PDF, devuelve el mismo formato que `process-bank-statement` para mantener compatibilidad con el dialog.

