

# Plan: Detección Inteligente de Duplicados con Confirmación del Usuario

## Problema

El sistema actual marca automáticamente como duplicado cualquier documento con mismo monto y vendor, sin preguntar. Esto genera falsos positivos:
- **Combustible**: siempre el mismo monto, misma gasolinera, diferentes fechas
- **Comida**: dos hamburguesas del mismo valor el mismo día pero a horas diferentes
- **Suscripciones**: pagos recurrentes idénticos mensuales

La detección debe ser más inteligente y **siempre preguntar** antes de actuar.

## Cambios

### 1. `src/hooks/data/useContentDuplicateDetector.ts` — Lógica más inteligente

**Añadir campo `time` al análisis:**
- El `extracted_preview` del OCR puede incluir la hora de la boleta. Incluir `time` en la interfaz `DuplicateMatch` y en la comparación.
- Si dos documentos tienen mismo vendor+monto+fecha pero **hora diferente** (≥30 min), bajar la confianza a `low` y ajustar el motivo: "Mismo proveedor y monto pero hora diferente — probablemente compras separadas"

**Añadir campo `frequency_pattern`:**
- Si existen 3+ gastos previos con el mismo vendor y monto similar (±5%), marcar como "patrón recurrente" en vez de duplicado: confianza `low`, razón "Este proveedor tiene pagos recurrentes del mismo monto"

**Nuevo campo en `DuplicateMatch`:**
- `is_recurring_pattern: boolean` — indica si el match parece un patrón de compra recurrente
- `time?: string` — hora extraída de la boleta

**Cambio de confianza:**
- `high`: mismo vendor + monto + fecha + hora similar (o sin hora) → probablemente duplicado real
- `medium`: mismo vendor + monto + fecha diferente, sin patrón recurrente
- `low`: mismo vendor + monto pero hora diferente, O patrón recurrente detectado

### 2. `src/components/chaos/DuplicateWarningDialog.tsx` — Diálogo conversacional

Transformar el diálogo para que sea una **pregunta al usuario**, no una advertencia agresiva:

- **Título**: "🤔 Encontré algo similar" en vez de "⚠ Posible duplicado detectado"
- **Mensaje contextual** según confianza:
  - `high`: "Este documento parece ser el mismo que uno ya registrado. ¿Es duplicado?"
  - `medium`: "Encontré un registro similar. ¿Podrías confirmar si es el mismo?"  
  - `low` + recurring: "Este proveedor tiene compras frecuentes por el mismo monto. ¿Es una compra nueva o ya la tenías registrada?"
- **Mostrar hora** si está disponible en ambos documentos para facilitar la comparación
- **Botones rediseñados**:
  - "✅ Es una compra nueva — conservar" (en vez de "Son diferentes — keep both")
  - "🗑 Sí, es duplicado — eliminar" (en vez de "Es duplicado — delete new")
  - "🔄 Reemplazar el anterior" (mantener)

### 3. `src/hooks/data/useUnifiedChaosInbox.ts` — Pasar hora extraída

Al comparar documentos locales post-clasificación, incluir el campo `time` del `extracted_preview` en la comparación. Si ambos documentos tienen hora y difieren por ≥30 minutos, no marcar como duplicado automáticamente sino con confianza `low`.

## Flujo resultante

```text
Documento clasificado por IA
  ↓
¿Mismo vendor + monto que otro registro?
  ├─ SÍ + misma fecha + misma hora → confianza HIGH
  │   → "Este parece ser el mismo documento"
  ├─ SÍ + misma fecha + hora diferente → confianza LOW  
  │   → "Mismo lugar y monto pero hora diferente"
  ├─ SÍ + fecha diferente + patrón recurrente → confianza LOW
  │   → "Compra frecuente en este proveedor"
  └─ SÍ + fecha diferente sin patrón → confianza MEDIUM
      → "Registro similar encontrado, ¿confirmas?"
  ↓
SIEMPRE mostrar diálogo conversacional
El usuario decide: nueva compra / duplicado / reemplazar
```

## Archivos afectados

| Acción | Archivo |
|--------|---------|
| Modificar | `src/hooks/data/useContentDuplicateDetector.ts` |
| Modificar | `src/components/chaos/DuplicateWarningDialog.tsx` |
| Modificar | `src/hooks/data/useUnifiedChaosInbox.ts` |

Sin migraciones de base de datos.

