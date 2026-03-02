

## Plan: Top Priority Fixes

Based on the audit, here are the 3 highest-impact issues to fix now — all are data integrity or pricing consistency bugs, not cosmetic.

---

### 1. Fix `create_income` in `useAssistantActions.ts` — raw SQL bypass

**Problem**: Lines 260-293 use `supabase.from('income').insert(...)` directly, bypassing `useCreateIncome` which provides duplicate detection, audit logging, gamification triggers, and cache invalidation (`afterIncome()`). Note: `ChatAssistant.tsx` already correctly uses `createIncome.mutateAsync()` — so the `useAssistantActions` path is dead code that would only fire if another consumer calls `executeAction` directly.

**Fix**: Replace the raw insert with an `onCreateIncome` callback pattern (same as `onCreateExpense` already works). The hook consumer passes in `createIncome.mutate` and `useAssistantActions` just calls it.

**File**: `src/hooks/utils/useAssistantActions.ts` lines 260-293

---

### 2. Add Bundle tier to `UpgradePrompt.tsx`

**Problem**: `planDetails` only has `free`, `premium`, `pro` — missing the `$19.99/mo` Bundle tier. If a user hits a limit where Bundle is the upgrade path, the prompt would show incomplete info.

**Fix**: Add `bundle` entry to `planDetails` with `$19.99`/`$15.99` pricing and teal color theme.

**File**: `src/components/UpgradePrompt.tsx` line ~55

---

### 3. Add `pro_beta` to `UpgradePrompt.tsx` planDetails

**Problem**: Beta testers have `planType = 'pro_beta'` but `planDetails` doesn't handle it, causing potential undefined lookups.

**Fix**: Add `pro_beta` entry mirroring `pro` with a "Beta" label.

**File**: `src/components/UpgradePrompt.tsx` line ~55

---

### Summary of changes

| File | Change |
|------|--------|
| `useAssistantActions.ts` | Replace raw `create_income` SQL with `onCreateIncome` callback (mirror `onCreateExpense` pattern) |
| `UpgradePrompt.tsx` | Add `bundle` and `pro_beta` to `planDetails` |

