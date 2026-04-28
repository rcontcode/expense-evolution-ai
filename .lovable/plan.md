
# Próxima ronda de pulido — Modo Simple + Avanzado

Auditoría rápida del estado actual: Simple ya tiene contexto temporal, top categoría, sparkline, atajos contextuales y switcher. Avanzado ya está zonificado y con QuickActions contextuales. Quedan **8 mejoras concretas** de alto impacto.

---

## 1. Limpieza final de "AI / IA" en UI

Aún quedan strings prohibidos por la regla de marca:

- `EcosystemAICoaching.tsx` → `EcosystemSmartCoaching` + texto "Coach Inteligente del Ecosistema" / "Smart Ecosystem Coach". Renombrar archivo y actualizar imports en `EcosystemSection.tsx` y `EcosystemDashboardWidgets.tsx`.
- `EcosystemCoaching.tsx` línea 76 → reemplazar badge `AI` por `Smart` o quitarlo.
- `TaxOptimizerCard.tsx` líneas 66, 201, 205 → "Optimizador Inteligente de Impuestos" / "Smart Tax Optimizer", "Recomendaciones inteligentes".
- `NegotiationScriptGenerator.tsx` línea 148 → badge `Smart`.
- `SmartSearchChat.tsx` línea 195 → "Asistente Financiero Inteligente" / "Smart Financial Assistant".

## 2. Modo Simple — meta del mes (S4)

Bajo el balance Hero, añadir línea opcional **"Meta de ahorro: $X / $Y este mes"** con barrita si el usuario tiene `preferences.savings_goal_monthly`. Si no la tiene, mostrar CTA pequeño *"Define una meta de ahorro"* → `/settings?tab=goals`. Da un objetivo concreto, no solo balance.

## 3. Modo Simple — proyección de fin de mes (S5)

Calcular ritmo diario de gasto = `monthlyTotal / monthProgress.day` y proyectar fin de mes. Mostrar como microcopy debajo del Top Category:

> "A este ritmo terminarás el mes con ~$Z" (verde si positivo, ámbar si déficit proyectado).

Es la pregunta #1 que un usuario "simple" se hace. Pura utilidad, cero jerga.

## 4. Modo Simple — accesibilidad y resumen por voz (S6)

- `aria-live="polite"` en el balance Hero para que lectores de pantalla anuncien cambios.
- Botón discreto "🔊 Escuchar resumen" que use `speechSynthesis` para leer: *"Tu balance es X, has gastado Y de tus Z ingresos, día N de M."* Reutiliza voz Phoenix si está disponible (mem://features/audio/phoenix-system).

## 5. Modo Simple — tutorial vacío contextual (S7)

Cuando `recent.length === 0` Y no hay onboarding pendiente, mostrar microcard explicando los 3 chips ya existentes con un texto introductorio:

> "Tres formas de registrar tu primer movimiento — elige la más cómoda. Todo se sincroniza automáticamente."

## 6. Modo Avanzado — NextActionBanner global (A6)

Existe `NextActionBanner.tsx` pero no se usa en `Dashboard.tsx`. Añadirlo en Zona 1 ("Hoy"), encima del NotificationHub, para mostrar **la única siguiente acción priorizada** (factura por pagar más urgente, recibo sin clasificar, etc.). Reduce parálisis de decisión.

## 7. Modo Avanzado — Money Momentum visible (A7)

`MoneyMomentumScore.tsx` está implementado pero huérfano. Añadirlo en Zona 3 ("Tu sistema") junto a Gamification — da un indicador único de salud financiera (0-100) que complementa al narrative.

## 8. Modo Avanzado — Toast de bienvenida al cambiar de modo

`UiModeToggle` ya hace `window.location.href = '/'` después de un toast. El toast es bueno pero el reload pierde el contexto. Cambiar a `navigate('/')` con `window.location.reload()` solo si es necesario, y añadir un mini-tour de 1-paso ("¿Sabías que…?") la primera vez que el usuario llega a Avanzado desde Simple — usando el flag `localStorage['advanced-first-visit']`.

---

## Detalle técnico

**Archivos a crear:**
- `src/components/ecosystem/EcosystemSmartCoaching.tsx` (rename de `EcosystemAICoaching.tsx`)
- `src/components/dashboard/SimpleProjection.tsx` (helper opcional para S3+S5)

**Archivos a modificar:**
- `src/components/dashboard/SimpleDashboard.tsx` (S4, S5, S6, S7, aria-live)
- `src/components/dashboard/SimpleOnboardingPath.tsx` (sin cambios mayores)
- `src/pages/Dashboard.tsx` (A6 NextActionBanner, A7 MoneyMomentum)
- `src/components/ecosystem/EcosystemSection.tsx`, `EcosystemDashboardWidgets.tsx`, `EcosystemCoaching.tsx` (renombre + badge)
- `src/components/dashboard/TaxOptimizerCard.tsx`, `NegotiationScriptGenerator.tsx` (textos)
- `src/components/banking/SmartSearchChat.tsx` (texto)
- `src/components/layout/UiModeToggle.tsx` (mini-tour primera vez en Avanzado)

**No se toca:** schema DB, edge functions, archivos preconfigurados.

**Riesgo:** bajo — todos los cambios son aditivos o de copy. El renombre de `EcosystemAICoaching` requiere cuidado con los 2 imports.

¿Apruebas los 8 puntos? Si quieres recortar (p.ej. solo 1+2+3+6+7 que son los de mayor impacto inmediato), dime cuáles.
