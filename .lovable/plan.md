# Feedback Flow — Build Plan (Items #1–#4)

Goal: turn feedback from "write-only" into something you can actually review, with enough context to diagnose bugs.

---

## 1. Admin can review all feedback

**What changes for you:**

- You assign yourself the `admin` role once (one-time DB action).
- A new **Admin → Feedback** page appears in the sidebar (only visible to admins) showing every user's feedback in a table: date, who submitted, category, page they were on, device, message.
- Sort by newest first, filter by category.

**Behind the scenes:**

- New RLS policy on `feedback`: admins can `SELECT` all rows; everyone else still only sees their own.
- New `/admin/feedback` route, gated by `has_role(auth.uid(), 'admin')`. Non-admins get redirected.
- Sidebar link conditionally rendered.
- Join `feedback.user_id` → `profiles.display_name` (and `auth.users.email` via a secure view or a small RPC) so you can see *who* sent it.

---

## 2. Auto-capture page / route context

**What changes for you:**

- Every new feedback row records the URL the user was on when they clicked submit (e.g. `/people/abc-123`).
- Shows up as a column in the admin table, clickable to jump to that page.

**Behind the scenes:**

- Add `page_url TEXT` column to `feedback`.
- `FeedbackWidget` reads `window.location.pathname + search` at submit time and includes it in the insert.
- No user-visible UI change in the submit dialog.

---

## 3. Auto-capture device info (user agent + viewport)

**What changes for you:**

- Each feedback row records the browser/OS string and the screen size at time of submission.
- Admin table shows a compact device label (e.g. "iPhone Safari · 390×844") with full UA on hover.

**Behind the scenes:**

- Add `user_agent TEXT` and `viewport TEXT` (format `"WxH"`) columns to `feedback`.
- `FeedbackWidget` reads `navigator.userAgent`, `window.innerWidth`, `window.innerHeight` at submit time.
- A tiny parser in the admin view turns the raw UA into a short label.

---

## 4. Capture app version / build hash

**What changes for you:**

- Each feedback row records which version of the app was running when submitted.
- Lets you spot "this bug was on an old cached build" instantly.

**Behind the scenes:**

- Add `app_version TEXT` column to `feedback`.
- Vite config injects a build-time constant from a short git SHA (or fallback timestamp) as `__APP_VERSION__`.
- `FeedbackWidget` includes it in the insert. Admin table shows it as a short tag.

---

## Order of operations

1. **Migration** (single call): add 4 columns (`page_url`, `user_agent`, `viewport`, `app_version`), add admin `SELECT` policy on `feedback`, and grant yourself the `admin` role.
2. **Update `FeedbackWidget**` to capture and send the 4 new fields.
3. **Vite config tweak** for `__APP_VERSION__`.
4. **New `/admin/feedback` page** with the table view + access guard.
5. **Sidebar link** shown only when `has_role` returns admin.
6. Smoke-test: submit a piece of feedback from the preview, open the admin page, confirm the row shows up with all context populated.

---

## Open questions (please confirm before I build)

- **Who is "admin"?** Should I grant the `admin` role to the currently logged-in user (you) as part of the migration, or do you want to do it manually later? Answer: do it manually later
- **Show submitter's email** in the admin table, or only their display name? (Email needs a small server-side helper since `auth.users` isn't readable from the client.) Answer: only display name is fine.
- **Sidebar placement** for the admin link: bottom of the main nav, or a separate "Admin" section? Answer: separate section