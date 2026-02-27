

# Auditoría Completa: Integración Ecosistema EvoFinz ↔ Fokuspark

---

## A. LO QUE FUNCIONA BIEN (Implementado y Correcto)

1. **EcoAppSwitcher bidireccional** -- Ambos proyectos tienen el componente espejo con `currentApp` correcto
2. **Stripe webhook + check-subscription** -- Detectan Bundle products y setean `has_bundle = true`
3. **Feature flags con master switch** -- `ecosystem_enabled` controla todo; ambos proyectos lo respetan
4. **EcosystemOnboarding** -- Existe en ambos lados con CTAs cruzados y persistencia localStorage
5. **EvoFinzPromoCard / EcosystemPromoCard** -- Promo para non-Bundle users en ambas apps
6. **EcosystemSection colapsable** -- Agrupa 13 widgets sin saturar el dashboard
7. **Edge function ecosystem-coaching** -- AI coaching con Gemini + fallback rules
8. **Tablas DB ecosistema** -- `ecosystem_notifications`, `ecosystem_streaks`, `ecosystem_leaderboard` con RLS

---

## B. PROBLEMAS CRÍTICOS ENCONTRADOS

### B1. Deep links rotos -- Las rutas no existen en Fokuspark
EvoFinz envía usuarios a rutas como `/tools/breathing`, `/tools/focus-timer`, `/tools/meditation`, `/tools/journal`, `/tools/worry-dump` en Fokuspark. **Ninguna de estas rutas existe en el router de Fokuspark.** El usuario llega a una página 404.

**Impacto:** Todos los CTAs de EcosystemCoaching, PredictiveAlerts, WeeklyDigest, HealthScore, Notifications, y QuickActions están rotos.

**Fix:** Crear las rutas en Fokuspark O actualizar `TOOL_PATHS` en `deeplinks.ts` para apuntar a rutas que sí existen (ej: `/adult/journal` en vez de `/tools/journal`).

### B2. Fokuspark NO escribe a las tablas compartidas
EvoFinz depende de datos en `financial_focus_sessions` y `financial_worry_entries` para EcosystemInsights, WeeklyDigest, HealthScore, Achievements, Streaks, Leaderboard. **Fokuspark no escribe a ninguna de estas tablas.** Todos los widgets de correlación mostrarán datos en cero.

**Impacto:** Todo el valor del Bundle (correlación enfoque ↔ finanzas) es inexistente.

**Fix:** Fokuspark necesita escribir a `financial_focus_sessions` al completar sesiones de enfoque y a `financial_worry_entries` al hacer worry dumps.

### B3. Fokuspark lee `has_bundle` desde `profiles` en vez de `user_subscriptions`
EvoFinz lee `has_bundle` de `user_subscriptions` (donde Stripe webhook lo escribe). Fokuspark lee `profile?.has_bundle`. Si el campo `has_bundle` no existe en la tabla `profiles` de Fokuspark, el Bundle nunca se detecta allí.

**Impacto:** El EcoAppSwitcher, onboarding y promo cards podrían no funcionar en Fokuspark si la tabla profiles no tiene `has_bundle`.

**Fix:** Sincronizar la fuente de verdad -- o agregar un trigger que copie `has_bundle` de `user_subscriptions` a `profiles`, o que Fokuspark use la misma lógica de EvoFinz.

---

## C. PROBLEMAS IMPORTANTES

### C1. No hay autenticación compartida (SSO)
Cada app tiene su propio proyecto de base de datos. Un usuario debe registrarse por separado en ambas apps. No comparten `user_id`. Esto hace imposible la correlación real de datos.

**Fix:** Implementar OAuth bridge o shared auth, o al mínimo un sistema de vinculación por email que mapee usuarios entre ambos proyectos.

### C2. `ecosystem_notifications` vacía -- Nadie la puebla
La tabla `ecosystem_notifications` existe y el componente la lee, pero no hay trigger, edge function, ni cron job que inserte notificaciones. El widget siempre estará vacío.

**Fix:** Crear un cron job o edge function que genere notificaciones basadas en actividad (ej: "Llevas 3 días sin enfoque", "Tu gasto subió 20% esta semana").

### C3. `EcosystemQuickActions` coexiste con `EcoAppSwitcher` -- Redundancia
`EcosystemQuickActions` abre herramientas de Fokuspark (las mismas deep links rotas de B1). Ya existe el `EcoAppSwitcher` que cumple la función de navegación cruzada. Además, `EcosystemQuickActions` aparece en `MobileDashboard` fuera del `EcosystemSection` colapsable, rompiendo el estándar de layout.

### C4. `EcosystemLeaderboard` -- RLS permite a todos leer todos los scores
La policy `Users can read all leaderboard entries` expone `user_id` de todos. Aunque `display_name` está anonimizado, el UUID no lo está.

**Fix:** Crear una view o function que devuelva el leaderboard sin `user_id` expuesto.

---

## D. MEJORAS PENDIENTES

### D1. Sin tracking de UTM parameters
Los links cruzados incluyen `utm_source`, `utm_medium`, `utm_campaign` pero ninguna app los captura ni registra. No hay analytics de conversión entre apps.

### D2. Localización incompleta en Fokuspark
El onboarding y promo cards en Fokuspark están hardcodeados en español. No usan el sistema bilingüe `isEs` como EvoFinz.

### D3. Sin manejo de errores offline
Los widgets del ecosistema hacen múltiples queries Supabase. Si falla la red, muestran estados de loading infinito en vez de estados vacíos graceful.

### D4. Performance -- 13 widgets = 13+ queries paralelas
Al abrir EcosystemSection, se disparan ~13 queries independientes a Supabase. Debería consolidarse en 1-2 queries backend o usar un edge function que devuelva todo.

### D5. Sin tests
No hay tests unitarios ni de integración para ningún componente del ecosistema.

---

## E. PLAN DE ACCIÓN PRIORIZADO

| # | Tarea | Severidad | Lado |
|---|-------|-----------|------|
| 1 | Corregir deep link paths en `deeplinks.ts` para que apunten a rutas reales de Fokuspark | CRÍTICO | EvoFinz |
| 2 | Implementar escritura a `financial_focus_sessions` y `financial_worry_entries` desde Fokuspark | CRÍTICO | Fokuspark |
| 3 | Resolver fuente de verdad de `has_bundle` entre ambos proyectos | CRÍTICO | Fokuspark |
| 4 | Crear cron/trigger que pueble `ecosystem_notifications` | IMPORTANTE | EvoFinz |
| 5 | Ocultar `user_id` en leaderboard (security) | IMPORTANTE | EvoFinz |
| 6 | Eliminar o refactorizar `EcosystemQuickActions` (redundante con AppSwitcher) | MENOR | EvoFinz |
| 7 | Consolidar queries del ecosistema en edge function | RENDIMIENTO | EvoFinz |
| 8 | Agregar tracking de UTM en ambas apps | MEJORA | Ambos |
| 9 | Completar localización bilingüe en Fokuspark | MEJORA | Fokuspark |
| 10 | Agregar estados de error/offline para widgets | MEJORA | EvoFinz |

---

## F. LO QUE PUEDO HACER AHORA EN EVOFINZ

De esta lista, puedo implementar directamente en este proyecto:
- **F1.** Corregir `TOOL_PATHS` en `deeplinks.ts` para apuntar a rutas válidas de Fokuspark (`/adult/journal` en vez de `/tools/journal`)
- **F4.** Crear edge function para generar `ecosystem_notifications` automáticamente
- **F5.** Crear view/function para leaderboard sin exponer `user_id`
- **F6.** Limpiar `EcosystemQuickActions` o integrarlo al `EcosystemSection`
- **F7.** Crear edge function consolidada para datos del ecosistema
- **F10.** Agregar error boundaries y estados fallback

Lo que requiere cambios en **Fokuspark** (te generaré instrucciones para pegar):
- F2, F3, F8, F9

Aprueba este plan y dime qué prioridades quieres atacar primero. Te recomiendo empezar por **F1 (deep links rotos)** ya que es lo más rápido de corregir aquí.

