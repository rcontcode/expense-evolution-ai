

# Plan: Crear todas las plantillas de email y WhatsApp para las 3 apps

## Resumen
Crear 9 plantillas de email CRM nuevas (Welcome, Reactivation, Offer × 3 apps), actualizar `generate-lead-message` para soportar UniversMind, actualizar `QuickContact` para mensajes multi-app, insertar ~12 plantillas seed en `lead_message_templates`, y actualizar `send-crm-email` con el mapeo de templates expandido.

---

## Paso 1: Crear 9 plantillas de email CRM

Cada plantilla sigue el mismo patrón visual existente (logo centrado, tarjeta blanca, colores de marca). Se crean en `supabase/functions/_shared/transactional-email-templates/`:

| Archivo | App | Etapa | Color | Logo |
|---|---|---|---|---|
| `crm-evofinz-welcome.tsx` | EvoFinz | Bienvenida post-quiz | #2563eb | phoenix |
| `crm-fokuspark-welcome.tsx` | Fokuspark | Bienvenida | #7c3aed | fokuspark |
| `crm-universmind-welcome.tsx` | UniversMind | Bienvenida | #6d28d9 | universmind |
| `crm-evofinz-reactivation.tsx` | EvoFinz | Reactivación lead frío | #2563eb | phoenix |
| `crm-fokuspark-reactivation.tsx` | Fokuspark | Reactivación | #7c3aed | fokuspark |
| `crm-universmind-reactivation.tsx` | UniversMind | Reactivación | #6d28d9 | universmind |
| `crm-evofinz-offer.tsx` | EvoFinz | Oferta especial | #2563eb | phoenix |
| `crm-fokuspark-offer.tsx` | Fokuspark | Oferta especial | #7c3aed | fokuspark |
| `crm-universmind-offer.tsx` | UniversMind | Oferta especial | #6d28d9 | universmind |

Props: `recipientName`, `body`, `offerDetails` (solo offer), `ruleName`

## Paso 2: Actualizar registry.ts

Importar las 9 nuevas plantillas y agregarlas al `TEMPLATES` map.

## Paso 3: Actualizar send-crm-email

Expandir `SOURCE_TEMPLATE_MAP` para soportar un segundo parámetro `templateType` que permita seleccionar welcome/reactivation/offer además de outreach. Agregar lógica:
- Si `templateType === 'welcome'` → `crm-{app}-welcome`
- Si `templateType === 'reactivation'` → `crm-{app}-reactivation`
- Si `templateType === 'offer'` → `crm-{app}-offer`
- Default (outreach) → comportamiento actual

## Paso 4: Actualizar generate-lead-message para UniversMind

Agregar `universmind` como `targetApp` válido con su descripción: "una plataforma de bienestar mental con meditación, journaling y crecimiento personal".

## Paso 5: Actualizar QuickContact para mensajes multi-app

Detectar `lead.source` y generar mensajes de WhatsApp y email adaptados a cada marca (EvoFinz, Fokuspark, UniversMind) en lugar del template hardcodeado solo para EvoFinz.

## Paso 6: Insertar plantillas seed en lead_message_templates

Migración INSERT con ~12 plantillas predefinidas cubriendo WhatsApp y Email para las 3 apps en etapas first_contact, follow_up y offer.

## Paso 7: Deploy

Redesplegar `send-crm-email`, `generate-lead-message`, `send-transactional-email`.

---

## Archivos a crear (9)
- `supabase/functions/_shared/transactional-email-templates/crm-evofinz-welcome.tsx`
- `supabase/functions/_shared/transactional-email-templates/crm-fokuspark-welcome.tsx`
- `supabase/functions/_shared/transactional-email-templates/crm-universmind-welcome.tsx`
- `supabase/functions/_shared/transactional-email-templates/crm-evofinz-reactivation.tsx`
- `supabase/functions/_shared/transactional-email-templates/crm-fokuspark-reactivation.tsx`
- `supabase/functions/_shared/transactional-email-templates/crm-universmind-reactivation.tsx`
- `supabase/functions/_shared/transactional-email-templates/crm-evofinz-offer.tsx`
- `supabase/functions/_shared/transactional-email-templates/crm-fokuspark-offer.tsx`
- `supabase/functions/_shared/transactional-email-templates/crm-universmind-offer.tsx`

## Archivos a modificar (4)
- `supabase/functions/_shared/transactional-email-templates/registry.ts`
- `supabase/functions/send-crm-email/index.ts`
- `supabase/functions/generate-lead-message/index.ts`
- `src/components/admin/QuickContact.tsx`

## Migración (1)
- INSERT de ~12 plantillas seed en `lead_message_templates`

