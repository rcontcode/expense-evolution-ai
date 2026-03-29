

# Mejorar Página de Etiquetas: Claridad de Uso y Ventajas

## Diagnóstico

**Dónde se usan las etiquetas actualmente:**
- Solo en `ExpenseForm.tsx` — al crear/editar un gasto hay un campo `TagSelect`
- La IA también sugiere etiquetas via `suggest-tags` edge function
- NO se usan en ingresos, contratos, ni otros formularios

**Problemas detectados:**
1. La explicación actual es un párrafo genérico — no dice DÓNDE se asignan las etiquetas
2. Los "HOW_TO_STEPS" existen pero no mencionan la ruta exacta (ej: "al crear un gasto, busca el campo Etiquetas abajo del formulario")
3. No hay link directo desde la página de Tags hacia la creación de gastos
4. No se explican ventajas concretas con ejemplos de impacto real (ej: "filtra todos los gastos deducibles para tu declaración")
5. Tags duplicados visibles en la captura (Urgent + Urgente, Recurring + Recurrente) — falta dedup o guía

## Cambios

### 1. `src/pages/Tags.tsx` — Mejorar card explicativa y pasos

**Card explicativa (línea 164-182):** Reescribir con estructura clara:
- **¿Qué son?** Una línea
- **¿Dónde se asignan?** "Al crear o editar un gasto, encontrarás el campo 'Etiquetas' en el formulario. También la IA puede sugerirlas automáticamente."
- **¿Para qué sirven? (ventajas concretas):**
  - Filtrar gastos deducibles para declaración fiscal
  - Agrupar gastos por viaje/proyecto/cliente
  - Marcar gastos pendientes de reembolso
  - Analizar patrones por etiqueta en Estadísticas
- **Acceso rápido:** Botón "Ir a crear gasto" que lleve a `/expenses` con dialog abierto

**HOW_TO_STEPS (líneas 69-101):** Mejorar descripciones con rutas exactas:
- Paso 1: "Crea etiquetas aquí con nombre y color"
- Paso 2: "Al crear/editar un gasto → campo 'Etiquetas' al final del formulario"
- Paso 3: "En la tabla de gastos usa el filtro de etiquetas para encontrar rápido"
- Paso 4: "Pestaña 'Estadísticas' aquí arriba → ve distribución y tendencias"

### 2. `src/pages/Tags.tsx` — Agregar sección "Ventajas Clave"

Nueva sección con 4 cards de ventajas concretas después de la explicación:
- 🏷️ **Clasificación personalizada** — "Las categorías son fijas, las etiquetas son tuyas"
- 🔍 **Filtrado rápido** — "Encuentra gastos de un viaje o proyecto en segundos"
- 📊 **Análisis por etiqueta** — "Descubre cuánto gastas en cada contexto"
- 🤖 **Sugerencias IA** — "La IA sugiere etiquetas automáticamente según el gasto"

### 3. `src/pages/Tags.tsx` — Alerta de duplicados

Detectar etiquetas que parecen duplicados (ej: "Urgent" y "Urgente", "Recurring" y "Recurrente") y mostrar un aviso sutil sugiriendo consolidarlas.

## Archivos a modificar (1)
1. **`src/pages/Tags.tsx`** — Reescribir card explicativa con ventajas, mejorar HOW_TO_STEPS con rutas exactas, agregar sección de ventajas clave, agregar detección de duplicados

