# Demo Studio: Seeder + REC Mode + Guiones

Construir una herramienta interna de admin para cargar/limpiar datos de ejemplo con un click, ocultar tu identidad real durante grabaciones, y tener los guiones listos cuando vayas a grabar.

## Qué se entrega

### 1. Edge Function `manage-demo-data`
Una sola función con 3 acciones:
- **`seed`**: inserta los datos del escenario elegido en TU usuario (admin), prefijando todo con `[DEMO]` en `notes` o campos equivalentes.
- **`reset`**: borra todos los registros que matcheen `[DEMO]%` de tus tablas (expenses, incomes, bills, bank_transactions, contracts, notes, tags relacionados).
- **`status`**: cuenta cuántos registros demo tienes activos por tabla.

Validaciones:
- Solo ejecutable por usuarios con rol `admin` (usa `has_role`).
- Usa `service_role` internamente para evitar problemas de RLS, pero siempre filtra por el `user_id` del admin que llama.
- Respeta el patrón `Deno.serve` nativo (regla de memoria).

### 2. Escenarios embebidos (2)
JSON dentro de la edge function, dinámicos por fecha (todos relativos a `now()`):

**Escenario A — "María Profesional" (caso ordenado)**
- 3 cuentas bancarias (corriente, ahorro, tarjeta crédito)
- 45 transacciones bancarias últimos 60 días
- 12 gastos categorizados (arriendo, supermercado, gasolina, suscripciones)
- 4 ingresos (sueldo x2, freelance x2)
- 3 facturas recurrentes detectadas (Netflix, Spotify, Gym)
- 2 contratos analizados (arriendo, seguro auto)
- 1 entidad fiscal (Chile, SII)

**Escenario B — "Carlos Caos" (caso Chaos Inbox)**
- 30 transacciones bancarias sin clasificar
- 8 gastos duplicados (3 grupos de duplicados detectables)
- 5 notas de voz pendientes de procesar
- 2 recibos OCR sin asociar
- Transacciones recurrentes ocultas (mismo monto/comercio cada mes para que el detector las encuentre en vivo)

### 3. Panel admin `/admin/demo-studio`
Página simple en español (regla: admin UI es ES estricto):
- Card con estado actual (cuántos registros demo activos)
- Selector de escenario (A o B)
- Botón "Cargar escenario" (con confirmación)
- Botón "Limpiar todo demo" (con confirmación destructiva)
- Toggle "REC Mode" persistente (guarda en localStorage)
- Link a la documentación de uso

Acceso: solo visible si `is_admin = true`. Ruta protegida.

### 4. REC Mode
Implementación ligera sin tocar componentes existentes:
- Hook `useRecMode()` que lee localStorage + emite evento.
- Componente `<RecModeOverlay />` montado en `App.tsx` que aplica clase global `rec-mode` al `<body>`.
- CSS global en `index.css`:
  - `.rec-mode [data-pii="email"] { filter: blur(6px); }`
  - `.rec-mode [data-pii="name"]::after { content: "Demo User"; }` (o reemplazo via JS)
  - `.rec-mode [data-pii="id"] { filter: blur(4px); }`
- Floating button (FAB) bottom-right SOLO visible para admins, toggle ON/OFF con indicador rojo "● REC".
- Marcar campos sensibles existentes con `data-pii="..."` en: header de usuario, perfil, settings. (Cambios mínimos, ~5 archivos).

### 5. Documentación `/mnt/documents/demo-studio/`
- `README.md`: cómo usar el Demo Studio paso a paso (cargar, grabar, limpiar).
- `pre-recording-checklist.md`: checklist antes de cada grabación (REC Mode ON, escenario cargado, navegador en modo limpio, resolución, etc.).
- **5 guiones** (uno por video) en archivos separados:
  1. `01-tour-general-90s.md`
  2. `02-chaos-inbox-2min.md`
  3. `03-bank-master-truth-90s.md`
  4. `04-voice-capture-60s.md`
  5. `05-reports-tax-hub-2min.md`
  
  Cada guion incluye: timestamps acumulados, voiceover ES + EN, acciones de click exactas, escenario requerido (A o B), notas de edición visual.

- `EvoFinz-Guiones-Videos-v1.pdf`: compilado profesional de los 5 guiones.

## Cómo lo vas a usar (flujo)

1. Vas a `/admin/demo-studio`.
2. Eliges escenario (A para tour ordenado, B para chaos inbox/duplicados).
3. Click "Cargar escenario" → espera confirmación (~5s).
4. Activas REC Mode con el FAB rojo.
5. Grabas siguiendo el guion correspondiente desde `/mnt/documents/demo-studio/`.
6. Al terminar: click "Limpiar todo demo" → tu cuenta vuelve al estado original.

## Detalles técnicos

**Sin migración de DB**: usamos convención `notes LIKE '[DEMO]%'` para identificar registros. Cero cambios al schema. Si en el futuro quieres limpiar manual desde DB: `DELETE FROM expenses WHERE user_id = '...' AND notes LIKE '[DEMO]%'` (y equivalente por tabla).

**Fechas dinámicas**: el seeder calcula fechas relativas a `now()` para que cada vez que cargues el escenario las transacciones se vean "frescas" (últimos 60 días).

**Idempotencia**: el botón seed primero hace un reset interno antes de insertar, para evitar acumulación si lo presionas dos veces.

**Tablas afectadas por seeder/reset** (a confirmar al implementar):
`expenses`, `incomes`, `bills`, `bank_accounts`, `bank_transactions`, `contracts`, `notes`, `categories` (solo si se crean nuevas con prefijo `[DEMO]`), `fiscal_entities`.

**REC Mode no toca datos**: solo es CSS + atributos `data-pii`. Tus datos reales nunca se modifican; solo se enmascaran visualmente.

**Costo estimado**: ~1 edge function nueva, ~3 archivos nuevos en frontend (`/admin/demo-studio/page.tsx`, hook, FAB), ~5 archivos editados para añadir `data-pii`, generación de PDFs y .md de guiones. Mucho más barato que el alcance "Completo" original.

## Lo que NO se hace (intencional)
- No se crean tablas nuevas en DB.
- No se tocan los componentes de captura, listas, ni dashboards existentes (más allá de añadir `data-pii` a 5 campos de identidad).
- No se embebe el visor de guiones dentro de la app (los lees desde `/mnt/documents/`).
- No se generan vídeos automáticos ni música de fondo.

## Próximo paso después de aprobar
Entro a build mode y entrego en este orden:
1. Edge function + escenarios.
2. Página admin + hook REC Mode + FAB.
3. `data-pii` en campos sensibles.
4. Documentación + 5 guiones + PDF en `/mnt/documents/demo-studio/`.
5. Te explico cómo probarlo end-to-end en un mensaje final.
