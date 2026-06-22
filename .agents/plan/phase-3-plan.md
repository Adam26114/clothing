# Phase 3 — Admin Panel

**Status:** Draft plan — awaiting execution approval
**Date:** June 2026
**Author:** Implementation planning pass
**Source docs:** `PRD.md` §10, §6, §7.6, §9.2, §14 · `DESIGN.md` · `AGENTS.md`
**Phase 2 status:** Complete and verified (CI gates green, dev server clean)

---

## 1. Scope

Build the admin panel that operates the storefront. Phase 0–2 left the admin shell in place (sidebar, header, theme provider, Convex + auth providers, auth middleware at `apps/admin/middleware.ts:14`, six placeholder routes); Phase 3 turns it into the working ops console.

### Sub-phases

Phase 3 is split into **six sub-phases, each shipped as a separate PR** against `develop`. **3a (foundations) must land first**; **3b–3g can run in parallel** once 3a is merged but will be sequenced 3b → 3c → 3d → 3e → 3f → 3g to keep diffs reviewable.

| # | Sub-phase | Routes / artefacts |
|---|---|---|
| 3a | Foundations | Generic `<DataTable>`, admin primitives, storage helpers, all admin Convex mutations/queries, i18n namespace, super-admin seed path — no new pages |
| 3b | Dashboard | `/admin` (replaces placeholder) |
| 3c | Orders admin | `/admin/orders`, `/admin/orders/[id]` |
| 3d | Products admin | `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit` |
| 3e | Inventory admin | `/admin/inventory` |
| 3f | Users admin | `/admin/users`, `/admin/users/[id]` |
| 3g | Storefront controls | `/admin/settings` |

### Decisions locked in this round

- **Split:** 6 separate PRs (not bundled)
- **Visitors chart:** stub with deterministic seed data (no real analytics infra in this phase)
- **`orders.restore`:** new admin mutation — symmetric of `cancel`, re-decrements stock and sets status back to `pending`
- **Super-admin seeding:** new `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` env vars promote (or create) the super-admin via the seed script
- **Deferred to Phase 4 / later:** date range filter on orders, bulk status update, bulk export, duplicate product, account suspension toggle, announcement bar admin UI, stock audit log, restock alert threshold, real Sentry widget, real visitor analytics, Burmese locale

### Out of scope (matches PRD §16 + §10 priorities)

- Date range filter on orders (P1)
- Bulk status update on orders (P2)
- Bulk export (P2)
- Duplicate product (P1)
- Account suspension (P1)
- Stock audit log per variant (P1)
- Restock alert threshold (P1)
- Sentry error rate widget on admin dashboard (P1)
- Announcement bar admin UI (P2)
- Real-time visitor analytics (the chart stays on deterministic seed data)
- Burmese locale
- Any change to `apps/storefront` beyond verifying the new `storeSettings` fields are surfaced

---

## 2. Key facts about the existing setup

### 2.1 Admin shell (`apps/admin/`)

- `apps/admin/middleware.ts:14` already protects every admin route (admin/super-admin only, else redirects to storefront `/auth/login`)
- `apps/admin/app/layout.tsx:1` — root layout with `ConvexProvider`, `ThemeProvider`, `TooltipProvider`, `SidebarProvider`, `AdminHeader`, `AdminSidebar`, `Toaster`
- `apps/admin/components/admin-sidebar.tsx:1` — 6 nav items: Dashboard (`/`), Orders (`/orders`), Products (`/products`), Inventory (`/inventory`), Users (`/users`), Settings (`/settings`)
- `apps/admin/components/admin-header.tsx:1` — 56px header with `SidebarTrigger` + title
- `apps/admin/app/(routes)/{orders,products,inventory,users,settings}/page.tsx` — all five are 6-line placeholders using `<PlaceholderPage>`
- `apps/admin/app/page.tsx:1` — dashboard placeholder
- `apps/admin/app/globals.css` — single line `@import "@workspace/ui/globals.css"`
- `apps/admin/components.json` — shadcn preset `base-nova`, neutral base, RTL enabled, Lucide icons
- `apps/admin/next.config.ts` — `transpilePackages: ['@workspace/ui', '@workspace/lib', '@workspace/convex']`, Sentry-wrapped when `NEXT_PUBLIC_SENTRY_DSN` is set
- Theme: light + dark via `next-themes` (admin only; storefront is light-only per PRD §12)

### 2.2 Convex backend (`packages/convex/`)

Schema is in `packages/convex/schema.ts:23`. Already includes:
- `users` with `role: 'customer' | 'admin' | 'super-admin'` and `isActive: boolean`
- `products` with embedded `colorVariants: { id, colorName, colorHex, images: v.id('_storage')[], selectedSizes, stock: record, measurements? }[]`
- `orders` with full status union, item snapshots, indexes `by_orderNumber/by_customer/by_status/by_createdAt`
- `storeSettings` singleton (hero, sale banner, contact, social, pickup info)
- `categories` with parent/child

Functions already in place:
- `users.getMe`, `users.list` (admin), `users.getById` (admin), `users.updateRole`, `users.setActive`, `users.updateProfile`
- `orders.list` (role-aware; admin sees all), `orders.getById` (role-aware), `orders.create` (atomic stock decrement), `orders.updateStatus` (admin), `orders.cancel` (customer pending-only, or admin any)
- `products.list` (filterable), `products.getBySlug`, `products.getById` — **read-only, customer-scoped** (default `isPublished: true`)
- `categories.list`, `categories.listActive`, `categories.getBySlug`, `categories.listAsTree` — **read-only**
- `storeSettings.get` (public), `storeSettings.update` (admin)
- `cart`, `wishlistItems` — not in Phase 3 scope
- `seed.run` (action) + `seedInternal.*` (internal mutations) — seeds categories, products, storeSettings, admin user

**Gaps for Phase 3** (all added in 3a):
- No image upload pipeline (no `storage.generateUploadUrl`)
- No admin product CRUD (only customer-scoped reads)
- No admin category CRUD
- No flattened inventory query / no stock adjustment mutation
- No `orders.restore`
- No dashboard stats aggregation
- No customer history aggregation
- No super-admin seed path
- `products.getById` and `products.getBySlug` return `ProductListItem` (with `totalStock`) but **drop `measurements`** — need an `adminGetById` that returns the raw `Doc<'products'>` for the variant editor

### 2.3 Shared UI (`packages/ui/`)

- 44 shadcn primitives available
- `data-table.tsx` (807 lines) is **a hardcoded demo** bound to `schema = z.object({ id, header, type, status, target, limit, reviewer })` and a fixed column set — **must be generalized** in 3a
- `section-cards.tsx` (99 lines) — demo 4-card KPI grid (Total Revenue / New Customers / Active Accounts / Growth Rate) with hardcoded numbers — good reference for the dashboard but the dashboard will source real numbers
- `chart-area-interactive.tsx` (276 lines) — demo area chart with 90 days of static `desktop`/`mobile` data and a 90d/30d/7d `<ToggleGroup>` — pattern to copy for the visitors widget
- `chart.tsx` — `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` wrappers
- `empty-state.tsx` lives at `apps/storefront/components/storefront/empty-state.tsx` (used by storefront) — **promote to `packages/ui` in 3a**
- `<Tabs>`, `<Switch>`, `<ToggleGroup>`, `<AlertDialog>`, `<Select>`, `<Input>`, `<Textarea>`, `<Slider>`, `<Popover>`, `<Drawer>`, `<Sheet>`, `<Command>` all available
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` available — for image reorder in product variant editor and featured-products reorder
- `recharts` 3.8.0, `lucide-react`, `sonner` for toasts, `next-themes` for theme toggle
- `apps/admin/components/theme-provider.tsx` already wraps the admin in `attribute="class" defaultTheme="system"`

### 2.4 i18n (`packages/lib/src/locales/en.json`)

- `nav.orders`, `nav.products`, `nav.inventory`, `nav.users`, `nav.settings`, `nav.dashboard` — already present
- `order.status*` (6 keys) — present, reused for the admin `<StatusBadge>`
- `placeholder.genericTitle`, `placeholder.genericDescription` — used by current placeholders
- **Missing for Phase 3:** full `admin.*` namespace — see §3 of each sub-phase below for additions

### 2.5 Auth (`packages/lib/src/auth/`)

- `packages/lib/src/auth.ts:1` — `isAdminRole(role)` returns `true` for `admin` and `super-admin`
- `packages/lib/src/auth/server.ts:1` — `getCurrentUser`, `getCurrentUserRole`, `isAuthenticatedUserAdmin`, `getUserRoleFromToken` (used by admin middleware)
- Convex `requireAdmin` pattern already used in `orders.ts:33`, `users.ts:27`, `storeSettings.ts:8` — same shape reused in every new mutation
- `users.updateRole` (`packages/convex/users.ts:105`) — already gates promotions to admin with "Only super-admin can promote to admin"; **no change needed**, just a thin `users.setRole` alias for clarity if useful

### 2.6 Storefront consumers

- `apps/storefront/lib/convex-ssr.ts:44` — SSR loader already pulls `storeSettings` + `categories.listActive` + `featured` products
- `apps/storefront/components/storefront/sale-banner.tsx:40` — already reads `storeSettings.get`
- `apps/storefront/components/storefront/checkout/checkout-form.tsx:37` — already reads `storeSettings.get` for pickup info
- Hero banner / featured products / categories already wired in Phase 1
- 3g verifies the new fields are surfaced; only minimal wiring expected

### 2.7 Seed (`packages/convex/seed.ts`)

- 4 root categories + 6 subcategories
- 6 sample products with variants and stock
- One `storeSettings` singleton with default hero/sale banner/contact/social/pickup
- One admin user via `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` (creates the account if missing, or promotes an existing user to `admin`)

---

## 3. Sub-phases

### 3a — Foundations · PR #1 (BLOCKING for 3b–3g)

**Goal:** Ship the shared toolkit so every later sub-phase just composes it. No new admin pages in this PR.

#### 3a.1 Convex — new module `packages/convex/storage.ts`

- `generateUploadUrl` (admin-gated mutation) — returns a Convex file-storage upload URL
- `getUrl(storageId)` (public query) — returns the resolved file URL (so storefront can render uploaded images without admin auth)
- `deleteAt(storageId)` (admin-gated mutation) — deletes a file

#### 3a.2 Convex — additions to `packages/convex/products.ts`

- `adminList(args)` — same shape as `list` but `isPublished` defaults to `undefined` (sees all). Filters: `categorySlug`, `search`, `isPublished` (tri-state), `isFeatured` (tri-state), `sort`, `page`, `pageSize`. **Admin-gated.**
- `adminGetById(args)` — returns the raw `Doc<'products'>` (so the variant editor sees `measurements`). Admin-gated.
- `create(args)` — validates unique `slug` (rejects 409-ish via `ConvexError`), inserts with full `colorVariants[]`. Admin-gated.
- `update(args)` — patches scalar fields + optionally replaces `colorVariants[]`. Re-validates unique slug. Admin-gated.
- `softDelete(args)` — sets `isPublished: false`, leaves document in place. Admin-gated.
- `togglePublished(args)` — flips `isPublished`. Admin-gated.
- `toggleFeatured(args)` — flips `isFeatured`. Admin-gated.
- `lowStockCount(args)` — returns up to N items `{ productId, variantId, colorName, size, stock }` where `stock < LOW_STOCK_THRESHOLD` (5, from `packages/lib/src/constants.ts:7`), sorted by stock ascending. Admin-gated.

#### 3a.3 Convex — new module `packages/convex/inventory.ts`

- `list(args)` (admin) — flattens `products × colorVariants × sizes` to `InventoryRow[]`:
  ```ts
  {
    _id: string;                 // composite key for selection
    productId: Id<'products'>;
    productName: string;
    productSlug: string;
    categoryId: Id<'categories'>;
    variantId: string;
    colorName: string;
    colorHex: string;
    size: string;
    stock: number;
    updatedAt: number;
  }
  ```
  Filters: `lowStock` (stock < 5), `outOfStock` (stock = 0), `categoryId`, `search` (product name + color name), `page`, `pageSize` (default 50). Returns `{ items, total, page, pageSize }`.
- `setStock(args)` (admin) — `{ productId, variantId, size, qty }` where `qty >= 0`. Atomically sets `stock[size] = qty` and `updatedAt = now`. **Absolute value, not delta** (avoids race with concurrent orders).
- Add a small helper `setStockForVariant(product, variantId, size, qty)` in `orders.ts` next to existing `decrementStock` / `incrementStock` to keep stock logic in one place.

#### 3a.4 Convex — additions to `packages/convex/orders.ts`

- `restore(args)` (admin) — re-decrements stock (symmetric of `cancel`'s `incrementStock`) and sets `status` back to `pending`. Throws if current status is not `cancelled`. Throws on insufficient stock.
- `adminList(args)` — alias of `list` with `customerId: undefined`. (Already covered by `list` when admin; expose under a clearer name for the admin DataTable.)
- `dashboardStats(args)` (admin) — single query returning:
  ```ts
  {
    ordersToday: number;          // count of orders with createdAt >= startOfToday
    ordersTodayGmv: number;       // sum of total of those orders
    pendingCount: number;         // status === 'pending'
    mtdRevenue: number;           // sum of total of orders this month
    mtdRevenueTrendPct: number;    // vs previous month (can be negative)
    newCustomersThisMonth: number;
    newCustomersTrendPct: number; // vs previous month
    recentOrders: Doc<'orders'>[]; // last 10
    productCountActive: number;
    productCountInactive: number;
    customerCount: number;        // role === 'customer'
    activeAccountCount: number;   // isActive === true
  }
  ```
  Note: "Growth Rate" KPI in PRD §10.2 is interpreted as `mtdRevenueTrendPct` for the dashboard card; revisit if needed.
- `customerStats(args)` (admin) — `{ totalOrders, totalSpent, ltvMonths }` for a `customerId`. `ltvMonths` = months between first and last order, floored at 1 if any orders.

#### 3a.5 Convex — additions to `packages/convex/categories.ts`

- `adminList(args)` (admin) — all categories (incl. inactive), sorted by `sortOrder`.
- `create(args)` (admin) — inserts with `sortOrder` (auto-assign max+10 if not provided).
- `update(args)` (admin) — patches name/slug/description/parentId/sortOrder/isActive.
- `toggleActive(args)` (admin) — flips `isActive`.

#### 3a.6 Convex — additions to `packages/convex/users.ts`

- `adminListStats(args)` (admin) — `{ customerCount, adminCount, superAdminCount, activeCount }`.
- `setRole(args)` (super-admin only) — thin wrapper over existing `updateRole` for explicitness; the existing `updateRole` already enforces the super-admin gate at `packages/convex/users.ts:112`.
- `getCustomerHistory(args)` (admin) — `{ user, orders, stats }` where `stats` is `orders.customerStats` for that `customerId`.

#### 3a.7 Convex — additions to `packages/convex/seedInternal.ts` and `packages/convex/seed.ts`

- `seedInternal.ts` — new `promoteSuperAdmin(args)` internal mutation: takes `userId`, sets `role: 'super-admin'`, idempotent.
- `seed.ts` — read `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD`. If set, create the account if missing (password provider) or promote the existing user. Update the `summary` type to include `superAdmin: { created: boolean, userId?: Id<'users'> }`.
- Update `scripts/seed-convex.ts` env-file loading to also surface these new vars (no code change needed; the loader is generic).
- Update `.env.example` with the two new vars (commented out by default).

#### 3a.8 Shared UI — `packages/ui/src/components/data-table.tsx` refactor

Goal: one generic `<DataTable<T>>` that every admin list page uses. Pattern after the existing 807-line component but parameterised.

- Extract a hook: `useDataTable<T>({ data, columns, defaultPageSize? })` returning the `table` instance from `useReactTable`.
- Public component signature:
  ```ts
  interface DataTableProps<T> {
    columns: ColumnDef<T, unknown>[];
    data: T[];
    isLoading?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyAction?: React.ReactNode;
    bulkActions?: (selected: T[]) => React.ReactNode;
    defaultPageSize?: number;     // default 20
    tableId: string;              // for localStorage column-visibility key
    globalSearchPlaceholder?: string;
  }
  export function DataTable<T>(props: DataTableProps<T>): JSX.Element;
  ```
- Features (PRD §10.1):
  - Sortable columns with arrow indicators
  - Global search input, debounced 300ms, filters `data` by all visible columns via a configurable `getSearchableText?: (row: T) => string`
  - Column filters via `column.setFilterValue` (admins compose per-page filter UIs in the toolbar)
  - Active filter badges (one per column with a non-empty filter)
  - Pagination: First / Prev / Page N of M / Next / Last; rows-per-page selector 10/20/50/100
  - Row selection checkbox column + select-all-on-page
  - Column visibility toggle (persists to `localStorage` under `khit:datatable:cols:<tableId>`)
  - Three-dot row actions menu — driven by `columns` (the column def owns its own cell)
  - Bulk-action toolbar that renders when ≥1 row is selected
  - Empty state: `<EmptyState>` with title/description/optional action + "Clear filters" button
  - Loading state: `<DataTableSkeleton>` matching the visible columns
- Delete the hardcoded `schema = z.object({...})` and the demo `columns` array. Remove the `<TableCellViewer>` drawer (it was demo-only).
- The 807-line file becomes a thin composition over `useReactTable` plus the `<DataTable>` shell.

#### 3a.9 Shared UI — new primitives

- `packages/ui/src/components/admin/status-badge.tsx` — typed `<StatusBadge status="pending" | "confirmed" | ... />` with color mapping (e.g. pending → secondary, confirmed → default, processing → outline, shipped → default, delivered → outline w/ green dot, cancelled → destructive). Uses shadcn `<Badge>`.
- `packages/ui/src/components/admin/page-header.tsx` — `<AdminPageHeader title actions? breadcrumb? />`. Consistent spacing for the top of every admin page.
- `packages/ui/src/components/admin/data-table-skeleton.tsx` — generic skeleton rows for the DataTable.

#### 3a.10 Shared UI — promote `empty-state.tsx`

- Move `apps/storefront/components/storefront/empty-state.tsx` to `packages/ui/src/components/empty-state.tsx` (preserve the props shape).
- Replace the storefront re-export shim with a direct import from `@workspace/ui/components/empty-state`.
- Update all storefront importers (5–6 files).

#### 3a.11 Shared lib — `packages/lib/src/hooks/use-debounced-value.ts`

- Tiny hook: `useDebouncedValue<T>(value, delayMs)` returning the debounced value. Used by the DataTable global search.

#### 3a.12 i18n — `packages/lib/src/locales/en.json`

Add the `admin` namespace. Targets per sub-phase:
- 3a itself: `admin.common.*` (loading, noResults, searchPlaceholder, clearFilters, actions.delete, actions.edit, actions.save, actions.cancel, actions.confirm) — ~12 keys
- The remaining admin sections are added in 3b–3g, but a stub is fine: just make sure the keys for nav and common resolve in 3a

#### 3a.13 Dev-only test page

- `apps/admin/app/(routes)/_dev/data-table/page.tsx` — **gated by `NODE_ENV !== 'production'`** (returns 404 in production builds via `notFound()`). Renders the generic DataTable against a mock dataset of three different shapes (OrderRow, ProductRow, InventoryRow) so we can visually verify the refactor before later sub-phases rely on it.

#### 3a.14 Verification

- `bunx convex codegen` and `bunx convex dev` push new functions cleanly
- New i18n keys resolve
- `/admin/_dev/data-table` renders with skeleton/empty/data states for all three mock shapes
- `bun run lint && bun run build && bun run format:check && bun run typecheck` all clean

---

### 3b — Dashboard · PR #2

**Goal:** Replace the placeholder at `apps/admin/app/page.tsx:1` with the real dashboard. **No new Convex functions** (consumes 3a's `orders.dashboardStats`, `products.lowStockCount`).

#### 3b.1 Files

- `apps/admin/app/page.tsx` — server entry, renders `<DashboardClient />` (still force-dynamic for live data; revisit caching in Phase 4)
- `apps/admin/components/admin/dashboard/dashboard-client.tsx` — orchestrator (client component for live data)
- `apps/admin/components/admin/dashboard/kpi-grid.tsx` — 4 cards: Total Revenue (MTD MMK + trend), New Customers (count + trend), Active Accounts, Growth Rate. Uses `<Card>` + `<Badge>` for trend. `formatMMK` for the revenue number.
- `apps/admin/components/admin/dashboard/widget-orders-today.tsx` — count + GMV (MMK)
- `apps/admin/components/admin/dashboard/widget-pending-orders.tsx` — count + "Review" link to `/admin/orders?status=pending`
- `apps/admin/components/admin/dashboard/widget-low-stock.tsx` — top 5 (product name, color, size, qty) + "Manage inventory" link to `/admin/inventory`
- `apps/admin/components/admin/dashboard/widget-recent-orders.tsx` — last 10 rows, inline status `<Select>` calling `orders.updateStatus` on change with optimistic update + revert-on-error toast
- `apps/admin/components/admin/dashboard/widget-product-count.tsx` — active / inactive split
- `apps/admin/components/admin/dashboard/visitors-chart.tsx` — wraps `<ChartContainer>`; range toggle via `<ToggleGroup>`; data from `apps/admin/lib/visitors-seed.ts`
- `apps/admin/lib/visitors-seed.ts` — `getVisitorsSeries(range: '7d' | '30d' | '3mo')` returns `Array<{ date: string, desktop: number, mobile: number }>` (deterministic, e.g. seeded by date offset)
- `apps/admin/components/admin/dashboard/dashboard-skeleton.tsx` — skeleton for the whole dashboard while data loads

#### 3b.2 i18n additions

~15 dashboard keys: `admin.dashboard.{title, totalRevenue, newCustomers, activeAccounts, growthRate, ordersToday, pendingOrders, lowStockAlert, recentOrders, productCount, visitorsChart, range7d, range30d, range3mo, viewAll, manageInventory, review, noRecentOrders, noLowStock, noOrders, trendUp, trendDown, sinceLastMonth}`

#### 3b.3 Definition of done

- `/admin` loads with real numbers from `orders.dashboardStats` + `products.lowStockCount`
- Status updates from the recent-orders widget persist (optimistic + revert-on-error)
- Visitors chart switches between 7d / 30d / 3mo
- All cards responsive at 375 / 768 / 1280+
- Light + dark mode both clean
- RTL pass
- CI gates green

---

### 3c — Orders admin · PR #3

**Goal:** Full orders list + detail with status workflow, cancel, restore.

#### 3c.1 Routes / files

- `apps/admin/app/(routes)/orders/page.tsx` — server entry, renders `<OrdersTableClient />`
- `apps/admin/app/(routes)/orders/orders-table-client.tsx` — wires `<DataTable>` with column defs
- `apps/admin/app/(routes)/orders/[id]/page.tsx` — server entry, parses `params.id` (Next 15 async params)
- `apps/admin/app/(routes)/orders/[id]/order-detail-client.tsx`
- `apps/admin/components/admin/orders/columns.tsx` — `makeOrderColumns({ onCancel, onRestore })` returning 8 column defs (select, orderNumber, customerInfo.name, createdAt, total, deliveryMethod, status, actions)
- `apps/admin/components/admin/orders/orders-table-toolbar.tsx` — search input, status multi-select (Pending/Confirmed/Processing/Shipped/Delivered/Cancelled)
- `apps/admin/components/admin/orders/orders-table-bulk.tsx` — empty stub (P2 deferred)
- `apps/admin/components/admin/orders/order-detail-header.tsx` — order #, placed date, status pill
- `apps/admin/components/admin/orders/order-detail-info.tsx` — customer info + delivery info
- `apps/admin/components/admin/orders/order-items-table.tsx` — line items with thumbnail (from first image of variant via `storage.getUrl`), color dot, size, qty, unit price, line total
- `apps/admin/components/admin/orders/order-status-control.tsx` — `<Select>` of allowed transitions; calls `orders.updateStatus`
- `apps/admin/components/admin/orders/order-cancel-button.tsx` — `<AlertDialog>` confirm; calls `orders.adminCancel`
- `apps/admin/components/admin/orders/order-restore-button.tsx` — `<AlertDialog>` confirm; calls `orders.restore`
- `apps/admin/components/admin/orders/empty-orders.tsx`

#### 3c.2 DataTable config

- Default page size: 20
- Search haystack: order #, customer name, email, phone (per PRD §10.3)
- Status filter: multi-select
- `tableId: 'admin-orders'`
- Sortable: orderNumber, createdAt, total
- Hidden by default on mobile: email, phone

#### 3c.3 i18n additions

~35 keys: `admin.orders.{title, columns.orderNumber, columns.customer, columns.date, columns.total, columns.delivery, columns.status, columns.actions, searchPlaceholder, statusFilter, statusFilterAll, filterActive, noResults, noResultsDescription, detail.title, detail.placedOn, detail.customer, detail.delivery, detail.shipping, detail.pickup, detail.payment, detail.itemsHeading, detail.notesLabel, detail.statusUpdate, detail.cancelOrder, detail.cancelConfirmTitle, detail.cancelConfirmDescription, detail.cancelConfirmAction, detail.cancelConfirmCancel, detail.restoreOrder, detail.restoreConfirmTitle, detail.restoreConfirmDescription, detail.restoreConfirmAction, error.cancel, error.restore, error.updateStatus}`

#### 3c.4 Definition of done

- `/admin/orders` table: sort, search, status filter, paginate
- `/admin/orders/[id]` shows full detail; status dropdown writes; cancel/restore update DB and stock side-effects fire
- Empty + loading + error states
- RTL pass; responsive at 375 / 768 / 1280+
- CI gates green

---

### 3d — Products admin · PR #4

**Goal:** Full product CRUD with the embedded variant editor.

#### 3d.1 Routes / files

- `apps/admin/app/(routes)/products/page.tsx` + `products-table-client.tsx`
- `apps/admin/app/(routes)/products/new/page.tsx` + `product-form-client.tsx` (create mode)
- `apps/admin/app/(routes)/products/[id]/edit/page.tsx` + `product-form-client.tsx` (edit mode, prefilled via `products.adminGetById`)
- `apps/admin/components/admin/products/columns.tsx` — Thumbnail (first image), Name, SKU, Category (label), Base Price, Sale Price, Total Stock, Active toggle, Featured toggle, Actions
- `apps/admin/components/admin/products/products-table-toolbar.tsx` — search, category multi-select, active tri-state, featured tri-state
- `apps/admin/components/admin/products/active-toggle.tsx` — `<Switch>` calling `products.togglePublished` (optimistic)
- `apps/admin/components/admin/products/featured-toggle.tsx` — `<Switch>` calling `products.toggleFeatured`
- `apps/admin/components/admin/products/soft-delete-action.tsx` — `<AlertDialog>` confirm
- `apps/admin/components/admin/products/form/details-tab.tsx` — name, slug (auto-derived; editable), SKU, category, description (textarea), base price, sale price, featured, published
- `apps/admin/components/admin/products/form/variants-tab.tsx` — list of variant editors + "Add variant" button
- `apps/admin/components/admin/products/form/variant-card.tsx` — one variant: color name + hex picker, image uploader, size selector, stock table, measurements editor, "Remove variant" button
- `apps/admin/components/admin/products/form/image-uploader.tsx` — uses `storage.generateUploadUrl`; multi-select; drag-to-reorder via `@dnd-kit/sortable`; "set primary" radio; preview from `storage.getUrl`
- `apps/admin/components/admin/products/form/size-stock-grid.tsx` — for each `selectedSizes[]`, an input for stock qty
- `apps/admin/components/admin/products/form/measurements-editor.tsx` — optional shoulder/chest/sleeve/waist/length per size (cm)
- `apps/admin/components/admin/products/form/slug-field.tsx` — auto-derived from name; editable; uniqueness checked
- `apps/admin/components/admin/products/empty-products.tsx`
- `apps/admin/components/admin/products/products-skeleton.tsx`

#### 3d.2 Form behavior

- `<Tabs>` (from `packages/ui`): Details / Variants
- "Add variant" → appends empty variant card (defaults to white `#FFFFFF`, all sizes selected, 0 stock)
- "Remove variant" → confirms if any image is attached
- "Save" disabled until form is valid + dirty
- Slug uniqueness validated on blur (against existing products)
- Image upload: file → `POST` to `generateUploadUrl` URL → store returned `storageId`
- On save: `products.create` or `products.update` (passing the full `colorVariants[]` array)
- On cancel: `<AlertDialog>` if form is dirty

#### 3d.3 i18n additions

~50 keys: `admin.products.{title, addProduct, editProduct, columns.thumbnail, columns.name, columns.sku, columns.category, columns.basePrice, columns.salePrice, columns.totalStock, columns.active, columns.featured, columns.actions, searchPlaceholder, filterCategory, filterActive, filterAll, filterActiveOnly, filterInactiveOnly, filterFeaturedAll, filterFeaturedYes, filterFeaturedNo, noResults, form.tabDetails, form.tabVariants, form.name, form.slug, form.sku, form.category, form.description, form.basePrice, form.salePrice, form.featured, form.published, form.addVariant, form.removeVariant, form.removeVariantConfirm, form.colorName, form.colorHex, form.images, form.setPrimary, form.sizes, form.stock, form.measurements, form.save, form.saving, form.cancel, form.dirtyCancel, error.create, error.update, error.slugTaken, error.imageUpload}`

#### 3d.4 Definition of done

- Create / Edit / Soft-delete work end-to-end
- Inline active/featured toggles work from the table (optimistic)
- Variant editor: add, remove, reorder images, upload to Convex file storage, primary image selection
- Stock grid saves to `colorVariants[].stock[size]`
- No normalization of variants into separate tables (AGENTS rule)
- All CI gates green

---

### 3e — Inventory admin · PR #5

**Goal:** Flattened inventory grid with inline stock edits.

#### 3e.1 Routes / files

- `apps/admin/app/(routes)/inventory/page.tsx` + `inventory-table-client.tsx`
- `apps/admin/components/admin/inventory/columns.tsx` — Product Name (link to storefront PDP), Variant (color dot + name), Size, Stock Qty (editable), Actions
- `apps/admin/components/admin/inventory/inventory-table-toolbar.tsx` — search, low-stock toggle, out-of-stock toggle, category multi-select
- `apps/admin/components/admin/inventory/stock-cell-editor.tsx` — click cell → `<Input>`; on Enter/blur → calls `inventory.setStock` (absolute); on Esc → cancel; on invalid value → toast
- `apps/admin/components/admin/inventory/empty-inventory.tsx`

#### 3e.2 i18n additions

~10 keys: `admin.inventory.{title, columns.product, columns.variant, columns.size, columns.stock, searchPlaceholder, filterLowStock, filterOutOfStock, filterCategory, noResults, editStock, stockUpdated, error.update}`

#### 3e.3 Definition of done

- Inline edit: click → input → blur/Enter → persists; Esc cancels; out-of-range values rejected with toast
- Low-stock / out-of-stock filters correct
- Default rows per page: 50
- All CI gates green

---

### 3f — Users admin · PR #6

**Goal:** Customer listing + customer detail with full order history.

#### 3f.1 Routes / files

- `apps/admin/app/(routes)/users/page.tsx` + `users-table-client.tsx`
- `apps/admin/app/(routes)/users/[id]/page.tsx` + `user-detail-client.tsx`
- `apps/admin/components/admin/users/columns.tsx` — Name, Email, Phone, Role, Joined, Actions
- `apps/admin/components/admin/users/users-table-toolbar.tsx` — search, role multi-select (Customer / Admin / Super-admin)
- `apps/admin/components/admin/users/role-select.tsx` — `<Select>` (Customer / Admin) visible to super-admin only; calls `users.setRole`; read-only `<Badge>` for non-super-admins
- `apps/admin/components/admin/users/user-detail-header.tsx` — profile + key stats (total orders, total spent, joined date, LTV months)
- `apps/admin/components/admin/users/user-order-history.tsx` — list of the user's orders (reuses `<StatusBadge>`)
- `apps/admin/components/admin/users/empty-users.tsx`

#### 3f.2 i18n additions

~15 keys: `admin.users.{title, columns.name, columns.email, columns.phone, columns.role, columns.joined, columns.actions, searchPlaceholder, filterRole, noResults, detail.title, detail.totalOrders, detail.totalSpent, detail.ltv, detail.orderHistory, detail.noOrders, error.setRole, role.customer, role.admin, role.superAdmin, confirm.promote, confirm.demote}`

#### 3f.3 Definition of done

- `/admin/users` lists all users with role + joined date; search and role filter work
- `/admin/users/[id]` shows profile + order history + LTV
- Super-admin can promote/demote; non-super-admins see role as read-only
- Suspension toggle deferred (P1)
- All CI gates green

---

### 3g — Storefront controls · PR #7

**Goal:** Admin UI for the `storeSettings` singleton + featured-product manager.

#### 3g.1 Routes / files

- `apps/admin/app/(routes)/settings/page.tsx` + `settings-client.tsx` (single page with sectioned forms)
- `apps/admin/components/admin/settings/sections/hero-banner-form.tsx` — image upload (via `storage.generateUploadUrl`), title, subtitle, CTA label, CTA link
- `apps/admin/components/admin/settings/sections/sale-banner-form.tsx` — enable `<Switch>`, text, link
- `apps/admin/components/admin/settings/sections/featured-products-manager.tsx` — paginated product search via `products.adminList`, "Add to featured" / "Remove from featured" with optimistic update
- `apps/admin/components/admin/settings/sections/contact-social-form.tsx` — contactEmail, contactPhone, social Instagram/Facebook/TikTok
- `apps/admin/components/admin/settings/sections/pickup-info-form.tsx` — pickupStoreName, pickupStoreAddress, pickupStoreHours
- `apps/admin/components/admin/settings/save-bar.tsx` — sticky bottom save with dirty-state tracking; one save calls `storeSettings.update` with the merged patch
- `apps/admin/components/admin/settings/featured-products-list.tsx` — current featured (drag to reorder via `@dnd-kit/sortable`; reorder updates `isFeatured` set without changing the `isFeatured` boolean — featured order is implicit by `createdAt`; **revise**: featured list is just `isFeatured: true` products in a chosen order — store the order in a new `storeSettings.featuredOrder: v.array(v.id('products'))` field, **or** drop drag-reorder and keep it as a toggle list. **Decision: toggle list in 3g; drag-reorder deferred to Phase 4**)
- `apps/admin/components/admin/settings/empty-settings.tsx`

#### 3g.2 Storefront wiring verification (and minimal additions if missing)

- Verify `apps/storefront/lib/convex-ssr.ts:44` already pulls `storeSettings` and exposes all fields used by the storefront
- Verify `apps/storefront/components/storefront/hero-banner.tsx`, `sale-banner.tsx:40`, `checkout/checkout-form.tsx:37` already read all needed fields
- If `announcementBar` / `pickupStoreName` / etc. aren't surfaced yet, add a `useStorefrontSettings` hook in `apps/storefront/hooks/` (folder currently empty — needs creation) and wire it into the relevant components
- If nothing is missing, this is a verification-only step

#### 3g.3 i18n additions

~20 keys: `admin.settings.{title, sections.hero, sections.sale, sections.featured, sections.contact, sections.pickup, sections.social, hero.image, hero.title, hero.subtitle, hero.ctaLabel, hero.ctaLink, sale.enable, sale.text, sale.link, featured.addProduct, featured.remove, featured.empty, featured.search, contact.email, contact.phone, social.instagram, social.facebook, social.tiktok, pickup.name, pickup.address, pickup.hours, save, saving, saved, error.update}`

#### 3g.4 Definition of done

- All `storeSettings` fields editable from `/admin/settings`
- Featured products manager: add/remove (toggle, no drag-reorder in this phase)
- Hero image upload uses `storage.generateUploadUrl` and shows immediately in the storefront (after Convex real-time propagates)
- Storefront surfaces any newly-added fields (no big UI work expected)
- All CI gates green

---

## 4. Cross-cutting rules (apply to every sub-phase)

- Bun only, all deps in `packages/*` first then consumed via workspace aliases
- All admin routes already protected by `apps/admin/middleware.ts:14` — no per-route changes
- All user-facing strings via `t('admin.*')` — no hardcoded English in JSX
- All money via `formatMMK()` (already at `packages/lib/src/formatMMK.ts`)
- All colors/tokens via `packages/ui/src/styles/globals.css` — no hex in JSX (the one permitted exception: a color-variant hex value entered by an admin, which is data not styling)
- Every admin mutation: `await requireAdmin(ctx)` (or a new `requireSuperAdmin` for promotions; only added in 3f if needed)
- Every list page: shared `<DataTable>` + `<AdminPageHeader>` + `<EmptyState>` + `<DataTableSkeleton>`
- Embedded `colorVariants` only — never split into a separate table (PRD §6.8)
- After every sub-phase: `bun run lint && bun run build && bun run format:check && bun run typecheck` must pass; CI gates the PR
- After every sub-phase that touches `packages/convex/schema.ts`: regenerate codegen, run `bunx convex dev` to push
- Branching: `feature/phase-3a-foundations`, `feature/phase-3b-dashboard`, … each targeting `develop`; commit format `<type>: #<issue> — <summary>` (Conventional Commits)
- Use `question` tool to ask the user when a decision surfaces that wasn't covered in this plan
- Use sub-agents for parallel feature implementation within a sub-phase where possible (per AGENTS §"CHANGE / EDIT MODE")
- After schema changes, `bunx convex codegen` and verify the generated `_generated/*` files are updated and committed (AGENTS §"DATABASE SCHEMA CHANGES")
- Never edit `components/ui/*` directly; compose in `apps/admin/components/admin/*` (AGENTS §"NEVER DO")

## 5. Verification per sub-phase

1. `bun install --frozen-lockfile` clean
2. `bun run lint` clean
3. `bun run typecheck` clean
4. `bun run build` clean
5. `bun run format:check` clean
6. `bunx convex codegen` run after any `schema.ts` change; commit the regenerated `_generated/*`
7. `bunx convex dev` deploys new functions
8. `bun run seed` succeeds (idempotent; super-admin path exercised in 3a)
9. Visual: load `/admin` in light + dark, LTR + RTL
10. Manually walk through the PRD §10 checklist for the touched page

## 6. Dependency graph

```
3a (foundations) ──┬──> 3b (dashboard)
                   ├──> 3c (orders)
                   ├──> 3d (products)
                   ├──> 3e (inventory)
                   ├──> 3f (users)
                   └──> 3g (settings)
```

3a must merge first. 3b–3g can be parallelised once 3a is on `develop`; default sequence is 3b → 3c → 3d → 3e → 3f → 3g.

## 7. Open items (deferred)

- Date range filter on orders (P1)
- Bulk status update on orders (P2)
- Bulk export (P2)
- Duplicate product (P1)
- Account suspension toggle (P1)
- Stock audit log per variant (P1)
- Restock alert threshold (P1)
- Sentry error rate widget on admin dashboard (P1)
- Announcement bar admin UI (P2)
- Drag-reorder of featured products (cut from 3g to keep scope tight)
- Real-time visitor analytics (chart stays on deterministic seed data)
- Burmese locale
- Any change to `apps/storefront` beyond verifying the new `storeSettings` fields are surfaced
