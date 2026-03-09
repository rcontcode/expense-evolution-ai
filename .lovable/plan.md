

# CRM System Audit Plan

## Issues Found

### CRITICAL - Silent Data Loss (Inserts fail silently)

**1. AdminKanbanPipeline.tsx (line 505-510)** — When moving a lead with a note, it inserts into `lead_interactions` using non-existent columns `content` and `metadata`. The table only has `notes` (not `content`), and has no `metadata` column at all. The insert fails silently because the `.then(() => {})` swallows the error.

Fix: Replace `content: note` with `notes: note`, remove `metadata`, and add proper error handling.

**2. AdminLeadHistory.tsx (line 88-93)** — Same problem: inserts using `content` and `channel` columns which don't exist. Should use `notes` instead of `content`, and drop `channel`.

### MODERATE - Functional Issues

**3. Kanban stage_change interaction_type** — The `interaction_type: 'stage_change'` is not in the InteractionTimeline's recognized types (`call`, `email`, `whatsapp`, `note`, `meeting`). These entries will render without an icon or label. Need to add `stage_change` to the `typeIcons` and `typeLabels` maps in `InteractionTimeline.tsx`.

**4. AdminLeadHistory interaction types** — Uses `INTERACTION_LABELS` with types like `call`, `email`, `whatsapp`, `note`, `meeting` plus potentially `stage_change`, but the insert also uses a `channel` field that doesn't exist in the schema.

**5. Contact Queue double-fetch** — `AdminContactQueueTab.tsx` makes two separate queries (one with `is(null)`, one with `eq(false)`) and merges them client-side. This can be simplified to a single query using `.or('converted_to_user.is.null,converted_to_user.eq.false')`.

### LOW - UX & Consistency

**6. Pipeline `lead_interactions` insert doesn't set `created_by`** — Unlike `InteractionTimeline`, the Kanban pipeline doesn't attach the current user ID when logging stage changes. Should call `supabase.auth.getUser()` and include `created_by`.

**7. Pipeline `lead_interactions` insert is fire-and-forget** — No error handling or query invalidation. If the insert fails, the admin never knows the note wasn't saved.

## Implementation Plan

### Task 1: Fix `lead_interactions` inserts in AdminKanbanPipeline.tsx
- Change `content: note` to `notes: note`
- Remove `metadata` field
- Add `created_by: user?.id` (fetch user first)
- Add error handling (at minimum `console.error`)
- Invalidate `['lead-interactions', leadId]` on success

### Task 2: Fix `lead_interactions` insert in AdminLeadHistory.tsx
- Change `content: newInteractionContent.trim()` to `notes: newInteractionContent.trim()`
- Remove `channel` field
- Add `created_by: user?.id`

### Task 3: Add `stage_change` type support to InteractionTimeline.tsx
- Add `stage_change` to `typeIcons` and `typeLabels` maps so these entries render correctly in timelines

### Task 4: Optimize AdminContactQueueTab.tsx double query
- Merge the two queries into one using `.or()` filter

### Task 5: Verify all RLS policies are correct
- Already verified: all 5 CRM tables have RLS enabled with admin-only policies using `is_admin()` or `has_role()`. Quiz leads allow anon insert. This is correct.

### Summary of files to modify:
1. `src/components/admin/tabs/AdminKanbanPipeline.tsx` — Fix insert columns + add user + error handling
2. `src/components/admin/tabs/AdminLeadHistory.tsx` — Fix insert columns + add user
3. `src/components/admin/InteractionTimeline.tsx` — Add `stage_change` type
4. `src/components/admin/tabs/AdminContactQueueTab.tsx` — Optimize double query

