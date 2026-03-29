

# Plan: Pulir el Producto — Prioridades por Impacto

Tras revisar el código, seguridad y arquitectura, estas son las áreas más importantes ordenadas por riesgo/impacto.

---

## Fase 1: Vulnerabilidades de Seguridad (3 errores críticos)

El escaneo de seguridad detectó 3 problemas de nivel **error**:

### 1.1 Datos de leads expuestos via Realtime
La tabla `quiz_leads` está publicada en Realtime sin restricción. Cualquier usuario autenticado puede suscribirse y recibir emails, teléfonos y datos de leads.
- **Fix**: Remover `quiz_leads` de la publicación Realtime, o agregar políticas RLS en `realtime.messages` para restringir por rol admin.

### 1.2 `data_health_check` sin políticas RLS
Esta tabla no tiene ninguna política RLS, exponiendo datos internos.
- **Fix**: Agregar políticas RLS que filtren por `user_id`.

### 1.3 Realtime sin RLS global
Sin políticas en `realtime.messages`, cualquier usuario puede escuchar canales de otros usuarios.
- **Fix**: Agregar política RLS en `realtime.messages` que restrinja por `auth.uid()`.

### 1.4 Warnings adicionales
- `usage_tracking` sin política UPDATE → usuarios podrían resetear contadores
- Políticas RLS con `USING (true)` en operaciones INSERT/UPDATE/DELETE

**Archivos**: 1 migración SQL

---

## Fase 2: Estabilidad — Migrar `.single()` a `.maybeSingle()`

Se encontraron **420 usos de `.single()`** en 44 archivos. Según los estándares del proyecto, las consultas de lectura deben usar `.maybeSingle()` para evitar crashes cuando no existe el registro.

Prioridad: los de lectura/fetch (no los de insert/update que esperan exactamente 1 resultado).

**Archivos más críticos** (queries de lectura que pueden fallar):
- `useProfile.ts` — perfil del usuario
- `useReadingReminders.ts` — preferencias
- `useConversationalOnboarding.ts` — onboarding entity
- `Onboarding.tsx` — entity lookup
- `DataPrivacyCard.tsx` — export de datos
- `AddressAutocomplete.tsx` — dirección existente

**Archivos**: ~15 archivos prioritarios

---

## Fase 3: Página Index.tsx — Placeholder sin uso

`src/pages/Index.tsx` todavía dice "Welcome to Your Blank App". La ruta `/` ya redirige a `FinancialQuiz` via `AuthenticatedRedirect`, así que este archivo es dead code.

- **Fix**: Eliminar o reemplazar con redirect explícito.

**Archivos**: 1

---

## Fase 4: Rate Limiting + Audit Logging Admin (lo que discutimos antes)

Agregar la "cámara de seguridad" para intentos de acceso admin no autorizados.

- Log en `audit_log` cuando un usuario no-admin intenta acceder a `/admin/*`
- Bloqueo visual después de 3 intentos en la misma sesión

**Archivos**: 2 (AdminRoute.tsx + nuevo hook)

---

## Resumen de Prioridades

| Fase | Impacto | Riesgo de no hacerlo | Esfuerzo |
|------|---------|---------------------|----------|
| 1. Seguridad RLS/Realtime | Crítico | Fuga de datos PII | Medio |
| 2. `.single()` → `.maybeSingle()` | Alto | Crashes en producción | Medio-Alto |
| 3. Limpiar Index.tsx | Bajo | Confusión de devs | Mínimo |
| 4. Admin rate limiting | Medio | Falta de auditoría | Bajo |

**Recomendación**: Empezar por Fase 1 (seguridad) + Fase 3 (limpieza rápida), luego Fase 2 en batches, y Fase 4 al final.

