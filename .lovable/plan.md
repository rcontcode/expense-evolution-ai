

# Migrar `.single()` a `.maybeSingle()` + Limpiar código muerto

## 1. Migrar `.single()` → `.maybeSingle()` (14 archivos)

Solo en queries SELECT de lectura donde el registro podría no existir (pre-delete audit lookups, fetches condicionales). Los `.insert().select().single()` y `.update().select().single()` se mantienen porque siempre retornan el registro creado/actualizado.

| Archivo | Línea(s) | Contexto |
|---|---|---|
| `useSavingsGoals.ts` | 95 | select before delete |
| `useNetWorth.ts` | 347, 442 | select assets/liabilities before delete |
| `useCategoryBudgets.ts` | 83 | select before delete |
| `useExpenses.ts` | 235 | select before delete |
| `useMileage.ts` | 215 | select before delete |
| `useFinancialHabits.ts` | 116 | select habit after log |
| `useTags.ts` | 76 | select before delete |
| `useFiscalEntities.ts` | 118 | select before delete |
| `useRecurringBills.ts` | 154 | select before delete |
| `useClients.ts` | 100, 128 | select before delete/report |
| `useContracts.ts` | 142 | select before delete |
| `useFinancialJournal.ts` | 106 | select before delete |
| `useIncome.ts` | 144 | select before delete |
| `useDocumentReview.ts` | 132 | select for corrections |
| `useFinancialEducation.ts` | 258, 372 | select for progress |

**Total: ~20 cambios de `.single()` → `.maybeSingle()` en 15 archivos.**

## 2. Limpiar código muerto

| Qué | Dónde | Acción |
|---|---|---|
| `connectionsDiagram` export | `user-guide-content.ts` L1334-1351 | Eliminar objeto completo (reemplazado por `DataFlowMap`) |
| `connectionsDiagram` import | `UserGuide.tsx` L13 | Quitar del import |
| `FeedbackButton` component | `FeedbackButton.tsx` | Eliminar archivo |
| `FeedbackButton` import + uso | `App.tsx` L130-132, L412-414 | Quitar lazy import y `<Suspense>` wrapper |

## Archivos a modificar (17)

**Migración `.maybeSingle()`:** 15 hooks en `src/hooks/data/`
**Limpieza:** `user-guide-content.ts`, `UserGuide.tsx`, `App.tsx`, eliminar `FeedbackButton.tsx`

