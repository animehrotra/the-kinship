## Goal

Replace the static "UTC" timezone in the daily nudge settings with the user's actual local timezone

Move the ability to letting them change it to a backlog / roadmap item in [Notes.md](http://Notes.md) or a right place as applicable as low priority item.

## Changes (single file: `src/components/NotificationSettings.tsx`)

1. **Auto-default to local timezone on load**
  - When loading the profile, if `notify_timezone` is missing or still `"UTC"` (the migration default) AND the browser reports a different IANA zone, immediately persist the detected zone to `profiles.notify_timezone` and reflect it in state.
  - This silently migrates every existing user away from UTC the first time they open the panel.
    &nbsp;

**Deferred Changes for future:** 

1. **Make timezone user-editable**
  - Replace the read-only `Timezone: {tz}` line with a searchable timezone picker:
    - A shadcn `Popover` + `Command` combobox listing all IANA zones from `Intl.supportedValuesOf('timeZone')` (fallback to a curated ~50-zone list for browsers that don't support it, e.g. older Safari).
    - Current value shown on the trigger button; typing filters the list.
    - A small "Use my current timezone" link/button that resets to `Intl.DateTimeFormat().resolvedOptions().timeZone`.
  - Selecting a zone calls the same save path used for `notify_hour` (one `update` to `profiles` with `{ notify_hour, notify_timezone }`) and shows the existing "Saved" toast referencing the new zone.
2. **Keep behavior on first opt-in**
  - The existing `handleToggle` already writes the detected zone on subscribe — leave it, but it becomes a no-op for users who already have a non-UTC zone saved.

## Out of scope

- No backend changes. `check-nudges` already reads `notify_timezone` per user, so once the column is correct the function does the right thing.
- No new dependencies; `Popover` and `Command` are already in the shadcn setup.