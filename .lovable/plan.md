

# Fix: Learning Path Navigation — Deep-link to Exact Components

## Problem
Clicking a Learning Path suggestion (e.g., "Start your journal") only switches the tab via `?tab=rohn`, but doesn't scroll to or highlight the specific component (FinancialJournalCard, SMARTGoalsCard, etc.). The user lands on the tab but has to hunt for the relevant tool.

## Solution
Add a `scrollTarget` field to each suggestion that maps to a specific DOM element ID within the target tab. After switching tabs, use a short delay (to allow tab content to render) then scroll to and briefly highlight the target element.

## Changes

### 1. `src/pages/Mentorship.tsx` — Add `id` attributes to key components
Add `id` props to wrapper divs so they can be scroll targets:
- Atomic tab: `id="mentorship-habits"` on `AtomicHabitsCard` wrapper, `id="mentorship-pay-yourself"` on `PayYourselfFirstCard`
- Kiyosaki tab: `id="mentorship-cashflow"` on `CashflowQuadrantCard`, `id="mentorship-freedom"` on `FinancialFreedomCard`, `id="mentorship-debt"` on `DebtClassificationCard`
- Rohn tab: `id="mentorship-journal"` on `FinancialJournalCard`, `id="mentorship-education"` on `FinancialEducationCard`, `id="mentorship-reading-reminder"`, `id="mentorship-reading-pace"`
- Tracy tab: `id="mentorship-goal-wizard"` on `TracyGoalWizard`, `id="mentorship-smart-goals"` on `SMARTGoalsCard`
- Library tab: `id="mentorship-library"` on `FinancialLibrary`

### 2. `src/components/mentorship/LearningPathCard.tsx` — Add scroll + highlight logic
- Add `scrollTarget` field to `Suggestion` interface (e.g., `'mentorship-journal'`, `'mentorship-smart-goals'`, `'mentorship-habits'`, `'mentorship-library'`, `'mentorship-education'`)
- Update `navigateToTab` to accept a `scrollTarget`:
  1. Set the tab param
  2. After 400ms delay (tab renders), find element by ID
  3. `scrollIntoView({ behavior: 'smooth', block: 'center' })`
  4. Add temporary CSS class `highlight-on-arrival` for 4s (already defined in the app's global styles)
- Map each existing suggestion to its scroll target

### 3. Mapping table

| Suggestion | Tab | Scroll Target ID |
|---|---|---|
| Journal financiero | rohn | mentorship-journal |
| Meta SMART | tracy | mentorship-smart-goals |
| Biblioteca | library | mentorship-library |
| Hábito atómico | atomic | mentorship-habits |
| Racha hábitos | atomic | mentorship-habits |
| Racha journal | rohn | mentorship-journal |
| Acompañante lectura | rohn | mentorship-education |
| Cuadrante Kiyosaki | kiyosaki | mentorship-cashflow |
| Recursos biblioteca | library | mentorship-library |
| Entradas journal | rohn | mentorship-journal |
| Metas financieras | tracy | mentorship-smart-goals |
| Racha 7/30 días | atomic | mentorship-habits |

## Files to modify
1. `src/pages/Mentorship.tsx` — Add `id` attributes to component wrappers
2. `src/components/mentorship/LearningPathCard.tsx` — Add `scrollTarget` field + scroll-and-highlight logic

