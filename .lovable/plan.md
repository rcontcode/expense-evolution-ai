

# Mejora de Experiencia de Usuario — Ronda UX

## Hallazgos

### 🔴 CRÍTICO — Toasts hardcodeados en español (15+ hooks)

Los hooks de datos (`useExpenses`, `useIncome`, `useProjects`, `useClients`, `useContracts`, `useMileage`, `useTags`, `useTrash`, `useDeleteFile`, `useFinancialHabits`, `useFinancialJournal`, `usePayYourselfFirst`, `useSavingsGoals`, `useWorkflowProgress`, `useBudgetAlertRules`) muestran mensajes como `'Gasto registrado'`, `'Ingreso actualizado'`, `'Proyecto creado'` **sin respetar el idioma del usuario**. Un usuario con idioma inglés ve toasts en español.

Solo 5 hooks (`useFiscalEntities`, `useDocumentReview`, `useRecurringBills`, `useRewards`, `useGenerateSampleData`) ya tienen el patrón `language === 'es' ? ... : ...`.

**Fix**: Crear un helper `useLocalizedToast()` que retorne funciones `success(es, en)` y `error(es, en)` para centralizar. Luego migrar los ~15 hooks.

---

### 🔴 `window.confirm()` — Diálogos nativos del navegador (2 lugares)

- `Files.tsx` línea 240: `window.confirm(...)` para bulk delete
- `ReceiptReviewCard.tsx` línea 177: `window.confirm(...)` para delete

Estos rompen la experiencia visual y no respetan el tema dark/light. Deben usar `AlertDialog` de ShadCN.

**Fix**: Reemplazar con `AlertDialog` modal.

---

### 🟠 Sin feedback de loading en botones de formularios

Los botones de submit en formularios muestran `isLoading` pero **no deshabilitan la interacción duplicada** consistentemente. Algunos formularios no muestran spinner visual.

**Fix**: Auditar los principales formularios y asegurar que todos muestren spinner + disabled durante submit.

---

### 🟠 Notificaciones: dismiss en mobile requiere hover

En `DashboardNotificationHub`, el botón de dismiss (X) tiene `opacity-0 group-hover:opacity-100`. En mobile no hay hover, así que el usuario **no puede descartar notificaciones individuales**.

**Fix**: Hacer visible siempre en mobile, o usar swipe-to-dismiss.

---

### 🟡 Falta de optimistic updates

Ninguna mutación usa optimistic updates. Cuando el usuario borra o edita, hay un delay visible mientras se re-fetcha. Especialmente notable en:
- Marcar notificación como leída
- Confirmar gastos al día
- Borrar items de la tabla

**Fix**: Agregar optimistic update para `markRead` en notificaciones y `deleteExpense` como mejora inicial.

---

## Plan de Implementación

### Paso 1: Crear helper `useLocalizedToast`
- Crear `src/hooks/utils/useLocalizedToast.ts`
- Funciones: `success(es: string, en: string)`, `error(es: string, en: string)`, `info(es, en)`
- Usa `useLanguage()` internamente

### Paso 2: Migrar toasts de 15 hooks a bilingüe
- `useExpenses.ts` — 6 toasts
- `useIncome.ts` — 6 toasts
- `useProjects.ts` — 8 toasts
- `useClients.ts` — 8 toasts
- `useContracts.ts` — 6 toasts
- `useMileage.ts` — 6 toasts
- `useTags.ts` — 4 toasts
- `useTrash.ts` — 6 toasts
- `useDeleteFile.ts` — 2 toasts
- `useFinancialHabits.ts` — 2 toasts
- `useFinancialJournal.ts` — 2 toasts
- `usePayYourselfFirst.ts` — 1 toast
- `useSavingsGoals.ts` — toasts
- `useWorkflowProgress.ts` — toasts
- `useBudgetAlertRules.ts` — toasts

### Paso 3: Reemplazar `window.confirm` con AlertDialog
- `Files.tsx` — crear estado `deleteConfirmOpen` + `AlertDialog`
- `ReceiptReviewCard.tsx` — crear estado + `AlertDialog`

### Paso 4: Fix dismiss buttons en mobile
- `DashboardNotificationHub.tsx` — cambiar `opacity-0 group-hover:opacity-100` por `sm:opacity-0 sm:group-hover:opacity-100` (siempre visible en mobile)

### Paso 5: Optimistic update para markRead en notificaciones
- En `DashboardNotificationHub` — usar `queryClient.setQueryData` para remover la notificación inmediatamente del UI antes de la mutación

---

## Archivos a crear/modificar

1. **CREAR** `src/hooks/utils/useLocalizedToast.ts`
2. `src/hooks/data/useExpenses.ts`
3. `src/hooks/data/useIncome.ts`
4. `src/hooks/data/useProjects.ts`
5. `src/hooks/data/useClients.ts`
6. `src/hooks/data/useContracts.ts`
7. `src/hooks/data/useMileage.ts`
8. `src/hooks/data/useTags.ts`
9. `src/hooks/data/useTrash.ts`
10. `src/hooks/data/useDeleteFile.ts`
11. `src/hooks/data/useFinancialHabits.ts`
12. `src/hooks/data/useFinancialJournal.ts`
13. `src/hooks/data/usePayYourselfFirst.ts`
14. `src/hooks/data/useSavingsGoals.ts`
15. `src/hooks/data/useWorkflowProgress.ts`
16. `src/hooks/data/useBudgetAlertRules.ts`
17. `src/pages/Files.tsx` — AlertDialog
18. `src/components/capture/ReceiptReviewCard.tsx` — AlertDialog
19. `src/components/dashboard/DashboardNotificationHub.tsx` — mobile dismiss + optimistic update

