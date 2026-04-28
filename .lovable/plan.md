# Plan: Modo Simple + Refactor del Modo Avanzado

Implementar un sistema de dos modos de uso (Simple y Avanzado) para reducir la complejidad percibida de la app, **y** mejorar el modo Avanzado para que tampoco se sienta abrumador.

---

## Parte 1 — Modo Simple (nuevo)

### 1.1 Preferencia del usuario
Agregar `ui_mode: 'simple' | 'advanced'` a `display_preferences` en `profiles` (ya existe el JSONB, no hay migración de schema). Default: `simple` para usuarios nuevos, `advanced` para usuarios existentes (detectado por presencia previa de `view_mode`).

Actualizar `useDisplayPreferences.ts` para exponer `uiMode` y `setUiMode`.

### 1.2 Dashboard Simple
Nuevo componente `src/components/dashboard/SimpleDashboard.tsx` que muestra solo:
- Balance del mes (ingresos − gastos)
- Botones grandes: **+ Gasto**, **+ Ingreso**, **📷 Capturar**
- Lista de últimos 8 movimientos
- 1 card de alerta del mes (si hay)

Sin tabs, sin grids complejos, mucho whitespace, estética actual condensada (mantiene "3D candy").

`Dashboard.tsx` renderiza `<SimpleDashboard />` cuando `uiMode === 'simple'`, si no, el dashboard actual.

### 1.3 Navegación filtrada
En `Layout.tsx` (sidebar desktop) y `MobileTabLayout` (móvil), filtrar items por modo:

**Esencial (visible en Simple):**
Dashboard · Gastos · Ingresos · Presupuesto · Banking · Capturar · Configuración

**Avanzado-only (oculto en Simple, accesible por URL):**
Clientes · Contratos · Mileage · Mentoría · Inversiones · FIRE · TaxOptimizer · Ecosistema · Gamificación · NetWorth · Bills · Subscriptions · Analytics

Las páginas ocultas siguen funcionando por URL directa (no rompe deep-links ni emails). Banner discreto arriba: *"Esta sección es del Modo Avanzado · [Activar Avanzado]"*.

### 1.4 Toggle en header
Componente `<UiModeToggle />` en el header del Layout (desktop y móvil): switch Simple ⇄ Avanzado siempre visible. Cambio instantáneo, sin recarga.

### 1.5 Diálogo de bienvenida (1 vez)
Si el usuario nunca eligió modo, mostrar diálogo: *"¿Cómo quieres empezar?"* con dos opciones grandes:
- **Simple** — Solo lo esencial
- **Avanzado** — Todas las herramientas

Se guarda la elección y no vuelve a aparecer.

---

## Parte 2 — Mejoras al Modo Avanzado

Para que Avanzado tampoco se sienta caótico:

### 2.1 Sidebar agrupado por categoría
Refactorizar el sidebar (~40 items planos hoy) en grupos colapsables:

```text
📊 Diario          Dashboard, Gastos, Ingresos, Capturar, Banking
💰 Planeación      Presupuesto, Bills, Subscriptions, Ahorro
📈 Crecimiento     Inversiones, NetWorth, FIRE, Analytics
💼 Negocio         Clientes, Contratos, Mileage, Proyectos
🏛️ Impuestos       TaxOptimizer, Reportes fiscales
🎯 Más             Mentoría, Gamificación, Ecosistema, Beta
⚙️ Configuración
```

Solo "Diario" abierto por defecto. Los demás grupos colapsados. El grupo que contiene la ruta activa se expande automáticamente.

### 2.2 Default a Vista Organizada
Cambiar default de `view_mode` de `classic` a `organized` para usuarios nuevos del modo Avanzado. Los existentes mantienen su preferencia.

### 2.3 Sección "Más" en Mission Control
Mover de la vista principal a una sección "Más" colapsada: Gamificación, Ecosistema, Mentoría, FIRE detallado. Solo se ven si el usuario las abre.

---

## Archivos a modificar

**Nuevos:**
- `src/components/dashboard/SimpleDashboard.tsx`
- `src/components/layout/UiModeToggle.tsx`
- `src/components/onboarding/UiModeWelcomeDialog.tsx`
- `src/lib/constants/nav-items.ts` (lista central con flag `essential: boolean`)

**Modificados:**
- `src/lib/constants/focus-areas.ts` — añadir tipo `UiMode` y default
- `src/hooks/data/useDisplayPreferences.ts` — exponer `uiMode`/`setUiMode`
- `src/components/Layout.tsx` — filtrar nav por modo, agregar toggle al header, agrupar sidebar
- `src/components/mobile/MobileTabLayout.tsx` — filtrar tabs por modo
- `src/pages/Dashboard.tsx` — renderizar SimpleDashboard cuando aplique
- `src/components/settings/DisplayPreferencesCard.tsx` — añadir control de UiMode
- Páginas avanzadas (Clientes, Contratos, Mileage, Investments, etc.) — banner "Modo Avanzado"

**Sin tocar:** lógica de negocio, hooks de datos, edge functions, schema de DB.

---

## Resultado esperado

- Usuario nuevo: ve diálogo → elige Simple → dashboard ultra-limpio, 7 items en nav, cero abrumamiento.
- Usuario que quiere todo: toggle a Avanzado en 1 clic → todas las funciones, pero ahora ordenadas en 6 grupos colapsables en vez de 40 items planos.
- Cero pérdida de funcionalidad. Cero ruptura de deep-links. Cambio reversible en cualquier momento.
