

# Auditoría Ronda 7 — Consistencia, Cache, Ownership en Mutaciones y Flujo de Datos

## Hallazgos Nuevos

---

### 🔴 CRÍTICO — Mutaciones sin ownership check (pueden operar datos de otros usuarios)

Varias mutaciones hacen `.delete().eq('id', id)` o `.update().eq('id', id)` **sin verificar `user_id`**. Si RLS falla, cualquier usuario autenticado podría borrar/modificar registros de otro usuario.

| Hook | Función | Problema |
|------|---------|----------|
| `useRecurringBills.ts` | `useDeleteBill` | `.delete().eq('id', id)` sin `.eq('user_id')` |
| `useRecurringBills.ts` | `useUpdateBill` | `.update().eq('id', id)` sin `.eq('user_id')` |
| `useRecurringBills.ts` | `useMarkBillPaid` | `.select().eq('id', billId)` y `.update().eq('id', billId)` sin user_id |
| `useNetWorth.ts` | `useDeleteAsset` | `.delete().eq('id', id)` sin user_id |
| `useNetWorth.ts` | `useDeleteLiability` | `.delete().eq('id', id)` sin user_id |
| `useNetWorth.ts` | `useUpdateAsset` | `.update().eq('id', id)` sin user_id |
| `useNetWorth.ts` | `useUpdateLiability` | `.update().eq('id', id)` sin user_id |
| `useCategoryBudgets.ts` | `useDeleteCategoryBudget` | `.delete().eq('id', id)` sin user_id |
| `useBankTransactions.ts` | `useDeleteBankTransaction` | `.delete().eq('id', id)` sin user_id |
| `useBankTransactions.ts` | `useMatchTransaction` | `.update().eq('id', transactionId)` sin user_id |
| `useBankTransactions.ts` | `useMarkAsDiscrepancy` | `.update().eq('id', transactionId)` sin user_id |
| `useExpenses.ts` | `useUpdateExpense` | `.update().eq('id', id)` sin user_id |
| `useContracts.ts` | `useUpdateContract` | `.update().eq('id', id)` sin user_id |
| `useDocumentReview.ts` | `rejectDocument`, `addComment` | `.update().eq('id', id)` sin user_id |

**Fix**: Agregar `.eq('user_id', user.id)` a todas las mutaciones como segunda capa de protección.

---

### 🔴 CRÍTICO — `useBankTransactionsWithMatches` obtiene TODOS los expenses sin límite ni `deleted_at` filter

Línea 77-81: Consulta todos los gastos del usuario sin `.is('deleted_at', null)` ni `.limit()`. En usuarios con miles de gastos, esto:
- Carga datos innecesarios (gastos eliminados)
- Genera matches falsos con gastos borrados
- Puede causar timeout en la query

**Fix**: Agregar `.is('deleted_at', null).limit(500)`.

---

### 🟠 `useBankTransactions` — queryKey sin user_id + usa `getUser()` en vez de `useAuth()`

El `queryKey` es `['bank-transactions']` sin user_id, causando posible leak de caché entre usuarios. Además, usa `supabase.auth.getUser()` (llamada de red) en cada fetch en lugar del user ya disponible via `useAuth()`. Mismo problema en `useBankTransactionsWithMatches`.

**Fix**: Migrar a `useAuth()` pattern y agregar `user?.id` al queryKey, igual que todos los demás hooks.

---

### 🟠 `useContracts` — queryKey sin user_id

El queryKey es `['contracts']` sin user_id. Usa `getUser()` en la queryFn. Debería migrar al patrón `useAuth()` estándar.

---

### 🟠 `useDeleteFile` — sin ownership check ni audit log

`useDeleteFile` hace hard delete de documents y contracts sin verificar user_id y sin registrar en audit_log. Además, no usa `useInvalidateRelated`.

---

### 🟡 `useFinancialJournal` — `useDeleteJournalEntry` sin audit_log

El delete tiene ownership check (`.eq('user_id', user.id)`) pero no registra en audit_log.

---

### 🟡 `useDeleteCategoryBudget` — sin audit log

Borra sin registrar en audit_log.

---

## Plan de Implementación

### Paso 1: Agregar ownership check a TODAS las mutaciones

Agregar `.eq('user_id', user.id)` como segundo filtro a:
- `useRecurringBills.ts` — delete, update, mark paid (3 funciones)
- `useNetWorth.ts` — delete asset, delete liability, update asset, update liability (4 funciones)
- `useCategoryBudgets.ts` — delete (1 función)
- `useBankTransactions.ts` — delete, match, discrepancy (3 funciones)
- `useExpenses.ts` — update (1 función)
- `useContracts.ts` — update contract (1 función)
- `useDocumentReview.ts` — reject, addComment (2 funciones)
- `useDeleteFile.ts` — agregar user_id check (1 función)

### Paso 2: Estandarizar queryKeys y auth pattern en bank transactions + contracts

- `useBankTransactions` → migrar a `useAuth()`, queryKey `['bank-transactions', user?.id]`
- `useBankTransactionsWithMatches` → mismo + agregar `deleted_at` filter + limit a expenses
- `useContracts` → migrar a `useAuth()`, queryKey `['contracts', user?.id]`

### Paso 3: Agregar audit_log a deletes faltantes

- `useDeleteJournalEntry` → agregar `insertAuditLog`
- `useDeleteCategoryBudget` → agregar `insertAuditLog`
- `useDeleteFile` → agregar `insertAuditLog`

---

## Archivos a modificar

1. `src/hooks/data/useRecurringBills.ts` — ownership en 3 mutations
2. `src/hooks/data/useNetWorth.ts` — ownership en 4 mutations
3. `src/hooks/data/useCategoryBudgets.ts` — ownership + audit log
4. `src/hooks/data/useBankTransactions.ts` — useAuth migration + ownership en 3 mutations + deleted_at filter
5. `src/hooks/data/useExpenses.ts` — ownership en update
6. `src/hooks/data/useContracts.ts` — useAuth migration + ownership en update
7. `src/hooks/data/useDocumentReview.ts` — ownership en reject + addComment
8. `src/hooks/data/useDeleteFile.ts` — ownership + audit log
9. `src/hooks/data/useFinancialJournal.ts` — audit log en delete

