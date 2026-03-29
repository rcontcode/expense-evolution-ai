

# Actualización del Manual de Usuario y Landing Page

## Estado Actual

### Manual — 20 secciones existentes:
`dashboard`, `chaos-inbox`, `expenses`, `income`, `clients`, `contracts`, `budget`, `mileage`, `tax-calendar`, `banking`, `net-worth`, `capture`, `gamification`, `financial-education`, `financial-journal`, `financial-habits`, `advanced-tools`, `cross-border`, `projects-tags`, `reconciliation`, `files`, `business-profile`, `notifications`, `settings`

### Secciones faltantes (módulos que EXISTEN como páginas activas):

1. **Asistente de Voz (Phoenix)** — `ChatAssistant` se renderiza en `Layout.tsx` para todos los usuarios autenticados. El comentario "disabled in stability-first mode" en `App.tsx` línea 408 es **obsoleto** (se refería a overlays de onboarding, no al asistente). El manual dice "Phoenix Assistant sections removed" y la FAQ dice "Phoenix FAQ removed — feature disabled". **Ambos son incorrectos.**

2. **Optimizador Fiscal** (`/tax-optimizer`) — Página activa con `TaxSummaryCards`, `SavingsOptimizerSection`, `TaxDeadlineCountdown`, `TaxDocumentChecklist`.

3. **Flujo de Reporte Fiscal** (`/tax-report-flow`) — Flujo guiado de 5 pasos para preparar declaración.

4. **Suscripciones / Detector de Fantasmas** (`/subscriptions`) — Detector de suscripciones recurrentes.

5. **Salud de Datos** (`/data-health`) — Herramienta de auditoría de calidad de datos.

6. **Mentoría** (`/mentorship`) — Sistema de niveles y expertos financieros.

### Landing Page — 3 problemas:
- Footer dice `v1.0.0` — desactualizado
- Claims "SOC 2 Type II" implican certificación propia (es de la infraestructura)
- Comentario obsoleto en `App.tsx` línea 408

---

## Plan de Implementación

### Paso 1: Agregar 6 secciones al manual
En `src/data/user-guide-content.ts`:
- **voice-assistant** — Asistente de voz con comandos, modos (continuo, dictado), ElevenLabs TTS, tutorial interactivo
- **tax-optimizer** — Análisis de deducciones, RRSP/TFSA/APV, proyecciones de ahorro fiscal
- **tax-report-flow** — Los 5 pasos del flujo (Capturar → Categorizar → Revisar → Optimizar → Exportar)
- **subscriptions** — Detector de suscripciones fantasma, análisis de patrones
- **data-health** — Auditoría de calidad, detección de duplicados/incompletos
- **mentorship** — Sistema de niveles, expertos financieros, tips

### Paso 2: Restaurar FAQ del asistente de voz
- Remover comentario "Phoenix FAQ removed — feature disabled" (línea 986)
- Agregar FAQ bilingüe sobre el asistente de voz

### Paso 3: Agregar flujos de conexión faltantes
En `connectionsDiagram.flows`:
- `🎤 Asistente → 🧾 Gastos/Ingresos` (voz crea registros)
- `🧮 Tax Optimizer → 📊 Dashboard → 📋 Tax Report`
- `🔍 Subscriptions → 📅 Bills → 🎯 Budget`

### Paso 4: Corregir Landing Page
En `src/pages/Landing.tsx`:
- Cambiar "SOC 2 Type II" → "SOC 2 Type II Infrastructure"
- Cambiar "GDPR Compliant" → "GDPR-Ready Infrastructure" 
- Cambiar `v1.0.0` → `v2.5.0`

### Paso 5: Limpiar comentarios obsoletos
- `App.tsx` línea 408: Remover "intentionally disabled in stability-first mode"
- `user-guide-content.ts` línea 186: Remover "Phoenix Assistant and Smart Capture sections removed"

---

## Archivos a modificar

1. `src/data/user-guide-content.ts` — 6 secciones nuevas + FAQ + flujos + limpiar comentarios
2. `src/pages/Landing.tsx` — Claims de seguridad + versión
3. `src/App.tsx` — Remover comentario obsoleto

