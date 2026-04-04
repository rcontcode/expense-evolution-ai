

# Plan: Controles Unificados de Zoom/Pan/Rotación para PDFs

## Problema
Los PDFs se renderizan con `react-pdf` (canvas) pero no reciben las mismas transformaciones CSS que las imágenes. El zoom, rotación y pan solo se aplican al `<img>`, no al contenedor del PDF.

## Solución
Aplicar las mismas transformaciones CSS (`transform: translate/scale/rotate`) al wrapper del `DocumentPreviewRenderer` cuando es PDF, exactamente igual que se hace con `<img>`. El PDF renderizado por react-pdf es un elemento DOM normal — se le puede aplicar `transform` sin problema.

## Cambios

### 1. `src/components/ReceiptPhotoViewer.tsx`
- Envolver el `<DocumentPreviewRenderer>` del PDF en un `<div>` con el mismo `style.transform` que usa la imagen (translate + scale + rotate).
- Mantener todos los handlers (onWheel, onMouseDown, etc.) activos para PDFs — no desactivarlos.
- El contenedor padre ya tiene `overflow: hidden`, así que el zoom+pan funcionará igual.

### 2. `src/components/capture/ReceiptReviewDialog.tsx`
- Mismo cambio: envolver el `DocumentPreviewRenderer` en un div con `transform` basado en `imageZoom`, `imageRotation`, `imagePosition`.
- Mantener handlers activos para PDFs.

### 3. `src/components/shared/DocumentPreviewRenderer.tsx`
- Sin cambios. El componente ya renderiza el PDF en canvas; las transformaciones se aplican desde afuera.

## Detalle técnico

En ambos visores, cambiar de:
```tsx
isPdfDocument ? (
  <DocumentPreviewRenderer url={...} />
) : (
  <img style={{ transform: `translate(...) scale(...) rotate(...)` }} />
)
```

A:
```tsx
isPdfDocument ? (
  <div style={{ 
    transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom}) rotate(${rot}deg)`,
    transformOrigin: 'center center',
    transition: isDragging ? 'none' : 'transform 0.15s ease-out'
  }}>
    <DocumentPreviewRenderer url={...} />
  </div>
) : (
  <img style={{ transform: ... }} />
)
```

Los controles de toolbar (zoom buttons, rotation, slider, fullscreen, download) permanecen visibles para ambos tipos.

## Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `src/components/ReceiptPhotoViewer.tsx` | Wrap PDF renderer con transform CSS |
| `src/components/capture/ReceiptReviewDialog.tsx` | Wrap PDF renderer con transform CSS |

Sin cambios de backend.

