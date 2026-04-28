# Auditoría del Modo Simple — qué falta

Después de revisar `SimpleDashboard`, `SimpleOnboardingPath`, `SimpleSparkline`, `Layout` y `Dashboard`, el dashboard quedó muy claro, **pero el flujo alrededor todavía rompe la promesa de "modo simple"**. Estos son los 6 huecos reales y cómo cerrarlos.

---

## 1. El botón "cambiar a Avanzado" no es visible en móvil

El footer del dashboard dice *"cambia a Avanzado desde el botón en el header"*, pero en móvil (390px, donde está ahora el usuario) el toggle solo existe en el sidebar de escritorio (`Layout.tsx` línea 870).

**Fix:** convertir esa frase del footer en un botón real (`Button variant="link"`) que llame directamente a `setUiMode('advanced')` desde `useDisplayPreferences`. Una sola acción, sin tener que buscar dónde está.

---

## 2. Atajos secundarios "Presupuesto" y "Banco" llevan a páginas avanzadas sin contexto

`/budget` y `/banking` son pantallas pensadas para Modo Avanzado: muestran tablas, conciliación, reglas, etc. Un usuario Simple aterriza ahí y se pierde.

**Fix:**
- Añadir un **banner ligero** en la cabecera de `Budget.tsx` y `Banking.tsx` que, cuando `uiMode === 'simple'`, muestre una explicación de 1 línea + un CTA "Volver al inicio".
- Texto presupuesto: *"Define cuánto quieres gastar por categoría. Te avisaremos al acercarte al límite."*
- Texto banco: *"Conecta o sube extractos para que tus gastos se registren solos."*

---

## 3. La captura por voz desde el empty state puede no funcionar

El chip "Voz" navega a `/capture?mode=voice`, pero hay que confirmar que `MobileCapture.tsx` lee ese parámetro y abre el modo voz automáticamente. Si no, el usuario aterriza en la pantalla de captura genérica.

**Fix:** revisar `MobileCapture.tsx`; si no existe el handler para `?mode=voice`, agregarlo para que al montar abra directamente el grabador de voz.

---

## 4. El onboarding desaparece tras 1 sola acción y no hay forma de volver a verlo

`SimpleOnboardingPath` se oculta cuando se completa **y se cierra**, sin opción de re-abrirlo. Si el usuario lo cerró por error, pierde la guía para siempre.

**Fix:**
- Añadir un pequeño botón **"Ver guía de configuración"** en el footer del dashboard cuando esté oculto pero **no** todos los pasos estén completos.
- El botón limpia el `localStorage` `simple_onboarding_completed_dismissed` y vuelve a mostrar la tarjeta.

---

## 5. La tarjeta "Educación financiera" siempre muestra el mismo tip por estado

Hoy el tip cambia según `monthlyIncome / monthlyTotal / spentPct`, pero solo hay 4 variantes. Después de unos días el usuario lo ignora.

**Fix:**
- Crear un pool de **6–8 tips por contexto** (vacío, déficit, alto gasto, saludable) en `src/data/simpleFinancialTips.ts`.
- Rotar por día (`new Date().getDate() % pool.length`) para que cada día sea fresco pero estable dentro del día.
- Mantener disclaimer "Consulta a un profesional".

---

## 6. Falta una pista de "qué pasó este mes" debajo del balance

El sparkline muestra la tendencia, pero no responde la pregunta más humana: *"¿en qué se me fue el dinero?"*.

**Fix:** debajo del sparkline (solo si hay gastos), añadir una línea compacta:

> *"Tu mayor categoría: **Comida** · {currency}320 (38%)"*

Calculado en cliente desde `expenses` agrupados por `category`. Una sola línea, sin gráfico extra, mantiene la simplicidad.

---

## Resumen de archivos a tocar

| Archivo | Cambio |
|---|---|
| `src/components/dashboard/SimpleDashboard.tsx` | Footer interactivo (cambiar a Avanzado + reabrir guía) + línea "mayor categoría" |
| `src/components/dashboard/SimpleOnboardingPath.tsx` | Exponer reset del dismissed via prop o evento custom |
| `src/pages/Budget.tsx` | Banner contextual Modo Simple |
| `src/pages/Banking.tsx` | Banner contextual Modo Simple |
| `src/pages/MobileCapture.tsx` | Soportar `?mode=voice` |
| `src/data/simpleFinancialTips.ts` | **Nuevo** — pool rotativo de tips |

## Notas técnicas

- Usar `useDisplayPreferences` (ya existe) para `setUiMode` y leer `uiMode` en las páginas Budget/Banking.
- Los banners deben ser dismissibles por sesión (`sessionStorage`) para no estorbar a quien sí entiende la pantalla.
- Mantener todas las copias en ES/EN siguiendo el patrón `language === 'es'` ya usado.
- Sin "AI" en UI — usar "guía", "consejo" o "educación financiera".

¿Apruebas y arranco con los 6 fixes?
