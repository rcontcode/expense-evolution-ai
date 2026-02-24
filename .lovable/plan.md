
Objetivo: corregir la causa raíz del “quedarse pegado en Configuración” sin depender de recargas forzadas feas, y dejar la navegación estable incluso cuando el usuario entra y sale inmediatamente.

Contexto confirmado durante diagnóstico:
- Se reprodujo exactamente el bug: desde `/settings`, esperando unos segundos sin interacción, al hacer click en sidebar:
  - la URL cambia (ej. `/dashboard`),
  - pero la vista sigue mostrando Settings.
- También se comprobó que, tras interactuar dentro de Settings (por ejemplo cambiar tab), la navegación vuelve a funcionar.
- Esto confirma un problema de desincronización “URL vs ruta renderizada”, no un simple bloqueo de click.
- El fallback actual en `useSafeNavigation` valida solo `window.location.pathname`; eso no detecta el caso donde la URL sí cambió pero React Router no re-renderizó. Por eso a veces se queda pegado y otras veces termina en recarga dura.

Plan de corrección (raíz, no parche superficial):

1) Crear una señal confiable de “ruta realmente renderizada”
- En `App.tsx`, agregar un componente interno de sincronización (ej. `RouteRenderHeartbeat`) que use `useLocation()` y actualice una marca global liviana (ej. `window.__APP_RENDERED_PATH__`) en cada render real de ruta.
- Esta marca será la fuente de verdad del render React (no solo la URL del navegador).

2) Reescribir `useSafeNavigation` para validar render, no solo URL
- Actualizar `src/hooks/useSafeNavigation.ts` para que:
  - intente navegación SPA normal,
  - espere una ventana corta (ej. 120ms + 300ms),
  - valide que `__APP_RENDERED_PATH__ === targetPath`.
- Si la URL cambió pero la ruta renderizada no cambió, disparar recuperación controlada (hard navigation una sola vez).
- Mantener compatibilidad con BrowserRouter/HashRouter para evitar falsos positivos.
- Resultado esperado: elimina el “URL cambió pero sigo en Settings”.

3) Guard global anti-desincronización (autorreparación)
- En `App.tsx`, además del heartbeat, agregar un guard global que compare periódicamente:
  - ruta del navegador,
  - ruta renderizada por React Router.
- Si persiste mismatch más de un umbral corto (ej. 400–600ms), ejecutar recuperación automática.
- Esto evita que el usuario quede atrapado en cualquier pantalla, no solo Settings.

4) Reducir la presión de montaje inicial de Settings (causa contribuyente)
- En `src/pages/Settings.tsx`, diferir/montar bajo demanda secciones pesadas que hoy se montan todas al entrar.
- Priorizar lazy mount de componentes pesados (voz/notificaciones avanzadas/sonidos), para que no compitan con el primer cambio de ruta inmediato.
- Esto ataca el patrón reportado por el usuario: “si entro y salgo enseguida falla; si interactúo primero, luego funciona”.

5) Corregir churn de hooks de voz que puede degradar estabilidad
- Ajustar `useGlobalReminders` y `useVoicePreferences` para evitar reinstalaciones/reinicializaciones innecesarias que generan ruido (`[Audio] Context initialized`) y trabajo extra.
- Objetivo: una sola inicialización de audio por sesión/interacción real, no múltiples disparos indirectos.

Archivos a intervenir:
- `src/App.tsx` (heartbeat + guard global de sincronización)
- `src/hooks/useSafeNavigation.ts` (validación por ruta renderizada)
- `src/pages/Settings.tsx` (mount diferido de secciones pesadas)
- `src/hooks/utils/useGlobalReminders.ts` (estabilizar dependencias/intervalo)
- `src/hooks/utils/useVoicePreferences.ts` (evitar reinicializaciones repetidas de audio)

Criterios de aceptación (obligatorios):
1) Desde `/settings`, sin tocar nada dentro, esperar 3–10s y navegar a:
   - dashboard,
   - expenses,
   - net-worth,
   - cualquier otra sección
   => la vista debe cambiar siempre, no solo la URL.
2) Repetir 15–20 veces en desktop y mobile: 0 casos “URL cambia pero pantalla queda en Settings”.
3) Debe desaparecer la necesidad frecuente de recarga dura “fea”.
4) Si ocurre una desincronización excepcional, el guard debe auto-reparar en menos de 1 segundo.
5) Disminuir claramente eventos repetidos de inicialización de audio en consola.

Riesgos y mitigaciones:
- Riesgo: fallback duro puede perder estado efímero.
  - Mitigación: activarlo únicamente cuando se detecta mismatch real persistente.
- Riesgo: tocar navegación global puede afectar otras rutas.
  - Mitigación: centralizar toda lógica en `useSafeNavigation` + guard único en `App`, con pruebas E2E dirigidas.

Validación final que voy a ejecutar al implementar:
- Escenario exacto reportado por ti (entrar a Configuración, no hacer nada, salir de inmediato) en loop.
- Prueba cruzada de salida por:
  - sidebar,
  - botón atrás del header,
  - botón de salida en móvil.
- Confirmar que ya no se “pega” y que la transición vuelve a ser natural (SPA), no recarga abrupta.
