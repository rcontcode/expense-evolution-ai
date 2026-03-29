

# Auditoría Completa de Mentoría Financiera — Hallazgos y Plan de Mejora

## Lo que YA tenemos (inventario)

| Tab | Componentes | LOC | Estado |
|-----|------------|-----|--------|
| **Library** | FinancialLibrary (516L), favoritos, búsqueda | 516 | Sólido |
| **Atomic** | AtomicHabitsCard (696L), FinancialHabitsCard, PayYourselfFirst | ~1200 | Sólido |
| **Kiyosaki** | CashflowQuadrant, FinancialFreedom, DebtClassification | ~800 | Sólido |
| **Rohn** | FinancialJournal, FinancialEducation, ReadingTracker (699L), ReadingReminder, ReadingPace, GlobalLearningChart | ~2200 | Rico pero denso |
| **Tracy** | TracyGoalWizard (1133L), SMARTGoalsCard | ~1400 | **Funcional pero visualmente aislado** |
| **Global** | MentorshipLevelBanner (381L), ProgressSummary, LearningPath, WeeklyChallenges | ~900 | Bueno |

## Lo que NO tiene ningún competidor y nosotros SÍ

1. Desafíos semanales con auto-tracking real desde DB
2. Sistema ABCDE de priorización financiera (Tracy)
3. Reading Pace Comparison con charts
4. Cuadrante E-S-B-I con datos reales del usuario
5. Score de mentoría unificado (0-100)
6. Deep-link + highlight desde Learning Path

## Problemas encontrados (8 issues)

### Issue 1: Auto-tracker con datos incorrectos
`useChallengeAutoTracker.ts` tiene bugs:
- Línea 67-72: Consulta `expenses` para `log_income` — debería consultar la tabla `income`
- Línea 101-106: Consulta `financial_habits` para `create_smart_goal` — debería consultar `savings_goals`
- Línea 116-118: Mapea `analyze_quadrant`, `freedom_plan`, `complete_7steps` a `focus_sessions` — no tiene relación lógica real
- Línea 121: `classify_debt = assetsCount` — no tiene sentido

### Issue 2: Tracy tab visualmente pobre
Solo tiene 2 componentes (GoalWizard + SMARTGoals) en un grid de 1 columna. Comparado con Rohn (6 componentes) se siente vacío. Falta contenido Tracy-específico.

### Issue 3: No hay persistencia del score de mentoría
El score se calcula en vivo pero no se guarda. No hay historial ni tendencias (semana pasada vs esta semana). No hay "milestone" al llegar a 50 o 80.

### Issue 4: Challenges no se resetean visualmente al cambiar de semana
Si el `weekKey` cambia, los challenges se resetean pero no hay indicación visual de "nueva semana". El usuario no sabe cuándo empezó la semana actual.

### Issue 5: Falta "Resumen Semanal" de mentoría
Ninguna app de la competencia tiene esto. Podríamos generar un mini-reporte semanal: "Esta semana: 3/4 challenges completados, score subió de 45→52, 2 journals escritos".

### Issue 6: Tab Rohn sobrecargado
6 componentes en un tab es demasiado. ReadingReminder y ReadingPace son accesorios del tracker pero aparecen como cards independientes al mismo nivel que Journal.

### Issue 7: No hay gamificación de completar tabs
No hay badge/achievement por explorar todas las tabs o completar todas las herramientas de un mentor.

### Issue 8: Wellbeing tab condicionado a feature flag
Si el flag está off, solo hay 5 tabs. El contenido de bienestar (respiración, focus timer, worry dump) es valioso pero invisible por defecto.

---

## Plan de mejoras priorizadas (por impacto)

### Paso 1: Corregir bugs del auto-tracker (CRÍTICO)
**Archivo**: `src/hooks/data/useChallengeAutoTracker.ts`
- `log_income` → consultar tabla `income` en vez de `expenses`
- `create_smart_goal` → consultar `savings_goals` con `created_at` en rango de la semana
- `review_goals` → contar visitas a metas (usar savings_goals.length como proxy razonable)
- `analyze_quadrant` y `freedom_plan` → usar `income` entries como proxy (más relevante que focus sessions)
- `classify_debt` → consultar `liabilities` o `debts` con `updated_at` en la semana
- `complete_7steps` → contar goals de TracyGoalWizard (tabla `tracy_goals` si existe, sino savings_goals con deadline)

### Paso 2: Enriquecer Tracy tab
**Archivo**: `src/pages/Mentorship.tsx`
- Agregar un "Tracy Quick Stats" card al lado de SMARTGoalsCard mostrando: total goals activas, % completadas, tasa de prioridad A completadas
- Esto balancea visualmente el tab sin crear componentes nuevos pesados

### Paso 3: Agregar indicador de semana en WeeklyChallenges
**Archivo**: `src/components/mentorship/WeeklyChallengesCard.tsx`
- Mostrar rango de fechas de la semana actual (ej: "Mar 24 - Mar 30")
- Badge "Semana nueva" si estamos en lunes/martes

### Paso 4: Reorganizar tab Rohn
**Archivo**: `src/pages/Mentorship.tsx`
- Agrupar ReadingReminder y ReadingPace dentro de un collapsible "Herramientas de Lectura" debajo de FinancialEducationCard
- Reducir de 6 cards sueltas a 4 secciones visuales (Journal, Education+ReadingTools, GlobalChart)

### Paso 5: Milestones del score de mentoría
**Archivo**: `src/components/mentorship/MentorshipProgressSummary.tsx`
- Guardar score en localStorage con timestamp
- Mostrar delta vs semana pasada ("+7 pts esta semana")
- Toast celebratorio al cruzar umbrales (30, 50, 80, 100)

### Paso 6: Resumen semanal mini-card
**Archivo**: Nuevo `src/components/mentorship/WeeklySummaryBadge.tsx`
- Card compacta que muestre: challenges completados, score delta, journal entries, rachas
- Se renderiza entre ProgressSummary y WeeklyChallenges

---

## Archivos a crear
1. `src/components/mentorship/WeeklySummaryBadge.tsx` — Mini resumen semanal
2. `src/components/mentorship/TracyQuickStats.tsx` — Stats card para Tracy tab

## Archivos a modificar
1. `src/hooks/data/useChallengeAutoTracker.ts` — Fix 6 bugs de mapeo de datos
2. `src/components/mentorship/WeeklyChallengesCard.tsx` — Indicador de fechas de semana
3. `src/components/mentorship/MentorshipProgressSummary.tsx` — Historial + delta + milestones
4. `src/pages/Mentorship.tsx` — Reorganizar Rohn tab, agregar TracyQuickStats, insertar WeeklySummaryBadge

