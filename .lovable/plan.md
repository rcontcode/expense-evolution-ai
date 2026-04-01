

# Plan: Business Intelligence & Cost Control Dashboard para el CRM

## Lo que ya existe vs. lo que falta

| Área | Estado actual | Falta |
|---|---|---|
| Revenue (Stripe MRR/ARR) | ✅ AdminRevenueDashboard | — |
| ROI de leads por fuente | ✅ AdminROIDashboard | — |
| Suscripciones por plan | ✅ AdminSubscriptionsTab | — |
| Usage tracking por usuario | ✅ Parcial (UserDetailSheet) | Vista global agregada |
| **Costos de IA por usuario/plan** | ❌ No existe | Dashboard completo |
| **P&L del negocio (costos vs ingresos)** | ❌ No existe | Vista de costos operativos |
| **Satisfacción / NPS / Churn** | ❌ No existe | Métricas de retención |
| **Adopción multi-app por usuario** | ❌ Parcial (CrossAppRanking) | Vista individual + progreso |
| **Simulador de pricing/límites** | ❌ No existe | Herramienta de planificación |

---

## Implementación: 3 nuevas pestañas en el CRM

### Pestaña 1: `AdminBusinessPnL` — P&L del Negocio

KPIs principales:
- **Ingresos**: MRR, ARR, revenue 30d (de Stripe via `stripe-revenue`)
- **Costos IA**: Suma de `credits_used` de `ai_usage_logs` agrupado por mes, por plan, por app
- **Costos operativos**: Inputs manuales del admin (hosting Lovable, dominio, Stripe fees ~2.9%, emails Resend, etc.) almacenados en nueva tabla `admin_operational_costs`
- **Margen neto**: Ingresos - Costos IA - Costos operativos

Gráficos:
- Línea de tendencia: Ingresos vs Costos vs Margen (últimos 6 meses)
- Pie: Distribución de costos (IA, hosting, fees, otros)
- Tabla: Costo IA por plan (free/premium/pro) — cuánto "gasta" cada tier

### Pestaña 2: `AdminCustomerHealth` — Satisfacción y Retención

Datos de:
- `beta_feedback` → rating promedio, NPS proxy
- `feature_usage_logs` → frecuencia de uso, DAU/WAU/MAU
- `user_subscriptions` → churn rate (usuarios que pasaron de paid a free)
- `beta_bug_reports` → volumen de bugs (calidad percibida)

KPIs:
- **Customer Health Score** (0-100): basado en frecuencia de uso + feedback + antigüedad
- **Churn Rate**: % de usuarios pagos que cancelaron en últimos 30d
- **Retention Rate**: % de usuarios activos en últimos 7d vs total
- **Engagement Score por plan**: uso promedio free vs premium vs pro
- **Top usuarios en riesgo**: sin actividad >14d con suscripción activa

Gráficos:
- Barras: Engagement por plan
- Tabla: Usuarios en riesgo de churn (sin actividad, plan pago)
- Trend: Satisfacción promedio últimos 6 meses

### Pestaña 3: `AdminCostSimulator` — Simulador de Pricing y Límites

Herramienta interactiva para el admin:
- Sliders para ajustar límites de cada plan (OCR scans, voice minutes, AI credits)
- Inputs para precios de cada plan
- Cálculo automático de:
  - Costo IA promedio por usuario de cada plan (de datos reales)
  - Margen por usuario por plan
  - Proyección de ingresos si X% de free se convierte a premium/pro
  - Break-even point por plan
- Tabla de adopción multi-app: cuántos usuarios usan 1, 2 o 3 apps
- Progreso por usuario: qué apps usa, qué plan tiene, cuánto consume de IA

---

## Migración de BD

Nueva tabla `admin_operational_costs`:
```text
id, category (hosting/domain/email/stripe_fees/other),
description, amount_usd, period (monthly/annual/one_time),
month (date), created_at, updated_at
```
- RLS: Solo admins pueden CRUD

---

## Archivos a crear (3)
- `src/components/admin/tabs/AdminBusinessPnL.tsx`
- `src/components/admin/tabs/AdminCustomerHealth.tsx`
- `src/components/admin/tabs/AdminCostSimulator.tsx`

## Archivos a modificar (1)
- `src/pages/admin/AdminCRM.tsx` — agregar 3 tabs nuevas (P&L, Salud, Simulador)

## Migración (1)
- CREATE TABLE `admin_operational_costs` + RLS policies

## Detalle técnico

- `AdminBusinessPnL` consulta `ai_usage_logs` (agregado por mes/plan), `admin_operational_costs`, e invoca `stripe-revenue` para ingresos
- `AdminCustomerHealth` consulta `feature_usage_logs`, `beta_feedback`, `user_subscriptions`, `profiles`
- `AdminCostSimulator` consulta `ai_usage_logs` + `usage_tracking` + `user_subscriptions` para datos reales, y permite inputs interactivos para simulación
- Todos los componentes usan `useQuery` con `staleTime: 300000`
- Bilingüe (es/en) como el resto del CRM

