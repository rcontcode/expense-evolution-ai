

# Adaptar "Plan de Acción" para usuarios de otros países

## Problema

En `QuizResults.tsx`, la sección "Plan de Acción" siempre muestra "Optimizador de impuestos Canadá/Chile" y "Optimizador fiscal inteligente" — incluso cuando el usuario seleccionó un país diferente. Hay que adaptar estas líneas según el país del usuario.

## Cambio

### `src/components/quiz/QuizResults.tsx`

Hacer las listas `features` y `whyItems` dinámicas según `result.data.country`:

**features (ES):**
- Si país es Chile/Canadá: `"Optimizador de impuestos Canadá/Chile"` (actual)
- Si país es otro: `"Control financiero para cualquier país"` o similar

**features (EN):**
- Si país es Chile/Canadá: `"Tax optimizer for Canada/Chile"` (actual)  
- Si país es otro: `"Financial tracking for any country"`

**whyItems (ES):**
- Si país es otro: `"🎯 Optimizador fiscal inteligente"` → `"🎯 Control inteligente de gastos e ingresos"`

**whyItems (EN):**
- Si país es otro: `"🎯 Smart tax optimizer"` → `"🎯 Smart expense and income tracking"`

Se usa `result.data.country` (disponible en el componente) para detectar si incluye "Chile", "Canadá/Canada" o es otro país.

## Archivo a modificar (1)

1. **`src/components/quiz/QuizResults.tsx`** — Condicionar 4 strings en features/whyItems según país del usuario

