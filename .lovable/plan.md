

# Auditoría Profunda Ronda 3 — Base de Datos, Seguridad y Flujo de Datos

## Nuevos Hallazgos (no cubiertos en rondas anteriores)

---

### 🔴 CRÍTICO — Tablas Fantasma (código referencia tablas inexistentes)

#### 1. `savings_contributions` — NO EXISTE en la base de datos
`useSavingsGoals.ts` referencia `savings_contributions` con `as any` (líneas 163, 186). Las operaciones INSERT y SELECT fallan silenciosamente. Los usuarios creen que están guardando contribuciones a sus metas pero los datos se pierden.
**Fix**: Crear la tabla `savings_contributions` con migración + RLS policies.

#### 2. `budget_audit_log` — NO EXISTE en la base de datos
`useBudgetAuditLog.ts` referencia `budget_audit_log` con `as any`. Todas las operaciones de auditoría de presupuesto fallan silenciosamente.
**Fix**: Crear la tabla `budget_audit_log` con migración + RLS, o consolidar con `audit_log` existente (recomendado para evitar duplicación).

#### 3. `voice_requests_count` — Columna fantasma en `usage_tracking`
La tabla `usage_tracking` NO tiene columna `voice_requests_count`, pero `usePlanLimits.ts` y la función DB `increment_usage` la referencian. El conteo de solicitudes de voz nunca se registra. Solo `voice_minutes_used` existe.
**Fix**: Agregar columna `voice_requests_count` a `usage_tracking`, o eliminar las referencias si solo se quiere trackear minutos.

---

### 🔴 CRÍTICO — Seguridad de Base de Datos

#### 4. `data_health_check` — Vista sin RLS explícita (flag del security scan)
El security scan la marcó como riesgo. Es una VIEW con `security_invoker=on`, así que hereda las políticas RLS de las tablas subyacentes. Técnicamente es seguro, pero conviene documentarlo o agregar un wrapper con filtro explícito.
**Fix**: Agregar `.eq('user_id', user!.id)` en `useDataHealthCheck` como defensa en profundidad (la vista ya filtra vía RLS, pero el hook no lo hace explícitamente).

#### 5. `clients` — Sin política DELETE en RLS
El security scan detectó que `clients` tiene INSERT, UPDATE, SELECT pero NO DELETE policy. Esto está bien dado que usamos soft-delete (`deleted_at`), pero el `useDeleteClientTestData` hace hard delete de expenses/income/mileage/contracts vinculados, bypassing soft-delete sin audit log.
**Fix**: Documentar que es intencional (soft-delete), y refactorizar `useDeleteClientTestData` para usar soft-delete consistente.

---

### 🟠 Problemas de Integridad de Datos

#### 6. `increment_usage` DB function — Caso 'voice' escribe a columna inexistente
```sql
ELSIF p_usage_type = 'voice' THEN
  UPDATE public.usage_tracking 
  SET voice_requests_count = voice_requests_count + 1 ...
```
Esta columna no existe. El UPDATE falla silenciosamente con service role.
**Fix**: Agregar la columna o cambiar a `voice_minutes_used` según la lógica real.

#### 7. `useDeleteClientTestData` — Hard deletes sin cascade safety
Hace `.delete()` directo en `expenses`, `income`, `mileage`, `contracts` sin:
- Limpiar `expense_tags` vinculados (datos huérfanos)
- Limpiar `documents` vinculados
- Registrar en `audit_log`
- Usar soft-delete
**Fix**: Agregar limpieza de tablas dependientes y audit log.

#### 8. `usePlanLimits` — Lee `voice_requests_count` de una columna inexistente
Línea 278: `rawData.voice_requests_count as number ?? 0` — siempre será `undefined`, así que `canUseVoice()` siempre retorna `true` independientemente de uso real.
**Fix**: Alinear con la columna real o crear la columna.

---

### 🟡 Mejoras de Robustez

#### 9. Inconsistencia en `applies_to` de RLS policies
Algunas políticas usan `{public}` (roles público, anon, authenticated) mientras otras usan `{authenticated}`. Las de `{public}` en tablas con datos sensibles como `savings_goals`, `category_budgets`, `assets` etc. son seguras porque verifican `auth.uid()`, pero serían más estrictas con `{authenticated}`.
**Fix**: No bloqueante, pero recomendable migrar las políticas de tablas financieras a `{authenticated}` para mayor seguridad.

#### 10. `exchange_rates` — Doble policy SELECT redundante
Tiene dos policies SELECT: "Anyone can view exchange rates" (`true`) y "Authenticated users can view exchange rates" (`auth.uid() IS NOT NULL`). La primera ya cubre todo.
**Fix**: Eliminar la policy redundante (la de authenticated).

#### 11. Edge Functions — Pattern consistente de auth
Todas las edge functions críticas (process-receipt, analyze-contract, process-bank-statement, optimize-taxes) validan JWT correctamente con `getUser(token)`. Buena práctica confirmada.

#### 12. `webhook-leads` — Endpoint público sin rate limiting
El webhook acepta POSTs sin autenticación (diseño correcto para webhooks externos), pero no tiene rate limiting. Un atacante podría spammear leads.
**Fix**: Agregar validación de webhook secret o rate limiting básico.

---

## Plan de Implementación

### Paso 1: Crear tablas faltantes (CRÍTICO — datos se pierden)
- Crear tabla `savings_contributions` con columnas: `id`, `user_id`, `goal_id`, `amount`, `notes`, `created_at`
- RLS: full CRUD para `auth.uid() = user_id`
- Agregar columna `voice_requests_count` (integer, default 0) a `usage_tracking`

### Paso 2: Consolidar `budget_audit_log`
- Eliminar `useBudgetAuditLog.ts` y migrar sus usos al `audit_log` existente (usando `entity_type = 'budget'`)
- O crear la tabla si se prefiere separación

### Paso 3: Corregir `increment_usage` DB function
- Actualizar la función para usar la columna correcta (`voice_requests_count` una vez creada)

### Paso 4: Hardening menor
- Agregar filtro `user_id` explícito en `useDataHealthCheck`
- Limpiar policy redundante de `exchange_rates`

### Paso 5: `useDeleteClientTestData` — cascade safety
- Agregar limpieza de `expense_tags` y `documents` antes de borrar expenses
- Agregar audit log entry

---

## Archivos a modificar

1. **Migración SQL**: Crear `savings_contributions`, agregar `voice_requests_count` a `usage_tracking`, actualizar `increment_usage`
2. `src/hooks/data/useBudgetAuditLog.ts` → migrar a `useAuditLog` o crear tabla
3. `src/hooks/data/useDataHealthCheck.ts` → agregar user_id filter
4. `src/hooks/data/useClients.ts` (`useDeleteClientTestData`) → cascade + audit
5. `src/hooks/data/usePlanLimits.ts` → alinear con columna real

