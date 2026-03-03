

## Plan: Highlight de Sección al Navegar desde Submenús

### Problema Actual
Los submenús navegan correctamente (hash links y query params funcionan), pero **no se resalta visualmente** la sección destino al llegar. El efecto `highlight-on-arrival` solo se activa con query params (`?tab=X`), no con hash fragments (`#timeline`, `#predictions`, etc.).

### Cambios

#### 1. Layout.tsx — Aplicar highlight al navegar con hash
En los 3 onClick handlers (mobile, desktop expandido, tooltip colapsado), después de hacer `scrollIntoView`, añadir la clase `highlight-on-arrival` al elemento destino y removerla tras 8 segundos:

```typescript
// Después del scrollIntoView existente:
setTimeout(() => {
  const el = document.getElementById(hash);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('highlight-on-arrival');
    setTimeout(() => el.classList.remove('highlight-on-arrival'), 8000);
  }
}, 300); // Aumentar delay para asegurar que la página cargó
```

Inyectar las variables CSS de color (`--har`, `--hag`, `--hab`) basándose en el `highlightColor` del `HighlightContext` al montar el Layout.

#### 2. Layout.tsx — Aplicar highlight al navegar con query params
Para paths como `/dashboard?area=familia&atab=budget` y `/mentorship?tab=library`, los handlers usan `window.location.href` o `navigate()`. Añadir lógica similar: tras navegar, esperar a que la página cargue y aplicar highlight al tab/sección activa.

#### 3. useHighlightOnArrival.ts — Aumentar duración default a 8000ms
Cambiar `duration = 5000` → `duration = 8000` para que el efecto dure 8 segundos.

#### 4. index.css — Asegurar que stability-mode no bloquee el highlight
La regla `.stability-mode * { animation: none !important }` mata el efecto pulsante. Añadir excepción:
```css
.stability-mode .highlight-on-arrival {
  animation: highlight-beacon-color 1.1s ease-in-out infinite !important;
}
```

### Archivos a modificar
- `src/components/Layout.tsx` — 3 onClick handlers + import HighlightContext + inyectar CSS vars
- `src/hooks/utils/useHighlightOnArrival.ts` — duration default 5000 → 8000
- `src/index.css` — excepción stability-mode para highlight

### Resultado
Al hacer click en cualquier submenú del sidebar, el usuario navega a la sección y ve un recuadro pulsante del color configurado (naranja por defecto) durante 8 segundos.

