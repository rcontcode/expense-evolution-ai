

## Audit: "Pagos Fijos" Integration Across the App

After reviewing the codebase, I found **several gaps** that need fixing. Here's the full status:

### What IS Working
- Route `/bills` exists and renders `BillsDashboard`
- Sidebar and mobile menu link to `/bills` correctly
- Landing page lists "Centro de Pagos" as a Premium feature
- Dashboard has `MonthlyBillsWidget` with rich analysis
- OCR/voice/chaos inbox can detect and create recurring bills via `useCreateBill`
- `DashboardNotificationHub` links to `/bills` for overdue/upcoming alerts
- Data sync via `useInvalidateRelated.afterBill()` is solid

### Issues Found (7 items)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **`MonthlyBillsWidget` links to `/budget?tab=bills` instead of `/bills`** | `MonthlyBillsWidget.tsx` (lines 148, 197, 275) | Users clicking "View all", "Pay", or "Set Up Bills" from the Dashboard widget get sent to Budget page instead of the dedicated Bills page |
| 2 | **AI Assistant `ROUTE_MAP` missing `bills` entry** | `useAssistantActions.ts` line 67-90 | Voice/chat commands like "go to bills" or "llévame a pagos fijos" won't navigate correctly |
| 3 | **`PageContextGuide` has no entry for `/bills`** | `PageContextGuide.tsx` | No contextual help, tips, or goals shown when user is on the Bills page |
| 4 | **Premium plan features in Landing don't explicitly mention "Pagos Fijos"** | `Landing.tsx` lines 236-258 | Users considering Premium don't see "Centro de Pagos" listed as an included feature in the pricing tier |
| 5 | **`UpgradePrompt` Premium price is wrong: shows $6.99 instead of $7.99** | `UpgradePrompt.tsx` line 44 | Inconsistent pricing vs Landing ($7.99) and documented price |
| 6 | **No plan-gating on `/bills` route** | `Bills.tsx` / `BillsDashboard.tsx` | Bills is listed as Premium feature on Landing but any Free user can access it — needs either gating or clarification |
| 7 | **`OnboardingTutorial` and `ControlCenterTour` don't mention the Bills section** | guidance components | New users don't learn about the dedicated Bills management center |

### Plan

**File changes:**

1. **`src/components/dashboard/MonthlyBillsWidget.tsx`** — Replace all 3 instances of `/budget?tab=bills` with `/bills`

2. **`src/hooks/utils/useAssistantActions.ts`** — Add `bills: '/bills'` and `pagos: '/bills'` to `ROUTE_MAP`

3. **`src/components/guidance/PageContextGuide.tsx`** — Add a config entry for the `/bills` path with title, description, goals, and tips

4. **`src/pages/Landing.tsx`** — Add "Centro de Pagos / Calendario / Checklist" to Premium features list (line ~236)

5. **`src/components/UpgradePrompt.tsx`** — Fix Premium price from `$6.99` to `$7.99` and annual from `$5.59` to `$6.49`

6. **Decision needed on #6**: Is Bills a Premium-only feature or available to everyone? The Landing says Premium but there's no gating in code.

### Technical Details

- All navigation changes are simple string replacements
- `ROUTE_MAP` additions follow existing pattern (key: route string)
- `PageContextGuide` entry follows the existing interface pattern with `pageTitle`, `pageDescription`, `goals`, `tips`
- Price fix aligns with the documented unified pricing: Premium $7.99/mo, $6.49/mo annual

