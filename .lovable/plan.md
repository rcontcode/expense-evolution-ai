

## Plan: Vista Familiar Completa - Mismas herramientas, interfaz simple

### Problema Actual
La `FamilyBudgetView` es una version recortada que:
- NO permite agregar pagos fijos (bills) - el boton no hace nada
- NO tiene graficos de proyecciones
- NO tiene alertas inteligentes
- NO tiene gestion de presupuestos por categoria
- NO tiene analisis de banco ni deteccion de suscripciones
- Es basicamente un resumen estatico sin funcionalidad real

### Solucion: Reutilizar los componentes existentes dentro de la interfaz familiar

En lugar de crear todo desde cero, la vista familiar va a **integrar los mismos componentes potentes** que ya existen (MonthlyPlanCard, CategoryBudgetsCard, BudgetAlertsCard, BillFormDialog, SubscriptionTracker, proyecciones) pero envueltos en la interfaz amigable con emojis y secciones colapsables.

### Cambios Concretos

#### 1. `FamilyBudgetView.tsx` - Reconstruccion completa

Secciones colapsables con toda la funcionalidad:

| Seccion | Emoji | Componentes que integra |
|---------|-------|------------------------|
| Resumen del Mes | 📊 | Health score, KPIs, ritmo de gasto (mantener lo actual) |
| Pagos Fijos | 🏦 | Lista de bills + **boton que abre BillFormDialog** directamente |
| Gastos por Categoria | 🛒 | CategoryBudgetsCard simplificado (barras de progreso + edicion de limites inline) |
| Alertas | 🔔 | BudgetAlertsCard (reutilizado directamente) |
| Proyecciones | 🔮 | BudgetProjectionChart + CashFlowProjection (los mismos graficos de Recharts) |
| Suscripciones | 🔄 | SubscriptionTracker (reutilizado) |
| Analisis Bancario | 🏧 | Link/boton para ir a Banking con contexto, o integrar el mini-resumen |
| Negocio (solo Unified) | 💼 | Resumen de gastos con entity_id (mantener lo actual) |

#### 2. Integracion del `BillFormDialog` existente

- El boton "Agregar Pago" en la seccion de Pagos Fijos abrira directamente el `BillFormDialog` que ya existe y funciona perfecto
- Se importa el componente y se maneja con estado local (`showBillDialog`)
- Se conecta con `useRecurringBills` y sus mutaciones de crear/editar

#### 3. Integracion de componentes de analisis

- Los graficos de proyeccion (`BudgetProjectionChart`, `CashFlowProjection`) se cargan con lazy loading dentro de secciones colapsables
- `CategoryBudgetsCard` se muestra en una seccion colapsable para editar limites por categoria
- `SubscriptionTracker` se integra como seccion para detectar cobros recurrentes

#### 4. Acciones rapidas mejoradas

La barra inferior de acciones se expande:
- Agregar Gasto (FamilyExpenseDialog - ya existe)
- Agregar Ingreso (FamilyIncomeDialog - ya existe)  
- Agregar Pago Fijo (BillFormDialog - ya existe, solo se importa)
- Subir Boleta/Extracto (link a /mobile-capture o /banking)

### Detalle Tecnico

**Archivos a modificar:**
- `src/components/budget/FamilyBudgetView.tsx` - Reconstruccion completa integrando componentes existentes

**Archivos que se REUTILIZAN sin cambios:**
- `src/components/bills/BillFormDialog.tsx` - Se importa directamente
- `src/components/dashboard/BudgetAlertsCard.tsx` - Se usa como esta
- `src/components/dashboard/CategoryBudgetsCard.tsx` - Se usa como esta
- `src/components/analytics/BudgetProjectionChart.tsx` - Lazy loaded
- `src/components/analytics/CashFlowProjection.tsx` - Lazy loaded
- `src/components/subscriptions/SubscriptionTracker.tsx` - Se integra
- `src/components/budget/FamilyExpenseDialog.tsx` - Se mantiene
- `src/components/budget/FamilyIncomeDialog.tsx` - Se mantiene

**Principio clave:** No recrear funcionalidad. Reutilizar componentes existentes envueltos en la UI familiar con emojis y secciones colapsables. Asi la vista familiar tiene EXACTAMENTE las mismas capacidades que la empresarial, solo que presentadas de forma mas amigable y organizada.

