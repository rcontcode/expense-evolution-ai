
Objetivo inmediato: eliminar el bloqueo al salir de Configuración con una solución de “escape garantizado” (sin depender de que el router interno esté sano), y luego estabilizar las causas que están dejando la UI “pegada”.

Diagnóstico confirmado (no suposición):
1) Se reproduce el fallo: al hacer click en “volver” o navegar desde sidebar, la URL cambia a `/dashboard`, pero el contenido visible sigue siendo `Settings`.
2) Esto indica desincronización entre URL y render del router (el navegador sí cambia ruta, la UI no conmuta pantalla).
3) Hay además ruido/performance secundarios:
   - Banner de cookies fijo superpuesto en zonas de interacción.
   - Warning React de `Badge` sin `forwardRef` (genera trabajo extra en render dev y ensucia consola).

Qué voy a implementar (orden estricto, enfoque “que funcione sí o sí”):

Fase 1 — Salida forzada confiable (hotfix principal)
- Crear un helper/hook de navegación segura (por ejemplo `useSafeNavigation`) que:
  1. Intente navegación SPA (`navigate(path)`).
  2. Verifique en 120–250ms si la pantalla siguió “atascada” (URL y/o ruta renderizada no alineadas).
  3. Si detecta desincronización, haga fallback duro con `window.location.assign(path)` para forzar recarga en la ruta destino.
- Aplicar este helper en todos los puntos críticos de salida:
  - `src/pages/Settings.tsx` (botón “Salir de Configuración”).
  - `src/components/PageHeader.tsx` (botón volver + home en breadcrumb).
  - `src/components/Layout.tsx` (items de sidebar y navegación móvil principal).
- Resultado esperado: aunque el router se trabe, el usuario SIEMPRE sale de Configuración.

Fase 2 — Guard global de desincronización ruta/UI
- En `src/App.tsx`, añadir un guard liviano que detecte inconsistencia persistente entre:
  - `window.location.pathname` (navegador) y
  - ruta activa de React Router (`useLocation().pathname`).
- Si persiste más de un umbral corto (ej. 500ms), ejecutar recuperación segura:
  - `window.location.replace(window.location.pathname + window.location.search + window.location.hash)`.
- Esto cubre no solo Settings, sino cualquier pantalla donde ocurra el mismo síntoma.

Fase 3 — Quitar fricción visual que interfiere con interacción
- `src/components/CookieConsent.tsx`:
  - No mostrar el banner completo en rutas autenticadas críticas o convertirlo a modo compacto no intrusivo (chip/botón lateral) para no tapar navegación móvil/desktop.
  - Mantener acceso a preferencias, pero sin overlay grande fijo.
- Impacto: menos “sensación de app trabada” y menos zonas tapadas.

Fase 4 — Corrección de warning React que penaliza render
- `src/components/ui/badge.tsx`:
  - Convertir `Badge` a `React.forwardRef` (elemento `span`/`div`) para soportar refs cuando se use dentro de `asChild`/Slot en componentes de Radix.
- Impacto: reduce warnings repetitivos y costo de validación en desarrollo, mejorando estabilidad percibida.

Archivos a tocar
1) `src/hooks/useSafeNavigation.ts` (nuevo)
2) `src/pages/Settings.tsx`
3) `src/components/PageHeader.tsx`
4) `src/components/Layout.tsx`
5) `src/App.tsx`
6) `src/components/CookieConsent.tsx`
7) `src/components/ui/badge.tsx`

Criterios de aceptación (obligatorios)
1) Desde `/settings`, al usar:
   - botón “Salir de Configuración”,
   - botón atrás del header,
   - home breadcrumb,
   - sidebar (Dashboard/Expenses/etc),
   la pantalla debe cambiar de inmediato (no solo la URL).
2) Prueba repetida 10 veces seguidas en mobile y desktop: 0 bloqueos.
3) Si el router interno se desincroniza, el fallback duro debe recuperar la navegación automáticamente.
4) Sin warning “Function components cannot be given refs” relacionado a `Badge`.
5) Cookie banner no debe tapar controles de salida/navegación.

Riesgos y mitigación
- Riesgo: fallback duro recarga página (pierde estado efímero no guardado).
  - Mitigación: solo activar fallback si se detecta desincronización real (no siempre).
- Riesgo: cambiar navegación en muchos puntos.
  - Mitigación: centralizar en `useSafeNavigation` para mantener una sola lógica y evitar divergencias.

Notas técnicas (para implementación)
- El síntoma observado “URL cambia pero la vista no” se trata como condición de error de navegación.
- La solución no depende de animaciones ni estética; prioriza flujo crítico usable.
- Se mantiene SPA normalmente; la recarga completa es red de seguridad, no camino principal.

Tras aprobar este plan, ejecuto inmediatamente los cambios en ese orden y dejo verificación final de flujo end-to-end de salida desde Configuración.
