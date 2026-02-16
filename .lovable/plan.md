
# Auditoria de Sincronizacion: Problemas Encontrados

## Diagnostico

Tras revisar los 55 archivos que usan `invalidateQueries`, encontre que `useInvalidateRelated` se usa correctamente en los hooks principales (expenses, income, clients, projects, contracts, bills, entities, budgets, settings, trash), pero hay **11 hooks y componentes** que siguen usando invalidacion manual directa (`queryClient.invalidateQueries`) sin pasar por el sistema centralizado, lo que crea puntos ciegos de sincronizacion.

---

## Problemas Identificados

### 1. `useMileage` -- NO usa `useInvalidateRelated`
- Las 3 mutations (create/update/delete) usan `queryClient.invalidateQueries` directo
- Solo invalidan `mileage`, `mileage-summary`, `dashboard-stats`
- **Falta**: `data-health`, `income-summary` (el kilometraje afecta deducciones)
- **Falta**: No escribe en `audit_log`
- **Falta**: No tiene soft delete (usa `.delete()` permanente)

### 2. `useSavingsGoals` -- NO usa `useInvalidateRelated`
- Las 4 mutations usan `queryClient.invalidateQueries` directo
- Solo invalidan `savings-goals` y `savings-contributions`
- **Falta**: `dashboard-stats` (las metas de ahorro afectan el patrimonio)
- **Falta**: No tiene soft delete

### 3. `useNetWorth` (assets/liabilities) -- NO usa `useInvalidateRelated`
- Las 6 mutations (create/update/delete x2) usan `queryClient.invalidateQueries` directo
- Solo invalidan `assets` o `liabilities` individualmente
- **Falta**: `net-worth-snapshots`, `dashboard-stats` (el patrimonio neto no se recalcula al agregar/eliminar activos o pasivos)
- **Falta**: No tiene soft delete

### 4. `useTags` -- NO usa `useInvalidateRelated`
- Las 4 mutations usan `queryClient.invalidateQueries` directo
- Invalida `tags`, `tags-with-expense-count`, `expenses`
- **Falta**: `dashboard-stats`, `data-health`

### 5. `useFinancialHabits` -- NO usa `useInvalidateRelated`
- Solo invalida `financial-habits`
- Menor impacto, pero rompe consistencia del patron

### 6. `useFinancialJournal` -- NO usa `useInvalidateRelated`
- Solo invalida `financial-journal` y `financial-journal-stats`
- Menor impacto

### 7. `FamilyExpenseDialog` / `FamilyIncomeDialog` / `IncomeListWidget` -- Invalidacion manual parcial
- Estos componentes llaman a mutations de `useCreateExpense`/`useCreateIncome` (que SI usan `useInvalidateRelated`)
- PERO ademas agregan manualmente `queryClient.invalidateQueries({ queryKey: ["monthly-plan"] })`
- **Problema**: `monthly-plan` NO esta en `afterExpense()` ni `afterIncome()` del helper centralizado
- El "Plan Mensual" del presupuesto familiar no se actualiza cuando se crean gastos/ingresos desde OTRAS secciones (no desde el presupuesto)

### 8. `BulkMileageEntry` / `MileageImportDialog` -- Invalidacion manual
- Invalidan `mileage` y `mileage-summary` directamente
- **Falta**: `dashboard-stats`, `data-health`

### 9. `SubscriptionTracker` -- Invalidacion manual
- Al convertir suscripcion a pago recurrente, solo invalida `recurring-bills`
- **Falta**: `bill-payments`, `dashboard-stats`, `income-summary` (todo lo que hace `afterBill()`)

### 10. `useExpensesRealtime` -- NO usa `useInvalidateRelated`
- Invalida manualmente `expenses`, `dashboard-stats`, `income-summary`, `data-health`
- **Falta**: `category-budgets` (que SI esta en `afterExpense()`)
- **Falta**: `monthly-plan`

### 11. `afterBill()` -- Incompleto
- No invalida `monthly-plan` (el centro de pagos afecta el plan mensual)
- No invalida `data-health`

---

## Plan de Correccion

### A. Ampliar `useInvalidateRelated` con claves faltantes

Agregar al helper centralizado:

| Funcion | Agregar claves |
|---------|---------------|
| `afterExpense` | `monthly-plan` |
| `afterIncome` | `monthly-plan` |
| `afterBill` | `monthly-plan`, `data-health` |
| Nuevo: `afterMileage` | `mileage`, `mileage-summary`, `dashboard-stats`, `data-health` |
| Nuevo: `afterSavings` | `savings-goals`, `savings-contributions`, `dashboard-stats` |
| Nuevo: `afterNetWorth` | `assets`, `liabilities`, `net-worth-snapshots`, `dashboard-stats` |
| Nuevo: `afterTag` | `tags`, `tags-with-expense-count`, `expenses`, `data-health` |
| Nuevo: `afterHabit` | `financial-habits` |
| Nuevo: `afterJournal` | `financial-journal`, `financial-journal-stats` |

### B. Migrar hooks a `useInvalidateRelated`

Refactorizar estos archivos para eliminar `queryClient.invalidateQueries` directo:
1. `useMileage.ts` -- usar `afterMileage()`
2. `useSavingsGoals.ts` -- usar `afterSavings()`
3. `useNetWorth.ts` -- usar `afterNetWorth()`
4. `useTags.ts` -- usar `afterTag()`
5. `useFinancialHabits.ts` -- usar `afterHabit()`
6. `useFinancialJournal.ts` -- usar `afterJournal()`

### C. Migrar componentes con invalidacion manual

Eliminar los `queryClient.invalidateQueries` manuales de:
1. `FamilyExpenseDialog.tsx` -- ya no necesario (afterExpense incluira monthly-plan)
2. `FamilyIncomeDialog.tsx` -- ya no necesario
3. `IncomeListWidget.tsx` -- ya no necesario
4. `BulkMileageEntry.tsx` -- ya no necesario
5. `MileageImportDialog.tsx` -- ya no necesario
6. `SubscriptionTracker.tsx` -- usar `afterBill()` via hook

### D. Migrar `useExpensesRealtime` al helper

Reemplazar las 4 llamadas manuales por `afterExpense()` importando desde `useInvalidateRelated`.

### E. Agregar soft delete a Mileage

La tabla `mileage` es la unica tabla principal que todavia usa eliminacion permanente. Agregar `deleted_at` y filtro `.is('deleted_at', null)`.

---

## Resumen de Impacto

| Seccion afectada | Problema actual | Despues de fix |
|-----------------|----------------|----------------|
| Presupuesto Familiar | No se actualiza al crear gastos desde otras secciones | Se actualiza automaticamente |
| Dashboard | No refleja cambios en activos/pasivos/metas | Se actualiza automaticamente |
| Health Check | No detecta cambios en mileage/tags | Detecta todo |
| Patrimonio Neto | Agregar activo no actualiza snapshots | Se sincroniza |
| Centro de Pagos | Pagar factura no actualiza plan mensual | Se sincroniza |
| Realtime | Gasto externo no actualiza presupuestos | Se sincroniza |

**Total: 17 archivos a modificar, 1 migracion SQL (soft delete mileage).**
