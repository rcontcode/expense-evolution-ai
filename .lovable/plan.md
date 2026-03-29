

# Auditoría Ronda 6 — Flujo de Datos, Consistencia de Cálculos y Sincronización

## Hallazgos Críticos

---

### 🔴 CRÍTICO — `useExpenses` y `useAllExpensesForReport` sin `user_id` filter

**`useExpenses`** (línea 14-25): La query principal NO tiene `.eq('user_id', user.id)`. Depende 100% de RLS. Esto viola el estándar de "defensa en profundidad" que ya aplicamos en todas las demás entidades (income, clients, bills, mileage, etc.).

**`useAllExpensesForReport`** (línea 278-306): Mismo problema — sin `user_id` filter.

**Impacto**: Es la tabla MÁS consultada del sistema (~83 archivos la usan). Si RLS falla o se reconfigura, se exponen TODOS los gastos de todos los usuarios.

**Fix**: Agregar `.eq('user_id', user.id)` a ambos hooks, igual que se hizo con income, clients, etc.

---

### 🔴 CRÍTICO — `useIncome` sin `user_id` filter

**`useIncome`** (línea 19-63): La query principal tampoco tiene `.eq('user_id', user.id)`. Ya se identificó `useIncomeSummary` con el mismo problema (línea 200-206).

**Fix**: Agregar `.eq('user_id', user.id)` a `useIncome` y confirmar que `useIncomeSummary` lo tiene (actualmente NO lo tiene).

---

### 🟠 Dashboard Income NO filtra por entidad fiscal

**`useDashboardStats`** (línea 91-98): La query de ingreso mensual aplica `user_id` y `deleted_at`, pero **NO aplica `entityFilter`**. Todas las queries de gastos SÍ filtran por entidad. Esto genera:
- En modo multi-entidad, el dashboard muestra ingresos de TODAS las entidades pero gastos de UNA sola
- La tasa de ahorro (`savingsRate`) se calcula con datos incompatibles (ingresos globales vs gastos filtrados)
- Todas las métricas derivadas (savings rate, monthly trends) quedan desalineadas

**Fix**: Aplicar `entityFilter` a la query de income en `useDashboardStats`, igual que se hace con expenses.

---

### 🟠 `useIncomeSummary` sin filtro de entidad

`useIncomeSummary` es usado por `NetCashFlowCard`, `BillsSummaryCards`, y `BillSmartInsights` para calcular ratios de ingreso vs compromisos fijos. Pero no acepta `entityId` como parámetro. En modo multi-entidad, estos componentes mezclan ingresos globales con bills de una entidad específica.

**Fix**: Agregar parámetro `entityId` opcional a `useIncomeSummary`.

---

### 🟡 `useExpenses` no incluye `user_id` en el `queryKey`

El `queryKey` es `['expenses', filters]` — sin `user_id`. Si dos usuarios usaran el mismo navegador (improbable pero posible), React Query devolvería datos cacheados del usuario anterior.

**Fix**: Agregar `user_id` al queryKey: `['expenses', user?.id, filters]`.

---

### 🟡 Bills CashFlowProjection no incluye ingresos

`CashFlowProjection` en `/bills` solo muestra costos fijos proyectados pero NO incluye ingresos en la proyección. El usuario ve cuánto va a gastar pero no cuánto va a ingresar, perdiendo contexto del balance. `NetCashFlowCard` SÍ cruza ambos datos correctamente.

**Impacto bajo**: No es un error de datos sino de completitud visual. No corregir ahora.

---

### 🟡 `useMonthlyPlanData` — `now` en el array de dependencias de `useMemo`

Línea 343: `now` es una referencia a `new Date()` que cambia en cada render, causando que el `useMemo` se recalcule en cada render (anula completamente la memoización).

**Fix**: Reemplazar `now` en las dependencias con valores estables (`daysPassed`, `daysRemaining`, ya presentes).

---

## Plan de Implementación

### Paso 1: Agregar `user_id` filter a `useExpenses` y `useAllExpensesForReport`
- Obtener `user` de `useAuth()` en ambos hooks
- Agregar `.eq('user_id', user!.id)` a las queries
- Agregar `user?.id` al `queryKey`
- Agregar `enabled: !!user` a `useExpenses` (ya presente en `useAllExpensesForReport` implícitamente)

### Paso 2: Agregar `user_id` filter a `useIncome` y `useIncomeSummary`
- `useIncome` ya tiene `user` de `useAuth()` pero NO lo usa en la query — agregar `.eq('user_id', user!.id)`
- `useIncomeSummary` ya tiene `user` — agregar `.eq('user_id', user!.id)`

### Paso 3: Alinear dashboard income con entity filter
- En `useDashboardStats`, aplicar `entityFilter` a la query de income (línea 91-98)

### Paso 4: Fix `useMonthlyPlanData` useMemo dependencies
- Remover `now` del array de dependencias (ya cubierto por `daysPassed`, `daysRemaining`, `monthStart`, `monthEnd`)

---

## Archivos a modificar

1. `src/hooks/data/useExpenses.ts` — user_id filter + queryKey fix
2. `src/hooks/data/useIncome.ts` — user_id filter en `useIncome` y `useIncomeSummary`
3. `src/hooks/data/useDashboardStats.ts` — entity filter en income query
4. `src/hooks/data/useMonthlyPlanData.ts` — fix useMemo dependencies

