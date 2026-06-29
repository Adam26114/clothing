# Phase 6 — Cloud Convex Provisioning (`khit-clothing`)

**Status:** Approved plan — awaiting execution
**Date:** June 2026
**Author:** Planning pass after user kickoff ("step up as the next phase as convex actual setup and upload to the convex account")
**Source docs:** `PRD.md` §6 · `AGENTS.md` §Tech Stack, §Database Schema Changes, §Workflow · `README.md` §"First-time setup" · `docs/operations/production-deploy.md` §1
**Phase 5 status:** Complete and merged; Phase 5 dashboard WIP is currently in the working tree but out of scope for this phase.

---

## 1. Scope

Phase 6 has one goal — **provision a real Convex cloud deployment for this project** so the backend stops running on the local anonymous SQLite backend and shows up on the team's Convex dashboard.

Concretely:

1. Authenticate the local Convex CLI against team `zwe-aung-naing`.
2. Create a new cloud dev project named `khit-clothing`.
3. Push the current `packages/convex/schema.ts` and 14 function modules to the cloud.
4. Generate the Convex Auth secrets the password provider needs.
5. Wire the repo root `.env.local` to point at the cloud deployment.
6. Seed the cloud deployment (categories, 8 sample products, store settings, admin user).
7. Verify on the dashboard + via the CLI read tools.

No app code changes. No new dependencies. No schema changes. No `packages/convex/` source edits.

### Decisions locked in this round

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | Deploy the current working tree as-is (with Phase 5 WIP) | The WIP is UI-only in `apps/admin`. `packages/convex/` is unchanged from the last green CI; the schema/functions that get pushed are the same as `HEAD~1`. Lowest-risk path to a working cloud deployment. |
| 2 | Project name `khit-clothing` | User-selected. Matches the brand domain `khit.example` used in the deploy runbook; future production deployment can be `khit-clothing-prod` or a separate `prod:khit` per `docs/operations/production-deploy.md`. |
| 3 | Always use the cloud dev deployment going forward | Single source of truth; what runs locally matches what reviewers / Vercel previews see. The local anonymous SQLite Convex is no longer the default and its `.convex/local/` artifacts are left in place but unused. |
| 4 | Generate Convex Auth secrets via `openssl rand -base64 32` (CLI) | Equivalent to copying from the dashboard, but scriptable and reproducible. README §2 calls for copying from the dashboard; the CLI is the documented Convex auth path. |
| 5 | Sentry + Resend stay unconfigured | Both code paths no-op when their env vars are absent (`auth.ts:6-14` for Resend, `sentry-init.ts` gated on `SENTRY_DSN`). Wiring them in is a separate, post-phase step. |

### Out of scope (parking lot for later phases)

- Convex **production** deployment (`bunx --bun convex deploy --prod`) — requires a paid Convex plan. Follow `docs/operations/production-deploy.md` §1 when Vercel + DNS are ready.
- Resend sender domain + email verification / password reset flows (`auth.ts` currently degrades to a no-op).
- Sentry DSN wiring + source map uploads.
- Phase 5 dashboard WIP (separate commit on `feature/phase-5-dashboard`).
- PRD §15 open questions (brand name, pickup address, initial admin roster) — only `zweaungnaing.info@gmail.com` is seeded as admin in this phase.

---

## 2. Current state of the backend

### 2.1 Code is complete and codegenned

`packages/convex/` contains 14 function modules + 1 schema:

| File | Role |
| --- | --- |
| `schema.ts` | `defineSchema({ ...authTables, users, categories, products, cartItems, wishlistItems, orders, storeSettings, stockAudit })` — embedded `colorVariants[]` per `PRD.md` §6.8. |
| `auth.ts` | `convexAuth` + `Password` provider, Resend-gated. |
| `products.ts` / `categories.ts` / `cart.ts` / `orders.ts` / `users.ts` / `wishlistItems.ts` / `inventory.ts` / `storeSettings.ts` / `stockAudit.ts` / `storage.ts` | Domain mutations + queries. |
| `seed.ts` / `seedInternal.ts` | `api.seed.run` action — refuses to run against `CONVEX_DEPLOY_TYPE=production` without `force: true`. |
| `sentry.ts` / `sentry-init.ts` | Sentry init for Convex functions (gated). |

`_generated/api.d.ts` exists and lists all 14 modules — the codegen is up to date with the on-disk schema.

### 2.2 Why the dashboard is empty

`packages/convex/.env.local` is:

```
CONVEX_DEPLOYMENT=anonymous:anonymous-convex
CONVEX_URL=http://127.0.0.1:3210
CONVEX_SITE_URL=http://127.0.0.1:3211
```

This points at the **local anonymous Convex backend** (a SQLite file at `packages/convex/.convex/local/default/convex_local_backend.sqlite3`). It does not sync to `dashboard.convex.dev`. The team `zwe-aung-naing` has no `khit-clothing` project yet.

`apps/admin/proxy.ts` and `apps/storefront/proxy.ts` already use Convex Auth via `convexAuthNextjsMiddleware`, so once the cloud deployment is reachable, the apps will work without proxy changes.

`opencode.json` (workspace root) already wires a Convex MCP server against `packages/convex`, which will re-bind to the new cloud deployment automatically once `.env.local` is updated.

---

## 3. Step 0 — Pre-flight (read-only)

Confirm the tree is in a deployable state before touching any cloud resources. **If any of these fail, stop and report — do not proceed to step 1.**

```bash
# 1. Confirm the codegen matches the on-disk schema
diff <(grep -oE "[a-zA-Z_]+ as [a-zA-Z_]+|export default" packages/convex/_generated/api.d.ts | sort) \
     <(ls packages/convex/*.ts | xargs -n1 basename | sed 's/\.ts$//' | sort -u)
# Expected: only "export default" and the module names. If the diff is non-empty, run
# `bunx --bun convex codegen` and re-check.

# 2. Confirm the typecheck is green (catches schema ↔ function mismatches)
bun run typecheck

# 3. Confirm no `.env.local` already references a cloud deployment
grep -E "^CONVEX_(DEPLOYMENT|URL)" packages/convex/.env.local .env.local 2>/dev/null
# Expected: only the anonymous entries in packages/convex/.env.local.
```

If step 2 fails, the most likely cause is the Phase 5 WIP touching the admin app's TSX. The WIP is fine — it does not feed into the Convex deploy — but a `packages/convex/` typecheck error would block this phase.

---

## 4. Step 1 — Convex login

Authenticate the local CLI against team `zwe-aung-naing`.

```bash
bunx --bun convex login
bunx --bun convex login status
```

`login` opens a browser flow. If a browser is not available in the agent environment, use:

```bash
bunx --bun convex login --login-flow paste
# follow the prompt to paste a token from https://dashboard.convex.dev/settings/auth
```

Acceptance: `convex login status` lists the `zwe-aung-naing` team and shows an active device.

---

## 5. Step 2 — Create cloud dev project `khit-clothing`

From `packages/convex/`:

```bash
cd packages/convex
bunx --bun convex dev --once --configure new --project khit-clothing
```

What this does, in order:

1. Authenticates the CLI (uses the login from step 1).
2. Creates a new project on the cloud under team `zwe-aung-naing`.
3. Writes the new `CONVEX_DEPLOYMENT` and `CONVEX_URL` into `packages/convex/.env.local`, overwriting the anonymous entries. The resulting file should look like:
   ```
   CONVEX_DEPLOYMENT=dev:khit-clothing-<n>
   CONVEX_URL=https://khit-clothing-<n>.convex.cloud
   CONVEX_SITE_URL=http://localhost:3000
   ```
4. Pushes the current `schema.ts` and 14 function modules.
5. Regenerates `_generated/api.d.ts` against the cloud deployment's schema.
6. The dev server is then stopped (because of `--once`).

Acceptance:
- `cat packages/convex/.env.local` shows the cloud deployment name and URL.
- `packages/convex/_generated/api.d.ts` still lists all 14 modules.
- `bunx --bun convex dashboard` opens `https://dashboard.convex.dev/t/zwe-aung-naing/khit-clothing` with the **Data** tab showing 9 tables (users, categories, products, cartItems, wishlistItems, orders, storeSettings, stockAudit, plus the two `authTables` tables from `@convex-dev/auth` — `authAccounts` and `authSessions`).
- The **Functions** tab lists 14 modules.

---

## 6. Step 3 — Convex Auth secrets

The `Password` provider in `auth.ts` requires the asymmetric key pair Convex Auth uses. Without these, sign-in/sign-up are broken even though the schema deploys cleanly.

```bash
cd packages/convex
bunx --bun convex env set CONVEX_AUTH_PRIVATE_KEY "$(openssl rand -base64 32)"
bunx --bun convex env set CONVEX_AUTH_ADAPTER_SECRET "$(openssl rand -base64 32)"
bunx --bun convex env set CONVEX_SITE_URL "http://localhost:3000"
```

Acceptance:
- `bunx --bun convex env list` shows the three new env vars with values masked.

Notes:
- `CONVEX_SITE_URL` is the URL the auth code uses to construct callback URLs. For local dev this is `http://localhost:3000`; the production deployment will need to update it to the real storefront URL in a later phase.
- The same two secrets will be mirrored into the repo root `.env.local` in step 4 so the Next.js apps can validate auth cookies locally.

---

## 7. Step 4 — Wire repo root `.env.local`

```bash
cd <repo root>
cp .env.example .env.local
```

Fill in the four Convex values (mirror the values from `packages/convex/.env.local` plus the two auth secrets from step 3) and the admin seed pair. The file should end up with at minimum:

```
CONVEX_DEPLOYMENT=dev:khit-clothing-<n>
NEXT_PUBLIC_CONVEX_URL=https://khit-clothing-<n>.convex.cloud
CONVEX_AUTH_PRIVATE_KEY=<same value as step 3>
CONVEX_AUTH_ADAPTER_SECRET=<same value as step 3>
CONVEX_SITE_URL=http://localhost:3000

SEED_ADMIN_EMAIL=zweaungnaing.info@gmail.com
SEED_ADMIN_PASSWORD=<choose something secure>

# Sentry / Resend stay blank — both code paths no-op.
```

`.env.local` is git-ignored; only `.env.example` is committed.

Acceptance:
- `cat .env.local` shows the cloud deployment URL on `NEXT_PUBLIC_CONVEX_URL`.
- The `scripts/seed-convex.ts` loader (`scripts/seed-convex.ts:38-41`) reads `packages/convex/.env.local` first, then the repo root `.env.local`, so the seed in step 5 will resolve to the cloud.

---

## 8. Step 5 — Seed

```bash
cd <repo root>
bun run seed
```

This calls `api.seed.run` (per `scripts/seed-convex.ts:62`). The seed action:

1. Creates the default category tree (Men, Women, New, Sale + subcategories).
2. Inserts the eight sample products with embedded `colorVariants[]` and stock.
3. Creates the singleton `storeSettings` row with default hero text, sale banner, contact info, and pickup details.
4. Creates or promotes the admin user from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (role `admin`).
5. If `SEED_SUPER_ADMIN_*` are set, also creates or promotes a super-admin (currently commented out in `.env.example`).

`seed.ts` is gated against production: it refuses to run when `CONVEX_DEPLOY_TYPE=production` unless `force: true` is passed. The cloud dev deployment has no such guard, so `bun run seed` runs clean.

Acceptance: `seed` prints a JSON summary of row counts (categories, products, users, etc.) and exits 0.

---

## 9. Step 6 — Verification

All read-only. Run from the repo root.

```bash
# 1. Open the cloud dashboard
bunx --bun convex dashboard
# Confirm: 9 tables, 14 modules, ~16 product docs, 1 admin user.

# 2. Spot-check seeded rows
bunx --bun convex data products desc --limit 3
bunx --bun convex data categories asc --limit 6
bunx --bun convex data users asc --limit 1
# Expected: 8 products (or close to it), 5–6 categories, 1 user with role: 'admin'.

# 3. Confirm Convex Auth env vars are set
bunx --bun convex env list
# Expected: CONVEX_AUTH_PRIVATE_KEY, CONVEX_AUTH_ADAPTER_SECRET, CONVEX_SITE_URL all present (values masked).

# 4. Sanity check: the storefront and admin proxies compile against the new deployment
cd apps/storefront && bun run build
cd ../admin && bun run build
cd ../..
# Both should succeed; the only file the cloud deployment can affect at build time is
# the one Convex URL constant read by ConvexReactClient.
```

Optional follow-up smoke test (manual, requires a browser):

```bash
bun run dev
# Visit http://localhost:3000 — should show the storefront shell.
# Visit http://localhost:3001 — admin proxy redirects to /auth/login.
# Sign in with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
# Verify role-gated /admin pages render (Dashboard, Orders, Products, etc.).
```

---

## 10. Step 7 — README update + commit

Document the new deployment in `README.md` §"First-time setup" step 2 so the next developer doesn't re-do this work:

```diff
- - `CONVEX_DEPLOYMENT` — looks like `dev:ad-hoc-clothing-1`
- - `NEXT_PUBLIC_CONVEX_URL` — looks like `https://ad-hoc-clothing-1.convex.cloud`
+ - `CONVEX_DEPLOYMENT` — looks like `dev:khit-clothing-<n>` (created in Phase 6)
+ - `NEXT_PUBLIC_CONVEX_URL` — looks like `https://khit-clothing-<n>.convex.cloud`
```

Then a single commit on the current branch:

```bash
git add README.md .env.example   # .env.local is git-ignored
git commit -m "chore(infra): #phase-6 — cloud Convex project khit-clothing provisioned"
```

---

## 11. Post-phase state

- Anyone running `bun install && bun run dev` against this checkout hits the cloud `dev:khit-clothing-<n>` deployment. The local anonymous SQLite Convex is no longer the default.
- The cloud dashboard at `https://dashboard.convex.dev/t/zwe-aung-naing/khit-clothing` shows the full schema, functions, and seeded data.
- Sign-in / sign-up work against the password provider.
- The admin can be reached at `http://localhost:3001` with the seeded credentials.
- `bunx --bun convex data` and `bunx --bun convex run` are usable against the cloud deployment for debugging.

## 12. Rollback

If the cloud deployment needs to be abandoned:

1. `bunx --bun convex delete-project khit-clothing` (CLI) or delete from the dashboard.
2. Restore `packages/convex/.env.local` to the original anonymous entries from git:
   ```
   CONVEX_DEPLOYMENT=anonymous:anonymous-convex
   CONVEX_URL=http://127.0.0.1:3210
   CONVEX_SITE_URL=http://127.0.0.1:3211
   ```
3. Delete the repo root `.env.local`.
4. Local anonymous Convex resumes as before — no data loss because all seeded rows were on the cloud.

---

*End of document · Phase 6 — Cloud Convex Provisioning (`khit-clothing`) · June 2026*
