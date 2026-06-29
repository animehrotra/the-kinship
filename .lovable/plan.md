# Animated Core Loop on Landing Page

Add a new "How it works" subsection on the landing page featuring an animated phone mockup that auto-cycles through four mock app screens representing the Kinship core loop.

## Scope

- New section placed on `src/pages/LandingPage.tsx`, inserted **between the existing Hero and the current "How it works" icon row** (the icon row stays as a quick legend below the animation, so it reinforces the steps).
- Purely presentational — no new routes, no backend, no data.

## The 4 steps (auto-cycling, ~2.8s per step, infinite loop)

1. **Add a contact** — phone shows the Add Contact form with name "Priya" typing in, circle tier "Close" selected.
2. **Set frequency** — same contact card, frequency stepper animating from 1 → 2 weeks, Nudge Start Date visible.
3. **Get nudged** — phone shows a push notification banner sliding in: "Time to reach out to Priya 💛".
4. **Log connection** — dashboard view, "Log connection" button pressed (ripple), contact slides off the nudges list with a small check + sage glow, then loop restarts.

## Visual & motion direction

- **Phone frame**: rounded ~44px corners, thin sage border, soft shadow (`shadow-elegant` token style), notch at top. ~280px wide on desktop, scales down on mobile.
- **Inside the frame**: each step is its own absolutely-positioned screen; crossfade + 8px slide-up between steps using Tailwind transitions and a `useEffect` interval. No external animation libs needed (keeps bundle small); CSS keyframes + React state index.
- **Side of the phone (desktop only)**: 4 step labels stacked vertically; the active one highlights with sage accent bar and bold text. On mobile, labels appear as a row of pills under the phone.
- **Progress**: thin sage progress bar at the bottom of the phone fills over each step's duration, resets on advance.
- Uses existing tokens: `bg-card`, `text-primary` (sage), `bg-primary/10`, `border-border`, `text-muted-foreground`. No hardcoded colors.
- Respects `prefers-reduced-motion`: when set, cycling pauses on step 1 and labels become a static list (no animation).

## Files

- **New** `src/components/CoreLoopAnimation.tsx` — self-contained component holding the phone frame, 4 step screens (lightweight JSX mocks, not real app components), the interval/state, the step labels, and the progress bar.
- **Edit** `src/pages/LandingPage.tsx` — import `CoreLoopAnimation` and render it inside a new `<section>` above the existing icon-row "How it works". Update that row's heading to "The loop" (or keep — see Open question).

## Technical details

- Step state: `const [step, setStep] = useState(0)`; `useEffect` with `setInterval(() => setStep(s => (s+1) % 4), 2800)`.
- Reduced motion: read via `window.matchMedia('(prefers-reduced-motion: reduce)')` once; if true, skip the interval.
- Each screen rendered with `className={cn("absolute inset-0 transition-all duration-500", step === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none")}`.
- Progress bar: keyed on `step` so the CSS width transition restarts each cycle (`key={step}` + `animate-[grow_2.8s_linear]` keyframe added to `tailwind.config.ts`, or inline style with transition).
- No new dependencies.

## Open question (non-blocking)

- Keep the existing 3-icon "How it works" row beneath the animation as a static recap, or remove it since the animation now does that job? Default: **keep it** as a recap so the section reads at a glance for users who don't watch the animation.
