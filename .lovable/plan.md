## Make Kinship installable (Add to Home Screen)

### Scope
Manifest-only PWA — users on iPhone/Android can install Kinship to their home screen and launch it like a real app. **No offline support** (you didn't ask for it, and it adds complexity + risk to the existing push setup).

### What changes

**1. Generate Kinship app icon**
Create a single high-res master icon in the Kinship visual identity (warm stone background, sage green "K" or kinship symbol, minimalist). From it, produce all sizes the manifest + iOS need:
- `public/icons/icon-192.png` (Android home screen)
- `public/icons/icon-512.png` (Android splash / install prompt)
- `public/icons/icon-maskable-512.png` (Android adaptive icon with safe-zone padding)
- `public/icons/apple-touch-icon.png` (180×180, iOS home screen)
- `public/favicon.png` (replaces default favicon)

**2. Add web app manifest**
Create `public/manifest.webmanifest`:
- `name: "Kinship"`, `short_name: "Kinship"`
- `description: "Nurture the relationships that matter"`
- `start_url: "/dashboard"` (skip the landing page on installed launches)
- `scope: "/"`, `display: "standalone"`
- `theme_color` + `background_color`: warm stone palette
- Icon entries pointing to the four PNGs above (with `purpose: "any"` and `purpose: "maskable"`)

**3. Update `index.html` head**
- `<link rel="manifest" href="/manifest.webmanifest">`
- `<meta name="theme-color" content="...">` matching manifest
- `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">`
- `<link rel="icon" href="/favicon.png" type="image/png">`
- Delete old `public/favicon.ico` so it doesn't override the new one
- `<meta name="apple-mobile-web-app-capable" content="yes">` + `apple-mobile-web-app-title` so iOS launches it fullscreen with the right name

**4. Update NOTES.md**
Move "pwa push web app" off the High to-do list (installability shipped; push is already implemented and just needs validation on the published app per the existing Medium item).

### What does NOT change
- **No `vite-plugin-pwa`, no Workbox, no app-shell service worker.** Per project guidance, manifest-only doesn't need them and they'd risk breaking your existing push worker.
- **`public/sw.js` (push notifications) stays exactly as-is.** It's a messaging worker, separate from installability — leaving it untouched is the correct call.
- **No registration code in `main.tsx`.** Browsers install from the manifest automatically.

### Caveat about `start_url`
Once a user installs the app, `start_url: "/dashboard"` gets cached by iOS/Android at install time. If we ever change it later, existing installs may need to reinstall. `/dashboard` is the right long-term choice (your `AppLayout` already redirects unauthed users to `/auth`), so this should be a one-time decision.

### How you'll test it
1. Publish the app (install prompts only work on the published `.lovable.app` URL, not the editor preview).
2. On Android Chrome: visit the site → browser menu → "Install app" / "Add to Home Screen".
3. On iPhone Safari: visit the site → Share → "Add to Home Screen". Launches fullscreen with the Kinship icon.
