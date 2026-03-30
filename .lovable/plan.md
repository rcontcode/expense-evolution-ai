

# Plan: Corregir errores de datos en el CRM

## Problemas encontrados

### 1. ROI Dashboard: Leads "pagando" inflados (CRÍTICO)
El dashboard cruza leads con suscripciones **por email**. Tu email (`rcontreraslittle@gmail.com`) aparece en **39 leads** (tests). Como tienes 1 suscripción activa, el sistema cuenta 39 "leads pagando" cuando en realidad es 1 persona.

**Solución**: Deduplicar por email antes de contar. Un email = 1 lead único para el cálculo de ROI/MRR.

### 2. "Contactado" falso por automatizaciones
"roco" aparece como contactado porque la regla de automatización "🔥 HOT Lead → WhatsApp IA" setea `contacted_at` automáticamente en segundos. No distingue entre contacto real (manual) y auto-contacto.

**Solución**: Diferenciar en las métricas. Si `contact_notes` empieza con `[AUTO]`, es auto-contacto. Las métricas de "Tasa contacto" y "Tiempo avg contacto" deben filtrar auto-contactos o mostrar ambos por separado.

### 3. Métricas: "Tasa conversión 0.0%" pero ROI muestra "66.1%"
- Métricas usa `converted_to_user` (campo de la DB, todos en `false`) → 0%
- ROI cruza por email con Stripe → 66.1% (pero inflado por duplicados)
- Son dos fuentes de verdad diferentes y contradictorias

**Solución**: Unificar la lógica. Ambos dashboards deben usar el cruce por email con Stripe (deduplicado) como fuente de verdad para "convertido/pagando".

## Cambios por archivo

### `src/components/admin/tabs/AdminROIDashboard.tsx`
- Deduplicar leads por email antes de calcular métricas
- Un email único = 1 lead para ROI
- Recalcular `totalLeads`, `payingCount`, `conversionOverall`, `bySource` con leads únicos
- La tabla "Leads Convertidos" debe mostrar 1 fila por email (no 39)

### `src/components/admin/tabs/AdminAdvancedMetrics.tsx`
- Separar "contactados manualmente" vs "auto-contactados" (`contact_notes` con `[AUTO]`)
- "Tasa contacto" = solo contactos manuales / total
- Agregar sub-label "Auto: X%" para los auto-contactados
- "Tasa conversión" = usar cruce email↔suscripción (misma lógica de ROI, deduplicada)

### `src/components/admin/tabs/AdminCrossAppRanking.tsx`
- Ajustar conteo de `contacted` para excluir `[AUTO]`
- Ajustar conteo de `converted` usando cruce email↔suscripción

### `src/components/admin/tabs/AdminLeadsTab.tsx`
- Distinguir visualmente contacto auto vs manual (badge diferente)
- Badge "Auto ✓" gris vs "Contactado ✓" verde

### `src/components/admin/tabs/AdminCRMHome.tsx`
- Ajustar KPIs: tasa contacto sin auto-contactos, conversión real via Stripe

### `src/hooks/admin/useLeadsManagement.ts`
- En stats: separar `contactedManual` vs `contactedAuto`
- Conversión basada en cruce real (no en `converted_to_user` que nadie setea)

## Resumen

| Problema | Causa | Fix |
|----------|-------|-----|
| 39 leads pagando | Duplicados por email | Deduplicar por email |
| roco contactado | Automatización [AUTO] | Separar auto vs manual |
| 0% vs 66.1% conversión | Dos fuentes de verdad | Unificar con cruce Stripe |

**Total**: ~6 archivos, lógica de deduplicación + filtrado de auto-contactos. Sin cambios de base de datos.

