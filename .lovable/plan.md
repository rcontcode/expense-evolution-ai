## Problema

En la vista previa de **contratos** (`ContractDetailDialog`) y otras vistas de documentos:
- El modal usa `FullScreenDialog` con ancho `max-w-2xl` (~672px). En desktop el panel izquierdo (PDF) y derecho (Términos del Acuerdo) quedan apretados — el PDF muestra "No se pudo cargar el documento" porque no hay ancho suficiente, y el panel derecho corta texto.
- No existe forma de redimensionar el modal ni la división izquierda/derecha.
- `FilePreviewDialog` (en /files) usa `max-w-3xl` — también estrecho para PDFs.
- `ScanSessionHistory` usa `max-w-2xl`.
- `ReceiptPhotoViewer` ya tiene controles de zoom/rotación pero no es redimensionable libremente.

## Objetivo

Permitir al usuario **ajustar tamaño** de los modales de vista previa y dar **más espacio por defecto**, además de hacer la división izquierda/derecha (documento vs. términos) **redimensionable** mediante un panel arrastrable.

## Cambios

### 1. `FullScreenDialog` — soporte resizable + ancho mayor
- Cambiar `max-w-2xl` → `max-w-[95vw] w-[95vw]` en desktop por defecto, con `max-h-[92vh]`.
- Añadir prop opcional `resizable?: boolean` y `size?: 'md' | 'lg' | 'xl' | 'full'` para casos donde solo se necesite formulario (ContractDialog, ClientDialog mantienen tamaño actual).
- Cuando `resizable`, agregar un handle visible en la **esquina inferior derecha** (icono de flechita diagonal `GripDiagonal`) usando CSS `resize: both; overflow: auto;` aplicado al `DialogContent` con `min-w`/`min-h`/`max-w-[98vw]`/`max-h-[98vh]`.

### 2. `ContractDetailDialog` — split redimensionable
- Pasar `resizable` y `size="xl"` al `FullScreenDialog`.
- Reemplazar el `grid grid-cols-1 lg:grid-cols-2` por **`ResizablePanelGroup`** de `@/components/ui/resizable` (shadcn — ya está disponible) con dos `ResizablePanel` y un `ResizableHandle withHandle` en medio. Esto permite arrastrar la división documento/términos.
- Aumentar `min-h` del visor PDF a `min-h-[60vh]` y `pdfWidth` adaptativo (usar contenedor full width).
- En mobile mantener stacked (sin resizable).

### 3. `FilePreviewDialog` — más ancho + resizable
- Cambiar `max-w-3xl max-h-[85vh]` → `max-w-[90vw] w-[90vw] max-h-[92vh]`.
- Aplicar CSS `resize: both` con handle visible en esquina inferior derecha.
- Ajustar `pdfWidth` a `800` y permitir `max-h-[75vh]` en el preview interno.

### 4. `ReceiptPhotoViewer` — resizable cuando no está en fullscreen
- En estado normal (no fullscreen) cambiar `max-w-5xl` → `max-w-[92vw] w-[92vw]` y agregar `resize: both` con handle visual.
- Mantener el modo fullscreen existente.

### 5. `ScanSessionHistory` — ampliar
- `max-w-2xl` → `max-w-[85vw] w-[85vw]`.

### 6. Nuevo componente helper `ResizeHandle`
- Crear `src/components/ui/resize-handle.tsx`: un pequeño triángulo/grip absolute en `bottom-1 right-1` con `cursor-se-resize`, decorativo (el resize real lo hace CSS `resize: both` en el contenedor padre).
- Usado como pista visual en los diálogos resizables.

### 7. CSS global
- Añadir en `src/index.css` una utilidad `.dialog-resizable { resize: both; overflow: auto; min-width: 400px; min-height: 300px; max-width: 98vw; max-height: 98vh; }` para aplicar de forma consistente.

## Archivos a editar

- `src/components/mobile/FullScreenDialog.tsx`
- `src/components/contracts/ContractDetailDialog.tsx`
- `src/components/files/FilePreviewDialog.tsx`
- `src/components/ReceiptPhotoViewer.tsx`
- `src/components/capture/ScanSessionHistory.tsx`
- `src/components/ui/resize-handle.tsx` (nuevo)
- `src/index.css` (utilidad `.dialog-resizable`)

## Detalles técnicos

- `resize: both` en CSS funciona nativo en el navegador y muestra el handle estándar del SO en la esquina; añadimos un grip visual extra para descubribilidad.
- `ResizablePanelGroup` de shadcn ya está en el proyecto (`src/components/ui/resizable.tsx`) — confirmar antes de usar; si no, instalar via `bun add react-resizable-panels`.
- En mobile (<768px) ignoramos `resize` (queda en pantalla completa como hoy).
- No tocamos formularios (`ContractDialog`, `ExpenseDialog`, etc.) — solo modales de **vista/preview**.

## Resultado esperado

El usuario podrá:
1. Ver el PDF del contrato y los términos lado a lado con espacio adecuado por defecto (95vw).
2. Arrastrar la división central para dar más espacio al PDF o a los términos según necesite.
3. Arrastrar la esquina inferior derecha del modal para redimensionarlo libremente.
4. Mismo comportamiento en `FilePreviewDialog`, `ReceiptPhotoViewer` y `ScanSessionHistory`.
