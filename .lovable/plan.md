

## Plan: Potenciar Automatización CRM — Lo Que Falta

### Análisis de lo que ya existe
- CRUD completo de reglas en BD (crear, editar, eliminar, toggle)
- 6 tipos de acción (WhatsApp IA, Email IA, auto-contact, auto-tag, auto-stage, auto-followup)
- Edge Function `run-automations` con acciones reales modulares
- Logs de ejecución con detalle de resultado IA
- Test manual de reglas contra leads específicos
- Alertas inteligentes + scoring health + execution stats
- RLS admin-only correcta

### Lo Que Falta — 5 Mejoras Clave

**1. Condiciones Avanzadas de Trigger (usar `trigger_condition` JSONB que ya existe en BD)**

La columna `trigger_condition` ya existe pero ni la UI ni `run-automations` la usan. Implementar:
- **UI**: Agregar al diálogo de regla un constructor de condiciones: `source = X`, `quiz_score >= N`, `has_phone = true/false`, `country = X`
- **Backend**: En `run-automations`, después del match por `trigger_type`, evaluar `trigger_condition` contra los campos del lead. Si alguna condición no se cumple, skip.

Esto permite reglas como: "Solo leads HOT de Chile con teléfono → WhatsApp IA"

**2. Duplicación Guard — No ejecutar la misma regla 2 veces en el mismo lead**

Actualmente si haces Test manualmente o si un webhook se repite, las reglas se ejecutan de nuevo. Agregar:
- **Backend**: Antes de ejecutar, verificar en `automation_logs` si ya existe un registro con ese `rule_id + lead_id + status=success`. Si sí, skip con `{ reason: 'already_executed' }`.
- Esto previene spam de mensajes IA y follow-ups duplicados.

**3. Bulk Automation — Ejecutar reglas en lote sobre leads filtrados**

El Test actual solo funciona con 1 lead. Agregar:
- **UI**: Botón "Ejecutar en lote" que permite seleccionar filtro (todos HOT sin contactar, todos WARM > 5 días, etc.) y ejecutar `run-automations` para cada lead matching.
- Muestra progreso y resumen al finalizar.
- Útil para campañas de reactivación o primer contacto masivo.

**4. Automation Insights — Mini dashboard de rendimiento por regla**

Agregar al card de cada regla:
- Success rate (% de éxito vs total ejecuciones desde `automation_logs`)
- Último lead procesado (nombre + fecha)
- Expandir card para ver últimos 5 logs de esa regla específica
- Esto convierte cada regla en un mini-reporte de performance.

**5. Auto-Save Templates — Guardar mensajes IA generados como plantillas reutilizables**

Cuando una ejecución genera un mensaje IA exitoso:
- **Backend**: Insertar automáticamente en `lead_message_templates` (tabla existente usada por `AdminSavedTemplates`) con `is_auto = true`
- **UI**: En el log detail dialog, agregar botón "Guardar como plantilla" que inserta en `lead_message_templates`
- Conecta automatización con el sistema de plantillas existente.

---

### Cambios Técnicos

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/run-automations/index.ts` | Agregar evaluación `trigger_condition`, dedup guard, auto-save template |
| `src/components/admin/tabs/AdminAutomationTab.tsx` | Constructor condiciones UI, bulk execution, insights por regla, botón guardar plantilla |

### Sin migración BD necesaria
- `trigger_condition` JSONB ya existe en `automation_rules`
- `automation_logs` ya tiene `rule_id + lead_id` para dedup
- `lead_message_templates` ya existe para auto-save

### Orden de implementación
1. Dedup guard (prevenir duplicados) — seguridad
2. Condiciones avanzadas UI + backend — targeting real
3. Insights por regla — visibilidad
4. Bulk automation — operaciones masivas
5. Auto-save templates — conectar con plantillas

