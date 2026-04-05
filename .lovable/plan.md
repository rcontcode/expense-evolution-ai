

# Plan: Resumen Inteligente de Transacciones + Correcciones de Ruta y Centro de Revisión

## Problemas Identificados

1. **Ruta rota `/bank` → 404**: En `useMissionControl.ts` (líneas 289, 437, 481, 488), `actionUrl` apunta a `/bank` pero la ruta real es `/banking`. El botón "Ir a completar" del Mission Control lleva a una página inexistente.

2. **Falta resumen mensual/anual inteligente**: No existe un componente que muestre un panorama tipo "vista de bosque" con patrones detectados (ingresos recurrentes, transferencias, gastos por categoría, pagos recurrentes vs no recurrentes).

3. **Centro de Revisión limitado a boletas**: `ExpenseReviewCenter` solo maneja `expenses` y sus documentos asociados. No incluye transacciones bancarias, ingresos, contratos ni otros tipos de registros financieros.

## Solución

### 1. Corregir rutas rotas (5 min)
**Archivo**: `src/hooks/utils/useMissionControl.ts`
- Cambiar todas las referencias de `/bank` a `/banking` (líneas 289, 437, 481, 488).

### 2. Crear componente `BankTransactionSummary` (nuevo)
**Archivo**: `src/components/banking/BankTransactionSummary.tsx`

Un componente que analiza las transacciones bancarias clasificadas y genera un resumen visual con:

- **Ingresos recurrentes detectados**: "1 ingreso mensual de [cliente/descripción] por $XXX, generalmente los días XX"
- **Transferencias detectadas**: Si no se identifica el propósito, preguntar al usuario "¿De qué es esta transferencia a XXX?"
- **Gastos recurrentes confirmados**: Lista de pagos fijos detectados (subscriptions, utilities, etc.) con botón "Confirmar"
- **Gastos no recurrentes por categoría**: Groceries $XXX, Combustible $XXX, Restaurantes $XXX, etc.
- **Vista mensual y anual** con toggle

La lógica:
- Agrupa transacciones por `description` normalizada
- Detecta patrones de recurrencia (misma descripción, monto similar, frecuencia regular)
- Clasifica por `transaction_type` y `category` (campos ya disponibles en la DB)
- Para transferencias sin categoría clara, muestra un prompt interactivo
- Calcula totales mensuales y anuales

### 3. Ampliar el Centro de Revisión
**Archivo**: `src/components/expenses/ExpenseReviewCenter.tsx`

Agregar tabs adicionales para revisar:
- **Transacciones bancarias**: pendientes de clasificar o vincular
- **Ingresos**: registros de income con/sin documento
- Los tabs existentes de gastos se mantienen

Esto requiere importar `useBankTransactions` y `useIncome` y agregar `TabsTrigger`/`TabsContent` para cada tipo.

### 4. Integrar el resumen en la página Banking
**Archivo**: `src/pages/Banking.tsx`

Agregar `<BankTransactionSummary />` entre `BankingInsightsSummary` y `SmartSearchChat`, dándole prominencia como panel principal de visibilidad.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/utils/useMissionControl.ts` | `/bank` → `/banking` (4 ocurrencias) |
| `src/components/banking/BankTransactionSummary.tsx` | **NUEVO** - Resumen inteligente mensual/anual |
| `src/components/expenses/ExpenseReviewCenter.tsx` | Agregar tabs para bank transactions e income |
| `src/pages/Banking.tsx` | Integrar BankTransactionSummary |

## Detalle del Resumen Inteligente

```text
┌─────────────────────────────────────────────┐
│  📊 Resumen de Actividad  [Mensual ▼]       │
├─────────────────────────────────────────────┤
│                                             │
│  💰 INGRESOS DETECTADOS                     │
│  ├── Salario de EMPRESA X: $2,500,000       │
│  │   📅 Generalmente los días 28-30         │
│  └── Transferencia de CLIENTE Y: $450,000   │
│      📅 2 veces este mes                    │
│                                             │
│  🔄 PAGOS RECURRENTES                       │
│  ├── Netflix: $9,990/mes ✅ Confirmado      │
│  ├── Spotify: $5,490/mes ✅ Confirmado      │
│  └── Luz Enel: ~$45,000/mes ⚠️ Confirmar   │
│                                             │
│  ❓ TRANSFERENCIAS SIN IDENTIFICAR          │
│  └── Transferencia a J.PEREZ: $150,000      │
│      [¿Qué es?] [Arriendo] [Préstamo] [Otro]│
│                                             │
│  🛒 GASTOS NO RECURRENTES                   │
│  ├── 🛒 Supermercado: $285,000 (12 compras) │
│  ├── ⛽ Combustible: $120,000 (4 cargas)    │
│  ├── 🍽️ Restaurantes: $95,000 (8 visitas)  │
│  └── 🛍️ Compras: $67,000 (3 compras)       │
│                                             │
│  📈 TOTALES                                 │
│  Ingresos: $2,950,000                       │
│  Gastos:   $1,892,000                       │
│  Neto:     +$1,058,000                      │
└─────────────────────────────────────────────┘
```

Sin cambios de backend. Todo se calcula client-side a partir de datos ya clasificados en `bank_transactions`.

