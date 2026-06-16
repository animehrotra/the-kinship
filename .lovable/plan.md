# Activate Daily Nudge Notifications

Goal: make installed-PWA users actually receive a daily push when contacts are due — reliably, at a sensible local time, without duplicates.

## What we'll build

### 1. Per-user notification preferences
Add columns to `profiles` so each user controls when they get pinged:
- `notify_hour` (int, 0–23, default `9`) — preferred local send hour
- `notify_timezone` (text, default `'UTC'`) — IANA tz like `Europe/London`; auto-filled on first push opt-in from the browser (`Intl.DateTimeFormat().resolvedOptions().timeZone`)
- `last_nudge_notified_on` (date, nullable) — the local date we last pushed them; the dedupe guard

### 2. Smarter `check-nudges` edge function
Rewrite the query so it runs **hourly** instead of daily:
- Join `profiles` and pick only users whose current local hour (derived from `notify_timezone`) equals their `notify_hour`
- Skip any user whose `last_nudge_notified_on` already equals today in their local tz (dedupe)
- For remaining users, find contacts where `next_nudge_at <= end-of-their-local-today`
- After a successful `send-push`, stamp `last_nudge_notified_on = <their local today>`
- Keep the existing "N nudges due — reach out to A, B, C" summary copy

### 3. Hourly scheduler
Enable `pg_cron` + `pg_net` and schedule `check-nudges` to run every hour at minute 0. (Created via the insert tool, not migrations, since the URL/anon key are project-specific.)

### 4. UI: notification settings
Small settings surface — added to the existing sidebar area next to `NotificationToggle`:
- Time-of-day picker (hour select, shows user's detected timezone as a hint)
- "Send a test notification" button → calls `send-push` for the current user with a sample payload, so users can confirm delivery on their device
- iOS PWA hint: a one-line note shown only on iOS Safari when not in standalone mode — "Add Kinship to your Home Screen first to enable notifications"
- When a user first toggles notifications on, auto-capture their browser timezone into `profiles.notify_timezone`

### 5. Docs / copy
Brief inline help text on the settings card explaining: notifications only work in the published app, must be installed to Home Screen on iOS, and arrive once per day around their chosen hour.

## Technical notes

- Timezone math in `check-nudges` uses `toLocaleString('en-US', { timeZone, hour12: false })` parsing in Deno — no extra deps.
- The `last_nudge_notified_on` guard is per-user, not per-contact, so a user gets at most one push per local day even if cron retries.
- New `send-test-push` is not a separate function — we reuse `send-push` directly from the client (it already accepts `{ user_id, title, body, url }` and validates subs server-side).
- No changes to `send-push`, `get-vapid-key`, `sw.js`, or the VAPID/encryption layer — those already work end-to-end.
- RLS: users can `SELECT`/`UPDATE` their own `profiles` row (existing policy covers the new columns automatically).

## Out of scope (call out, don't build)
- Quiet hours / multi-window schedules
- Per-contact "notify me X days before" overrides
- Email fallback when push fails
- Android/iOS native push via Capacitor

## Files touched
- Migration: add 3 columns to `profiles`
- Cron setup via `supabase--insert` (pg_cron + pg_net + schedule)
- `supabase/functions/check-nudges/index.ts` — rewrite for hourly + tz + dedupe
- `src/hooks/usePushNotifications.ts` — capture tz on subscribe
- New `src/components/NotificationSettings.tsx` — hour picker, test button, iOS hint
- Wire `NotificationSettings` into the sidebar (replacing or augmenting the bare `NotificationToggle`)
