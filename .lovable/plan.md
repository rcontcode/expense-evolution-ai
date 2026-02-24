
Objetivo: arreglar definitivamente el “no sale de Configuración” y bajar el tiempo de cambio de sección (actualmente ~3–6s en casos observados), atacando causa raíz y no parches.

Diagnóstico (basado en lo que revisé y reproduje):
1) El problema sí existe y es real: se puede reproducir una desincronización temporal URL/UI.
   - En pruebas: la URL cambió a `/income` y el sidebar marcó Income, pero el contenido siguió mostrando Settings durante varios segundos.
   - Esto confirma que la navegación se dispara, pero el árbol de rutas tarda en conmutar (no es solo “botón roto”).

2) Causa raíz principal (arquitectura actual):
   - El guard actual (`RouteSyncGuard` en `App.tsx`) solo escucha `popstate`.
   - Eso no cubre navegación SPA normal (clicks con `navigate()`), justo el flujo donde se está quedando “pegado”.
   - Resultado: cuando hay desync en navegación interna, no hay corrección activa.

3) Causa raíz de lentitud percibida:
   - El cambio de URL ocurre rápido, pero la vista tarda en actualizar.
   - Hay señales de presión de render/carga durante transiciones (lazy routes + carga pesada de layout/hooks + posibles retries de chunks).
   - El patrón actual de lazy con retry en páginas grandes puede amplificar latencia si falla el primer intento de chunk.

4) Problema de “preview viejo” aún no cerrado al 100%:
   - Ya se removió PWA plugin, pero todavía hay rutas de caché/estado en preview que pueden conservar runtime desfasado.
   - Hay inconsistencias que requieren invalidación determinística por versión (no solo limpieza best-effort de SW/cache).

Plan de implementación (secuenciado):
Fase 1 — Corrección dura de sincronización de rutas (prioridad máxima)
- Archivo: `src/App.tsx`
- Cambios:
  1. Mantener `RouteRenderHeartbeat`, pero ampliar `RouteSyncGuard` para escuchar:
     - `popstate` (ya existe)
     - `hashchange`
     - `visibilitychange` (cuando vuelve a foco)
     - y verificación tras navegación SPA (ver Fase 2 hook).
  2. Guard conservador con “anti-loop”:
     - umbral de desync (ej. 350–500ms)
     - cooldown por ruta (ej. 2–3s)
     - máximo de 1 reparación por intento de navegación
  3. Reparación suave:
     - `navigate(target, { replace: true })` solo si heartbeat sigue distinto tras el buffer.
- Resultado esperado:
  - Si URL y vista divergen, autocorrección sin reload duro ni loops.

Fase 2 — Navegación segura con confirmación de render (sin agresividad)
- Archivo: `src/hooks/useSafeNavigation.ts`
- Cambios:
  1. Añadir verificación “post-navigate” mínima:
     - tras `navigate(path)`, validar por heartbeat si renderizó ese path en ventana corta.
  2. Si no renderiza en tiempo:
     - disparar una única re-sincronización (no hard reload).
  3. Evitar false positives:
     - excluir navegación a misma ruta
     - cancelar verificación si hubo nueva navegación del usuario
- Resultado esperado:
  - Salida de Settings consistente incluso en navegación por click, no solo back/forward.

Fase 3 — Reducir latencia real entre secciones
- Archivos: `src/App.tsx`, `src/components/Layout.tsx`, rutas grandes (`src/pages/*`)
- Cambios:
  1. Preload inteligente de rutas frecuentes:
     - precargar chunks de Dashboard/Income/Expenses/Settings al hover/focus del item del sidebar.
  2. Revisar `lazyWithRetry` para rutas:
     - en preview: evitar backoff largo acumulado para navegación interactiva (fallback rápido + recuperación controlada).
  3. Quitar trabajo no crítico del camino de navegación:
     - diferir hooks globales pesados fuera de interacción inmediata (ej. reminders) con `requestIdleCallback`/timeout más largo.
- Resultado esperado:
  - navegación percibida mucho más inmediata (objetivo <1s en caliente, ~1–1.5s en frío).

Fase 4 — Preview siempre en última versión (determinístico)
- Archivos: `src/main.tsx`, `index.html` (y opcional: endpoint/versionado estático)
- Cambios:
  1. Introducir “build fingerprint” (id de build) y validación en runtime.
  2. Si detecta mismatch de build entre shell y runtime:
     - forzar un único reload con query anti-cache (`?v=<build-id>`).
  3. Mantener limpieza de SW/cache como respaldo, no como mecanismo único.
  4. Corregir referencias de manifiesto/activos para evitar rutas inconsistentes.
- Resultado esperado:
  - preview deja de quedarse en versión antigua de forma intermitente.

Fase 5 — Verificación y criterios de aceptación
- Pruebas funcionales:
  1. `/settings -> /dashboard` (botón sidebar, breadcrumb, mobile “Salir de Configuración”).
  2. `/settings -> /income -> /settings` repetido 10 veces.
  3. navegación rápida multi-click para asegurar que no hay loops.
- Pruebas de rendimiento:
  1. medir tiempo click→paint de ruta destino en frío y caliente.
  2. confirmar que no hay bloqueos >1s en transición normal.
- Pruebas de frescura de preview:
  1. publicar cambios consecutivos y validar que preview muestra build nueva sin hard refresh manual.
- Criterio de éxito:
  - cero casos de URL/vista desincronizados persistentes
  - navegación estable sin loops
  - tiempo de transición claramente menor al estado actual.

Riesgos y mitigación:
- Riesgo: volver a introducir loops de navegación.
  - Mitigación: cooldown + umbral + máximo intento por navegación.
- Riesgo: corrección demasiado agresiva en rutas lazy lentas.
  - Mitigación: buffer temporal y exclusión de rutas ya en carga.
- Riesgo: falsas alarmas de build mismatch.
  - Mitigación: comparación estricta de fingerprint y refresh único por sesión.

Notas técnicas concretas (para que quede trazable):
- Puntos a tocar primero: `App.tsx` (`RouteSyncGuard`) y `useSafeNavigation.ts`.
- Luego optimización de transición y preload de rutas desde `Layout.tsx`.
- Finalmente endurecer estrategia de build freshness en `main.tsx` + shell HTML.

