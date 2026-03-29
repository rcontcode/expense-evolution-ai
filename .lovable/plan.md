

# Fix: Textos Invisibles en Resultados del Quiz

## Problema
La variante `compact` de `UrgencyBanner` usa `text-orange-600 dark:text-orange-400`. En el quiz (fondo siempre oscuro), si `dark` no está en `<html>`, se renderiza `text-orange-600` (oscuro sobre oscuro = invisible).

## Cambio

**`src/components/landing/UrgencyBanner.tsx` (línea 103)**
- Cambiar `text-orange-600 dark:text-orange-400` → `text-orange-400`

## Revisión de QuizResults.tsx
Revisé las 852 líneas de `QuizResults.tsx` — todos los textos ya usan colores explícitos claros (`text-white`, `text-white/90`, `text-amber-400`, `text-emerald-400`, etc.). No hay otros casos del patrón `dark:` problemático. Solo el `UrgencyBanner` necesita fix.

## Archivo a modificar
1. `src/components/landing/UrgencyBanner.tsx` — 1 línea

