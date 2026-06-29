# Myanmar Local Brand Shirt E-Commerce — Project Plan

## Goal

Build a production e-commerce platform for a Myanmar local shirt brand with two distinct surfaces in a single monorepo: a customer-facing storefront inspired by shop.mango.com, and an admin panel built on shadcn dashboard-01. A user browses shirts, configures a variant (color + size), adds to cart, and checks out via Cash on Delivery. The store owner manages products, orders, inventory, users, and storefront content from the admin.

Launch supports: customer auth, guest checkout, nationwide shipping + in-store pickup, COD payments, embedded product variants, embedded media, full RTL/English stack with Burmese-ready i18n, dark mode in admin, light-only storefront.

Out of scope for v1: payment gateway integration, multi-vendor/marketplace, live chat, product reviews, loyalty, bulk/wholesale pricing, SMS notifications, international shipping, multi-currency.

## Confirmed Decisions

- Monorepo: Turborepo with Bun workspaces
- Apps: `apps/storefront` (port 3000), `apps/admin` (port 3001)
- Shared packages: `packages/ui` (shadcn components), `packages/convex` (backend), `packages/lib` (utils), `packages/config` (shared ESLint/TS/Tailwind configs)
- Framework: Next.js 14+ App Router + TypeScript strict
- Styling: Tailwind v4, tokens via `@theme inline` in `packages/ui/globals.css`
- Components: shadcn/ui preset `b2BVC6P2m` (teal/emerald, neutral base, radius 0.45rem)
- Init: `bunx --bun shadcn@latest init --preset b2BVC6P2m --base base --template next --monorepo --rtl --pointer`
- Admin template: `dashboard-01` via `bunx shadcn@latest add dashboard-01`
- Backend: Convex with embedded-variant pattern (NO normalized variant tables)
- Auth: Convex + Better Auth (`@convex-dev/better-auth` + `better-auth`) with `customer`, `admin`, and `super-admin` roles, server-guarded `/admin/*` routes
- Monitoring: Sentry (`@sentry/nextjs`) on both client and server
- Icons: Lucide React only
- Fonts: Geist Sans (UI), Geist Mono (technical/code)
- Package manager: Bun only — never `npm`, `yarn`, `pnpm`
- Formatter: Prettier + `prettier-plugin-tailwindcss`
- Code review: CodeRabbit on every PR
- Deploy: Vercel (zero-config, preview per PR)
- Container: Docker multi-stage with `oven/bun:1` base
- Currency: MMK (Ks) — no decimals, formatted via `formatMMK()`
- RTL: Full right-to-left support — use logical properties (`ms-*`, `me-*`, `start/end`), test both directions

## Current Repo Context

- Fresh monorepo scaffold. Repo root contains the monorepo config (`package.json`, `turbo.json`, `bunfig.toml`, `bun.lockb`).
- `@DESIGN.md` defines the visual design system and must be followed for all UI work.
- `@AGENTS.md` defines critical rules, workflow, NEVER-DOs that all agents must follow.
- `@PRD.md` (or the source docx) is the product specification — read for "what", not "how".
- No code written yet — this is a green-field project.

## Proposed Architecture

### Apps and Routes

**`apps/storefront`** — Customer-facing. Server Components by default.

- `/` — Homepage (hero, category pills, featured products, editorial split, newsletter, footer)
- `/[category]` — Product Listing Page
- `/[category]/[subcategory]` — Filtered PLP
- `/products/[slug]` — Product Detail Page
- `/cart` — Cart page (also slide-over drawer globally available)
- `/checkout` — Checkout (COD + shipping/pickup only)
- `/order-confirmation/[id]` — Order success
- `/account` — Customer dashboard (auth required)
- `/account/orders` — Order history
- `/account/orders/[id]` — Order detail
- `/auth/login`, `/auth/register`, `/auth/forgot-password`

**`apps/admin`** — Store owner. Role-guarded (`role === 'admin'`).

- `/admin` — Dashboard (KPIs, charts, recent orders)
- `/admin/orders` — Orders DataTable
- `/admin/orders/[id]` — Order detail + status management
- `/admin/products` — Products DataTable
- `/admin/products/new` — Create product form
- `/admin/products/[id]/edit` — Edit product (includes embedded variant management)
- `/admin/inventory` — Inventory DataTable with inline stock editing
- `/admin/users` — Customers DataTable
- `/admin/users/[id]` — Customer detail + LTV
- `/admin/settings` — Storefront controls (hero, sale banner, featured, social, contact)

### Core Files

```
myanmar-ecommerce/
├── apps/
│   ├── storefront/
│   │   ├── app/(routes)/...
│   │   ├── app/layout.tsx
│   │   └── components/        # storefront-specific composed components
│   └── admin/
│       ├── app/(routes)/...
│       ├── app/layout.tsx
│       ├── middleware.ts      # admin role guard
│       └── components/        # admin-specific composed components
├── packages/
│   ├── ui/
│   │   ├── src/components/    # shadcn primitives — DO NOT EDIT DIRECTLY
│   │   ├── src/globals.css    # design tokens (single source of truth)
│   │   └── src/lib/utils.ts   # cn()
│   ├── convex/
│   │   ├── schema.ts          # data model (see §Data Shape)
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── cart.ts
│   │   ├── users.ts
│   │   ├── categories.ts
│   │   └── storeSettings.ts
│   ├── lib/
│   │   ├── formatMMK.ts       # currency formatter
│   │   ├── auth.ts            # Better Auth config
│   │   ├── sentry.ts
│   │   ├── constants.ts       # shipping fee, sizes, statuses
│   │   └── i18n.ts            # t('key') translation function
│   └── config/
│       ├── eslint/
│       ├── tailwind/
│       └── typescript/
├── ai-project-planner.md      # original rough idea
├── PROMPT.md                  # this file
├── AGENTS.md                  # critical rules for coding agents
├── DESIGN.md                  # visual design system
├── PRD.md                     # product requirements
├── Dockerfile
├── Dockerfile.dev
├── docker-compose.yml
├── .prettierrc.json
├── .mcp.json                  # shadcn MCP server config
├── components.json            # shadcn config (Mira-style preset)
├── turbo.json
├── bunfig.toml
└── bun.lockb
```

### Dependencies

Runtime:
- `next`, `react`, `react-dom`
- `convex`, `@convex-dev/react-query` (or native convex/react)
- `better-auth`
- `@sentry/nextjs`
- `lucide-react`
- `tailwindcss`, `@tailwindcss/postcss` (or v4 native)
- `clsx`, `tailwind-merge`, `class-variance-authority`
- `react-hook-form`, `zod`, `@hookform/resolvers`
- `next-themes`

Dev:
- `typescript`, `@types/*`
- `prettier`, `prettier-plugin-tailwindcss`
- `eslint`, `eslint-config-next`
- `turbo`
- `@types/bun`

shadcn/ui components to install (`bunx shadcn@latest add ...`):
- `button`, `input`, `textarea`, `label`, `select`, `checkbox`, `radio-group`, `switch`, `slider`
- `card`, `tabs`, `accordion`, `separator`, `badge`, `tooltip`, `popover`, `dropdown-menu`
- `dialog`, `sheet`, `drawer`, `scroll-area`, `sonner` (toast)
- `table` (base for DataTable), `data-table` (custom registry block)
- `sidebar`, `breadcrumb`, `pagination`, `skeleton`
- `chart` (Recharts wrapper)
- `dashboard-01` (admin template block)
- `avatar`, `command` (⌘K search), `form`, `calendar`, `date-picker`

### Environment Contract

`.env.example` (root, gitignored values):

```bash
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Sentry
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=

# Vercel (auto-set in deploy)
VERCEL_ENV=
VERCEL_URL=
```

- Server secrets never use `NEXT_PUBLIC_*` prefix.
- Read via `process.env.X` in server components, API routes, Convex functions only.

## Data Shape (Convex Schema)

Single source of truth in `packages/convex/schema.ts`. Embedded variants, NOT normalized.

```ts
// packages/convex/schema.ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    email: v.string(),                    // unique, primary identifier
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal('customer'), v.literal('admin'), v.literal('super-admin')),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_email', ['email']),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),                     // unique, URL-safe
    description: v.optional(v.string()),
    parentId: v.optional(v.id('categories')),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_parent', ['parentId'])
    .index('by_active', ['isActive']),

  products: defineTable({
    sku: v.optional(v.string()),
    name: v.string(),
    slug: v.string(),                     // unique
    description: v.string(),
    categoryId: v.id('categories'),
    basePrice: v.optional(v.number()),    // MMK
    salePrice: v.optional(v.number()),    // MMK
    isFeatured: v.boolean(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),

    // EMBEDDED VARIANTS — do NOT split into separate tables
    colorVariants: v.array(v.object({
      id: v.string(),                     // 'variant-001'
      colorName: v.string(),              // 'Navy Blue'
      colorHex: v.string(),               // '#001F3F'
      images: v.array(v.id('_storage')),  // first = primary/thumbnail
      selectedSizes: v.array(v.string()), // ['S','M','L','XL']
      stock: v.record(v.string(), v.number()),         // { M: 10, L: 5 }
      measurements: v.optional(v.record(v.string(), v.object({
        shoulder: v.number(),
        chest: v.number(),
        sleeve: v.number(),
        waist: v.number(),
        length: v.number(),
      }))),
    })),
  })
    .index('by_slug', ['slug'])
    .index('by_sku', ['sku'])
    .index('by_category', ['categoryId'])
    .index('by_featured', ['isFeatured'])
    .index('by_active', ['isPublished']),

  cartItems: defineTable({
    userId: v.id('users'),
    productId: v.id('products'),
    colorVariantId: v.string(),           // string key, NOT foreign key
    size: v.string(),                     // 'M', 'L', etc.
    quantity: v.number(),
    addedAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_product_size', ['userId', 'productId', 'size']),

  wishlistItems: defineTable({
    userId: v.id('users'),
    productId: v.id('products'),
    colorVariantId: v.optional(v.string()),
    size: v.optional(v.string()),
    addedAt: v.number(),
  })
    .index('by_user', ['userId']),

  orders: defineTable({
    orderNumber: v.string(),              // human-readable: ORD-2026-0001
    customerId: v.optional(v.id('users')), // null for guest checkout
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      address: v.string(),
    }),
    items: v.array(v.object({
      productId: v.id('products'),
      colorVariantId: v.string(),         // string key
      name: v.string(),                   // snapshot
      size: v.string(),                   // snapshot
      color: v.string(),                  // snapshot (color name)
      colorHex: v.string(),               // snapshot
      quantity: v.number(),
      price: v.number(),                  // snapshot — MMK
    })),
    subtotal: v.number(),                 // MMK
    shippingFee: v.number(),              // 0 for pickup, 2500 for shipping
    total: v.number(),                    // MMK
    deliveryMethod: v.union(v.literal('shipping'), v.literal('pickup')),
    paymentMethod: v.literal('cod'),      // only COD at launch
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('processing'),
      v.literal('shipped'),
      v.literal('delivered'),
      v.literal('cancelled'),
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_orderNumber', ['orderNumber'])
    .index('by_customer', ['customerId'])
    .index('by_status', ['status'])
    .index('by_createdAt', ['createdAt']),

  storeSettings: defineTable({
    heroTitle: v.optional(v.string()),
    heroSubtitle: v.optional(v.string()),
    heroImageId: v.optional(v.id('_storage')),
    heroCtaLabel: v.optional(v.string()),
    heroCtaLink: v.optional(v.string()),
    saleBannerEnabled: v.boolean(),
    saleBannerText: v.optional(v.string()),
    saleBannerLink: v.optional(v.string()),
    announcementBar: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    socialInstagram: v.optional(v.string()),
    socialFacebook: v.optional(v.string()),
    socialTiktok: v.optional(v.string()),
    updatedAt: v.number(),
  }),
})
```

## Data Flow

### Storefront (read)

1. Server Component renders with Convex SSR queries for catalog data.
2. Hydration registers the Convex client for live reactive updates.
3. PLP uses `useQuery(api.products.list, { categorySlug, filters, sort, pagination })`.
4. PDP uses `useQuery(api.products.getBySlug, { slug })` — variants come embedded.
5. Cart uses `useQuery(api.cart.list)` for authenticated users; `localStorage` for guests, merged on sign-in.

### Storefront (write)

1. Form submit triggers Convex `useMutation` (or Server Action for complex flows).
2. Checkout submits `api.orders.create` mutation:
   - Validates stock for every line item in a single transaction.
   - Decrements `products.colorVariants[].stock[size]` atomically.
   - Snapshots product data into `orders.items[]`.
   - Returns `orderId` → redirect to `/order-confirmation/[id]`.

### Admin (read/write)

1. Server Component enforces `role === 'admin'` via `getSession()` from Better Auth.
2. Middleware adds defense-in-depth layer for `/admin/*` routes.
3. List pages use `useQuery(api.X.list, { ... })` with pagination.
4. Inline edits (stock, status, toggle) use `useMutation` with optimistic updates.
5. Form submits use Server Actions → Convex mutations.
6. Destructive actions require `<ConfirmDialog>` confirmation.

### Email/notifications

- Order placed → customer confirmation email
- Order status changed → customer email update
- Cancelled order → restore stock + email customer
- Use Resend (or similar) via Convex actions

## UI Structure

### Storefront pages

- **Header** — centered logo, primary nav (WOMEN / MEN / NEW / SALE), search icon, account, bag with count badge. Sticky on scroll.
- **Mega menu** — hover/click flyout with category subnav.
- **Mobile nav** — hamburger opening full-screen drawer.
- **Hero banner** — full-bleed editorial image, headline overlay, single CTA.
- **PLP card** — product image (hover swaps to second image), name, original + sale price.
- **PDP gallery** — 2-col desktop, swipeable mobile, thumbnail strip.
- **Cart drawer** — right slide-over, items with qty stepper, subtotal, checkout CTA.
- **Checkout form** — single-column max-w-[640px]: contact → delivery address → delivery method → payment (COD-only display) → notes → place order.
- **Footer** — 4-col links, newsletter signup, social icons, COD payment badge.

### Admin pages

- **Sidebar** (240px) — Dashboard, Orders, Products, Inventory, Users, Settings. Active state uses `sidebar-primary` token.
- **Top bar** (56px) — global search (⌘K), notifications, theme toggle, user avatar.
- **KPI cards** — Total Revenue, New Customers, Active Accounts, Growth Rate. Trends via `chart-1` to `chart-5`.
- **DataTable** — shared component from `packages/ui/src/components/data-table/`. Required features: sortable, searchable, filterable, paginated, selectable, column visibility, row actions, bulk actions, empty state, loading skeleton.
- **Status badges** — typed `<StatusBadge>` with variants: default (success), secondary (neutral), outline (info), destructive (error/cancel), outline-muted (draft).
- **Product form** — 2-col: main column (Details, Images, Variants with embedded color picker + size selector + stock table + measurements) | right rail (Pricing, Status, Categories, Action bar: Discard / Save Draft / Publish).
- **Order detail** — Order # + Print/Edit → customer info + payment | order summary → delivery stepper → items table.

### Forms and validation

- React Hook Form + Zod schemas.
- Schemas live next to form, OR in `packages/lib/schemas/` if reused.
- Errors rendered inline with `aria-describedby`.

### i18n

- All user-facing strings via `t('key')` from `packages/lib/i18n.ts`.
- Locale files: `packages/lib/locales/en.json` (and `my.json` when Burmese added).
- `<html dir>` set based on locale — `ltr` for English, `rtl` for Burmese (Burmese is technically not RTL but the codebase is RTL-ready for Arabic expansion).
- Logical Tailwind properties (`ms-*`, `me-*`, `start/end`) everywhere.
- Directional icons (`ChevronRight`, `ArrowRight`) mirrored with `rtl:rotate-180` or replaced with directional variants.

## Error Handling

| Scenario | UX |
| --- | --- |
| Product out of stock at checkout | Toast: "Item sold out. Removed from cart." Cart updates. |
| Network offline | Persistent banner: "No internet connection. Changes will sync when back online." |
| Checkout form validation | Inline red error text below each invalid field; form does not submit. |
| Server error on order submit | Toast: "Unable to place order. Please try again." Order not created. |
| Admin: failed status update | Toast: "Failed to update. Refreshing order data..." + revert optimistic update. |
| Empty admin list | Illustration + "No X yet" + primary CTA (e.g., "Add your first product"). |
| Missing env var on server | Logged server-side, generic "Service unavailable" returned to client. |
| localStorage parse failure | Ignore invalid stored draft, start fresh. |
| Convex schema migration error | Fail build via CI check; never silently drift schema. |
| Stock race condition | Convex atomic mutation validates+decrements in single transaction; race fails with "Item sold out" toast. |

## Implementation Steps

1. **Monorepo scaffold**
   - Initialize Turborepo with Bun workspaces
   - Create `apps/storefront`, `apps/admin`, `packages/{ui,convex,lib,config}`
   - Set up root `package.json`, `turbo.json`, `bunfig.toml`, `.gitignore`
   - Configure path aliases (`@workspace/ui`, `@workspace/convex`, `@workspace/lib`)

2. **shadcn init**
   - `bunx --bun shadcn@latest init --preset b2BVC6P2m --base base --template next --monorepo --rtl --pointer`
   - Verify `packages/ui/src/globals.css` matches `@DESIGN.md`
   - Install all components listed in §Dependencies

3. **Shared packages**
   - `packages/lib`: `formatMMK.ts`, `auth.ts`, `constants.ts`, `i18n.ts`, `sentry.ts`
   - `packages/convex`: `schema.ts` (full embedded-variant model from §Data Shape)
   - `packages/config`: shared `eslint`, `tailwind`, `typescript` configs

4. **Phase 0 — Setup (Week 1)**
   - Convex deployment configured (dev + prod)
   - Better Auth wired to Convex user table
   - Sentry initialized in both apps
   - Dockerfile + docker-compose working locally
   - CI pipeline: `bun install --frozen-lockfile && bun run lint && bun run build && bun run format:check`
   - CodeRabbit enabled on the repo
   - Seed script for development (sample categories, products, admin user)

5. **Phase 1 — Storefront MVP (Week 4)**
   - Header, footer, mega menu, mobile nav
   - Homepage (hero, category pills, featured products, newsletter)
   - PLP with filters and sort
   - PDP with gallery, color/size selectors, stock indicator, add to cart
   - Cart drawer + cart page
   - Checkout (COD + shipping/pickup)
   - Order confirmation page
   - Guest checkout (localStorage cart)
   - Mobile responsive (375 / 768 / 1280+)
   - i18n strings extracted
   - RTL pass

6. **Phase 2 — Auth and accounts (Week 5)**
   - Sign up, sign in, forgot password
   - Customer dashboard
   - Order history + detail
   - Wishlist

7. **Phase 3 — Admin (Week 7)**
   - Dashboard with KPIs + charts + recent orders
   - Orders list (DataTable) + detail + status workflow + cancel with stock restore
   - Products list (DataTable) + create form + edit form with embedded variant UI
   - Inventory list with inline stock editing + low-stock filter
   - Users list + customer detail + role management
   - Storefront controls (hero, sale banner, featured products, social, contact)

8. **Phase 4 — QA and polish (Week 8)**
   - Sentry error monitoring verified
   - Lighthouse pass on all pages (mobile ≥ 90)
   - Accessibility audit (WCAG 2.1 AA)
   - Cross-browser testing
   - CodeRabbit remediation
   - Prettier enforcement across all PRs

9. **Phase 5 — Launch (Week 9)**
   - Production deploy to Vercel
   - DNS + SSL configured
   - Sentry production alerts live (1% error rate threshold)
   - Admin training session
   - Seed production admin user(s)

## Testing and Verification

Per-PR gates (CI blocks merge):
- `bun run lint`
- `bun run build`
- `bun run format:check`
- `bun install --frozen-lockfile` succeeds

Per-feature manual checks:
- Empty form validation
- Missing API keys produce clear errors (not stack traces)
- Successful generation renders all sections
- User can edit generated sections
- Draft restores after refresh
- Reset clears state
- Copy actions work
- Stock race condition handled (atomic decrement)
- Mobile layout usable (375px)
- RTL layout usable
- Dark mode in admin works (no contrast issues)
- All charts have text alternatives

Recommended additions:
- Vitest for unit tests on `formatMMK`, cart logic, stock validation
- Playwright for e2e: browse → add to cart → checkout → confirmation
- Storybook (optional) for shared component documentation

## Risks and Tradeoffs

| Risk | Mitigation |
| --- | --- |
| Embedded variants create large documents with many images | Compress images on upload; lazy-load images; paginate catalog queries |
| Convex filter on variant attributes requires app-side scan | Acceptable for v1 scale (small catalog); revisit if catalog grows past 10k products |
| Editable nested variants in admin UI is complex | Use a typed React Hook Form with field arrays; isolate in dedicated `VariantEditor` component |
| localStorage cart on guest checkout loses state if browser cleared | Acceptable for v1; recommend sign-in for persistent cart in UI copy |
| Monorepo with two Next.js apps increases build complexity | Use Turborepo caching, run dev with `bun run dev` from root |
| Bun + Vercel combo has occasional edge cases | Pin Bun version in CI; verify Vercel build logs in early phases |
| OpenRouter model behavior can drift | Pin `OPENROUTER_MODEL` env var; validate AI outputs with Zod schemas |
| No payment integration at launch | COD-only by design; payment gateway is Phase 2 (explicitly out of scope) |
| No SMS notifications | Email-only at launch; SMS is Phase 2 |
| Myanmar locale is not strictly RTL | Codebase is RTL-ready for future Arabic expansion; Burmese uses LTR but still goes through `t('key')` |
| White-only storefront vs admin dark mode | Intentional — storefront keeps brand consistency; admin uses dark mode for data-dense evening work |

## Out of Scope (v1)

- Payment gateway (KBZPay, Wave Money, card payments)
- Multi-vendor / marketplace
- Live chat / support widget
- Product reviews and ratings
- Loyalty points / rewards
- Bulk / wholesale pricing
- SMS order notifications
- International shipping
- Multi-currency (MMK only)
- Advanced analytics / BI dashboard (Sentry + basic Convex metrics only)
- Mobile native app (web only)

## Definition of Done — Whole Project

- All §Implementation Steps phases complete
- Lighthouse mobile ≥ 90 on all pages
- WCAG 2.1 AA across both apps
- Works in `dir="ltr"` and `dir="rtl"`
- Works in light (storefront) and both light + dark (admin)
- All money formatted via `formatMMK()`, no hardcoded symbols
- All user-facing strings via `t('key')`, no hardcoded copy
- All TypeScript strict, no `any`
- All tests passing
- CodeRabbit passing on all PRs
- `bun.lockb` committed
- `.env.example` documented
- Sentry alerts live
- Vercel preview deploys working per PR
- Production admin user(s) seeded