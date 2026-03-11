

## Integración Universmind → EvoFinz CRM: Leads Recurrentes y Unificación

### Contexto

Universmind ahora envía dos campos nuevos en el payload:
- `returning_lead: boolean` — si el email ya existe con otra fuente
- `previous_sources: string[]` — las fuentes anteriores del mismo email (ej: `["universmind_lead_magnet_cuerpos"]`)

El webhook-leads de EvoFinz **no procesa** estos campos. Tampoco hace deduplicación por email — crea un registro nuevo cada vez.

### Cambios Necesarios

**1. Webhook (`webhook-leads/index.ts`)**
- Aceptar `returning_lead` y `previous_sources` en la interface
- Guardarlos en `metadata.returning_lead` y `metadata.previous_sources`
- Agregar lógica de dedup: antes de INSERT, buscar si ya existe un lead con el mismo email. Si existe, guardar referencia cruzada en metadata (`related_lead_ids`)
- Bonus de scoring: `returning_lead = true` → +20 puntos (demuestra interés múltiple)
- Incluir `returning_lead` y `previous_sources` en el payload a GHL

**2. Scoring (`useLeadScoring.ts`)**
- Agregar bonus por `metadata.returning_lead === true` → +20 puntos
- Agregar bonus por `metadata.previous_sources` con múltiples fuentes → +5 extra
- Reconocer niveles y obstáculos de Universmind (ya están parcialmente por los aliases de metadata)

**3. UI — LeadEnrichmentPanel**
- Nuevo bloque visual cuando `metadata.returning_lead === true`: badge "Lead Recurrente" + lista de fuentes anteriores
- Mostrar el "journey" del lead (guía gratuita → quiz, o viceversa)
- Mostrar `metadata.guide` si existe (qué guía descargó)
- Mostrar `metadata.producto_recomendado` como "Producto sugerido por Universmind"

**4. AI Message Generator (`generate-lead-message`)**
- Agregar al contexto del lead si es recurrente y sus fuentes anteriores
- Esto permite que el mensaje personalizado diga: "Vi que ya exploraste nuestra guía de [X], ahora con tus resultados del quiz..."

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/webhook-leads/index.ts` | Aceptar `returning_lead`/`previous_sources`, dedup por email, bonus scoring +20, forward a GHL |
| `src/hooks/admin/useLeadScoring.ts` | Bonus +20 para leads recurrentes |
| `src/components/admin/LeadEnrichmentPanel.tsx` | Bloque visual "Lead Recurrente" con journey, guía descargada, producto recomendado |
| `supabase/functions/generate-lead-message/index.ts` | Agregar contexto de returning_lead y previous_sources al prompt de IA |

### Detalle Técnico

```text
Payload de Universmind:
{
  "name": "...", "email": "...",
  "source": "universmind_quiz",
  "returning_lead": true,
  "previous_sources": ["universmind_lead_magnet_cuerpos"],
  "metadata": {
    "situacion": "...",
    "objetivo": "...",
    "producto_recomendado": "Guía Completa",
    "precio_producto": 29,
    "guide": "cuerpos"
  }
}

Dedup flow en webhook:
1. Buscar quiz_leads WHERE email = payload.email
2. Si existe: guardar related_lead_ids en metadata del nuevo registro
3. Siempre crear registro nuevo (no merge) para mantener historial por fuente
4. El CRM unifica visualmente en el panel de detalle
```

