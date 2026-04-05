

# Plan: Post-Importación Completa — Feedback, Historial y Certeza del Usuario

## Problemas Actuales

1. **CSV en Chaos Inbox**: Si el usuario sube un .csv en la Bandeja del Caos, se procesa como receipt (falla silenciosamente). No hay redirección ni mensaje informativo.
2. **Sin historial de importaciones**: Cuando el usuario importa transacciones bancarias, no queda registro persistente del resumen (cuántas se importaron, clasificación, duplicados detectados, fecha). Se pierde al cerrar el dialog.
3. **"Done" step vacío**: El paso final del import solo dice "¡Importación completa!" sin detalle. El usuario no sabe qué se creó, cuántos gastos, cuántos ingresos, qué categorías.
4. **Sin resumen accesible post-importación**: No hay forma de volver a ver qué se importó anteriormente. No hay historial.
5. **Falta certeza global**: El usuario no tiene un lugar donde ver "estos son los datos que estoy usando para los cálculos" — qué fuentes alimentan el dashboard.

## Solución

### 1. Chaos Inbox: Detectar CSV/XLS y redirigir (ChaosInbox.tsx)
En `handleFileUpload`, antes de procesar, detectar extensión `.csv`/`.xlsx`/`.xls`. Si es banco, mostrar toast informativo con link a `/banking`:
- "Los archivos CSV bancarios se procesan desde Análisis Bancario → Importar"
- No subir el archivo, no crear documento

### 2. Tabla `bank_import_sessions` para historial (migración)
```sql
CREATE TABLE public.bank_import_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  imported_at timestamptz DEFAULT now(),
  source_type text NOT NULL DEFAULT 'csv', -- csv, pdf, photo
  file_name text,
  total_transactions int DEFAULT 0,
  duplicates_found int DEFAULT 0,
  duplicates_skipped int DEFAULT 0,
  income_count int DEFAULT 0,
  expense_count int DEFAULT 0,
  income_total numeric DEFAULT 0,
  expense_total numeric DEFAULT 0,
  recurring_count int DEFAULT 0,
  unclassified_count int DEFAULT 0,
  expenses_created int DEFAULT 0,
  income_created int DEFAULT 0,
  categories jsonb DEFAULT '{}',
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bank_import_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own import sessions" ON public.bank_import_sessions FOR ALL USING (auth.uid() = user_id);
```

### 3. Guardar resumen al completar importación (useBankImportFlow.ts)
- En `autoCreateRecords` (al crear gastos/ingresos) y en `buildSummary` (si solo importa), insertar un registro en `bank_import_sessions` con todos los conteos y totales.
- Agregar `sourceType` y `fileName` al state del flow para rastrear origen.

### 4. Mejorar "Done" step con resumen detallado (BankImportDialog.tsx)
Reemplazar el paso "done" genérico con un resumen completo:
- Total importado, duplicados detectados/saltados
- Ingresos creados (conteo + total)
- Gastos creados (conteo + total)
- Recurrentes detectados
- Categorías detectadas (top 5)
- Botones: "Ver en Banking" y "Cerrar"

### 5. Componente `BankImportHistory` (nuevo: src/components/banking/BankImportHistory.tsx)
Widget colapsable en `/banking` que muestra historial de importaciones:
- Lista de sesiones con fecha, fuente, conteos
- Click para expandir detalle (ingresos, gastos, categorías)
- Badge con total acumulado

### 6. Panel "Fuentes de Datos" en Banking (ampliar BankTransactionSummary)
Agregar sección superior en el summary que muestre:
- Total transacciones en DB, por fuente (CSV/PDF/Foto)
- Rango de fechas cubierto
- % clasificado vs pendiente
- % vinculado a gastos/ingresos vs no vinculado
- Esto da certeza al usuario de qué datos alimentan los cálculos

## Archivos a Modificar/Crear

| Archivo | Cambio |
|---------|--------|
| **Migración SQL** | Nueva tabla `bank_import_sessions` |
| `src/pages/ChaosInbox.tsx` | Detectar CSV/XLS → toast redirigir a banking |
| `src/hooks/data/useBankImportFlow.ts` | Guardar sesión en `bank_import_sessions`, agregar sourceType/fileName al state |
| `src/components/dialogs/BankImportDialog.tsx` | Mejorar "done" step con resumen detallado, pasar sourceType/fileName al flow |
| `src/components/banking/BankImportHistory.tsx` | **NUEVO** — Widget historial de importaciones |
| `src/components/banking/BankTransactionSummary.tsx` | Agregar sección "Fuentes de Datos" con stats de cobertura |
| `src/pages/Banking.tsx` | Agregar `BankImportHistory` al layout |

## Detalle Técnico

**Detección CSV en Chaos Inbox**: Verificar `file.name.match(/\.(csv|xlsx?|xls)$/i)` antes del loop de upload. Si match, mostrar toast con acción:
```typescript
toast.info(l ? 'Los extractos bancarios se importan desde Análisis Bancario' : 'Bank statements are imported from Bank Analysis', {
  action: { label: l ? 'Ir' : 'Go', onClick: () => navigate('/banking') },
  duration: 8000,
});
```

**Historial query**: Simple `useQuery` ordenado por `imported_at DESC`, limit 20.

**Fuentes de datos stats**: Calcular desde `useBankTransactions` existente:
- `matched` vs `pending` count
- Unique `bank_name` values
- Min/max `transaction_date`

