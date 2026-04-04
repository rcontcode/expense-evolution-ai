
Problemas detectados y plan de corrección:

1. PDFs no visibles dentro de la app
- El visor actual usa `createSignedUrl(...)` y luego embebe esa URL firmada en un `<iframe>`.
- En tus capturas, Chrome bloquea esa URL con `ERR_BLOCKED_BY_CLIENT`, así que no es un fallo del PDF en sí: el navegador/extensión está bloqueando el dominio/ruta firmada.
- Además, el botón “Ver documentos para comparar” hace `window.open(signedUrl, '_blank')`, que cae exactamente en el mismo problema.

2. Revisión técnica encontrada
- `src/hooks/data/useDocumentUrl.ts` entrega una signed URL directa.
- `src/components/ReceiptPhotoViewer.tsx` renderiza PDFs con `<iframe src={url}>`.
- `src/components/chaos/DuplicateWarningDialog.tsx` abre documentos con `window.open(signedUrl, '_blank')`.
- `src/pages/ChaosInbox.tsx` solo permite “Buscar duplicados” en documentos pendientes/corrección; los aprobados no reciben `onCheckDuplicates`, por eso después “ya no hay forma” de relanzar la detección.

Plan de implementación

1. Cambiar la estrategia de preview de PDFs y documentos
- Dejar de depender de abrir la signed URL directamente en pestaña o iframe.
- En `useDocumentUrl`, bajar el archivo con Storage API (`download`) y convertirlo a `blob:` URL con `URL.createObjectURL(...)`.
- Devolver también el tipo MIME o inferirlo por extensión para distinguir PDF vs imagen.
- Esto evita que el navegador trate la preview como navegación externa al dominio bloqueado.

2. Arreglar el visor principal de documentos
- Actualizar `src/components/ReceiptPhotoViewer.tsx` para usar el `blob:` URL generado localmente.
- Mantener `<iframe>` o `<object>` para PDF, pero apuntando al blob local, no a la signed URL remota.
- Ajustar descarga para usar nombre real del archivo y no siempre `receipt.jpg`.
- Limpiar `objectURL` al desmontar/cambiar documento para evitar fugas de memoria.

3. Corregir “Ver documentos para comparar”
- En `src/components/chaos/DuplicateWarningDialog.tsx`, dejar de hacer `window.open(signedUrl, '_blank')`.
- Reemplazarlo por una de estas dos opciones, siguiendo el patrón más consistente con la app:
  - abrir un visor interno/modal para cada documento, o
  - descargar ambos archivos como blob URLs y abrir una vista interna comparativa.
- Recomendación: usar un diálogo interno de comparación lado a lado, porque evita popups, bloqueadores y da mejor UX para decidir duplicados.

4. Hacer que la comparación sea usable de verdad
- En el diálogo de duplicados, mostrar ambos documentos dentro de la app:
  - nuevo documento
  - documento ya existente
- Si uno es PDF y otro imagen, cada uno usa su renderer apropiado.
- Conservar arriba los metadatos comparados: proveedor, monto, fecha, hora, nombre de archivo.

5. Permitir re-ejecutar búsqueda de duplicados aun después de procesados
- En `src/pages/ChaosInbox.tsx`, pasar `onCheckDuplicates={handleCheckDuplicates}` también a `approvedDocs`.
- Revisar si conviene incluir también `rejectedDocs` o solo aprobados.
- Así el usuario podrá volver a lanzar la detección manual sobre documentos ya procesados.

6. Mejorar la detección manual para documentos ya guardados
- En `handleCheckDuplicates`, incluir también `time` cuando exista en `extracted_data`.
- Verificar que el documento actual quede excluido correctamente por `id`.
- Si hay coincidencias, abrir el mismo flujo consultivo de duplicados; si no, mostrar feedback claro de “no encontré coincidencias”.

7. Robustecer fallback y mensajes
- Si un archivo no puede previsualizarse, mostrar mensaje explícito:
  - “No pude abrir este archivo dentro de la app”
  - botón alternativo de descarga
- Si el bloqueo viene del navegador/extensión, el usuario igual podrá verlo dentro del visor interno basado en blob y no quedará enviado a una página de error.

Archivos a modificar
- `src/hooks/data/useDocumentUrl.ts`
- `src/components/ReceiptPhotoViewer.tsx`
- `src/components/chaos/DuplicateWarningDialog.tsx`
- `src/pages/ChaosInbox.tsx`

Resultado esperado
- Los PDFs vuelven a verse dentro de la app.
- “Ver documentos para comparar” ya no manda a una página bloqueada.
- Se pueden revisar visualmente los dos documentos antes de decidir.
- También podrás volver a buscar duplicados en documentos ya aprobados/procesados.

Detalles técnicos
- Causa raíz principal: uso de signed URLs como destino de navegación/iframe, bloqueadas por Chrome/extensiones (`ERR_BLOCKED_BY_CLIENT`).
- Solución más segura en frontend: `storage.download(filePath)` → `Blob` → `URL.createObjectURL(blob)`.
- Causa secundaria del flujo de duplicados: `approvedDocs` no recibe `onCheckDuplicates`, así que el botón/acción no existe para procesados.
