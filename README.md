# Khit E-Commerce Platform

A Myanmar local brand shirt e-commerce platform built as a Turborepo monorepo with Bun. The customer-facing storefront and the admin panel share a single design system (`packages/ui`) and a single backend (`packages/convex`).

## Apps

- `apps/storefront` — customer-facing Next.js app (port `3000`)
- `apps/admin` — admin panel Next.js app (port `3001`)

## Shared packages

- `packages/ui` — shadcn/ui components and design tokens
- `packages/convex` — shared Convex backend
- `packages/lib` — shared utilities (cn, formatMMK, i18n, constants, Sentry stub)
- `packages/config` — shared ESLint, Tailwind, and TypeScript configs

## Phase 1 — Storefront

The customer-facing MVP is live in `apps/storefront`. It implements the full guest shopping flow end-to-end.

### User flow

1. Visit `/` — homepage with hero, category pills, featured pieces, and newsletter signup.
2. Browse — click a category (e.g. `/men`) or subcategory (e.g. `/men/shirts`) to land on the PLP. Filter by size, color, and price; sort by newest / price / name; paginate via **Load more**.
3. Open a product — `/products/[slug]` shows the gallery, color and size selectors, stock indicator, "free in-store pickup" badge, and an accordion with description, care, and fit details. Tap the **heart** next to **Add to bag** to save the piece to your wishlist.
4. Configure — pick a color and a size, then click **Add to bag**. The cart drawer slides in from the right.
5. Cart — review items in the drawer or the full `/cart` page. Quantities can be adjusted; removal prompts for confirmation.
6. Checkout — `/checkout` collects contact + delivery info. Payment is **cash on delivery only**. Delivery method is either shipping (2,500 Ks) or free in-store pickup. Order notes are optional.
7. Confirmation — `orders.create` runs server-side with atomic stock decrement; on success, the cart is cleared and the user is redirected to `/order-confirmation/[id]`.

### Guest cart merge

Guests add to cart via `localStorage` under the `khit:guest-cart` key (versioned JSON: `{ v: 1, items: CartItem[] }`). The `useCartMergeOnAuth` hook is mounted in the storefront layout; when auth state flips to `true` and there are pending guest items, it calls `api.cart.mergeGuest` to upsert them into the user's Convex cart and clears `localStorage`. A toast confirms the merge. **Phase 2** wires the sign-in trigger; **Phase 1** ships the mutation, the hook, and the cart-merge toast.

## Phase 2 — Auth & accounts

Phase 2 layers customer identity on top of Phase 1. Once `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set in `.env`, the full sign-up / sign-in / password-reset / email-verification flows are end-to-end; without them, sign-up and sign-in still work and the relevant auth pages show a "Resend not configured" notice.

### Auth flow

1. `/auth/register` — create an account with name + email + password. If email verification is enabled, the user is redirected to `/auth/verify?email=…` to enter the code from their inbox.
2. `/auth/login` — sign in with email + password. Successful sign-in lands on the original `?next=` target or `/account`.
3. `/auth/forgot-password` and `/auth/reset-password` — request a code and set a new password.
4. The header account icon opens a dropdown for signed-in customers, with quick links to Profile, Orders, and Wishlist, plus a sign-out button (with a confirmation dialog).

### Account dashboard

`/account` is the customer dashboard with a sidebar:

- **Profile** (`/account/profile`) — edit name and phone. Email is read-only.
- **Orders** (`/account/orders`) — full order history. Pending orders can be cancelled in-place.
- **Wishlist** (`/account/wishlist`) — grid of saved pieces with "Move to bag" actions. Guests have a localStorage-backed wishlist that merges into the user's Convex wishlist on sign-in (mirroring the cart merge).

### Guest wishlist merge

`useWishlist` returns the union of the authed wishlist (`api.wishlistItems.list`) and a guest `localStorage` wishlist under `khit:guest-wishlist` (`{ v: 1, items: { productId, colorVariantId, size }[] }`). The `useWishlistMergeOnAuth` hook fires on sign-in, upserts pending guest items into Convex via `api.wishlistItems.add`, clears local storage, and shows a toast. The header heart icon shows the live count for both authed and guest users.

## Phase 3 — Admin panel

The admin app is live in `apps/admin` and ships six pages plus a dashboard, all admin-guarded at the proxy layer (`apps/admin/proxy.ts` checks the role from the Convex JWT and redirects to the storefront login if the caller is not an admin or super-admin).

### Pages

| Route | Page | Notes |
| --- | --- | --- |
| `/admin` | **Dashboard** | Four KPI cards (orders today, pending, MTD revenue, low-stock count) plus a visitors chart, recent orders widget, and per-product low-stock feed. |
| `/admin/orders` | **Orders** | DataTable with status filter, search, pagination, and per-row actions (status dropdown, cancel, restore). |
| `/admin/orders/[id]` | **Order detail** | Snapshot items, status workflow, cancel/restore buttons. |
| `/admin/products` | **Products** | DataTable with category, featured, and published filters; inline active/featured toggles. |
| `/admin/products/new` & `/admin/products/[id]/edit` | **Product form** | Two tabs (Details, Variants). Variants are embedded — each row edits color, images, sizes, and stock without leaving the form. |
| `/admin/inventory` | **Inventory** | Flattened variant × size grid with inline stock edit. |
| `/admin/users` | **Users** | DataTable of customers and admins; super-admins can promote or demote. |
| `/admin/users/[id]` | **User detail** | Profile, role select, full order history, total spent, lifetime months. |
| `/admin/settings` | **Storefront controls** | Hero, sale banner, announcement bar, featured products, contact, social, pickup info. |

### Conventions

- All admin mutations call `requireAdmin(ctx)` (or `requireSuperAdmin` for role changes). See `packages/convex/auth.ts` for the helper.
- Money is formatted with `formatMMK()`; user-facing strings use `t('admin.*')`.
- The DataTable primitive lives in `packages/ui/src/components/data-table.tsx` and is shared with any future list pages.
- The admin proxy (`apps/admin/proxy.ts`) replaces the legacy `middleware.ts` file convention. Next.js 16 prints a deprecation notice for `middleware`; we renamed to `proxy` in Phase 4a.

### Phase 3 sub-PR boundaries (merged)

- **3a** — Foundations (proxy guard, dashboard skeleton, DataTable, status badge).
- **3b** — Dashboard widgets (KPIs, charts, recent orders).
- **3c** — Orders list + detail + status workflow + cancel/restore.
- **3d** — Products CRUD + embedded variant editor + image upload.
- **3e** — Inventory flattened grid + inline stock edit.
- **3f** — Users list + customer detail + role management.
- **3g** — Settings (hero, sale banner, featured products, announcement bar, contact, pickup info).

## First-time setup

This is the one-time environment provisioning that a fresh clone needs before `bun run dev` will work. Both apps depend on the same Convex backend; the Convex project only needs to be created once.

### 1. Install dependencies

```bash
bun install
```

### 2. Create the Convex project

The repo uses a hosted Convex backend. Create a project (free tier is enough for development) at <https://dashboard.convex.dev> and from the **Settings** tab copy:

- `CONVEX_DEPLOYMENT` — looks like `dev:ad-hoc-clothing-1`
- `NEXT_PUBLIC_CONVEX_URL` — looks like `https://ad-hoc-clothing-1.convex.cloud`
- `CONVEX_AUTH_PRIVATE_KEY` and `CONVEX_AUTH_ADAPTER_SECRET` — from **Settings → Authentication**

Push the schema and functions:

```bash
bunx convex dev --once
```

This regenerates `packages/convex/_generated/*` and uploads the current schema. Subsequent edits to `schema.ts` and any `*.ts` function file are picked up automatically while `bunx convex dev` is running.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the required Convex values plus an admin password:

```bash
CONVEX_DEPLOYMENT=dev:ad-hoc-clothing-1
NEXT_PUBLIC_CONVEX_URL=https://ad-hoc-clothing-1.convex.cloud
CONVEX_AUTH_PRIVATE_KEY=<from the Convex dashboard>
CONVEX_AUTH_ADAPTER_SECRET=<from the Convex dashboard>

SEED_ADMIN_EMAIL=zweaungnaing.info@gmail.com
SEED_ADMIN_PASSWORD=<choose something secure>
```

Sentry, Resend, and the super-admin seed are optional — see `.env.example` for the full list.

### 4. Seed the database

```bash
bun run seed
```

This calls `api.seed.run`, which:

- Creates the default category tree (Men, Women, New, Sale plus sub-categories).
- Inserts the eight sample products with embedded variants and stock.
- Creates the singleton `storeSettings` row with default hero text, sale banner, contact info, and pickup details.
- Creates or promotes the admin user from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
- If `SEED_SUPER_ADMIN_*` are set, also creates or promotes a super-admin.

The seed action refuses to run against a Convex deployment where `CONVEX_DEPLOY_TYPE=production` unless you pass `force: true` (the script passes `--force` via `bun run seed --force`).

### 5. Start the dev servers

```bash
bun run dev
```

- Storefront: <http://localhost:3000>
- Admin: <http://localhost:3001>

Sign in to the admin with the email and password from step 3. The admin proxy (`apps/admin/proxy.ts`) redirects unauthenticated users to the storefront's login page.

### 6. Run the test suite

```bash
bun run test
```

This runs `bun test` in every package that has a `test` script. Phase 4a ships one smoke test in `packages/convex/__tests__/orders.customerStats.test.ts` that exercises `orders.customerStats` end-to-end against an in-memory Convex harness (no network, no real deployment required).

## Local development

```bash
# Terminal 1 — Convex backend (re-deploys on file changes)
bunx convex dev

# Terminal 2 — both Next.js apps
bun run dev
```

- Storefront: <http://localhost:3000>
- Admin: <http://localhost:3001>

The storefront reads Convex from the URL set in `.env.local` (and the admin mirrors it).

### Resend (email verification + password reset)

1. Get an API key at <https://resend.com/api-keys>
2. Add to `.env`: `RESEND_API_KEY=re_xxxxx` and `RESEND_FROM_EMAIL=Khit <hello@khit.com>`
3. Restart `bun run dev`. If these vars are missing, sign-up and sign-in still work — but email verification and password reset will be no-ops with a banner on the relevant pages.

## Available commands

```bash
bun run build        # Build all apps and packages
bun run lint         # Lint all apps and packages
bun run format       # Format all files with Prettier
bun run format:check # Check formatting (used in CI)
bun run typecheck    # Type-check all apps and packages
bun run test         # Run bun test in every package that has a test script
bun run test:convex  # Run the convex smoke test only
bun run seed         # Seed Convex (run from a checkout with `bunx convex dev` already configured)
```

## Docker

```bash
# Development with hot reload
docker-compose up

# Production build
docker build -t khit:latest .
```

## CI

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

```bash
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun run build
bun run format:check
```

`bun.lock` is committed and CI uses `--frozen-lockfile` to guarantee a reproducible install.

## Code review

CodeRabbit runs on every PR to `main` and `develop` (config: `.coderabbit.yml`). Critical-severity issues block merge. See [`docs/adr/0001-ui-lib-cycle.md`](docs/adr/0001-ui-lib-cycle.md) for the architectural decisions behind the current `lib` ↔ `ui` dependency direction.
