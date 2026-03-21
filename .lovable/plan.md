

# Kinship Test Plan (Expanded)

## Part 1 — Functional Testing Plan

### Authentication

**Happy path:**
- Sign-in form renders with email, password, and submit button
- Toggling to sign-up shows a name field
- Authenticated users are redirected away from /auth
- Unauthenticated users are redirected to /auth from protected pages

**Negative scenarios:**
- Sign in with wrong password shows error toast
- Sign up with already-registered email shows error toast
- Sign in with empty email/password prevents submission (HTML validation)
- Sign up with password shorter than 6 characters shows error
- Sign up with invalid email format is rejected
- Submitting while already in-progress disables the button (no double submit)

### Nudges Dashboard

**Happy path:**
- Empty state shows "Your inner circle starts here" with CTA when no contacts exist
- Loading state shows skeleton placeholders
- Circle summary cards display correct reached/total counts for each tier
- Overdue contacts appear sorted by urgency with amber indicators
- Upcoming life events display within the 30-day window

**Negative scenarios:**
- Contacts with no `last_interaction_at` show "No interactions yet" instead of crashing
- Contacts with no `next_nudge_at` do not appear in the overdue section
- Life events with past dates do not appear in upcoming events
- Circle summary shows 0/0 for circles with no contacts assigned

### People List

**Happy path:**
- Contact cards render with name, circle badge, and last interaction
- Search filters contacts by name in real time
- Circle filter narrows the list correctly
- "Add someone" opens creation form with required fields

**Negative scenarios:**
- Search with no matching results shows empty state
- Creating a contact without a name is prevented (required field)
- Creating a contact without selecting a circle is prevented
- Duplicate contact names are allowed (not a unique constraint)
- Very long contact names render without breaking layout
- Special characters in search input do not cause errors

### Contact Detail

**Happy path:**
- Displays contact name, circle, tags, and interaction stats
- "Log interaction" opens sheet with type options
- Logging an interaction updates "last seen" and resets the nudge timer
- Life events timeline renders in reverse chronological order
- Adding a life event appends to the timeline

**Negative scenarios:**
- Navigating to a non-existent contact ID shows not-found or redirects
- Adding a life event with empty title is prevented
- Adding a life event with a date in the far future is accepted (no artificial limit)
- Logging an interaction while offline shows an error toast (network failure)
- Deleting all tags from a contact leaves an empty tag section without errors

### Archive

**Happy path:**
- Archiving a contact removes it from the People list
- Archived contacts appear on the Archive page
- Restoring a contact moves it back to People

**Negative scenarios:**
- Archive page with zero archived contacts shows "No archived contacts" message
- Archiving the last remaining contact shows empty state on People page
- Rapidly clicking Archive/Restore does not create duplicate operations

---

## Part 2 — Technical Testing Plan

*(Unchanged from previous version — unit tests for `calcNextNudge`, integration tests with RTL, mocking strategy for Supabase/Auth/React Query/Router, and test fixtures.)*

