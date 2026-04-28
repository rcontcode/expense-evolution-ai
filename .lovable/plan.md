# Auditoría honesta del Dashboard

## ¿Qué está bien hoy?

- **Datos fluyen correctamente.** `useDashboardStats` calcula `monthlyIncome`, `monthlyTotal`, `monthlyTrends` y `savingsRate` con fuente única; `useExpensesRealtime` mantiene sync; los hooks centralizados (`useInvalidateRelated`) garantizan refresco cruzado tras voz/foto/manual/banco.
- **Modo Simple** cumple lo que promete: balance, contexto temporal, proyección, sparkline, top categoría, meta inline, nudge de inactividad, voz, recientes, tip diario.
- **Marca limpia.** Solo quedan menciones de "AI" en `console.error` (no visibles al usuario).
- **Mobile** tiene barra flotante 3-tap (Foto/Voz/Manual) sobre la nav.

## ¿Qué NO está bien? (problemas reales)

### 1. Modo Avanzado: el botón "Manual" del bar mobile no abre el QuickCapture
En `MobileDashboard.tsx` líneas 198-207, el botón "Manual" hace `handleAddExpense` (`navigate('/expenses')`), no abre el diálogo. **Foto y Voz hacen exactamente lo mismo** (`onQuickCapture`). El bar promete 3 modos y entrega 1.5.

### 2. Avanzado tiene 4 centros de información compitiendo
En `Dashboard.tsx` 230-313 conviven, uno tras otro: `LiveClock` → `NextActionBanner` → `DashboardNotificationHub` → `ProgressiveOnboarding` → `InteractiveWelcome` → `Quick Actions Card` → `DataInventoryPanel` → `MissionControl`. Son **8 bloques antes de ver el timeline**. Memory dice "Notification Hub es el ÚNICO centro de alertas" pero `NextActionBanner` también es un centro de acción única. Hay duplicación de propósito.

### 3. `DataInventoryPanel` + `MissionControl` se solapan
Ambos miden "qué tienes/qué te falta". `MissionControl` ya cubre readiness por feature; `DataInventoryPanel` repite el conteo desde otro ángulo. El usuario ve dos tarjetas que dicen casi lo mismo.

### 4. El Density Toggle controla solo el `space-y` del wrapper externo
Líneas 67-75 + 201: solo afecta el gap del contenedor principal. Los componentes internos (cards, paddings) no responden. Resultado: prácticamente imperceptible.

### 5. El header del dashboard avanzado no tiene "qué hacer ahora"
Hay `LiveClock` (decorativo) pero no un resumen de 1 línea: "Tienes X gastos sin categoría · Y bills esta semana · balance Z". El usuario tiene que escanear 3 widgets para entender el estado.

### 6. Modo Simple: la meta inline pide número desnudo sin contexto
Línea 486: placeholder "Ej: 200" sin sugerir un % razonable del ingreso. Un usuario con $3000 de ingreso no sabe si poner $200 o $800. Falta heurística (ej: 20% del ingreso = $600 sugerido).

### 7. `recent` en SimpleDashboard solo mira los primeros 20 expenses+income
Línea 100/110: `slice(0, 20)` antes de ordenar. Si los hooks devuelven en orden no-cronológico, el "más reciente" puede no aparecer. Bug latente cuando hay muchos datos.

### 8. SimpleDashboard no usa `useFormatCurrency` consistentemente en speakSummary
Línea 215: usa `.toFixed(0)` en vez del formateador localizado. La voz dice "3000" en vez de "tres mil pesos" / formato local.

---

## Plan de mejoras

### A. Arreglar regresiones funcionales (alta prioridad)
- **A1.** En `MobileDashboard.tsx`: separar handlers reales para Foto / Voz / Manual. Foto → `/mobile-capture`, Voz → abrir `QuickCaptureDialog` con tab voz, Manual → abrir `QuickCaptureDialog` con tab manual. Pasar prop `initialMode` al diálogo.
- **A2.** En `SimpleDashboard.tsx` líneas 98-123: ordenar **antes** de cortar. `items.sort(...).slice(0, 8)` y aumentar la fuente a 50 expenses + 50 income para no perder los más recientes.

### B. Reducir ruido en Modo Avanzado (alta prioridad)
- **B1.** Fusionar `DataInventoryPanel` + `MissionControl` en una sola tarjeta colapsable "Tu sistema" con dos pestañas internas (Inventario / Misiones). Ahorra 1 zona vertical entera.
- **B2.** Mover `ProgressiveOnboarding` + `InteractiveWelcome` a renderizado condicional **solo si onboarding incompleto**. Hoy se montan siempre y deciden internamente; ocupan espacio mental aunque no rendericen contenido.
- **B3.** Convertir `NextActionBanner` en una **chip dentro del header** ("Próxima acción: ...") en vez de tarjeta full-width. Reduce de 8 a 5 bloques antes del timeline.

### C. Header de avanzado con valor real
- **C1.** Crear un mini-resumen de 1 línea sobre `LiveClock`: "Hoy: 5 gastos sin clasificar · 2 pagos esta semana · balance +$1,240". Datos ya disponibles en `stats`, `allExpenses`, `bills`. Permite escanear el estado en 1 segundo.
- **C2.** Hacer que el toggle **Compact/Comfortable** afecte también el padding de las cards internas (pasar `density` por contexto a `MissionControl`, `DataInventoryPanel`, `Quick Actions Card`). Hoy es un placebo.

### D. Modo Simple — pulido fino
- **D1.** En la meta inline, sugerir 20% del ingreso del mes como placeholder dinámico: `Ej: ${formatCurrency(monthlyIncome * 0.2)}`. Si no hay ingreso, dejar "Ej: 200".
- **D2.** Añadir botón "Sugerir 20%" al lado del input para autollenar.
- **D3.** Usar `formatCurrency` en `speakSummary` y reemplazar números crudos por `useCountryText` para una voz natural.

### E. Limpieza final de marca
- **E1.** Cambiar los 2 `console.error('AI processing failed:', ...)` en `ChaosInbox.tsx` a `'Smart processing failed:'`. Aunque sea consola, mantiene coherencia para developers/QA.

---

## Archivos a modificar

```text
src/components/dashboard/MobileDashboard.tsx     (A1)
src/components/dashboard/SimpleDashboard.tsx     (A2, D1, D2, D3)
src/pages/Dashboard.tsx                          (B1, B2, B3, C1, C2)
src/components/dashboard/DataInventoryPanel.tsx  (B1 — wrap en tabs)
src/components/dashboard/MissionControl.tsx      (B1 — accept density prop)
src/components/dashboard/NextActionBanner.tsx    (B3 — variante chip)
src/components/dashboard/LiveClock.tsx           (C1 — slot para resumen)
src/components/dialogs/QuickCaptureDialog.tsx    (A1 — initialMode prop)
src/pages/ChaosInbox.tsx                         (E1)
```

## Riesgo

Bajo. Sin cambios de DB, sin edge functions, sin tocar archivos preconfigurados. Todo es reorganización de UI + handlers + un par de prop drillings cortos.

## Resultado esperado

- Modo Avanzado pasa de 8 bloques pre-timeline a 5, con un resumen de estado real en el header.
- Botones del bar mobile cumplen su promesa (3 modos distintos).
- Modo Simple guía la meta de ahorro con una sugerencia inteligente.
- Density toggle realmente cambia la densidad.
- Recientes siempre muestra los más recientes (no los primeros 20).
