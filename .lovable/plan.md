

## Phase 4: Ecosystem Onboarding + Cross-App Dashboard

Based on the current state, here is my recommended step-by-step plan for the next phase of the Evo Ecosystem.

### Step 1: Ecosystem Onboarding Welcome (new component)

Create `EcosystemOnboarding.tsx` — a welcome flow that triggers once for new Bundle users (`has_bundle = true` + not dismissed). It will:

- Show a 3-step animated card explaining Bundle benefits:
  1. "Your finances and focus are now connected"
  2. "Cross-app insights will appear automatically"
  3. "Explore Fokuspark for the other half of your ecosystem"
- Include a CTA to open Fokuspark and a dismiss button
- Persist dismissal in `localStorage` (`ecosystem-onboarding-dismissed`)
- Integrate into `MobileDashboard` and the desktop dashboard, shown only for Bundle users

### Step 2: Cross-App Correlation Dashboard (new component)

Create `EcosystemInsights.tsx` — a dashboard card exclusive to Bundle users that visualizes the relationship between focus/wellbeing data and financial behavior:

- Read from existing `financial_focus_sessions` and `financial_worry_entries` tables
- Show metrics: total focus minutes, worry entries logged, correlation with spending patterns
- Display a simple chart (recharts scatter or bar) showing focus session days vs expense amounts
- Gated behind `hasBundleAccess` — non-bundle users see an upgrade prompt instead

### Step 3: Integration into Settings

- Add the `BundleActiveBadge` (full variant) to the Settings page subscription section
- Show ecosystem status alongside the current plan details

### Step 4: Instructions for Fokuspark

Provide copy-paste instructions for Fokuspark to:
- Mirror the onboarding flow for Bundle users
- Share the same `localStorage` key convention for onboarding dismissal
- Implement their side of the cross-app data (focus sessions duration, meditation streaks)

### Technical details

- **No database changes needed** — reuses existing `financial_focus_sessions`, `financial_worry_entries`, and `user_subscriptions.has_bundle`
- **New files**: `src/components/ecosystem/EcosystemOnboarding.tsx`, `src/components/ecosystem/EcosystemInsights.tsx`
- **Modified files**: `MobileDashboard.tsx` (add onboarding + insights), `Settings.tsx` (add badge), `.lovable/plan.md`
- All components gated via `useFeatureFlags().hasBundleAccess`
- Full ES/EN support via `useLanguage()`

