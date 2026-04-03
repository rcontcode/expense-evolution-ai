

# Plan: Checklist de Guía para el Usuario + Duplicados en Todos los Puntos de Entrada

## Estado actual

### Lo que SÍ está implementado:
- **Detección de duplicados**: Funciona en ChaosInbox (upload + cámara) y UnifiedChaosInboxPanel
- **TaxDocumentChecklist**: Existe pero está solo en la página Tax Optimizer — es un checklist fiscal, NO un checklist de onboarding para guiar al usuario a subir sus documentos
- **DataInventoryPanel**: Muestra conteo de datos pero sin guía activa de "qué te falta subir"

### Lo que NO está implementado:
1. **No hay checklist interactivo de onboarding** en la Bandeja del Caos que pregunte "¿qué tipos de documentos tienes?" y guíe al usuario paso a paso
2. **QuickCapture (foto/voz) NO tiene detección de duplicados** — los archivos subidos desde el dialog de captura rápida (FAB, Layout sidebar) van directo sin Layer 1 ni Layer 2
3. **FileUploadZone** tiene Layer 1 (nombre/tamaño) pero NO tiene Layer 2 (contenido post-OCR)
4. **CaptureHub** no tiene detección de duplicados

---

## Cambios

### 1. Crear `src/components/chaos/DocumentOnboardingChecklist.tsx`

Checklist interactivo que aparece en la Bandeja del Caos cuando el usuario tiene pocos documentos. Pregunta: "¿Qué documentos tienes disponibles?" con opciones seleccionables:
- Boletas/Recibos
- Facturas
- Contratos
- Extractos bancarios
- Certificados (AFP, RRSP, etc.)
- Pólizas de seguro

Al seleccionar, genera un checklist persistente (localStorage) que muestra progreso: "3/6 tipos subidos". Cada item no completado tiene un botón "Subir" que abre el uploader. Se oculta cuando todo está completo o el usuario lo descarta.

### 2. Integrar checklist en `src/pages/ChaosInbox.tsx`

- Mostrar `DocumentOnboardingChecklist` en la parte superior cuando el usuario tiene menos de 5 documentos clasificados y no ha descartado el checklist
- El checklist se actualiza automáticamente al procesar documentos (via query invalidation)

### 3. Agregar Layer 1 a `src/components/capture/QuickCapture.tsx`

- Importar `checkFilePreUpload` en la función de upload de fotos
- Antes de subir al storage, verificar nombre+tamaño duplicado
- Mostrar toast de advertencia si se detecta duplicado

### 4. Agregar Layer 2 post-OCR a `src/components/capture/QuickCapture.tsx`

- Después de procesar el recibo con IA (ya existe `processReceipt`), ejecutar `checkContent()` con los datos extraídos
- Si hay match, mostrar `DuplicateWarningDialog` antes de crear el expense
- Esto cubre el flujo: FAB → foto → OCR → duplicado?

### 5. Agregar detección en `src/components/files/FileUploadZone.tsx`

- Ya tiene Layer 1. Agregar un callback opcional `onDocumentProcessed` para que el componente padre pueda ejecutar Layer 2 cuando el documento se clasifique

---

## Archivos afectados

| Acción | Archivo |
|--------|---------|
| Crear | `src/components/chaos/DocumentOnboardingChecklist.tsx` |
| Modificar | `src/pages/ChaosInbox.tsx` |
| Modificar | `src/components/capture/QuickCapture.tsx` |
| Modificar | `src/components/files/FileUploadZone.tsx` |

Sin migraciones de base de datos. El checklist usa localStorage para persistencia del estado de selección del usuario.

