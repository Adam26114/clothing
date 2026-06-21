# Phase 0 Implementation Plan — Khit E-Commerce

**Status:** Approved and ready for implementation  
**Scope:** Foundation only (Phase 0). Stop here; do not proceed to storefront or admin features until this plan is fully executed and verified.  
**Auth decision:** Convex Auth (Option B). This deviates from PRD §2 / AGENTS.md §Tech Stack which specify Better Auth; update those documents during implementation to keep them accurate.  
**Brand:** Khit  
**Locale:** English only for now; Burmese-ready i18n structure in place.  
**Currency:** MMK only, formatted via `formatMMK()`.  
**Shipping fee:** Configurable via `packages/lib/constants.ts` (default 2,500 MMK).  
**Seed admin:** `zweaungnaing.info@gmail.com`, password read from `SEED_ADMIN_PASSWORD` env var (never committed).

---

## Pre-conditions
- Bun installed and working.
- Convex CLI available (`bunx convex` works).
- User will provide `SEED_ADMIN_PASSWORD` at seed time.

---

## Step 1 — Tooling verification
- Check Bun version.
- Confirm `bunx convex` CLI works.
- Verify Node compatibility.

## Step 2 — Monorepo skeleton
- Run the pinned shadcn init command:
  ```bash
  bunx --bun shadcn@latest init --preset b2BVC6P2m --base base --template next --monorepo --rtl --pointer
  ```
- Manually create missing workspaces:
  - `apps/admin`
  - `packages/convex`
  - `packages/lib`
  - `packages/config`
- Add root configuration:
  - `package.json`
  - `turbo.json`
  - `bunfig.toml`
  - `.gitignore`

## Step 3 — Workspace aliases and shared configs
- Configure TypeScript path aliases:
  - `@workspace/ui`
  - `@workspace/convex`
  - `@workspace/lib`
- Set up `packages/config/`:
  - `eslint`
  - `tailwind`
  - `typescript`
- Move `cn()` utility to `@workspace/lib`.
- If shadcn generated `packages/ui/src/lib/utils.ts`, re-export `cn` from there to avoid breaking generated imports.

## Step 4 — Environment and tooling files
- `.env.example`:
  ```bash
  CONVEX_DEPLOYMENT=
  NEXT_PUBLIC_CONVEX_URL=
  CONVEX_AUTH_PRIVATE_KEY=
  CONVEX_AUTH_ADAPTER_SECRET=
  NEXT_PUBLIC_SENTRY_DSN=
  SENTRY_AUTH_TOKEN=
  SENTRY_ORG=
  SENTRY_PROJECT=
  SEED_ADMIN_EMAIL=zweaungnaing.info@gmail.com
  SEED_ADMIN_PASSWORD=
  ```
- `.prettierrc.json` (singleQuote, 2-space, 100 width, trailing commas, lf, prettier-plugin-tailwindcss).
- `.prettierignore`.
- `.mcp.json` shadcn MCP server config.
- `components.json` shadcn config.
- `README.md` with local dev commands and env setup.

## Step 5 — shadcn/ui components and design tokens
Install primitives:
- button, input, textarea, label, select, checkbox, radio-group, switch, slider
- card, tabs, accordion, separator, badge, tooltip, popover, dropdown-menu
- dialog, sheet, drawer, scroll-area, sonner
- table, sidebar, breadcrumb, pagination, skeleton
- avatar, command, form, calendar

Install registry blocks:
- data-table
- chart
- dashboard-01

Verification:
- `packages/ui/src/globals.css` must match DESIGN.md tokens and use Tailwind v4 `@theme inline`.
- Both apps import `@workspace/ui/globals.css`.
- Delete any local token CSS files created by shadcn init.

## Step 6 — Convex setup with embedded variants
- Create `packages/convex/schema.ts` with the full PRD §6 data model:
  - `users` (with `betterAuthId` removed / replaced by Convex Auth user link)
  - `categories`
  - `products` with embedded `colorVariants[]`
  - `cartItems`
  - `wishlistItems`
  - `orders` with snapshot items
  - `storeSettings`
- Add `packages/convex/convex.json` and `packages/convex/tsconfig.json`.
- Run `bunx convex dev` to initialize the project and generate `convex/_generated/*`.
- Create stub function files:
  - `packages/convex/products.ts`
  - `packages/convex/orders.ts`
  - `packages/convex/cart.ts`
  - `packages/convex/users.ts`
  - `packages/convex/categories.ts`
  - `packages/convex/storeSettings.ts`

## Step 7 — Convex Auth
- Add `@convex-dev/auth` to `packages/convex`.
- Create `packages/convex/auth.ts` exporting `convexAuth` with password provider enabled.
- Include Convex Auth tables in the schema export.
- Add `ConvexAuthProvider` to both app client layouts.
- Create reusable client hooks / server helpers for session and role checks.

## Step 8 — Shared utilities (`packages/lib`)
- `cn.ts` — class merging utility.
- `formatMMK.ts` — MMK currency formatter (no decimals).
- `constants.ts` — sizes, order statuses, configurable shipping fee.
- `i18n.ts` + `locales/en.json` — `t('key')` wrapper and English strings.
- `sentry.ts` — conditional Sentry init (no-op if DSN missing).

## Step 9 — Admin role guard
- `apps/admin/middleware.ts` checks Convex Auth session and `role === 'admin'`, redirecting unauthorized users.
- Storefront `middleware.ts` optional; guard `/account/*` routes if added.

## Step 10 — Sentry scaffolding
- Add `@sentry/nextjs` to both apps.
- Create in both apps:
  - `sentry.client.config.ts`
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`
- Wrap each `next.config.ts` with `withSentryConfig`.
- Initialization is conditional on `NEXT_PUBLIC_SENTRY_DSN`.
- No live DSN required in Phase 0.

## Step 11 — App layouts and placeholder pages
**Storefront (`apps/storefront`):**
- Root layout with Geist fonts, `dir="ltr"`, light-only theme.
- Minimal placeholder homepage.
- Placeholder auth pages: `/auth/login`, `/auth/register`.

**Admin (`apps/admin`):**
- Root layout using `dashboard-01` shell.
- `next-themes` provider with dark mode support.
- Minimal placeholder `/admin` dashboard page.

## Step 12 — Docker and CI
- `Dockerfile` multi-stage build with `oven/bun:1`.
- `Dockerfile.dev` for local hot-reload.
- `docker-compose.yml`.
- GitHub Actions workflow running:
  ```bash
  bun install --frozen-lockfile && bun run lint && bun run build && bun run format:check
  ```
- Root package scripts:
  - `dev`
  - `build`
  - `lint`
  - `format`
  - `format:check`

## Step 13 — Seed script
- Seed categories:
  - MEN, WOMEN, NEW, SALE
  - Subcategories under MEN and WOMEN (e.g., Casual Shirts, Formal Shirts, New Arrivals).
- Seed 6–10 sample products with:
  - embedded color variants
  - size arrays
  - stock per size
  - placeholder image storage IDs (or empty arrays if storage not yet set up)
- Seed admin user:
  - Read `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from env.
  - Create identity via Convex Auth.
  - Upsert matching `users` row in Convex with `role: 'admin'`.
- Seed initial `storeSettings` singleton with brand defaults.

## Step 14 — Verification checklist
Before declaring Phase 0 done, confirm:
- [ ] `bun install --frozen-lockfile` succeeds.
- [ ] `bun run lint` passes.
- [ ] `bun run build` passes for both apps.
- [ ] `bun run format:check` passes.
- [ ] `bunx convex dev` deploys the schema and runs without errors.
- [ ] `bun run dev` starts:
  - storefront on `http://localhost:3000`
  - admin on `http://localhost:3001`
- [ ] Admin middleware redirects non-admin users from `/admin/*`.
- [ ] Seed script creates categories, products, and the admin user.
- [ ] No hardcoded hex/oklch values or currency symbols in source.
- [ ] No hardcoded user-facing strings outside `locales/en.json`.
- [ ] `bun.lockb` is committed.

---

## Document updates required during Phase 0
- `PRD.md` §2: change "Authentication: Better Auth" to "Authentication: Convex Auth" and update the adapter note.
- `PRD.md` §6.1 `users` table: remove `betterAuthId` or replace with Convex Auth user reference.
- `AGENTS.md` §Tech Stack: change Better Auth to Convex Auth.
- `AGENTS.md` §DATABASE SCHEMA CHANGES: update `npx convex dev` command to `bunx convex dev`.

---

## Next phase (do not start yet)
**Phase 1 — Storefront MVP**
Header/footer/navigation, homepage, PLP, PDP, cart drawer, checkout, order confirmation, guest checkout, mobile responsive, i18n extraction, RTL pass.
