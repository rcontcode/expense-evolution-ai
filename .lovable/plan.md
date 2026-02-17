
# Consolidar SpendingPredictor: Usar Expenses + Bank Transactions

## Problema actual
El componente `SpendingPredictor` solo consume datos de `bank_transactions` para sus predicciones. Esto significa que si un usuario tiene gastos registrados manualmente en `expenses` pero no ha importado estados bancarios, el predictor no muestra nada (retorna `null`). Incluso si usa ambos, la predicción es incompleta.

## Cambios a realizar

### Archivo: `src/components/banking/SpendingPredictor.tsx`

1. **Agregar import de `useExpenses`** desde `@/hooks/data/useExpenses`

2. **Consumir ambas fuentes de datos** en el componente:
   - Llamar `useExpenses()` para obtener los gastos manuales
   - Mantener `useBankTransactions()` para transacciones bancarias

3. **Unificar los datos en el `useMemo`**:
   - Convertir ambas fuentes a un formato comun `{ date: string, amount: number }` 
   - Para `expenses`: usar campo `date` y `amount`
   - Para `bank_transactions`: usar campo `transaction_date` y `amount`
   - Deduplicar: excluir transacciones bancarias que ya esten "matched" con un expense (campo `matched_expense_id`) para no contar doble

4. **Actualizar la condicion de "no data"** (linea 48 y 96):
   - Mostrar el componente si hay datos en **cualquiera** de las dos fuentes (no solo bank_transactions)
   - Cambiar: `if (!transactions || transactions.length === 0) return null` a verificar si la combinacion unificada esta vacia

5. **Actualizar la descripcion** (linea 119):
   - Indicar que usa datos combinados: "Basado en gastos y transacciones bancarias" / "Based on expenses and bank transactions"

## Detalles tecnicos

- Las dependencias del `useMemo` se actualizaran para incluir `expenses`
- No se requieren cambios en la base de datos
- No se requieren nuevos hooks, solo reutilizar `useExpenses` existente
- La logica de calculo (promedio diario, proyeccion, comparacion mes anterior) permanece identica, solo cambia la fuente de datos de entrada
