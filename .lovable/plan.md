

# Potenciación de Mentoría — 3 Mejoras (sin Coach IA redundante)

## Descartado: Mentor AI Coach
Phoenix ya cumple este rol. En vez de crear otro chatbot, se puede agregar contexto de mentoría al prompt de Phoenix cuando detecte que el usuario está en `/mentorship` — pero eso es una mejora separada del asistente, no de esta página.

## Mejoras a implementar

### 1. Desafíos Semanales Temáticos
Retos rotativos por mentor con XP y racha.

- Crear `src/lib/constants/mentorship-challenges.ts` — pool de ~20 retos por mentor
  - Kiyosaki: "Registra 3 activos esta semana", "Clasifica tus deudas"
  - Rohn: "Escribe en tu journal 5 días", "Lee 30 minutos diarios"
  - Tracy: "Define 1 meta SMART", "Prioriza tareas con ABCDE"
  - Atomic: "Crea 1 hábito nuevo", "Registra tu págate primero"
- Crear `src/components/mentorship/WeeklyChallengesCard.tsx`
  - Muestra reto activo de la semana con progreso visual
  - Persistencia en localStorage con reset semanal (lunes)
  - Integrar con `useGamificationTriggers` para dar XP al completar
  - Selector de dificultad (principiante/intermedio/avanzado)

### 2. Resumen de Progreso Unificado
Dashboard compacto con KPIs de todas las herramientas de mentoría.

- Crear `src/components/mentorship/MentorshipProgressSummary.tsx`
  - Grid de métricas usando hooks existentes:
    - Libros leídos/en progreso (`useFinancialEducation`)
    - Racha de hábitos (`useFinancialHabits`)
    - Entradas de journal este mes (`useFinancialJournal`)
    - Metas activas/completadas (`useSavingsGoals`)
    - % libertad financiera (`useFinancialFreedom` si existe)
    - Nivel de mentoría actual (del banner)
  - Diseño: cards compactas con iconos, números grandes, mini-sparklines
  - Colocar debajo del `MentorshipLevelBanner`

### 3. Ruta de Aprendizaje Personalizada
Sugiere qué hacer según actividad del usuario.

- Crear `src/components/mentorship/LearningPathCard.tsx`
  - Analiza datos del usuario y muestra 3 "próximos pasos" con links directos:
    - Sin journal → "Empieza tu journal financiero" → `?tab=rohn`
    - Sin metas SMART → "Crea tu primera meta" → `?tab=tracy`
    - Sin libros → "Explora la biblioteca" → `?tab=library`
    - Sin hábitos → "Crea tu primer hábito atómico" → `?tab=atomic`
    - Racha rota → "Retoma tu racha de hábitos" → `?tab=atomic`
  - Cada sugerencia tiene prioridad basada en impacto
  - Se oculta cuando el usuario ya tiene actividad en todo
  - Colocar después del progress summary

---

## Archivos a crear
1. `src/lib/constants/mentorship-challenges.ts` — Pool de retos
2. `src/components/mentorship/WeeklyChallengesCard.tsx` — Desafíos semanales
3. `src/components/mentorship/MentorshipProgressSummary.tsx` — Dashboard progreso
4. `src/components/mentorship/LearningPathCard.tsx` — Ruta personalizada

## Archivos a modificar
1. `src/pages/Mentorship.tsx` — Agregar 3 componentes nuevos (progress summary + learning path después del banner, challenges en cada tab relevante)
2. `src/components/mentorship/index.ts` — Exportar nuevos componentes

