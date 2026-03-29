

# Propuestas de Mejora para Reportes — Nivel Mundial

## Diagnóstico Actual

**Lo que ya existe:**
- PDFs con jsPDF + autoTable (gastos, T2125, reembolsos, ecosistema, presupuesto, pagos recurrentes)
- Excel con ExcelJS (gastos, T2125, reporte fiscal, reembolsos, presupuesto, pagos, leads)
- Formatos: CSV, JSON, XLSX, PDF
- Filtros por año, país, categoría
- Gráficos básicos en PDF (pie chart manual con arcos SVG)

**Lo que falta para competir a nivel mundial:**

---

## Propuesta A — Reportes PDF con Gráficos Reales (Alta prioridad)

**Problema:** Los PDFs actuales son tablas planas sin visualización. Apps como QuickBooks y Wave generan PDFs con gráficos de barras, líneas y donuts embebidos.

**Solución:** Usar `html2canvas` + `jsPDF` para capturar los charts de Recharts que ya existen en la app y embederlos en los PDFs.

**Implementación:**
1. Crear `src/lib/export/chart-to-pdf.ts` — utilidad que renderiza un chart Recharts offscreen, lo captura con html2canvas, y retorna un base64 image
2. Actualizar `pdf-export.ts` — incluir gráfico de barras mensual y donut de categorías en el reporte de gastos
3. Actualizar reporte de presupuesto y ecosystem — embeber mini-charts

---

## Propuesta B — Reporte P&L (Profit & Loss) Profesional (Alta prioridad)

**Problema:** No existe un estado de resultados formal. Es el reporte #1 que cualquier freelancer/empresa necesita.

**Solución:** Nuevo reporte P&L que cruza ingresos vs gastos con formato contable estándar.

**Implementación:**
1. Crear `src/lib/export/pnl-export.ts` — genera Excel con estructura: Ingresos → Costo de ventas → Margen bruto → Gastos operativos (por categoría) → Resultado neto
2. Crear `exportPnLToPDF()` en pdf-export — versión visual con KPIs y trend chart
3. Agregar tab "P&L" en `ExportDialog.tsx`

---

## Propuesta C — Reportes Programados por Email (Media prioridad)

**Problema:** El usuario debe entrar a la app y exportar manualmente cada mes.

**Solución:** Edge function con cron que genera y envía reportes mensuales por email.

**Implementación:**
1. Tabla `scheduled_reports` (user_id, report_type, frequency, email, last_sent)
2. Edge function `send-scheduled-report` con cron mensual
3. UI: toggle "Enviar reporte mensual a mi email" en ExportDialog

---

## Propuesta D — Dashboard de Reportes Centralizado (Media prioridad)

**Problema:** Los reportes están dispersos (ExportDialog, BillsExport, BudgetExport, EcosystemReport). No hay un lugar único.

**Solución:** Página `/reports` que centralice todos los reportes disponibles con preview y descarga.

**Implementación:**
1. Crear `src/pages/Reports.tsx` — grid de cards con cada reporte disponible (Gastos, T2125, Fiscal, P&L, Presupuesto, Pagos, Reembolsos)
2. Cada card muestra: nombre, descripción, preview thumbnail, botones PDF/Excel
3. Agregar a sidebar navigation

---

## Propuesta E — Comparativo Multi-Periodo (Baja prioridad)

**Problema:** No se puede comparar Q1 2025 vs Q1 2024 en un solo reporte.

**Solución:** Reporte que muestre dos periodos lado a lado con variación %.

---

## Propuesta F — Branding Personalizado en PDFs (Baja prioridad)

**Problema:** Los PDFs dicen "EvoFinz" pero el usuario debería poder poner su logo y nombre de empresa.

**Solución:** Usar datos del perfil (business_name, logo) para personalizar headers de PDF.

---

## Recomendación de Implementación

Empezaría con **B (P&L)** y **D (Reports Hub)** porque:
- El P&L es el reporte más pedido mundialmente por freelancers y contadores
- El hub centraliza todo y hace descubrible lo que ya existe
- Son los que más impacto tienen con menos complejidad

**¿Cuáles quieres que implemente?**

