# Production admin seed

- **Status:** Active runbook
- **Phase:** 4e (production hardening), Phase 5 (launch)
- **Source:** PRD §15 #6 (initial admin users), `phase-4-plan.md` §3.4e.4
- **Owner:** Release captain

---

The production seed is destructive if mis-run. The seed action creates real users on the real Convex deployment, with real `role: 'admin'` / `role: 'super-admin'` privileges. Documenting it standalone — separate from the broader deploy runbook — reduces the chance of an accident.

This doc is the focused reference. For the surrounding deploy flow, see [`docs/operations/production-deploy.md`](production-deploy.md).

## Why a separate doc

The seed action is the only one in the codebase that takes a `force: true` argument (`packages/convex/seed.ts:285`) and refuses to run without it against a `CONVEX_DEPLOY_TYPE=production` deployment (`packages/convex/seed.ts:288`). The intent is to make a production seed a deliberate, multi-step, multi-check operation — not a thing you do while half-paying-attention to the terminal.

A second reason: rotating or off-boarding an admin is a separate concern from the initial seed, and the rotation path is currently a manual one (no Convex action yet). The two paths need different checklists, and a single doc would mix them.

## Pre-flight checklist

Tick each box before running the seed. If any box is untickable, stop and resolve it.

- [ ] **1. `CONVEX_DEPLOY_TYPE=production` is set** in `.env.local` (this is the local file used to run the seed; it is not committed).
- [ ] **2. `NEXT_PUBLIC_CONVEX_URL`** in `.env.local` points at the **production** Convex URL (looks like `https://prod.khit.convex.cloud`), not a dev URL.
- [ ] **3. `SEED_ADMIN_PASSWORD`** and (if used) **`SEED_SUPER_ADMIN_PASSWORD`** are each at least **16 chars** and stored in 1Password. The seed action uses them as-is — there is no policy check.
- [ ] **4. At least one of `SEED_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_EMAIL`** is set. Without at least one, the script prints a warning and skips the user creation; you will have no admin to sign in with.
- [ ] **5. 2FA is enabled** on the email account(s) above (Resend password reset / email verification routes use this email — if it is compromised, the storefront admin can be reset by an attacker).
- [ ] **6. The seed email accounts have never been registered** as customers on the same Convex deployment. The seed promotes an existing user to `admin` if one already exists, so a customer who registered earlier with the same email would suddenly gain admin on the next seed.

## Run

```bash
bun run seed --force
```

The script (`scripts/seed-convex.ts:57`) parses `--force` from `argv` and passes it as `force: true` to `api.seed.run`. The action itself (`packages/convex/seed.ts:283`) checks `process.env.CONVEX_DEPLOY_TYPE === 'production'` and throws a `ConvexError` if `force` is false (`packages/convex/seed.ts:288`).

A successful run prints a summary like:

```json
{
  "categories": { "created": 11, "skipped": 0 },
  "products": { "created": 8, "skipped": 0 },
  "storeSettings": { "created": true },
  "admin": { "created": true, "userId": "..." },
  "superAdmin": { "created": true, "userId": "..." }
}
```

If `categories` or `products` show `skipped > 0`, the seed is idempotent — it leaves the existing rows in place. The first run on a fresh deployment should show `created` for both.

## What the script does

The `api.seed.run` action (`packages/convex/seed.ts:283`) does the following, in order:

1. **Refuses** if `CONVEX_DEPLOY_TYPE=production` and `force !== true`.
2. **Categories** — inserts the default tree (Men, Women, New, Sale + sub-categories) if the `categories` table is empty (`packages/convex/seed.ts:306`).
3. **Products** — inserts the eight sample products from `SAMPLE_PRODUCTS` with embedded variants and stock (`packages/convex/seed.ts:338`) if the `products` table is empty.
4. **Store settings** — inserts the singleton `storeSettings` row with default hero, sale banner, contact, and pickup info (`packages/convex/seed.ts:375`).
5. **Admin** — if `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set, promotes the matching user to `role: 'admin'`, signing the user up via Better Auth's `auth.api.signUpEmail` and mirroring the BA user into our `users` table via `users.upsertFromBetterAuth` if it does not exist (`packages/convex/seed.ts:399`).
6. **Super-admin** — same as admin, but with `role: 'super-admin'` (`packages/convex/seed.ts:436`).

Each step is a no-op if the relevant table/row already exists.

## Verify

Sign in to the deployed admin URL with the seeded credentials:

1. Open `https://admin.khit.example` (or the preview URL during staging).
2. Sign in with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (or the super-admin equivalent).
3. The dashboard should render with the eight sample products visible in **Inventory → Low stock** (or zero low-stock if you have a healthy seed).
4. The header should show your email and an **admin** / **super-admin** role badge.

If sign-in fails, the most common cause is a typo in `SEED_ADMIN_EMAIL` or the Convex URL pointing at the wrong deployment. Re-run with `CONVEX_DEPLOY_TYPE` unset against a dev deployment to compare.

## Rotate

There is no Convex action to reset an admin password. The flow today:

1. **Convex Dashboard → Data → `users`** — find the admin row and copy `_id`.
2. **Convex Dashboard → Functions → `auth:signIn`** — cannot reset a password directly.
3. **Manual reset path** — use the Convex dashboard's "Run mutation" tool to call the underlying `account` table update. The table is `account` (Better Auth's internal credential table, owned by the BA component) and stores the hashed credential. There is no exposed mutation; the only reliable path is:
   - Delete the `account` row for the admin email.
   - Have the admin sign in via the **forgot password** flow (`/auth/forgot-password` on the storefront). Resend sends a code; the admin sets a new password.
4. Confirm the role is still `admin` on the `users` row (the sign-in flow sets role to `customer` on creation; only the seed or the admin user-edit action can promote).

**This is awkward.** A follow-up Phase 5 task is to add a `users.adminResetPassword` mutation that takes a super-admin token, looks up the target user, deletes the auth account, and sends a Resend password-reset email. Tracked in [Open items](#open-items) below.

## Off-boarding

There is no `users.delete` mutation today. To off-board an admin:

1. **Demote** to `customer` via the admin Users page (super-admin only — see `packages/convex/users.ts` for the `setRole` mutation).
2. **Deactivate** the account by setting `isActive: false` via the same page.
3. **Deactivate auth** — the deactivated user cannot sign in (`requireAdmin` checks `isActive` in `packages/convex/auth.ts`), so this is sufficient for access control. The user row stays for order history and audit references.

To **fully delete** the user row (e.g. for GDPR), use the Convex dashboard's **Data → `users` → Delete** tool. This is destructive and cannot be undone; do not delete admins who placed or handled orders unless you have a plan for the orphan `customerId` references in `orders`.

A follow-up Phase 5 task is to add a `users.delete` mutation that nulls out `customerId` on related orders and removes the auth account. Tracked in [Open items](#open-items) below.

## Open items

- **Phase 5 — `users.adminResetPassword` mutation** with a super-admin guard; sends a Resend reset email and revokes the existing session.
- **Phase 5 — `users.delete` mutation** with null-out of `orders.customerId` and auth account removal.
- **Phase 5 — `users.list` should be admin-guarded** and paginated for a future admin user search. Today the table is queried directly by the admin Users page; that is fine for the current scale.
- **Backlog** — audit log entry every time a user's role or `isActive` changes (the `stockAudit` table is variant-scoped; we need a separate `userAudit` or a generic `auditLog` table).

## Related

- `docs/operations/production-deploy.md`
- `docs/operations/backup-and-export.md`
- `packages/convex/seed.ts`
- `packages/convex/auth.ts`
- `.env.example`
- PRD §15 #6

## Better Auth signup flow (Convex-side)

The seed creates the admin through Better Auth's hosted sign-up API rather than a direct Convex Auth `createAccount` call. The end-to-end flow is:

1. **`createAuth(ctx)`** — instantiate Better Auth inside the Convex action. The function lives in `packages/convex/auth.ts:68` and is built from `createAuthOptions(ctx)` (the same options consumed by the BA HTTP routes in `packages/convex/http.ts`). The `ctx` is the action's context, which BA's component client uses to read/write the BA-owned tables (`user`, `session`, `account`, `verification`, etc.) via `authComponent.adapter(ctx)`.
2. **`auth.api.signUpEmail({ body: { email, password, name } })`** — call the BA sign-up API. The `body` is the standard BA `signUpEmail` shape; no `headers` is required because the action runs in the Convex runtime, not a browser. BA writes a row to its `user` table and a hashed credential to its `account` table.
3. **`users.upsertFromBetterAuth({ betterAuthUserId, email, name, role, isActive })`** — internal Convex mutation that mirrors the BA user into the parent app's `users` table, storing `betterAuthUserId` as the join key. This is what cart / wishlist / order foreign keys point at; without it, `requireUserId` will return `null` for the freshly-signed-up admin.

The full implementation is in `packages/convex/seed.ts:301-369` (`seedAdminUser`). If the `users` row already exists for the email, the function skips `signUpEmail` and only updates the role via `seedInternal.updateUserRole`. If the row is missing, both BA and `users` are created in the same action; if `signUpEmail` fails (e.g. BA rate-limits the seed), the action returns `{ created: false, reason }` and the operator can re-run after a short wait.

Re-running `bun run seed --force` against a deployment that already has a seeded admin is safe: the `findUserByEmail` short-circuit in `seed.ts:320-322` means the role is updated in place and the `users.betterAuthUserId` is preserved.
