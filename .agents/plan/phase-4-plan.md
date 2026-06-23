# Phase 4 — QA & Polish + Deferred Features

**Status:** Draft plan — awaiting execution approval
**Date:** June 2026
**Author:** Implementation planning pass
**Source docs:** `PRD.md` §14, §11, §12, §15 · `DESIGN.md` · `AGENTS.md` · `phase-3-plan.md` §7
**Phase 3 status:** Complete and verified (3a–3g all committed and pushed; PR #3 had a CI cycle bug fixed by 4a.0)

---

## 1. Scope

Phase 4 has two distinct concerns that both fall under "QA & Polish + deferred Phase 3 items":

1. **PRD §14** — QA & Polish (Week 8): Sentry testing, Lighthouse optimization, accessibility audit, CodeRabbit remediation, cross-browser testing, Prettier enforcement, RTL verification
2. **Phase 3 plan §7** — P1/P2 features deferred from Phase 3 (12 items)

Phase 4 is split into **five sub-phases, each shipped as a separate PR** against `develop`. **4a is blocking**; **4b–4e can run in parallel** once 4a is merged. Default sequence: 4a → 4b → 4c → 4d → 4e.

### Decisions locked in this round

- **4a is its own sub-phase** (not folded into 4b)
- **4d (Burmese + accessibility)** moved to Phase 5 — 4d is now just i18n ICU plural support (the rest of 4d is post-launch)
- **Stock audit log (4b.5)** stays in 4b with full L-effort implementation (not deferred further)
- **Start with 4a**
- **Real Convex deployment** — user has a Convex account; fold deployment + codegen + seed into 4a

### Sub-phases

| # | Sub-phase | Routes / artefacts |
|---|---|---|
| 4a | Foundations: Convex deployment, CI hardening, lint cleanup, test infra, ADR, README | No new admin pages; infra + docs |
| 4b | P1 admin features (deferred) | Date range filter, account suspension, duplicate product, restock alert threshold, stock audit log |
| 4c | P2 admin features (deferred) | Bulk status update, bulk export, drag-reorder featured products, Sentry error rate widget |
| 4d | i18n infrastructure (Burmese deferred to Phase 5) | ICU plural support in `t()` |
| 4e | Production hardening (PRD §14) | Lighthouse optimization, Sentry production readiness, cross-browser, README/ops docs |

### Out of scope (deferred to Phase 5)

- Burmese locale strings (the actual `my.json` translation file + locale switcher)
- Accessibility audit + fixes (a11y is partly in scope of 4d.2, but the deep audit is Phase 5)
- Lighthouse optimization (Phase 5)
- Real visitor analytics (chart stays on deterministic seed data)
- CodeRabbit remediation backlog (4a sets up the config; backlog cleanup is 4e)

---

## 2. Key facts about the existing setup

### 2.1 Convex backend (`packages/convex/`)
- Schema at `packages/convex/schema.ts:23` — all 3a additions live alongside original tables
- Generated types at `packages/convex/_generated/*` — **3a hand-updated `api.d.ts`** to register new `inventory` and `storage` modules; this will be replaced by a real `bunx convex codegen` in 4a.0
- `api.seed.run` action reads `SEED_ADMIN_*` and `SEED_SUPER_ADMIN_*` env vars
- `packages/lib/src/cn.ts` re-exports from `@workspace/ui/lib/utils` — **this is the lib → ui edge that creates the cycle**

### 2.2 CI (`.github/workflows/ci.yml`)
- Runs on push to `main`/`develop` and on PRs
- Steps: install → **lint** → **build** → **format:check**
- **Missing `bun run typecheck`** — would have caught the 3g cycle bug; adding it is 4a's highest-leverage CI change

### 2.3 Test infrastructure
- **No tests in the repo** (no `bun test` setup, no `bunfig.toml`, no smoke tests)
- `convex-test` package is the recommended harness for testing queries/mutations in-memory (no network, no real deployment)

### 2.4 Lint debt (current state — ~20 warnings)

**`@workspace/convex` (12 warnings)**
- `_generated/server.d.ts:1`, `_generated/server.js:1`, etc. — 4× `Unused eslint-disable directive`
- `auth.ts:17`, `auth.ts:34` — 2× `Unexpected any` (AGENTS rule violation)
- `orders.ts:16` — `'requireUserId' is defined but never used`
- `seed.ts:288` — `CONVEX_DEPLOY_TYPE` not in turbo.json
- `seed.ts:399–400` — `SEED_ADMIN_*` not in turbo.json
- `seed.ts:436–437` — `SEED_SUPER_ADMIN_*` not in turbo.json

**`@workspace/ui` (3 warnings)**
- `data-table.tsx:14` — `set-state-in-effect` (form hydration)
- `data-table.tsx:127` — `react-hooks/incompatible-library` (useIsMobile + react-compiler; pre-existing, keep)
- `data-table.tsx:146` — `set-state-in-effect` (mobile breakpoint default)

**`@workspace/storefront` (1 warning)**
- `checkout/checkout-form.tsx:52` — `react-hook-form watch incompatibility` (upstream RHF + react-compiler; keep with rationale)

**`@workspace/admin` (4 warnings)**
- `dev-data-table/page.tsx:23`, `dev-data-table/page.tsx:735` — 2× `NODE_ENV` not in turbo.json
- `middleware.ts:10` — `'request' is defined but never used`
- `dashboard/visitors-chart.tsx:62` — `set-state-in-effect` (3b mobile breakpoint default)
- `products/product-form-client.tsx` — `set-state-in-effect` (3d form hydration)

### 2.5 Next.js 16 deprecations
- Both `apps/admin/middleware.ts` and `apps/storefront/middleware.ts` are flagged: "The 'middleware' file convention is deprecated. Please use 'proxy' instead."
- Renaming to `proxy.ts` is a one-line mechanical change

### 2.6 Sentry wiring
- `apps/admin/next.config.ts` and `apps/storefront/next.config.ts` both wrap with `Sentry.withSentryConfig` when `NEXT_PUBLIC_SENTRY_DSN` is set
- `apps/admin/sentry.{client,edge,server}.config.ts` exist
- `packages/lib/src/sentry.ts` is a stub: `export * as Sentry from '@sentry/nextjs'`
- No source map upload in CI, no release tracking, no production DSN split

### 2.7 i18n
- `t()` helper at `packages/lib/src/i18n.ts` supports `{name}` parameter substitution only — **no ICU plurals**
- Single locale: `en` (`packages/lib/src/locales/en.json`)
- Admin namespace has ~270 keys across `admin.{common,dashboard,orders,products,inventory,users,settings}.*`
- Per the 3a fix, `<StatusBadge>` takes a `label` prop; `apps/admin/lib/order-status-label.ts` resolves the i18n key

### 2.8 Stock audit log — what's needed
- New `stockAudit` table: `id, productId, variantId, size, delta (number), reason (enum), actorId (userId), createdAt`
- `reason` enum: `'order_placed' | 'order_cancelled' | 'order_restored' | 'manual_adjustment'`
- Write hooks in: `orders.create`, `orders.cancel`, `orders.restore`, `inventory.setStock`
- New `inventory.auditList({ productId, variantId?, size?, limit? })` query for the inventory drill-down
- New `<InventoryAuditLog>` component (rendered in the inventory page or a per-product drawer)

### 2.9 Sentry error rate widget
- New Convex action `admin.sentryStats` that hits the Sentry API server-side using `SENTRY_AUTH_TOKEN`
- Returns `{ issuesLast24h, errorRate, ... }` for the dashboard widget
- New `<WidgetSentryErrors>` dashboard widget
- Requires real Sentry project to be meaningful; for 4c the widget renders a placeholder if `SENTRY_AUTH_TOKEN` is unset

---

## 3. Sub-phases

### 4a — Foundations: Convex deployment, CI hardening, lint cleanup · PR #1 (BLOCKING for 4b–4e)

**Goal:** Stand up the real Convex backend, close the loop on env/seed/registry, tighten CI, clean lint debt. After 4a, 4b–4e can ship against a live, seeded, typechecked, lint-clean baseline.

#### 4a.0 Convex deployment + seed (new — replaces the 3a hand-update)

**Steps**

1. **Create or pick a Convex project** — log in to https://dashboard.convex.dev, create a project (e.g. `clothing-dev`). Note the deployment name (e.g. `dev:ad-hoc-clothing-1`).
2. **Generate auth keys** — from the Convex dashboard, get:
   - `CONVEX_DEPLOYMENT`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `CONVEX_AUTH_PRIVATE_KEY`
   - `CONVEX_AUTH_ADAPTER_SECRET`
3. **Create `.env.local`** at the repo root (the real env file, not `.env.example`):
   ```bash
   CONVEX_DEPLOYMENT=dev:<your-deployment>
   NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
   CONVEX_AUTH_PRIVATE_KEY=<from dashboard>
   CONVEX_AUTH_ADAPTER_SECRET=<from dashboard>
   SEED_ADMIN_EMAIL=zweaungnaing.info@gmail.com
   SEED_ADMIN_PASSWORD=Zweaungnaung1@
   SEED_SUPER_ADMIN_EMAIL=zweaungnaing.info@gmail.com
   SEED_SUPER_ADMIN_PASSWORD=Zweaungnaung1@
   NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3000
   # Sentry (optional — leave blank to skip)
   # NEXT_PUBLIC_SENTRY_DSN=
   # SENTRY_AUTH_TOKEN=
   # SENTRY_ORG=
   # SENTRY_PROJECT=
   ```
4. **Push schema + functions** — `bunx convex dev` from repo root pushes the schema (with all 3a additions) and functions; auto-regenerates `_generated/*` (replaces the hand-updated `api.d.ts` from 3a).
5. **Seed admin + super-admin** — `bun run seed` calls `api.seed.run`. With the credentials above, creates/updates `zweaungnaing.info@gmail.com` as both admin and super-admin.
6. **Verify login** — `bun --filter @workspace/admin dev` (port 3001). Visit `http://localhost:3001/auth/login`, sign in with `zweaungnaing.info@gmail.com` / `Zweaungnaung1@`.

**Risks / things to confirm**
- `bunx convex dev` is interactive (prompts for login). Either run it and paste keys, or run it directly with auth.
- The 3a `super-admin` path promotes the same user to super-admin if the env vars match. Use a different `SEED_SUPER_ADMIN_EMAIL` for a separate super-admin account.
- Convex free tier is sufficient for dev; no payment setup needed.

#### 4a.1 Typecheck in CI
- Edit `.github/workflows/ci.yml`: add `bun run typecheck` between `lint` and `build`
- Most impactful CI improvement; would have caught the 3g cycle bug

#### 4a.2 Test infrastructure
- Add `test` script to root `package.json` and per-package
- Configure `bun test` (no new deps — bun built-in)
- Add `bunfig.toml` test config if needed
- **One smoke test**: `packages/convex/src/__tests__/orders.customerStats.test.ts` — tests `customerStats` against an in-memory Convex harness
- Add `convex-test` as a dev dep in `packages/convex` (`bun add -d convex-test`)

#### 4a.3 Lint warning cleanup (~20 warnings)

**Convex (12)**
- `auth.ts:17,34` `any` → `unknown` + type guards
- `orders.ts:16` unused `requireUserId` → delete
- `_generated/*` 4× unused eslint-disable → add `packages/convex/eslint.config.js` ignores for `_generated/**`
- `SEED_*` and `CONVEX_DEPLOY_TYPE` env → declare in `turbo.json` `globalEnv`

**UI (3)**
- 2× `set-state-in-effect` → refactor to "store prev value, setState during render" pattern (same fix used in 3e `StockCellEditor`)
- 1× `useIsMobile` react-compiler incompatibility → keep (pre-existing shadcn warning, document)

**Storefront (1)**
- 1× react-hook-form watch incompatibility → keep with `eslint-disable-next-line` + rationale comment

**Admin (4)**
- 2× `NODE_ENV` → declare in `turbo.json` `globalEnv`
- 2× `set-state-in-effect` → refactor to prev-value-during-render
- 1× unused `request` → prefix `_request` or drop

#### 4a.4 Next 16 `middleware` → `proxy` migration
- Rename `apps/admin/middleware.ts` → `apps/admin/proxy.ts` (re-export `default`)
- Rename `apps/storefront/middleware.ts` → `apps/storefront/proxy.ts`
- Both build logs warn: "The 'middleware' file convention is deprecated. Please use 'proxy' instead."

#### 4a.5 CodeRabbit config
- Add `.coderabbit.yml` at repo root
- Path filters, language-specific instructions, ignore patterns for `_generated/**`, label mapping
- Document in README: "CodeRabbit runs on every PR to main and develop; resolve all critical-severity issues before merge"

#### 4a.6 ADR-0001 — ui ↔ lib cycle decision
- Create `docs/adr/0001-ui-lib-cycle.md` documenting:
  - The cycle: `@workspace/lib → @workspace/ui` (for cn) + `@workspace/ui → @workspace/lib` (for t)
  - Why 3a chose Option A (inline `label` prop on `<StatusBadge>`) over moving i18n packages
  - Tradeoffs and the exit path

#### 4a.7 README polish
- Add "Phase 3 — Admin Panel" section with all 6 admin pages
- Add "First-time setup" section with the Convex + env + seed steps from 4a.0
- Document the 3 deferred PR boundaries (3a, 3b, …, 3g)

#### 4a.8 Verification
- `bun run lint` → 0 errors, **0 warnings** (down from ~20)
- `bun run typecheck` → 5/5 packages
- `bun run build` → 2/2 (admin + storefront)
- `bun run format:check` → 4/4 packages
- `bun test` → 1 smoke test passes
- CI runs typecheck (verified by inspecting `.github/workflows/ci.yml`)
- `.env.local` populated, `bunx convex dev` works, `bun run seed` succeeds
- **Login works**: `zweaungnaing.info@gmail.com` / `Zweaungnaung1@` (super-admin) can access `/admin`
- ADR-0001 committed

---

### 4b — P1 admin features (deferred §7) · PR #2 (parallel after 4a)

#### 4b.1 Date range filter on orders (P1)
- New `createdAt: { gte?, lte? }` arg on `orders.adminList`
- New `<DateRangePicker>` component in `apps/admin/components/admin/orders/`
- 4b.1 adds a "7d / 30d / 90d / Custom" range selector to `OrdersTableToolbar`

#### 4b.2 Account suspension toggle (P1)
- **Backend ready**: `users.setActive({ userId, isActive })` already exists from 3a
- Add a `<Switch>` in `<UserDetailHeader>` next to role (super-admin only, can't self-suspend)
- `<AlertDialog>` confirm on toggle
- Toast on success/failure

#### 4b.3 Duplicate product (P1)
- New `products.duplicate({ id })` mutation: clones scalars + variants with fresh `crypto.randomUUID()` variant ids + empty `images` arrays + slug `original-slug-copy`
- "Duplicate" row action in `apps/admin/components/admin/products/columns.tsx`
- After duplicate, navigate to `/admin/products/${newId}/edit`

#### 4b.4 Restock alert threshold (P1)
- New `storeSettings.lowStockThreshold?: number` field (default `LOW_STOCK_THRESHOLD` = 5)
- New mutation `storeSettings.update` already takes arbitrary fields — no new mutation needed
- Settings page gets a new field; dashboard `<WidgetLowStock>` honors the configured threshold
- `<InventoryToolbar>` low-stock filter uses the threshold too

#### 4b.5 Stock audit log per variant (P1) — user-flagged as important
- New `stockAudit` table schema:
  ```ts
  defineTable({
    productId: v.id('products'),
    variantId: v.string(),
    size: v.string(),
    delta: v.number(),          // signed
    reason: v.union(
      v.literal('order_placed'),
      v.literal('order_cancelled'),
      v.literal('order_restored'),
      v.literal('manual_adjustment')
    ),
    actorId: v.optional(v.id('users')),
    orderId: v.optional(v.id('orders')),
    createdAt: v.number(),
  })
    .index('by_product_variant', ['productId', 'variantId'])
    .index('by_created', ['createdAt'])
  ```
- Write hooks in:
  - `orders.create` (when decrementing stock): `delta: -quantity, reason: 'order_placed', actorId: customerId, orderId`
  - `orders.cancel`: `delta: +quantity, reason: 'order_cancelled', actorId, orderId`
  - `orders.restore`: `delta: -quantity, reason: 'order_restored', actorId, orderId`
  - `inventory.setStock`: compute `delta: newQty - oldQty, reason: 'manual_adjustment', actorId: adminId`
- New `inventory.auditList({ productId, variantId?, size?, page?, pageSize? })` query
- New `<InventoryAuditLog>` component rendered in inventory page (collapsible per row, or drawer triggered from row actions)
- i18n keys: `admin.inventory.audit.*` (~10 keys: title, columns, noHistory, etc.)

#### 4b.6 Definition of done
- All 5 P1 features work end-to-end against the real Convex
- `bun run lint` → 0 errors, 0 warnings
- CI gates green
- Stock audit log is **append-only** (never edited, never deleted by the app)
- Audit log visible in the UI with delta + reason + actor + timestamp

---

### 4c — P2 admin features (deferred §7) · PR #3 (parallel after 4a)

#### 4c.1 Bulk status update on orders (P2)
- Reuse the `bulkActions` slot on `<DataTable>` (already wired in 3a)
- New `orders.bulkUpdateStatus({ ids, status })` mutation
- Toolbar: "Update status" button visible when ≥1 row selected → opens `<Select>` for new status → confirm `<AlertDialog>` → apply to all
- Toast: "Updated N orders to {status}"

#### 4c.2 Bulk export (CSV) (P2)
- New "Export selected" button in bulk-action toolbar
- Client-side CSV generation from selected rows (use a small `toCsv(rows, columns)` helper, no new dep)
- File name: `orders-YYYY-MM-DD.csv`
- Triggers download via `Blob` + `URL.createObjectURL`

#### 4c.3 Drag-reorder of featured products (P2)
- New `storeSettings.featuredOrder: v.array(v.id('products'))` field (optional, fall back to `isFeatured: true` set)
- `@dnd-kit/sortable` (needs to be added to `apps/admin/package.json` direct deps)
- New "Reorder" view in the settings featured section
- Mutation: `storeSettings.update({ featuredOrder: v.array(v.id('products')) })`
- The featured-products list in settings becomes drag-reorderable

#### 4c.4 Sentry error rate widget on admin dashboard (P2)
- New Convex action `admin.sentryStats()` that calls the Sentry API server-side using `SENTRY_AUTH_TOKEN`
- Returns `{ issuesLast24h, errorRate, ... }`
- New `<WidgetSentryErrors>` dashboard widget
- Placeholder if `SENTRY_AUTH_TOKEN` is unset (shows "Sentry not configured")
- i18n keys: `admin.dashboard.sentryErrors`, `admin.dashboard.sentryNotConfigured`

#### 4c.5 Definition of done
- All 4 P2 features work end-to-end
- CI gates green
- Bulk export produces a valid CSV (test with a sample download)
- Featured drag-reorder persists across reload

---

### 4d — i18n infrastructure (Burmese deferred to Phase 5) · PR #4 (parallel after 4a)

**Scope is reduced**: only the ICU plural support in the `t()` helper. The Burmese `my.json` translation + locale switcher moves to Phase 5 along with the accessibility audit.

#### 4d.1 ICU plural support in `t()`
- Replace `applyParams` in `packages/lib/src/i18n.ts` with proper ICU MessageFormat support
- Two options:
  - (a) Hand-roll a tiny ICU parser (works for `plural` and `select`; ~50 lines)
  - (b) Add `intl-messageformat` (new dep, but standard)
- Recommended: **(a)** — only `plural` is needed for now; add `select` later
- Update consumers: any key using `{count, plural, one {# item} other {# items}}` syntax

#### 4d.2 Update `user-order-history.tsx` i18n key
- Currently uses `ltv` and `ltvOne` flat keys (3f workaround)
- With ICU plurals, collapse to one key: `ltv` with `{months, plural, one {# month} other {# months}}`
- Same for any other 3f keys that used flat plural workarounds

#### 4d.3 Definition of done
- ICU plurals work in `t()` for all 6 orders statuses + LTV
- 3f's flat plural workarounds collapsed to single keys
- All CI gates green

---

### 4e — Production hardening (PRD §14) · PR #5 (after 4b–4d)

#### 4e.1 Lighthouse optimization
- Run Lighthouse on key pages: `/`, `/[category]`, `/products/[slug]`, `/checkout`, `/admin`
- Address LCP, CLS, INP
- Targets: LCP < 2.5s, Lighthouse mobile ≥ 90, a11y ≥ 95

#### 4e.2 Sentry production readiness
- Set `SENTRY_RELEASE` env (from git SHA in CI)
- Configure source map upload in CI step
- Wire `Sentry.captureException` in: `orders.create` failure, `storage.generateUploadUrl` failure, `users.setRole` failure
- Production DSNs (separate from dev) per PRD §11.1

#### 4e.3 Cross-browser test plan
- Document the supported matrix (Chrome 100+, Safari 15+, Firefox 100+, Samsung Internet 18+ per PRD §12)
- Manual smoke test on each (or BrowserStack if budget allows)

#### 4e.4 README + ops docs
- Production deploy guide (Vercel)
- DNS + SSL setup
- Production admin user seed (PRD §15 open question #6)
- Sentry alerts configuration
- Backup / data export for storeSettings + users

#### 4e.5 Definition of done
- Lighthouse scores meet targets
- Sentry captures exceptions end-to-end (manual test with a deliberate throw)
- README has a "Deploying to production" section

---

## 4. Cross-cutting rules (apply to every sub-phase)

- Bun only, all deps in `packages/*` first then consumed via workspace aliases
- All user-facing strings via `t('admin.*')` — no hardcoded English in JSX
- All money via `formatMMK()`
- All colors/tokens via `packages/ui/src/styles/globals.css` — no hex in JSX
- Every Convex mutation: `await requireAdmin(ctx)` (or `requireSuperAdmin` for promotions)
- Every list page: shared `<DataTable>` + `<AdminPageHeader>` + `<EmptyState>` + `<DataTableSkeleton>`
- Embedded `colorVariants` only — never split into a separate table (PRD §6.8)
- After every sub-phase: `bun run lint && bun run build && bun run format:check && bun run typecheck` must pass; CI gates the PR
- After every sub-phase that touches `packages/convex/schema.ts`: regenerate codegen, run `bunx convex dev` to push
- Branching: `feature/phase-4a-quality`, `feature/phase-4b-p1-admin`, … each targeting `develop`; commit format `<type>: #<issue> — <summary>` (Conventional Commits)
- Use `question` tool to ask the user when a decision surfaces that wasn't covered in this plan
- Use sub-agents for parallel feature implementation within a sub-phase where possible
- After schema changes, `bunx convex codegen` and verify the generated `_generated/*` files are updated and committed (AGENTS §"DATABASE SCHEMA CHANGES")
- Never edit `components/ui/*` directly; compose in `apps/admin/components/admin/*` (AGENTS §"NEVER DO")

## 5. Verification per sub-phase

1. `bun install --frozen-lockfile` clean
2. `bun run lint` clean
3. `bun run typecheck` clean
4. `bun run build` clean
5. `bun run format:check` clean
6. `bun test` (after 4a) passes
7. `bunx convex codegen` run after any `schema.ts` change; commit the regenerated `_generated/*`
8. `bunx convex dev` deploys new functions
9. `bun run seed` succeeds (idempotent; super-admin path exercised in 4a)
10. Visual: load `/admin` in light + dark, LTR + RTL
11. Manually walk through the PRD §10 checklist for the touched page

## 6. Dependency graph

```
4a (quality) ─┬──> 4b (P1 admin)
              ├──> 4c (P2 admin)
              ├──> 4d (i18n infrastructure)
              └──> 4e (prod hardening)
```

4a must merge first. 4b–4e can be parallelised once 4a is on `develop`; default sequence is 4b → 4c → 4d → 4e.

## 7. Open items (deferred)

- Date range filter on orders, bulk status update, bulk export — **moved to 4b/4c**
- Duplicate product, account suspension, stock audit log, restock alert threshold — **moved to 4b**
- Sentry error rate widget on admin dashboard — **moved to 4c**
- Announcement bar admin UI — **already shipped in 3g**
- Drag-reorder of featured products — **moved to 4c**
- Real-time visitor analytics (chart stays on deterministic seed data) — deferred indefinitely
- Burmese locale, accessibility audit — **moved to Phase 5**
- CodeRabbit backlog remediation (config lands in 4a; clean backlog is 4e)
- Lighthouse optimization — **moved to 4e**
- i18n ICU plurals — **moved to 4d**

---

*End of document · Phase 4 Plan v1 · June 2026*
