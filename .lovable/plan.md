
# Plan: Sistema de Gestión de Leads + Integración GHL

## Resumen Ejecutivo
Implementar un panel administrativo para gestionar leads del quiz dentro de EvoFinz, más configurar la integración con GoHighLevel para automatizar seguimiento por email/SMS.

---

## Parte 1: Panel Admin de Leads (Lovable)

### 1.1 Nueva página `/admin/leads`
Crear una interfaz para ver, filtrar y exportar leads:

**Funcionalidades:**
- Tabla con todos los leads del quiz
- Filtros por: nivel (principiante/emergente/evolucionando/maestro), país, fecha, convertido
- Búsqueda por nombre/email
- Exportar a CSV/Excel
- Marcar como "contactado" o "convertido"
- Ver detalles del quiz (preguntas fallidas, score, etc.)

**Componentes a crear:**
```
src/pages/admin/LeadsManagement.tsx  → Página principal
src/components/admin/LeadsTable.tsx  → Tabla de leads
src/components/admin/LeadFilters.tsx → Filtros
src/components/admin/LeadDetail.tsx  → Modal con detalles
```

### 1.2 Protección de acceso
- Solo accesible para usuarios con rol `admin`
- Agregar verificación en la ruta

---

## Parte 2: Integración GoHighLevel

### 2.1 Configurar webhook en GHL
**Pasos que debes hacer en GHL:**
1. Ir a Automations → Workflows → Create Workflow
2. Trigger: "Inbound Webhook"
3. Copiar la URL del webhook
4. Agregar acciones: crear contacto, agregar a campaña, etc.

### 2.2 Agregar secret en Lovable
- Configurar `GHL_WEBHOOK_URL` con la URL del webhook

### 2.3 El código ya está listo
El edge function `send-quiz-lead` ya tiene la lógica para enviar a GHL:
```typescript
const ghlWebhookUrl = Deno.env.get("GHL_WEBHOOK_URL");
if (ghlWebhookUrl) {
  // Envía: first_name, last_name, email, phone, 
  // country, situation, goal, obstacle, quiz_score, quiz_level
}
```

---

## Parte 3: Secuencias de Email Sugeridas (en GHL)

### Secuencia "Post-Quiz"
| Día | Email | Objetivo |
|-----|-------|----------|
| 0 | "Tu resultado: [nivel]" | Recordar score + CTA registro |
| 1 | "3 tips para [su obstáculo]" | Valor + CTA |
| 3 | "El 80% de [nivel] cometen este error" | Urgencia |
| 7 | "Última oportunidad: acceso beta" | Escasez |

### Segmentación automática
Usar campos custom para segmentar:
- `quiz_level` → Contenido por nivel
- `obstacle` → Tips específicos
- `goal` → CTAs personalizados

---

## Estructura de Archivos a Crear

```
src/pages/admin/
  └── LeadsManagement.tsx      # Página principal de leads

src/components/admin/
  ├── LeadsTable.tsx           # Tabla con datos
  ├── LeadFilters.tsx          # Filtros de búsqueda
  ├── LeadDetail.tsx           # Modal de detalle
  └── LeadsExport.tsx          # Botón exportar CSV

src/hooks/admin/
  └── useLeadsManagement.ts    # Lógica de carga/filtros
```

---

## Detalles Técnicos

### Query para cargar leads
```sql
SELECT 
  id, name, email, phone, country, 
  situation, goal, obstacle,
  quiz_score, quiz_level, failed_questions,
  converted_to_user, contacted_at,
  created_at
FROM quiz_leads
ORDER BY created_at DESC
```

### Campos a agregar en la tabla
```sql
ALTER TABLE quiz_leads 
ADD COLUMN contacted_at TIMESTAMP,
ADD COLUMN contact_notes TEXT,
ADD COLUMN ghl_synced BOOLEAN DEFAULT false;
```

### Exportación CSV
Usar la librería `xlsx` ya instalada para generar archivos exportables.

---

## Próximos Pasos Inmediatos

1. **Tú configuras en GHL:**
   - Crear workflow con trigger "Inbound Webhook"
   - Copiar URL del webhook

2. **Yo implemento:**
   - Panel admin de leads
   - Agregar campos de seguimiento
   - Configurar el secret GHL_WEBHOOK_URL

3. **Opcional después:**
   - Dashboard con métricas de conversión
   - Alertas cuando llegan nuevos leads
   - Integración bidireccional (GHL → Lovable)
