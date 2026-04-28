# Modo Simple = Toda la app simple

## Problemas confirmados

1. **Dashboard Simple angosto en desktop**
   `src/components/dashboard/SimpleDashboard.tsx` línea 272 usa `max-w-2xl mx-auto` (~672px). En laptop se ve como una columna móvil pegada al centro, mientras el modo Avanzado aprovecha todo el ancho de `.page-container`.

2. **Modo Simple solo aplica al Dashboard**
   El check `if (uiMode === 'simple')` solo existe en `src/pages/Dashboard.tsx`. Cuando el usuario en Modo Simple toca "Ver gastos", "Bancos", "Clientes", "Cuentas", "Reportes", etc., aterriza en la versión Avanzada completa (tablas, filtros, pestañas, jerga). Solo unas pocas páginas (`Budget`, `Banking`) muestran un banner chiquito al tope, pero el contenido sigue siendo el complejo. Eso rompe la promesa "Modo Simple".

## Lo que voy a hacer

### Parte 1 — Ancho del Dashboard Simple (rápido)

En `SimpleDashboard.tsx`:
- Quitar `max-w-2xl` y usar un layout responsive: una sola columna centrada angosta en móvil, dos columnas en laptop (acciones + saldo arriba a todo lo ancho, lista reciente + tip abajo en grid `lg:grid-cols-2`).
- Aprovechar el `.page-container` ya aplicado por `Dashboard.tsx` para igualar el ancho del modo Avanzado.
- Escalar tipografías de los números clave (`text-3xl lg:text-5xl`) para que se vea bien en pantalla grande.

### Parte 2 — Vistas Simples para las páginas principales

Crear un componente envoltorio `SimplePageGate` que, en cada página clave, decida qué renderizar según `uiMode`:

```text
uiMode === 'simple'  →  <SimpleXxx />     (vista limpia y enfocada)
uiMode !== 'simple'  →  <vista actual>    (sin tocar)
```

Páginas a las que les daré una vista Simple (las que el Dashboard Simple linkea o que un usuario simple realmente abre):

- `/expenses` → `SimpleExpenses`: lista cronológica grande con monto + comercio + categoría + un solo botón "Agregar gasto". Sin filtros avanzados, sin pestañas, sin export.
- `/income` → `SimpleIncome`: lista de ingresos del mes y botón "Agregar ingreso".
- `/bills` → `SimpleBills`: solo las próximas 5 cuentas por pagar con fecha y botón "Marcar pagado".
- `/banking` → `SimpleBanking`: saldo total + últimas 10 transacciones. Sin reconciliación, sin reglas, sin patrones.
- `/clients` → `SimpleClients`: lista de nombres con monto facturado al mes. Botón "Agregar cliente".
- `/reports` → `SimpleReports`: una tarjeta "Resumen del mes" (ingresos, gastos, saldo) y un botón "Descargar PDF". Sin tabs, sin tax hub.
- `/settings` → `SimpleSettings`: idioma, moneda, modo (Simple/Avanzado), cerrar sesión. Nada más.

Cada una vuelve a la pantalla principal Simple con un botón "← Volver" arriba y respeta el ancho del `page-container` (no `max-w-2xl`).

Páginas avanzadas (Budget, NetWorth, Investments, Projects, Reconciliation, ChaosInbox, Notifications) no tienen vista Simple — en Modo Simple no se muestran como links desde el Dashboard, y si alguien aterriza ahí por URL directa se sigue mostrando el `SimpleModePageBanner` que ya existe con un "Volver al inicio".

### Parte 3 — Navegación coherente

- Revisar `SimpleDashboard.tsx`: que todos los `navigate('/...')` apunten solo a páginas con vista Simple (las 7 de arriba).
- En el `Layout` / sidebar / bottom nav, cuando `uiMode === 'simple'` mostrar solo: Inicio, Gastos, Ingresos, Cuentas por pagar, Bancos, Clientes, Reportes, Ajustes. Esconder el resto.

## Archivos que voy a tocar

- `src/components/dashboard/SimpleDashboard.tsx` — quitar ancho fijo, layout responsive.
- `src/pages/Expenses.tsx`, `Income.tsx`, `Bills.tsx`, `Banking.tsx`, `Clients.tsx`, `Reports.tsx`, `Settings.tsx` — agregar el switch por `uiMode`.
- Nuevos: `src/components/simple/SimpleExpenses.tsx`, `SimpleIncome.tsx`, `SimpleBills.tsx`, `SimpleBanking.tsx`, `SimpleClients.tsx`, `SimpleReports.tsx`, `SimpleSettings.tsx`.
- `src/components/Layout.tsx` (o el nav que use) — filtrar items en modo Simple.

## Lo que NO voy a tocar

- La lógica del modo Avanzado, sus widgets, hooks, ni datos.
- Edge functions, base de datos, RLS.
- El `UiModeWelcomeDialog` (ya funciona).

## Verificación al terminar

1. Cambiar a Simple → el dashboard ocupa todo el ancho en laptop, no se ve como columna móvil.
2. Tocar cada botón del Dashboard Simple → la página destino también es Simple (sin tabs, sin filtros, sin jerga).
3. Cambiar a Avanzado → todo vuelve a la versión completa actual.
4. Sidebar/nav en Simple solo muestra las 8 entradas listadas.
