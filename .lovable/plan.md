

# Auditoría Ronda 9 — Puntos de Entrada de Datos y Flujo Consistente

## Resumen

Revisión de todos los puntos de entrada de datos (formularios, captura inteligente, OCR, voz, conciliación, suscripciones, review center) para verificar que cada uno use los hooks centralizados y que los datos fluyan correctamente hacia dashboards, proyecciones y presupuestos.

---

## Hallazgos

### 🔴 CRÍTICO — Notificaciones rotas por CHECK constraint

**Problema activo en consola**: El constraint `notifications_type_check` solo permite `('reminder', 'alert', 'success', 'warning', 'info')`, pero el código usa tipos como `bill_reminder`, `contract_reminder`, `tax_reminder`, `budget_alert`, `achievement`, `goal_milestone`, `goal_deadline`, `gamification`. **TODOS los auto-reminders fallan silenciosamente** cada ~60 segundos llenando la consola de errores.

Afecta: `useAutoReminders.ts`, `useGamificationNotifications.ts`, `useGoalNotifications.ts`, `TaxDeadlineCards.tsx`, `useFinancialEducation.ts`, `useGenerateSampleData.ts`.

**Fix**: Migración SQL para eliminar el check constraint y reemplazarlo con uno que incluya todos los tipos usados en la app.

---

### 🔴 CRÍTICO — `SmartTextInput` inserta ingresos con SQL directo (bypassa el hook centralizado)

En `SmartTextInput.tsx` línea 163: `supabase.from('income').insert({...})` en lugar de usar `useCreateIncome()`. Esto salta:
- Gamificación (`trackAction`, `triggers.income`)
- Audit log (`insertAuditLog`)
- Invalidación de caché (`afterIncome`) — el dashboard NO se actualiza
- Incremento de usage (`incrementUsage`)
- Detección de duplicados

**Fix**: Reemplazar la inserción directa con `useCreateIncome().mutateAsync()`.

---

### 🟠 — `SubscriptionTracker` inserta bills con SQL directo (bypassa `useCreateBill`)

En `SubscriptionTracker.tsx` línea 302: `supabase.from('recurring_bills').insert({...})`. Usa `afterBill()` para invalidar caché (bien), pero salta:
- Audit log
- Toast del hook centralizado (usa toast propio — OK pero inconsistente)

**Fix**: Migrar a `useCreateBill().mutateAsync()`.

---

### 🟠 — `RecurringBillConfirmDialog` inserta bills con SQL directo

En `RecurringBillConfirmDialog.tsx` línea 85: `supabase.from('recurring_bills').insert({...})`. No usa `useCreateBill()` ni `afterBill()`. El caché de bills **NO se invalida** tras crear — el componente depende de `onCreated` callback del padre, que puede o no invalidar.

**Fix**: Migrar a `useCreateBill().mutateAsync()` o al menos agregar `afterBill()`.

---

### 🟡 — `QuickCapture` no asigna `entity_id` a gastos creados vía OCR

En `QuickCapture.tsx` línea 249-258: al guardar gastos extraídos del OCR, no incluye `entity_id` ni `currency`. Los gastos quedan sin entidad fiscal, causando que no aparezcan en vistas filtradas por entidad, y sin moneda explícita (usa el default de la tabla).

**Fix**: Agregar `entity_id: currentEntity?.id || null` y `currency: currentEntity?.default_currency || 'CAD'` al objeto de gasto.

---

### 🟡 — `QuickCapture` no invalida `documents-review` tras update de documento

En líneas 207-220 y 263-268: actualiza el documento con `extracted_data` y `status` pero no invalida `['documents-review']` ni `['documents']`, dejando el Review Center desactualizado.

**Fix**: Agregar `queryClient.invalidateQueries({ queryKey: ['documents-review'] })` tras las actualizaciones.

---

## Plan de Implementación

### Paso 1: Migración SQL — Expandir notifications type check
Eliminar el constraint restrictivo y crear uno nuevo que incluya todos los tipos usados:
```sql
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type = ANY(ARRAY[
    'reminder','alert','success','warning','info',
    'bill_reminder','contract_reminder','tax_reminder',
    'budget_alert','achievement','gamification',
    'goal_milestone','goal_deadline','savings_alert',
    'income_alert','data_health','streak','level_up'
  ]));
```

### Paso 2: SmartTextInput — Usar hook centralizado para income
- Importar `useCreateIncome` 
- Reemplazar `supabase.from('income').insert(...)` con `createIncome.mutateAsync(data)`
- Eliminar `supabase.auth.getUser()` (ya disponible via `useAuth`)

### Paso 3: SubscriptionTracker — Usar `useCreateBill`
- Importar `useCreateBill` en lugar de `supabase.from('recurring_bills').insert`
- Eliminar `supabase.auth.getUser()` y `afterBill()` manuales (el hook los maneja)

### Paso 4: RecurringBillConfirmDialog — Agregar invalidación
- Importar `useInvalidateRelated` y llamar `afterBill()` tras la inserción exitosa
- O migrar completamente a `useCreateBill`

### Paso 5: QuickCapture — entity_id y currency en gastos OCR
- Agregar `entity_id` y `currency` a `expenseData` en `handleSaveCurrentExpense` y `handleSaveAll`
- Agregar invalidación de `documents-review` tras actualizar documentos

---

## Archivos a modificar

1. **Migración SQL** — Expandir `notifications_type_check`
2. `src/components/capture/SmartTextInput.tsx` — Usar `useCreateIncome`
3. `src/components/subscriptions/SubscriptionTracker.tsx` — Usar `useCreateBill`
4. `src/components/bills/RecurringBillConfirmDialog.tsx` — Agregar `afterBill()` invalidación
5. `src/components/capture/QuickCapture.tsx` — Agregar `entity_id`, `currency`, invalidar docs

