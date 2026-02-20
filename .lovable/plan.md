
## Diagnóstico completo del problema

Hay DOS sistemas de highlight completamente desconectados entre sí:

**Sistema 1 - HighlightContext** (el configurable por el usuario):
- Guarda el color elegido (`orange`, `green`, `red`, `blue`, `purple`) en localStorage
- Aplica estilos inline directamente en el DOM con valores RGBA concretos
- Se usa cuando el asistente de chat destaca elementos específicos

**Sistema 2 - useHighlightOnArrival** (el de navegación via URL `?tab=`):
- Aplica clases CSS `highlight-tab-active` y `highlight-on-arrival`
- Esas clases usan `hsl(var(--primary))` — el color del TEMA, no el del usuario
- Por eso el recuadro sale azul-verdoso (color primario del dark theme) en lugar del naranja configurado
- Nunca lee el color de `HighlightContext`

**Problema secundario:** La animación `highlight-beacon` en el contenido es suave pero poco visible, y el recuadro del tab (`highlight-tab-active`) no es suficientemente llamativo.

## Solución: Conectar ambos sistemas + reforzar el efecto visual

### Parte 1 — Pasar el color del HighlightContext al CSS via variables CSS

En lugar de hardcodear `hsl(var(--primary))` en las clases CSS, inyectaremos una variable CSS dinámica `--highlight-arrival-color` basada en el color elegido por el usuario. Esto se hace en el `HighlightProvider` o en un nuevo efecto en `useHighlightOnArrival`.

**Mapa de colores:**
```
orange  → rgba(249, 115, 22, ...)   (naranja — default)
green   → rgba(34, 197, 94, ...)
red     → rgba(239, 68, 68, ...)
blue    → rgba(59, 130, 246, ...)
purple  → rgba(168, 85, 247, ...)
```

### Parte 2 — Reforzar el efecto visual considerablemente

El recuadro actual es demasiado sutil. Lo haremos mucho más evidente:

- **Tab button**: borde sólido de 3px del color configurado + fondo del 20% de opacidad + `box-shadow` glow exterior. Así se verá como un recuadro naranja claro e inconfundible alrededor del botón.
- **Contenido completo**: borde de 3px sólido + `box-shadow` con resplandor + fondo tintado + animación beacon más llamativa (3 pulsos en lugar de fade suave).

### Archivos a modificar

**1. `src/hooks/utils/useHighlightOnArrival.ts`**

Importar `useHighlight` del `HighlightContext` para leer el `highlightColor` y el `HIGHLIGHT_COLORS`. En el hook, cuando se activa el highlight, inyectar la variable CSS en el `document.documentElement`:

```typescript
// Al activar:
document.documentElement.style.setProperty('--highlight-arrival-color-r', 'R');
document.documentElement.style.setProperty('--highlight-arrival-color-g', 'G');
document.documentElement.style.setProperty('--highlight-arrival-color-b', 'B');

// Al limpiar:
document.documentElement.style.removeProperty('--highlight-arrival-color-r');
// etc.
```

Esto permite que el CSS use `rgba(var(--highlight-arrival-color-r), var(...g), var(...b), 0.9)` para el color exacto configurado.

**2. `src/index.css`**

Reemplazar `.highlight-tab-active` y `.highlight-on-arrival` para que usen las variables CSS dinámicas en lugar de `hsl(var(--primary))`. También reforzar visualmente ambas clases:

```css
.highlight-tab-active {
  /* Usa el color configurado por el usuario */
  outline: 3px solid rgba(var(--har), var(--hag), var(--hab), 0.95) !important;
  outline-offset: 3px;
  border-radius: 0.75rem;
  background-color: rgba(var(--har), var(--hag), var(--hab), 0.18) !important;
  box-shadow: 0 0 0 6px rgba(var(--har), var(--hag), var(--hab), 0.15),
              0 0 20px rgba(var(--har), var(--hag), var(--hab), 0.3) !important;
  animation: highlight-tab-pulse 3.5s ease-out forwards;
}

.highlight-on-arrival {
  border: 3px solid rgba(var(--har), var(--hag), var(--hab), 0.9) !important;
  border-radius: 1rem;
  background-color: rgba(var(--har), var(--hag), var(--hab), 0.07) !important;
  box-shadow: 0 0 0 4px rgba(var(--har), var(--hag), var(--hab), 0.12),
              0 0 30px rgba(var(--har), var(--hag), var(--hab), 0.25) !important;
  animation: highlight-beacon-color 3.5s ease-out forwards;
}
```

Y la keyframe beacon también la actualizaremos para usar las variables RGB.

**3. `src/components/budget/FamilyBudgetView.tsx`**

Agregar también `highlight-on-arrival` en los `TabsContent` de 'payments', 'goals' y 'tools' (actualmente solo el trigger del tab tiene `highlight-tab-active`, pero el contenido completo también debe recibir el recuadro). Verificar que los `TabsContent` pasen correctamente las props del hook.

### Resumen visual del resultado esperado

Al navegar a `/budget?tab=goals`:
- El botón "🎯 Metas" en la barra de tabs recibe un **recuadro naranja** (o el color configurado) grueso y bien visible con resplandor
- La sección completa del contenido de Metas también queda encuadrada con el mismo color
- La animación pulsa 3 veces en ~3.5 segundos y luego desaparece gradualmente
- Si el usuario cambia su color de highlight a verde, ambos efectos serán verdes

### Diagrama del flujo corregido

```text
Usuario navega a /budget?tab=goals
         │
         ▼
useHighlightOnArrival detecta ?tab=goals
         │
         ├─► Lee highlightColor de HighlightContext (ej: "orange")
         │
         ├─► Convierte a RGB: (249, 115, 22)
         │
         ├─► Inyecta en :root:
         │      --har: 249   --hag: 115   --hab: 22
         │
         ├─► Activa isHighlighted=true
         │
         ▼
FamilyBudgetView.tsx
  ├─ TabsTrigger goals: agrega clase "highlight-tab-active"
  │     └─ CSS usa rgba(249,115,22) → RECUADRO NARANJA en botón ✓
  │
  └─ TabsContent goals: agrega clase "highlight-on-arrival"
        └─ CSS usa rgba(249,115,22) → RECUADRO NARANJA en sección ✓
         │
         ▼
Después de 3.5s: limpia clases, limpia variables CSS, limpia URL
```
