
# Auditoria Completa de Graficas: Problemas y Plan de Mejora

## Resumen Ejecutivo

Se auditaron **20 componentes de graficas** en la aplicacion. Se encontraron **7 problemas criticos** de datos, **5 problemas de claridad visual** y **4 inconsistencias** entre componentes.

---

## PROBLEMAS CRITICOS DE DATOS

### 1. BudgetProjectionChart - Presupuesto hardcodeado, no usa datos reales
**Archivo**: `src/components/analytics/BudgetProjectionChart.tsx`
- El slider de presupuesto tiene `min={1000}` y `max={20000}` hardcodeados en dolares, sin respetar la moneda del usuario
- El presupuesto inicial se calcula como `avgMonthlyIncome * 0.7` pero NO consulta el `global_monthly_budget` de `useUserSettings`, que es donde el usuario ya configuro su presupuesto real
- Los formateadores de eje Y usan `$` hardcodeado (`$${(value/1000).toFixed(0)}k`) en lugar del hook `useFormatCurrency`
- **Correccion**: Usar `global_monthly_budget` como valor default del slider, y formatear con el hook de moneda

### 2. CashFlowProjection - Proyeccion a 12 meses con base fragil
**Archivo**: `src/components/analytics/CashFlowProjection.tsx`  
- Proyecta 12 meses al futuro pero la formula de proyeccion mezcla el promedio historico con el 30% del ingreso recurrente de forma arbitraria (linea 167: `avgIncome + (baseRecurringIncome * 0.3)`)
- El ejeY usa `$` hardcodeado en tickFormatter en vez del hook de moneda
- El tooltip muestra cantidades con `formatCompact` pero los insight cards tambien usan formatos inconsistentes
- **Correccion**: Usar formula mas transparente (promedio ponderado reciente), y estandarizar formateadores

### 3. ExpensePredictions - Tooltip generico y confuso
**Archivo**: `src/components/analytics/ExpensePredictions.tsx`
- El tooltip usa `formatter={(value: number) => [$${value?.toFixed(2) || '0'}, '']}` -- formatea con `$` hardcodeado y 2 decimales exactos, ignorando la moneda del usuario
- Las cards de resumen tambien usan `$${value.toFixed(2)}` directamente (lineas 365, 381-385)
- **Correccion**: Usar `useFormatCurrency` hook consistentemente

### 4. SeasonalityChart - Tooltip con formato crudo
**Archivo**: `src/components/analytics/SeasonalityChart.tsx`
- El tooltip usa `formatter={(value: number) => [$${value.toFixed(2)}, '']}` -- `$` hardcodeado
- La prediccion del proximo mes usa `~$${insights.nextMonthPrediction.toFixed(0)}` -- hardcodeado
- Los badges de meses altos usan `${m.avg.toFixed(0)}` -- hardcodeado
- **Correccion**: Usar `useFormatCurrency` en todos los formateadores

### 5. DashboardCharts - Grafico de pie sin etiquetas utiles
**Archivo**: `src/components/dashboard/DashboardCharts.tsx`
- El PieChart de categorias tiene `label` como prop pero muestra solo numeros crudos sin contexto (sin nombre de categoria, sin porcentaje)
- El BarChart de clientes no tiene formateador de moneda en el eje Y
- El LineChart de tendencias tampoco formatea los ejes
- Es el unico componente que usa `ChartContainer` de shadcn en vez de `ResponsiveContainer` de Recharts, creando inconsistencia visual
- **Correccion**: Agregar labels con porcentaje al pie, formatear ejes con moneda, y estandarizar el contenedor

### 6. MonthComparisonChart (budget/family) - No filtra por entidad
**Archivo**: `src/components/budget/family/MonthComparisonChart.tsx`
- Usa `useExpenses` y `useIncome` SIN filtrar por `entityId` del BudgetEntityContext
- En modo "Separado por entidad", este grafico siempre muestra TODOS los datos de todas las entidades, lo cual es incorrecto
- **Correccion**: Importar `useBudgetEntity` y pasar el entityId a los hooks

### 7. NetWorthTreemap - Funcion `formatCompact` local no respeta moneda
**Archivo**: `src/components/analytics/NetWorthTreemap.tsx`
- Tiene una funcion `formatCompact` propia (linea 42-46) que usa `$` hardcodeado
- Tambien importa `useFormatCurrency` pero la funcion local compite y genera inconsistencia
- **Correccion**: Eliminar la funcion local y usar solo el hook

---

## PROBLEMAS DE CLARIDAD VISUAL

### 8. BudgetVsActualChart - Etiquetas truncadas sin contexto
**Archivo**: `src/components/budget/family/BudgetVsActualChart.tsx`
- Las etiquetas del eje Y se truncan a 10 caracteres (`c.label.slice(0, 10) + "..."`) pero los iconos de categoria no se muestran en el eje
- El eje X formatea con `$` hardcodeado
- Las barras de "budget" son gris apatico (`hsl(var(--muted))`) y se confunden con el fondo en tema oscuro
- **Correccion**: Mostrar emoji + etiqueta corta, usar hook de moneda, y hacer la barra de presupuesto mas visible (outline o patron rayado)

### 9. CumulativeSpendingChart - Linea ideal se pierde visualmente
**Archivo**: `src/components/budget/family/CumulativeSpendingChart.tsx`
- La linea "Ideal" es `strokeDasharray="4 4"` con `strokeWidth={1.5}` en color `muted-foreground` -- muy sutil, casi invisible
- El eje Y usa `$` hardcodeado
- El `connectNulls={false}` corta la linea de gasto real innecesariamente si hay un dia sin datos
- **Correccion**: Hacer la linea ideal mas gruesa (2px), con color mas distintivo (azul claro), y usar `connectNulls={true}` en la linea de gasto

### 10. SpendingDonut - Sin leyenda de categorias
**Archivo**: `src/components/budget/family/SpendingDonut.tsx`
- Muestra un donut con 8 colores pero NO tiene leyenda que identifique que color es que categoria
- El usuario tiene que hacer hover/tap en cada segmento para saber que es
- **Correccion**: Agregar leyenda compacta debajo del donut con emoji + nombre + porcentaje

### 11. HealthGauge - No explica como se calcula el score
**Archivo**: `src/components/budget/family/HealthGauge.tsx`
- Muestra un numero de 0-100 con un emoji pero no explica que significa ni como mejorarlo
- Solo muestra "Ahorro: X%" y "Ritmo: X%" sin contexto de que valores son buenos
- **Correccion**: Agregar etiqueta descriptiva bajo el score (ej: "Excelente", "Necesita atencion") y un tooltip con desglose

### 12. CashFlowSankey - No funciona bien en movil
**Archivo**: `src/components/analytics/CashFlowSankey.tsx`
- El layout de 3 columnas (`w-1/3` cada una) colapsa en movil haciendo imposible leer las etiquetas
- Los nodos de flujo usan `min-height` calculado que puede crear alturas exageradas
- **Correccion**: Cambiar a layout vertical en movil (stack), y limitar altura maxima de nodos

---

## INCONSISTENCIAS ENTRE GRAFICAS

### 13. Formateador de moneda - 4 patrones diferentes
Los componentes usan 4 formas distintas de formatear moneda:
- `useFormatCurrency().formatCurrency` (correcto)
- `useFormatCurrency().formatCompact` (correcto para ejes)
- `$${value.toFixed(2)}` hardcodeado (INCORRECTO - 6 archivos)
- `formatCompact` funcion local (INCORRECTO - 1 archivo)
- **Correccion**: Estandarizar TODOS a usar el hook

### 14. Colores de Ingreso vs Gasto - 3 esquemas diferentes
- `IncomeVsExpensesChart`: Verde (#22c55e) y Rojo (#ef4444) directos
- `MonthComparisonChart`: `hsl(var(--chart-2))` y `hsl(var(--chart-1))` (variables CSS)
- `YearTimelineChart`: `bg-success` y `bg-destructive` (clases Tailwind)
- **Correccion**: Estandarizar a variables CSS semanticas (`--chart-income`, `--chart-expense`)

### 15. Tooltips - Inconsistencia visual
- Algunos tooltips usan `bg-popover border-border rounded-lg` (la mayoria)
- `SeasonalityChart` y `ExpensePredictions` usan `backgroundColor: 'hsl(var(--background))'` inline
- `DashboardCharts` usa `<ChartTooltipContent />` de shadcn (diferente completamente)
- **Correccion**: Crear un componente `<StandardChartTooltip>` reutilizable

### 16. Leyendas - Presentes en unos, ausentes en otros
- `BudgetVsActualChart`: Leyenda manual abajo (bueno)
- `SpendingDonut`: SIN leyenda (malo)
- `DashboardCharts PieChart`: SIN leyenda (malo)
- `YearTimelineChart`: Leyenda diferente para movil/desktop (bueno)
- **Correccion**: Asegurar que toda grafica tenga leyenda visible

---

## PLAN DE IMPLEMENTACION

### Fase 1: Corregir datos criticos (archivos 6)
1. **BudgetProjectionChart.tsx**: Usar `global_monthly_budget` real, reemplazar `$` hardcodeado
2. **ExpensePredictions.tsx**: Reemplazar todos los `$${value.toFixed(2)}` con `useFormatCurrency`
3. **SeasonalityChart.tsx**: Reemplazar `$` hardcodeado en tooltip y badges
4. **MonthComparisonChart.tsx** (family): Agregar filtro de `entityId` del BudgetEntityContext
5. **NetWorthTreemap.tsx**: Eliminar `formatCompact` local, usar hook
6. **CashFlowProjection.tsx**: Estandarizar formateadores de moneda

### Fase 2: Mejorar claridad visual (archivos 5)
7. **SpendingDonut.tsx**: Agregar leyenda compacta con emoji + nombre + porcentaje
8. **BudgetVsActualChart.tsx**: Mejorar barra de presupuesto (mas visible), formatear eje
9. **CumulativeSpendingChart.tsx**: Hacer linea ideal mas visible, usar hook moneda
10. **HealthGauge.tsx**: Agregar etiqueta descriptiva del nivel y tooltip de desglose
11. **DashboardCharts.tsx**: Agregar labels al pie chart, formatear ejes

### Fase 3: Estandarizar (archivos 4)
12. Crear componente `StandardChartTooltip` reutilizable
13. Definir variables CSS `--chart-income` y `--chart-expense` en `index.css`
14. **CashFlowSankey.tsx**: Layout responsive vertical en movil
15. Migrar tooltips inconsistentes al componente estandar

**Total: 15 archivos a modificar, 1 componente nuevo, 2 variables CSS nuevas.**
