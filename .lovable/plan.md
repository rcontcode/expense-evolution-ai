Problema identificado:
- La pantalla que se queda pegada es el hero del quiz que también aparece en `/home`.
- En la sesión de navegador se detecta `body` con `overflow: hidden` y un banner de cookies fijo ocupando la parte inferior. En iOS/Safari esto puede capturar el gesto y dejar la página sin scroll aunque el documento tenga más contenido.
- También hay reglas globales móviles con `overscroll-behavior-y: none` y una lógica de `Layout` que bloquea el scroll del documento en vistas móviles autenticadas. Aunque esa lógica es útil dentro del app shell, no debe afectar páginas públicas como quiz/home.

Plan de corrección:
1. Hacer que las páginas públicas de quiz usen explícitamente scroll de documento en móvil:
   - Forzar `overflow-y-auto`, `touch-pan-y` y `overscroll-y-auto` en el contenedor de `FinancialQuiz`.
   - Asegurar que el contenido tenga padding inferior suficiente para no quedar tapado por overlays.

2. Ajustar el hero del quiz para pantallas móviles reales:
   - Reducir espaciados verticales en mobile.
   - Quitar/ocultar el indicador absoluto inferior en mobile si interfiere con el área táctil.
   - Evitar que elementos decorativos ocupen/capturen el gesto de scroll.

3. Corregir el banner de cookies como posible bloqueador:
   - En mobile dejarlo compacto y sin cubrir la zona principal de scroll.
   - Añadir `touch-action: pan-y` y mantener el scroll interno solo cuando se abren detalles.
   - Evitar que un contenedor fijo grande capture gestos fuera del banner.

4. Contener el scroll-lock global:
   - Cambiar la lógica de `Layout` para que `app-mobile-scroll-lock` solo se aplique en rutas autenticadas que realmente renderizan el shell móvil, no en páginas públicas como `/`, `/home`, `/quiz`, `/auth`, `/privacy`, etc.
   - Añadir limpieza defensiva al montar `FinancialQuiz` para remover clases stale de scroll-lock si quedaron de navegación anterior.

5. Verificación:
   - Probar `/quiz` y `/home` en viewport móvil 390x844 y 320x568.
   - Confirmar que `window.scrollY` cambia al hacer scroll, que el CTA sigue visible/tocable, y que no queda `body.app-mobile-scroll-lock` en páginas públicas.