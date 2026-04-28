# Arreglar tabs de Budget en móvil y tablet

## Problema
En `src/components/budget/FamilyBudgetView.tsx` (líneas 294–320), los 6 tabs (Resumen, Gastos, Ritmo, Pagos, Metas, Herram.) usan `sr-only sm:not-sr-only` con `flex items-center gap-1`, lo que produce:

- **Móvil (<640px)**: las etiquetas se ocultan completamente. Solo se ven los emojis sin texto, así que el usuario no sabe para qué sirve cada uno.
- **Tablet (640–1024px)**: las etiquetas aparecen al lado del emoji en una sola fila de 6 columnas. El espacio es muy estrecho, los textos se cortan o se aprietan, y se ve "horrible" como reporta el usuario.

## Solución
Cambiar el layout de los `TabsTrigger` para que **siempre muestre la etiqueta debajo del emoji** (en lugar de ocultarla o ponerla al lado), con tipografía adaptativa por breakpoint.

### Cambios en `src/components/budget/FamilyBudgetView.tsx` (líneas 294–320)

1. `TabsList`: mantener `grid grid-cols-6` pero ajustar gap/padding para que respire mejor en tablet (`gap-0.5 sm:gap-1 p-1`).
2. Cada `TabsTrigger`:
   - Cambiar `flex items-center gap-1` → `flex flex-col items-center justify-center gap-0.5`.
   - Reducir tamaño del emoji en móvil para dejar espacio al texto: `text-lg sm:text-xl`.
   - Quitar `sr-only sm:not-sr-only` y usar texto siempre visible con tamaño responsive: `text-[9px] sm:text-[11px] leading-tight`.
   - Padding vertical menor en móvil: `py-1.5 sm:py-2`.
   - Para "Pagos" mover el badge de conteo a posición absoluta superior derecha (`absolute -top-1 -right-1`) para que no rompa el layout vertical, y añadir `relative` al trigger.
3. Etiquetas cortas para que quepan bien en móvil:
   - ES: Resumen, Gastos, Ritmo, Pagos, Metas, Herram.
   - EN: Overview→"Resumen" usa "Overview" (cabe), pero acortar a "Pace", "Goals", "Tools" (ya están). Mantener mapeo actual.
4. Preservar todos los `data-[state=active]` (colores activos), `shouldHighlight`, `cn` y animaciones existentes.

## Resultado esperado
- **Móvil**: cada tab muestra emoji arriba + etiqueta corta abajo (legible, ~9px).
- **Tablet**: igual layout vertical pero con etiqueta a 11px, sin texto cortado.
- **Desktop**: sin cambios visuales relevantes (ya cabía bien).
- Badge de conteo de "Pagos" flotante para no romper la estructura.
