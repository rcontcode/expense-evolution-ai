

# Plan: Detección Inteligente de Duplicados por Contenido (Post-OCR)

## Problema

La detección por nombre/tamaño de archivo es insuficiente. Un usuario puede subir la misma boleta con diferente nombre de archivo, o el mismo contrato escaneado dos veces. La detección real debe ocurrir **después del procesamiento de IA**, comparando el contenido extraído (vendor, monto, fecha, items) contra documentos ya existentes.

## Arquitectura: Detección en 2 capas

```text
CAPA 1: Pre-upload (rápida)          CAPA 2: Post-OCR (inteligente)
┌──────────────────────┐              ┌──────────────────────────────┐
│ file_name + file_size│              │ vendor + amount + date +     │
│ → match exacto?      │              │ line_items + client          │
│ → warning inmediato  │              │ → fuzzy matching en DB       │
│                      │              │ → dialog interactivo:        │
│                      │              │   "Este martillo $15.990 en  │
│                      │              │    Sodimac es igual al que   │
│                      │              │    subiste el 15-Mar..."     │
│                      │              │   [Duplicado] [Diferente]    │
│                      │              │   [Reemplazar]               │
└──────────────────────┘              └──────────────────────────────┘
```

## Flujo detallado

1. Usuario sube documento → **Capa 1**: check rápido por nombre/tamaño (warning simple)
2. IA procesa el documento (OCR/classify) → extrae vendor, amount, date, items, client
3. **Capa 2**: Con los datos extraídos, buscar en `documents` + `expenses` del mismo usuario:
   - Coincidencia de vendor (fuzzy) + monto exacto + fecha exacta → **Alta confianza** de duplicado
   - Coincidencia de vendor + monto pero fecha diferente → **Posible documento diferente** (preguntar)
   - Coincidencia de items específicos (ej. "martillo") + vendor + monto → **Alta confianza**
   - Contrato: mismas partes + mismo cliente → comparar fechas para distinguir versiones
4. Mostrar dialog inteligente con contexto completo antes de que el usuario apruebe

## Archivos a crear/modificar

### 1. Crear `src/hooks/data/useContentDuplicateDetector.ts`
Hook que recibe datos extraídos y busca matches en la DB:
- Query `documents` donde `extracted_data` tenga vendor/amount/date similares
- Query `expenses` con vendor + amount + date matching
- Retorna lista de posibles duplicados con nivel de confianza y razón
- Funciones de comparación fuzzy para vendors (normalize + includes)

### 2. Crear `src/components/chaos/DuplicateWarningDialog.tsx`
Dialog modal que muestra:
- El documento recién procesado (vendor, monto, fecha, items)
- El/los documento(s) existentes que coinciden
- Nivel de confianza del match (alta/media/baja)
- Razón contextual: "Mismo vendor, mismo monto, misma fecha" o "Mismo item 'martillo' en misma tienda, pero fecha diferente"
- Acciones: **Es duplicado (eliminar nuevo)**, **Son diferentes (conservar ambos)**, **Reemplazar el anterior**

### 3. Modificar `src/pages/ChaosInbox.tsx`
- Después del procesamiento IA exitoso (línea ~262-275), llamar al detector de duplicados
- Si detecta posible duplicado → abrir `DuplicateWarningDialog` antes de finalizar
- Si el usuario confirma duplicado → eliminar el documento recién subido (o el anterior si elige reemplazar)

### 4. Modificar `src/components/files/FileUploadZone.tsx`
- Agregar Capa 1: check rápido por nombre+tamaño antes de upload
- Toast warning con opción de continuar o cancelar

### 5. Crear `src/components/dashboard/DataInventoryPanel.tsx`
- Panel compacto mostrando conteos de datos del usuario (documentos, gastos, ingresos, contratos)
- Fechas de primer y último registro
- Integrar en Dashboard

## Detalle técnico de la detección post-OCR

```typescript
// Pseudo-código del detector
async function findContentDuplicates(extracted: ExtractedData, userId: string) {
  // 1. Buscar en expenses por vendor + amount + date
  const { data: expenseMatches } = await supabase
    .from('expenses')
    .select('id, vendor, amount, date, description, document_id')
    .eq('user_id', userId)
    .ilike('vendor', `%${normalizeVendor(extracted.vendor)}%`)
    .eq('amount', extracted.amount);

  // 2. Buscar en documents con extracted_data similar  
  const { data: docMatches } = await supabase
    .from('documents')
    .select('id, file_name, extracted_data, created_at')
    .eq('user_id', userId)
    .eq('status', 'classified');
  // Filtrar client-side por vendor/amount/date en extracted_data

  // 3. Scoring
  return matches.map(m => ({
    ...m,
    confidence: calculateConfidence(extracted, m),
    reason: buildReason(extracted, m), // "Mismo martillo $15.990 en Sodimac"
  }));
}
```

No requiere migraciones de base de datos. Todo usa queries existentes sobre `documents` y `expenses`.

