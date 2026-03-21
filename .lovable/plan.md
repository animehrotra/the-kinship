

# Disable Email Auto-Confirm

## Summary
Turn off email auto-confirmation so new sign-ups must verify their email before signing in. Update the sign-up flow to show a "Check your email" message and stay on the auth page instead of redirecting.

## Changes

### 1. Backend: Disable auto-confirm
Use `configure_auth` to set `auto_confirm_email: false`.

### 2. Update E2E helpers & tests
The E2E auth tests currently expect immediate redirect after sign-up. Update:
- `e2e/helpers.ts` — after sign-up, wait for the confirmation toast instead of redirect
- `e2e/auth.spec.ts` — the "sign up redirects to dashboard" test should expect the "Check your email" message instead of a URL change
- Note: Other E2E tests (add-contact, log-interaction, archive) that depend on `signUpTestUser` will need a different strategy (e.g. use a pre-existing test account or re-enable auto-confirm in CI only). For now, they'll be documented as requiring manual email confirmation.

### 3. No changes needed to Auth.tsx
The sign-up flow already shows a "Check your email" toast on success and does not force-redirect — the redirect only happens when a session is detected, which won't occur without email confirmation.

