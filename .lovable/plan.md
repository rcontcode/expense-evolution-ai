

# Auditoría Ronda 11 — Ownership en Soft-Deletes, Bulk Bypasses y Trash

## Resumen

Quedan **3 categorías de problemas** pendientes: mutaciones de eliminación sin ownership check, componentes de mileage que bypasean el hook centralizado, y operaciones de trash sin filtro de usuario.

---

## Hallazgos

### 🔴 Soft-deletes sin `.eq('user_id')` — 5 hooks

Estas mutaciones hacen `.update({ deleted_at }).eq('id', id)` sin verificar ownership. Si RLS falla, un usuario podría borrar registros de otro.

| Hook | Línea | Tabla |
|------|-------|-------|
| `useDeleteContract` | 142 | `contracts` |
| `useDeleteProject` | 124 | `projects` |
| `useDeleteMileage` | 208 | `mileage` |
| `useDeleteIncome` | 168 | `income` |
| `useDeleteExpense` | 261 | `expenses` |

**Fix**: Agregar `.eq('user_id', user.id)` a cada uno. Varios de estos hooks ya tienen `useAuth` disponible o usan `getUser()`.

---

### 🔴 `BulkMileageEntry` y `MileageImportDialog` — SQL directo (bypasean `useCreateMileage`)

Ambos componentes insertan en `mileage` con `supabase.from('mileage').insert()` directamente, saltando:
- Gamificación (`trackAction('add_mileage')`)
- `entity_id` assignment
- El hook centralizado `useCreateMileage`

**Nota**: Estos hacen inserciones en batch (múltiples filas), y `useCreateMileage` solo soporta un registro. La solución es iterar con el hook o crear un `useCreateMileageBatch` que mantenga la misma lógica.

**Fix pragmático**: Agregar `entity_id`, `afterMileage()` (ya lo tienen), y `trackAction` manualmente a ambos componentes. Es más seguro que refactorizar el hook para batch.

---

### 🟠 Trash: `useRestoreItem` y `usePermanentDelete` sin ownership check

- `useRestoreItem` línea 106: `.update({ deleted_at: null }).eq('id', id)` — sin `user_id`
- `usePermanentDelete` línea 144: `.delete().eq('id', id)` — sin `user_id`
- `useEmptyTrash` línea 194: `.delete().not('deleted_at', 'is', null)` — sin `user_id` (depende 100% de RLS)

**Fix**: Agregar `.eq('user_id', user.id)` o pasar `useAuth` al contexto de cada mutación.

---

### 🟡 `useUpdateMileage` sin ownership check

Línea 182: `.update(data).eq('id', id)` sin `.eq('user_id')`.

**Fix**: Agregar ownership check.

---

### 🟡 `useCreateContract` usa `getUser()` en vez de `useAuth()`

Línea 36: llamada de red innecesaria.

**Fix**: Usar `useAuth()` que ya está disponible en el patrón del hook.

---

## Consecuencias si no se arregla

- Sin ownership en deletes: si RLS se desactiva accidentalmente, cualquier usuario autenticado podría borrar datos de otros
- Sin entity_id en mileage bulk: los viajes no aparecen en vistas filtradas por entidad fiscal
- Sin gamificación en bulk mileage: usuarios no reciben puntos/misiones por esos viajes

## Consecuencias negativas del fix

- **Ninguna funcional**. Solo se agregan filtros defensivos y campos faltantes
- Riesgo mínimo: si un registro no tiene `user_id` por error legacy, el ownership check fallaría silenciosamente (pero esto es correcto — protege integridad)

---

## Plan de Implementación

### Paso 1: Ownership en 5 soft-delete hooks
- `useDeleteContract`: agregar `.eq('user_id', user.id)` + usar `useAuth()` en vez de `getUser()`
- `useDeleteProject`: agregar `.eq('user_id', user.id)`
- `useDeleteMileage`: agregar `.eq('user_id', user.id)`
- `useDeleteIncome`: agregar `.eq('user_id', user.id)`
- `useDeleteExpense`: agregar `.eq('user_id', user.id)` (verificar si ya lo tiene)

### Paso 2: Ownership en Trash operations
- `useRestoreItem`: agregar `.eq('user_id', user.id)`
- `usePermanentDelete`: agregar `.eq('user_id', user.id)`
- `useEmptyTrash`: agregar `.eq('user_id', user.id)` a cada delete
- Migrar los 3 de `getUser()` a `useAuth()`

### Paso 3: `BulkMileageEntry` y `MileageImportDialog` — entity_id + gamificación
- Agregar `entity_id: currentEntity?.id || null` a las inserciones
- Agregar `trackAction('add_mileage', count)` tras inserción exitosa
- Importar `useEntity` y `useMissionTracker`

### Paso 4: `useUpdateMileage` — ownership check
- Agregar `.eq('user_id', user.id)` al update

### Paso 5: `useCreateContract` — migrar a `useAuth()`
- Reemplazar `getUser()` con `useAuth()` que ya es patrón estándar

---

## Archivos a modificar

1. `src/hooks/data/useContracts.ts` — ownership delete + useAuth migration
2. `src/hooks/data/useProjects.ts` — ownership delete
3. `src/hooks/data/useMileage.ts` — ownership delete + update
4. `src/hooks/data/useIncome.ts` — ownership delete
5. `src/hooks/data/useExpenses.ts` — verificar ownership delete
6. `src/hooks/data/useTrash.ts` — ownership en restore/delete/empty + useAuth
7. `src/components/mileage/BulkMileageEntry.tsx` — entity_id + gamificación
8. `src/components/mileage/MileageImportDialog.tsx` — entity_id + gamificación

