# Stop re-notifying about the same overdue contact

## Today's behavior
- Daily push fires for every overdue contact, every day, until you log a connection or archive them.
- Dashboard correctly keeps showing overdue people so nothing is forgotten — that part stays.

## Goal
Each overdue contact triggers a push notification **once**. No repeat pushes until you act on it (log a connection, edit, or archive). The dashboard is unchanged — overdue people still appear there as before.

## What gets built

### 1. Track "already notified" per contact
Add a column `last_notified_for_nudge_at` (timestamptz, nullable) on `contacts`. It stores the `next_nudge_at` value the contact was last notified for.

### 2. `check-nudges` edge function — only notify new overdue contacts
When picking contacts due for a user:
- Skip contacts where `last_notified_for_nudge_at` already equals the current `next_nudge_at` (already notified for this cycle).
- For contacts that pass, include them in the push and stamp `last_notified_for_nudge_at = next_nudge_at` after sending.
- If no contacts qualify, send no push that day (even if there are still-overdue ones from earlier).

Result: the moment a contact becomes overdue → one push. Day 2, 3, 4 with no action → silence. Once you log a connection, `next_nudge_at` advances; when that new date arrives and lapses, you get one fresh push.

### 3. Keep the per-user daily dedupe
`last_nudge_notified_on` stays — it still prevents two pushes in the same local day if cron runs twice.

### 4. Dashboard
No changes. "It's been a while" still lists every overdue contact until you act.

## Technical details

**Migration**
```sql
ALTER TABLE public.contacts
  ADD COLUMN last_notified_for_nudge_at timestamptz;
```
No backfill needed — existing overdue contacts will each get one "catch-up" push the next time cron runs, then go quiet.

**Edge function change (`supabase/functions/check-nudges/index.ts`)**
- Query: select `id, name, next_nudge_at, last_notified_for_nudge_at`.
- Filter in code: keep only rows where `last_notified_for_nudge_at IS NULL` or `last_notified_for_nudge_at <> next_nudge_at`.
- After successful `send-push`, bulk-update `contacts` setting `last_notified_for_nudge_at = next_nudge_at` for the notified ids.
- If filtered list is empty for a user → continue without sending, and do **not** stamp `last_nudge_notified_on` (so the dedupe doesn't block a legitimate notification later that same day if a new contact tips into overdue).

**Reset on action**
`useLogInteraction` already sets a new `next_nudge_at` — that naturally re-arms notifications because the stored stamp no longer matches. No code change needed in log/edit flows.

## Out of scope
- No Snooze button, no auto-roll-forward.
- No changes to email or in-app UI.
