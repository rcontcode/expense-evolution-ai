# Mejoras pendientes — Modo Simple y Modo Avanzado

Auditoría de los dos dashboards y los flujos que los rodean. Ordenado por impacto real para el usuario.

---

## SIMPLE — 3 huecos restantes

### S1. El balance es del **mes en curso**, pero no se entiende cuál día estamos
El usuario ve "Balance del mes" en `+1.200` pero no sabe si es día 3 (gran margen) o día 28 (peligroso). Una línea pequeña con **"Día 17 de 30"** + barra de avance del mes le da contexto inmediato sin saturar.

**Cambio:** dentro del hero card, añadir línea pequeña debajo del balance: *"Día 17 de 30 · quedan 13 días"*.

---

### S2. Acciones recientes no son accionables
Hoy "Movimientos recientes" lista los últimos 8, pero **no se puede tap-to-edit**. Si el usuario ve un gasto mal categorizado, no tiene forma de arreglarlo desde aquí.

**Cambio:** cada `<li>` se vuelve `<button>` que navega a `/expenses?edit=<id>` o `/income?edit=<id>` con un chevron a la derecha indicando interactividad.

---

### S3. Los "atajos secundarios" (Presupuesto/Banco) están desperdiciados
Para un usuario Simple, lo más útil debajo de las acciones primarias **no es** Presupuesto/Banco, sino:
- **Bills (Cuentas por pagar)** — qué viene esta semana
- **Capturar foto rápido** — ya está, pero como atajo persistente

**Cambio:** reemplazar atajos secundarios por:
- **Próximos pagos** (`/bills`) — con badge del número de bills vencen en 7 días
- **Mi presupuesto** — solo si ya configuró uno; si no, mostrar **"Conectar banco"** que es más valioso

---

## AVANZADO — 5 huecos reales

### A1. Hay "AI" visible en UI — viola política de marca
El proyecto tiene regla **"No AI Branding"** pero estos componentes lo muestran al usuario:

| Archivo | Texto |
|---|---|
| `FinancialAutopilot.tsx` L98 | *"Autopiloto Financiero IA"* / *"AI Financial Autopilot"* |
| `FinancialAutopilot.tsx` L115 | *"AI analyzes your financial patterns…"* |
| `SmartMonthlyReport.tsx` L154,295 | *"Análisis IA Personalizado"* |
| `FamilyMonthlyAnalysis.tsx` L951,1637,1951 | *"IA analiza patrones"*, *"Análisis de Patrones IA"*, *"💡 Recomendaciones IA"* |
| `Dashboard.tsx` L276 (comment) | `{/* AI Financial Autopilot */}` |

**Cambio:** sustituir por *"Autopiloto Financiero Inteligente"*, *"Análisis Inteligente"*, *"Patrones detectados"*, *"Recomendaciones personalizadas"* (admin queda igual — la regla aplica a UI de usuario).

---

### A2. Dashboard Avanzado en escritorio = **muro de widgets** sin jerarquía
El return en `Dashboard.tsx` carga 9 secciones seguidas (LiveClock, NotificationHub, Onboarding, QuickActions, DataInventory, MissionControl, Tabs, Timeline+Detail, Banking, Narrative, Ecosystem, Workflows+Bills, Alerts, Autopilot, Gamification). Es cansado de escanear.

**Cambio:** agrupar en **3 zonas con cabeceras semánticas claras** (sin tocar la lógica):
1. **"Hoy"** — LiveClock + NotificationHub + QuickActions
2. **"Tu mes"** — Tabs + Timeline + MonthDetail + Narrative + Banking
3. **"Tu sistema"** — Ecosystem + Workflows + Bills + Alerts + Autopilot + Gamification

Cabeceras tipo `<h2 class="section-title">` con `<hr>` sutil. No es reorganizar, es **etiquetar** lo que ya existe.

---

### A3. **MobileDashboard avanzado no tiene el botón "cambiar a Simple"**
Igual que el problema que arreglamos en Simple para móvil: el toggle vive en sidebar de escritorio. Un usuario avanzado en móvil que se siente abrumado **no tiene forma fácil de bajarse a Simple**.

**Cambio:** añadir botón en el footer del `MobileDashboard.tsx` *"¿Demasiado? Cambiar a Modo Simple"* que llame `setUiMode('simple')`.

---

### A4. `QuickActions` del avanzado es genérico — no refleja contexto
Los 4 botones (Upload, Expense, Client, Export) son los mismos siempre, aunque el usuario ya tenga 0 clientes (¿por qué export?) o 500 gastos (¿por qué tan visible "addExpense"?).

**Cambio mínimo y seguro:**
- Si **no hay** clientes → mostrar "Agregar cliente" con highlight `border-primary`
- Si **hay** ≥1 bill venciendo en 3 días → reemplazar "Exportar" por "Pagar próximas cuentas" (`/bills`)
- Si **no hay** ningún gasto este mes → highlight el botón de Capturar

Sin reescribir el bloque, solo lógica de prioridad.

---

### A5. `DashboardNotificationHub` vs `ProactiveAlertsWidget` — duplicación
Ambos viven en el dashboard avanzado y muestran "alertas". El usuario no sabe a cuál hacer caso. La memoria del proyecto dice **"NotificationHub es THE ONLY alert center"** pero `ProactiveAlertsWidget` sigue montado en línea 271-273.

**Cambio:** mover el contenido de `ProactiveAlertsWidget` a una pestaña dentro de `DashboardNotificationHub` (o eliminarlo si está duplicado). Necesito leer ambos primero antes de decidir cuál absorbe a cuál.

---

## Archivos a tocar

| Tarea | Archivos |
|---|---|
| S1 día del mes | `src/components/dashboard/SimpleDashboard.tsx` |
| S2 click en recientes | `src/components/dashboard/SimpleDashboard.tsx` |
| S3 atajos relevantes | `src/components/dashboard/SimpleDashboard.tsx` |
| A1 limpieza "AI" | `FinancialAutopilot.tsx`, `SmartMonthlyReport.tsx`, `FamilyMonthlyAnalysis.tsx`, `Dashboard.tsx` |
| A2 zonas semánticas | `src/pages/Dashboard.tsx` (solo wrappers + h2) |
| A3 toggle a Simple en móvil | `src/components/dashboard/MobileDashboard.tsx` |
| A4 QuickActions contextuales | `src/pages/Dashboard.tsx` |
| A5 dedupe alertas | leer ambos antes; probable consolidación en `DashboardNotificationHub.tsx` |

## Notas

- Todo ES/EN siguiendo `language === 'es'` — sin "AI" en UI usuario.
- A2 y A4 son los de mayor impacto; A1 cierra una deuda con la política de marca.
- **No** toco lógica de datos — solo presentación + 1 navegación nueva en S2.

¿Apruebas los 8 cambios? Si quieres priorizar solo algunos (p.ej. arrancar con A1+A2+A3 y dejar S1-S3 para después), dime cuáles.
