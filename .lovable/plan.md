

# Plan: Dashboard BI Completo — Geografía, Idioma, Conversiones y Sugerencias de Pricing

## Resumen

Crear un nuevo componente **AdminBusinessIntelligence.tsx** como pestaña adicional del CRM que consolide las métricas que faltan: análisis geográfico, idioma, funnel de conversión completo (lead → registro → pago), y un motor de sugerencias de pricing basado en datos reales.

## Qué falta hoy (vs lo que ya existe)

| Ya existe | Falta |
|-----------|-------|
| P&L por plan, costos IA, churn, ARPU/LTV | Distribución geográfica de leads Y compradores |
| ROI por fuente (app) | ROI por país/región |
| Revenue histórico (Stripe) | Funnel completo: Lead → Registro → Trial → Pago (con tasas) |
| Simulador de precios manual | Sugerencias automáticas basadas en margen real por plan |
| Métricas de leads por app | Desglose por idioma del lead (ES vs EN) |

## Cambios propuestos

### 1. Nuevo componente: `src/components/admin/tabs/AdminBusinessIntelligence.tsx`

Secciones:

**A. Mapa Geográfico de Conversión** (datos de `quiz_leads.country` + `user_subscriptions`)
- Tabla: País | Leads | Registrados | Pagos | Tasa Conversión | Revenue estimado
- BarChart horizontal de top 10 países por leads
- BarChart de conversión por país (% lead→pago)

**B. Análisis por Idioma**
- Inferir idioma del lead por país (CA/US = EN, CL/MX/AR/CO/ES = ES) 
- Pie chart: ES vs EN leads
- Tabla: Idioma | Leads | Convertidos | Pagos | Revenue | Tasa conversión
- Insight: "Los leads en español convierten X% más/menos que los de inglés"

**C. Funnel de Conversión Completo** (visual tipo embudo)
- Etapas: Total Leads → Contactados → Registrados → Suscriptores Activos → Pagos
- Tasas de caída entre cada etapa
- Comparativa por app (EvoFinz vs Fokuspark vs UniversMind)
- AreaChart mostrando el funnel por mes (últimos 6 meses)

**D. Motor de Sugerencias de Pricing**
- Calcula margen real por plan (Revenue - AI Cost) con datos actuales
- Si un plan tiene margen < 20%: sugiere subir precio o restringir créditos IA
- Si un plan tiene margen > 80%: sugiere que hay espacio para agregar features
- Si usuarios free consumen > X créditos IA: sugiere reducir límite free o mover a trial
- Si churn > 5% en un plan: sugiere agregar retención (descuento anual, features exclusivas)
- Card con lista de sugerencias tipo "alertas inteligentes" con badges de prioridad

**E. Revenue por Región** (agrupando países en regiones)
- Latam (CL, MX, AR, CO, PE, etc.)
- Norte América (CA, US)
- Europa (ES, etc.)
- Otros
- Stacked BarChart: Revenue por región con desglose de plan

### 2. Registrar nueva pestaña en el CRM

**`src/components/admin/tabs/AdminCRMHome.tsx`** — Agregar entrada en `TAB_GUIDE`:
```
{ tab: 'bi', emoji: '🧠', nameEs: 'Business Intel', nameEn: 'Business Intel', descEs: '...' }
```

**Archivo padre del CRM** (donde se renderizan las pestañas) — Agregar el tab `bi` con `<AdminBusinessIntelligence />`.

## Datos que ya están disponibles

- `quiz_leads.country` — país del lead
- `quiz_leads.source` — app de origen
- `quiz_leads.converted_to_user` — si se registró
- `user_subscriptions.plan_type` — plan actual
- `profiles.email` — para cruzar lead ↔ usuario
- `ai_usage_logs` — consumo real de IA por usuario
- `stripe-analytics` edge function — churn, revenue histórico

No se necesitan migraciones SQL ni nuevas edge functions.

## Archivos a modificar/crear

1. **Crear `src/components/admin/tabs/AdminBusinessIntelligence.tsx`** — Componente completo con 5 secciones
2. **Modificar archivo padre del CRM** — Agregar tab "bi" y renderizar componente
3. **Modificar `AdminCRMHome.tsx`** — Agregar entrada en TAB_GUIDE

