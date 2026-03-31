

# Plan: Despersonalizar nombres de famosos en toda la app EvoFinz

## Contexto
Actualmente la app muestra nombres como "Kiyosaki", "Jim Rohn", "Brian Tracy", "Hábitos Atómicos" (James Clear) en múltiples lugares: sidebar, badges, citas, desafíos semanales, tips, wizard titles, etc. Según la política de marca ya establecida, estos nombres deben eliminarse de la interfaz pública, manteniendo las atribuciones solo en la sección Legal y en la Biblioteca (donde son autores de libros reales).

## Estrategia de reemplazo

Los nombres de famosos se reemplazan por **nombres genéricos descriptivos** de las metodologías:

| Actual | Nuevo (UI) | ID interno (sin cambio) |
|--------|-----------|------------------------|
| Kiyosaki / Rich Dad | Activos y Flujo de Caja | `kiyosaki` |
| Jim Rohn | Desarrollo Personal | `rohn` |
| Brian Tracy | Metas y Productividad | `tracy` |
| Hábitos Atómicos | Micro-Hábitos | `atomic` |

**IDs internos** (`kiyosaki`, `rohn`, `tracy`, `atomic`) no se cambian para evitar romper rutas, queries y lógica.

## Áreas a NO tocar
- **`src/pages/Legal.tsx`** — Las atribuciones legales se mantienen intactas
- **`src/components/mentorship/FinancialLibrary.tsx`** — Los autores de libros reales se mantienen (son datos bibliográficos)
- **`src/components/settings/FinancialEducationResources.tsx`** — Autores de recursos reales
- **`src/lib/constants/mentor-quotes.ts`** — Archivo de datos interno (no visible al usuario directamente); se pueden anonimizar las citas que se muestran en UI
- **Comentarios de código** — No afectan la UI

## Archivos a modificar (~30 archivos)

### Grupo 1: Navegación y estructura principal
1. **Sidebar/Menu** — Encontrar donde se definen los sub-items "Kiyosaki", "Jim Rohn", "Brian Tracy", "Hábitos Atómicos" del menú lateral y reemplazar labels
2. **`src/pages/Mentorship.tsx`** — Tab labels, subtitles, tips con atribuciones, section descriptions
3. **`src/pages/BetaFeatures.tsx`** — Título "Mentoría Kiyosaki/Tracy/Rohn" → "Mentoría Financiera Avanzada"
4. **`src/pages/FinancialAdventure.tsx`** — `EXPERT_WISDOM` authors → genéricos

### Grupo 2: Tarjetas de mentoría (badges y citas)
5. **`CashflowQuadrantCard.tsx`** — Badge "📖 Kiyosaki*" → "💰 Activos", quitar "— Robert Kiyosaki"
6. **`FinancialFreedomCard.tsx`** — Badge y cita attribution
7. **`DebtClassificationCard.tsx`** — Badge y cita attribution
8. **`PayYourselfFirstCard.tsx`** — Badge "📖 Rohn*" → "🌟 Desarrollo Personal"
9. **`SMARTGoalsCard.tsx`** — Badge "📖 Tracy*" → "🎯 Metas"
10. **`SMARTGoalWizard.tsx`** — Cita "Brian Tracy: ..."
11. **`AtomicHabitsCard.tsx`** — Título y badge "Hábitos Atómicos"
12. **`FinancialJournalCard.tsx`** — Badge "Jim Rohn"
13. **`FinancialHabitsCard.tsx`** — Badge "Brian Tracy"
14. **`TracyGoalWizard.tsx`** — Título "Sistema de Metas Brian Tracy", citas con atribución
15. **`KiyosakiQuickStats.tsx`** — Título "Resumen Kiyosaki" → "Resumen de Activos"
16. **`TracyQuickStats.tsx`** — Título "Tracy Goals Summary" → "Resumen de Metas"
17. **`WeeklyChallengesCard.tsx`** — `MENTOR_NAMES` map con nombres famosos
18. **`LearningPathCard.tsx`** — Libro "Hábitos Atómicos" (se mantiene como título de libro), tab `kiyosaki`

### Grupo 3: Landing y marketing
19. **`FeaturesShowcase.tsx`** — "Principios Kiyosaki, Tracy, Rohn" → "Principios de expertos financieros"
20. **`FeatureDemosCarousel.tsx`** — "Hábitos Atómicos"

### Grupo 4: Hooks y contexto
21. **`useSmartGuidance.ts`** — Descripción con nombres
22. **`useAssistantContext.ts`** — Sugerencias y descripciones
23. **`usePayYourselfFirst.ts`** — Cita "Jim Rohn: ..."
24. **`useGenerateSampleData.ts`** — Cita y notificaciones con atribución

### Grupo 5: Datos y constantes
25. **`mentorship-challenges.ts`** — Button labels "Ir a Kiyosaki" → "Ir a Activos"
26. **`user-guide-content.ts`** — Descripciones con nombres
27. **`src/data/tutorials.ts`** — Referencias en narración

### Grupo 6: Contexto de gamificación
28. **`GamificationContext.tsx`** — Si hay nombres en helpers de celebración
29. **`MentorshipLevelBanner`** — Quotes de expertos con nombres

### Grupo 7: Otros
30. **`src/components/focus/areas/CrecimientoAreaContent.tsx`** — Descripción con "Kiyosaki"
31. **`src/components/net-worth/AssetsList.tsx`** — Cita de Kiyosaki en assets
32. **`src/components/quiz/QuizHero.tsx`** — "Basado en Kiyosaki, Tracy y más"

## Criterio para citas
- Las citas **se mantienen** como contenido inspiracional pero **sin atribución visible** (sin "— Robert Kiyosaki")
- Se pueden presentar como "Sabiduría financiera" o simplemente como citas sin autor
- En tooltips de badges, cambiar "Inspirado en obra de X. No afiliado." → eliminar o genericizar

## Resultado esperado
La app presentará las mismas metodologías y herramientas pero con nombres genéricos descriptivos, cumpliendo la política de despersonalización. Solo la página Legal y la Biblioteca mantendrán atribuciones de autores reales.

