# Khit E-Commerce Platform

A Myanmar local brand shirt e-commerce platform built as a Turborepo monorepo with Bun.

## Apps

- `apps/storefront` — customer-facing Next.js app (port `3000`)
- `apps/admin` — admin panel Next.js app (port `3001`)

## Shared packages

- `packages/ui` — shadcn/ui components and design tokens
- `packages/convex` — shared Convex backend
- `packages/lib` — shared utilities (cn, formatMMK, i18n, constants, Sentry stub)
- `packages/config` — shared ESLint, Tailwind, and TypeScript configs

## Phase 1 — Storefront

The customer-facing MVP is live in `apps/storefront`. It implements the full guest shopping flow end-to-end:

### User flow

1. Visit `/` — homepage with hero, category pills, featured pieces, and newsletter signup.
2. Browse — click a category (e.g. `/men`) or subcategory (e.g. `/men/shirts`) to land on the PLP. Filter by size, color, and price; sort by newest / price / name; paginate via **Load more**.
3. Open a product — `/products/[slug]` shows the gallery, color and size selectors, stock indicator, "free in-store pickup" badge, and an accordion with description, care, and fit details.
4. Configure — pick a color and a size, then click **Add to bag**. The cart drawer slides in from the right.
5. Cart — review items in the drawer or the full `/cart` page. Quantities can be adjusted; removal prompts for confirmation.
6. Checkout — `/checkout` collects contact + delivery info. Payment is **cash on delivery only**. Delivery method is either shipping (2,500 Ks) or free in-store pickup. Order notes are optional.
7. Confirmation — `orders.create` runs server-side with atomic stock decrement; on success, the cart is cleared and the user is redirected to `/order-confirmation/[id]`.

### Guest cart merge

Guests add to cart via `localStorage` under the `khit:guest-cart` key (versioned JSON: `{ v: 1, items: CartItem[] }`). The `useCartMergeOnAuth` hook is mounted in the storefront layout; when auth state flips to `true` and there are pending guest items, it calls `api.cart.mergeGuest` to upsert them into the user's Convex cart and clears `localStorage`. A toast confirms the merge. **Phase 2** wires the sign-in trigger; **Phase 1** ships the mutation, the hook, and the cart-merge toast.

### Local development

Three terminals:

```bash
# Terminal 1 — Convex backend
cd packages/convex
bunx convex dev

# Terminal 2 — seed the database (one-off, after Convex is running)
bun run seed

# Terminal 3 — both Next.js apps
bun run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3001

The storefront reads Convex from the URL set in `apps/storefront/.env.local` (and the admin mirrors it). See the next section for the full env setup.

## Local development

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local`:

- Convex deployment URL and auth keys
- Sentry DSN / auth token (optional for local dev)
- `SEED_ADMIN_PASSWORD` for the seed admin user

### 3. Start the dev servers

```bash
bun run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3001

## Available commands

```bash
bun run build        # Build all apps and packages
bun run lint         # Lint all apps and packages
bun run format       # Format all files with Prettier
bun run format:check # Check formatting (used in CI)
bun run typecheck    # Type-check all apps and packages
bun run seed         # Seed Convex (run from packages/convex with `bunx convex dev` first)
```

## Docker

```bash
# Development with hot reload
docker-compose up

# Production build
docker build -t khit:latest .
```

## CI

The GitHub Actions workflow runs:

```bash
bun install --frozen-lockfile
bun run lint
bun run build
bun run format:check
```

