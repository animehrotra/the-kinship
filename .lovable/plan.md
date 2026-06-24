Add tag chips to contact cards on both the People page and the Dashboard (Index). Should be added at the end. If no tag provided by the user then should not appear.

And apply the same "name on its own row" layout to the Dashboard cards.

## 1. New hook: `useAllContactTags` in `src/lib/hooks.ts`

Fetches all `contact_tags` rows for the current user in one query and returns a `Record<contactId, Tag[]>` map. Avoids N+1 queries.

```
.from("contact_tags")
.select("contact_id, tags!inner(id, name, color, user_id)")
.eq("tags.user_id", user.id)
```

## 2. `src/pages/People.tsx`

- Call `useAllContactTags()`.
- In the second metadata row (where the circle badge + frequency live), append small tag badges using `tag.color` as background (same pattern as `ContactDetail.tsx` line 161).
- Each tag chip: `text-[10px] px-1.5 py-0`, inline style `{ backgroundColor: tag.color, color: '#fff' }` when color exists, otherwise default secondary variant.

## 3. `src/pages/Index.tsx` — Overdue + Upcoming Nudges cards

Apply the same layout treatment as People:

- Move the contact name onto its own row (status dot + name, no truncation, `break-words`).
- Move the circle badge, the frequency badge (Upcoming only), and tag chips onto a second `flex-wrap` row beneath the name.
- Keep the "Last seen…" / nudge date line and right-aligned Log button unchanged.
- Use the same `useAllContactTags` hook to render tag chips.

## Out of scope

- Upcoming Events card (not a contact card).
- No backend / DB changes.