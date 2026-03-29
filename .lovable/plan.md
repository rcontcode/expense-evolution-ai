

# Fix: Reading Progress Tracker — Porcentaje Real y Funcionalidad

## Problemas Encontrados

### Bug 1: Status "In Progress" muestra 100%
En `useUpdateEducationResource`, cuando se cambia a `completed`, se fuerza `progress_percentage = 100`. Pero al volver a `in_progress`, **nunca se recalcula** el progreso real. El 100% persiste en la DB.

### Bug 2: Sin `total_pages`, el progreso no tiene sentido
Si un recurso no tiene `total_pages` definido, `progress_percentage` queda en 0 o en el último valor forzado. No hay prompt para que el usuario configure las páginas totales.

### Bug 3: `handleStatusChange` no envía datos de progreso
Solo envía `{ id, resource_type, title, status }` — no incluye `pages_read` ni `total_pages`, así que la lógica de recálculo (líneas 249-253) nunca se ejecuta.

## Plan de Corrección

### Paso 1: Fix `useUpdateEducationResource` 
**Archivo**: `src/hooks/data/useFinancialEducation.ts`
- Cuando `status === 'in_progress'`, recalcular `progress_percentage` basado en datos reales de la DB:
  - Consultar el recurso actual para obtener `pages_read`, `total_pages`
  - Si hay `total_pages > 0`: `progress = (pages_read / total_pages) * 100`
  - Si no hay `total_pages`: `progress_percentage = 0`
- Limpiar `completed_date = null` al volver a `in_progress`

### Paso 2: Fix `handleStatusChange` en FinancialEducationCard
**Archivo**: `src/components/mentorship/FinancialEducationCard.tsx`
- Pasar los datos actuales del recurso (`pages_read`, `total_pages`, `total_minutes`, `minutes_consumed`) al llamar `updateResource.mutate`, para que la lógica de recálculo funcione correctamente

### Paso 3: Prompt de `total_pages` cuando falta
**Archivo**: `src/components/mentorship/FinancialEducationCard.tsx`
- Cuando un recurso está `in_progress` y no tiene `total_pages`, mostrar un mini-form inline pidiendo las páginas totales en lugar de la barra de progreso con "0/? páginas"
- Hacer que sea fácil y rápido: un input con botón "Guardar"

### Paso 4: Validar progreso en ReadingProgressTracker
**Archivo**: `src/components/mentorship/ReadingProgressTracker.tsx`
- Si `total_pages` es 0/null, mostrar prominentemente que se necesita configurar antes de trackear
- Asegurar que el porcentaje no pueda exceder 100% visualmente

## Archivos a modificar
1. `src/hooks/data/useFinancialEducation.ts` — Recalcular progreso al cambiar a `in_progress`, limpiar `completed_date`
2. `src/components/mentorship/FinancialEducationCard.tsx` — Pasar datos completos en `handleStatusChange` + prompt de total_pages
3. `src/components/mentorship/ReadingProgressTracker.tsx` — Validación cuando falta `total_pages`

