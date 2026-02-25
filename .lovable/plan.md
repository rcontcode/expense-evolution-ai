
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

### Phase 9: Future Enhancements (PLANNED)

- Cross-app notification bridge
- Shared streaks between apps
- AI-powered financial coaching via ecosystem data

### Technical Notes

- **Shared tables:** `financial_focus_sessions`, `financial_worry_entries`, `user_subscriptions.has_bundle`
- **Feature flags:** `ecosystem_enabled` (master), `ecosystem_onboarding`, `ecosystem_insights`, `ecosystem_badge`, `ecosystem_promo_card`
- **localStorage keys:** `ecosystem-onboarding-dismissed`
- **Stripe Bundle IDs:** Monthly `price_1T4U9U3wR30iWwFnq9YJeIHe`, Annual `price_1T4UEy3wR30iWwFnbIfKJtUb`
