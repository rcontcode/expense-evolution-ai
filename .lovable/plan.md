

# Plan: Mejoras al Sistema de Detección de Duplicados y Panel de Inventario

## Problemas actuales detectados

1. **Capa 1 (pre-upload) no está en ChaosInbox**: `handleFileUpload` no llama a `checkPreUpload` antes de subir — solo FileUploadZone lo tiene
2. **Cámara sin detección de duplicados**: `handleCameraPhotos` no ejecuta la Capa 2 post-OCR (solo `handleFileUpload` la tiene)
3. **Replace Old no elimina el expense asociado**: Solo borra el documento, pero el gasto registrado queda huérfano
4. **Delete New no limpia el storage**: Se borra el registro de DB pero el archivo queda en el bucket
5. **DataInventoryPanel muy básico**: No indica qué datos faltan ni guía al usuario sobre qué subir
6. **No hay feedback visual durante la detección**: El usuario no sabe que se está buscando duplicados

---

## Cambios

### 1. `src/pages/ChaosInbox.tsx`

**En `handleFileUpload`** (línea ~229): Agregar Capa 1 pre-upload check antes de subir cada archivo — si coincide nombre+tamaño, mostrar toast de advertencia con opción de cancelar.

**En `handleCameraPhotos`** (línea ~424): Agregar la misma lógica de Capa 2 post-OCR que ya existe en `handleFileUpload` (líneas 286-306). Actualmente las fotos de cámara no pasan por detección de duplicados.

**En `onDeleteNew`** (línea ~863): Además de borrar el document de DB, también eliminar el archivo del storage bucket (`supabase.storage.from('expense-documents').remove([filePath])`).

**En `onReplaceOld`** (línea ~870): Al reemplazar, si el match es tipo `expense`, también eliminar el expense (`supabase.from('expenses').delete().eq('id', match.id).eq('user_id', user.id)`) además del documento.

### 2. `src/components/chaos/DuplicateWarningDialog.tsx`

- Agregar un indicador de "Buscando duplicados..." (loading state) que se pueda pasar como prop
- Mejorar la visualización cuando hay múltiples matches: mostrar una lista scrollable en vez de solo el primer match
- Agregar ícono diferenciado para match tipo "expense" vs "document"

### 3. `src/hooks/data/useContentDuplicateDetector.ts`

- Agregar detección para **contratos**: comparar `client_name` + `contract_type` + `date` contra tabla `contracts`
- Mejorar `buildReason` para incluir items específicos cuando hay `line_items` (ej. "Mismo martillo $15.990 en Sodimac")
- Agregar campo `existingDate` al `DuplicateMatch` para mostrar cuándo se subió el original

### 4. `src/components/dashboard/DataInventoryPanel.tsx`

- Agregar indicadores de "qué falta": si 0 gastos → mostrar sugerencia "Sube tus boletas en la Bandeja del Caos"
- Agregar botón directo a Bandeja del Caos cuando hay datos faltantes
- Mostrar un mini progress bar de completitud (ej. 3/5 categorías con datos)

---

## Archivos afectados

| Acción | Archivo |
|--------|---------|
| Modificar | `src/pages/ChaosInbox.tsx` |
| Modificar | `src/components/chaos/DuplicateWarningDialog.tsx` |
| Modificar | `src/hooks/data/useContentDuplicateDetector.ts` |
| Modificar | `src/components/dashboard/DataInventoryPanel.tsx` |

Sin migraciones de base de datos.

