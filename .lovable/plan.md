

# Plan: Completar el Sistema de Detección de Duplicados

## Problemas restantes

1. **UnifiedChaosInboxPanel no tiene detección de duplicados** — Es el tab principal ("unified") y procesa archivos con su propio hook (`useUnifiedChaosInbox`), sin ninguna verificación de duplicados pre-upload ni post-OCR.

2. **`checkingDuplicates` nunca se muestra en la UI** — El estado se activa/desactiva pero no hay ningún elemento visual que lo use. El usuario no sabe que se está verificando.

3. **`queuePosition` siempre es 1** — El cálculo `queuePosition={duplicateQueue.length > 1 ? 1 : undefined}` es siempre 1. Debería ser `totalInicial - queue.length + 1` para mostrar "2/3" al avanzar.

4. **El documento recién insertado puede matchear consigo mismo** — Después de insertar en `documents` y clasificar, la query de `findContentDuplicates` busca en `documents` clasificados, lo que incluye el que acaba de insertarse.

5. **Camera no tiene Layer 1** — `handleCameraPhotos` no llama a `checkPreUpload` (menor impacto porque los nombres son generados, pero por consistencia).

---

## Cambios

### 1. `src/hooks/data/useUnifiedChaosInbox.ts` — Agregar hooks de duplicados

- Importar y usar `checkFilePreUpload` en la función de upload para Layer 1
- Exponer un callback/evento post-clasificación para que el componente padre pueda ejecutar Layer 2
- O mejor: pasar el `docId` recién creado como parámetro de exclusión

### 2. `src/components/chaos/UnifiedChaosInboxPanel.tsx` — Integrar detección

- Importar `useContentDuplicateDetector`
- Agregar estados de cola (`duplicateQueue`, `duplicateDialogOpen`)
- Después de la clasificación IA exitosa, ejecutar `checkContent()` y acumular en la cola
- Renderizar `DuplicateWarningDialog` con la misma lógica de cola que ChaosInbox
- Mostrar badge "Verificando duplicados..." cuando `checkingDuplicates` está activo

### 3. `src/pages/ChaosInbox.tsx` — Fixes menores

- Agregar indicador visual de `checkingDuplicates` (badge o toast durante la búsqueda)
- Corregir `queuePosition` para que avance correctamente: usar un `queueTotal` separado que se fije al inicio
- Pasar `excludeDocId` al `findContentDuplicates` para evitar self-match

### 4. `src/hooks/data/useContentDuplicateDetector.ts` — Excluir self-match

- Agregar parámetro opcional `excludeDocId?: string` a `findContentDuplicates`
- En la query de `documents`, agregar `.neq('id', excludeDocId)` cuando se provea
- En la query de `expenses`, filtrar matches cuyo `document_id === excludeDocId`

---

## Archivos afectados

| Acción | Archivo |
|--------|---------|
| Modificar | `src/hooks/data/useUnifiedChaosInbox.ts` |
| Modificar | `src/components/chaos/UnifiedChaosInboxPanel.tsx` |
| Modificar | `src/pages/ChaosInbox.tsx` |
| Modificar | `src/hooks/data/useContentDuplicateDetector.ts` |

Sin migraciones de base de datos.

