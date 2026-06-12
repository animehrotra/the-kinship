## Publish + Live Smoke Test

### Goal
Publish the Kinship app to its public Lovable URL and run a quick live smoke test.

### Steps
1. **Security scan** — Run a fresh security scan to verify no critical findings block the publish.
2. **Publish** — Trigger `preview_ui--publish` with the current auto-generated Lovable URL (no custom slug set now; user will rename later via Project Settings → Domains).
3. **Smoke test** — Once live, verify the landing page loads, auth flow works, and core dashboard routes are reachable.

### Notes
- OG image, meta tags, Twitter card, and push notification icon fixes are already in place from the previous session.
- RLS hardening is complete.
- Visibility will follow the workspace default (can be changed later in Project Settings).