

# Plan: Resumen Bancario en Dashboard + Persistencia de Documentos en Chaos Inbox

## Problemas Identificados

1. **No hay resumen bancario en el Dashboard principal**: El `BankTransactionSummary` y `BankImportHistory` solo viven en `/banking`. El dashboard (`/index`) no muestra ningún resumen de transacciones bancarias, ingresos detectados, gastos recurrentes ni totales procesados.

2. **Documentos en Chaos Inbox**: Los documentos ya se persisten correctamente en la tabla `documents` con `review_status` (pending_review, approved, rejected). Al volver a la página, `useDocumentsForReview()` los carga desde Supabase. **Sin embargo**, si el usuario percibe que "desaparecen", puede ser porque la UI filtra por estado y no muestra claramente los ya procesados vs pendientes.

## Solución

### 1. Nuevo widget `BankingSummaryCard` en Dashboard (nuevo componente)
Widget compacto para el dashboard principal que muestre:
- Total transacciones importadas / clasificadas / pendientes
- Ingresos detectados (total + conteo)
- Gastos detectados (total + conteo)  
- Pagos recurrentes identificados (conteo)
- Última importación (fecha + fuente)
- Botón "Ver detalle" → navega a `/banking`

Ubicación: en la sección "resumen" del Dashboard, después del MonthDetailPanel, y en MobileDashboard en la misma zona.

### 2. Mejorar visibilidad en Chaos Inbox
- Agregar tabs o filtro visual que muestre: "Pendientes (X)" | "Procesados (X)" | "Todos (X)"
- Los documentos procesados deben verse con badge verde "✓ Procesado" 
- Mostrar un mini-resumen arriba: "X documentos pendientes, Y procesados, Z rechazados"
- Asegurar que al volver a la página se muestren todos los estados, no solo pendientes

### 3. Historial de procesamiento en Chaos Inbox
- Mostrar un registro colapsable de las sesiones de escaneo (usando `scan_sessions` si existe o creando un log simple)
- Cada entrada muestra: fecha, cantidad procesada, aprobados/rechazados

## Archivos a Modificar/Crear

| Archivo | Cambio |
|---------|--------|
| `src/components/banking/BankingSummaryCard.tsx` | **NUEVO** — Widget compacto para dashboard |
| `src/pages/Dashboard.tsx` | Agregar `BankingSummaryCard` lazy-loaded en sección resumen |
| `src/components/dashboard/MobileDashboard.tsx` | Agregar `BankingSummaryCard` en mobile |
| `src/pages/ChaosInbox.tsx` | Agregar tabs de filtro (Pendientes/Procesados/Todos) + mini-resumen de conteos arriba |

## Detalle Técnico

**BankingSummaryCard**: Reutiliza `useBankTransactions()` existente para calcular stats (clasificados vs pendientes, income vs expense totals, recurring count). Query a `bank_import_sessions` para última importación. Renderiza un `Card` compacto con grid de stats y link a `/banking`.

**Chaos Inbox tabs**: Usar los arrays ya computados (`pendingDocs`, `approvedDocs`, `needsCorrectionDocs`, `rejectedDocs`) para renderizar tabs con conteo. Estado `activeFilter` por defecto en "Pendientes" si hay pendientes, sino "Todos". Los documentos procesados se muestran con badge de estado y no desaparecen.

