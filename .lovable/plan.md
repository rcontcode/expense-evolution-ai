

# Proyección Flexible con Navegación Temporal + Disclaimer de Datos

## Problema actual
1. La pestaña Proyección siempre empieza desde "ahora" y muestra 6 meses fijos — no se puede navegar
2. El `MonthNavigator` se oculta explícitamente para la vista de proyección (`view !== 'projection'`)
3. No hay ningún disclaimer sobre calidad/completitud de datos

## Solución

### 1. Hacer la Proyección navegable
- Mostrar el `MonthNavigator` también en la vista de proyección
- Pasar `selectedMonth` a `CashFlowProjection` como punto de inicio
- La proyección mostrará 6 meses **a partir del mes seleccionado** (no desde "ahora")
- Agregar selector de rango: 3, 6, 12 meses

### 2. Agregar disclaimer de calidad de datos
- Banner informativo debajo del gráfico:
  - ES: "📊 Esta proyección se basa en tus pagos fijos activos. Su precisión depende de la completitud y actualización de tus datos."
  - EN: "📊 This projection is based on your active recurring bills. Its accuracy depends on the completeness and freshness of your data."
- Si hay pocos bills (< 3), mostrar variante más visible: "Agrega más pagos fijos para una proyección más precisa"

### 3. Cambios en BillsDashboard
- Remover la condición `view !== 'projection'` del MonthNavigator — mostrarlo siempre
- Pasar `selectedMonth` a `<CashFlowProjection selectedMonth={selectedMonth} />`

## Archivos a modificar
1. `src/components/bills/CashFlowProjection.tsx` — Aceptar `selectedMonth` prop, selector de rango (3/6/12), disclaimer de datos
2. `src/components/bills/BillsDashboard.tsx` — Mostrar MonthNavigator en todas las vistas, pasar prop a CashFlowProjection

