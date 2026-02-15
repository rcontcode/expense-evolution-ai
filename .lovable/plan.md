

# Auditoria de Herramientas Avanzadas: Problemas y Mejoras

## Problemas Encontrados

### 1. Estados Vacios Sin Mensaje Util (CRITICO)
Los siguientes componentes muestran contenido vacio o con valores "0.0%" / "$0" sin ningun mensaje guia cuando el usuario no tiene datos, lo cual es confuso:

| Componente | Problema |
|-----------|----------|
| **CashflowQuadrantCard** | Muestra 4 cuadrantes con $0 y 0.0% sin ningun aviso de que falta agregar ingresos |
| **FinancialFreedomCard** | Muestra "0.0% hacia la libertad financiera" sin indicar que hacer |
| **DebtClassificationCard** | Muestra barra 0%/100% vacia sin aviso de que no hay deudas registradas |
| **TaxSummaryCards** | Muestra $0.00 en las 3 tarjetas sin indicar que faltan gastos |
| **DashboardCharts** (clientBreakdown vacio en DiaDia) | Se pasa clientBreakdown como array vacio `[]` intencionalmente, mostrando solo "No hay datos" |

### 2. Moneda Hardcodeada (BUG)
- **PayYourselfFirstCard** (linea 52-57): Usa `currency: 'CAD'` hardcodeado en vez del hook `useFormatCurrency`. Esto rompe la experiencia para usuarios chilenos.
- **TaxSummaryCards** (multiples lineas): Usa `$` hardcodeado con `.toFixed(2)` en vez del hook de formato. No respeta CLP ni otros formatos.
- **BudgetAlertsCard** (lineas 157-159): Usa `$` hardcodeado con `.toFixed(2)`.
- **GlobalBudgetCard** (lineas 224-228): Usa `$` hardcodeado.
- **CategoryBudgetsCard** (linea 329): Usa `$` hardcodeado.

### 3. Texto Solo en Espanol (sin bilingue)
- **FIRECalculatorCard**: Todo el contenido esta solo en espanol ("Libertad Financiera", "Calculadora", "anos", etc.) sin usar el sistema de idiomas.

### 4. DashboardCharts: Datos Incorrectos en DiaDia
- En `DiaDiaAreaContent`, se pasa `clientBreakdown={[]}` (vacio forzado). Esto hace que el grafico de "Gastos por Cliente" siempre muestre "No hay datos" en esa area. Deberia ocultarse o mostrar otro grafico mas relevante.

## Plan de Mejoras

### Fase 1: Estados Vacios Informativos
Agregar estados vacios con mensaje + accion en cada componente que actualmente muestra datos en blanco:

- **CashflowQuadrantCard**: Cuando `totalIncome === 0`, mostrar un estado vacio con icono, mensaje "Registra ingresos para ver tu posicion en el cuadrante" y boton hacia /income
- **FinancialFreedomCard**: Cuando `monthlyExpenses === 0 && passiveIncomeMonthly === 0`, mostrar estado vacio con "Agrega gastos e ingresos para calcular tu porcentaje de libertad" y boton hacia /expenses
- **DebtClassificationCard**: Cuando `totalDebt === 0`, mostrar estado vacio con "No tienes deudas registradas. Agrega pasivos en Patrimonio" y boton hacia /net-worth
- **TaxSummaryCards**: Cuando `taxSummary.totalExpenses === 0`, mostrar un banner informativo en vez de 3 tarjetas con $0.00

### Fase 2: Corregir Moneda Hardcodeada
Reemplazar formateo manual por `useFormatCurrency` en:
- PayYourselfFirstCard (eliminar formatCurrency local, usar hook)
- TaxSummaryCards (reemplazar `$${value.toFixed(2)}` por hook)
- BudgetAlertsCard (reemplazar `$` hardcodeado)
- GlobalBudgetCard (reemplazar `$` hardcodeado)
- CategoryBudgetsCard (reemplazar `$` hardcodeado)

### Fase 3: Fix DiaDia Charts
En `DiaDiaAreaContent`, no pasar el componente `DashboardCharts` completo (que incluye un grafico de clientes irrelevante). En su lugar, mostrar solo los graficos relevantes para el dia a dia: gastos por categoria y tendencia mensual.

## Seccion Tecnica

### Archivos a modificar:

1. **`src/components/mentorship/CashflowQuadrantCard.tsx`** - Agregar estado vacio cuando totalIncome === 0 con icono, mensaje y boton de accion
2. **`src/components/mentorship/FinancialFreedomCard.tsx`** - Agregar estado vacio cuando no hay datos
3. **`src/components/mentorship/DebtClassificationCard.tsx`** - Agregar estado vacio cuando totalDebt === 0
4. **`src/components/dashboard/TaxSummaryCards.tsx`** - Agregar estado vacio y reemplazar `$` hardcodeado por useFormatCurrency
5. **`src/components/mentorship/PayYourselfFirstCard.tsx`** - Reemplazar formatCurrency local (lineas 52-57) por useFormatCurrency hook
6. **`src/components/dashboard/BudgetAlertsCard.tsx`** - Reemplazar `$` hardcodeado por useFormatCurrency
7. **`src/components/dashboard/GlobalBudgetCard.tsx`** - Reemplazar `$` hardcodeado por useFormatCurrency
8. **`src/components/dashboard/CategoryBudgetsCard.tsx`** - Reemplazar `$` hardcodeado por useFormatCurrency
9. **`src/components/focus/areas/DiaDiaAreaContent.tsx`** - Pasar solo categoria y tendencias, no el clientBreakdown vacio

### Patron de estado vacio a implementar:
```text
+----------------------------------+
|          [Icono grande]          |
|                                  |
|   Mensaje explicativo breve      |
|   que indica que falta           |
|                                  |
|   [Boton: Ir a agregar datos]    |
+----------------------------------+
```

Cada estado vacio incluira:
- Icono relevante (el mismo del componente pero mas grande)
- Mensaje bilingue explicando que falta
- Boton que lleva a la pagina donde se pueden agregar datos
- Tono positivo y motivacional

