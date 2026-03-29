
# Auditoría Profunda Ronda 5 — Limpieza Final de Datos

## Hallazgos Pendientes

---

### 🟠 `as any` innecesarios — Tablas que EXISTEN en el schema

#### 1. `useAutoReminders.ts` — 4 casts innecesarios
- Línea 57: `from('notification_preferences' as any)` → tabla existe en schema
- Línea 308: `from('budget_alert_rules' as any)` → tabla existe en schema
- Línea 365: `from('budget_alert_rules' as any)` → tabla existe
- Línea 126: `} as any)` en insert a `notifications` → tabla existe, campos coinciden

#### 2. `useNotificationActions.ts` — 3 casts innecesarios
- Líneas 19, 44, 69: `.update({...} as any)` en `notifications` → tabla existe en schema, los campos `snoozed_until`, `completed_at`, `muted` están en el Update type

#### 3. `useDataHealthCheck.ts` — `from('data_health_check' as any)`
- La vista `data_health_check` EXISTE en el schema generado (Views section). Se puede remover el cast.

#### 4. `useMileage.ts` — `.update({ deleted_at: ... } as any)`
- `deleted_at` es un campo válido en el Update type de mileage. Cast innecesario.

#### 5. `useTrash.ts` — `.update({ deleted_at: null } as any)`
- `deleted_at` es nullable en todos los tipos. Cast innecesario.

---

### 🟠 `usePlanLimits.ts` — `voice_requests_count` lectura
- Línea 278: `rawData.voice_requests_count as number ?? 0` — la columna fue creada en la migración anterior. Si el schema generado aún no la refleja, el `rawData` approach es correcto. Verificar que el schema se regeneró.

---

### 🟠 `usePermanentDelete` y `useEmptyTrash` — Sin audit log ni cascade
- `usePermanentDelete`: hard delete sin registrar en audit_log ni limpiar dependencias (expense_tags, documents para expenses)
- `useEmptyTrash`: hard delete masivo sin audit_log ni cascade cleanup

---

### 🟡 `useExpenses.ts` — `(expense as any).vendor` repetido
- Las líneas 143, 149, 150, 190, 191 usan `(expense as any).vendor/amount/category` porque el tipo de entrada no incluye esas propiedades. Esto es un problema de tipado, no de datos.

---

## Plan de Implementación

### Paso 1: Limpiar `as any` innecesarios (6 archivos)
- `useAutoReminders.ts` — remover 4 casts
- `useNotificationActions.ts` — remover 3 casts
- `useDataHealthCheck.ts` — remover 1 cast
- `useMileage.ts` — remover 1 cast
- `useTrash.ts` — remover 1 cast

### Paso 2: Cascade safety en `usePermanentDelete` y `useEmptyTrash`
- Agregar limpieza de `expense_tags` y `documents` antes de borrar expenses permanentemente
- Agregar audit_log en permanent delete

### Paso 3: Verificar `voice_requests_count` en schema
- Confirmar que la columna existe post-migración

---

## Archivos a modificar

1. `src/hooks/data/useAutoReminders.ts`
2. `src/hooks/data/useNotificationActions.ts`
3. `src/hooks/data/useDataHealthCheck.ts`
4. `src/hooks/data/useMileage.ts`
5. `src/hooks/data/useTrash.ts`
