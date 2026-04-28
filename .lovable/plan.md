## Diagnóstico de la demora

No es caché de datos — es **descarga del bundle JS de cada página**.

Cada página está cargada con `lazy()` (lazyWithRetry en `src/App.tsx`). La primera vez que entras a una ruta, el navegador tiene que **descargar y parsear el chunk JS de esa página** (más sus dependencias: gráficos, PDFs, hooks pesados, etc.). Mientras eso pasa, se muestra el `PageLoader` (skeleton). En el preview de Lovable estos chunks pueden tardar varios segundos.

**¿Por qué solo a páginas no visitadas recientemente?**
Una vez descargado, el chunk queda cacheado en memoria por el navegador y `lazy()` lo sirve instantáneamente. Por eso volver a una página ya visitada es inmediato, pero entrar por primera vez tarda.

**¿Por qué solo en móvil/tablet se siente tanto?**
Hay un `preloadRoute(path)` definido, pero solo se dispara en `onMouseEnter` / `onFocus` del menú lateral del **escritorio** (`src/components/Layout.tsx` líneas 1055-1056). El **bottom nav móvil** y el menú hamburguesa móvil **no precargan nada** (líneas 778, 794, 808, 616, 679). En móvil tocas → navegas → espera ~10s mientras se descarga el chunk.

## Solución (3 capas)

### 1. Precarga proactiva en idle de las rutas más usadas
En `src/App.tsx`, después del primer render del usuario autenticado, usar `requestIdleCallback` para precargar en segundo plano los chunks de las rutas principales (Dashboard, Expenses, Income, Budget, Bills, Banking, Chaos, Analytics, Settings). Así, mientras el usuario lee el dashboard, los chunks de todas las páginas frecuentes se descargan en silencio.

- Añadir función `preloadCoreRoutes()` que itera el `routeImportMap` y dispara los imports en idle, escalonados (uno cada ~150ms) para no saturar la red.
- Llamarla en un `useEffect` dentro de `MissionListenerInitializer` (o un componente nuevo `IdlePreloader`) solo cuando hay sesión activa.
- Saltar la precarga si `navigator.connection.saveData === true` o `effectiveType === '2g'`.

### 2. Preload en móvil al tocar (touchstart)
Modificar `src/components/Layout.tsx`:
- **Bottom nav** (líneas 778, 794, 808): añadir `onTouchStart={() => preloadRoute(item.path)}`. El touchstart dispara ~80-150ms antes que el click, dando una pequeña ventaja para empezar la descarga.
- **Mobile menu items** (líneas 616, 679): mismo `onTouchStart`.

### 3. Ampliar `routeImportMap` con todas las rutas relevantes
Hoy faltan en el mapa: `/banking`, `/net-worth`, `/notifications`, `/mentorship`, `/tax-calendar`, `/files`, `/data-health`, `/reports`, `/contracts`, `/mileage`, `/reconciliation`, `/tags`, `/trash`, `/user-guide`. Sin entrada en el mapa, `preloadRoute` no hace nada para esas rutas.

Agregar todas para que tanto el preload táctil como el idle puedan cubrirlas.

## Archivos a modificar

- **`src/App.tsx`**:
  - Ampliar `routeImportMap` con todas las rutas autenticadas.
  - Añadir helper `preloadCoreRoutes()` y componente `IdlePreloader` que la dispara en `requestIdleCallback` tras montar (con fallback `setTimeout` 1500ms).
  - Montar `<IdlePreloader />` dentro de `AuthProvider` para que solo corra con sesión.

- **`src/components/Layout.tsx`**:
  - Añadir `onTouchStart={() => preloadRoute(item.path)}` a los 4 lugares de navegación móvil (bottom nav x2 y mobile menu x2).
  - También en el botón del sidebar añadir `onTouchStart` (para tablets con touch + sidebar).

## Resultado esperado

- **Primera carga del dashboard**: igual (no cambia).
- **Mientras lees el dashboard**: en segundo plano se descargan los chunks de las páginas frecuentes (~5-10 chunks de 50-200 KB cada uno).
- **Navegación a cualquier página después**: instantánea (chunk ya en memoria).
- **Si tocas una página antes de que termine la precarga idle**: el `onTouchStart` adelanta la descarga ~100ms y no se duplica (gracias al `preloadedRoutes` Set).
- **Conexiones lentas/Save-Data**: se respeta y no se precarga, comportamiento actual.

Sin cambios en caché de datos React Query (ya está bien configurado: 5min staleTime, 15min gcTime).
