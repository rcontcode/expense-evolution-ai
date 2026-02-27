

## Auditoría Ecosistema EvoFinz ↔ Fokuspark — Progreso

### ✅ Completado en EvoFinz

| # | Tarea | Estado |
|---|-------|--------|
| F1 | Deep links corregidos — apuntan a rutas reales de Fokuspark (`/adult`, `/adult/journal`, `/adult/progress`) | ✅ |
| F5 | Leaderboard seguro — función `get_ecosystem_leaderboard()` que no expone `user_id` | ✅ |
| F6 | `EcosystemQuickActions` eliminado de `MobileDashboard` (redundante con AppSwitcher) | ✅ |
| F4 | Edge function `ecosystem-notifications` creada + cron diario 9AM UTC | ✅ |
| F10 | Estados de error/offline para todos los widgets del ecosistema con `EcosystemErrorFallback` | ✅ |

### ✅ Completado en Fokuspark

| # | Tarea | Estado |
|---|-------|--------|
| F2 | Fokuspark escribe a `financial_focus_sessions` y `financial_worry_entries` | ✅ |
| F3 | `has_bundle` sincronizado — lee de `user_subscriptions` | ✅ |
| F8 | Capturar UTM parameters en ambas apps — `useUtmCapture` + tabla `utm_visits` | ✅ |
| F9 | Completar localización bilingüe en Fokuspark — `EcosystemOnboarding`, `EvoFinzPromoCard` | ✅ |

### 🏁 Auditoría Ecosistema EvoFinz ↔ Fokuspark — 100% Completada (10/10 tareas)

---

## Revisión: Alineación de Suscripciones EvoFinz ↔ Fokuspark

### ✅ Confirmado: Sistema funciona correctamente

- Planes individuales (Free/Premium/Pro) son independientes por app
- Bundle compartido usa mismos Stripe Price IDs en ambas apps
- Ambos webhooks detectan Bundle y setean `has_bundle = true`
- No hay acceso cruzado no autorizado entre apps

### 📋 Gaps pendientes (a implementar en Fokuspark)

| # | Gap | Prioridad | Proyecto |
|---|-----|-----------|----------|
| S1 | `useSubscription` lee del profile estático, no consulta Stripe en tiempo real | Alta | Fokuspark |
| S2 | No hay card de gestión de suscripción en Settings | Media | Fokuspark |
| S3 | Texto del Bundle podría ser más descriptivo | Baja | Fokuspark |
| S4 | Webhook almacena en `profiles` vs `user_subscriptions` (arquitectura diferente, no bug) | Info | N/A |

### ⚠️ Estos cambios NO se hacen en EvoFinz — deben implementarse en el proyecto Fokuspark
