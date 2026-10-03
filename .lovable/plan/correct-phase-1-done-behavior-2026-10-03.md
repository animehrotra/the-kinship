# Correct Phase 1 Done behavior

## Goal

Bring the existing Phase 1 implementation in line with the corrective prompt without rebuilding work that already matches it.

## Changes

- Change DONE so it opens the existing **Log Connection** action from the prior published experience; saving the connection records the interaction, keeps the contact active, schedules the next regular nudge from the logged connection date, resets re-nudge state, and records `completed` atomically. 
- Keep **Skip** as the existing next-cycle reset action and retain the fixed day 0/14/42 reminder timeline.
- Update the Phase 1 release announcement so it clearly reflects the six-week timeline and corrected Done behavior.
- Add focused tests for Done and Skip scheduling/state changes, then run the relevant app tests.

## Technical details

- Replace the existing authenticated database action rather than adding a second action path.
- Calculate the next date from `nudge_interval_value` and `nudge_interval_unit`, matching the contact’s configured cadence.
- Apply the schema-function change through Lovable Cloud and keep the migration source synchronized.
- Preserve atomic event recording and ownership checks.