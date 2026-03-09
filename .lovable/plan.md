

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

### ✅ Gaps implementados en Fokuspark

| # | Gap | Estado |
|---|-----|--------|
| S1 | `useSubscription` ahora consulta Stripe en tiempo real via `check-subscription` | ✅ |
| S2 | Edge function `check-subscription` creada y desplegada en Fokuspark | ✅ |

### 📋 Gaps pendientes (baja prioridad)

| # | Gap | Prioridad |
|---|-----|-----------|
| S2 | Card de gestión de suscripción en Settings de Fokuspark | Media |
| S3 | Texto del Bundle podría ser más descriptivo | Baja |

---

## Análisis Comparativo de Precios EvoFinz ↔ Fokuspark

### ✅ Veredicto: No igualar precios — estructura actual es óptima

| Tier | EvoFinz | Fokuspark | ¿Igualar? | Razón |
|------|---------|-----------|-----------|-------|
| Free | $0 | $0 | ✅ Ya iguales | — |
| Premium | $6.99/mo | $7.99/mo | ❌ NO | Diferencia de $1 justificada por costos de infra (OCR/Voice) vs engagement (ondas/Calendar) |
| Pro | $14.99/mo | $14.99/mo | ✅ Ya iguales | — |
| Bundle | $14.99/mo | $14.99/mo | ✅ Ya iguales | — |

### 📋 Pendiente técnico

| # | Tarea | App | Prioridad |
|---|-------|-----|-----------|
| P1 | Crear productos Evo Bundle en cuenta Stripe de Fokuspark ($14.99/mo y $119.90/yr) | Fokuspark | Alta |

---

## Quiz Multi-App — CRM Unificado

### ✅ Completado en EvoFinz

| # | Tarea | Estado |
|---|-------|--------|
| Q1 | Columna `source` TEXT DEFAULT 'evofinz' agregada a `quiz_leads` | ✅ |
| Q2 | CRM admin actualizado: filtro por fuente (EvoFinz/Fokuspark) | ✅ |
| Q3 | LeadsTable muestra badge de fuente con colores diferenciados | ✅ |
| Q4 | LeadsExport incluye columna "Fuente" | ✅ |
| Q5 | Edge function `send-quiz-lead` acepta campo `source` | ✅ |

### 📋 Pendiente en Fokuspark

| # | Tarea | Prioridad |
|---|-------|-----------|
| Q6 | Crear quiz de productividad (10 preguntas con scoring) | Alta |
| Q7 | Formulario de captura de datos (nombre, email, etc.) | Alta |
| Q8 | Página dedicada `/quiz` con hero + resultados | Alta |
| Q9 | Edge function que guarda en `quiz_leads` con `source: 'fokuspark'` | Alta |
