

# Plan: Corregir el botón "Subir" del Checklist

## Problema

En la línea 439, al hacer click en "Subir", se ejecutan dos acciones simultáneamente:
1. `onUploadClick()` — abre el diálogo de subida
2. `markCompleted(sub.id)` — marca el subtipo como completado

Esto significa que **al presionar "Subir" se marca como completado sin haber subido nada**. El botón debería solo abrir la zona de subida, y la marca de completado debería ocurrir cuando realmente se suba y clasifique un documento de ese tipo.

## Solución

### `src/components/chaos/DocumentOnboardingChecklist.tsx`

**Cambio en el botón "Subir"** (línea 439):
- Eliminar `markCompleted(sub.id)` del onClick
- El botón solo debe llamar `onUploadClick?.()` para abrir la zona de subida

**Agregar detección automática de completado**:
- Recibir un nuevo prop `uploadedTypes: string[]` (lista de tipos de documentos que el usuario ya ha subido, extraídos de `documents.extracted_data.document_type` y `documents.extracted_data.category`)
- En un `useEffect`, comparar `uploadedTypes` contra `selectedSubtypes` y marcar automáticamente como completados los que coincidan
- Esto hace que el check aparezca solo cuando realmente se haya subido un documento de ese tipo

### `src/pages/ChaosInbox.tsx`

- Pasar al checklist la lista de tipos ya subidos, derivada de la query de documentos existente (la misma data que usa `DocumentStatsBar`)
- Extraer los tipos de `documents.extracted_data` y pasarlos como `uploadedTypes`

## Resultado

- "Subir" solo abre la zona de upload
- El check verde aparece automáticamente cuando la IA clasifica un documento como ese tipo
- Si el usuario ya tiene documentos de ese tipo, aparecen marcados desde el inicio

## Archivos afectados

| Acción | Archivo |
|--------|---------|
| Modificar | `src/components/chaos/DocumentOnboardingChecklist.tsx` |
| Modificar | `src/pages/ChaosInbox.tsx` |

