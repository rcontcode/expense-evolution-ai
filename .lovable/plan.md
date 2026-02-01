
Contexto (qué pasa y por qué lo sientes “lento”)
- En este momento el editor está corriendo en modo “solo planificación / lectura” (no puedo escribir código todavía). Eso es exactamente lo que bloquea la implementación inmediata.
- Para destrabarlo y empezar a construir ya, haré una ejecución “por entregables visibles” (micro-fases) para que veas valor en minutos, no en sesiones largas.

Objetivo de la ejecución (en 4 entregables visibles y rápidos)
1) Búsqueda Global (Cmd/Ctrl + K) lista y usable (MVP) en una sola iteración
2) Búsqueda Global con datos (gastos / clientes / proyectos) y acciones rápidas
3) Onboarding progresivo (3 objetivos: primer gasto, primer cliente, primer ingreso)
4) Dashboard móvil optimizado + Nudges (recordatorios inteligentes, no intrusivos)

Entregable 0 (desbloqueo de modo)
- Acción requerida: vuelve a aprobar este plan (si el sistema aún no cambia a modo edición).
- Resultado esperado: el editor cambia a modo implementación y podré crear/editar archivos.

ENTREGABLE 1 — Búsqueda Global (MVP) “ya funciona” (máxima rapidez)
Qué verás
- Presionas Cmd+K (Mac) o Ctrl+K (Windows) y se abre un buscador tipo “Command Palette”.
- Incluye:
  - Navegación rápida (Dashboard, Gastos, Ingresos, Clientes, Proyectos, etc.)
  - Acciones rápidas (Captura rápida, Agregar gasto, Agregar ingreso, Agregar cliente)
- Cierra con ESC, Enter navega/ejecuta.

Decisiones para acelerar
- No haremos consultas a backend en el MVP: primero lo hacemos con navegación/acciones (cero fricción, cero RLS, cero latencia).
- Luego, en el Entregable 2, agregamos búsqueda de datos reales.

Implementación concreta (archivos)
- Crear: src/components/search/GlobalSearch.tsx
  - Basado en los componentes existentes de cmdk: src/components/ui/command.tsx
  - UI: CommandDialog + CommandInput + CommandList + CommandGroup + CommandItem
- Modificar: src/components/Layout.tsx
  - Agregar estado: globalSearchOpen
  - Agregar atajo de teclado:
    - Preferencia: reutilizar src/hooks/utils/useKeyboardShortcuts.ts (ya existe y evita disparar atajos cuando el usuario escribe en inputs).
  - Agregar un botón visible para abrir búsqueda:
    - Desktop: en la barra inferior del sidebar (donde están theme/notifications/logout) agregamos icono “Search”
    - Mobile: en el header sticky (junto a campana/hamburger) agregamos icono “Search”

Criterios de “listo”
- Cmd/Ctrl+K abre el diálogo desde cualquier página que use Layout
- No interfiere cuando el cursor está en un input/textarea
- Enter ejecuta navegación, ESC cierra

ENTREGABLE 2 — Búsqueda Global con datos reales (gastos/clientes/proyectos)
Qué verás
- Escribes “uber” y salen gastos recientes con vendor/fecha/monto
- Escribes “juan” y salen clientes y proyectos
- Resultados agrupados por tipo (Navegación / Acciones / Gastos / Clientes / Proyectos)

Decisiones para mantenerlo rápido y robusto
- Primera versión: filtrar en memoria usando hooks ya existentes:
  - useExpenses(), useClients(), useProjects()
  - Esto evita “query por tecla” y acelera entrega.
- Optimización posterior (si hace falta por volumen): pasar a búsqueda en backend con debounce.

Implementación concreta (archivos)
- Crear: src/hooks/utils/useGlobalSearch.ts
  - normalización (lowercase + quitar tildes)
  - ranking simple (startsWith > includes)
  - límites por grupo (ej: 5 resultados por tipo)
- Modificar: src/components/search/GlobalSearch.tsx
  - Mostrar resultados agrupados
  - Soportar “empty state” y “loading” (si hooks están cargando)

Criterios de “listo”
- Resultados aparecen rápido
- Seleccionar item navega o abre pantalla relevante
- Sin errores en consola

ENTREGABLE 3 — Onboarding progresivo (de tour pasivo a “misiones”)
Qué verás
- En Dashboard (y solo para usuarios nuevos), aparece un bloque claro:
  1) Registra tu primer gasto (botón “Guiarme”)
  2) Agrega tu primer cliente
  3) Registra tu primer ingreso
- Cada objetivo usa el sistema de tutorial interactivo existente (highlights + narración + autoClick si corresponde).
- Al completar cada objetivo: confirmación y celebración (confetti opcional).

Implementación concreta (archivos)
- Crear: src/hooks/utils/useOnboardingProgress.ts
  - Determinar completado (mínimo viable):
    - Si hay al menos 1 expense => objetivo 1 completo
    - Si hay al menos 1 client => objetivo 2 completo
    - Si hay al menos 1 income => objetivo 3 completo
  - Guardar “dismiss” opcional en localStorage para no molestar.
- Crear: src/components/onboarding/ProgressiveOnboarding.tsx
  - UI simple: checklist con 3 cards + botón “Guiarme”
  - Integra useTutorialRunner (ya existe) y reutiliza tutoriales de src/data/tutorials.ts
- Modificar: src/pages/Dashboard.tsx
  - Render condicional del bloque arriba del contenido, con prioridad a claridad

Criterios de “listo”
- Solo aparece para usuarios que realmente lo necesitan (nuevos)
- Un clic inicia guía real (te lleva a /expenses y resalta add-expense-button, etc.)

ENTREGABLE 4 — Dashboard móvil optimizado + Nudges
4A) Dashboard móvil optimizado
Qué verás
- En móvil, el Dashboard se vuelve mucho más “escaneable”:
  - Header compacto con 3 números clave
  - Acciones principales siempre visibles
  - Control Center avanzado colapsado y relegado a “ver más”

Implementación concreta
- Crear: src/components/dashboard/MobileDashboard.tsx
- Modificar: src/pages/Dashboard.tsx
  - Si useIsMobile() => render MobileDashboard
  - Si no => render dashboard actual

4B) Nudges
Qué verás
- Un banner inteligente (1 a la vez) que te sugiere lo más importante:
  - “Tienes X documentos sin clasificar” (CTA a /chaos)
  - “Tienes X gastos incompletos” (CTA a /expenses?incomplete=true)
  - Celebraciones ligeras cuando corresponde

Implementación concreta
- Reutilizar y extender el patrón ya existente: src/components/dashboard/NextActionBanner.tsx
  - Es el lugar natural para “prioridad + CTA”
- Crear (si hace falta separar): src/hooks/utils/useNudgeSystem.ts para reglas y cooldown
- Persistencia ligera: localStorage para cooldown/dismiss (sin cambios de base de datos en esta fase)

Criterios de “listo”
- No molesta (cooldown + dismiss)
- Siempre muestra lo más urgente

Ruta crítica (para que lo sientas rápido)
- Iteración 1: Entregable 1 completo (Cmd/Ctrl+K + UI + navegación/acciones)
- Iteración 2: Entregable 2 completo (datos reales en búsqueda)
- Iteración 3: Entregable 3 completo (onboarding progresivo)
- Iteración 4: Entregable 4 completo (móvil + nudges)

Checklist de QA (obligatorio, rápido)
- Probar Cmd/Ctrl+K en:
  - Dashboard, Gastos, Clientes, Ingresos
  - Mobile + Desktop
- Verificar que no se active atajo escribiendo en inputs
- Verificar que no hay errores en consola
- Probar que “Quick Capture” sigue funcionando (porque toca Layout)

Nota importante sobre “/”
- Actualmente la ruta “/” renderiza FinancialQuiz (App.tsx). Por eso ves “/” aunque estés logueado. Si quieres que “/” te lleve a /dashboard cuando ya estás autenticado, lo incluimos como mini-mejora adicional (muy rápida) en la primera iteración de implementación.
