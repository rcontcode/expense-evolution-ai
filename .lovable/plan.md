

# Plan: Centralizar y optimizar la aprobación de pagos recurrentes + datos retroactivos

## Diagnóstico actual

### ¿Dónde se crean pagos recurrentes hoy? (5 puntos de entrada dispersos)

1. **RecurringBillConfirmDialog** — Se dispara desde: QuickCapture, SmartTextInput, MobileCapture, ChatAssistant (Phoenix). Aparece cuando la AI detecta un patrón recurrente.
2. **BillFormDialog** — Formulario manual de 3 pasos en `/bills` (BillsManager).
3. **BillsQuickOnboarding** — 18 presets rápidos (Netflix, Luz, Agua, etc.) para setup inicial.
4. **Chaos Inbox** — Tras aprobar utility_bill/rental_receipt, sugiere vía toast navegar a `/bills`.
5. **ExpenseBillMatcher** — Cruza gastos nuevos con bills existentes y ofrece "Marcar pagado" (no crea nuevos).

### Problemas encontrados

| Problema | Severidad |
|----------|-----------|
| **No hay fecha de inicio ni fecha de fin** para pagos recurrentes — la tabla solo tiene `next_due_date`. No puedes decir "pago internet desde enero 2024 hasta dic 2025" | ALTA |
| **No hay carga retroactiva** de gastos/ingresos en lote — no existe un "bulk import" de registros manuales con fechas pasadas | ALTA |
| **El Chaos Inbox no crea el bill directamente** — solo muestra un toast con link a `/bills`, el usuario pierde el contexto | MEDIA |
| **RecurringBillConfirmDialog no tiene campo de vigencia** — no pregunta "¿desde cuándo?" ni "¿hasta cuándo?" | MEDIA |
| **No se generan pagos históricos** al crear un bill retroactivo — si dices "pago $500/mes desde enero", no se crean los 3-4 registros de bill_payments pasados | ALTA |
| **BillFormDialog tampoco tiene fecha de inicio** — solo "próximo vencimiento" | MEDIA |

## Plan de implementación

### 1. Migración DB: Agregar `start_date` y `end_date` a `recurring_bills`
```sql
ALTER TABLE recurring_bills
  ADD COLUMN start_date date,
  ADD COLUMN end_date date;
```
Ambos opcionales. `start_date` permite saber desde cuándo existe la obligación. `end_date` permite marcar contratos con fecha de término (ej. "arriendo hasta dic 2025").

### 2. Actualizar BillFormDialog — Agregar vigencia
- **Step 1 (Básico)**: Agregar campos "Desde" (`start_date`) y "Hasta (opcional)" (`end_date`).
- Hint contextual: "¿Desde cuándo pagas esto? Si ya llevas meses pagando, pon la fecha real de inicio."

### 3. Actualizar RecurringBillConfirmDialog — Agregar vigencia
- Agregar campos `start_date` y `end_date` (colapsables/opcionales).
- Pregunta: "¿Desde cuándo pagas esto?" con default = hoy.

### 4. Backfill automático de pagos históricos
- Cuando `start_date` es anterior a hoy, ofrecer: "¿Quieres registrar los pagos pasados automáticamente?"
- Si acepta → calcular cada fecha de pago entre `start_date` y hoy según `frequency`, e insertar en `bill_payments` como pagos históricos.
- Esto pobla el historial de pagos, alimenta el Sparkline, el HealthScore y los reportes.

### 5. Chaos Inbox: crear bill inline en vez de navegar
- Reemplazar el toast con link por abrir `RecurringBillConfirmDialog` directamente con datos pre-poblados (nombre, monto, categoría del documento procesado).

### 6. Carga retroactiva masiva de gastos/ingresos
- Agregar botón "Importar registros históricos" en Gastos e Ingresos.
- Formulario simplificado: tabla editable (fecha, monto, vendedor/fuente, categoría) con opción de pegar desde Excel/CSV.
- Inserta en lote en `expenses` o `income` con las fechas pasadas indicadas.

### 7. Actualizar hooks y tipos
- `useRecurringBills.ts`: Agregar `start_date` y `end_date` a `RecurringBill` y `BillInsert`.
- `useCreateBill`: Aceptar `start_date`/`end_date`.
- Nuevo helper `generateHistoricalPayments(startDate, endDate, frequency, amount)` → array de `bill_payments`.

## Archivos a modificar

1. **Migración SQL** — `ALTER TABLE recurring_bills ADD COLUMN start_date, end_date`
2. **`src/hooks/data/useRecurringBills.ts`** — Tipos + helper de backfill
3. **`src/components/bills/BillFormDialog.tsx`** — Campos start_date/end_date en Step 1
4. **`src/components/bills/RecurringBillConfirmDialog.tsx`** — Campos start_date/end_date + oferta de backfill
5. **`src/pages/ChaosInbox.tsx`** — Abrir dialog inline en vez de toast
6. **Nuevo: `src/components/shared/BulkHistoricalImport.tsx`** — Componente de importación masiva retroactiva para gastos e ingresos

## Resultado esperado

- El usuario puede decir "pago internet desde enero 2024, $50/mes" y el sistema crea el bill **y** genera los 15+ registros de pago históricos automáticamente.
- El Chaos Inbox crea bills directamente sin perder contexto.
- Existe un importador masivo para poblar datos históricos de gastos e ingresos.
- Todos los reportes, sparklines y health scores reflejan datos retroactivos.

