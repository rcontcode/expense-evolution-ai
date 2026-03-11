

## Plan: Automatización Real del CRM

### Resumen

Conectar la UI de automatización (`AdminAutomationTab`) a la tabla `automation_rules` en BD (eliminando localStorage), y expandir la Edge Function `run-automations` para ejecutar acciones reales: generar mensajes IA, mover leads en el pipeline y crear follow-ups automáticos. Además, crear tabla `automation_logs` para visibilidad de ejecuciones.

---

### 1. Migración BD — `automation_logs` + columnas extra

Nueva tabla `automation_logs` y columnas `last_executed_at`, `execution_count` en `automation_rules`:

```sql
CREATE TABLE automation_logs (
  id UUID PK,
  rule_id UUID FK → automation_rules,
  lead_id UUID FK → quiz_leads,
  action_type TEXT,
  status TEXT, -- success/failed/skipped
  result_data JSONB,
  executed_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: solo admin
-- ADD COLUMN last_executed_at, execution_count en automation_rules
```

### 2. Reescribir `AdminAutomationTab.tsx` — CRUD Real

- Eliminar `localStorage` y `DEFAULT_RULES`
- `useQuery` → fetch `automation_rules` desde Supabase
- `useMutation` para crear, editar, eliminar y toggle `is_enabled`
- Diálogo de crear/editar regla con campos: nombre, trigger_type (hot/warm/cool/cold/new_lead), action_type (whatsapp/email/auto_tag/auto_stage/auto_followup), delay_minutes, action_config (JSON visual), descripción
- Sección inferior "Ejecuciones recientes" mostrando últimas 20 entradas de `automation_logs` con estado, lead, regla y timestamp
- Mantener las alertas inteligentes y scoring health existentes (no tocar esa lógica)

### 3. Expandir `run-automations/index.ts` — Acciones Reales

Tras match de regla, ejecutar según `action_type`:

| action_type | Acción real |
|---|---|
| `whatsapp` / `email` | Llamar `generate-lead-message` con `LOVABLE_API_KEY`, guardar mensaje generado en `automation_logs.result_data` |
| `auto_contact` | Marcar `contacted_at` + `contact_notes` en `quiz_leads` |
| `auto_tag` | Agregar tags de `action_config.tags` al array `tags[]` del lead |
| `auto_stage` | Actualizar `pipeline_stage` del lead según `action_config.stage` |
| `auto_followup` | Insertar en `lead_follow_ups` con `scheduled_at = now() + action_config.followup_delay_hours` |

Después de cada ejecución: insertar en `automation_logs` y actualizar `execution_count`/`last_executed_at` en la regla.

### 4. Seed de reglas por defecto

Al primer load, si tabla vacía, insertar 4 reglas predeterminadas (las mismas que estaban hardcodeadas) directamente desde el componente.

---

### Archivos a Crear/Modificar

| Archivo | Cambio |
|---|---|
| `supabase migration` | Tabla `automation_logs`, columnas en `automation_rules` |
| `src/components/admin/tabs/AdminAutomationTab.tsx` | Reescribir: CRUD Supabase, diálogo crear/editar, feed de logs |
| `supabase/functions/run-automations/index.ts` | Expandir con acciones reales (IA, tags, stage, follow-ups, logs) |

### Archivos que NO se tocan
- `webhook-leads/index.ts` (ya invoca `run-automations`)
- `config.toml` (ya tiene `run-automations`)
- `generate-lead-message/index.ts` (se consume tal cual)

