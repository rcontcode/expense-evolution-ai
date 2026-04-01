

# Plan: Actualizar Búsqueda Global con todas las secciones y datos

## Problema
La búsqueda global (`GlobalSearch.tsx` + `useGlobalSearch.ts`) solo busca en **3 tipos de datos**: gastos, clientes y proyectos. Faltan muchas rutas y tipos de datos que existen en la app.

## Rutas/datos faltantes en la búsqueda

**Datos que no se buscan** (el hook `useGlobalSearch` no los incluye):
- Ingresos (`useIncome`)
- Facturas recurrentes (`useRecurringBills`)
- Contratos (`useContracts`)
- Kilometraje (`useMileage`)
- Etiquetas (`useTags`)
- Documentos (`useDocumentsForReview`)

**Navegación faltante en `NAVIGATION_ITEMS`:**
- `/bills` — Facturas/Bills
- `/budget` — Presupuesto
- `/analytics` — Analíticas
- `/tax-optimizer` — Optimizador Fiscal
- `/investments` — Inversiones
- `/subscriptions` — Suscripciones
- `/data-health` — Salud de Datos
- `/files` — Archivos
- `/reports` — Centro de Reportes
- `/user-guide` — Guía de Usuario
- `/tax-calendar` — Calendario Fiscal
- `/tax-report-flow` — Reporte Fiscal
- `/business-profile` — Perfil de Negocio
- `/beta-feedback` — Feedback Beta
- `/capture` — Captura Móvil

**Acciones rápidas faltantes:**
- Agregar factura/bill
- Agregar contrato
- Agregar kilometraje

## Implementación

### 1. `src/hooks/utils/useGlobalSearch.ts`
- Agregar imports: `useIncome`, `useRecurringBills`, `useContracts`, `useMileage`, `useTags`
- Expandir `SearchResult.type` para incluir: `'income' | 'bill' | 'contract' | 'mileage' | 'tag'`
- Agregar bloques de búsqueda para cada tipo de dato nuevo (mismo patrón que expenses/clients/projects)
- Retornar las 8 categorías en el resultado

### 2. `src/components/search/GlobalSearch.tsx`
- Agregar las categorías de datos nuevas al renderizado (income, bills, contracts, mileage, tags) con iconos y colores distintos
- Agregar a `NAVIGATION_ITEMS` todas las rutas faltantes (~15 rutas)
- Agregar acciones rápidas nuevas (agregar bill, contrato, kilometraje)
- Actualizar el placeholder del input para reflejar que busca en todo
- Agregar imports de iconos necesarios (`Wallet`, `Calendar`, `FileBarChart`, etc.)

## Archivos a modificar (2)
- `src/hooks/utils/useGlobalSearch.ts` — Agregar 5 fuentes de datos nuevas
- `src/components/search/GlobalSearch.tsx` — Agregar categorías de resultados, rutas y acciones faltantes

