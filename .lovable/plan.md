

# Auditoría Ronda 10 — Últimos Bypasses de Hooks Centralizados

## Resumen

Quedan **4 puntos de entrada** que aún insertan datos financieros con SQL directo, saltando los hooks centralizados. Esto causa que esas operaciones no registren audit log, no disparen gamificación, y en algunos casos no invaliden todo el caché necesario.

---

## Hallazgos

### 🔴 `RecurringBillConfirmDialog` — Direct SQL insert (bypass `useCreateBill`)

**Línea 87**: `supabase.from('recurring_bills').insert({...})` en lugar de `useCreateBill().mutateAsync()`.
- Salta audit log del hook centralizado
- Tiene su propio `afterBill()` (OK) pero la lógica de budget linking es local y compleja
- El hook `useCreateBill` ya maneja `user_id`, toast, y `afterBill()`

**Fix**: Usar `useCreateBill().mutateAsync()` para la inserción, mantener la lógica de budget linking como está.

---

### 🔴 `SubscriptionTracker` — Direct SQL insert (bypass `useCreateBill`)

**Línea 304**: `supabase.from('recurring_bills').insert({...})` con `supabase.auth.getUser()` manual.
- Salta audit log
- Usa `getUser()` en vez de `useAuth()` (llamada de red innecesaria)

**Fix**: Importar `useCreateBill` y reemplazar la inserción directa.

---

### 🔴 `ExpenseReviewCenter.handleApproveIncome` — Direct SQL insert (bypass `useCreateIncome`)

**Línea 355**: `supabase.from('income').insert({...})` directamente.
- Salta gamificación (`trackAction`, `triggers.income`)
- Salta audit log (`insertAuditLog`)
- Salta incremento de usage (`incrementUsage`)
- Hace invalidación manual parcial (bien pero incompleta vs hook)

**Fix**: Importar `useCreateIncome` y usar `.mutateAsync()`.

---

### 🟡 `LinkReceiptDialog.handleLink` — Update sin ownership check

**Línea 194**: `supabase.from('expenses').update({ document_id }).eq('id', expenseId)` sin `.eq('user_id', user.id)`.

**Fix**: Agregar ownership check.

---

## Plan de Implementación

### Paso 1: `RecurringBillConfirmDialog` — Migrar a `useCreateBill`
- Importar `useCreateBill` del hook
- Reemplazar `supabase.from('recurring_bills').insert(...)` con `createBill.mutateAsync(billData)`
- Eliminar `afterBill()` manual (el hook lo hace)
- Mantener lógica de budget linking intacta

### Paso 2: `SubscriptionTracker` — Migrar a `useCreateBill`
- Importar `useCreateBill`
- Reemplazar inserción directa + `getUser()` con `createBill.mutateAsync()`
- Eliminar `afterBill()` manual

### Paso 3: `ExpenseReviewCenter.handleApproveIncome` — Migrar a `useCreateIncome`
- Importar `useCreateIncome`
- Reemplazar `supabase.from('income').insert(...)` con `createIncome.mutateAsync()`
- Eliminar invalidaciones manuales parciales (el hook las cubre via `afterIncome`)
- Mantener document update y entity lookup

### Paso 4: `LinkReceiptDialog` — Agregar ownership check
- Agregar `.eq('user_id', user.id)` al update de expenses

---

## Archivos a modificar

1. `src/components/bills/RecurringBillConfirmDialog.tsx`
2. `src/components/subscriptions/SubscriptionTracker.tsx`
3. `src/components/expenses/ExpenseReviewCenter.tsx`
4. `src/components/dialogs/LinkReceiptDialog.tsx`
