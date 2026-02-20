
## Diagnóstico: El flash del cohete al navegar a "Metas de Ahorro"

### ¿Qué está pasando exactamente?

El flujo completo cuando haces clic en "Metas de Ahorro" desde el dashboard:

1. El link navega a `/budget?tab=goals`
2. La página `Budget.tsx` carga y renderiza `FamilyBudgetView`
3. `FamilyBudgetView` lee el `tab` de la URL para inicializar el estado de la pestaña activa
4. El hook `useHighlightOnArrival` detecta el parámetro `?tab=goals` y activa la animación `highlight-beacon` en el contenedor de la pestaña "Metas"
5. El tab "goals" tiene una animación `highlight-tab-pulse` en el botón de la pestaña

**El "cohete" que ves** es la animación `highlight-tab-pulse` que escala el emoji 🎯 del tab "Metas" ligeramente hacia arriba, lo que por un instante hace que se vea como un pequeño "lanzamiento". Es el efecto de `scale(1.05)` en la keyframe a los 15%.

### ¿Está bien o está mal?

**El sistema está funcionando como fue diseñado**, pero tiene un problema de experiencia de usuario: la animación es tan sutil y rápida que el usuario la percibe como un "bug" o "flash" en lugar de una confirmación visual útil.

La causa raíz es que **la animación `highlight-tab-pulse` en el botón de la pestaña no es lo suficientemente obvia** para comunicar su intención. El usuario ve:
- Un pequeño "brinco" del emoji 🎯 (parece un cohete moviéndose)
- Un destello de sombra alrededor del tab
- Todo en menos de 2 segundos

Lo mismo ocurre con otras pestañas que usan este sistema (pagos, herramientas, etc.) — cualquiera que se navegue con `?tab=X` tiene este comportamiento.

### Plan de corrección

El problema tiene dos partes:

**Parte 1 — Mejorar la animación para que sea obvia y útil:**
En `src/index.css`, modificar `highlight-tab-pulse` para que la animación sea más lenta, clara y reconocible como "destacado intencional" en lugar de parecer un glitch. En lugar de escalar el tab completo (que hace el efecto "cohete"), usaremos solo un brillo/glow suave alrededor del tab sin moverlo.

```css
/* ANTES — causa el efecto "cohete" */
@keyframes highlight-tab-pulse {
  15% { transform: scale(1.05); ... }
  45% { transform: scale(1.03); ... }
}

/* DESPUÉS — glow suave sin movimiento */
@keyframes highlight-tab-pulse {
  0%   { box-shadow: 0 0 0 0 hsl(var(--primary)/0.5); }
  40%  { box-shadow: 0 0 0 6px hsl(var(--primary)/0.3); }
  100% { box-shadow: 0 0 0 0 transparent; }
}
```

**Parte 2 — Agregar un pequeño indicador visual más claro:**
En `src/components/budget/FamilyBudgetView.tsx`, cuando el tab está destacado (`shouldHighlight('goals')`), agregar un pequeño punto pulsante debajo del tab para que el usuario entienda intuitivamente que "esa es la sección a la que llegó".

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/index.css` | Reemplazar la keyframe `highlight-tab-pulse` para eliminar el `scale()` que causa el efecto "cohete" |
| `src/components/budget/FamilyBudgetView.tsx` | Agregar un pequeño dot indicador bajo cada tab destacado para hacer el efecto más obvio e intencional |

### Resumen

- El comportamiento **NO es un bug** — es una feature de "navegación con llegada destacada"
- Pero la animación actual **parece un bug** porque usa `scale()` que mueve el elemento visualmente (el "cohete")
- La solución es **reemplazar el scale por un glow/resplandor suave** que sea claramente intencional y no parezca un error
