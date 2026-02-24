

# Plan de Implementacion: Evo Ecosystem Fase 1

## Punto de Restauracion

Antes de cualquier cambio, el estado actual del proyecto queda como punto de restauracion. Si algo sale mal, puedes volver a este mensaje usando el boton "Restore" en el historial del chat.

---

## Paso 1: Migracion de Base de Datos

### 1a. Tabla `feature_flags`
- Columnas: `id` (uuid PK), `flag_key` (text unique), `enabled` (boolean default true), `label` (text), `description` (text), `category` (text default 'general'), `updated_at` (timestamptz default now()), `updated_by` (uuid)
- RLS: authenticated users SELECT; admins INSERT/UPDATE/DELETE (via `public.is_admin(auth.uid())`)
- Datos iniciales: 8 flags del ecosistema pre-poblados

### 1b. Columna `has_bundle` en `user_subscriptions`
- `ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS has_bundle BOOLEAN DEFAULT false`

### 1c. Tabla `financial_focus_sessions`
- Columnas: `id`, `user_id`, `session_type` (text), `duration_minutes` (int), `completed` (bool), `xp_awarded` (int default 0), `created_at` (timestamptz)
- RLS: users solo ven/crean sus propios registros

### 1d. Tabla `financial_worry_entries`
- Columnas: `id`, `user_id`, `content` (text), `worry_category` (text default 'general'), `released` (bool default false), `converted_to_journal` (bool default false), `created_at` (timestamptz)
- RLS: users solo ven/crean/actualizan/eliminan sus propios registros

---

## Paso 2: Hook `useFeatureFlags`

Archivo nuevo: `src/hooks/data/useFeatureFlags.ts`
- Query a `feature_flags` con React Query (staleTime 2 min)
- `isEnabled(flagKey)`: si master switch `ecosystem_enabled` esta OFF, retorna false para todo `ecosystem_*`
- `hasBundleAccess`: lee `user_subscriptions.has_bundle` del usuario actual
- `updateFlag(flagKey, enabled)`: para el panel admin
- `flags`: mapa completo

---

## Paso 3: Panel Admin `FeatureFlagManager`

Archivo nuevo: `src/components/admin/FeatureFlagManager.tsx`
- Lista de toggles agrupados por categoria
- Master switch `ecosystem_enabled` destacado (borde rojo cuando OFF)
- Cada toggle actualiza DB con toast de confirmacion

Modificacion: `src/pages/Settings.tsx`
- Importar lazy `FeatureFlagManager`
- Agregarlo en seccion admin existente

---

## Paso 4: Componentes de Bienestar (5 archivos nuevos)

### `src/components/ecosystem/FinancialBreathingExercise.tsx`
- Respiracion 4-7-8 con animacion circular y mensajes financieros
- Gateado por `isEnabled('ecosystem_breathing')` + plan Premium

### `src/components/ecosystem/FinancialFocusTimer.tsx`
- Timer Pomodoro: Revision (15m), Planificacion (25m), Estudio (50m)
- Persiste en `financial_focus_sessions`, otorga XP
- Gateado por `isEnabled('ecosystem_focus_timer')` + plan Premium

### `src/components/ecosystem/FinancialWorryDump.tsx`
- Prompts financieros, categorias, max 20 entradas
- Opcion "convertir en reflexion" (integra con financial_journal)
- Gateado por `isEnabled('ecosystem_worry_dump')` + plan Premium

### `src/components/ecosystem/UnifiedQuoteBanner.tsx`
- Fusion de 50+ frases financieras + 28 universales
- Sin Bundle: solo frases EvoFinz. Con Bundle: todas
- Seleccion contextual por hora y ruta

### `src/components/ecosystem/EcosystemPromoCard.tsx`
- Cross-promo hacia Fokuspark solo si NO tiene Bundle
- Deep link con UTM tracking

---

## Paso 5: Constantes de Frases Unificadas

Archivo nuevo: `src/lib/constants/unified-quotes.ts`
- Merge sin duplicados (~78 frases)
- Helper `getContextualQuote(route, timeOfDay, hasBundleAccess)`

---

## Paso 6: Integracion en Mentorship

Modificacion: `src/pages/Mentorship.tsx`
- Nuevo tema `wellbeing` en `MENTOR_THEMES`
- Nueva tab "Bienestar" (icono cerebro) en `MENTOR_TABS` (grid pasa a 6 columnas)
- Tab visible si `isEnabled('ecosystem_wellbeing_tab')`
- Contenido: UnifiedQuoteBanner + grid con los 3 componentes de bienestar

---

## Paso 7: Instrucciones para Fokuspark

Al final de la implementacion se entregaran las instrucciones completas listas para copiar y pegar en Fokuspark, incluyendo:
- Crear tabla `feature_flags` con los mismos flags `ecosystem_*`
- Agregar `has_bundle` en su tabla de perfiles/suscripciones
- Integrar frases financieras de EvoFinz cuando `has_bundle === true`
- Crear `EvoFinzPromoCard` inverso
- Stripe webhook para detectar productos Bundle

---

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| Migracion DB (4 cambios en 1 migracion) | Crear |
| `src/hooks/data/useFeatureFlags.ts` | Crear |
| `src/components/admin/FeatureFlagManager.tsx` | Crear |
| `src/components/ecosystem/FinancialBreathingExercise.tsx` | Crear |
| `src/components/ecosystem/FinancialFocusTimer.tsx` | Crear |
| `src/components/ecosystem/FinancialWorryDump.tsx` | Crear |
| `src/components/ecosystem/UnifiedQuoteBanner.tsx` | Crear |
| `src/components/ecosystem/EcosystemPromoCard.tsx` | Crear |
| `src/lib/constants/unified-quotes.ts` | Crear |
| `src/pages/Mentorship.tsx` | Modificar (nueva tab) |
| `src/pages/Settings.tsx` | Modificar (panel admin) |

