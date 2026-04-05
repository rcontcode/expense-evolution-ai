

# Plan: Mejoras Visuales + Selector de Ventana de Tiempo

## Dos partes

### Parte 1: Mejoras visuales (plan aprobado previamente)

**FinancialNarrativeCard.tsx**:
- Barras horizontales proporcionales en cada income stream (ancho relativo al mayor ingreso)
- Mini donut chart (Recharts PieChart 60x60) para distribución de gastos fijos por categoría
- Gauge SVG semicircular para savings rate (rojo <10%, amarillo 10-20%, verde >20%)
- Barra segmentada en banca (clasificadas verde vs pendientes amarillo)
- Indicador de completitud (barra mostrando cuantas secciones tienen datos)

**DataInventoryPanel.tsx**:
- Colores semánticos por categoría: Documentos=azul, Gastos=rojo, Ingresos=verde, Contratos=púrpura, Clientes=naranja, Banco=teal, Bills=amber
- Iconos con fondo circular coloreado en vez de gris plano

### Parte 2: Selector de ventana de tiempo

**Mejor enfoque**: Un selector simple de periodo en el header del Panorama Financiero. Opciones predefinidas (no calendario libre, que seria confuso para promedios):

- **1 mes** — solo el mes actual
- **3 meses** — default actual, promedios de 3 meses
- **6 meses** — vista más amplia
- **12 meses** — todo el año
- **Todo** — todos los datos disponibles

Se implementa como un `Select` compacto junto al titulo. El valor seleccionado se pasa a `useFinancialNarrative(months)` que ajusta el filtro de fechas `threeMonthsAgo` al periodo elegido. Los labels del componente se actualizan: "Basado en los últimos X meses".

**Impacto en datos**: El hook ya filtra por `threeMonthsAgo`. Solo hay que parametrizarlo:

```text
useFinancialNarrative(months: number)
  → threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - months, 1)
  → divisor para promedios = months en vez de hardcoded 3
```

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/dashboard/FinancialNarrativeCard.tsx` | Barras de ingreso, donut de gastos, gauge SVG, barra banca, completitud, selector de periodo |
| `src/hooks/data/useFinancialNarrative.ts` | Parametrizar `months`, ajustar divisor de promedios |
| `src/components/dashboard/DataInventoryPanel.tsx` | Colores semánticos e iconos con fondo circular |

## Detalle tecnico

**Selector de periodo**: Estado local `periodMonths` en FinancialNarrativeCard, default 3. Select compacto (h-7 text-xs) a la derecha del titulo. Se pasa como argumento al hook.

**Income bars**: CSS puro, `width` proporcional a `max(incomeStreams.amount)`. Color `bg-primary/60`.

**Expense donut**: Recharts `PieChart` con `Pie` sin labels, solo 60x60px. Top 5 categorias con colores fijos. Ya hay Recharts en el proyecto.

**Savings gauge**: SVG con `circle` + `stroke-dasharray`. Semicirculo de 80x50px con texto central. Colores: `hsl(var(--primary))` verde, `hsl(var(--destructive))` rojo, amber intermedio.

**DataInventory colors**: Mapa estatico `CATEGORY_COLORS` con `bg`, `text`, `icon` por categoria. Aplicar al icono wrapper con `rounded-full p-1.5`.

