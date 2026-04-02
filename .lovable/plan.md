

# Plan: Mission Control — Panel Inteligente de Progreso y Estado de Datos

## El Problema

Hoy la información sobre "qué falta" está **fragmentada** en 6+ componentes dispersos:
- `DashboardNotificationHub` — alertas genéricas
- `ProgressiveOnboarding` — solo 3 pasos básicos (gasto, cliente, ingreso)
- `ExpenseHealthPanel` — solo en la página de gastos
- `DataCompletenessPrompt` — solo si los gastos del mes lucen incompletos
- `useNudgeSystem` — nudges simples sin desglose
- `SetupProgressBanner` — checklist de setup inicial

Ninguno muestra el **pipeline completo**: subido → procesado → aprobado → en uso. El usuario no puede ver de un vistazo dónde está parado.

## Solución

Crear un **"Mission Control"** — un componente visual tipo panel de control que muestra el estado completo del pipeline de datos del usuario, organizado por categoría, con prioridades claras y acciones directas.

## Arquitectura

```text
┌─────────────────────────────────────────────────┐
│  🚀 Mission Control — Tu Progreso              │
│  ████████████░░░ 73% completo                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  📄 Documentos    ██████░░ 6/8                  │
│     8 subidos · 6 procesados · 4 aprobados      │
│     ⚠️ 2 pendientes de aprobar (urgente)        │
│     [Revisar ahora →]                           │
│                                                 │
│  💰 Gastos        █████░░░ 62%                  │
│     45 registrados · 28 con recibo              │
│     12 sin categoría · 5 sin clasificar         │
│     ⚡ 5 sin clasificar bloquean reportes       │
│     [Completar →]                               │
│                                                 │
│  📊 Ingresos      ████████ 100%                 │
│     8 registrados · todos con cliente           │
│     ✅ Completo                                  │
│                                                 │
│  👥 Clientes      ██████░░ 75%                  │
│     4 clientes · 3 con datos completos          │
│     1 sin email ni teléfono                     │
│     [Completar perfil →]                        │
│                                                 │
│  🏦 Banco         ███░░░░░ 40%                  │
│     23 transacciones · 9 conciliadas            │
│     14 sin vincular a gastos                    │
│     [Conciliar →]                               │
│                                                 │
│  📋 Contratos     ████████ 100%                 │
│     2 activos · todos vinculados                │
│                                                 │
│  🔄 Pagos Fijos   ██████░░ 80%                  │
│     5 configurados · 1 vencido                  │
│     [Pagar →]                                   │
│                                                 │
├─────────────────────────────────────────────────┤
│  🔴 Urgente (3) · 🟡 Pendiente (5) · ✅ OK (4) │
└─────────────────────────────────────────────────┘
```

## Qué se construirá

### 1. Hook: `src/hooks/utils/useMissionControl.ts`

Centraliza **todas** las métricas de progreso en un solo lugar:

- **Documentos**: total subidos, procesados por IA, aprobados por el usuario, rechazados, pendientes de revisión. Detecta si hay docs pendientes > 3 días (urgente).
- **Gastos**: total, con recibo vinculado, con categoría, con clasificación (reimbursable/deductible/personal), con cliente, con contrato. Calcula % completo ponderado.
- **Ingresos**: total, con cliente asignado, con proyecto, sin asignar.
- **Clientes**: total, completeness promedio (usa `calculateClientCompleteness`), clientes sin datos críticos.
- **Banco**: transacciones importadas, conciliadas (matched), pendientes de conciliar.
- **Contratos**: activos, vinculados a cliente y proyecto, vencidos.
- **Pagos Fijos**: configurados, vencidos, próximos a vencer.

Cada categoría retorna: `{ total, complete, percentage, urgentCount, pendingCount, status: 'complete' | 'good' | 'needs_attention' | 'urgent', items: DetailItem[] }`.

Score global = promedio ponderado de todas las categorías.

### 2. Componente: `src/components/dashboard/MissionControl.tsx`

Panel visual con:

- **Barra de progreso global** con porcentaje y nivel (Principiante/Organizado/Experto/Maestro)
- **Cards por categoría** — cada una muestra:
  - Barra de progreso mini
  - Pipeline visual: "X subidos → Y procesados → Z aprobados → W en uso"
  - Badges de urgencia (rojo si hay items bloqueantes, amarillo si hay pendientes)
  - Botón de acción directo a la página correspondiente
  - Detalle expandible con items específicos que necesitan atención
- **Resumen de urgencia** al final: contadores de urgente/pendiente/ok
- **"Datos no aprobados en uso"** — sección especial que detecta si hay gastos/ingresos creados desde documentos que aún no fueron aprobados/revisados, mostrando dónde se están usando (presupuesto, reportes, etc.)

Variantes: `full` (para dashboard) y `compact` (widget colapsable).

### 3. Integración en Dashboard

Agregar `MissionControl` al dashboard principal, reemplazando la necesidad de mirar múltiples widgets dispersos. Se mostrará como una sección prominente cuando el progreso sea < 90%.

## Detalle técnico

### Fuentes de datos (hooks existentes que se reutilizarán)

| Categoría | Hook existente | Datos nuevos a calcular |
|-----------|---------------|------------------------|
| Documentos | `useDocumentsForReview()` | Pipeline: pending → processed → approved |
| Gastos | `useExpenses()` + `useNudgeSystem()` | % con recibo, categoría, clasificación |
| Ingresos | `useIncome()` | % con cliente/proyecto asignado |
| Clientes | `useClients()` | Completeness promedio via `calculateClientCompleteness` |
| Banco | `useBankTransactions()` | % conciliado vs pendiente |
| Contratos | Query directa `contracts` | Activos vs vencidos |
| Pagos Fijos | `useRecurringBills()` | Pagados vs vencidos |

### Detección de "datos no aprobados en uso"

Cruzar `expenses.document_id` con `documents.review_status !== 'approved'` para detectar gastos vinculados a documentos no revisados que ya se están usando en cálculos de presupuesto/reportes.

## Archivos a crear/modificar

1. **Crear `src/hooks/utils/useMissionControl.ts`** — Hook centralizado con todas las métricas
2. **Crear `src/components/dashboard/MissionControl.tsx`** — Panel visual completo
3. **Modificar `src/pages/Dashboard.tsx`** — Integrar MissionControl en el dashboard
4. **Modificar `src/components/dashboard/MobileDashboard.tsx`** — Versión compact para móvil

