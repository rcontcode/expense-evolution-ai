

# Plan: Desglose completo de costos IA y ROI por app, plan y usuario

## Qué falta y dónde agregarlo

Se ampliará el **AdminBusinessPnL.tsx** (que ya tiene la base de costos IA por plan) con 3 nuevas secciones al final del componente.

## Cambios en `src/components/admin/tabs/AdminBusinessPnL.tsx`

### 1. Nueva query: AI cost por action_type (= por app/feature)

Agrupar `ai_usage_logs` por `action_type` del mes actual para mostrar qué features/apps consumen más créditos. Tabla con columnas: Feature, Créditos, Usuarios, Costo Est.

### 2. Nueva query: Top consumers (AI cost por usuario)

Join `ai_usage_logs` con `profiles` y `user_subscriptions` del mes actual. Mostrar tabla top 15 usuarios ordenados por créditos consumidos, con columnas:
- Usuario (email truncado)
- Plan (free/premium/pro)
- Precio plan (lo que paga)
- Créditos IA usados
- Costo IA estimado
- **ROI usuario** (precio plan - costo IA)
- Badge verde/rojo según ganancia o pérdida

### 3. Nueva sección: Profit/Loss por plan (consolidado)

Tabla resumen que cruza datos ya existentes:
- Plan | Suscriptores | Ingreso total (subs × precio) | Costo IA total del plan | **Profit/Loss** | **Margin %**
- Fila total al final

### 4. KPI adicional: ROI global

Agregar un 5to KPI card o modificar el existente de "Net Margin" para incluir: `ROI = (Revenue - Costos Totales) / Costos Totales × 100`

## Datos que ya existen en las queries actuales

- `aiCostsByPlan` ya tiene créditos por plan con usuarios y costo estimado
- `stripeData` ya tiene MRR
- Solo necesitamos 2 queries nuevas (por action_type y por usuario individual)

## Archivo a modificar

1. **`src/components/admin/tabs/AdminBusinessPnL.tsx`** — Agregar 2 queries + 3 secciones UI + 1 KPI

