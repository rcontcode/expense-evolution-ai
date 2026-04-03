

# Plan: Corregir botón "Subir" del Checklist y unificar con Subida Inteligente

## Problema

El botón "Subir" de cada item del checklist ejecuta `fileInputRef.current?.click()`, que apunta al `<input>` del tab "Centro de Revisión" (receipts). Cuando el usuario está en el tab "Subida Inteligente" (unified), ese input puede no estar renderizado en el DOM, por lo que **no pasa nada**.

Además, hay dos flujos de subida completamente separados:
- **Tab "Subida Inteligente"** (UnifiedChaosInboxPanel): tiene su propio `DropZone` con input y su propio pipeline de clasificación IA
- **Tab "Centro de Revisión"**: tiene el `fileInputRef` con `handleFileUpload` que sube + procesa con `process-receipt`

El checklist apunta al segundo, pero el usuario por defecto está en el primero.

## Solución

### `src/pages/ChaosInbox.tsx`

1. **Cambiar `onUploadClick`** para que en vez de hacer click en el `fileInputRef` oculto, **cambie al tab "unified"** y haga scroll hacia la zona de upload del `UnifiedChaosInboxPanel`
2. Alternativamente, y más simple: mover el `<input type="file">` y la lógica de `handleFileUpload` **fuera de los tabs**, para que siempre esté disponible en el DOM sin importar el tab activo

**Enfoque elegido**: Opción 2 — mover el `<input ref={fileInputRef}>` fuera de `TabsContent`, justo antes de `<Tabs>`. Así el click del checklist siempre funciona. Además, al terminar la subida, cambiar automáticamente al tab "receipts" para que el usuario vea sus documentos pendientes de revisión.

### `src/components/chaos/DocumentOnboardingChecklist.tsx`

Sin cambios funcionales. El botón ya llama `onUploadClick?.()` correctamente.

## Resultado

- El botón "Subir" del checklist siempre abre el selector de archivos sin importar el tab activo
- Tras subir, el usuario se redirige al Centro de Revisión donde puede ver el resultado
- La Subida Inteligente (UnifiedChaosInboxPanel) sigue funcionando independiente con su propia DropZone

## Archivos afectados

| Acción | Archivo |
|--------|---------|
| Modificar | `src/pages/ChaosInbox.tsx` |

