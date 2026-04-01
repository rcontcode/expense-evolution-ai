

# Plan: Completar Pipeline Bulk Chaos Inbox → Reportes Completos

## Diagnóstico: ¿Qué funciona y qué NO?

### FUNCIONA correctamente
1. **Clasificación AI**: La Bandeja del Caos clasifica 14 tipos de documentos (recibos, facturas, contratos, extractos bancarios, boletas, comprobantes de ingreso, etc.)
2. **Contratos**: Se guardan en `contracts` y se analizan con AI correctamente
3. **Recibos/Boletas**: Se procesan y van al Centro de Revisión → al aprobar se crea un gasto
4. **Detección de dirección de facturas**: El sistema detecta si una factura es ingreso o gasto cruzando con clientes
5. **Post-Upload Wizard**: Funciona para organizar documentos después del bulk upload
6. **Reportes**: Existen 7 reportes (P&L, Gastos, Presupuesto, Pagos Recurrentes, Fiscal/T2125, Ingresos, Kilometraje)
7. **Pagos recurrentes**: Sistema completo con Kanban, calendario, checklist, proyección

### GAPS CRÍTICOS (impiden el flujo completo)

#### Gap 1: Ingresos aprobados se crean como GASTOS
**Severidad: CRÍTICA**
Cuando la Bandeja del Caos clasifica un documento como `income_proof` o una factura con `invoice_direction: 'income'`, lo envía al Centro de Revisión correctamente. PERO `useDocumentReviewActions.approveDocument()` **siempre inserta en la tabla `expenses`**, nunca en `income`. Los ingresos nunca llegan al P&L ni al resumen de ingresos.

**Fix**: Modificar `approveDocument` para detectar `extracted_data.invoice_direction === 'income'` y crear un registro en `income` en vez de `expenses`.

#### Gap 2: Extractos bancarios no se guardan en `bank_transactions`
**Severidad: ALTA**
Cuando se sube un extracto bancario, la AI extrae transacciones pero el resultado se queda solo en `processedResult` (estado local del componente). Las transacciones **nunca se persisten** en la tabla `bank_transactions`. Al navegar a `/banking`, no aparece nada.

**Fix**: En `useUnifiedChaosInbox.processDocument` case `bank_statement`, insertar las transacciones extraídas en `bank_transactions`.

#### Gap 3: Boletas de servicio no crean pago recurrente
**Severidad: MEDIA**
Las `utility_bill` se marcan con `suggested_recurring: true` pero no hay acción automática ni flujo para convertirlas en `recurring_bills`. Solo se guardan como documentos pending_review.

**Fix**: Tras aprobar una utility_bill, ofrecer botón "Crear como pago fijo" que invoque `useCreateBill`.

#### Gap 4: El Centro de Revisión no distingue visualmente ingresos de gastos
**Severidad: MEDIA**
Los documentos de ingreso y gasto se ven idénticos en el Centro de Revisión. El usuario no sabe qué está aprobando.

**Fix**: Agregar badge visual "INGRESO" / "GASTO" en `ReceiptReviewCard` basado en `extracted_data.invoice_direction`.

## Archivos a modificar

### 1. `src/hooks/data/useDocumentReview.ts`
- En `approveDocument`: detectar `data.invoice_direction === 'income'`
  - Si es ingreso → insertar en tabla `income` (amount, date, source, currency, income_type, entity_id, document_id)
  - Si es gasto → mantener lógica actual (insertar en `expenses`)
- Agregar `afterIncome()` de `useInvalidateRelated` para invalidar cache de ingresos

### 2. `src/hooks/data/useUnifiedChaosInbox.ts`
- En case `bank_statement` (~línea 404-432): después de llamar a `process-bank-statement`, insertar cada transacción en `bank_transactions` con:
  ```
  { user_id, transaction_date, amount, description, status: 'pending' }
  ```
- Invalidar `['bank-transactions']`

### 3. `src/components/capture/ReceiptReviewCard.tsx`
- Leer `document.extracted_data.invoice_direction`
- Mostrar badge "💰 Ingreso" o "🧾 Gasto" según dirección
- Ajustar label del botón aprobar: "Aprobar Ingreso" vs "Aprobar Gasto"

### 4. `src/components/chaos/UnifiedChaosInboxPanel.tsx`
- En `ProcessedResultMessage` para `utility_bill`: agregar botón "Crear pago fijo" que navegue a `/bills` con los datos pre-cargados

## Resultado esperado

Después de estos cambios, un usuario que suba en bulk:
- **Boletas/recibos** → Gastos en el reporte de gastos y reporte fiscal
- **Facturas de clientes** → Ingresos en el P&L y rendición para cliente
- **Extractos bancarios** → Transacciones en módulo de banca, conciliación disponible
- **Contratos** → Ya funciona
- **Boletas de servicio** → Gastos + sugerencia de pago recurrente
- **Comprobantes de ingreso** → Ingresos reales en el sistema

Todo esto alimenta directamente: Dashboard, P&L, Reporte Fiscal, Reporte de Gastos, Presupuesto, Proyección de flujo.

