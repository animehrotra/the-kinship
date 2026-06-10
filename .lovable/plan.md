## Add email reminders alongside push

Today, nudges already act as reminders: a daily cron at 08:00 UTC runs `check-nudges`, which finds contacts whose `next_nudge_at` is today or earlier and sends a **web push** notification to opted-in devices. We'll keep that and add an **email channel** on top, with a user-picked send hour and a "once on due date, then weekly catch-up" cadence.

### What you'll see in the app

- A new **Reminders** card in the sidebar (or a small Settings panel) with:
  - Toggle: **Email reminders** on/off
  - Sub toggle - daily / weekly
  - If daily, Dropdown: **Preferred hour** (e.g. 7 AM, 8 AM, 9 AM … in your local timezone)
  - If weekly, drop-down to select day of the week
  - Existing push toggle stays as-is
- A daily email titled "Kinship: You have N people to reach out" listing due contacts, with one-click links into each contact.
- After the due date, no daily nag — only one **weekly catch-up email** (every Monday at your chosen hour) listing anything still overdue.

### How it works under the hood

1. **Email infrastructure** — set up Lovable Emails (verified subdomain + queue + send log) so reminders use the same reliable delivery as the rest of the app.
2. **New `notification_preferences` table** (one row per user):
  - `email_enabled` (bool, default true)
  - `preferred_hour` (int 0–23, default 8)
  - `timezone` (IANA string, auto-detected from browser on first save)
  - `last_weekly_digest_at` (timestamp — used to throttle weekly catch-ups)
  - RLS: each user reads/writes only their own row.
3. **Two email templates** (React Email, brand-styled):
  - `nudge-due-today` — fired on the day a contact becomes due.
  - `nudge-weekly-overdue` — fired weekly for anything still overdue.
4. **Rewritten `check-nudges` Edge Function**, now runs **hourly** (not daily):
  - For each user, check if the current UTC hour matches their `preferred_hour` in their timezone. If not, skip.
  - **Daily pass:** find contacts with `next_nudge_at` falling on *today* in their timezone → send `nudge-due-today` (one email, listing all of them) + push (existing behavior).
  - **Weekly pass:** if today is Monday in their timezone AND `last_weekly_digest_at` is >6 days ago, find still-overdue contacts → send `nudge-weekly-overdue` + update `last_weekly_digest_at`.
  - Idempotency keys (`nudge-daily-<user>-<YYYY-MM-DD>`, `nudge-weekly-<user>-<YYYY-WW>`) prevent duplicates if the cron retries.
5. **Cron job** updated from `0 8 * * *` to `0 * * * *` (hourly). Per-user hour gating happens inside the function.
6. **Reminders settings UI** — new `/settings/reminders` page (and a link in the sidebar footer next to the push toggle) for the toggle + hour dropdown.

### Behavior summary


| Event                              | Push (existing) | Email (new)                        |
| ---------------------------------- | --------------- | ---------------------------------- |
| Contact due today                  | ✅ at 08:00 UTC  | ✅ at user's preferred hour (local) |
| Still overdue, day 2–6             | ✅ daily         | ❌ silent                           |
| Still overdue, weekly              | ✅ daily         | ✅ Monday catch-up                  |
| User unsubscribes via email footer | unaffected      | suppressed automatically           |


### Non-goals (kept out of this round)

- SMS / WhatsApp reminders.
- Per-contact reminder overrides (e.g. mute one person's emails).
- Editing reminder copy in-app.

### Prerequisites that will be set up automatically

- Lovable email domain + email infrastructure (one-time DNS step you'll be guided through if not already done).