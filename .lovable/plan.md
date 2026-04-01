

# Lo que falta para lanzar, automatizar, dar seguimiento y escalar el CRM

## Estado actual — Lo que YA funciona

| Componente | Estado |
|---|---|
| Recepción de leads (quiz EvoFinz, Fokuspark, UniversMind) | ✅ |
| Scoring + priorización automática (hot/warm/cool/cold) | ✅ |
| Motor de automatizaciones (reglas por temperatura) | ✅ |
| Cron cada 5 min para automatizaciones diferidas | ✅ |
| Templates de email por marca (EvoFinz, Fokuspark, UniversMind) | ✅ |
| Cola de emails con reintentos (pgmq cada 5s) | ✅ |
| Follow-ups manuales + agenda | ✅ |
| Secuencias de nurturing (tabla + UI de configuración) | ✅ |
| Pipeline Kanban | ✅ |
| Notificaciones realtime para leads HOT | ✅ |
| Dashboard cross-app con ranking | ✅ |
| Envío CRM directo desde dashboard | ✅ |

---

## Lo que FALTA — 6 mejoras concretas

### 1. Secuencias de email NO envían emails reales
**Problema crítico**: `run-delayed-automations` procesa los pasos de nurturing pero solo genera un texto placeholder (`[WHATSAPP] Nurturing paso X...`). No invoca `send-crm-email` ni `generate-lead-message`. Los pasos se marcan como "sent" sin enviar nada.

**Solución**: Conectar el procesamiento de nurturing con el motor de AI + envío real:
- Para cada paso pendiente, llamar `generate-lead-message` con el contexto del lead
- Luego invocar `send-crm-email` con el mensaje generado y el `leadSource` correcto
- Registrar la interacción en `lead_interactions`

### 2. `email_sequence` en reglas de automatización — sin backend
**Problema**: La UI permite crear reglas con tipo `email_sequence`, pero `run-automations` no tiene un `case` para `email_sequence` — se cae al `default` y se marca como `skipped`.

**Solución**: Agregar handler en `run-automations` que:
- Cree entradas en `lead_nurturing_log` para cada paso de la secuencia
- Calcule las fechas `scheduled_for` según los delays configurados
- El cron de `run-delayed-automations` ya los procesará

### 3. Follow-ups automáticos sin notificación de vencimiento
**Problema**: Los follow-ups vencidos se ven en la agenda, pero no hay alerta proactiva. El admin debe entrar al CRM para descubrirlos.

**Solución**: Agregar al cron de `run-delayed-automations` una verificación de follow-ups vencidos y enviar notificación push (ecosystem_notifications) a los admins cuando haya follow-ups vencidos del día.

### 4. Lead decay automático — sin implementar
**Problema**: Los leads envejecen pero no hay acción automática. Un lead HOT sin contactar en 7 días sigue marcado como HOT.

**Solución**: Agregar lógica de "decay" al cron:
- Si un lead HOT no fue contactado en 48h → notificar admin urgentemente
- Si un lead no fue contactado en 7 días → auto-etiquetar como "decayed"
- Si un lead lleva 30 días sin interacción → mover a pipeline stage "lost"

### 5. Dashboard de emails enviados — no existe
**Problema**: No hay visibilidad sobre qué emails se enviaron, cuáles fallaron, tasas de entrega. La tabla `email_send_log` tiene los datos pero no hay UI.

**Solución**: Crear tab `AdminEmailDashboard` en el CRM con:
- Estadísticas deduplicadas por `message_id` (enviados, fallidos, suprimidos)
- Filtros por rango de fechas y template
- Tabla de logs paginada
- Gráfico de volumen de envíos por día

### 6. Webhook de entrada para leads externos — hardcoded a quiz
**Problema**: `webhook-leads` y `send-quiz-lead` son los únicos puntos de entrada. Si quieres agregar leads desde landing pages nuevas, formularios de contacto, o integraciones externas, no hay un endpoint genérico.

**Solución**: `webhook-leads` ya es bastante genérico (acepta múltiples formatos). Solo falta documentar el formato de payload y crear un snippet copiable en el CRM para integrar cualquier landing nueva.

---

## Plan de implementación

### Paso 1: Conectar nurturing con envío real de emails
- Modificar `run-delayed-automations/index.ts` para que cada paso de nurturing invoque `generate-lead-message` + `send-crm-email`
- Pasar `leadSource` para que se use la plantilla correcta por marca

### Paso 2: Implementar handler `email_sequence` en `run-automations`
- Agregar case `email_sequence` que inserte rows en `lead_nurturing_log`
- Usar los steps del `action_config` para calcular delays

### Paso 3: Alertas de follow-ups vencidos + lead decay
- Extender `run-delayed-automations` con verificación de follow-ups overdue
- Agregar lógica de decay (auto-tag, auto-stage, notificaciones urgentes)

### Paso 4: Dashboard de emails enviados
- Crear `AdminEmailDashboard.tsx` con stats, filtros y tabla de `email_send_log`
- Agregar como nueva tab en el CRM

### Paso 5: Snippet de integración webhook
- Agregar sección en la UI del CRM con el endpoint y formato de payload
- Botón para copiar el snippet de integración

### Paso 6: Redesplegar Edge Functions
- `run-automations`, `run-delayed-automations`, `send-crm-email`

---

## Detalle técnico

```text
FLUJO COMPLETO DESPUÉS DE LOS CAMBIOS:

Lead llega (quiz/webhook)
  ↓
run-automations (inmediato)
  ├── email → AI genera + send-crm-email → email real
  ├── email_sequence → crea N entradas en lead_nurturing_log ← NUEVO
  ├── auto_tag / auto_stage / auto_followup
  └── log en automation_logs + lead_interactions

Cron cada 5 min (run-delayed-automations)
  ├── Reglas con delay > 0
  ├── Nurturing logs pendientes → AI + send-crm-email ← NUEVO
  ├── Follow-ups vencidos → notificación admin ← NUEVO
  └── Lead decay check → auto-tag + auto-stage ← NUEVO

Cron cada 5s (process-email-queue)
  └── Despacha emails de pgmq con reintentos
```

Esto cierra todos los gaps entre "el CRM tiene la UI" y "el CRM realmente ejecuta las acciones automáticamente end-to-end".

