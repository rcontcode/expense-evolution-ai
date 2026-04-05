

# Plan: Depurar y Mejorar el Sistema Bancario Existente

## Problemas Encontrados

### 1. StatBox con clases Tailwind dinámicas (BUG VISUAL)
En `BankingSummaryCard.tsx`, el componente `StatBox` usa `bg-${color}/5` y `border-${color}/10` — clases construidas dinámicamente que **Tailwind purga en build**. Los stat boxes del dashboard NO tienen color de fondo ni borde.

### 2. `duplicates_skipped` siempre es 0 (BUG LÓGICO)
En `useBankImportFlow.ts` línea 300:
```
duplicates_skipped: state.duplicates.length - (state.transactions.length - state.newTransactions.length)
```
Esto siempre da 0 porque `duplicates.length === transactions.length - newTransactions.length`. Debería rastrear si el usuario eligió "solo nuevas" o "todas".

### 3. `useBankTransactions` sin paginación (1000+ transacciones)
La query no tiene `.limit()`, pero Supabase tiene un límite default de 1000 filas. Con 1000+ transacciones, el resumen y análisis se basan en datos incompletos sin aviso.

### 4. `parseCSV` pierde el signo del monto
En línea 397: `amount: Math.abs(amount)` — elimina la información de débito/crédito del CSV. Después la clasificación IA tiene que adivinar el tipo, cuando el CSV ya lo indicaba.

### 5. `autoCreateRecords` actualiza 1 a 1 (N+1 queries)
En el loop de creación de gastos/ingresos, cada `matched_expense_id` se actualiza con un query individual. Con 500+ transacciones esto genera 500+ requests.

## Solución

### 1. Fix StatBox — clases estáticas mapeadas
Reemplazar `bg-${color}/5` con un mapa de clases completas:

```typescript
const colorMap: Record<string, string> = {
  success: 'bg-emerald-500/5 border-emerald-500/10',
  destructive: 'bg-red-500/5 border-red-500/10',
  primary: 'bg-primary/5 border-primary/10',
  muted: 'bg-muted/50 border-border',
};
```

### 2. Fix duplicates_skipped — rastrear decisión del usuario
Agregar `skippedDuplicates: boolean` al state. Cuando el usuario elige "solo nuevas", `duplicates_skipped = state.duplicates.length`. Cuando elige "todas", `duplicates_skipped = 0`.

### 3. Paginación en useBankTransactions
Agregar `.limit(5000)` o implementar paginación con `range()`. Para el summary, mantener la query completa pero con límite alto explícito y mostrar aviso si se alcanza.

### 4. Preservar signo en parseCSV
No aplicar `Math.abs()` en el parser. Guardar el amount original con signo para que `transaction_type` se infiera correctamente: negativo = expense, positivo = income.

### 5. Batch update en autoCreateRecords
Agrupar los updates de `matched_expense_id` y `matched_income_id` en batches de 50 usando `.in()` + `.update()` en lugar de 1-por-1.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/banking/BankingSummaryCard.tsx` | Fix StatBox con mapa de clases estáticas |
| `src/hooks/data/useBankImportFlow.ts` | Fix duplicates_skipped, batch updates en autoCreateRecords |
| `src/hooks/data/useBankTransactions.ts` | Agregar `.limit(5000)`, preservar signo en parseCSV |

