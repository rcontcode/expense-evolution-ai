

# Plan: Arreglar vista previa + Mejorar calidad visual del Centro de Reportes

## Problemas encontrados

1. **Vista previa no funciona**: El iframe con `datauristring` puede ser bloqueado por políticas del navegador. Solución: renderizar el PDF con `<object>` o convertir a canvas con `pdf.js`, o bien usar un approach más simple de mostrar los datos en HTML dentro del dialog en vez de generar un PDF para preview.
2. **Caso `mileage` duplicado** en el switch de `handlePreview` (líneas 320-381 están duplicadas), el segundo nunca se ejecuta.
3. **`income_summary` no tiene preview** — falta ese case en `handlePreview`.
4. **Diseño visual plano** — las cards y stat cards necesitan más color, gradientes y estilo 3D candy consistente con el resto de la app.

## Implementación

### 1. Reemplazar preview de iframe/PDF por HTML nativo en el Dialog
En lugar de generar un PDF y mostrarlo en iframe (que falla), renderizar una tabla HTML estilizada directamente en el Dialog con los mismos datos. Más rápido, siempre funciona, y se ve mejor.

- Crear estado `previewData` con tipo y datos estructurados
- Renderizar dentro del Dialog una vista con cards coloreadas, tablas con Tailwind, badges, y totales destacados
- Eliminar toda la lógica de jsPDF en `handlePreview` — solo preparar datos
- Cubrir los 7 reportes (pnl, expenses, budget, bills, tax, income_summary, mileage)

### 2. Eliminar el case `mileage` duplicado
Quitar el bloque duplicado (líneas 351-381).

### 3. Mejorar visual de la página completa

**Stat Cards (top):**
- Fondo con gradiente de color por tipo (azul gastos, verde ingresos, morado bills, naranja reportes)
- Iconos más grandes con fondo circular
- Sombra y hover 3D candy

**Report Cards:**
- Borde lateral coloreado por tipo de reporte (verde P&L, azul gastos, etc.)
- Icono con fondo circular coloreado
- Preview badge con gradiente suave
- Botones con color de acento (PDF rojo, Excel verde, Preview azul)
- Hover con scale y shadow 3D candy

**Preview Dialog:**
- Header con color del reporte
- Tabla con filas alternadas coloreadas
- KPI cards coloreadas dentro del preview
- Botón de descarga directa desde el preview

## Archivos a modificar (1)
- `src/pages/Reports.tsx` — Todo el rediseño visual + fix de preview + eliminar duplicado

