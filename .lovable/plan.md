

# Plan: 5 mejoras de escala para el CRM

## Resumen
Implementar las 5 mejoras sugeridas: A/B testing de emails, webhooks salientes, reportes semanales, rate limiting del webhook de entrada, y mejorar las acciones masivas de leads.

---

## 1. A/B Testing en templates de email

**Qué hace:** Permite crear variantes de templates de email y medir cuál convierte mejor.

**Implementación:**
- Crear tabla `email_ab_tests` con campos: `id`, `name`, `template_a`, `template_b`, `split_ratio` (50/50 por defecto), `status` (active/paused/completed), `started_at`, `created_at`
- Crear tabla `email_ab_results` con: `test_id`, `variant` (A/B), `lead_id`, `sent_at`, `opened`, `clicked`, `converted`
- Modificar `send-crm-email` para que, si hay un A/B test activo para el template, seleccione variante aleatoriamente y registre en `email_ab_results`
- Crear componente `AdminABTestingTab.tsx` con:
  - Crear test (seleccionar 2 templates, ratio)
  - Ver resultados en tiempo real (tasa de apertura/conversión por variante)
  - Declarar ganador y activar template
- Agregar tab "A/B Tests" en AdminCRM

## 2. Webhooks salientes para cambios de estado de leads

**Qué hace:** Notifica a sistemas externos cuando un lead cambia de estado (pipeline, prioridad, contactado, convertido).

**Implementación:**
- Crear tabla `outgoing_webhooks` con: `id`, `name`, `url`, `events` (array: lead_created, lead_contacted, lead_converted, pipeline_changed), `is_active`, `secret_key`, `created_at`
- Crear tabla `outgoing_webhook_logs` con: `webhook_id`, `event`, `payload`, `response_status`, `response_body`, `created_at`
- Crear Edge Function `dispatch-outgoing-webhook` que:
  - Recibe evento + payload
  - Firma con HMAC-SHA256 usando el `secret_key`
  - Envía POST al URL configurado
  - Registra en logs
- Integrar llamadas al webhook desde `run-automations` (cuando un lead cambia de estado)
- Crear componente `AdminOutgoingWebhooks.tsx` con:
  - CRUD de webhooks (URL, eventos, secreto)
  - Tabla de logs de envío
  - Botón "Test webhook" con payload de prueba
- Agregar tab "Webhooks Out" en AdminCRM

## 3. Reportes semanales por email a admins

**Qué hace:** Envía un resumen semanal con métricas clave del CRM.

**Implementación:**
- Crear Edge Function `send-weekly-report` que:
  - Consulta leads de los últimos 7 días (nuevos, contactados, convertidos, por fuente)
  - Calcula KPIs: tasa de contacto, tasa de conversión, leads HOT sin contactar, follow-ups vencidos
  - Genera HTML con las métricas
  - Envía a todos los admins vía `send-crm-email` con template `crm-weekly-report`
- Crear template `crm-weekly-report.tsx` con diseño de tabla y KPIs
- Configurar pg_cron para ejecutar cada lunes a las 9:00 AM
- Crear sección en AdminCRM para activar/desactivar el reporte y ver historial de reportes enviados

## 4. Rate limiting y protección anti-spam para webhook de leads

**Qué hace:** Previene abuso del endpoint de ingesta de leads.

**Implementación:**
- Modificar `webhook-leads/index.ts` para agregar:
  - Rate limit por IP: máximo 10 leads por minuto por IP (usando tabla `webhook_rate_limits` o memoria en-edge)
  - Rate limit por email: máximo 3 registros del mismo email en 24h
  - Honeypot field: si el payload incluye un campo `_hp` con contenido, rechazar (bots)
  - Validación de email con regex estricta
  - Headers de respuesta `X-RateLimit-Remaining`
- Crear tabla `webhook_rate_limits` con: `identifier` (IP o email), `window_start`, `request_count`
- Agregar métricas de rate limiting al dashboard (rechazados vs aceptados)

## 5. Acciones masivas mejoradas en la tabla de leads

**Qué hace:** Extiende `LeadsBulkActions` con más acciones útiles.

**Implementación:**
- Agregar a `LeadsBulkActions.tsx`:
  - **Bulk Email**: Enviar email CRM a todos los seleccionados (con confirmación)
  - **Bulk Delete Tags**: Remover un tag específico de todos los seleccionados
  - **Bulk Assign Sequence**: Inscribir seleccionados en una secuencia de nurturing
- Asegurar que el componente se integra correctamente en `AdminContactQueueTab` o la vista de leads donde se usa

---

## Archivos a crear
- `src/components/admin/tabs/AdminABTestingTab.tsx`
- `src/components/admin/tabs/AdminOutgoingWebhooks.tsx`
- `supabase/functions/dispatch-outgoing-webhook/index.ts`
- `supabase/functions/send-weekly-report/index.ts`
- `supabase/functions/_shared/transactional-email-templates/crm-weekly-report.tsx`

## Archivos a modificar
- `src/pages/admin/AdminCRM.tsx` — agregar 2 tabs nuevas
- `src/components/admin/LeadsBulkActions.tsx` — agregar acciones masivas
- `supabase/functions/webhook-leads/index.ts` — rate limiting
- `supabase/functions/run-automations/index.ts` — dispatch outgoing webhooks
- `supabase/functions/send-crm-email/index.ts` — A/B test routing
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — registrar weekly report
- `supabase/config.toml` — registrar nuevas Edge Functions

## Migraciones de base de datos
- Tabla `email_ab_tests`
- Tabla `email_ab_results`
- Tabla `outgoing_webhooks`
- Tabla `outgoing_webhook_logs`
- Tabla `webhook_rate_limits`
- RLS policies para todas las tablas (solo admins)
- Cron job para `send-weekly-report` (lunes 9 AM)

## Orden de implementación
1. Migraciones de BD (todas las tablas juntas)
2. Rate limiting en webhook-leads
3. Acciones masivas mejoradas
4. A/B testing (tabla + Edge Function + UI)
5. Webhooks salientes (tabla + Edge Function + UI)
6. Reporte semanal (template + Edge Function + cron)
7. Deploy de Edge Functions
8. Agregar tabs nuevas al CRM

