## Fixes móviles del Dashboard Simple

Dos bugs visibles en la captura:

### 1. Botones "Gastos / Ingresos" se cortan a la derecha (header de "Movimientos recientes")

En `src/components/dashboard/SimpleDashboard.tsx` líneas 596–620, el header pone el título y dos botones en una sola fila (`flex justify-between`). En pantallas estrechas (≈375px) los botones se desbordan.

**Fix**: hacer que el header se apile en móvil (`flex-col sm:flex-row sm:items-center`) y que los botones queden en su propia fila debajo del título. Resultado: nada se corta y queda más legible.

### 2. Footer ("Cambiar a Avanzado", "Ver guía…") se solapa con la barra de navegación inferior

El contenedor raíz (línea 272) usa `pb-8` (32px), insuficiente para librar la `MobileBottomNav` (≈64px + safe-area).

**Fix**: aumentar a `pb-28 lg:pb-8` (112px en móvil, 32px en desktop) y añadir `overflow-x-hidden` al wrapper para prevenir cualquier scroll horizontal residual.

## Archivo a editar

- `src/components/dashboard/SimpleDashboard.tsx` (2 líneas: wrapper raíz línea 272, y header de "Movimientos recientes" líneas 596–620).

## Fuera de alcance

- No tocar lógica de datos.
- No tocar desktop (queda igual).
