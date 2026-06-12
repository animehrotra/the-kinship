
# Add "Invite a friend" share action

Give users a one-tap way to share the Kinship app link so the OG preview we just set up actually gets seen.

## Where it lives

1. **Desktop sidebar footer** — new "Invite a friend" button placed just above "Share feedback" in `AppSidebar.tsx`. Uses a `Share2` (or `Gift`) icon to differentiate from the feedback megaphone.
2. **Mobile** — add the same item to the mobile sidebar/menu in the same position. No new floating button (keeps the Megaphone FAB uncluttered).

## Behavior

When tapped:
- **If `navigator.share` is available** (most mobile browsers, Safari, modern Chrome): open the native share sheet pre-filled with:
  - title: `Kinship`
  - text: `Never lose touch with the people you love`
  - url: `https://the-kinship.lovable.app`
  This is the best path because it surfaces WhatsApp, Messages, LinkedIn, etc. directly and renders the OG image inline.
- **Fallback** (desktop browsers without Web Share): copy the URL to clipboard and show a toast "Link copied — paste it anywhere to share".

A single handler decides at runtime; no UI branching needed.

## Out of scope

- No per-user referral tracking / unique invite links.
- No "share to specific platform" buttons (X, LinkedIn, WhatsApp deep links). Native share sheet covers these.
- No changes to the OG image or meta tags — those are already in place.

## Technical details

- New file: `src/components/InviteFriendButton.tsx` — small presentational button + handler, takes `variant` prop to match the sidebar item styling already used by "Share feedback".
- Edit: `src/components/AppSidebar.tsx` — insert the new item in the footer section above the feedback row, for both desktop and mobile renderings.
- Use existing `useToast` for the clipboard fallback confirmation.
- Constants (`SHARE_URL`, `SHARE_TITLE`, `SHARE_TEXT`) live at the top of `InviteFriendButton.tsx` so they're easy to tweak.
- No backend, no new dependencies.
