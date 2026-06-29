# PRD — Myanmar Local Brand Shirt E-Commerce Platform

**Version:** 2.1.0
**Date:** February 2026
**Status:** Draft — Ready for Review
**Reference:** [shop.mango.com](https://shop.mango.com) (storefront UX inspiration), [shadcn dashboard-01](https://shadcnui.com/dashboard/ecommerce) (admin template)

---

## 1. Project Overview

### 1.1 Executive Summary

This document defines the full product requirements for a Myanmar local brand shirt e-commerce platform. The platform draws design and UX inspiration from Mango (shop.mango.com) — clean, minimal, editorial, image-led — while using a modern, accessible shadcn/ui design system (`preset b2BVC6P2m`, teal/emerald accent, neutral base) shared across both the storefront and the admin panel. The platform serves customers browsing and purchasing shirts online, while providing administrators with full control over inventory, orders, users, and storefront content.

### 1.2 Project Goals

- Build a world-class, minimal e-commerce experience for a Myanmar local shirt brand
- Deliver a fully functional storefront with product browsing, filtering, search, and checkout
- Provide robust admin controls for product, order, inventory, and user management
- Support Myanmar-specific delivery: nationwide shipping and in-store pickup
- Accept Cash on Delivery (COD) as the sole payment method at launch
- Establish error monitoring, code quality gates, and authentication best practices
- Ship a single unified design system across storefront and admin (shared `globals.css`, shared component package)
- Launch with full RTL support so Burmese (LTR) and Arabic (RTL) locales work correctly

### 1.3 Success Metrics

| Metric | Target | Timeline |
| --- | --- | --- |
| Storefront LCP (mobile) | < 2.5s | MVP Launch |
| Lighthouse mobile score | > 90 | MVP Launch |
| Admin order processing time | < 30s per order | MVP Launch |
| Sentry error rate | < 1% of sessions | 30 days post-launch |
| Checkout completion rate | > 60% | 60 days post-launch |
| WCAG 2.1 AA compliance | 100% of pages | MVP Launch |

---

## 2. Technology Stack (Locked)

Any deviation requires a formal change request and re-review. See `AGENTS.md` §Tech Stack for the operational rules.

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 14+ (App Router) | SSR, SSG, Image Optimization, Routing. TypeScript strict mode. |
| Styling | Tailwind CSS v4 | Tokens via `@theme inline` in shared `globals.css` |
| UI Components | shadcn/ui preset `b2BVC6P2m` | Teal/emerald accent, neutral base, radius 0.45rem, Geist font |
| Init Command | `bunx --bun shadcn@latest init --preset b2BVC6P2m --base base --template next --monorepo --rtl --pointer` | Pinned preset, monorepo scaffold, RTL-ready, pointer cursor |
| Admin Template | `dashboard-01` | `bunx shadcn@latest add dashboard-01` |
| Data Tables | shadcn DataTable | One shared component in `packages/ui` |
| Backend | Convex | Real-time, serverless functions, reactive queries |
| Schema Pattern | **Embedded variants** | Products contain `colorVariants[]` as nested arrays — NO normalized variant tables |
| Authentication | Convex + Better Auth (`@convex-dev/better-auth` + `better-auth`) | Customer, admin, super-admin roles |
| Error Monitoring | Sentry (`@sentry/nextjs`) | Frontend + backend, source maps on deploy |
| Icons | Lucide React | `lucide-react` package, single icon set everywhere |
| Typography (both apps) | Geist Sans + Geist Mono | Loaded via `next/font` from Mira-style preset |
| Code Formatter | Prettier | Single quotes, 2-space indent, 100 char width, trailing commas, lf |
| Tailwind Plugin | `prettier-plugin-tailwindcss` | Auto-sorts Tailwind class names |
| Containerization | Docker + docker-compose | Multi-stage build with `oven/bun:1` base |
| Orchestration | docker-compose | Local dev with hot reload |
| Version Control | GitHub | PR-based workflow, branch protection |
| Code Review | CodeRabbit | Auto on every PR, blocks critical-severity issues |
| Package Manager | **Bun** | `bun install`, `bun run`, `bun add`, `bun x` — never `npm`, `yarn`, `pnpm` |
| Monorepo | Turborepo | `apps/storefront`, `apps/admin`, `packages/{ui,convex,lib,config}` |
| Deployment | Vercel | Zero-config Next.js, preview per PR |
| Currency | MMK (Ks) | Myanmar Kyat only, no decimals |
| Locales | English at launch, Burmese-ready | Full RTL support from day one |

---

## 3. Design System (Summary)

Full visual specification lives in `DESIGN.md`. This section captures only the architectural decisions that affect product behavior.

### 3.1 Single Unified Design System

Both storefront and admin apps use the **same** design tokens, components, and shared `globals.css`. What differs is the **UX density and composition**:

- **Storefront** — editorial, image-led, generous whitespace. Header navigation, product cards with hover image swap, cart drawer.
- **Admin** — data-dense, dashboard-first. 240px sidebar + 56px top bar from `dashboard-01`, KPI cards, sortable/filterable data tables.

Tokens are defined in `packages/ui/src/globals.css` and bridged to Tailwind via `@theme inline`. Apps import the package and never redefine tokens.

### 3.2 RTL Support

- Logical CSS properties throughout (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start`, `end`)
- `<html dir>` set based on locale
- Directional icons mirrored via `rtl:rotate-180` or directional Lucide variants
- All layouts tested in both `dir="ltr"` and `dir="rtl"` before merge

### 3.3 Cursor Behavior

Per the `--pointer` flag, all interactive surfaces use `cursor-pointer` instead of the default browser cursor.

---

## 4. Monorepo Structure

```
myanmar-ecommerce/
├── apps/
│   ├── storefront/                # Customer-facing Next.js app (port 3000)
│   │   ├── app/                   # Routes (see §9.1)
│   │   ├── components/            # Storefront-specific composed components
│   │   ├── public/                # Static assets
│   │   └── middleware.ts          # Auth middleware (optional)
│   └── admin/                     # Admin panel Next.js app (port 3001)
│       ├── app/                   # Routes (see §9.2)
│       ├── components/            # Admin-specific composed components
│       └── middleware.ts          # Admin role guard (REQUIRED)
├── packages/
│   ├── ui/                        # shadcn/ui components — the design system
│   │   ├── src/components/        # Generated primitives — DO NOT EDIT DIRECTLY
│   │   ├── src/globals.css        # Single source of truth for design tokens
│   │   └── src/lib/utils.ts       # cn()
│   ├── convex/                    # Shared Convex backend
│   │   ├── schema.ts              # Data model (see §6)
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── cart.ts
│   │   ├── users.ts
│   │   ├── categories.ts
│   │   └── storeSettings.ts
│   ├── lib/                       # Shared utilities
│   │   ├── formatMMK.ts           # Currency formatter
│   │   ├── auth.ts                # Better Auth config
│   │   ├── sentry.ts
│   │   ├── constants.ts           # Shipping fee, sizes, statuses
│   │   ├── i18n.ts                # t('key') translation function
│   │   └── locales/               # en.json, my.json
│   └── config/                    # Shared configs
│       ├── eslint/
│       ├── tailwind/
│       └── typescript/
├── ai-project-planner.md          # Original rough idea input
├── PROMPT.md                      # Structured plan for coding agents
├── AGENTS.md                      # Critical rules for coding agents
├── DESIGN.md                      # Visual design system spec
├── PRD.md                         # This file
├── Dockerfile
├── Dockerfile.dev
├── docker-compose.yml
├── .prettierrc.json
├── .prettierignore
├── .mcp.json                      # shadcn MCP server config
├── components.json                # shadcn config (preset b2BVC6P2m)
├── turbo.json
├── bunfig.toml
└── bun.lockb                      # MUST be committed
```

### 4.1 Sharing Rules

- Components go in `packages/ui` — never duplicate between apps
- Convex schema lives in `packages/convex` — both apps deploy against the same backend
- Dependencies are added at the package level where they're used; apps reference shared packages via workspace aliases (`@workspace/ui`, `@workspace/convex`, `@workspace/lib`)

---

## 5. Environment & Configuration

### 5.1 Environment Variables

`.env.example` at repo root:

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

# Email (Resend or similar)
RESEND_API_KEY=

# Vercel (auto-set in deploy)
VERCEL_ENV=
VERCEL_URL=
```

- Server secrets never use `NEXT_PUBLIC_*` prefix
- Read via `process.env.X` in server components, API routes, Convex functions only

### 5.2 MCP Configuration

`.mcp.json` at repo root for the shadcn MCP server:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "bunx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

### 5.3 Prettier Configuration

`.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

`.prettierignore`:

```
node_modules
.next
dist
build
convex/_generated
bun.lockb
```

---

## 6. Data Models (Convex Schema)

Single source of truth: `packages/convex/schema.ts`. **All product variants are embedded as nested arrays — never split into separate tables.** This is non-negotiable.

### 6.1 users

```ts
defineTable({
  email: v.string(),                       // unique
  name: v.string(),
  phone: v.optional(v.string()),
  role: v.union(v.literal('customer'), v.literal('admin'), v.literal('super-admin')),
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index('by_email', ['email'])
```

### 6.2 categories

```ts
defineTable({
  name: v.string(),
  slug: v.string(),                        // unique, URL-safe
  description: v.optional(v.string()),
  parentId: v.optional(v.id('categories')),// self-referencing tree
  sortOrder: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_slug', ['slug'])
  .index('by_parent', ['parentId'])
  .index('by_active', ['isActive'])
```

### 6.3 products (with EMBEDDED VARIANTS)

```ts
defineTable({
  sku: v.optional(v.string()),
  name: v.string(),
  slug: v.string(),                        // unique
  description: v.string(),
  categoryId: v.id('categories'),
  basePrice: v.optional(v.number()),       // MMK
  salePrice: v.optional(v.number()),       // MMK
  isFeatured: v.boolean(),
  isPublished: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),

  // EMBEDDED — do NOT split into separate tables
  colorVariants: v.array(v.object({
    id: v.string(),                        // 'variant-001'
    colorName: v.string(),                 // 'Navy Blue'
    colorHex: v.string(),                  // '#001F3F'
    images: v.array(v.id('_storage')),     // first = primary/thumbnail
    selectedSizes: v.array(v.string()),    // ['S','M','L','XL']
    stock: v.record(v.string(), v.number()),// { M: 10, L: 5, XL: 2 }
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
  .index('by_active', ['isPublished'])
```

### 6.4 cartItems

```ts
defineTable({
  userId: v.id('users'),
  productId: v.id('products'),
  colorVariantId: v.string(),              // string key matching products.colorVariants[].id
  size: v.string(),
  quantity: v.number(),
  addedAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_user_product_size', ['userId', 'productId', 'size'])
```

### 6.5 wishlistItems

```ts
defineTable({
  userId: v.id('users'),
  productId: v.id('products'),
  colorVariantId: v.optional(v.string()),
  size: v.optional(v.string()),
  addedAt: v.number(),
})
  .index('by_user', ['userId'])
```

### 6.6 orders (with snapshot items)

```ts
defineTable({
  orderNumber: v.string(),                 // 'ORD-2026-0001'
  customerId: v.optional(v.id('users')),   // null for guest checkout
  customerInfo: v.object({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
  }),
  items: v.array(v.object({
    productId: v.id('products'),
    colorVariantId: v.string(),
    name: v.string(),                      // snapshot
    size: v.string(),                      // snapshot
    color: v.string(),                     // snapshot
    colorHex: v.string(),                  // snapshot
    quantity: v.number(),
    price: v.number(),                     // snapshot — MMK
  })),
  subtotal: v.number(),
  shippingFee: v.number(),                 // 0 for pickup, 2500 for shipping
  total: v.number(),
  deliveryMethod: v.union(v.literal('shipping'), v.literal('pickup')),
  paymentMethod: v.literal('cod'),
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
  .index('by_createdAt', ['createdAt'])
```

### 6.7 storeSettings (singleton)

```ts
defineTable({
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
})
```

### 6.8 Architecture Rationale

**Why embedded variants?**
- Single query fetches product + all variants + all images (no joins — Convex has no SQL joins)
- Atomic updates — variant changes happen in one transaction
- Read-heavy workload — catalog queries dominate mutations
- Type-safe nesting via Convex validators

**Trade-offs accepted:**
- Larger product documents when many variants/images
- Variant-level filtering ("all red shirts size M") requires app-side scan or query expression
- Nested admin UI updates need careful state management

**Reference rules:**
- `cartItems.colorVariantId`, `wishlistItems.colorVariantId`, `orders.items[].colorVariantId` are **string keys**, NOT foreign keys
- Stock lives at size level inside each variant: `stock: { M: 10 }`
- `orders.items[]` snapshots product data so historical orders stay stable even if the catalog changes
- Stock restoration on cancel: re-increment `products.colorVariants[].stock[size]` in a single atomic mutation

---

## 7. Customer Storefront — Feature Requirements

### 7.1 Navigation and Header (P0)

| Feature | Requirement |
| --- | --- |
| Brand logo | Centered text logo in Geist Bold |
| Primary nav | WOMEN / MEN / NEW / SALE category links |
| Mega menu | Hover/click reveals subcategory flyout panel |
| Search | Full-text product search with instant results overlay |
| Auth actions | Log In / My Account via Better Auth session |
| Bag icon | Item count badge; opens cart drawer on click |
| Sale banner | Dismissible promotional banner below main nav |
| Mobile nav | Hamburger opening full-screen drawer |

### 7.2 Homepage (P0/P1)

| Section | Priority |
| --- | --- |
| Hero banner — full-bleed editorial image + headline overlay + CTA | P0 |
| Category pills — horizontal cards linking to Men/Women/New/Sale | P0 |
| Featured products — 4–8 cards from `isFeatured: true` | P0 |
| Newsletter signup — email input with 10% discount incentive | P1 |
| Social links — Instagram, Facebook, TikTok footer icons | P2 |

### 7.3 Product Listing Page (P0)

| Feature | Requirement |
| --- | --- |
| Grid layout | 3-col desktop, 2-col tablet, 1-col mobile; toggle 2/3/4 col |
| Filter | Size, Color, Price Range |
| Sort | New, Price Low-High, Price High-Low, Sale |
| Product card | Image (hover swaps to second), name, original price, sale price |
| Out of stock | Overlay or badge; size selector grays out OOS sizes |
| Color swatches | Small dots below card for quick variant preview |
| Quick add | Hover reveals size selector overlay for direct add-to-cart |
| Pagination | Load-more button (not infinite scroll) |
| Product count | "X of Y products" above grid |

### 7.4 Product Detail Page (P0/P1)

| Feature | Requirement |
| --- | --- |
| Image gallery | 2-col grid desktop; full-width swipeable on mobile |
| Title + price | Large heading with original + sale + discount % |
| Size selector | Horizontal size buttons; OOS grayed; Size Guide modal |
| Color selector | Swatch buttons; switching updates images + stock |
| Add to cart | Full-width primary CTA, triggers cart drawer open |
| Wishlist | Heart icon; requires login or guest wishlist via localStorage (P1) |
| Stock indicator | Low stock warning < 5; OOS disables Add button |
| Description | Expandable accordion: Description, Care, Size & Fit |
| Free delivery callout | "Free delivery to store" when applicable |
| Store availability | Link to check in-store availability (P1) |
| Related products | Horizontal scroll "You may also like" (P1) |
| Breadcrumb | `MEN > SHIRTS > DENIM` |

### 7.5 Cart and Checkout (P0/P1)

| Feature | Requirement |
| --- | --- |
| Cart drawer | Right-side slide-over; qty controls + remove |
| Order summary | Subtotal, shipping fee (2,500 MMK or FREE for pickup), total in MMK |
| Checkout form | Name, Email, Phone, Delivery Address (required for shipping) |
| Delivery method | Radio: Shipping (2,500 MMK, 1–3 days) \| Store Pickup (free) |
| Pickup info | Store name, address, hours shown on Pickup selection |
| Payment method | **Cash on Delivery only** — no card input fields |
| Order notes | Optional textarea for delivery instructions (P1) |
| Order confirmation | Order #, summary, "Continue shopping" CTA |
| Guest checkout | Allowed; email used as identifier |

### 7.6 Authentication (P0/P1/P2)

| Feature | Priority |
| --- | --- |
| Sign up — email + password with verification flow | P0 |
| Sign in — email + password; persistent session | P0 |
| Forgot password — email reset flow | P0 |
| Social auth (Google OAuth) | P2 (Phase 2) |
| Customer account — order history, saved addresses, profile edit | P1 |
| Role guard — admin routes protected | P0 |
| Session persistence — 7-day cookie; re-auth after expiry | P0 |

---

## 8. Delivery and Payment Specifications

### 8.1 Delivery Methods

| Method | Fee | Timeframe | Notes |
| --- | --- | --- | --- |
| Shipping within Myanmar | 2,500 MMK | 1–3 business days | Customer provides full delivery address. Confirmation email on dispatch. |
| Store Pickup | Free | Ready within 24 hours | Customer picks up from brand store. Store address + hours shown at checkout. |

### 8.2 Payment Methods

| Method | Status | Flow |
| --- | --- | --- |
| Cash on Delivery (COD) | Launch — sole method | Order placed → Confirmed by admin → Delivered → Cash collected |
| Mobile Banking (Wave/KBZPay) | Phase 2 | Not in scope for v1.0 |

---

## 9. Routes and Page Map

### 9.1 Storefront Routes

| Route | Page | Auth |
| --- | --- | --- |
| `/` | Homepage | No |
| `/[category]` | PLP | No |
| `/[category]/[subcategory]` | Filtered PLP | No |
| `/products/[slug]` | PDP | No |
| `/cart` | Cart page (also drawer) | No |
| `/checkout` | Checkout form | Guest allowed |
| `/order-confirmation/[id]` | Order success | No |
| `/account` | Customer dashboard | Customer |
| `/account/orders` | Order history | Customer |
| `/account/orders/[id]` | Order detail | Customer |
| `/auth/login` | Sign in | No |
| `/auth/register` | Sign up | No |
| `/auth/forgot-password` | Password reset | No |

### 9.2 Admin Routes

| Route | Page | Auth |
| --- | --- | --- |
| `/admin` | Dashboard | Admin |
| `/admin/orders` | Orders DataTable | Admin |
| `/admin/orders/[id]` | Order detail + status management | Admin |
| `/admin/products` | Products DataTable | Admin |
| `/admin/products/new` | Create product | Admin |
| `/admin/products/[id]/edit` | Edit product (includes variant UI) | Admin |
| `/admin/inventory` | Inventory overview | Admin |
| `/admin/users` | Customers DataTable | Admin |
| `/admin/users/[id]` | Customer detail | Admin |
| `/admin/settings` | Storefront controls (banners, hero, featured) | Admin |

---

## 10. Admin Panel — Feature Requirements

### 10.1 DataTable Standards (every list page)

Every admin page with tabular data implements the full shared DataTable:

- Sortable columns with arrow indicators
- Global search (debounced 300ms) across visible columns
- Column filters with active filter badges
- Pagination: First / Prev / Page N of M / Next / Last; rows 10/20/50/100
- Row selection with checkbox column and select-all
- Column visibility toggle (persists in localStorage)
- Row actions (three-dot menu) — contextual per resource
- Bulk actions toolbar when ≥1 row selected
- Empty state with illustration + Clear filters button
- Loading state with skeleton rows matching real layout

### 10.2 Admin Dashboard

**KPI cards (4-col grid):**
- Total Revenue (MTD in MMK) with trend %
- New Customers (count) with trend %
- Active Accounts (count) with trend %
- Growth Rate (%) with trend %

**Widgets:**
- Orders Today — count + total GMV
- Pending Orders — count needing action
- Total Revenue (MTD) — MMK
- Low Stock Alert — products with stock < 5
- Recent Orders — last 10 with quick status toggle
- Total Visitors chart — multi-layer area chart with range toggle (3mo/30d/7d)
- Sentry error rate widget (P1)
- Product count — total active/inactive

### 10.3 Order Management

- Orders DataTable with all §10.1 features
- Visible columns: Order #, Customer Name, Date, Total MMK, Delivery Method, Status, Actions
- Status filter — multi-select enum
- Date range filter (P1)
- Global search across Order #, Customer Name, Phone, Email
- Status update — dropdown in detail view; auto-sends email
- Cancel order — confirmation modal; restores stock automatically
- Bulk export (P2)
- Default rows per page: 20

### 10.4 Product Management

Note: Colors and Sizes are NOT managed as separate admin pages. They live inside the Product Edit form as part of the embedded `colorVariants` structure.

- Products DataTable with all §10.1 features
- Visible columns: Thumbnail, Name, SKU, Category, Base Price, Stock Total, Active Toggle, Actions
- Category filter (multi-select active categories)
- Active status filter (tri-state: All / Active / Inactive)
- Featured filter (tri-state)
- Global search across Name, SKU, Description
- Add Product button → `/admin/products/new`
- Edit Product → `/admin/products/[id]/edit` with all fields editable
- Delete Product — confirmation, soft delete (`isPublished: false`)
- Duplicate Product — clones product + variants as "(Copy)" (P1)
- Variant management (in edit): color name + hex picker, image uploader, size selector, stock table (size × qty), measurements (optional)
- Inline stock editing per size within each variant
- Image management: multi-upload, drag-to-reorder, set primary
- Bulk status update (P1)
- Default rows per page: 20

### 10.5 Inventory Control

- Inventory DataTable with all §10.1 features
- Visible columns: Product Name, Variant (Color), Size, Stock Quantity, Actions
- Low stock filter — variants/sizes with stock < 5
- Out of stock filter — stock = 0
- Category filter (P1)
- Global search across Product Name, Color Name
- Inline stock editing — click → input → save on blur/Enter
- Stock audit log per variant (P1)
- Restock alert threshold (P1)
- Default rows per page: 50

### 10.6 User Management

- Users DataTable with all §10.1 features
- Visible columns: Name, Email, Phone, Role, Joined Date, Actions
- Role filter — multi-select: Customer / Admin
- Global search across Name, Email, Phone
- Customer detail — profile + full order history + total spend + LTV
- Admin user management — promote/demote (super-admin only)
- Account suspension — sets `isActive: false` (P1)
- Default rows per page: 20

### 10.7 Storefront Controls

- Hero Banner editor — upload image, headline, CTA label + link
- Sale Banner — enable/disable toggle + text + link (P1)
- Featured Section — manage which products appear in homepage featured
- Announcement Bar — optional top-bar text (P2)

---

## 11. Error Handling, Monitoring, and Code Quality

### 11.1 Sentry Integration

| Concern | Configuration |
| --- | --- |
| SDK | `@sentry/nextjs` |
| Error capture | Unhandled exceptions, promise rejections, API errors |
| Performance | Core Web Vitals, page load traces, Convex query performance |
| Session replay | 10% sample rate on error |
| Source maps | Uploaded on deploy; stack traces map to source |
| Alerts | New issues, error rate spike > 1%, P0 regressions |
| Admin widget | Sentry error rate embedded in admin dashboard |
| Environments | Separate DSNs for dev, staging, production |

### 11.2 CodeRabbit Automated Code Review

| Concern | Configuration |
| --- | --- |
| Trigger | Every PR against `main` and `develop` |
| Scope | Logic errors, security, accessibility, performance anti-patterns |
| Checklist | Auto-generated: tests, documentation, migration notes |
| Blocking policy | Critical-severity issues block merge |
| Integration | GitHub PR comments, inline line-level feedback |

### 11.3 User-Facing Error States

| Scenario | UX |
| --- | --- |
| Product out of stock at checkout | Toast: "Item sold out. Removed from cart." Cart updates. |
| Network offline | Persistent banner: "No internet connection. Changes will sync when back online." |
| Checkout form validation | Inline red error text below each invalid field; form does not submit. |
| Server error on order submit | Toast: "Unable to place order. Please try again." Order not created. |
| Admin failed status update | Toast: "Failed to update. Refreshing order data..." + revert optimistic update. |
| Empty admin list | Illustration + "No X yet" + primary CTA. |
| Missing env var | Logged server-side; generic "Service unavailable" to client. |
| localStorage parse failure | Ignore invalid draft; start fresh. |
| Convex schema migration error | Fail build via CI check; never silently drift schema. |
| Stock race condition | Atomic mutation validates + decrements; race fails with "Item sold out" toast. |

---

## 12. Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| Performance | Lighthouse mobile score > 90 on all pages |
| Accessibility | WCAG 2.1 AA — keyboard navigation, ARIA labels, contrast ratios |
| RTL | Full support — all layouts tested in `dir="ltr"` and `dir="rtl"` |
| SEO | Metadata, OG tags, JSON-LD Product schema on all PDPs |
| Responsiveness | 375px (mobile) → 768px (tablet) → 1280px+ (desktop) |
| Security | HTTPS only; CSP headers; no sensitive data in client code; admin server-guarded |
| Localization | English primary; Burmese-ready via `t('key')` |
| Currency | MMK only — no multi-currency |
| Browser support | Chrome 100+, Safari 15+, Firefox 100+, Samsung Internet 18+ |
| Image optimization | Next.js Image component, WebP, lazy loading |
| Uptime | 99.5% monthly via Vercel + Convex SLAs |
| Bundle size | Storefront route < 200KB JS gzipped |
| Dark mode | Admin supports light + dark via `next-themes`; storefront light-only |

---

## 13. Development Workflow and Conventions

See `AGENTS.md` for the operational rules. This section captures the conventions referenced by both.

### 13.1 Branching

| Branch | Purpose | Merge Target |
| --- | --- | --- |
| `main` | Production-ready; auto-deploys to production | — |
| `develop` | Integration; auto-deploys to staging | `main` |
| `feature/[name]` | New features; one branch per ticket | `develop` |
| `fix/[name]` | Bug fixes | `develop` |
| `hotfix/[name]` | Critical production fixes | `main` + `develop` |

### 13.2 Commit Convention

Conventional Commits. Type is required. Reference GitHub issue number.

```
feat: #42 — add product filter
fix: #87 — cart race condition on out-of-stock
chore: bump convex to 1.16
docs: update README
refactor: extract money formatter
test: cover order status transitions
perf: lazy-load PDP gallery below the fold
```

### 13.3 Pull Request Process

- Title: `<type>: #<issue> — <short summary>`
- Target `develop`; release/hotfix target `main`
- CodeRabbit must pass (no critical severity)
- Minimum 1 human reviewer
- PR must reference a GitHub Issue number
- CI must pass: `bun install --frozen-lockfile && bun run lint && bun run build && bun run format:check`
- `bun.lockb` MUST be committed
- Sentry release tracking fires on merge to `main`

### 13.4 Bun Command Reference

| Task | Command |
| --- | --- |
| Install dependencies | `bun install` |
| Add package | `bun add <package>` |
| Add dev dependency | `bun add -d <package>` |
| Remove package | `bun remove <package>` |
| Run dev server | `bun run dev` |
| Build | `bun run build` |
| Tests | `bun test` |
| Format | `bun run format` |
| Format check (CI) | `bun run format:check` |
| Lint + format | `bun run lint` |
| Docker dev | `docker-compose up` |
| Docker build | `docker build -t myanmar-ecommerce:latest .` |
| CI install (locked) | `bun install --frozen-lockfile` |
| shadcn add | `bunx shadcn@latest add <component>` |

---

## 14. Milestones and Delivery Phases

| Phase | Deliverables | Timeline |
| --- | --- | --- |
| **Phase 0 — Setup** | Repo init, Bun configured (`bun.lockb` committed). shadcn preset installed. MCP server configured. `dashboard-01` added. Next.js + Convex + Better Auth + Sentry scaffolded. Prettier + Docker configured. CI live. CodeRabbit enabled. DataTable component installed. Convex schema with embedded variants deployed. | Week 1 |
| **Phase 1 — Storefront MVP** | Homepage, PLP, PDP, Cart, Checkout (COD + shipping/pickup), Order Confirmation. Guest checkout. Mobile responsive. RTL pass. | Week 4 |
| **Phase 2 — Auth & Accounts** | Better Auth flows. Customer dashboard. Order history. Wishlist. | Week 5 |
| **Phase 3 — Admin Panel** | Dashboard with KPIs + charts. Orders (full CRUD + status workflow + cancel/restore). Products (CRUD + embedded variant UI). Inventory with inline edits. Users + roles. Storefront controls. | Week 7 |
| **Phase 4 — QA & Polish** | Sentry integration testing. Lighthouse optimization. Accessibility audit. CodeRabbit remediation. Cross-browser testing. Prettier enforcement. RTL verification. | Week 8 |
| **Phase 5 — Launch** | Production deploy to Vercel. DNS + SSL. Sentry production alerts live. Admin training. Production admin user(s) seeded. | Week 9 |

---

## 15. Open Questions and Decisions Required

| # | Question | Owner | Due |
| --- | --- | --- | --- |
| 1 | What is the official brand name? (Used in logo, pickup store name, email templates) | Brand Owner | Before Phase 1 |
| 2 | What is the physical store address and pickup hours? | Brand Owner | Before Phase 3 |
| 3 | Which Myanmar phone number / email for order notification sender identity? | Brand Owner | Before Phase 3 |
| 4 | Are product categories Men/Women/Both, or style-based (Formal/Casual/Premium)? | Product Team | Before Phase 1 |
| 5 | Launch in English only, or Burmese language support required at MVP? | Brand Owner | Before Phase 0 |
| 6 | Who are the initial admin users? (Email addresses for role assignment) | Brand Owner | Before Phase 3 |
| 7 | Is Google/Social OAuth required at launch, or email-only acceptable? | Product Team | Before Phase 2 |
| 8 | Should cancelled orders send SMS notifications? (Requires integration) | Brand Owner | Before Phase 3 |

---

## 16. Out of Scope (v1.0)

- Mobile native app (iOS / Android) — web only at launch
- Payment gateway integration (KBZPay, Wave Money, card payments) — COD only
- Multi-vendor / marketplace features — single brand only
- Live chat / customer support widget
- Product reviews and ratings
- Loyalty points / rewards
- Bulk order / wholesale pricing
- SMS order notifications
- International shipping — Myanmar domestic only
- Multi-currency — MMK only
- Advanced analytics / BI dashboard — Sentry + Convex metrics only

---

## 17. Document Set

This PRD is one of four reference documents. Each has a specific purpose:

| File | Purpose | Audience |
| --- | --- | --- |
| `PRD.md` | The "what" — product requirements, scope, features, schema | Humans, stakeholders, agents |
| `DESIGN.md` | The "look" — visual design system, tokens, components | Agents implementing UI |
| `AGENTS.md` | The "how to behave" — critical rules, workflow, never-dos | Coding agents |
| `PROMPT.md` | The "plan" — structured plan for coding agents to execute | Coding agents |
| `ai-project-planner.md` | The original idea input — historical record | Reference only |

When you start a new coding session, the agent should read all four (in any order) before touching code.

---

*End of document · Myanmar Local Brand Shirt E-Commerce PRD v2.1.0 · February 2026*