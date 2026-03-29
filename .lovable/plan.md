

# Auditoría Profunda de Datos — Plan de Correcciones

## Hallazgos de la Revisión

Revisé exhaustivamente todos los hooks de datos (`useExpenses`, `useIncome`, `useClients`, `useProjects`, `useContracts`, `useMileage`, `useTags`, `useSavingsGoals`, `useNetWorth`, `useRecurringBills`, `useBankTransactions`, `useCategoryBudgets`, `useFiscalEntities`, `useTrash`, `useDashboardStats`, `useInvalidateRelated`, `useDocumentReview`, `useDataHealthCheck`) y las relaciones entre ellos.

---

### ✅ Lo que funciona correctamente

1. **Soft-delete consistente**: Expenses, income, clients, projects, contracts y mileage usan `deleted_at` correctamente para soft-delete, y todas las queries de lectura filtran `.is('deleted_at', null)`.
2. **Invalidación centralizada**: `useInvalidateRelated` cubre bien las dependencias cruzadas (expense→dashboard, income→monthly-plan, etc.).
3. **Audit logging**: Create y delete de expenses, income, clients y projects registran en `audit_log`.
4. **Duplicate detection**: Expenses tiene detección de duplicados por amount+date+vendor.
5. **Entity filtering**: Expenses, income, bills, budgets soportan filtro por `entity_id`.
6. **Tag filtering**: Soporte AND/OR funcional.
7. **Realtime sync**: Expenses y documents tienen listeners de Postgres changes.
8. **Trash system**: Restaurar y vaciar papelera funciona para 5 tipos de entidad.
9. **Bills→payments**: Mark paid avanza `next_due_date` correctamente según frecuencia.

---

### 🔴 Problemas Encontrados (a corregir)

#### 1. Dashboard Stats — `deleted_at` no se filtra en contadores
**Archivo**: `useDashboardStats.ts` líneas 107-118
- `billableExpenses` y `totalExpenses` usan `count` sin filtrar `deleted_at`. Cuentan gastos eliminados.
- **Fix**: Agregar `.is('deleted_at', null)` a las queries de `billableCountResult` y `totalCountResult`.

#### 2. Income Summary — Límite de 500 puede truncar datos fiscales
**Archivo**: `useIncome.ts` línea 208
- `useIncomeSummary` tiene `.limit(500)`. Si un usuario tiene >500 registros de ingreso en un año, los totales fiscales serán incorrectos.
- **Fix**: Subir a 2000 o usar una RPC de agregación.

#### 3. Expense Query Limit — 500 puede perder datos
**Archivo**: `useExpenses.ts` línea 11
- `QUERY_LIMIT = 500`. Para reportes fiscales que necesitan TODOS los gastos del año, esto es insuficiente.
- **Fix**: Crear un hook separado `useAllExpensesForReport` sin límite, o paginar. El hook normal puede mantener 500 para la UI.

#### 4. Recurring Bills — No filtra `deleted_at` (si existe la columna)
**Archivo**: `useRecurringBills.ts` línea 66
- No hay filtro de soft-delete. Si la tabla tiene `deleted_at`, los bills eliminados aparecerían. Actualmente se usa hard-delete (`useDeleteBill` hace `.delete()`), lo cual es inconsistente con el resto del sistema.
- **Fix**: Considerar migrar a soft-delete como el resto de entidades, o dejar así si es intencional (el usuario confirma borrado).

#### 5. Tags y Assets/Liabilities — Hard delete sin audit log
**Archivos**: `useTags.ts`, `useNetWorth.ts`
- Tags, assets y liabilities se eliminan con hard delete sin registrar en audit_log.
- **Fix**: Agregar audit_log entries en las mutaciones de delete.

#### 6. Document Approve — Crea gasto sin `entity_id`
**Archivo**: `useDocumentReview.ts` línea 43-56
- `approveDocument` crea un expense pero NO asigna `entity_id`. El gasto queda huérfano de entidad fiscal.
- **Fix**: Obtener la entidad activa del contexto y asignarla al crear el expense.

#### 7. Document Approve — No usa `useInvalidateRelated`
**Archivo**: `useDocumentReview.ts` líneas 77-80
- Invalida queries manualmente en vez de usar el sistema centralizado. Falta invalidar `dashboard-stats`, `monthly-plan`, `data-health`.
- **Fix**: Usar `afterExpense()` y `afterDocument()`.

#### 8. Savings Contributions — Usa `as any` sin tipo seguro
**Archivo**: `useSavingsGoals.ts` líneas 152-153
- `savings_contributions` se accede con `as any`, sugiriendo que la tabla podría no estar en el schema tipado. Funciona pero sin type safety.
- **Fix**: Verificar que la tabla existe y regenerar tipos si es necesario.

#### 9. Trash — No incluye mileage ni documents
**Archivo**: `useTrash.ts`
- Mileage usa soft-delete (`deleted_at`) pero no aparece en la papelera.
- Documents eliminados tampoco se pueden restaurar.
- **Fix**: Agregar queries de mileage y documents al trash system.

#### 10. `useClients` — No filtra por `user_id`
**Archivo**: `useClients.ts` línea 20
- La query de clientes NO filtra por `user_id`. Depende 100% de RLS policies. Si RLS falla, se ven clientes de otros usuarios.
- **Fix**: Agregar `.eq('user_id', user.id)` como defensa en profundidad (igual que expenses y income).

#### 11. `useTags` — No filtra por `user_id` en query principal
**Archivo**: `useTags.ts` línea 12
- `useTags()` no filtra por `user_id`. Solo `useTagsWithExpenseCount` lo hace.
- **Fix**: Agregar filtro de user_id a `useTags()`.

#### 12. `useContracts` — No filtra por `user_id`
**Archivo**: `useContracts.ts` línea 11
- Misma situación que clients/tags.
- **Fix**: Agregar filtro de user_id.

---

### 🟡 Mejoras Recomendadas (no bloqueantes)

1. **Dashboard date format inconsistency**: `useDashboardStats` usa `.toISOString()` para expenses pero `format(date, 'yyyy-MM-dd')` para income. Ambos funcionan pero son inconsistentes.
2. **Expense bill matcher timeout**: `setTimeout(() => checkExpenseAgainstBills(...)`, 1500)` — delay arbitrario. Podría usar `queueMicrotask` o un efecto post-mutación.
3. **Net Worth snapshots limit 12**: Limita historial. Para usuarios a largo plazo, considerar paginación.

---

## Plan de Implementación

### Paso 1: Correcciones críticas de queries (seguridad + integridad)
- Agregar `user_id` filter a `useClients`, `useTags`, `useContracts`
- Agregar `deleted_at` filter a dashboard stats counters

### Paso 2: Document approval fix
- Agregar `entity_id` al crear expense desde document review
- Migrar a `useInvalidateRelated` para invalidación

### Paso 3: Trash completeness
- Agregar mileage al sistema de papelera

### Paso 4: Audit log completeness
- Agregar audit entries para delete de tags, assets, liabilities

### Paso 5: Query limits para reportes
- Crear variante sin límite para exportaciones fiscales
- Subir límite de income summary a 2000

---

## Detalle Técnico

### Archivos a modificar:
1. `src/hooks/data/useClients.ts` — agregar user_id filter
2. `src/hooks/data/useTags.ts` — agregar user_id filter  
3. `src/hooks/data/useContracts.ts` — agregar user_id filter
4. `src/hooks/data/useDashboardStats.ts` — agregar deleted_at filters
5. `src/hooks/data/useDocumentReview.ts` — entity_id + invalidación centralizada
6. `src/hooks/data/useTrash.ts` — agregar mileage
7. `src/hooks/data/useNetWorth.ts` — agregar audit_log en deletes
8. `src/hooks/data/useTags.ts` — agregar audit_log en delete
9. `src/hooks/data/useIncome.ts` — subir límite en summary

