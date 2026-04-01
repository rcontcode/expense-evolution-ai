

# Plan: Sistema de Deshacer (Undo) + Confirmaciones inteligentes

## Estado actual

### Confirmación (AlertDialog "¿Estás seguro?")
**YA tienen confirmación:**
- Eliminar gasto (ExpensesTable, ExpenseCard via table)
- Eliminar cliente (Clients.tsx)
- Eliminar kilometraje (Mileage.tsx)
- Eliminar archivo (FileDeleteDialog)
- Eliminar archivos bulk (Files.tsx)
- Vaciar papelera (Trash.tsx)
- Eliminar permanente en papelera (Trash.tsx)
- Eliminar contrato (Contracts.tsx)
- Eliminar duplicados income (IncomeDuplicatePanel)
- Eliminar gastos bulk (ExpenseBulkActions)
- Eliminar bill (BillsManager)

**NO tienen confirmación (y deberían):**
1. **Eliminar duplicado de gasto** — `handleDeleteDuplicate` en Expenses.tsx llama `deleteMutation.mutate(id)` directamente, sin diálogo
2. **Eliminar activo/pasivo** en Net Worth — LiabilitiesList tiene AlertDialog inline pero AssetsList podría no tenerlo
3. **Rechazar documento** en Chaos Inbox — `handleReject` no pide confirmación
4. **Eliminar documento** en Chaos Inbox — `handleDelete` no pide confirmación
5. **Eliminar tag** — Tags.tsx tiene confirmación pero es básica
6. **Marcar bill como pagado** — acción irreversible sin confirmación
7. **Bulk classify/assign** en gastos — cambia datos masivamente sin confirmación

### Undo (Deshacer)
**Estado actual:** Existe `ActionUndoToast` (componente) y `useVoiceConfirmation` pero el undo toast **NO se usa en ninguna parte de la app**. El componente está ahí pero nadie lo invoca. Las eliminaciones son soft-delete (van a papelera), lo cual es una forma de undo, pero el usuario no ve un "Deshacer" inmediato tras la acción.

## Plan de implementación

### 1. Hook centralizado `useUndoableAction`
**Nuevo: `src/hooks/utils/useUndoableAction.ts`**

Hook que envuelve cualquier acción destructiva con:
- Ejecuta la acción
- Muestra toast con botón "Deshacer" durante 5 segundos
- Si el usuario presiona Undo → ejecuta la función reversa
- Para soft-deletes → el undo es `restore` (ya existe en useTrash)
- Para ediciones → el undo guarda el estado anterior y lo restaura

```text
useUndoableAction() → {
  execute(action, undoAction, description) → Promise
}
```

Integra con sonner toast (ya usado en toda la app) en vez del ActionUndoToast custom.

### 2. Aplicar undo a eliminaciones soft-delete
Las siguientes acciones ya usan soft-delete (`deleted_at`), así que el undo es simplemente `UPDATE deleted_at = null`:

| Acción | Archivo | Undo |
|--------|---------|------|
| Eliminar gasto | useExpenses.ts | Restaurar `deleted_at = null` |
| Eliminar ingreso | useIncome.ts | Restaurar `deleted_at = null` |
| Eliminar cliente | useClients.ts | Restaurar `deleted_at = null` |
| Eliminar proyecto | useProjects.ts | Restaurar `deleted_at = null` |
| Eliminar contrato | useContracts.ts | Restaurar `deleted_at = null` |
| Eliminar kilometraje | useMileage.ts | Restaurar `deleted_at = null` |

Tras cada eliminación, el toast mostrará: "Gasto eliminado — [Deshacer]"

### 3. Agregar confirmación donde falta

**`src/pages/Expenses.tsx`** — `handleDeleteDuplicate`: Agregar AlertDialog antes de eliminar

**`src/pages/ChaosInbox.tsx`** — `handleDelete` y `handleReject`: Agregar confirmación para rechazar/eliminar documentos

**`src/components/bills/BillsManager.tsx`** — `handleMarkPaid`: Agregar confirmación antes de marcar como pagado (acción significativa financieramente)

**`src/components/expenses/ExpenseBulkActions.tsx`** — Bulk classify/assign: Agregar confirmación con preview del cambio

### 4. Modificar hooks de eliminación para retornar undo
En los 6 hooks de delete (expenses, income, clients, projects, contracts, mileage), modificar `onSuccess` para mostrar toast de sonner con acción de undo:

```text
toast('Gasto eliminado', {
  action: { label: 'Deshacer', onClick: () => restore(id, type) }
})
```

Esto reemplaza los toasts simples actuales por toasts con undo.

### 5. Eliminar ActionUndoToast no usado
El componente `ActionUndoToast` no se usa en ninguna parte. Eliminarlo y usar sonner directamente (ya es el sistema de toasts de toda la app).

## Archivos a modificar

1. **Nuevo: `src/hooks/utils/useUndoableAction.ts`** — Hook centralizado de undo
2. **`src/hooks/data/useExpenses.ts`** — Toast con undo en delete
3. **`src/hooks/data/useIncome.ts`** — Toast con undo en delete
4. **`src/hooks/data/useClients.ts`** — Toast con undo en delete
5. **`src/hooks/data/useProjects.ts`** — Toast con undo en delete
6. **`src/hooks/data/useContracts.ts`** — Toast con undo en delete
7. **`src/hooks/data/useMileage.ts`** — Toast con undo en delete
8. **`src/pages/Expenses.tsx`** — Confirmación para eliminar duplicado
9. **`src/pages/ChaosInbox.tsx`** — Confirmación para rechazar/eliminar documentos
10. **`src/components/bills/BillsManager.tsx`** — Confirmación para marcar pagado
11. **Eliminar `src/components/chat/ActionUndoToast.tsx`** — No usado

## Resultado

- Toda eliminación muestra toast con "Deshacer" por 5 segundos → un click restaura el registro
- Acciones riesgosas sin confirmación ahora la tienen (duplicados, documentos, pagos)
- Sistema unificado: sonner toasts con acción de undo en vez de componente custom sin usar

