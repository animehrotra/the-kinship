## Make you an admin

Your account `mehrotra.ani@gmail.com` (user id `8a676e18-7566-4bdb-b04b-17ec12b02ed1`) will be granted the `admin` role.

### What happens
- Insert a row into `public.user_roles` with your user id and role `admin` (idempotent — skipped if it already exists).

### After it runs
- Refresh the Kinship preview.
- An **Admin → Feedback** entry will appear in the sidebar.
- Open it to see every feedback submission with sender, page URL, device, viewport, and app version.
