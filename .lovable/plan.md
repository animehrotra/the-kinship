

# Pre-Publish Security Review

## Security Scan Results

The automated scan found **5 issues** — 1 critical, 1 warning worth fixing, and 3 low-risk warnings.

### Issues to Fix

**1. CRITICAL — Contacts UPDATE policy missing WITH CHECK condition**
The current UPDATE policy on `contacts` only has a `USING` clause. This means a user could change the `user_id` on their own contact row to another user's ID, transferring ownership. We need to add a `WITH CHECK (auth.uid() = user_id)` condition.

**2. WARN — Leaked Password Protection disabled**
The HIBP (Have I Been Pwned) check is currently off. Enabling it prevents users from signing up with passwords known to be compromised in data breaches. We'll enable this via the auth settings tool.

### Issues Safe to Acknowledge (no action needed)

**3–5. Missing UPDATE policies on `interactions`, `contact_tags`, `push_subscriptions`**
These tables intentionally have no UPDATE policy — meaning updates are blocked by default (RLS deny-by-default). The app doesn't perform updates on these tables, so no fix needed. We'll mark these as acknowledged.

### Additional Review (code-level)

- **Authentication**: Auth guard on all protected routes via `AppLayout` — confirmed.
- **Email verification**: Required before sign-in (auto-confirm is off) — confirmed.
- **RLS on all tables**: All 9 tables have RLS enabled — confirmed.
- **No client-side admin checks**: Roles checked via `has_role()` security-definer function — confirmed.
- **Input validation**: Feedback widget has `maxLength={1000}`, password validation enforced client-side — confirmed.
- **Edge functions**: Use service role key server-side only, CORS headers present — confirmed.
- **No secrets in client code**: VAPID public key fetched via edge function — confirmed.

## Implementation Steps

### Step 1 — Add WITH CHECK to contacts UPDATE policy
Database migration:
```sql
DROP POLICY "Users can update own contacts" ON public.contacts;
CREATE POLICY "Users can update own contacts"
  ON public.contacts FOR UPDATE TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Step 2 — Enable leaked password protection
Use the `configure_auth` tool to enable the HIBP password check.

### Step 3 — Mark low-risk findings as acknowledged
Use the security findings tool to mark the three missing-UPDATE-policy warnings as intentionally ignored (deny-by-default behavior).

### Step 4 — Update plan.md
Add "Security hardening" to the Built table.

