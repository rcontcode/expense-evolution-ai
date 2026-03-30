

# Plan: Completar email real + fix "contactado falso"

## Estado actual
- `send-crm-email` existe pero no está desplegada
- `run-automations` llama a `send-crm-email` para emails, pero **sigue marcando `contacted_at` incluso si el email NO se envió** (líneas 333-337)
- Dominio `notify.universmind.com` sigue pendiente DNS — no se puede enviar aún, pero podemos dejar todo listo
- No hay template de email ni infraestructura de email configurada

## Cambios

### 1. Fix "contactado falso" en `run-automations/index.ts`
Líneas 333-337: Solo marcar `contacted_at` si el email realmente se envió:
```
// ANTES: siempre marca contactado
if (result.status === 'success') {
  contacted_at = now()  // ← SIEMPRE, aunque email_sent = false
}

// DESPUÉS: solo si se envió realmente
if (result.status === 'success' && result.data.email_sent === true) {
  contacted_at = now()
}
// Si no se envió, marcar con nota de que fue generado pero no enviado
```
Para WhatsApp (que no tiene envío real aún), NO marcar como contactado.

### 2. Configurar infraestructura de email
- Llamar `setup_email_infra` para crear las tablas, colas pgmq, y cron job
- Llamar `scaffold_transactional_email` para crear el Edge Function `send-transactional-email` y la estructura de templates

### 3. Crear template `crm-lead-outreach`
Template React Email en `_shared/transactional-email-templates/` que reciba:
- `recipientName`, `subject`, `body`, `ruleName`
- Estilo consistente con la marca EvoFinz

### 4. Actualizar `send-crm-email` para usar `send-transactional-email`
Ya está apuntando a `send-transactional-email` — solo necesita el template registrado en el registry.

### 5. Desplegar todas las funciones
- `send-crm-email`
- `run-automations`
- `send-transactional-email` (creada por scaffold)
- `process-email-queue` (creada por scaffold)

## Sobre el DNS pendiente
Todo quedará configurado y listo. Los emails se encolarán pero no se entregarán hasta que el DNS de `notify.universmind.com` se verifique. En ese momento, empezarán a enviarse automáticamente.

## Resultado final
- Automatizaciones generan mensajes con IA ✅
- Emails se envían realmente (cuando DNS esté listo) ✅
- `contacted_at` SOLO se marca si el email se entregó ✅
- WhatsApp: genera mensaje pero NO marca como contactado ✅

