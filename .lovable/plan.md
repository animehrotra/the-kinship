## Backlog: Email reminders (deferred)

Deferred from MVP — user opted not to purchase an email domain. Current behavior: push notifications only, daily cron at 08:00 UTC via `check-nudges`.

When revisiting, requires: verified email domain + Lovable email infra, then re-introduce:

- `notification_preferences` table (email_enabled, frequency daily/weekly, preferred_hour 0–23, preferred_weekday 0–6, timezone, last_daily_sent_on, last_weekly_sent_on).
- Two React Email templates: `nudge-due-today`, `nudge-weekly-overdue`.
- Rewrite `check-nudges` to run hourly with per-user timezone hour gating; daily pass for due-today, weekly pass on user's chosen weekday.
- Cron change from `0 8 * * *` to `0 * * * *`.
- `/settings/reminders` page with toggle, cadence, hour, and weekday picker; sidebar footer link.
- Idempotency keys: `nudge-daily-<user>-<YYYY-MM-DD>`, `nudge-weekly-<user>-<YYYY-WW>`.

Non-goals (still): SMS/WhatsApp, per-contact overrides, in-app copy editing.
