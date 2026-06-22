## Goal
Limit the dashboard "Upcoming nudges" list to contacts due within a cutoff window, defaulting to 7 days and configurable per user.

## Changes

### 1. Database (migration)
- Add `upcoming_nudge_window_days INTEGER NOT NULL DEFAULT 7` to `profiles`.

### 2. Dashboard filter (`src/pages/Index.tsx`)
- Read the user's `upcoming_nudge_window_days` from their profile (fallback 7).
- In `upcomingNudges`, filter contacts whose `next_nudge_at` falls between now and `now + windowDays`.
- If the resulting list is empty, show a friendly empty state ("No nudges in the next N days").

### 3. Settings UI (`src/components/NotificationSettings.tsx` or nearest settings surface)
- Add a small control (select: 7 / 14 / 30 / 60 / 90 days, plus custom input) labeled "Show upcoming nudges within".
- Persist to `profiles.upcoming_nudge_window_days` via existing profile update pattern.

### 4. Tests
- Update `src/pages/Index.test.tsx` to cover: contact due within window appears; contact due beyond window is hidden; empty state renders when all nudges are beyond the window.

## Out of scope
- No change to overdue section (always shown).
- No change to `check-nudges` edge function — push notifications still fire on actual due date.
