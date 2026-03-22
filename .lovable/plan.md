

# Post-Email-Verification Flow Fix

## Summary
After clicking the email verification link, users should be redirected to the dashboard with a confirmation message that their account is active.

## Current Issues
1. `emailRedirectTo` points to `/` (landing page) — no redirect to dashboard
2. No confirmation message shown after verification
3. Landing page doesn't handle the auth token in the URL

## Changes

### 1. Update `emailRedirectTo` in Auth.tsx
Change from `window.location.origin` to `window.location.origin + '/dashboard'` so verified users land on the dashboard directly.

### 2. Detect email verification in AuthProvider
Listen for the `SIGNED_IN` event (which fires after email verification redirect) in `onAuthStateChange` within `src/lib/auth.tsx`. When the event is triggered from a verification flow, show a toast: "Email verified — your account is active!"

### 3. Handle redirect on the dashboard
Since the dashboard is behind auth (via `AppLayout`), if the session is valid after verification, the user will see the dashboard. If for some reason the session isn't picked up, they'll be redirected to `/auth` where they can sign in normally.

### 4. Handle the landing page case
Update `LandingPage.tsx` to check for auth tokens in the URL hash (fallback if the user somehow lands on `/` with tokens) and redirect to `/dashboard`.

## Technical Detail
- The `onAuthStateChange` callback receives event types including `SIGNED_IN`. We can show a toast when this fires and the URL contains verification-related hash fragments (`access_token`, `type=signup`).
- Alternatively, check for `event === 'SIGNED_IN'` combined with `session?.user?.email_confirmed_at` being very recent.

