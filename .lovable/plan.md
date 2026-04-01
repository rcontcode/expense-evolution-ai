

# Plan: Gaps restantes para completar el ecosistema financiero

## Estado actual: Lo que YA funciona completamente

Tras las correcciones anteriores, estos flujos están completos de punta a punta:

1. **Bandeja del Caos → Gastos**: Recibos, boletas, facturas de gasto → Review Center → tabla `expenses` → Reportes
2. **Bandeja del Caos → Ingresos**: Facturas de ingreso, income_proof → Review Center → tabla `income` → P&L
3. **Bandeja del Caos → Banco**: Extractos bancarios → `bank_transactions` → Conciliación disponible
4. **Bandeja del Caos → Contratos**: Análisis AI → tabla `contracts`
5. **Documentos especializados**: Médicos, donaciones, seguros → Review Center con pre-categorización fiscal
6. **7 Reportes**: P&L, Gastos, Presupuesto, Bills, Fiscal/T2125, Ingresos, Kilometraje (todos exportan PDF/Excel)
7. **Rendición de gastos por cliente**: `ClientReimbursementReport` con exportación Excel/PDF
8. **Pagos recurrentes**: Kanban, calendario, checklist, proyección
9. **Auto-reminders**: Facturas, contratos, deadlines fiscales, presupuesto
10. **Conciliación bancaria**: Manual + AI (Gemini) con smart matching
11. **Notificaciones centralizadas**: `DashboardNotificationHub`
12. **Búsqueda global**: Gastos, ingresos, clientes, proyectos, facturas, contratos, kilometraje

## Gaps que FALTAN (ordenados por impacto)

### Gap 1: Reporte de Rendición NO accesible desde Reports Hub
**Impacto: ALTO**
El `ClientReimbursementReport` solo es accesible desde la página de Gastos (botón "Rendición"). NO aparece en el Reports Hub (`/reports`), que es donde un usuario buscaría reportes para su cliente o contador.

**Fix**: Agregar card "Rendición por Cliente" en `REPORT_CARDS` del Reports Hub, con preview y exportación.

### Gap 2: Income Summary solo exporta Excel, no PDF
**Impacto: MEDIO**
El reporte de Ingresos solo tiene opción Excel. Un contador puede necesitar PDF. Los otros 6 reportes sí tienen ambos formatos.

**Fix**: Agregar `exportIncomeSummaryPDF` en Reports.tsx y habilitar formato `['pdf', 'excel']`.

### Gap 3: Tax Report no incluye ingresos (solo gastos)
**Impacto: ALTO**
El reporte fiscal/T2125 solo muestra gastos deducibles. Para un contador esto es incompleto — necesita ver ingresos vs deducciones para calcular impuestos. El reporte solo filtra `expenses` con `status === 'deductible'`.

**Fix**: Enriquecer el reporte fiscal para incluir una sección de ingresos gravables y calcular ingreso neto imponible.

### Gap 4: Gastos del Chaos Inbox llegan sin `reimbursement_type` clasificado
**Impacto: MEDIO**
Cuando el Review Center aprueba un gasto que tiene `client_id` (asignado por AI), el `reimbursement_type` se establece como `client_reimbursable` correctamente. PERO si el usuario luego quiere generar la Rendición, los gastos que no pasaron por la clasificación rápida no aparecen porque el filtro usa `REIMBURSABLE_STATUSES = ['reimbursable', 'pending', 'under_review', 'client_reimbursable']` y el `status` del gasto aprobado es `'pending'`.

Esto ya funciona parcialmente — `status: 'pending'` está en `REIMBURSABLE_STATUSES`. Confirmar que el filtro incluye gastos con `client_id` sin importar el `reimbursement_type`.

### Gap 5: Utility bills y rental receipts no crean pago recurrente automáticamente
**Impacto: MEDIO**
Al aprobar una `utility_bill` o `rental_receipt` en el Review Center, se crea el gasto pero NO se crea automáticamente el `recurring_bill`. El botón "Crear Pago Fijo" en el Chaos Inbox solo navega a `/bills` sin datos pre-cargados.

**Fix**: Al aprobar documentos marcados `suggested_recurring: true`, ofrecer diálogo para crear `recurring_bill` con datos pre-poblados (nombre, monto, categoría) usando `useCreateBill`.

### Gap 6: Bank transactions no tienen `entity_id`
**Impacto: BAJO**
Al insertar transacciones bancarias desde el Chaos Inbox, no se asigna `entity_id` del usuario. Esto puede causar que en modo multi-entidad las transacciones no se filtren correctamente.

**Fix**: Agregar `entity_id` a las filas insertadas en `bank_transactions` (si la columna existe).

### Gap 7: Reporte fiscal no diferencia por país (CRA vs SII)
**Impacto: MEDIO**
El reporte T2125 está hardcodeado para Canadá. Para Chile debería mostrar formato SII/F29 en vez de T2125.

**Fix**: Ya existe lógica de país en `useEntity()`. Adaptar headers del reporte fiscal según `currentCountry`.

## Archivos a modificar

### 1. `src/pages/Reports.tsx`
- Agregar card "Rendición por Cliente" a `REPORT_CARDS`
- Agregar `exportIncomeSummaryPDF` function
- Habilitar formato PDF para Income Summary
- Enriquecer preview y export del reporte fiscal con ingresos gravables
- Adaptar labels fiscales según país (T2125 vs F29/SII)

### 2. `src/hooks/data/useDocumentReview.ts`
- Tras aprobar documentos con `suggested_recurring: true`, retornar flag para que el UI ofrezca crear bill

### 3. `src/components/capture/ReceiptReviewCard.tsx` o `ReceiptReviewDialog.tsx`
- Agregar botón/opción "Crear pago recurrente" cuando `suggested_recurring: true`
- Usar `useCreateBill` con datos pre-poblados del documento aprobado

### 4. `src/hooks/data/useUnifiedChaosInbox.ts`
- Agregar `entity_id` a las inserciones de `bank_transactions`

## Resultado

Con estos cambios:
- El Reports Hub tendrá 8 reportes completos (incluyendo rendición por cliente)
- El reporte fiscal será completo (ingresos + deducciones) y adaptado por país
- Los pagos recurrentes se crearán desde documentos automáticamente
- Todos los formatos de exportación estarán disponibles (PDF + Excel)
- El pipeline bulk → reportes estará 100% funcional

