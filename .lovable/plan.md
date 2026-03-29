

# Fix: Desafíos Semanales + Visibilidad de Herramientas

## Problema 1: Botón flecha en desafíos no es funcional

El botón `>` (ChevronRight) solo incrementa un contador manualmente sin conexión real a la app. El campo `actionKeyword` existe en cada challenge pero **nunca se usa** — no hay auto-tracking. El usuario no entiende qué hacer con la flecha.

**Solución**: Reemplazar la flecha por un botón "Ir" que navega a la herramienta correspondiente + conectar el progreso real de la app a los challenges.

### Cambios en `WeeklyChallengesCard.tsx`:
- Eliminar el botón `ChevronRight` que hace `handleIncrement`
- Agregar un botón "Ir" / "Go" que navega a la ruta correspondiente del challenge (ej: challenge de journal → `/mentorship?tab=rohn`, challenge de hábitos → `/mentorship?tab=atomic`, challenge de ingresos → `/income`)
- Mapear cada `actionKeyword` a una ruta de navegación
- Agregar auto-tracking: escuchar eventos de `localStorage` (`mission-progress-updated`, `xp-earned`) y también consultar datos reales (contar journal entries de esta semana, contar hábitos creados, etc.) para actualizar el progreso automáticamente
- Mostrar texto descriptivo del botón: "Ir al Journal" / "Ir a Patrimonio" en vez de una flecha genérica

### Cambios en `mentorship-challenges.ts`:
- Agregar campo `route` a `MentorshipChallenge` con la ruta de navegación de cada challenge
- Agregar campo `buttonLabelEs` / `buttonLabelEn` para el texto del botón

### Nuevo hook `useChallengeAutoTracker.ts`:
- Hook que consulta datos reales de la semana actual para cada challenge:
  - `journal_entry` → contar entries de `financial_journal` de esta semana
  - `create_habit` → contar hábitos creados esta semana
  - `create_smart_goal` → contar savings goals creadas esta semana
  - `log_income` → contar income entries de esta semana
  - etc.
- Retorna `Record<actionKeyword, count>` para sincronizar el progreso real

---

## Problema 2: Herramientas como Reading Tracker no son visibles

El `ReadingProgressTracker` (699 líneas, muy completo) está oculto dentro de `FinancialEducationCard` como un sub-tab. No se menciona en la landing ni se promociona en otras partes de la app.

**Solución**: Promocionar las mejores herramientas "ocultas" en 3 lugares.

### A) Landing Page (`Landing.tsx`):
- Actualizar la descripción del feature "Mentoría Elite" para incluir: "Desafíos semanales, tracker de lectura, hábitos atómicos"
- Agregar un feature card para "Acompañante de Lectura" o expandir "Biblioteca Financiera" con mención del tracker

### B) Manual de Usuario (`user-guide-content.ts`):
- En la sección `mentorship`: agregar steps sobre desafíos semanales y el tracker de lectura
- En la sección `financial-education`: agregar step específico sobre el Reading Progress Tracker y cómo acceder
- Agregar tip: "Usa el Acompañante de Lectura para ver tu ritmo de lectura vs promedio global"

### C) Cross-promotion en la app:
- En `DashboardGamificationWidget` o similar: agregar una mini-card/tip que diga "¿Sabías que tienes un acompañante de lectura? → Ir a Mentoría" cuando el usuario no tiene recursos en progreso
- En `LearningPathCard.tsx`: agregar sugerencia "Activa el tracker de lectura para medir tu progreso" → link a `?tab=rohn`

---

## Archivos a crear
1. `src/hooks/data/useChallengeAutoTracker.ts` — Auto-tracking de progreso real

## Archivos a modificar
1. `src/lib/constants/mentorship-challenges.ts` — Agregar `route`, `buttonLabelEs`, `buttonLabelEn`
2. `src/components/mentorship/WeeklyChallengesCard.tsx` — Reemplazar flecha por botón "Ir" + auto-sync progreso
3. `src/pages/Landing.tsx` — Expandir descripciones de mentoría/biblioteca
4. `src/data/user-guide-content.ts` — Agregar tracker de lectura y desafíos semanales
5. `src/components/mentorship/LearningPathCard.tsx` — Agregar sugerencia del tracker de lectura

