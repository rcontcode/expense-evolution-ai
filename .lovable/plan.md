

# Plan: Correcciones Pendientes del Sistema Bancario

## Problemas Encontrados

### 1. BUG CRÍTICO — `BankingSummaryCard` filtra tipos incorrectos
En línea 45-46, filtra por `'credit'`/`'debit'`, pero los datos reales almacenados son `'income'`/`'expense'` (así los guarda la edge function y el import flow). Resultado: **el widget del dashboard muestra $0 ingresos y $0 gastos siempre**.

### 2. N+1 queries en `BankTransactionSummary`
`handleLabelTransfer` y `handleConfirmRecurring` actualizan 1-por-1 en un `for` loop. Si un grupo tiene 20 transacciones, son 20 requests secuenciales. Se pueden reemplazar con un solo `.in('id', txIds).update(...)`.

### 3. Moneda hardcodeada en `BankingSummaryCard`
En línea 73-75, usa `currency: 'CLP'` hardcodeado en vez de `useFormatCurrency()` que ya existe y respeta la configuración del usuario.

## Solución

### 1. Fix tipos en `BankingSummaryCard.tsx` (líneas 45-46)
```
// Antes:
const income = transactions.filter(t => t.transaction_type === 'credit');
const expenses = transactions.filter(t => t.transaction_type === 'debit');

// Después:
const income = transactions.filter(t => t.transaction_type === 'income');
const expenses = transactions.filter(t => t.transaction_type === 'expense');
```

### 2. Fix moneda — usar `useFormatCurrency()` en vez de `Intl.NumberFormat` hardcodeado
Importar y usar el hook existente, eliminar la función `fmt` local.

### 3. Batch updates en `BankTransactionSummary.tsx`
Reemplazar los loops `for...of` en `handleLabelTransfer` y `handleConfirmRecurring` con una sola query `.in('id', txIds)`.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/banking/BankingSummaryCard.tsx` | Fix `credit`→`income`, `debit`→`expense`; usar `useFormatCurrency()` |
| `src/components/banking/BankTransactionSummary.tsx` | Batch updates con `.in()` |

