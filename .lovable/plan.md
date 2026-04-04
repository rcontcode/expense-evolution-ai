
Objetivo: corregir de raíz la previsualización de PDFs en la Bandeja del Caos y en la comparación de duplicados.

Problema real
- Las imágenes sí se ven, pero los PDFs no.
- Ya no parece ser un problema de URL firmada solamente: ahora el fallo restante está en cómo se intenta renderizar el PDF dentro de la app.
- Hoy el código sigue usando el visor nativo del navegador con `<object>` / `<iframe>` para PDFs en varios puntos. En este entorno embebido eso es frágil y está cayendo al fallback.
- Además, la normalización del Blob está incompleta: si Storage devuelve un `Blob` con `type` incorrecto pero no vacío (por ejemplo `application/octet-stream`), el código lo acepta tal cual y no lo corrige a `application/pdf`.

Do I know what the issue is?
Sí.
El problema es doble:
1. `useDocumentReview.ts` y `useDocumentUrl.ts` solo corrigen el MIME cuando `blob.type` viene vacío, no cuando viene incorrecto.
2. Aunque el Blob sea correcto, la UI sigue dependiendo del renderizador PDF nativo del navegador (`<object>/<iframe>`), que en este preview embebido está fallando. Por eso las fotos se ven y los PDFs no.

Archivos donde está el problema
- `src/hooks/data/useDocumentReview.ts`
- `src/hooks/data/useDocumentUrl.ts`
- `src/components/capture/ReceiptReviewDialog.tsx`
- `src/components/chaos/DuplicateWarningDialog.tsx`
- `src/components/ReceiptPhotoViewer.tsx`
- `src/components/capture/ReceiptReviewCard.tsx`

Plan de corrección
1. Unificar la carga de documentos
- Consolidar la lógica de preview para que todas las vistas usen una sola fuente de verdad.
- Hacer que el hook devuelva al menos: `blob`, `objectUrl`, `mimeType`, `fileName`, `isLoading`, `error`.
- Corregir la normalización MIME así:
  - si el archivo es `.pdf`, forzar `application/pdf` aunque el Blob venga con tipo genérico;
  - no depender de `blob.type` si contradice la extensión o el `file_type`.

2. Dejar de usar el visor PDF nativo del navegador
- Reemplazar `<object>` / `<iframe>` para PDFs por un renderizador JavaScript basado en PDF.js (por ejemplo `react-pdf`).
- Esto renderiza páginas en canvas dentro de React y evita depender del plugin PDF del navegador, que es justo lo que está fallando aquí.
- Mantener imágenes con `<img>` normal.

3. Crear un renderer compartido de documentos
- Crear un componente reutilizable tipo `DocumentPreviewRenderer`.
- Comportamiento:
  - imagen: muestra `<img>`
  - PDF: muestra página 1 renderizada con PDF.js
  - loading: skeleton/spinner claro
  - error: mensaje explícito + botón descargar
- Así se evita tener 3 implementaciones distintas del mismo problema.

4. Aplicar el renderer en todos los puntos rotos
- `ReceiptReviewDialog`: visor principal del documento.
- `DuplicateWarningDialog`: comparación visual lado a lado dentro de la app.
- `ReceiptPhotoViewer`: visor genérico.
- `ReceiptReviewCard`: miniatura real del PDF en la tarjeta, en vez de solo icono “PDF listo para revisar”.

5. Mejorar UX de PDFs
- En tarjetas: mostrar miniatura de la primera página.
- En diálogo de revisión: mostrar el PDF de forma visible y estable.
- En comparación de duplicados: mostrar ambos documentos dentro del modal.
- Siempre dejar botón de descarga como fallback, pero ya no como única salida.

6. Verificación específica
- Probar un PDF en:
  - tarjeta del inbox
  - modal “Revisar documento”
  - modal “Ver documentos para comparar”
- Confirmar que:
  - ya no aparece “No pude mostrar este PDF dentro de la app” para PDFs válidos;
  - el preview funciona sin abrir pestañas externas;
  - imágenes siguen funcionando igual.

Sin cambios de backend
- No requiere migraciones ni cambios en base de datos.
- Es una corrección 100% frontend.

Detalles técnicos
- Bug actual en hooks:
  - hoy se usa lógica tipo `blob.type ? blob : new Blob(...)`
  - eso falla cuando el tipo existe pero es incorrecto
- Solución robusta:
  - inferir MIME por extensión/nombre
  - si es PDF, recrear Blob con `type: 'application/pdf'`
  - renderizar con PDF.js, no con `<object>` / `<iframe>`
- Motivo:
  - el visor PDF nativo del navegador no es confiable en este preview embebido; PDF.js sí lo es porque no depende del plugin del navegador.

Resultado esperado
- Los PDFs se verán dentro de la app igual que las imágenes.
- La comparación de duplicados mostrará ambos documentos sin errores.
- Ya no dependeremos de hacks de `iframe`, `object`, signed URLs o comportamiento del navegador para PDF.
