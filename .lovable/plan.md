# Diagnóstico real: por qué no se solucionó el scroll móvil

Ya revisé el código que controla el layout móvil, el CSS global y las pantallas principales. La causa raíz no es una sola regla aislada: son tres problemas combinados.

## Causa raíz encontrada

1. **El layout móvil no tiene un contenedor de scroll explícito**
   - En `Layout.tsx`, el móvil usa:
     ```text
     mobile-app-shell: min-height 100dvh
     main: flex-1 min-h-0 overflow-x-hidden pb-20
     ```
   - Pero `main` no tiene `overflow-y-auto` ni una altura fija/limitada del viewport.
   - Resultado: el navegador intenta hacer scroll en el documento completo mientras hay header sticky y bottom nav fixed. En móvil eso produce el “rebote” y la sensación de que la página se corta o no baja bien.

2. **Hay CSS que intenta matar el rebote en `html/body`, pero lo hace en el nivel incorrecto**
   - En `index.css` se puso:
     ```text
     html, body { overscroll-behavior-y: none; }
     .mobile-app-main { overscroll-behavior-y: contain; }
     ```
   - Eso no basta si el elemento que realmente debe scrollear no es `mobile-app-main`.
   - La solución correcta es que el shell móvil ocupe exactamente `100dvh`, que `main` sea el único contenedor scrollable y que `body` no compita con ese scroll.

3. **Las pestañas no se aplicaron realmente al Dashboard móvil principal**
   - `MobileTabLayout` sí existe y se usa en Expenses, Income, Banking, Analytics y NetWorth.
   - Pero en `Dashboard.tsx` / `MobileDashboard.tsx` no se usa `MobileTabLayout`; solo hay dos botones internos `Resumen / Control` y debajo queda demasiado contenido largo dentro de “Resumen”.
   - Por eso visualmente el Dashboard sigue pareciendo una página larga, no una app móvil con pestañas reales.

4. **La compactación no alcanza porque apunta a clases que no existen o no cubre componentes base**
   - El CSS usa `.mobile-compact .card-content`, pero `CardContent` no agrega clase `card-content`; usa solo clases Tailwind (`p-6 pt-0`).
   - También intenta reducir `[class*='p-4']` y `[class*='p-3']`, pero muchas tarjetas grandes vienen de `CardHeader p-6`, `CardContent p-6`, `text-xl`, botones altos y componentes como `MonthDetailPanel`.
   - Resultado: algunas cosas bajaron, pero muchas siguen con tamaño desktop/tablet.

## Plan de corrección definitiva

### 1. Convertir el layout móvil en un shell nativo con scroll controlado
Cambiar `Layout.tsx` para que en móvil:

```text
html/body/root
  no scrollean horizontalmente

.mobile-app-shell
  height: 100dvh
  overflow: hidden
  display: flex column

header
  height compacta fija/sticky dentro del shell

.mobile-app-main
  flex: 1
  min-height: 0
  overflow-y: auto
  overflow-x: hidden
  -webkit-overflow-scrolling: touch
  overscroll-behavior-y: contain
  padding-bottom suficiente para bottom nav

bottom nav
  fixed o sticky inferior, sin bloquear contenido
```

Esto elimina la competencia entre scroll de `body` y scroll del contenido.

### 2. Corregir CSS global móvil
Actualizar `index.css` y `App.css` para:
- usar `height: 100%` y `100dvh` correctamente en `html/body/#root`;
- evitar `body` como contenedor principal de scroll en modo app móvil;
- agregar reglas específicas para `.mobile-app-shell` y `.mobile-app-main`;
- reducir scrollbar y evitar rebote al final del contenido;
- añadir padding inferior real considerando bottom nav + safe area.

### 3. Hacer pestañas reales en el Dashboard móvil
Refactorizar `MobileDashboard.tsx` para usar `MobileTabLayout` con secciones separadas, por ejemplo:

```text
Resumen
  stats principales + balance mensual compacto

Timeline
  resumen anual + detalle del mes

Acciones
  captura, ingresos, gastos, presupuesto, banking

Sistema
  mission control, notificaciones, perfil, gamificación

Ecosistema
  widgets de ecosistema / narrative / banking summary
```

Así el usuario no tiene que bajar y bajar en una sola columna infinita.

### 4. Compactar de verdad los componentes móviles críticos
Ajustar componentes que hoy siguen grandes:
- `MobileDashboard.tsx`
- `DashboardViewTabs.tsx`
- `MobileStatsGrid.tsx`
- `YearTimelineChart.tsx`
- `MonthDetailPanel.tsx`
- `MissionControl.tsx`
- `MobileTabLayout.tsx`

Cambios específicos:
- headers de tarjetas de `p-6` a `p-2/p-3` en móvil;
- títulos `text-xl` a `text-sm/text-base` en móvil;
- botones altos a `h-8/h-9`;
- ocultar textos secundarios largos en móvil;
- convertir bloques de 1 columna demasiado altos en grids compactos;
- colapsar secciones pesadas por defecto.

### 5. Corregir `MobileTabLayout` para que sea visible y robusto
Ajustar `MobileTabLayout` para:
- sticky correcto bajo el header móvil;
- menos altura;
- indicadores claros;
- persistencia por URL sin romper el scroll;
- resetear scroll interno al cambiar de pestaña solo dentro de `mobile-app-main`, no en `window`.

### 6. Revisar pantallas sin pestañas móviles
Actualmente hay páginas que aún no usan `MobileTabLayout`:
- `Budget.tsx`
- `Bills.tsx`
- `Subscriptions.tsx`
- `Investments.tsx`
- parte de `Settings.tsx` usa otra estrategia, no `MobileTabLayout`

Aplicaré la misma estrategia de pestañas/compactación donde corresponda para que sea consistente en toda la app.

## Archivos a modificar

- `src/components/Layout.tsx`
- `src/index.css`
- `src/App.css`
- `src/components/mobile/MobileTabLayout.tsx`
- `src/components/dashboard/MobileDashboard.tsx`
- `src/components/dashboard/DashboardViewTabs.tsx`
- `src/components/dashboard/MobileStatsGrid.tsx`
- `src/components/dashboard/YearTimelineChart.tsx`
- `src/components/dashboard/MonthDetailPanel.tsx`
- `src/components/dashboard/MissionControl.tsx`
- `src/pages/Budget.tsx`
- `src/pages/Bills.tsx`
- `src/pages/Subscriptions.tsx`
- `src/pages/Investments.tsx`
- `src/pages/Settings.tsx`

## Resultado esperado

- El scroll móvil dejará de rebotar/cortarse porque habrá un único contenedor scrollable.
- El Dashboard móvil dejará de ser una página larguísima y pasará a secciones por pestañas.
- La app se verá realmente móvil: menos padding, textos más pequeños, tarjetas más bajas y navegación más clara.
- Las secciones principales quedarán agrupadas por función para que el usuario no se pierda bajando indefinidamente.