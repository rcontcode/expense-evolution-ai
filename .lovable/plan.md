

# Auditoría de Datos — Ronda 2: Correcciones Pendientes

## Hallazgos Nuevos

Tras revisar todos los hooks post-correcciones anteriores, encontré estos problemas adicionales:

---

### 🔴 Problemas Críticos (seguridad/integridad)

#### 1. `useRecurringBills` — No filtra por `user_id`
La query principal (línea 63-66) no tiene `.eq('user_id', user.id)`. Depende 100% de RLS. Inconsistente con el resto del sistema que ya usa defensa en profundidad.

#### 2. `useBillPayments` — No filtra por `user_id`  
Misma situación (línea 80). Cualquier usuario podría ver pagos de otros si RLS falla.

#### 3. `useAssets` / `useLiabilities` / `useNetWorthSnapshots` — Sin filtro `user_id`
Las tres queries (líneas 221, 239, 257) no filtran por `user_id`. Solo dependen de RLS.

#### 4. `useSavingsGoals` — Sin filtro `user_id`
La query principal (línea 29) no filtra por `user_id`.

#### 5. `useCategoryBudgets` — Sin filtro `user_id`
Query principal (línea 24) no filtra por user.

#### 6. `useFiscalEntities` / `usePrimaryFiscalEntity` — Sin filtro `user_id`
Líneas 19 y 38 sin filtro explícito.

#### 7. `useInvestmentGoals` — Sin filtro `user_id`
Línea 31 depende solo de RLS.

#### 8. `useProjects` — Sin filtro `user_id`
Línea 14 no filtra. Tiene `user` en `useAuth` pero no lo usa en la query.

---

### 🟠 Problemas de Consistencia

#### 9. `useRecurringBills` — Hard delete inconsistente
`useDeleteBill` usa `.delete()` (hard delete) mientras todo el resto del sistema usa soft-delete. No tiene audit log.

#### 10. `useSavingsGoals` — Hard delete sin audit log
`useDeleteSavingsGoal` hace `.delete()` sin registrar en audit_log.

#### 11. `useCategoryBudgets` — Hard delete sin audit log
`useDeleteCategoryBudget` hace `.delete()` sin audit log.

#### 12. `useInvestmentGoals` — No usa `useInvalidateRelated`
Usa `queryClient.invalidateQueries` directamente en vez del sistema centralizado. Tampoco tiene audit log en delete.

#### 13. `useFiscalEntities` — Hard delete sin audit log
`useDeleteFiscalEntity` hace `.delete()` sin audit log. Eliminar una entidad fiscal es crítico y debería registrarse.

#### 14. `useDeleteClientTestData` — Bypass de soft-delete
Hace `.delete()` directamente en expenses, income, mileage, contracts — bypassing el sistema de soft-delete y sin audit log. Esto puede dejar datos huérfanos (expense_tags, documents vinculados).

---

### 🟡 Mejoras de Robustez

#### 15. `useDocumentsForReview` — No filtra `status` deleted
La query (línea 18) trae TODOS los documentos incluyendo los que se borraron con `deleteDocument`. No hay soft-delete en documents — se hace hard delete.

#### 16. `useExpenses` — El hook para reportes sigue usando límite 500
No se creó el hook `useAllExpensesForReport` sin límite que se planificó.

#### 17. `useFinancialJournal` — Sin límite default
Si un usuario acumula miles de entradas, `useFinancialJournal()` sin parámetro las trae todas.

---

## Plan de Implementación

### Paso 1: Agregar `user_id` filter a 8 hooks (seguridad)
- `useRecurringBills`, `useBillPayments`
- `useAssets`, `useLiabilities`, `useNetWorthSnapshots`
- `useSavingsGoals`, `useCategoryBudgets`
- `useFiscalEntities`, `usePrimaryFiscalEntity`
- `useInvestmentGoals`
- `useProjects`

### Paso 2: Audit log para deletes críticos
- `useDeleteBill` → audit log
- `useDeleteSavingsGoal` → audit log
- `useDeleteFiscalEntity` → audit log
- `useDeleteInvestmentGoal` → audit log

### Paso 3: Crear `useAllExpensesForReport`
- Hook sin límite para exportación fiscal
- Filtrado por año, sin paginación UI

### Paso 4: `useInvestmentGoals` — migrar a `useInvalidateRelated`

### Paso 5: Default limit en `useFinancialJournal`
- Agregar `.limit(500)` cuando no se pasa parámetro

---

## Detalle Técnico — Archivos a modificar

1. `src/hooks/data/useRecurringBills.ts` — user_id filter + audit log en delete
2. `src/hooks/data/useNetWorth.ts` — user_id filter en assets/liabilities/snapshots  
3. `src/hooks/data/useSavingsGoals.ts` — user_id filter + audit log en delete
4. `src/hooks/data/useCategoryBudgets.ts` — user_id filter
5. `src/hooks/data/useFiscalEntities.ts` — user_id filter + audit log en delete
6. `src/hooks/data/useInvestmentGoals.ts` — user_id filter + audit log + invalidación centralizada
7. `src/hooks/data/useProjects.ts` — user_id filter
8. `src/hooks/data/useExpenses.ts` — nuevo hook `useAllExpensesForReport`
9. `src/hooks/data/useFinancialJournal.ts` — default limit

