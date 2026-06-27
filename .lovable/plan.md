## Objetivo

Dejar viva la secuencia de nurturing "Universmind Little — Brújula" en la base, redeployar las funciones que la consumen y confirmar que el dominio de envío está listo.

## Pasos

### 1. Aplicar la migración a la base
Ejecutar `supabase/migrations/20260626130000_universmind_little_nurturing.sql`. Es idempotente y hace dos cosas:
- Inserta en `lead_nurturing_sequences` la secuencia **"Universmind Little — Brújula Nurturing"** con 6 pasos (días 0/2/5/9/14/21), todos usando la plantilla `crm-universmind-little-nurture` con copy fijo (sin IA).
- Inserta en `automation_rules` la regla **"Universmind Little — Inscribir Brújula"** (`trigger_type = new_lead`, condición `source contiene "universmind"`, acción `email_sequence`) con `is_enabled = false` a propósito, para que no dispare en producción hasta que tú la actives manualmente.

Si la secuencia ya existe, el script no hace nada (lo avisa por NOTICE).

### 2. Redeployar las dos edge functions
Deploy en paralelo de:
- `send-crm-email` — orquesta el envío por app/template, incluye routing A/B y log a `lead_interactions`.
- `run-delayed-automations` — worker que procesa los pasos diferidos de las secuencias de nurturing.

Tras deploy, revisar logs de cada una para confirmar arranque limpio.

### 3. Verificar el dominio de envío
Consultar el estado del dominio `notify.evofinz.com` (ya configurado en `send-transactional-email`). En las últimas verificaciones aparecía **activo y verificado** (delegado a `ns3.lovable.cloud` / `ns4.lovable.cloud`), así que lo esperable es confirmar "active" sin acción tuya.

Si por algún motivo el estado vuelve `awaiting_dns` / `provisioning_failed` / no existe, te guío en ese momento:
- `awaiting_dns` → esperar propagación (hasta 72 h) y reintentar verificación en Cloud → Emails.
- `provisioning_failed` → "Rerun Setup" en Cloud → Emails.
- Sin dominio → abrir el diálogo de setup de dominio.

## Lo que NO se cambia
- No se activa la regla de automatización (queda `is_enabled = false` como pediste implícitamente al traer la migración así).
- No se tocan las plantillas de email ya existentes; ya están en el repo.
- No se ejecuta ninguna inscripción manual de leads ni envío de prueba.

## Después del plan
Una vez aplicado, te confirmo:
- ID de la secuencia creada.
- Estado de cada deploy.
- Estado real del dominio.
- Comando exacto (UPDATE) para activar la regla cuando quieras dispararla.
