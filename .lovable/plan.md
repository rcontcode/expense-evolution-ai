# Próxima ronda — Pulido final

Auditoría: el dashboard (Simple y Avanzado) ya tiene contexto temporal, proyección, voz, NextActionBanner, Momentum y zonificación. Quedan **2 frentes claros** de mejora.

---

## Frente A — Limpieza final de marca "AI/IA"

La regla Core es estricta: cero "AI/IA" en UI/marketing. Aún quedan strings visibles para el usuario en páginas clave:

**Landing pública (impacto alto, lo ven prospectos):**
- `src/pages/Landing.tsx` líneas 244-318 → reemplazar todas las menciones de "Inteligencia artificial / IA / AI" en subtítulos, taglines y bullets de los planes (EvoFinz Pro, Bundle) por "Mentoría Inteligente / Smart Mentorship", "Análisis Inteligente / Smart Analysis", "Predicciones Inteligentes / Smart Predictions", "Coaching Financiero + Mental Inteligente / Smart Financial + Mental Coaching".

**Páginas internas:**
- `src/pages/Tags.tsx` líneas 129-130, 249-250 → "Sugerencias Inteligentes / Smart Suggestions". Cambiar copy de "La IA sugiere…" a "El sistema sugiere…".
- `src/pages/ChaosInbox.tsx` líneas 680-681, 826 → "el sistema lo clasifica…" y "🧠 Analizando…" (sin "con IA").
- `src/pages/Reconciliation.tsx` línea 451 → comment "Smart Reconciliation Panel".
- `src/pages/MobileCapture.tsx` línea 146 → comment "Convert to base64 for smart processing".
- `src/pages/Status.tsx` línea 18 → "Procesamiento Inteligente / Smart Processing".
- `src/pages/admin/LeadsManagement.tsx` líneas 55, 65 → como es admin (español), usar "scoring automático e inteligencia" / "Inteligencia Smart". Mantener tono admin ES.

**Se mantienen sin cambio (por ser legales/técnicas obligatorias):**
- `src/pages/Legal.tsx` y `src/pages/Privacy.tsx` — la disclosure legal del uso de modelos de IA es **obligatoria** y debe usar el término técnico correcto. La regla de marca aplica al producto, no a documentos legales que requieren transparencia regulatoria.

---

## Frente B — 6 mejoras UX que faltan

### B1. Modo Simple — Persistencia de meta de ahorro
La meta mensual hoy se lee de `preferences`, pero falta un **CTA inline** cuando no existe. Añadir en `SimpleDashboard.tsx` un mini-input "¿Cuánto quieres ahorrar este mes?" con botón ✓ que guarde directo (sin navegar a `/settings`). Reduce 2 clics.

### B2. Modo Simple — Reacción a inactividad
Si `recent.length > 0` pero el último movimiento es >7 días atrás, mostrar microcard ámbar:
> "Hace X días que no registras. ¿Todo bien? Captura uno rápido →"

### B3. Modo Avanzado — Dashboard Density Toggle
Añadir botón en header del Dashboard "Compact / Comfortable" que controle spacing entre las 3 zonas (`space-y-3` vs `space-y-6`). Persistir en `preferences.dashboard_density`. Útil para usuarios con muchos widgets.

### B4. Mobile (390px) — Bottom Quick Actions Bar
El viewport actual del usuario es **390x843** (móvil). En `MobileDashboard.tsx`, añadir una barra fija inferior (sobre la nav) con 3 botones: 📷 Foto · 🎤 Voz · ✏️ Manual, que abran el `QuickCaptureDialog`. Un tap desde cualquier scroll position.

### B5. UiModeToggle — Eliminar el reload
Hoy `window.location.href = '/'` causa flash blanco y pierde scroll/estado. Cambiar a `navigate('/', { replace: true })` y forzar re-render con un key en el árbol del Dashboard basado en `uiMode`. Sin reload.

### B6. Empty states globales — Ilustración consistente
Páginas como `/banking`, `/budget`, `/bills` cuando están vacías muestran solo texto. Crear un componente `<EmptyStateCard>` reutilizable con ícono grande, título, subtítulo y CTA primario. Usarlo en las 3 páginas. Mejora percepción "esto está vacío pero hay algo que hacer".

---

## Detalle técnico

**Archivos a modificar:**
- `src/pages/Landing.tsx`, `Tags.tsx`, `ChaosInbox.tsx`, `Reconciliation.tsx`, `MobileCapture.tsx`, `Status.tsx`, `admin/LeadsManagement.tsx` (Frente A)
- `src/components/dashboard/SimpleDashboard.tsx` (B1, B2)
- `src/pages/Dashboard.tsx` (B3)
- `src/components/dashboard/MobileDashboard.tsx` (B4)
- `src/components/layout/UiModeToggle.tsx` (B5)

**Archivos a crear:**
- `src/components/ui/EmptyStateCard.tsx` (B6)

**Páginas a actualizar para usar EmptyStateCard:**
- `src/pages/Banking.tsx`, `src/pages/Budget.tsx`, `src/pages/Bills.tsx` (B6)

**Riesgo:** bajo. Todos los cambios son aditivos o reemplazos de copy. No toca DB, edge functions, ni archivos preconfigurados.

**Recomendación de scope:** los 2 frentes juntos son ~10 archivos. Si prefieres, podemos partir en 2 entregas:
1. **Solo Frente A** (limpieza marca, urgente porque es regla Core).
2. **Frente A + B1-B4** (alto impacto inmediato, deja B5/B6 para después).
3. **Todo** (los 2 frentes completos).

¿Cuál prefieres? Si no respondes, ejecuto la opción 3 (todo).
