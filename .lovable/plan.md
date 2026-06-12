## Go-live plan for Kinship

Goal: take Kinship from "feature-complete in preview" to a live, shareable, trustworthy app at a real URL. Grouped by what blocks launch vs. what makes launch good.

---

### 1. Pre-flight (must do before clicking Publish)

**a. Security scan**
Run the backend security scan and fix any critical findings (RLS gaps, exposed columns, missing GRANTs). Nothing else matters if user data leaks.

**b. Auth hardening review**
- Confirm Google sign-in provider is configured (not just enabled in code).
- Turn on leaked-password (HIBP) check.
- Confirm "no anonymous sign-ups" and email confirmation policy match what you want for v1.

**c. SEO + share metadata sweep**
- Verify `<title>`, meta description, Open Graph (`og:title`, `og:description`, `og:image`, `og:type`), and Twitter card tags on the landing page. The current `index.html` has OG title/description/type but no `og:image` and no twitter title/description — social previews will look bare.
- Generate a 1200×630 OG image (sage/stone, "Kinship — Nurture the relationships that matter").

**d. Smoke test the critical paths in preview**
Sign up → verify email → log in → add contact → log interaction → see nudge → archive → sign out → password reset. Catching a broken flow now is much cheaper than after launch.

---

### 2. Publish

- Click Publish to get the `*.lovable.app` URL.
- Visit it in an incognito window and repeat the smoke test on the live URL (auth flows behave differently outside the preview iframe).

---

### 3. Post-publish validation (only possible once live)

**a. Push notifications end-to-end**
Per your NOTES.md, push validation requires the published app. On the live URL:
- Subscribe from a real iPhone (Safari, added to Home Screen) and a real Android (Chrome).
- Trigger `check-nudges` manually and confirm a push arrives on both.
- Confirm the notification icon/badge look right (currently `/placeholder.svg` in `sw.js` — should swap to `/icons/icon-192.png`).

**b. PWA install check**
- Android Chrome: "Install app" works, launches standalone with the new icon.
- iOS Safari: "Add to Home Screen" works, launches fullscreen, icon is the concentric-circles design.

**c. Scheduled jobs**
Confirm `check-nudges` is actually being invoked on a schedule (cron / pg_cron / external trigger). If it's not scheduled yet, nothing will ever fire.

---

### 4. Custom domain (optional, recommended)

If you own a domain: connect it via Project Settings → Domains, add A + TXT records, wait for SSL. The `*.lovable.app` URL keeps working in parallel.

---

### 5. Nice-to-haves before telling real users

- Lightweight analytics (e.g. Plausible) so you know if anyone shows up.
- A "What's new / known issues" note somewhere visible, or just rely on the feedback widget you already shipped.
- Decide whether the landing page copy + screenshots reflect the current app.

---

### 6. Explicitly NOT in this plan

- Email notifications (blocked on domain purchase, parked in NOTES).
- Monetization / "Kinship Supporters" (post-launch).
- Native iOS/Android via Capacitor — PWA install is the v1 story.

---

### Suggested order for our next sessions

1. Security scan + fixes, OG image + metadata, push-icon fix in `sw.js`. *(one session)*
2. Publish + live smoke test + push validation on real devices. *(one session, partly yours on phone)*
3. Custom domain + analytics. *(short session, only when you're ready)*
