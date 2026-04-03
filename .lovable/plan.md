

# Plan: Manejo de Documentos No Reconocidos + Feedback Visual de Status de Subida

## Problemas

1. **Documentos "unknown"**: Cuando la IA no reconoce un documento, se guarda silenciosamente como "Sin clasificar" sin avisar al usuario. Debería mostrar un mensaje claro: "No reconozco este documento, ¿quieres eliminarlo o indicarme qué es?"
2. **Sin feedback visual de progreso**: Al subir un archivo desde el tab "Centro de Revisión", no hay indicación visible de que se recibió, se está procesando, o se clasificó. El usuario no sabe qué está pasando.

## Cambios

### 1. `src/components/chaos/UnifiedChaosInboxPanel.tsx` — Alerta para documentos "unknown"

En el `DocumentCard`, cuando `classification.document_type === 'unknown'` y el status es `classified`:
- Mostrar un bloque visual destacado (borde naranja/amarillo) con mensaje: "No reconozco este tipo de documento. ¿Quieres eliminarlo o indicarme qué es para intentar procesarlo?"
- Dos acciones: 
  - **"Eliminar"** → llama `onRemove`
  - **"Cambiar tipo"** → enfoca/abre el dropdown de reclasificación existente
- Ocultar el botón "Procesar" cuando es `unknown`, ya que no tiene sentido procesarlo sin clasificación

### 2. `src/hooks/data/useUnifiedChaosInbox.ts` — Toast para unknown

Después de clasificar, si `document_type === 'unknown'`:
- Mostrar toast de advertencia: "⚠️ No pudimos identificar [nombre]. Revísalo e indícanos qué tipo es."
- En vez del toast genérico de éxito

### 3. `src/pages/ChaosInbox.tsx` — Feedback visual de progreso en tab Revisión

Agregar un componente `UploadProgressToast` inline (no solo toasts efímeros) que muestre:
- **Recibido**: "📥 archivo.pdf recibido" (aparece al iniciar upload)
- **Subiendo**: "⬆️ Subiendo..." con spinner
- **Procesando IA**: "🧠 Analizando con IA..." con spinner
- **Clasificado**: "✅ Clasificado como [tipo]" o "⚠️ No reconocido"

Implementar como un estado `uploadProgress` con fases, que se renderiza encima de la lista de documentos pendientes. Se auto-oculta después de 5 segundos del último paso.

### 4. `src/pages/ChaosInbox.tsx` — Manejo post-OCR de unknown

Cuando `process-receipt` devuelve datos pero la clasificación es `unknown` o no tiene `vendor`/`amount` significativos:
- Mostrar toast persistente de advertencia
- Marcar el documento con un badge especial en la lista de pendientes

## Archivos afectados

| Acción | Archivo |
|--------|---------|
| Modificar | `src/components/chaos/UnifiedChaosInboxPanel.tsx` |
| Modificar | `src/hooks/data/useUnifiedChaosInbox.ts` |
| Modificar | `src/pages/ChaosInbox.tsx` |

Sin migraciones de base de datos.

