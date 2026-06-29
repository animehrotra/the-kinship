# Attach screenshot to feedback

Let users optionally attach one screenshot when submitting feedback, and let admins view it from the feedback table.

## Backend

1. **Storage bucket** `feedback-screenshots` (private). RLS on `storage.objects`:
   - Authenticated users can `INSERT` into this bucket only under a path prefixed by their own `auth.uid()` (e.g. `{user_id}/{uuid}.png`).
   - Users can `SELECT` their own files. Admins (via `has_role('admin')`) can `SELECT` any file in the bucket.
2. **Migration** on `public.feedback`:
   - Add column `screenshot_path text` (nullable) — stores the object path inside the bucket.
   - No grant changes needed (existing grants cover the new column).

## Submission flow (`src/components/FeedbackWidget.tsx`)

- Add a file input (accept `image/png,image/jpeg,image/webp`, single file, max ~5 MB validated client-side) with a small preview thumbnail and a "Remove" button.
- On submit: if a file is chosen, upload to `feedback-screenshots/{user.id}/{crypto.randomUUID()}.{ext}` first, then insert the feedback row with `screenshot_path` set. If upload fails, surface a toast and abort (don't half-submit).
- Reset the file state alongside `message`/`category` on success.

## Admin view (`src/pages/AdminFeedback.tsx`)

- Fetch `screenshot_path` with the rest of the row (type regen handles the rest).
- In the Message column, when `screenshot_path` is present, show a small "View screenshot" link below the message text. Clicking it calls `supabase.storage.from('feedback-screenshots').createSignedUrl(path, 60)` and opens the resulting URL in a new tab.
- No bulk download or inline preview; keep the table compact.

## Out of scope

- Multiple attachments, drag-and-drop, image cropping/annotation, auto-capture of current screen, video attachments.
- Deleting the file when feedback is auto-deleted after 30 days (acceptable orphan for now; can be revisited later).

## Technical notes

- Bucket is created via `supabase--storage_create_bucket` (private). RLS policies on `storage.objects` go in the same migration as the `screenshot_path` column.
- Path convention `{user_id}/{uuid}.{ext}` lets the INSERT policy check `(storage.foldername(name))[1] = auth.uid()::text`.
- Signed URL TTL kept short (60s) since admins open them on demand.
