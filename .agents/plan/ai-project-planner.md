We're building an e-commerce platform for a Myanmar local shirt brand. The customer-facing storefront should be inspired by shop.mango.com — clean, minimal, image-led, editorial. The admin panel should look like the shadcn dashboard-01 template (data-dense, KPI cards, sortable/filterable data tables).

The platform should let customers browse shirts, filter by size/color/price, view product detail pages with image galleries and size selectors, add to cart, and check out. Checkout only supports Cash on Delivery (COD) at launch — no card payments yet. Delivery is either nationwide shipping (2,500 MMK, 1–3 days) or free in-store pickup.

For the admin side, the store owner needs to manage products (with embedded color variants, sizes, stock per size), orders (status workflow from pending → confirmed → processing → shipped → delivered, with cancel that restores stock), inventory (low-stock alerts when stock < 5), users (customer accounts), and storefront controls (hero banner, sale banner, featured products).

Auth needs to support both customers (sign up, log in, order history) and admins (role-guarded `/admin/*` routes). Use Better Auth for this.

Tech stack I'm locked into:
- Next.js 14+ App Router with TypeScript
- shadcn/ui preset `b2BVC6P2m` (teal/emerald accent, neutral base, medium radius)
- Monorepo with Turborepo: `apps/storefront`, `apps/admin`, `packages/ui`, `packages/convex`, `packages/lib`
- Convex for backend with embedded product variants (NOT normalized into separate tables)
- Bun as package manager (never npm/yarn/pnpm)
- Sentry for error monitoring
- Lucide React icons only
- Tailwind v4 with design tokens via `@theme inline`
- Full RTL support required (Burmese + Arabic-ready)
- Currency: MMK (Myanmar Kyat / Ks) only
- i18n: English at launch, Burmese-ready

Important data model rule: products embed color variants as nested arrays (each variant has color name, hex, images, available sizes, stock per size, optional measurements). Cart and wishlist reference variants by string key, not foreign key. Orders snapshot product data (name, color, size, price) at purchase time so history stays stable.

For the design system, there's one shared `globals.css` with all the tokens (light + dark modes). Storefront and admin use the same tokens but different composition — storefront is editorial and image-led, admin is dense and data-first.

Generate me a full project plan including app summary, target users, core features, recommended tech stack, pages/routes, data model with relationships, build phases, risks/edge cases, and a final copyable starter prompt for a coding agent that already has @AGENTS.md and @DESIGN.md to follow.