

# Auditoría Profunda Ronda 4 — Seguridad Crítica, Consistencia y Limpieza

## Hallazgos Nuevos

---

### 🔴 CRÍTICO — Escalamiento de Privilegios

#### 1. `user_roles` — Sin política INSERT/UPDATE/DELETE en RLS
La tabla `user_roles` solo tiene una política SELECT. No hay INSERT, UPDATE ni DELETE policies. Esto significa que **cualquier usuario autenticado podría insertarse el rol `admin`** directamente desde el cliente:
```
supabase.from('user_roles').insert({ user_id: myId, role: 'admin' })
```
Esto compromete TODAS las verificaciones de admin en el sistema (CRM, beta management, reward application, etc.).

**Fix**: Agregar políticas RLS que bloqueen INSERT/UPDATE/DELETE para usuarios regulares. Solo la función `claim_first_admin` (SECURITY DEFINER) y `handle_new_user` (trigger) deben poder insertar.

---

### 🔴 CRÍTICO — `referral_leads` INSERT público sin autenticación
La política INSERT en `referral_leads` aplica al rol `public` (no autenticado). Cualquiera puede insertar leads desde internet sin estar logueado. El scan de seguridad lo flagueó.

**Fix**: Cambiar la política para requerir autenticación, o dejarla abierta si es intencional (form público de referidos) pero agregar rate limiting.

---

### 🟠 Inconsistencia — Mileage hard delete en `useDeleteClientTestData`
Línea 178: `supabase.from('mileage').delete()` — mileage tiene columna `deleted_at` pero se hace hard delete. Inconsistente con expenses/income/contracts que usan soft-delete en el mismo flujo.

**Fix**: Cambiar a soft-delete (`update({ deleted_at: ... })`).

---

### 🟠 `audit_log` — Todos los hooks usan `as any`
La tabla `audit_log` existe en la DB pero el tipo no está en el schema TypeScript generado, forzando `as any` en ~14 archivos. Esto elimina type-safety y autocompletado.

**Fix**: No se puede editar `types.ts` directamente (auto-generado), pero se puede crear un helper tipado para audit log inserts que encapsule el `as any` en un solo lugar en vez de repetirlo en 14 archivos.

---

### 🟡 Mejoras menores

#### 2. `notification_preferences` y `budget_alert_rules` — `as any` innecesario
Ambas tablas EXISTEN en la DB (confirmado en schema). Los hooks usan `as any` innecesariamente. Si los tipos están en el schema generado, se puede remover el cast.

#### 3. `useDeleteClientTestData` — `project_clients` hard delete sin audit
`project_clients` se borra sin registrar en audit log ni verificar user ownership.

---

## Plan de Implementación

### Paso 1: Cerrar vulnerabilidad de `user_roles` (CRÍTICO)
SQL migration para agregar políticas RLS:
- INSERT: `WITH CHECK (false)` — solo triggers/SECURITY DEFINER functions pueden insertar
- UPDATE: `USING (false)` — nadie puede cambiar roles desde el cliente
- DELETE: `USING (false)` — nadie puede borrar roles desde el cliente

### Paso 2: Asegurar `referral_leads` INSERT
Cambiar la política INSERT de `public` a `authenticated` para evitar spam anónimo.

### Paso 3: Soft-delete mileage en `useDeleteClientTestData`
Cambiar `.delete()` a `.update({ deleted_at: new Date().toISOString() })` para mileage.

### Paso 4: Centralizar audit log helper
Crear un helper `insertAuditLog()` que encapsule el `as any` en un solo lugar, para que los 14 archivos que lo usan tengan un solo punto de mantenimiento.

### Paso 5: Limpiar `as any` donde sea posible
Verificar si `notification_preferences` y `budget_alert_rules` están en los tipos generados y remover casts innecesarios.

---

## Detalle Técnico — Archivos a modificar

1. **Migración SQL**: Políticas RLS para `user_roles` (INSERT/UPDATE/DELETE deny) + `referral_leads` INSERT fix
2. `src/hooks/data/useClients.ts` — mileage soft-delete
3. `src/hooks/data/useAuditLog.ts` — agregar helper `insertAuditLog()` centralizado
4. Múltiples hooks — reemplazar `supabase.from('audit_log' as any).insert(...)` con el helper centralizado
5. `src/hooks/data/useNotificationPreferences.ts` — intentar remover `as any`
6. `src/hooks/data/useBudgetAlertRules.ts` — intentar remover `as any`

