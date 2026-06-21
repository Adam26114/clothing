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
- Resend keys (optional — see [Resend setup](#resend-email-verification--password-reset))

### Resend (email verification + password reset)

1. Get an API key at <https://resend.com/api-keys>
2. Add to `.env`: `RESEND_API_KEY=re_xxxxx` and `RESEND_FROM_EMAIL=Khit <hello@khit.com>`
3. Restart `bun run dev`. If these vars are missing, sign-up and sign-in still work — but email verification and password reset will be no-ops with a banner on the relevant pages.

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

