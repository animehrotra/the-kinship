## Move feedback button into sidebar (desktop) — keep FAB on mobile

### Goal
Reduce visual noise on desktop by relocating the "Share feedback" entry into the sidebar footer next to Sign out. Mobile keeps the existing floating Megaphone button since there's no sidebar there.

### Changes

**1. `src/components/FeedbackWidget.tsx`**
- Split into two exports:
  - `FeedbackDialog` — the dialog/form logic, controlled via `open` / `onOpenChange` props. No trigger button of its own.
  - `FeedbackWidget` (mobile FAB) — renders the Megaphone floating button + `FeedbackDialog`. Add `md:hidden` so it only appears on mobile/tablet.

**2. `src/components/AppSidebar.tsx`**
- In `SidebarFooter`, add a new `SidebarMenuItem` above the Sign out item:
  - Icon: `Megaphone` (lucide-react)
  - Label: "Share feedback"
  - On click: opens `FeedbackDialog` via local `useState`
- Collapsed sidebar shows just the icon (consistent with existing items).
- Style matches the Sign out button (muted foreground, hover accent).

**3. `src/components/AppLayout.tsx`**
- No structural change needed — `FeedbackWidget` stays mounted globally; its internal `md:hidden` handles the desktop hiding.

### Result
- **Desktop:** Clean dashboard, no floating button. Feedback lives in the sidebar footer right above Sign out.
- **Mobile:** Unchanged — Megaphone FAB at bottom-right.

### Memory update
Update `mem://index.md` Core "Feedback" line to: *"Feedback widget: 'Share feedback' in sidebar footer (desktop) + Megaphone FAB (mobile only)."*
