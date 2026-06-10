## Move email reminders to backlog

You don't want to buy a domain right now, so we'll pull the half-built email reminder system out of the MVP and restore the simple push-only behavior that was working before. Nudges will continue to act as reminders via push notifications (and the visual "overdue" indicators on the dashboard).

### What changes in the app

- **Reminders settings page** (`/settings/reminders`) — removed. The sidebar "Reminders" link goes away.
- **Push notification toggle** — moves back to wherever it lived before (sidebar footer), unchanged in behavior.
- **Push reminders** — keep working exactly as before: daily check at 08:00 UTC, browser push for due/overdue contacts.
- **No email sending, no preferred-hour picker, no weekly digest.** Nothing user-visible related to email.

### What changes under the hood

1. **Revert `check-nudges` Edge Function** to its previous daily, push-only version (remove timezone logic, email branch, preference lookups).
2. **Cron** — unschedule `hourly-nudge-check`, re-schedule `daily-nudge-check` at `0 8 * * *`.
3. **Drop the `notification_preferences` table** and the `reminder_frequency` enum via a new migration. Also remove the `handle_new_user` trigger row-insert for it (keep the trigger if it does other work; otherwise drop the email-prefs piece only).
4. **Delete `src/pages/ReminderSettings.tsx`** and its route in `src/App.tsx`.
5. **Revert `src/components/AppSidebar.tsx`** — remove the "Reminders" nav item; keep `NotificationToggle` in the footer.
6. **Update `.lovable/plan.md`** — move the email-reminder spec into a "Backlog" section so we don't lose the design work for later.

### What stays

- Push notifications (`send-push`, `get-vapid-key`, `usePushNotifications`, service worker) — untouched.
- All nudge calculation logic and dashboard UI — untouched.
- No domain setup needed. No DNS. No email infra.

### When you're ready to revisit

The full design (preferred hour, daily/weekly cadence, timezone handling, idempotency keys) is preserved in the backlog section of `.lovable/plan.md`. Bringing it back later is "buy a domain + re-apply this plan."
