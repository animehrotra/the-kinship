

# Playwright E2E Tests for Kinship

## What We're Building

Four end-to-end test files covering the critical user flows, using the existing Playwright fixture setup.

## Test Files to Create

### 1. `e2e/auth.spec.ts` — Sign Up & Sign In
- Navigate to `/auth`, verify sign-in form renders
- Toggle to sign-up, fill name/email/password, submit
- Verify confirmation message appears ("Check your email")
- Toggle back to sign-in, verify form switches

### 2. `e2e/add-contact.spec.ts` — Add a Contact
- Requires authenticated session (sign in first)
- Navigate to `/people`
- Click "Add someone" button
- Fill the form: name, circle, nudge frequency
- Submit and verify the new contact appears in the list
- Click the contact card and verify detail page loads

### 3. `e2e/log-interaction.spec.ts` — Log an Interaction
- Requires authenticated session + existing contact
- Navigate to a contact's detail page
- Click "Log interaction" button
- Select an interaction type (e.g. "Texted")
- Click "Save"
- Verify the interaction appears in the History section

### 4. `e2e/archive.spec.ts` — Archive & Restore
- Requires authenticated session + existing contact
- From contact detail page, click the Archive button
- Verify redirect to `/people` and contact is gone from list
- Navigate to `/archive`
- Verify the archived contact appears
- Click "Restore" and verify contact returns to People list

## Technical Approach

- **Auth helper**: Create a shared helper function that signs up/in a test user via the UI before each test suite, using a unique email per test run (`test-{timestamp}@example.com`)
- **Sequential flows**: Tests within each file run in order since they depend on prior state (e.g. add contact before logging interaction)
- **Selectors**: Use text content, roles, and placeholder text for resilient selectors (e.g. `getByRole('button', { name: 'Add someone' })`)
- **Auto-confirm**: Email auto-confirm must be enabled for E2E tests to work without email verification; we'll use the configure_auth tool if needed

## Files to Create
- `e2e/auth.spec.ts`
- `e2e/add-contact.spec.ts`
- `e2e/log-interaction.spec.ts`
- `e2e/archive.spec.ts`

