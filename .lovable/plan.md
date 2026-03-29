

# Corrección de Referencias a Países en Manual y Landing

## Problema

El manual menciona **RFC** (México), **NIT** (Colombia), **SIN/SSN** (USA), **IRS** (USA) en múltiples lugares. La app **solo soporta Canadá (CRA) y Chile (SII)** actualmente. Estas referencias son engañosas.

## Cambios Específicos

### `src/data/user-guide-content.ts`

| Línea | Actual | Correcto |
|-------|--------|----------|
| 457 | `RFC/NIT/RUT` | `RUT (Chile) o Business Number (Canadá)` |
| 562-563 | `CRA para Canadá, IRS para USA` | `CRA para Canadá, SII para Chile` |
| 580 | `Para otros países, las tasas se configuran...` | `Próximamente más países` |
| 1036-1037 | `RFC, RUT, NIT, SIN, SSN` | `RUT (Chile) o BN (Canadá). Más países próximamente` |
| 1041 | `RFC/RUT/NIT/SIN según el país` | `RUT o Business Number según jurisdicción` |

### Menciones genéricas correctas (NO cambiar)
- Líneas 48, 73: "múltiples países" / "multi-country" → OK, es aspiracional y ya funciona con CA+CL
- Línea 124: "diferentes negocios/países" → OK
- Sección cross-border → OK, funciona con CA↔CL

### Agregar nota de expansión futura
En la sección `business-profile`, agregar un tip: "Actualmente soportamos Canadá y Chile. Más jurisdicciones próximamente."

### `src/pages/Landing.tsx`
- Ya dice `+ países próximamente` (línea 671) → Correcto, no cambiar
- Ya muestra 🇨🇦🇨🇱 → Correcto

## Archivos a modificar

1. `src/data/user-guide-content.ts` — 5 correcciones puntuales de tax IDs/autoridades + 1 tip nuevo

