

# Plan: Protección de recursos — Límites inteligentes contra uso extremo

## Problemas identificados

### 1. FIRE Calculator: loop sin límite real de datos
- `while` loop itera hasta 600 meses (50 años) — OK, pero si `targetRetirementAge - currentAge` es muy grande (ej. edad 5, retiro a 200), el `for` de `yearlyProjections` genera `yearsToTarget + 10` entradas (ej. 205 objetos con 12 iteraciones internas cada uno = 2,460 cálculos). No crashea pero satura el chart.
- Si `monthlyReturn` es negativo o zero y savings nunca alcanzan FIRE, el while loop siempre llega a 600 — OK pero genera array enorme.

### 2. `generateHistoricalPayments`: loop infinito potencial
- Si `startDate` es "1990-01-01" con frecuencia semanal, genera **1,800+ registros** de pagos históricos. No hay límite. Además cada uno se inserta en Supabase de golpe.
- Si `getNextDueDate` tiene un bug y no avanza la fecha, el `while (current < today)` se convierte en loop infinito bloqueando el browser.

### 3. BulkHistoricalImport: sin límite de filas
- El paste de CSV no tiene tope. Un usuario puede pegar 10,000 filas y el sistema intentará `INSERT` masivo en una sola transacción → timeout de Supabase (máx ~5MB payload, ~8s timeout).

### 4. Charts con rangos extremos
- Si se habilitan selectores de rango [6, 12, 24, 36, "all"], un usuario con 5 años de datos generaría 60 barras/líneas en un chart. Recharts renderiza todos los puntos en el DOM → lag significativo con 100+ puntos.

### 5. Queries sin paginación
- `useExpenses` tiene `.limit(500)`, pero `useAllExpensesForReport` usa `.limit(2000)`. Si un usuario tiene 10,000 gastos en 5 años, los reportes no los ven todos.
- `useIncome` tiene `.limit(500)` — mismo problema.

### 6. Inputs numéricos sin validación
- FIRE: `currentAge` puede ser 0 o 999, `expectedAnnualReturn` puede ser 99999%, `withdrawalRate` puede ser 0 (divide por cero en `fireNumber = annualExpenses / (withdrawalRate / 100)`).

## Plan de implementación

### Fase 1: Constantes centralizadas de límites
**Nuevo: `src/lib/constants/resource-limits.ts`**
```text
MAX_PROJECTION_YEARS = 80        // Nadie necesita proyectar más de 80 años
MAX_HISTORICAL_PAYMENTS = 500    // Backfill máx 500 pagos por bill
MAX_BULK_IMPORT_ROWS = 500       // Tope de filas en importación masiva
MAX_CHART_DATA_POINTS = 120      // 10 años mensuales
MAX_LOOP_ITERATIONS = 10000      // Safety net para loops
MAX_QUERY_ROWS_REPORT = 10000    // Para reportes completos
BATCH_INSERT_SIZE = 100          // Insertar en lotes de 100
MIN_AGE = 10, MAX_AGE = 120
MIN_RETURN_RATE = -20, MAX_RETURN_RATE = 50
MIN_WITHDRAWAL_RATE = 0.5, MAX_WITHDRAWAL_RATE = 15
```

### Fase 2: Proteger loops existentes

**`useRecurringBills.ts` → `generateHistoricalPayments`**
- Agregar `MAX_HISTORICAL_PAYMENTS` como tope del while loop
- Agregar safety check: si `getNextDueDate` no avanza la fecha, romper el loop
- Si se alcanza el máximo, retornar los generados + flag `truncated: true`

**`useFIRECalculator.ts`**
- Clampar inputs: `currentAge` entre 10-120, `targetRetirementAge` entre currentAge+1 y MAX_AGE, `withdrawalRate` mínimo 0.5
- Limitar `yearlyProjections` a `MAX_PROJECTION_YEARS` entradas
- Proteger división por zero en `withdrawalRate`

### Fase 3: Proteger bulk imports

**`BulkHistoricalImport.tsx`**
- Limitar paste a `MAX_BULK_IMPORT_ROWS` filas, mostrar warning si se trunca
- Insertar en batches de `BATCH_INSERT_SIZE` con `Promise.all` controlado (no todo de golpe)
- Mostrar barra de progreso durante la inserción

### Fase 4: Proteger charts

**Patrón para todos los charts con selector de rango:**
- Si `dataPoints > MAX_CHART_DATA_POINTS`, agregar datos usando sampling (promediar cada N meses en vez de mostrar todos)
- Para "All time" → agrupar por trimestre si hay más de 36 meses de datos, por año si hay más de 120
- Esto aplica a: `BudgetHistoryChart`, `CategoryTrendsChart`, `IncomeVsExpensesChart`, `CashFlowProjection`, `NetWorthChart`

### Fase 5: Queries escalables para reportes

**`useExpenses.ts` y `useIncome.ts`**
- Crear variantes `useAllForReport` que usen paginación automática: fetch 1000, si hay más, fetch siguiente página, concatenar hasta `MAX_QUERY_ROWS_REPORT`
- Esto solo se usa en exportación PDF/Excel, no en UI diario

### Fase 6: Input validation con UX amigable

**En formularios FIRE, bills, bulk import:**
- Validar rangos al onChange, no al submit
- Si el valor está fuera de rango, mostrar tooltip: "El máximo recomendado es X" y clampear silenciosamente
- Para fechas: `start_date` no puede ser anterior a 2000, `end_date` no puede ser más de 50 años en el futuro

## Archivos a modificar

1. **Nuevo: `src/lib/constants/resource-limits.ts`** — Constantes centralizadas
2. **`src/hooks/data/useRecurringBills.ts`** — Loop protection + batch insert
3. **`src/hooks/data/useFIRECalculator.ts`** — Input clamping + projection cap
4. **`src/components/shared/BulkHistoricalImport.tsx`** — Row limit + batch insert + progress bar
5. **`src/hooks/data/useExpenses.ts`** — Paginated report query
6. **`src/hooks/data/useIncome.ts`** — Paginated report query
7. **Charts (5 archivos)** — Data sampling cuando hay demasiados puntos

## Resultado

- Imposible bloquear el browser con loops infinitos o arrays gigantes
- Bulk imports manejan hasta 500 filas en batches con progreso visual
- Charts escalan automáticamente: pocos datos = detalle mensual, muchos datos = agrupación trimestral/anual
- Reportes pueden exportar hasta 10,000 registros sin truncar
- Inputs validados en tiempo real con mensajes amigables, sin crasheos por divide-by-zero o valores absurdos

