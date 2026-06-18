## Goal

Replace the generic "Couldn't enable notifications" toast with specific, actionable messages so we can tell why subscription is failing in the published app (you saw this red toast on the live site, which means the cause is NOT the preview guard — it's something else like permission, VAPID key fetch, service-worker registration, or `pushManager.subscribe`).

## Changes

### 1. `src/hooks/usePushNotifications.ts`
- Change `subscribe()` to return a discriminated result instead of `boolean`:
  - `{ ok: true }`
  - `{ ok: false, reason: "preview" | "permission-denied" | "permission-dismissed" | "no-vapid-key" | "sw-register-failed" | "subscribe-failed" | "db-failed" | "unsupported", message?: string }`
- Explicitly call `Notification.requestPermission()` before subscribing and branch on `denied` / `default`.
- Wrap each step (VAPID fetch, `serviceWorker.register`, `pushManager.subscribe`, Supabase upsert) in its own try/catch so we know which step failed, and include `err.message` in the returned reason.
- Keep current preview/iframe guard but report it as `reason: "preview"` instead of flipping state to `"unsupported"`.

### 2. `src/components/NotificationSettings.tsx`
- In `handleToggle`, branch on the new `reason` and show a tailored toast for each case:
  - `preview` → neutral toast pointing to the published URL
  - `permission-denied` → "Notifications are blocked in your browser settings" + how to re-enable
  - `permission-dismissed` → "You dismissed the permission prompt — tap Enable again"
  - `no-vapid-key` → "Server isn't configured for push yet" (destructive)
  - `sw-register-failed` / `subscribe-failed` / `db-failed` → destructive toast that includes the underlying error message so we can diagnose
- Also `console.error` the full reason+message so it appears in browser devtools / our logs on the next message.
- Add a small inline hint inside the card (not a toast) when running in the editor preview, so the Enable button's behavior is obvious upfront.

### 3. No backend changes
This is purely a UI/diagnostics change. The cron, edge functions, and DB schema stay as-is.

## How we'll diagnose your published-app failure

After this ships, tap Enable again on the published Android PWA. The new toast will name the exact failing step (e.g. "subscribe-failed: Registration failed - push service error"). Share that and I can fix the underlying cause in a follow-up — common culprits in published PWAs are a missing/incorrect VAPID key on the edge function, the service worker not being served at `/sw.js`, or Google's FCM endpoint rejecting the subscription.