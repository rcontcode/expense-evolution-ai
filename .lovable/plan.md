

# Auditoría de Proyecciones: Datos, Transparencia y Completitud

## Herramientas de Proyección Identificadas (8)

| # | Componente | Datos que USA | Datos que FALTA incluir | ¿Explica cómo calcula? | ¿Indica datos faltantes? |
|---|-----------|---------------|------------------------|------------------------|--------------------------|
| 1 | **SpendingPredictor** (Banking) | Gastos + Transacciones bancarias + Presupuesto global | ❌ No incluye pagos fijos (recurring bills) | ❌ No | ❌ No |
| 2 | **CashFlowRunwayCalculator** (Banking) | Gastos 3 meses + Ingresos 3 meses + Bills activos | ✅ Completo | ❌ No | ❌ No |
| 3 | **BalanceDateLookup** (Banking) | Ingresos mes actual + Gastos mes actual + Bills activos | ❌ No incluye ahorros/inversiones existentes como balance inicial | ❌ No (solo dice "escenario") | ❌ No |
| 4 | **CashFlowProjection** (Bills) | Solo bills activos | ❌ No incluye ingresos ni gastos variables | ✅ Tiene disclaimer básico | ⚠️ Parcial (solo si < 3 bills) |
| 5 | **WhatIfSimulator** (Dashboard) | Gastos 3 meses + Ingresos + Pagos recurrentes bancarios | ❌ No incluye bills del sistema | ❌ No explica supuestos de interés compuesto | ❌ No |
| 6 | **NetWorthChart** (Net Worth) | Snapshots patrimonio + Activos/Pasivos actuales | ✅ Completo para su propósito | ✅ Excelente (collapsible con fórmula) | ✅ Sí (indica si usa datos reales o default) |
| 7 | **ExpensePredictions** (Analytics) | Gastos últimos 6 meses (solo expenses, no bank) | ❌ No incluye transacciones bancarias | ❌ No (solo dice "IA") | ⚠️ Parcial (requiere 3+ meses) |
| 8 | **MonthlyPlanData** (Budget) | Ingresos + Gastos + Bills + Presupuesto | ❌ Proyección plana (asume mismo monto cada mes) | ❌ No | ❌ No |

## Problemas Principales

### A. Datos incompletos en cálculos
1. **SpendingPredictor**: Proyecta fin de mes sin considerar pagos fijos pendientes → subestima gastos
2. **BalanceDateLookup**: Balance empieza en $0, no considera saldo real → proyección irreal
3. **ExpensePredictions**: Solo usa `expenses` manuales, ignora transacciones bancarias → datos parciales
4. **WhatIfSimulator**: Usa `bankInsights.recurringPayments` pero no `useRecurringBills()` → inconsistencia

### B. Falta transparencia (6 de 8 no explican nada)
Solo **NetWorthChart** tiene un collapsible "¿Cómo se calcula?" con fórmula, supuestos y tips. Los otros 7 no explican nada.

### C. No indican datos faltantes
Ninguna herramienta (excepto NetWorthChart parcialmente) le dice al usuario "te falta registrar X para que esta proyección sea más precisa".

## Plan de Implementación

### 1. Crear componente reutilizable `ProjectionDisclaimer`
Un componente que reciba las fuentes de datos y muestre:
- **Sección "¿Cómo se calcula?"** (collapsible): fórmula simplificada y fuentes de datos usadas
- **Sección "Datos faltantes"**: checklist visual de lo que el usuario necesita agregar
- **Badge de confiabilidad**: 🟢 Alta / 🟡 Media / 🔴 Baja según completitud de datos

```text
┌─────────────────────────────────────────┐
│ 📊 ¿Cómo se calcula?              [▼]  │
│                                         │
│ Fuentes: ✅ Gastos  ✅ Ingresos  ❌ Bills│
│                                         │
│ ⚠️ Para mejorar esta proyección:        │
│   • Agrega tus pagos fijos recurrentes  │
│   • Registra ingresos de este mes       │
│                                         │
│ Confiabilidad: 🟡 Media (2/3 fuentes)   │
└─────────────────────────────────────────┘
```

### 2. Corregir fuentes de datos en cada componente

**SpendingPredictor**: Agregar `useRecurringBills()` para incluir bills pendientes del mes en la proyección de fin de mes.

**BalanceDateLookup**: Ya no puede empezar de $0 — necesita indicar que es una proyección de *cambio neto*, no de balance absoluto. Renombrar a "Cambio neto proyectado" o aclarar en el disclaimer.

**ExpensePredictions**: Incluir transacciones bancarias no-matched en los datos históricos enviados a la IA.

**WhatIfSimulator**: Usar también `useRecurringBills()` como fuente de escenarios de cancelación (además de bankInsights).

**MonthlyPlanData**: Proyección ya funciona correctamente pero necesita disclaimer de que asume ingresos/gastos constantes.

### 3. Integrar `ProjectionDisclaimer` en cada componente

Cada herramienta tendrá el disclaimer al final con datos específicos:

| Componente | Fuentes a verificar |
|-----------|-------------------|
| SpendingPredictor | gastos, banco, bills, presupuesto |
| CashFlowRunway | gastos, ingresos, bills |
| BalanceDateLookup | ingresos, gastos, bills |
| CashFlowProjection | bills (y nota de que no incluye variables) |
| WhatIfSimulator | gastos, banco, ingresos |
| ExpensePredictions | gastos, banco |
| MonthlyPlanData | ingresos, gastos, bills, presupuesto |

## Detalle Técnico

### Nuevo componente: `src/components/projections/ProjectionDisclaimer.tsx`
- Props: `dataSources: { name, available, count?, link? }[]`, `methodology: string`, `assumptions: string[]`
- Collapsible por defecto
- Bilingüe (es/en)
- Badge de confiabilidad calculado automáticamente

### Archivos a modificar (8)
1. `src/components/projections/ProjectionDisclaimer.tsx` — **NUEVO** componente reutilizable
2. `src/components/banking/SpendingPredictor.tsx` — Agregar bills + disclaimer
3. `src/components/banking/CashFlowRunwayCalculator.tsx` — Agregar disclaimer
4. `src/components/banking/BalanceDateLookup.tsx` — Aclarar que es cambio neto + disclaimer
5. `src/components/bills/CashFlowProjection.tsx` — Reemplazar disclaimer actual por el nuevo componente
6. `src/components/dashboard/WhatIfSimulator.tsx` — Agregar bills + disclaimer
7. `src/components/analytics/ExpensePredictions.tsx` — Agregar bank data + disclaimer
8. `src/hooks/data/useMonthlyPlanData.ts` — No cambia lógica, pero el componente que lo renderiza necesita disclaimer

