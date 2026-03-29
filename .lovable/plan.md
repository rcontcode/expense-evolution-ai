

# Mejoras Integrales al CRM — Plan por Fases

Dado que las 4 áreas son extensas, propongo implementarlas en **fases independientes** para poder probar cada una antes de continuar.

---

## Fase 1: Acciones en Lote en Tabla de Leads

Agregar selección múltiple con checkboxes y barra de acciones masivas.

### Cambios

**`src/components/admin/LeadsTable.tsx`**
- Agregar estado `selectedIds: Set<string>` y checkbox en cada fila + header (select all)
- Mostrar barra flotante cuando `selectedIds.size > 0` con acciones:
  - **Etiquetar** (selector de tags existentes)
  - **Mover pipeline** (selector de stage: new/contacted/qualified/converted)
  - **Marcar contactados** (batch update `contacted_at`)
  - **Exportar seleccionados** (reutilizar `LeadsExport`)
- Cada acción usa `Promise.all` con updates a Supabase e invalida cache

**`src/pages/admin/LeadsManagement.tsx`**
- Pasar las nuevas props de bulk actions al componente

### Archivos: 2

---

## Fase 2: Notificaciones Push en Tiempo Real

Alertas visibles desde cualquier página cuando llega un lead HOT.

### Cambios

**`src/hooks/admin/useHotLeadRealtime.ts`** — Ya existe y funciona con toasts
- Agregar sonido de notificación (Audio API con un beep corto)
- Agregar badge counter persistente

**`src/components/layout/Sidebar.tsx`** (o navbar)
- Agregar badge numérico en el ítem "CRM" del menú mostrando leads HOT sin contactar
- Usar un hook `useUncontactedHotCount` que consulte leads HOT sin `contacted_at`

**Nuevo: `src/hooks/admin/useUncontactedHotCount.ts`**
- Query simple: `quiz_leads` donde `priority = 'hot'` y `contacted_at IS NULL`
- Se invalida automáticamente por el realtime channel existente

### Archivos: 3

---

## Fase 3: Dashboard de ROI / Revenue por Lead

Vincular leads convertidos con ingresos reales de Stripe.

### Cambios

**Nuevo: `src/components/admin/tabs/AdminROIDashboard.tsx`**
- Consulta `quiz_leads` + `user_subscriptions` cruzando por email (leads convertidos → profiles → subscriptions)
- KPIs: Revenue total por fuente, Costo por lead (si se agrega), tasa de conversión quiz→registro→pago
- Gráficos: Revenue por fuente (bar chart), tendencia MRR por cohorte de leads
- Tabla de leads convertidos con plan actual y valor ($)

**`src/pages/admin/CRMCommandCenter.tsx`** (o equivalente)
- Agregar nueva pestaña "💰 ROI" al TabsList

### Archivos: 2

---

## Fase 4: Secuencias de Nurturing

Cadenas automáticas de mensajes día 1→3→7 basadas en temperatura.

### Cambios

**Nueva tabla: `lead_nurturing_sequences`**
```sql
CREATE TABLE lead_nurturing_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_priority TEXT NOT NULL, -- hot, warm, cool, cold
  steps JSONB NOT NULL DEFAULT '[]', -- [{day: 1, channel: 'whatsapp', template_type: 'first_contact'}, ...]
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lead_nurturing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES lead_nurturing_sequences(id),
  lead_id UUID NOT NULL,
  step_index INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, skipped
  scheduled_for TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sequence_id, lead_id, step_index)
);
```

**Nuevo: `src/components/admin/tabs/AdminNurturingTab.tsx`**
- UI para crear/editar secuencias con pasos arrastrables
- Vista de leads en cola de nurturing activo
- Log de mensajes enviados por secuencia

**`supabase/functions/run-delayed-automations/index.ts`**
- Extender para procesar `lead_nurturing_log` pendientes (scheduled_for ≤ now)
- Generar mensaje IA y preparar para envío

**CRM Command Center**
- Agregar pestaña "🔄 Nurturing"

### Archivos: 4 + 2 migraciones

---

## Orden de Implementación Sugerido

| Fase | Complejidad | Impacto |
|------|-------------|---------|
| 1. Acciones en lote | Baja | Alto — ahorra tiempo diario |
| 2. Notificaciones push | Baja | Alto — velocidad de respuesta |
| 3. Dashboard ROI | Media | Alto — visibilidad de negocio |
| 4. Nurturing sequences | Alta | Muy alto — automatización ventas |

**Propongo empezar con Fase 1 + 2 juntas** (son independientes y de complejidad baja), luego Fase 3, y finalmente Fase 4.

