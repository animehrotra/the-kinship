# Backend Connection panel

Add a panel in Settings that shows your project URL and publishable key with copy buttons, so you can paste them into scripts or external tools without digging through files.

## What you'll see

A new "Backend connection" section at the bottom of the Settings page, visible only to admin accounts:

- **Project URL** — read-only field with a Copy button
- **Publishable key** — masked by default (`eyJhb…AbRnk`), with Show/Hide and Copy buttons
- A short note: these two values are safe to use in client tools; Row Level Security still applies, and the tool must sign in with your Kinship account to see any data
- A second note: the service role key and database password are not available on Lovable Cloud

Copying gives a toast confirmation.

## Technical details

- New component `src/components/BackendConnectionPanel.tsx`
  - Reads `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` (already build-time inlined, no new env wiring)
  - Local `revealed` state for masking; `navigator.clipboard.writeText` + `useToast` for copy feedback
  - Renders nothing if either value is missing
- `src/pages/Settings.tsx` — add a third section using the existing `Card` + icon-heading pattern (`Plug` or `KeyRound` icon), gated behind `useIsAdmin()` so it stays hidden for regular users
- Styling uses existing semantic tokens (`border-border/50`, `text-muted-foreground`); no new colors
- No database, RLS, or backend changes
