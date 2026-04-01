

# Plan: Completar los 3 gaps pendientes en plantillas

## 1. Crear plantilla `crm-weekly-report.tsx`
La Edge Function `send-weekly-report` ya existe pero no tiene plantilla visual React Email. Crear una con diseño de tabla de KPIs semanales (leads nuevos, contactados, convertidos, hot sin contactar, por fuente). Registrarla en `registry.ts`.

## 2. Renombrar referencia de outreach EvoFinz
Crear alias `crm-evofinz-outreach` en `registry.ts` que apunte al mismo componente de `crm-lead-outreach` para consistencia de naming con las otras apps. No rompe nada existente.

## 3. Verificar seed de plantillas en BD
Confirmar que la migración de ~12 plantillas seed en `lead_message_templates` se ejecutó. Si no, crear la migración INSERT con templates WhatsApp + Email para las 3 apps en etapas first_contact, follow_up y offer.

---

## Archivos a crear
- `supabase/functions/_shared/transactional-email-templates/crm-weekly-report.tsx`

## Archivos a modificar
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — agregar weekly-report + alias evofinz-outreach

## Migración (si falta)
- INSERT seed en `lead_message_templates`

