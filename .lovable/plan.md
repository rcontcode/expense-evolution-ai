

# Auditoría Ronda 12 — Ownership Faltante, Cache Roto y Manipulación Directa Residual

## Resumen

Quedan **6 problemas** de manipulación de datos: deletes/updates sin ownership check, `window.location.reload()` en vez de invalidación de caché, y operaciones de notificaciones sin filtro de usuario.

---

## Hallazgos

### 🔴 `useBudgetAlertRules` — Update y Delete sin ownership check

- **`useUpdateAlertRule`** (línea 54): `.update(updates).eq('id', id)` — sin `.eq('user_id', user.id)`
- **`useDeleteAlertRule`** (línea 69): `.delete().eq('id', id)` — sin `.eq('user_id', user.id)`
- Tampoco usa `useAuth()` en esas mutaciones (solo en la query y create)

**Fix**: Agregar `useAuth()` y `.eq('user_id', user!.id)` a ambas.

---

### 🔴 `Files.tsx` — Bulk delete sin ownership check + `window.location.reload()`

- **Línea 248**: `.delete().eq('id', f.id)` sin `.eq('user_id', user.id)`. Cualquier archivo podría borrarse si RLS falla.
- **Línea 259**: Usa `window.location.reload()` — destruye todo el estado de React, pierde contexto, y es un antipatrón. Debe usar `queryClient.invalidateQueries()`.

**Fix**: Agregar ownership check y reemplazar reload con invalidación.

---

### 🔴 `Notifications.tsx` — `deleteNotification` sin ownership

- **Línea 127**: `.delete().eq('id', id)` — sin `.eq('user_id', user.id)`.
- `markAsRead` (línea 106): `.update({ read: true }).eq('id', id)` — sin ownership.
- `DashboardNotificationHub` (línea 143): mismo problema en `markRead`.

**Fix**: Agregar `.eq('user_id', user!.id)` a las 3 operaciones.

---

### 🟠 `Reconciliation.tsx` — Direct SQL update + `window.location.reload()`

- **Línea 600-603**: Update directo de `bank_transactions` inline en JSX (no usa hook) sin ownership.
- **Línea 606**: `window.location.reload()` — debe usar `queryClient.invalidateQueries()`.

**Fix**: Agregar ownership y reemplazar reload con invalidación de `['bank-transactions']`.

---

### 🟡 `FinancialWorryDump` — Updates sin ownership check

- **Línea 83**: `.update({ released: true }).eq('id', id)` — sin user_id.
- **Línea 96**: `.update({ converted_to_journal: true }).eq('id', entry.id)` — sin user_id.

**Fix**: Agregar `.eq('user_id', user!.id)` a ambas.

---

### 🟡 `EcosystemNotifications` — `markReadMutation` sin ownership check

- **Línea 30**: `.update({ is_read: true }).eq('id', id)` — sin user_id.

**Fix**: Agregar `.eq('user_id', user!.id)`.

---

## Consecuencias si no se arregla

- Sin ownership en deletes/updates: si RLS falla, operaciones cruzadas entre usuarios
- `window.location.reload()`: experiencia degradada (parpadeo, pérdida de estado, scroll reset)
- Inconsistencia: algunos hooks tienen ownership, otros no — riesgo de regresión

## Consecuencias del fix

- **Ninguna negativa**. Solo se agregan filtros defensivos y se mejora la experiencia de usuario eliminando reloads.

---

## Plan de Implementación

### Paso 1: `useBudgetAlertRules` — Ownership en update y delete
- Agregar `useAuth()` a `useUpdateAlertRule` y `useDeleteAlertRule`
- Agregar `.eq('user_id', user!.id)` a ambas mutaciones

### Paso 2: `Files.tsx` — Ownership en bulk delete + eliminar reload
- Agregar `.eq('user_id', user!.id)` al delete
- Reemplazar `window.location.reload()` con invalidación de `['all-files']` y `['documents']`

### Paso 3: `Notifications.tsx` + `DashboardNotificationHub` — Ownership
- `deleteNotification`: agregar `.eq('user_id', user!.id)`
- `markAsRead`: agregar `.eq('user_id', user!.id)` 
- `DashboardNotificationHub.markRead`: agregar `.eq('user_id', user!.id)`

### Paso 4: `Reconciliation.tsx` — Ownership + eliminar reload
- Agregar `.eq('user_id', user!.id)` al update inline
- Reemplazar `window.location.reload()` con `queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })`

### Paso 5: `FinancialWorryDump` — Ownership en updates
- Agregar `.eq('user_id', user!.id)` a `release` y `convertToJournal`

### Paso 6: `EcosystemNotifications` — Ownership en markRead
- Agregar `.eq('user_id', user!.id)` al update

---

## Archivos a modificar

1. `src/hooks/data/useBudgetAlertRules.ts` — ownership en update/delete
2. `src/pages/Files.tsx` — ownership + eliminar reload
3. `src/pages/Notifications.tsx` — ownership en delete/markRead
4. `src/components/dashboard/DashboardNotificationHub.tsx` — ownership en markRead
5. `src/pages/Reconciliation.tsx` — ownership + eliminar reload
6. `src/components/ecosystem/FinancialWorryDump.tsx` — ownership en updates
7. `src/components/ecosystem/EcosystemNotifications.tsx` — ownership en markRead

