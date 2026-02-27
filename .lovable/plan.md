

## Diagnóstico: Navegación cruzada EvoFinz ↔ Fokuspark

### Estado actual — Fragmentado y confuso

Actualmente hay **7+ puntos de salida** distintos desde EvoFinz hacia Fokuspark, cada uno con diseño diferente:

```text
┌─────────────────────────────────────────────┐
│  EvoFinz → Fokuspark (actual)               │
├─────────────────────────────────────────────┤
│ 1. EcosystemQuickActions   → Grid expandible con 5 tools    │
│ 2. EcosystemPromoCard      → Banner gradiente (no-bundle)   │
│ 3. EcosystemSettingsCard   → Botón "Abrir" en Settings      │
│ 4. EcosystemHealthScore    → CTA condicional "Mejorar"      │
│ 5. EcosystemWeeklyDigest   → CTA contextual en insight      │
│ 6. EcosystemPredictiveAlerts → CTA por alerta              │
│ 7. EcosystemInlineWidgets  → Widgets embebidos (breathing/focus) │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Fokuspark → EvoFinz (actual)               │
├─────────────────────────────────────────────┤
│  ???  (probablemente un link directo a la   │
│  URL publicada, sin componente unificado)   │
└─────────────────────────────────────────────┘
```

**Problemas:**
- Demasiados botones con estilos distintos (ghost, outline, gradient) = confusión
- Todos usan `window.open(..., '_blank')` = abren pestañas nuevas sin contexto
- No hay un patrón visual unificado "voy a la otra app"
- Fokuspark no tiene un componente espejo para volver

---

### Propuesta: "Evo App Switcher" — Un componente unificado para ambas apps

La idea es crear **un solo componente visual reconocible** que funcione como un "puente" entre apps, con el mismo diseño en ambos lados.

```text
┌──────────────────────────────────────────────┐
│  🔄 Evo Ecosystem                            │
│  ┌──────────────┐  ┌──────────────┐          │
│  │ 💰 EvoFinz   │  │ 🧘 Fokuspark │          │
│  │  [activo]     │  │  Ir →        │          │
│  └──────────────┘  └──────────────┘          │
│  "Tus finanzas y bienestar, conectados"      │
└──────────────────────────────────────────────┘
```

En Fokuspark se ve idéntico pero invertido (Fokuspark activo, EvoFinz con "Ir →").

### Cambios propuestos

**Cambio 1 — Nuevo componente `EcoAppSwitcher.tsx`**

Crear `src/components/ecosystem/EcoAppSwitcher.tsx`:

- Dos "tarjetas-botón" lado a lado: EvoFinz y Fokuspark
- La app actual se muestra como **activa** (borde primary, dot verde, label "Aquí estás")
- La otra app se muestra como **link** con flecha y efecto hover con escala sutil
- Un subtítulo motivacional bilingüe debajo
- Diseño compacto: cabe en sidebar, dashboard o bottom drawer
- Accesible para Bundle y no-Bundle (no-Bundle ve versión promo simplificada)
- Props configurables: `currentApp: 'evofinz' | 'fokuspark'` para reutilizar el mismo código en ambas apps

**Cambio 2 — Nuevo archivo compartible `ecosystem-switcher-spec.ts`**

Crear una especificación exportable con:
- URLs de ambas apps
- Metadata (nombre, emoji, color, descripción corta)
- UTM params estandarizados
- Este archivo se puede copiar tal cual a Fokuspark

**Cambio 3 — Simplificar puntos de salida existentes**

- **Mantener** los CTAs contextuales (HealthScore, WeeklyDigest, PredictiveAlerts) porque son inteligentes y relevantes al momento
- **Reemplazar** `EcosystemQuickActions` por el nuevo `EcoAppSwitcher` — el grid de 5 tools es redundante con los InlineWidgets
- **Mantener** `EcosystemInlineWidgets` — estos no navegan, operan in-situ
- **Simplificar** `EcosystemSettingsCard` — reemplazar botón "Abrir" por el mini-switcher

**Cambio 4 — Integrar en el Dashboard**

Colocar el `EcoAppSwitcher` en la `EcosystemSection` como **primer elemento**, reemplazando el `EcosystemQuickActions` que está al final.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/ecosystem/EcoAppSwitcher.tsx` | **Nuevo** — Componente switcher unificado |
| `src/lib/ecosystem/app-switcher-spec.ts` | **Nuevo** — Spec compartible con Fokuspark |
| `src/components/ecosystem/EcosystemSection.tsx` | Reemplazar QuickActions por AppSwitcher al inicio |
| `src/lib/ecosystem/deeplinks.ts` | Agregar URL de EvoFinz para uso bidireccional |

### Lo que le das a Fokuspark

El archivo `app-switcher-spec.ts` y el componente `EcoAppSwitcher.tsx` se diseñan para ser **copiados directamente** a Fokuspark cambiando solo `currentApp: 'fokuspark'`. Mismos colores, misma animación, misma estructura. Experiencia espejo.

