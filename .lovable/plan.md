
## Evo Ecosystem — Master Plan

### Phase 4: Ecosystem Onboarding + Cross-App Dashboard ✅ COMPLETE

- ✅ Step 1: `EcosystemOnboarding.tsx` — 3-step animated welcome for Bundle users
- ✅ Step 2: `EcosystemInsights.tsx` — Cross-app correlation dashboard (focus vs expenses, 6-month chart)
- ✅ Step 3: `BundleActiveBadge` integrated in Settings, Dashboard, Control Center
- ✅ Step 4: Fokuspark alignment — instructions delivered and confirmed implemented

### Phase 5: Polish, Flag Granularity & Architecture ✅ COMPLETE

- ✅ Individual feature flag gating (`ecosystem_onboarding`, `ecosystem_insights`, `ecosystem_badge`) on all ecosystem components
- ✅ MobileDashboard refactored: extracted `MobileStatsGrid` and `MobileAlertsBanner` (302→110 lines)

### Phase 6: Ecosystem Intelligence ✅ COMPLETE

**Goal:** Make cross-app data actionable with smart alerts and AI-powered correlations.

#### Step 1: Ecosystem Weekly Digest
- Create `EcosystemWeeklyDigest.tsx` — a dismissible card shown once per week to Bundle users
- Summarizes: focus minutes this week, worry entries, spending delta vs previous week
- Uses existing tables, no new DB needed
- Gated by `ecosystem_insights` flag

#### Step 2: Smart Correlation Alerts
- When a user has high worry entries AND increased spending in the same week, surface an insight:
  "Your spending increased 23% this week. You also logged 4 worry entries — consider a focus session before your next purchase."
- Logic runs client-side from cached query data
- Gated by `ecosystem_insights` flag + `hasBundleAccess`

#### Step 3: Ecosystem Health Score
- Create `EcosystemHealthScore.tsx` — a 0-100 composite score
- Factors: savings rate, focus consistency, worry trend (decreasing = good), expense stability
- Displayed as a radial gauge in the dashboard
- Bundle-only feature

### Phase 7: Cross-App Deep Linking & Smart Handoffs ✅ COMPLETE

- ✅ `src/lib/ecosystem/deeplinks.ts` — Central deep link utility with UTM tracking for all Fokuspark tools
- ✅ Smart CTAs in Weekly Digest (contextual: suggests breathing when worries+spending are high, focus timer when no sessions)
- ✅ Smart CTA in Health Score (suggests Fokuspark when score < 50)
- ✅ `EcosystemQuickActions.tsx` — Expandable toolbar with one-tap access to 5 Fokuspark tools
- ✅ `EcosystemSettingsCard.tsx` — Full ecosystem status in Settings showing feature flag states and cross-app link

### Phase 8: Advanced Ecosystem Intelligence ✅ COMPLETE

- ✅ `EcosystemPredictiveAlerts.tsx` — Day-of-week spending pattern analysis, focus streak risk detection, positive pattern recognition
- ✅ `EcosystemMonthlyReport.tsx` — Full monthly PDF export with financial summary, top categories, wellness metrics, and health score
- ✅ `EcosystemAchievements.tsx` — 6 cross-app achievements: Connection, Focus Master, Zen Saver, Worry Free, Financial Reflector, Total Harmony
- All components gated by `hasBundleAccess` + `ecosystem_insights` flag

### Phase 9: Cross-App Intelligence & Social ✅ COMPLETE

- ✅ `EcosystemNotifications.tsx` — Cross-app notification bridge with `ecosystem_notifications` table, read/unread state, expandable card with action CTAs
- ✅ `EcosystemStreaks.tsx` — Shared streaks tracking combined daily activity (finance + focus), weekly progress bar, auto-persisted to `ecosystem_streaks` table
- ✅ `EcosystemCoaching.tsx` — Rule-based AI financial coaching analyzing savings rate, focus-spending correlation, worry-spending links, journal habits, and consistency patterns. Top 3 insights with contextual Fokuspark CTAs
- ✅ DB tables: `ecosystem_notifications` and `ecosystem_streaks` with RLS policies

### Phase 10: AI Coaching, Leaderboard & Inline Widgets ✅ COMPLETE

- ✅ `ecosystem-coaching` edge function — Gemini 2.5 Flash powered coaching with user data context, fallback to rule-based insights
- ✅ `EcosystemAICoaching.tsx` — Frontend for AI coaching with loading state, refresh, and source indicator (AI vs Smart)
- ✅ `EcosystemLeaderboard.tsx` — Anonymous weekly ranking of Bundle users with auto-submitted scores (health + focus + streak)
- ✅ `EcosystemInlineWidgets.tsx` — Embedded Fokuspark mini-tools: 4-7-8 breathing animation and 5-min focus timer, sessions logged to DB
- ✅ DB tables: `ecosystem_leaderboard` with public read + user write RLS

### Technical Notes (Updated)

- **Shared tables:** `financial_focus_sessions`, `financial_worry_entries`, `user_subscriptions.has_bundle`, `ecosystem_notifications`, `ecosystem_streaks`, `ecosystem_leaderboard`
- **Feature flags:** `ecosystem_enabled` (master), `ecosystem_onboarding`, `ecosystem_insights`, `ecosystem_badge`, `ecosystem_promo_card`
- **localStorage keys:** `ecosystem-onboarding-dismissed`, `ecosystem-weekly-digest-dismissed`, `ecosystem-predictive-dismissed`
- **Edge functions:** `ecosystem-coaching` (Gemini AI)
- **Stripe Bundle IDs:** Monthly `price_1T4U9U3wR30iWwFnq9YJeIHe`, Annual `price_1T4UEy3wR30iWwFnbIfKJtUb`

