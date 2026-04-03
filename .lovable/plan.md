

# Update plan.md with new items

## Changes

1. **Move Push notifications to Built** — Push notification infrastructure is implemented (VAPID keys, service worker, subscription table, edge functions, daily cron). Update the "Built" table and mark the roadmap entry as partially complete (email still pending).

2. **Add "Test push notifications end-to-end" to Planned** — Publish the app, verify subscription saves, confirm cron delivers notifications.

3. **Add "Customer Feedback" feature to Roadmap** — A way for users to submit feedback or feature requests from within the app (e.g. a feedback form/widget).

4. **Add "Publish Project" task to Planned** — Publish the app to a live `.lovable.app` URL so it can be used and shared.

## File changed
- `.lovable/plan.md` — Update Built table (add Push Notifications row), update Planned table (add test push + publish tasks), add Customer Feedback to Future Roadmap, and annotate the P0 push/email entry to reflect push is done and email is pending.

