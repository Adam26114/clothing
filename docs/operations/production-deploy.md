# Production deploy

- **Status:** Active
- **Phase:** 4e (production hardening), Phase 5 (launch)
- **Source:** PRD §5 (environment), §11 (Sentry), §14 (milestones), `phase-4-plan.md` §3.4e.4
- **Owner:** Release captain

---

This guide walks through the one-time setup, the per-deploy workflow, and the rollback path for the production environment. Dev / preview environments are out of scope here; the README's "First-time setup" section is the reference for the dev env shape.

## Prerequisites

You need accounts and projects for each of these before you start:

- **Vercel** — team with at least one paid seat (preview deployments require it). Project-level access to both `khit-storefront` and `khit-admin`.
- **Convex** — paid Convex plan (production deployment is not on the free tier). Access to a single Convex project that holds both dev and prod deployments.
- **Sentry** — a Sentry org with two projects: `khit-storefront` and `khit-admin`. Production DSNs are separate from dev per `PRD.md:683`.
- **Resend** — production sender domain verified (e.g. `hello@khit.example`).
- **Domain registrar** — control of `khit.example` to add DNS records.

## One-time setup

### 1. Create the Convex production deployment

From a clean checkout with `CONVEX_DEPLOY_TYPE=production` unset:

```bash
bunx convex deploy --prod
```

This creates the `prod:khit` deployment, pushes the current schema and functions, and prints the new deployment URL. Copy it.

Promote the same Convex project to two environments. Set the production deployment as the **default** for the prod Vercel projects in **Convex Dashboard → Settings → Deployments**. The dev deployment stays the default for local development.

### 2. Create two Vercel projects

We run the storefront and admin as **two separate Vercel projects** so the admin domain and Sentry DSN do not leak into the public bundle. The two projects share the same GitHub repo but each project has its own **Root Directory** setting (`apps/storefront` or `apps/admin`) and its own env vars.

In Vercel:

1. **Add New → Project → Import** the GitHub repo twice.
2. Project 1: `khit-storefront`, Root Directory `apps/storefront`, Framework Preset `Next.js`.
3. Project 2: `khit-admin`, Root Directory `apps/admin`, Framework Preset `Next.js`. Protect this project with a Vercel password or restrict it to your office IP — the admin panel is not meant to be public.
4. Link both to the **same Convex project** (the deployment URL is selected via env var, not via Vercel project linkage).

### 3. Sentry

Use the Sentry UI to:

- Create projects `khit-storefront` and `khit-admin` in the org.
- Grab the **production** DSN from each project's **Settings → Client Keys (DSN)**.
- Issue an **Auth Token** with `project:releases`, `project:write`, `org:read` scopes. Store it as `SENTRY_AUTH_TOKEN` in both Vercel projects.
- Note the **org slug** and **project slugs** for env vars below.

### 4. Custom domains

Assume the production domains are `shop.khit.example` and `admin.khit.example`.

In each Vercel project:

1. **Settings → Domains → Add** the custom domain. Vercel shows the required DNS records.
2. SSL is auto-provisioned by Vercel (Let's Encrypt). No action needed beyond the DNS records.
3. Redirect `www.shop.khit.example` → `shop.khit.example` via Vercel's redirect rules (add the `www` domain and pick "Redirect to primary").

### 5. Resend

Verify `khit.example` (or whichever domain sends transactional mail) in Resend and note the `RESEND_FROM_EMAIL` value to use in production. Without a verified domain, Resend rejects the message and `PRD.md:706` will surface a generic "Service unavailable" to the client.

## Environment variables

All env vars go in **Vercel → Project → Settings → Environment Variables**. Group by app.

### `khit-storefront` (apps/storefront)

| Name                         | Value                                              | Environments                     |
| ---------------------------- | -------------------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_CONVEX_URL`     | `https://prod.khit.convex.cloud` (prod Convex URL) | Production, Preview, Development |
| `CONVEX_DEPLOY_KEY`          | Prod deploy key from Convex                        | Production, Preview              |
| `NEXT_PUBLIC_SENTRY_DSN`     | Sentry DSN for `khit-storefront`                   | Production, Preview, Development |
| `SENTRY_AUTH_TOKEN`          | Sentry auth token                                  | Production, Preview              |
| `SENTRY_ORG`                 | Sentry org slug                                    | Production, Preview              |
| `SENTRY_PROJECT`             | `khit-storefront`                                  | Production, Preview              |
| `NEXT_PUBLIC_STOREFRONT_URL` | `https://shop.khit.example`                        | Production                       |
| `NEXT_PUBLIC_STOREFRONT_URL` | Preview deployment URL                             | Preview                          |
| `NEXT_PUBLIC_STOREFRONT_URL` | `http://localhost:3000`                            | Development                      |
| `RESEND_API_KEY`             | Resend API key                                     | Production, Preview              |
| `RESEND_FROM_EMAIL`          | `Khit <hello@khit.example>`                        | Production, Preview              |

### `khit-admin` (apps/admin)

| Name                         | Value                            | Environments                     |
| ---------------------------- | -------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_CONVEX_URL`     | `https://prod.khit.convex.cloud` | Production, Preview, Development |
| `CONVEX_DEPLOY_KEY`          | Prod deploy key from Convex      | Production, Preview              |
| `NEXT_PUBLIC_SENTRY_DSN`     | Sentry DSN for `khit-admin`      | Production, Preview, Development |
| `SENTRY_AUTH_TOKEN`          | Sentry auth token                | Production, Preview              |
| `SENTRY_ORG`                 | Sentry org slug                  | Production, Preview              |
| `SENTRY_PROJECT`             | `khit-admin`                     | Production, Preview              |
| `NEXT_PUBLIC_STOREFRONT_URL` | `https://shop.khit.example`      | Production, Preview, Development |
| `RESEND_API_KEY`             | Resend API key                   | Production, Preview              |
| `RESEND_FROM_EMAIL`          | `Khit <hello@khit.example>`      | Production, Preview              |

### Local `.env.local` (for the seed step)

This file is on the operator's machine, not in Vercel. The `CONVEX_DEPLOY_TYPE=production` line is what unblocks `--force` seeding against the prod deployment.

```bash
# Point at the production Convex deployment
CONVEX_DEPLOY_TYPE=production
NEXT_PUBLIC_CONVEX_URL=https://prod.khit.convex.cloud
CONVEX_DEPLOYMENT=prod:khit
CONVEX_AUTH_PRIVATE_KEY=<from Convex dashboard, prod>
CONVEX_AUTH_ADAPTER_SECRET=<from Convex dashboard, prod>

# Initial admin (rotated after first sign-in)
SEED_ADMIN_EMAIL=ops@khit.example
SEED_ADMIN_PASSWORD=<min 16 chars, store in 1Password>
SEED_SUPER_ADMIN_EMAIL=founder@khit.example
SEED_SUPER_ADMIN_PASSWORD=<min 16 chars, store in 1Password>
```

## First-time admin seed

The seed action refuses to run against a `CONVEX_DEPLOY_TYPE=production` deployment unless `force=true` is passed. `scripts/seed-convex.ts` passes `force` only when `--force` is on the command line.

Pre-flight (full checklist in [`docs/operations/production-admin-seed.md`](production-admin-seed.md)):

1. Confirm `CONVEX_DEPLOY_TYPE=production` in `.env.local`.
2. Confirm `NEXT_PUBLIC_CONVEX_URL` points at the prod deployment.
3. Confirm `SEED_ADMIN_PASSWORD` and `SEED_SUPER_ADMIN_PASSWORD` are at least 16 chars.
4. Confirm at least one of `SEED_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_EMAIL` is set.

Run:

```bash
bun run seed --force
```

The script invokes `api.seed.run({ force: true })` (`packages/convex/seed.ts:283`), which:

- Creates the default category tree (Men, Women, New, Sale + sub-categories) if absent.
- Inserts the eight sample products with embedded variants and stock if absent.
- Creates the singleton `storeSettings` row with default hero, contact, and pickup info.
- Creates or promotes the admin user from `SEED_ADMIN_*`.
- Creates or promotes the super-admin from `SEED_SUPER_ADMIN_*`.

The summary is printed to stdout — confirm both `admin.created` and `superAdmin.created` are `true` (or have an existing `userId`).

Verify by signing in to `https://admin.khit.example` with the seeded credentials.

## Continuous deployment

- **`main`** auto-deploys to **production** for both Vercel projects.
- **`develop`** auto-deploys to **preview** for both Vercel projects (Vercel generates a per-PR URL).
- Branch protection on `main` requires:
  - CI (`lint`, `typecheck`, `build`, `format:check`) — see `.github/workflows/ci.yml`
  - CodeRabbit review with no critical-severity issues — see `.coderabbit.yml`
  - At least one human approval
- A new CI job `sentry-release` (added in 4e.2) creates a Sentry release on every `main` push and uploads source maps. See [`docs/operations/sentry-alerts.md`](sentry-alerts.md).

Promote a preview to production by promoting the Vercel deployment (see Rollback below).

## Rollback

### Vercel (instant)

1. Open the affected Vercel project → **Deployments**.
2. Find the last known-good deployment.
3. **⋯ → Promote to Production**. This re-points the production domain to the prior deployment in seconds.

This is the only rollback path you will normally need. Convex is a write-once database; reverting the application code is the correct recovery for an app-level regression, not reverting the data.

### Convex (no rollback)

Convex does not have a deploy-level undo. If a bad function ships, fix-forward by shipping a new version — do not try to revert a Convex deploy. For data corruption, restore from a backup — see [`docs/operations/backup-and-export.md`](backup-and-export.md).

## DNS

The exact records depend on the registrar. The shape is:

```
# shop.khit.example
shop.khit.example.  300  IN  A     76.76.21.21

# admin.khit.example
admin.khit.example. 300  IN  CNAME  cname.vercel-dns.com.

# www redirect
www.shop.khit.example. 300 IN CNAME shop.khit.example.
```

(Adjust TTLs to taste. Vercel's IP and CNAME target are stable; the current values are in the Vercel Domains tab for each project.)

## Post-deploy verification

Run this 10-item smoke test on `https://shop.khit.example` and `https://admin.khit.example` within 10 minutes of the production deploy.

1. **Storefront home loads** — `/` returns 200, hero image visible, no console errors.
2. **PLP loads** — `/men/shirts` lists products, filter by size narrows the list.
3. **PDP loads** — `/products/oxford-classic-white` shows gallery, size, stock.
4. **Add to cart** — drawer opens, qty 1, total shows correctly.
5. **Checkout** — complete a guest checkout; order number is generated.
6. **Order confirmation** — `/order-confirmation/[id]` shows the order.
7. **Admin login** — sign in with the seeded super-admin email.
8. **Admin dashboard** — `/admin` shows the new order in "today".
9. **Sentry** — Sentry dashboard shows at least one event tagged with the release SHA.
10. **Sentry release** — the release appears under **Releases → [release-sha] → Issues** with associated source maps.

If any item fails, follow the rollback procedure above and post to `#ops`.

## Open questions

These are PRD §15 items that still block a complete launch runbook:

- **#2 Store address and pickup hours** — defaults seeded by `packages/convex/seed.ts:391` are placeholders. Update via the admin Settings page before opening for business.
- **#3 Order notification sender** — which email and phone receive new-order alerts? Not implemented yet; Resend is wired but no recipient is set.
- **#6 Initial admin users** — confirm the seed `SEED_*_EMAIL` values match the people who will run the store. Rotate these accounts via [`docs/operations/production-admin-seed.md`](production-admin-seed.md) on first sign-in.

## Related

- `docs/operations/sentry-alerts.md`
- `docs/operations/backup-and-export.md`
- `docs/operations/production-admin-seed.md`
- `docs/cross-browser-test-plan.md`
- PRD §5, §11, §14, §15
- `.github/workflows/ci.yml`
- `packages/convex/seed.ts`
