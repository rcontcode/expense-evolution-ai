

# Plan: Deshacer y Rehacer global (Undo/Redo) + Ctrl+Z / Ctrl+Shift+Z

## Qué se construirá

Un sistema global de Undo/Redo con:
- Botones ↩️ ↪️ visibles en el header de toda la app
- Atajos `Ctrl+Z` (deshacer) y `Ctrl+Shift+Z` (rehacer)
- Stack dual: acciones deshechas van al stack de "redo", y viceversa
- Integrado con el sistema de soft-delete existente

## Implementación

### 1. Nuevo: `src/contexts/UndoRedoContext.tsx`
Contexto global con:
- `undoStack`: array de acciones (máx 20), cada una con `{ id, descriptionEs, descriptionEn, doFn, undoFn, timestamp }`
- `redoStack`: cuando se deshace, la acción pasa aquí
- Métodos: `pushAction()`, `undo()`, `redo()`, `canUndo`, `canRedo`, `lastUndoDescription`, `lastRedoDescription`
- Auto-expiración de entradas después de 120 segundos
- Listener global de `Ctrl+Z` → `undo()` y `Ctrl+Shift+Z` → `redo()` (ignora inputs/textareas)

### 2. Modificar: `src/hooks/utils/useUndoableAction.ts`
- Importar `useUndoRedo()` del nuevo contexto
- En `showUndoToast`: además del toast, hacer `pushAction(...)` con la función de undo (restore) y la función de "redo" (re-delete)
- Así cada eliminación queda disponible tanto para el botón del header como para Ctrl+Z

### 3. Modificar: `src/components/PageHeader.tsx` → `GlobalControls`
- Agregar dos botones antes del LanguageSelector:
  - `Undo2` icon → ejecuta `undo()`, disabled si `!canUndo`
  - `Redo2` icon → ejecuta `redo()`, disabled si `!canRedo`
- Tooltip bilingüe: "Deshacer (Ctrl+Z)" / "Rehacer (Ctrl+Shift+Z)"
- Badge/pulso sutil cuando hay acción disponible

### 4. Modificar: `src/App.tsx`
- Envolver la app con `<UndoRedoProvider>` (dentro de `AuthProvider` para acceso a user)

## Archivos a modificar

1. **Nuevo: `src/contexts/UndoRedoContext.tsx`** — Contexto con stacks + keyboard listener
2. **`src/hooks/utils/useUndoableAction.ts`** — Conectar al contexto global
3. **`src/components/PageHeader.tsx`** — Botones ↩️↪️ en GlobalControls
4. **`src/App.tsx`** — Agregar `<UndoRedoProvider>`

