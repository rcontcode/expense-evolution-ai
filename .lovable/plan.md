Sí: lo voy a corregir de raíz. No es un fallo aislado del contrato; el problema está en cómo están construidos los modales de preview y en que hoy hay 3 estrategias distintas para mostrar PDFs/fotos.

## Qué está fallando realmente

1. **El contenedor base de diálogos pelea con los previews**
   - `src/components/ui/dialog.tsx` fuerza `grid`, `overflow-y-auto`, `max-h-[85vh]` y centrado vertical con `!-translate-y-1/2`.
   - Los modales de preview intentan sobrescribir eso parcialmente, pero no todos lo hacen igual.
   - Resultado: algunos previews quedan desbordados, otros colapsan su altura y el usuario termina viendo solo el overlay negro.

2. **Hay una implementación distinta por tipo de preview**
   - `ContractDetailDialog.tsx` usa **iframe** para PDF.
   - `FilePreviewDialog.tsx` usa **DocumentPreviewRenderer** con `react-pdf`.
   - `ReceiptPhotoViewer.tsx` mezcla preview blob + transformaciones manuales.
   - Resultado: un arreglo en un preview rompe otro, y los PDFs/fotos no se comportan igual.

3. **El resize actual no es una solución robusta**
   - `.dialog-resizable` usa `resize: both`, pero eso no resuelve bien el posicionamiento ni permite mover la ventana.
   - Cuando el modal nace mal ubicado o el contenido empuja el layout, el handle deja de servir.

4. **Los cuerpos de preview no tienen una jerarquía de altura consistente**
   - Hay combinaciones de `flex-1`, `min-h-*`, `max-h-*`, `overflow-*` y wrappers transformados que hacen que PDF e imagen no siempre reciban un área visible y estable.

## Plan de solución de raíz

### 1) Crear un contenedor compartido para previews de documentos
Voy a introducir un contenedor único para previews desktop/mobile, en vez de seguir parchando cada modal por separado.

**Objetivo del contenedor compartido:**
- Desktop: ventana acotada al viewport, con posición estable.
- Header fijo.
- Body con `min-h-0` y `overflow-hidden` real.
- Footer opcional.
- **Drag real desde el header** en desktop.
- **Resize real desde la esquina** con límites mínimos/máximos y clamp al viewport.
- Mobile: comportamiento fullscreen limpio.

Esto reemplaza la dependencia actual en `dialog-resizable` para previews críticos.

### 2) Separar los previews del `DialogContent` genérico
No voy a tocar a ciegas todos los diálogos normales del sistema.

Haré una de estas dos cosas de forma controlada:
- crear una variante/shared component específica para previews, o
- extender `FullScreenDialog` para que use un modo de preview robusto.

**Importante:** los modales comunes seguirán como están; el arreglo se aplicará específicamente a contratos, archivos y fotos/documentos.

### 3) Unificar el renderer de documentos
Voy a dejar de usar `iframe` en contratos como mecanismo principal.

**Nuevo criterio único:**
- PDFs: `DocumentPreviewRenderer` / `react-pdf`.
- Imágenes: renderer consistente con `img` + contenedor estable.
- Botón de fallback: **“Abrir en nueva pestaña”** y **descargar** cuando corresponda.

Esto elimina la causa más probable de PDFs en negro/blanco por embedding inconsistente.

### 4) Migrar todas las vistas afectadas al mismo patrón
Voy a aplicar el mismo sistema a las vistas donde hoy puede repetirse el fallo:

- `src/components/contracts/ContractDetailDialog.tsx`
- `src/components/files/FilePreviewDialog.tsx`
- `src/components/ReceiptPhotoViewer.tsx`
- `src/components/capture/ReceiptReviewDialog.tsx`

Y revisaré los otros diálogos con resize para que no queden en un estado mixto:
- `src/components/capture/ScanSessionHistory.tsx`
- cualquier otro preview/document viewer que esté usando el patrón antiguo

### 5) Corregir la estructura interna de altura/scroll
En todos los previews voy a normalizar:
- wrapper exterior `flex flex-col`
- header `shrink-0`
- body `flex-1 min-h-0 overflow-hidden`
- superficie de preview con altura efectiva real
- scroll solo donde corresponde

Así evito el patrón actual donde el contenido “empuja” el modal o colapsa el área visible.

### 6) Verificación completa antes de darlo por cerrado
No lo daré por arreglado hasta comprobarlo en las vistas reales.

**Validación que haré:**
- PDF de contrato visible en desktop.
- Foto/imagen visible en desktop.
- Preview de archivos visible en desktop.
- Dialog abierto dentro del viewport en `1474x954`.
- Esquina de resize alcanzable.
- Drag del modal funcional en desktop.
- Mobile sin cortes ni solapamientos.
- Botón fallback “abrir en nueva pestaña” funcionando.

## Archivos que tocaré

- `src/components/ui/dialog.tsx` o nueva variante específica de preview
- `src/components/mobile/FullScreenDialog.tsx` o nuevo shell compartido
- `src/components/shared/DocumentPreviewRenderer.tsx`
- `src/components/contracts/ContractDetailDialog.tsx`
- `src/components/files/FilePreviewDialog.tsx`
- `src/components/ReceiptPhotoViewer.tsx`
- `src/components/capture/ReceiptReviewDialog.tsx`
- `src/index.css` (solo si queda alguna regla global realmente necesaria)

## Resultado esperado

- Se acabará el “pantallazo negro” del overlay sin contenido visible.
- PDFs y fotos cargarán con el mismo motor visual y el mismo layout estable.
- Los previews dejarán de depender de hacks distintos por pantalla.
- En desktop vas a poder **mover** y **redimensionar** el modal sin que se salga de la pantalla.
- Quedará solucionado de forma transversal, no solo en el preview de contratos.

## Nota técnica

No veo indicios de que el problema sea del backend o de las URLs firmadas; lo que encontré apunta a un problema de **arquitectura de layout/renderizado** en frontend. Por eso el arreglo correcto es unificar el sistema de preview, no seguir parchando un archivo cada vez.