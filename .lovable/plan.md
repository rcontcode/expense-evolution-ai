

## Auditoría Ecosistema EvoFinz ↔ Fokuspark — Progreso

### ✅ Completado en EvoFinz

| # | Tarea | Estado |
|---|-------|--------|
| F1 | Deep links corregidos — apuntan a rutas reales de Fokuspark (`/adult`, `/adult/journal`, `/adult/progress`) | ✅ |
| F5 | Leaderboard seguro — función `get_ecosystem_leaderboard()` que no expone `user_id` | ✅ |
| F6 | `EcosystemQuickActions` eliminado de `MobileDashboard` (redundante con AppSwitcher) | ✅ |
| F4 | Edge function `ecosystem-notifications` creada + cron diario 9AM UTC | ✅ |

### 🔲 Pendiente — Requiere cambios en Fokuspark

| # | Tarea |
|---|-------|
| F2 | Fokuspark debe escribir a `financial_focus_sessions` y `financial_worry_entries` |
| F3 | Sincronizar `has_bundle` — usar `user_subscriptions` como fuente de verdad |
| F8 | Capturar UTM parameters en ambas apps |
| F9 | Completar localización bilingüe en Fokuspark |

### 🔲 Pendiente — EvoFinz (menor prioridad)

| # | Tarea |
|---|-------|
| F7 | Consolidar queries del ecosistema en edge function |
| F10 | Agregar estados de error/offline para widgets |
