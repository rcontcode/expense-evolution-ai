

# Fix: Data Integrity Alert Navigation and Content

## Problems Identified

1. **Wrong destination**: "Ver detalle" on the data integrity alert links to `/expenses?tab=health` which doesn't exist. The Expenses page ignores that parameter and shows the full cluttered page.

2. **Incomplete picture**: The data health alert only counts issues from the `data_health_check` database view (orphaned records like "gasto sin clasificar" at DB level), but the `ExpenseHealthPanel` on the Expenses page shows additional issues (missing receipts, duplicates, no category). The user sees "3 problems" in the hub but "5 problems" on the Expenses page -- confusing and inconsistent.

## Solution

### Change 1: Route "Ver detalle" to the dedicated Data Health page

The app already has a full `/data-health` page (`DataHealth.tsx`) with a proper health tab showing each issue type grouped with details. The alert button should navigate there instead of `/expenses?tab=health`.

### Change 2: Enrich the hub alert with expense-level issues

Currently the hub only uses `useDataHealthCheck` (DB-level orphaned records). We should also include the expense-completeness issues from the expense list itself (missing receipts, unclassified reimbursement type, no category) so the count and detail match what the user sees on the Expenses page.

This means importing the `useExpenses` hook (with no filters) and computing the same stats as `ExpenseHealthPanel`:
- Expenses without receipt (`receipt_url` is null/empty)
- Expenses with `reimbursement_type === 'pending_classification'`  
- Expenses with no `category`

These will be combined with the DB health issues into a single consolidated count and detail message.

### Change 3: Improve the detail message

Instead of just "3 gasto sin clasificar", show a complete breakdown like:
- "2 sin recibo, 3 sin clasificar" (combining both sources)

And the action button label changes from "Ver detalle" to "Ver todo" linking to `/data-health`.

## Technical Details

### File: `src/components/dashboard/DashboardNotificationHub.tsx`

1. The `data_health` alert `actionUrl` changes from `'/expenses?tab=health'` to `'/data-health'`

2. In the smart alerts computation, enhance the data health section to also count expense-level issues (missing receipts, pending classification, no category) from the expenses data already available via the nudge system or a lightweight expenses query

3. Build a consolidated detail message combining both data sources

### No new files or database changes needed.
