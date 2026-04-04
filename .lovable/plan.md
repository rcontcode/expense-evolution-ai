

# Plan: Transacciones Bancarias como Fuente Maestra de Datos

## Problema Actual
Las transacciones bancarias se importan pero pierden toda la inteligencia: la IA detecta categoría, tipo (ingreso/egreso), si es recurrente, etc., pero esos datos **se descartan** al guardar solo fecha, monto y descripción. No hay detección de duplicados al importar, no se crean gastos/ingresos automáticamente, y el procesamiento masivo falla con muchas transacciones.

## Solución en 5 Partes

### 1. Ampliar la tabla `bank_transactions` (Migración SQL)
Agregar columnas para almacenar la inteligencia que la IA ya detecta:

| Columna nueva | Tipo | Propósito |
|---|---|---|
| `transaction_type` | TEXT | `'income'` o `'expense'` |
| `category` | TEXT | Categoría detectada por IA |
| `is_recurring` | BOOLEAN | Si es pago recurrente |
| `recurring_type` | TEXT | monthly/weekly/yearly |
| `bank_name` | TEXT | Nombre del banco origen |
| `original_amount` | DECIMAL | Monto original (con signo) |
| `matched_income_id` | UUID | Vínculo a ingreso si es credit |
| `auto_categorized` | BOOLEAN | Si fue categorizado por IA |
| `duplicate_hash` | TEXT | Hash para detección de duplicados |

### 2. Detección de Duplicados al Importar
Antes de insertar, calcular un hash por transacción (`fecha + monto + descripción normalizada`) y comparar contra los existentes. Mostrar al usuario cuáles ya existen y preguntar si quiere importar de todas formas.

### 3. Procesamiento por Lotes Inteligente (Edge Function)
En vez de enviar 1000+ transacciones a la IA de golpe:
- Procesar en lotes de **50 transacciones** por llamada
- Mostrar progreso visual al usuario
- Cada lote devuelve categorías, tipo, y flags de recurrencia
- Actualizar las transacciones en DB con los resultados

### 4. Auto-creación de Gastos e Ingresos
Después del procesamiento IA, ofrecer al usuario un flujo de confirmación:
- Mostrar resumen: "X ingresos detectados, Y gastos, Z recurrentes"
- Botón "Aprobar todo" o revisión individual
- Crear registros en `expenses` y `income` automáticamente
- Las transacciones bancarias quedan vinculadas (`matched_expense_id` / `matched_income_id`)
- **Sin boleta no es blocker** — se crean igual, marcados como "sin comprobante"

### 5. Flujo de Usuario Mejorado en `BankImportDialog`
```text
[Importar CSV/PDF/Foto]
        ↓
[Detección de Duplicados] → "5 ya existen, ¿importar de nuevo?"
        ↓
[Procesamiento IA por lotes] → Barra de progreso: "Lote 3/20..."
        ↓
[Resumen de Clasificación]
  ├── 📥 45 ingresos ($125,000)
  ├── 📤 180 gastos ($98,000)  
  ├── 🔄 12 recurrentes
  └── ❓ 8 sin clasificar
        ↓
[Aprobar / Revisar / Descartar]
        ↓
[Crear gastos e ingresos automáticamente]
```

## Archivos a Modificar

| Archivo | Cambio |
|---|---|
| `supabase/migrations/new.sql` | ALTER TABLE bank_transactions + nuevas columnas + índice para duplicate_hash |
| `supabase/functions/analyze-bank-statement/index.ts` | Agregar endpoint de batch processing que procese 50 txns por llamada |
| `src/hooks/data/useBankTransactions.ts` | Agregar duplicate detection, batch AI processing, auto-create expenses/income |
| `src/components/dialogs/BankImportDialog.tsx` | Nuevo flujo multi-paso con duplicados, progreso, y resumen de clasificación |
| `src/hooks/data/useBankAnalysis.ts` | Usar nuevos campos (category, type) en los insights |

## Detalle Técnico

**Duplicate hash**: `SHA-like` simplificado = `${date}_${amount}_${normalizeDescription(desc)}`. Se compara contra existentes antes de insert.

**Batch processing**: Nueva función `classifyBankTransactions` en la edge function que recibe un array de transaction IDs, los lee de la DB, los envía a la IA en grupos de 50, y actualiza directamente en la DB con los resultados.

**Auto-create**: Nuevo hook `useAutoCreateFromBankTransactions` que toma transacciones clasificadas y genera records en `expenses` (para type=debit) e `income` (para type=credit), vinculando el `matched_expense_id`/`matched_income_id` bidireccionalmente.

