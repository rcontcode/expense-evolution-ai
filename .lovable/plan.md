

# Mentoría Financiera — Mejoras Ronda 3

## Hallazgos tras revisión completa

### Lo que ya funciona bien
- Auto-tracker corregido, desafíos con navegación funcional
- Learning Path con deep-link + scroll + highlight
- WeeklySummaryBadge, TracyQuickStats, score con persistencia y milestones
- Rohn reorganizado con collapsible de herramientas de lectura
- Tips rotativos por mentor, TabBanner con descripciones

### Problemas pendientes (6 issues)

**Issue 1: Kiyosaki tab poco interactivo**
Solo tiene 3 cards estáticas (CashflowQuadrant, FinancialFreedom, DebtClassification). Sin estadísticas rápidas ni mini-resumen como Tracy tiene con `TracyQuickStats`. Se siente como "solo lectura".

**Issue 2: No hay "logros de mentoría" integrados**
El sistema de gamificación general existe pero no hay achievements específicos de mentoría (ej: "Completaste todos los challenges de una semana", "Usaste las 5 tabs", "Score 80+"). Esto es una ventaja competitiva no aprovechada.

**Issue 3: Empty states poco motivacionales**
Cuando el usuario no tiene datos (ej: CashflowQuadrant sin ingresos, FinancialFreedom sin gastos), los empty states son genéricos. Deberían incluir un CTA directo y una frase motivacional del mentor correspondiente.

**Issue 4: No hay "streak de mentoría" visible**
El streak del banner es global (XP), pero no hay un streak específico de "visité mentoría X días seguidos" que motive la exploración recurrente.

**Issue 5: Challenges no premian con XP real del sistema de gamificación**
Los challenges dan XP visual (localStorage) pero NO llaman a `addExperience()` del sistema de gamificación real. El XP de challenges no se refleja en el nivel del usuario.

**Issue 6: WeeklySummaryBadge demasiado simple**
Solo muestra 3 datos. Podría incluir score delta y un mini-gráfico de tendencia semanal.

---

## Plan de mejoras

### Paso 1: Conectar XP de challenges al sistema de gamificación real
**Archivo**: `src/components/mentorship/WeeklyChallengesCard.tsx`
- Cuando un challenge se auto-completa, llamar `addExperience(user.id, challenge.xpReward)` del hook de gamificación
- Esto hace que el XP ganado en challenges suba el nivel real del usuario
- Agregar `useAuth` para obtener el user ID

### Paso 2: Agregar KiyosakiQuickStats
**Archivo nuevo**: `src/components/mentorship/KiyosakiQuickStats.tsx`
- Card compacta mostrando: total activos, total pasivos, ratio activos/pasivos, % ingreso pasivo
- Usa hooks existentes (`useCashflowQuadrant`, `useFinancialFreedom`, `useDebtClassification`)
- Se inserta en Kiyosaki tab al lado de CashflowQuadrantCard

### Paso 3: Mejorar empty states de Kiyosaki cards
**Archivos**: `CashflowQuadrantCard.tsx`, `FinancialFreedomCard.tsx`, `DebtClassificationCard.tsx`
- Agregar frase motivacional de Kiyosaki en cada empty state
- Agregar botón CTA que navegue directamente a la acción necesaria (registrar ingreso, registrar gasto, etc.)

### Paso 4: Enriquecer WeeklySummaryBadge
**Archivo**: `src/components/mentorship/WeeklySummaryBadge.tsx`
- Agregar score delta desde `MentorshipProgressSummary` (reusar lógica de localStorage)
- Agregar indicador de "tabs visitadas esta semana" usando localStorage

### Paso 5: Logros de mentoría
**Archivo**: `src/components/mentorship/WeeklyChallengesCard.tsx`
- Cuando se completan TODOS los challenges de la semana, disparar `unlockAchievement('mentorship_weekly_master')` si existe en el sistema
- Usar `useUnlockAchievement` del hook de gamificación
- Toast especial con confetti

### Paso 6: Mentorship streak tracker
**Archivo**: `src/components/mentorship/MentorshipProgressSummary.tsx`
- Trackear en localStorage cuántos días consecutivos el usuario visitó `/mentorship`
- Mostrar como badge "🔥 5 días visitando mentoría" junto al score
- Incrementar al montar el componente si `lastVisitDate !== today`

---

## Archivos a crear
1. `src/components/mentorship/KiyosakiQuickStats.tsx` — Stats rápidas del cuadrante

## Archivos a modificar
1. `src/components/mentorship/WeeklyChallengesCard.tsx` — Conectar XP real + logro semanal
2. `src/components/mentorship/WeeklySummaryBadge.tsx` — Score delta + tabs visitadas
3. `src/components/mentorship/MentorshipProgressSummary.tsx` — Streak de visitas a mentoría
4. `src/components/mentorship/CashflowQuadrantCard.tsx` — Empty state mejorado
5. `src/components/mentorship/FinancialFreedomCard.tsx` — Empty state mejorado
6. `src/components/mentorship/DebtClassificationCard.tsx` — Empty state mejorado
7. `src/pages/Mentorship.tsx` — Insertar KiyosakiQuickStats en tab Kiyosaki

