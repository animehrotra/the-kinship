# Contact detail page — Archive & Delete buttons

Update the action row on `/people/:id` (`src/pages/ContactDetail.tsx`) so the three actions sit side by side, each with an icon + label.

## Changes

1. **Log connection** — unchanged (primary sage button, flex-1).
2. **Archive button** — currently icon-only. Convert to an outline button with the Archive icon + label:
   - Label: `Archive` (or `Unarchive` when `contact.archived` is true).
   - Same outline variant, no longer `size="icon"`.
3. **Delete button** — new outline button, destructive styling (red text/border on hover), with `Trash2` icon + label `Delete`.
   - Opens an `AlertDialog` confirmation ("Delete [name]? This permanently removes the contact and all their interactions and life events. This cannot be undone.").
   - On confirm: call existing `useDeleteContact` hook, then `navigate("/people")`.

## Layout

To keep things tidy on mobile (narrow widths), stack as:
- Row 1: full-width `Log connection` (primary).
- Row 2: `Archive` and `Delete` side by side, each `flex-1`, outline variant.

This avoids cramming three buttons with labels into one row on small screens while keeping the primary action prominent.

## Technical notes

- Reuse existing `useDeleteContact` from `src/lib/hooks.ts` (already imported pattern exists).
- Reuse the existing `AlertDialog` component already imported in the file (used for life-event deletion) — add a second instance keyed off a new `deleteContactOpen` state.
- No backend changes; RLS already covers contact deletes.
- No new dependencies.
