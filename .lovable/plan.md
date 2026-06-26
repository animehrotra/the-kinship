# Onboarding tour + hidden-feature tips

Add a spotlight-style guided tour for new users on first dashboard visit, and a small dismissible "Did you know?" tip card on the dashboard that rotates through hidden features for existing users. Progress is stored per user in the backend so it follows them across devices.

## 1. Backend

New table `public.onboarding_state` (one row per user):

- `user_id` (PK, FK to auth.users)
- `tour_completed_at` (timestamptz, null until finished or skipped)
- `tour_skipped` (boolean)
- `seen_tips` (text[], list of tip IDs the user has dismissed)
- `last_tip_shown_at` (timestamptz, for throttling)
- `created_at`, `updated_at`

RLS: user can select/insert/update only their own row. Standard GRANTs to `authenticated` + `service_role`. Row auto-created on first read via upsert from the client (no trigger needed).

## 2. Guided tour (first-time users)

Library: lightweight in-house spotlight component (no new dependency). A fixed overlay with a cut-out around the target element plus a tooltip card with title, description, "Skip tour" and "Next/Done" buttons. Targets are looked up by `data-tour="..."` attributes.

Steps (3 total, dashboard + sidebar):

1. Sidebar — "This is where you navigate: Dashboard, People, Archive, Tags."
2. Add Contact button — "Start by adding someone you want to stay in touch with."
3. Nudges section — "We'll remind you when it's time to reach out, based on the cadence you set."
  &nbsp;

Trigger: on `/dashboard` mount, if `onboarding_state.tour_completed_at` is null and `tour_skipped` is false, auto-start. User can also re-run from Settings area (small "Replay tour" link in sidebar footer). Completion or skip writes back to backend.

## 3. Hidden-feature tip card (existing users)

A small card at the bottom of the dashboard (above footer, below Upcoming Nudges) titled "Did you know?" with:

- Lightbulb icon, one-line feature tip, optional inline link/CTA, "Got it" dismiss button.
- Shows one tip at a time from a static list, picking the first tip whose ID is not in `seen_tips`.
- Throttle: only show if `last_tip_shown_at` is null or > 3 days ago. Dismiss updates both fields.
- Hidden entirely once all tips are seen.
- Hidden while the first-time tour is active.

Initial tip list (defined in `src/lib/onboardingTips.ts`):

- `tags` — "Use tags to group people (Family, Mentors, Work) and filter your list."
- `life-events` — "Add birthdays and milestones on a contact to never miss a moment."
- backdating → "Forgot to log a catch-up? You can backdate interactions to any past date."
- `push` — "Turn on push notifications in Settings to get nudges on your phone."
- `frequency` — "Set a custom contact frequency per person from their detail page."
- `feedback` — "Share feedback anytime from the sidebar — we read every note."
- `archive` — "Archive contacts you don't want to nudge but want to keep."

1. Tag chips on a contact card — "Group people with tags like Family, Mentors, College."
2. Log Interaction (on a contact card / People page) — "Tap here every time you connect — calls, texts, meetups."

New tips can be appended later; users only see ones they haven't dismissed.

## 4. Files

- `supabase/migrations/...` — new `onboarding_state` table + RLS + GRANTs.
- `src/lib/onboardingTips.ts` — tip list constant.
- `src/lib/useOnboarding.ts` — hook: load/upsert state, helpers `startTour`, `completeTour`, `skipTour`, `dismissTip`, `nextTip`.
- `src/components/OnboardingTour.tsx` — spotlight overlay + tooltip, step config.
- `src/components/DidYouKnowCard.tsx` — dashboard tip card.
- `src/pages/Index.tsx` — add `data-tour` attributes to Add Contact, Nudges, tag chip, Log button; mount `OnboardingTour` + `DidYouKnowCard`.
- `src/components/AppSidebar.tsx` — `data-tour="sidebar-nav"` on nav, "Replay tour" link in footer.

NOTE: Make sure the spotlight works on mobile PWA, especially when target elements are below the fold

## Out of scope

- No toasts, no on-page tooltips outside the tour.
- No analytics events.
- No changes to existing nudge logic, contact data, or styling system (tour reuses stone/sage tokens).