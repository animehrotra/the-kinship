
# Add Tags + Fix Birthday Clear

## Changes

### 1. Fix: Allow clearing birthday field in `People.tsx`
- Wrap birthday `<Input type="date">` in a relative container
- Add a small X button when `form.birthday` is non-empty to reset it to `""`

### 2. Add tag mutation hooks in `src/lib/hooks.ts`
- `useCreateTag` — insert into `tags`, invalidate `["tags"]`
- `useAddContactTag` — insert into `contact_tags`, invalidate `["contact_tags", contactId]`
- `useRemoveContactTag` — delete from `contact_tags`
- Update `useCreateContact` to return the new contact ID (`.select().single()`)

### 3. Create `src/components/TagPicker.tsx`
- Combo-box/popover listing existing tags via `useTags()`
- Inline creation of new tags
- Selected tags shown as removable badges
- Props: `selectedTagIds`, `onChange`

### 4. Update "Add someone" dialog in `People.tsx`
- Add TagPicker below Notes field
- After contact creation (with returned ID), insert selected tag associations

### 5. Update `ContactDetail.tsx`
- Display assigned tags using `useContactTags(id)`
- Add TagPicker for adding/removing tags on existing contacts

## Technical Notes
- Two-step create flow: insert contact → get ID → insert contact_tags
- Tags table has `name`, `color`, `user_id`; color is optional
- RLS already configured on `tags` and `contact_tags`
