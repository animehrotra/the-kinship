Update the contact card layout in `src/pages/People.tsx` so the contact name sits on its own dedicated line rather than sharing a flex row with the status dot and circle badge.

Current layout (lines 104–110):

- Status dot, name (`truncate`), and circle badge all live in one `flex items-center gap-2` row.
- Long names get clipped with `…` because the badge and buttons compete for width.

Proposed change:

1. Move the status dot and the contact name onto a full-width row. Remove `truncate` from the name and let it wrap naturally (`break-words`).
2. Move the circle badge onto a second row, grouped with the nudge frequency and last-interaction text and tag (if any) , so the name has the entire card width available.
3. Keep the action buttons (Log, Edit, Delete) aligned to the right of the card as they are today.
4. Verify on mobile that the name no longer ellipses and the card remains readable.

No backend or data changes required.