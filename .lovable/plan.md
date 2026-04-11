

# Eliminar Confetti Global y Condicionarlo a Gamificación

## Situación Actual

- **23 archivos** usan `canvas-confetti` en toda la app
- Ya existe un toggle en **Configuración > Preferencias > Celebraciones y Logros** que activa/desactiva gamificación (`gamification_enabled`)
- Pero el toggle **solo controla** el `GamificationCelebration` modal — no controla el confetti directo que se dispara en docenas de componentes
- Confetti aparece al abrir dashboard, al cambiar slides en beta features, al crear proyectos/clientes, al completar onboarding, al capturar gastos, etc.

## Plan

### 1. Crear hook centralizado `useConfetti`
Un wrapper sobre `canvas-confetti` que **verifica** si gamificación está habilitada antes de disparar. Todos los componentes usarán este hook en lugar de importar `confetti` directamente.

### 2. Eliminar confetti de acciones NO gamificadas
Estas acciones **nunca** deberían tener confetti (son acciones rutinarias):
- `BetaFeatures.tsx` — cambiar slides
- `ProgressiveOnboarding.tsx` — completar onboarding
- `ConversationalOnboarding.tsx` — finalizar chat
- `ClientDialog.tsx` — crear/eliminar cliente
- `ProjectDialog.tsx` — crear proyecto
- `UpgradePrompt.tsx` — upgrade de plan
- `ControlCenterTour.tsx` — tour guiado
- `MobileCapture.tsx` — capturar gasto
- `SampleDataOfferStep.tsx` — generar data ejemplo

### 3. Condicionar confetti a gamificación activa
Estos sí pueden tener confetti, pero **solo si gamificación está activada**:
- `MiniCelebration.tsx` — mini celebraciones XP/streak
- `GamificationCelebration.tsx` — modal de logros
- `LevelUpAnimation.tsx` — subir nivel
- `AchievementUnlock.tsx` — desbloquear logro
- `BetaGamificationCard.tsx` — reclamar recompensa beta
- `WeeklyChallengesCard.tsx` — completar retos semanales
- `AtomicHabitsCard.tsx` — hábitos
- `useGoalNotifications.ts` — metas financieras
- `WorkflowSummaryWidget.tsx` — completar workflow
- `MobileCaptureStats.tsx` — meta diaria alcanzada
- `QuizResults.tsx` — resultados de quiz
- `ReconciliationWizard.tsx` — reconciliación completa

### 4. Archivos a modificar (23 archivos)
- Crear: `src/hooks/utils/useConfetti.ts`
- Modificar 9 archivos para **eliminar** confetti completamente
- Modificar 12 archivos para usar `useConfetti` condicionado
- Modificar 2 archivos restantes (`BetaFeedback.tsx`, `QuickClassifyDialog.tsx`) para evaluar si es gamificación o rutina

## Resultado
- Al abrir el dashboard: **cero confetti**
- Al navegar: **cero confetti**
- Al crear registros: **cero confetti**
- Solo con gamificación **activada** y en logros reales: confetti opcional
- Toggle ya existente en Configuración controla todo

