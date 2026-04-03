

# Plan: Corregir Flujo de Detección de Duplicados

## Problemas encontrados

1. **El dialog NO bloquea el loop de procesamiento**: Cuando se suben 5 archivos, el loop `for` continua procesando el siguiente archivo aunque se abra el dialog de duplicado. El usuario no puede decidir antes de que siga procesando.

2. **Solo se guarda el ÚLTIMO duplicado**: Si el archivo 2 y el archivo 4 son duplicados, el estado (`duplicateMatches`, `duplicateDocId`) se sobreescribe con el del archivo 4. El del archivo 2 se pierde sin que el usuario lo vea.

3. **No hay feedback visual de "buscando duplicados"**: Después del OCR, la búsqueda en la DB ocurre silenciosamente. El usuario no sabe que se está verificando.

4. **El procesamiento continúa normalmente después del dialog**: Al cerrar el dialog (sin importar la acción), no hay continuación controlada del flujo. Si quedan más archivos, ya se procesaron.

---

## Solución: Sistema de cola de duplicados

### 1. `src/pages/ChaosInbox.tsx` — Cola de duplicados

En lugar de abrir el dialog inmediatamente y perder el control del loop, acumular los duplicados detectados en una **cola** (`duplicateQueue`). Al terminar el procesamiento de todos los archivos, mostrar los duplicados **uno por uno** con el dialog.

**Cambios**:
- Nuevo state: `duplicateQueue: Array<{ matches, newDoc, docId }>` en vez de states individuales
- Durante el loop: si se detecta duplicado, push a la cola (no abrir dialog)
- Al terminar el loop: si la cola tiene items, abrir dialog con el primero
- Al resolver un duplicado (keep/delete/replace): quitar de la cola y mostrar el siguiente
- Si la cola queda vacía, cerrar dialog

### 2. `src/pages/ChaosInbox.tsx` — Indicador de detección

- Agregar un estado `checkingDuplicates: boolean`
- Activarlo justo antes del `checkContent()` y desactivarlo después
- Mostrar un toast o badge "Verificando duplicados..." durante la búsqueda

### 3. `src/components/chaos/DuplicateWarningDialog.tsx` — Indicador de cola

- Agregar prop `queueCount?: number` para mostrar "1 de 3 posibles duplicados"
- Agregar prop `isChecking?: boolean` para estado de loading
- Mostrar el contador en el header: "Posible duplicado 1/3"

### 4. `src/hooks/data/useContentDuplicateDetector.ts` — Detección de contratos

- Agregar búsqueda en tabla `contracts` por `client_name` + `contract_type` + fecha
- Mejorar razones con items específicos de `line_items`

---

## Flujo corregido

```text
Usuario sube 5 archivos
  ↓
Loop: archivo 1 → OCR → check duplicados → no match → continua
Loop: archivo 2 → OCR → check → MATCH → agrega a cola → continua
Loop: archivo 3 → OCR → check → no match → continua
Loop: archivo 4 → OCR → check → MATCH → agrega a cola → continua
Loop: archivo 5 → OCR → check → no match → continua
  ↓
Loop terminado. Cola tiene 2 items.
  ↓
Abre dialog: "Duplicado 1/2" → usuario decide → siguiente
Abre dialog: "Duplicado 2/2" → usuario decide → listo
  ↓
Toast: "Procesamiento completo"
```

## Archivos afectados

| Accion | Archivo |
|--------|---------|
| Modificar | `src/pages/ChaosInbox.tsx` |
| Modificar | `src/components/chaos/DuplicateWarningDialog.tsx` |
| Modificar | `src/hooks/data/useContentDuplicateDetector.ts` |

Sin migraciones de base de datos.

