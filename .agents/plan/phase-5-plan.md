# Phase 5 — Reusable DataTable + Reference-Style Dashboard

**Status:** Draft plan — awaiting execution approval
**Date:** June 2026
**Author:** Implementation planning pass
**Source docs:** `PRD.md` §10, §11 · `DESIGN.md` · `AGENTS.md` · `phase-4-plan.md` · `.agents/reference/{app/dashboard,components}/*`
**Phase 4 status:** Complete and merged; CI green, typecheck added, Convex deployed
**Reference design:** shadcn `dashboard-01` (tabbed sidebar, section cards, area chart, draggable data table)

---

## 1. Scope

Phase 5 has one overarching goal — **make the admin feel like a real product, not a wireframe** — split into three pillars:

1. **Reusable `DataTable`** that backs every list page (`/orders`, `/products`, `/users`, `/inventory`) plus the dashboard widgets. The current one in `packages/ui/src/components/data-table.tsx` is functional; this phase hardens it into the shared primitive the design system describes (DESIGN.md §"Tables (admin)").
2. **Reference-style dashboard** rebuilt as four tabs (`Overview` / `Visitors` / `Orders` / `Inventory`) so the admin home page reads like the shadcn `dashboard-01` reference, not a stack of bespoke Card widgets.
3. **Theme untouched.** The current `globals.css` is the source of truth (preset `b2BVC6P2m`); we run `shadcn apply` and verify zero drift.

### Decisions locked in this round

- **Reuse, do not replace.** The shared `DataTable` already exists and is the right primitive. We add props — we do not fork a second one.
- **Tabbed dashboard** (4 tabs) to match the reference's `Tabs > TabsContent` pattern. Single-tab on dedicated pages (per-page DataTable is one tab in the dashboard's `Orders` / `Inventory` panel).
- **Drag-to-reorder on every table**, persisted to `localStorage` (Convex `order` field is Phase 6).
- **Row click goes to dedicated pages** — `/orders/[id]`, `/users/[id]`, `/products/[id]/edit`. No drawer-based quick view in this phase.
- **Sidebar** uses the shared `AppSidebar` from `packages/ui` with admin-specific nav data, plus `NavUser` and the `NavMain` "Quick Create" CTA.
- **Stack unchanged.** No new icon library, no new packages, no new Convex tables. dnd-kit is already installed in `apps/admin` and `packages/ui`.

### Out of scope (parking lot for Phase 6)

- Convex `order` field for cross-device drag-to-reorder persistence.
- Real visitor analytics query (Visitors tab stays on deterministic seed data).
- Drawer-based quick view for table rows.
- Bulk actions on Products / Users / Inventory (only Orders has it today).
- Burmese locale (English only at launch per DESIGN.md / AGENTS.md).
- "Reports" / "Data Library" / "Word Assistant" real content (sidebar links stay `#`).

---

## 2. Current state of the admin

### 2.1 The shared `DataTable` already exists
`packages/ui/src/components/data-table.tsx` (623 lines). Provides: TanStack Table v8, sort, search, pagination, column visibility (persisted in `localStorage` keyed by `tableId`), row selection + bulk actions, empty state, skeleton. Exposes `<SortableHeader>`, `<SelectionCheckbox>`, `<RowCheckbox>`, `<RowActions>`.

**Gaps vs the reference:** no page-level header slot, no tab support, no drag-to-reorder, no `emptyState` override prop (callers wrap a `DataTable` in `<EmptyOrders>` outside the table today).

### 2.2 Per-page tables (the consumers)
- `apps/admin/app/(routes)/orders/orders-table-client.tsx` — TanStack-backed, `useQuery(api.orders.adminList)`, status + date filters in `OrdersTableToolbar`, bulk status + export.
- `apps/admin/app/(routes)/products/products-table-client.tsx` — `useQuery(api.products.adminList)`, category/active/featured filters in `ProductsTableToolbar`.
- `apps/admin/app/(routes)/users/users-table-client.tsx` — `useQuery(api.users.list)`, role filter in `UsersTableToolbar`.
- `apps/admin/app/(routes)/inventory/inventory-table-client.tsx` — `useQuery(api.inventory.list)`, stock filter + category in `InventoryTableToolbar`.
- All four already pass `tableId`, `columns`, `data`, `globalSearchPlaceholder`, `getSearchableText`, `getRowId`, `defaultPageSize=20`.

### 2.3 Current dashboard (the thing to replace)
`apps/admin/components/admin/dashboard/dashboard-client.tsx` renders: `KpiGrid` (4 cards, custom gradient-less), 3 small widgets (orders today, pending, product count), `WidgetLowStock` (bespoke `<ul>`), `WidgetRecentOrders` (bespoke `<Table>`), `VisitorsChart` (near-duplicate of `packages/ui/src/components/chart-area-interactive.tsx`), `WidgetSentryErrors`. No tabs.

### 2.4 Sidebar (the thing to swap)
`apps/admin/components/admin-sidebar.tsx` — a custom 64-line file with `SidebarGroup > SidebarGroupContent > SidebarMenu` of 6 items, brand in header, no footer, no quick-create, no user menu. The shared `packages/ui/src/components/app-sidebar.tsx` already exists (init'd by `shadcn apply` originally) but is unused by the admin app.

### 2.5 Reference shape (the target)
From `.agents/reference/{app/dashboard/page.tsx,components/*}`:
- `SidebarProvider` with `--sidebar-width: calc(var(--spacing) * 72)` and `--header-height: calc(var(--spacing) * 12)`, `variant="inset"`.
- `AppSidebar variant="inset"` with `SidebarHeader` (brand), `NavMain` (with "Quick Create" primary button + Inbox button), `NavDocuments` (3 items with hover actions), `NavSecondary` (Settings/Help/Search) at bottom, `NavUser` in `SidebarFooter`.
- `SiteHeader` (h-12) with `SidebarTrigger`, vertical `Separator`, page title, right-side GitHub link.
- `SectionCards` (4 KPI tiles with `bg-gradient-to-t from-primary/5 to-card shadow-xs`).
- `ChartAreaInteractive` (Recharts area, desktop + mobile series, `ToggleGroup` 7d/30d/3mo → `Select` on mobile).
- `DataTable` with `Tabs` of 4 (Outline / Past Performance / Key Personnel / Focus Documents), dnd-kit drag handle as first column, row-selection checkbox, editable cells in a `Drawer`.

### 2.6 Theme / preset verification
`packages/ui/src/styles/globals.css` is the canonical token file (DESIGN.md §"Source of truth"). `apps/admin/app/globals.css` is a one-line import of it. The project was init'd with preset `b2BVC6P2m`; we run `shadcn apply` and diff to confirm zero drift.

---

## 3. Step 0 — Preset verification

Run from repo root:
```bash
bunx --bun shadcn@latest apply --preset b2BVC6P2m
```

`git diff packages/ui/src/styles/globals.css apps/admin/app/globals.css` must show **zero** color / radius / font drift. If anything changes, revert those lines. The expected diff is empty (or, at most, a `@theme inline` block reformatting the project was already pinned to).

Then:
```bash
bun run typecheck
bun run lint
```

---

## 4. Step 1 — Enhance the shared `DataTable`

**File:** `packages/ui/src/components/data-table.tsx` (additive — no breaking changes).

### 4.1 New props on `<DataTable<T>>`

| Prop | Type | Purpose |
| --- | --- | --- |
| `toolbarTitle` | `string` | Replaces per-page `<AdminPageHeader>`. |
| `toolbarDescription` | `string` | Subtitle under the title. |
| `toolbarActions` | `ReactNode` | Primary CTA (e.g. "Add product"). |
| `toolbarFilters` | `ReactNode` | Search input + status select + date picker, etc. Caller-owned, rendered in the toolbar's filter row. |
| `toolbarSummary` | `ReactNode` | "Showing X of Y" line. |
| `tabs` | `Array<{ value: string; label: string; icon?: LucideIcon; content: ReactNode }>` | When set, wraps the whole table in `<Tabs>`. Used by the dashboard. |
| `enableRowReorder` | `boolean` | Shows dnd-kit drag handle as the first column. |
| `onReorder?` | `(oldIndex, newIndex, rows: T[]) => void` | Caller hook. |
| `emptyState?` | `ReactNode` | Override `<EmptyState>` (lets pages pass `<EmptyOrders />`, etc.). |

### 4.2 New exports

- `<DragHandle>` — wraps `useSortable` (dnd-kit) + a `Button variant="ghost" size="icon"` with `GripVertical` (Lucide) and sr-only label.
- `<DraggableRow>` — uses dnd-kit's `CSS.Transform.toString`, sets `data-dragging` on the row for styling.
- `useDataTable<T>` — already exported; add `persistReorder?: boolean` flag (localStorage only).

### 4.3 Persistence strategy for drag-to-reorder

Pure-frontend for this phase. New hook `useStoredRowOrder<T>(tableId, items, getRowId)` in `packages/lib/src/hooks/use-stored-row-order.ts`:
- Reads `localStorage.getItem('khit:datatable:order:<tableId>')` (array of row IDs).
- Returns a stable-sorted version of `items` (preserves unknown items at the end).
- Returns `reorder(oldIndex, newIndex)` that updates both the returned list and writes back to localStorage.

Convex `order` field is Phase 6. Each table calls `useStoredRowOrder('admin-orders', orders, (o) => o._id)`.

### 4.4 Empty state path

Promote `emptyState` to first-class: when the caller passes one, render it inside the empty branch instead of the default `<EmptyState>`. Keeps the existing `emptyTitle` / `emptyDescription` / `emptyAction` props as the simpler fallback.

### 4.5 Skeleton sizing

Skeleton already accepts `columnCount` + `rowCount`. The default `rowCount` is `defaultPageSize` so the skeleton matches the real table height. No change.

---

## 5. Step 2 — Sidebar + site header

### 5.1 Replace `apps/admin/components/admin-sidebar.tsx`

Use the shared `packages/ui/src/components/app-sidebar.tsx`. Pass admin-specific nav data:

```ts
const data = {
  user: { name: '<admin name>', email: '<admin email>', avatar: '/avatars/admin.jpg' },
  navMain: [
    { title: t('nav.dashboard'), url: '/', icon: LayoutDashboardIcon },
    { title: t('nav.orders'), url: '/orders', icon: ShoppingBagIcon },
    { title: t('nav.products'), url: '/products', icon: ShirtIcon },
    { title: t('nav.inventory'), url: '/inventory', icon: PackageIcon },
    { title: t('nav.users'), url: '/users', icon: UsersIcon },
    { title: t('nav.settings'), url: '/settings', icon: SettingsIcon },
  ],
  navDocuments: [
    { name: t('admin.sidebar.documents.dataLibrary'), url: '#', icon: DatabaseIcon },
    { name: t('admin.sidebar.documents.reports'), url: '#', icon: FileChartColumnIcon },
    { name: t('admin.sidebar.documents.wordAssistant'), url: '#', icon: FileTextIcon },
  ],
  navSecondary: [
    { title: t('admin.sidebar.secondary.help'), url: '#', icon: CircleHelpIcon },
    { title: t('admin.sidebar.secondary.search'), url: '#', icon: SearchIcon },
  ],
};
```

The "Quick Create" button in `NavMain` is the reference's primary CTA. Wire it to a small `<DropdownMenu>` with one item for now: **New product → `/products/new`**. Hook up `useRouter` to navigate.

`NavUser` reads from `@workspace/lib/auth/use-auth` (`useAuth()`). The `Avatar src` falls back to `AvatarFallback` (initials) when no image is set. Account / Billing / Notifications stay as menu items; "Log out" calls `signOut` from auth.

`usePathname()` powers the `data-active` prop on each `SidebarMenuButton` (highlights the current route).

`SidebarProvider` in `apps/admin/app/layout.tsx` is updated to pass:
```ts
style={{
  '--sidebar-width': '18rem',         // 288px (slightly wider than 16rem for icon + label)
  '--header-height': 'calc(var(--spacing) * 12)',  // 48px
  '--sidebar-width-icon': '3rem',
} as React.CSSProperties}
```
and `variant="inset"` on the `Sidebar`.

### 5.2 Extend `apps/admin/components/admin-header.tsx`

Use the shared `packages/ui/src/components/site-header.tsx` shape:
- `h-12 border-b` container
- `SidebarTrigger` (size `-ms-1`)
- Vertical `Separator` (mx-2 h-4)
- Dynamic page title via `usePathname()` → `admin.header.title.<route>` i18n key (fallback: `adminTitle`)
- Right-side: theme toggle (lucide `Sun` / `Moon` button, wired to `next-themes` `useTheme()`)

### 5.3 Layout change

`apps/admin/app/layout.tsx` — no structural change beyond passing the new `style` to `SidebarProvider`. The current `<main className="flex-1 p-4 lg:p-6">{children}</main>` stays. We bump to `p-4 md:p-6 lg:p-8` for breathing room around the new `SectionCards`.

---

## 6. Step 3 — Dashboard rebuild (4 tabs)

### 6.1 Page chrome

`apps/admin/app/page.tsx` (server component, unchanged `Suspense + DashboardSkeleton`):
```tsx
<AdminPageHeader title={t('admin.dashboard.title')} />
<DashboardClient />
```

`apps/admin/components/admin/dashboard/dashboard-client.tsx` (new shape):
- A `Tabs` with `TabsList` (4 triggers) + 4 `TabsContent` panels.
- Default value: `overview`.
- Persist active tab in URL `?tab=orders` via `useRouter().replace` on `onValueChange`. Default to `overview` when the param is missing.

### 6.2 The 4 tabs

| Tab | Icon (Lucide) | Content | Data source |
| --- | --- | --- | --- |
| `Overview` | `LayoutDashboard` | `SectionCards` (4 KPIs) → `ChartAreaInteractive` (visitors) → `RecentOrdersTable` (limit 10) + `LowStockTable` (limit 10) | `useQuery(api.orders.dashboardStats)`, `useQuery(api.products.lowStockCount)`, `useQuery(api.orders.adminList)` (pageSize 10), `useQuery(api.inventory.list)` filtered by low/out |
| `Visitors` | `LineChart` | Full-width `ChartAreaInteractive` only | existing `visitors-seed` |
| `Orders` | `ShoppingBag` | `<OrdersTableClient />` re-used verbatim | `useQuery(api.orders.adminList)` |
| `Inventory` | `Package` | `<InventoryTableClient />` re-used verbatim | `useQuery(api.inventory.list)` |

This is the big win: the per-feature table clients are **truly reusable** — same component, used on a dedicated page *and* inside a dashboard tab.

### 6.3 What goes away

| Old file | Disposition |
| --- | --- |
| `dashboard/widget-orders-today.tsx` | Folded into `SectionCards` "Orders today" KPI. |
| `dashboard/widget-pending-orders.tsx` | Folded into `SectionCards` "Pending" KPI. |
| `dashboard/widget-product-count.tsx` | Folded into `SectionCards` "Active products" KPI. |
| `dashboard/widget-low-stock.tsx` | Replaced by `dashboard/low-stock-table.tsx` (DataTable of low-stock rows, "Out" / "Low" status badge, "Restock" row action). |
| `dashboard/widget-recent-orders.tsx` | Replaced by `dashboard/recent-orders-table.tsx` (DataTable of last 10 orders, orderNumber cell is a Link to `/orders/[id]`). |
| `dashboard/visitors-chart.tsx` | **Deleted.** The shared `ChartAreaInteractive` from `packages/ui` is the single source of truth. |
| `dashboard/kpi-grid.tsx` | Renamed to `section-cards.tsx`; uses the reference's gradient + `@container/card` pattern. |
| `dashboard/dashboard-skeleton.tsx` | Simplified to a single layout shell (4 KPI skeletons + chart skeleton + 2 widget skeletons). Per-tab loading handed off to each child table's own `<DataTableSkeleton>`. |
| `dashboard/widget-sentry-errors.tsx` | Preserved. Placed in the `Overview` tab, full-width below the two widget tables. |

### 6.4 KPI cards (`SectionCards`)

Four tiles in a 1 / 2 / 4 responsive grid (`grid-cols-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-4`). Each tile:
- `*:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs`
- `@container/card` on the `<Card>` so the title scales with the container (`text-2xl @[250px]/card:text-3xl`).
- `CardAction` slot holds a `Badge variant="outline"` with the trend icon + percent.

KPI set:
1. **MTD Revenue** — `stats.mtdRevenue` + `stats.mtdRevenueTrendPct` → `formatMMK()`.
2. **New Customers** — `stats.newCustomersThisMonth` + trend → `toLocaleString('en-US')`.
3. **Orders Today** — `stats.ordersToday` + `stats.ordersTodayGmv` (rendered as `CardFooter` caption).
4. **Active Products** — `stats.productCountActive` with `t('admin.dashboard.productCountSummary', { active, inactive })` in the footer.

Removes the duplicate "Growth Rate" tile (was a re-render of the MTD trend).

### 6.5 Visitors tab

Single full-width `Card` containing `ChartAreaInteractive` from `packages/ui`. Centered, `aspect-auto h-[320px]`. The `ToggleGroup` / `Select` time-range control stays as-is (7d / 30d / 3mo). i18n keys: `admin.dashboard.visitorsChartTitle`, `admin.dashboard.range7d` (already exists), `range30d`, `range3mo`.

### 6.6 Orders tab (on the dashboard)

Renders `<OrdersTableClient />` inside a `Card` with no padding on the wrapper so the table flushes to the card edges (DESIGN.md §"Tables (admin)"). i18n: `admin.dashboard.tabOrdersHint` is a tiny `<p className="text-muted-foreground text-sm">` caption above the card.

### 6.7 Inventory tab (on the dashboard)

Same pattern as Orders tab — re-use `<InventoryTableClient />`.

---

## 7. Step 4 — Drag-to-reorder on every table

Add `<DragHandle>` as the first column in each table, with `enableRowReorder` on the `<DataTable>`.

| Table | Column file | tableId | getRowId |
| --- | --- | --- | --- |
| Orders | `components/admin/orders/columns.tsx` | `admin-orders` | `(row) => row._id` |
| Products | `components/admin/products/columns.tsx` | `admin-products` | `(row) => row._id` |
| Users | `components/admin/users/columns.tsx` | `admin-users` | `(row) => row._id` |
| Inventory | `components/admin/inventory/columns.tsx` | `admin-inventory` | `(row) => row._id` |
| Dashboard recent orders | `components/admin/dashboard/recent-orders-table.tsx` | `dashboard-recent-orders` | `(row) => row._id` |
| Dashboard low stock | `components/admin/dashboard/low-stock-table.tsx` | `dashboard-low-stock` | `(row) => `${row.productId}-${row.variantId}-${row.size}`` |

Order persistence: `useStoredRowOrder(tableId, rows, getRowId)` in `packages/lib/src/hooks/`.

The drag handle is a 28×28 ghost `Button` with `GripVerticalIcon` and a sr-only "Drag to reorder" label. Hover lifts to `bg-muted`. The row sets `data-dragging` for a 150ms ease opacity dip to 0.8 per the reference.

---

## 8. Step 5 — Per-page refactor (consume the new DataTable props)

After Steps 1 + 4 land, each caller becomes ~30% smaller because the page header + summary + filter toolbar are owned by the DataTable.

| File | Before | After |
| --- | --- | --- |
| `orders/orders-table-client.tsx` | `<AdminPageHeader>` + `OrdersTableToolbar` (search + status + date range + summary) | `toolbarTitle` + `toolbarFilters={<OrdersFilters ... />}` + `toolbarSummary` |
| `products/products-table-client.tsx` | header + `ProductsTableToolbar` | `toolbarTitle` + `toolbarActions={<AddProductButton />}` + `toolbarFilters` |
| `users/users-table-client.tsx` | header + `UsersTableToolbar` | `toolbarTitle` + `toolbarFilters` |
| `inventory/inventory-table-client.tsx` | header + `InventoryTableToolbar` | `toolbarTitle` + `toolbarFilters` |

Each per-feature `*table-toolbar.tsx` is renamed `*filters.tsx` and shrinks to just the filter chip group (search input + status select + date picker, etc.) — the header is no longer its concern.

The `add product` / `add user` etc. primary actions move into `toolbarActions` (e.g. `<Button render={<Link href="/products/new" />}><PlusIcon /> {t('admin.products.addProduct')}</Button>`).

---

## 9. Step 6 — i18n additions

All new keys in `packages/lib/src/locales/en.json` under `admin.*`:

```json
"sidebar": {
  "quickCreate": "Quick Create",
  "quickCreateProduct": "New product",
  "documents": {
    "dataLibrary": "Data Library",
    "reports": "Reports",
    "wordAssistant": "Word Assistant"
  },
  "secondary": {
    "help": "Get help",
    "search": "Search"
  }
},
"header": {
  "title": {
    "dashboard": "Dashboard",
    "orders": "Orders",
    "products": "Products",
    "inventory": "Inventory",
    "users": "Users",
    "settings": "Settings"
  }
},
"dashboard": {
  "tabOverview": "Overview",
  "tabVisitors": "Visitors",
  "tabOrders": "Orders",
  "tabInventory": "Inventory",
  "tabOrdersHint": "Manage order status, fulfilment, and fulfilment exports.",
  "tabInventoryHint": "Stock levels, low-stock alerts, and variant detail.",
  "visitorsChartTitle": "Total visitors",
  "ordersToday": "Orders today",
  "ordersTodayGmv": "GMV {amount}",
  "activeProducts": "Active products",
  "lowStockColumn": {
    "product": "Product",
    "variant": "Variant",
    "size": "Size",
    "stock": "Stock",
    "actions": "Actions"
  },
  "restock": "Restock"
}
```

Burmese translations remain Phase 6 (post-launch) per Phase 4 decision.

---

## 10. Sub-agent parallelization

Per AGENTS.md "Change / Edit Mode" rule (use sub-agents for parallelizable work, premium model for code).

| # | Agent | Scope | Depends on |
| --- | --- | --- | --- |
| **E** | i18n + preset verify | Run `shadcn apply`, diff globals.css (revert any drift), add all `admin.*` keys from §9, run `format`. | — |
| **A** | `DataTable` core | §4: new props, `<DragHandle>`, `<DraggableRow>`, `useStoredRowOrder` hook, `emptyState` prop. Lint + typecheck. | E (consumes the i18n keys for filter labels). |
| **B** | Sidebar + header | §5: replace `admin-sidebar.tsx`, extend `admin-header.tsx`, update `layout.tsx` style + variant. Lint + typecheck. | E (consumes `admin.sidebar.*`, `admin.header.*` keys). |
| **C** | Dashboard rebuild | §6: `dashboard-client.tsx` (tabs), `section-cards.tsx`, `recent-orders-table.tsx`, `low-stock-table.tsx`, simplified `dashboard-skeleton.tsx`. Delete the old widget files. Lint + typecheck. | A (consumes new DataTable props + `useStoredRowOrder`). |
| **D** | Per-page refactor | §8: shrink each `*-table-client.tsx`, rename `*-table-toolbar.tsx` → `*-filters.tsx`, add `<DragHandle>` columns. Lint + typecheck. | A + C (D wires the dashboard's "Orders" / "Inventory" tabs to the refactored per-page clients). |

Ordering: **E → A → (B ‖ C) → D**. B and C are independent and can run in parallel after A merges.

---

## 11. Verification (Definition of Done)

Run from repo root:
```bash
bun run format
bun run lint
bun run typecheck
bun run build
bun run format:check
```

All five must pass with zero warnings on the touched files (existing lint debt in `packages/convex` and `packages/ui` data-table is Phase 4 backlog — do not regress those numbers, do not fix them here).

### Manual smoke (admin app on `http://localhost:3001`)

- `/` — four tabs render; `Overview` shows 4 KPIs + chart + recent-orders table + low-stock table; `Visitors` shows full-width chart with 7d/30d/3mo control; `Orders` shows the same table as `/orders`; `Inventory` shows the same table as `/inventory`. Active tab is reflected in `?tab=` URL param.
- `/orders` — table loads; sortable headers; column visibility toggle persists across reloads; drag handle reorders rows and survives reload (localStorage); row click navigates to `/orders/[id]`; bulk status update + export still work.
- `/products` — same checks; "Add product" still routes to `/products/new`; thumbnail + price + status toggles intact.
- `/users` — same checks; role select inline; suspend/reactivate intact.
- `/inventory` — same checks; inline stock editor + audit log still work; "View product" button still routes to `/products/[id]/edit`.
- `/settings` — sectioned forms render; nothing regressed.
- Sidebar: nav highlights the active route; "Quick Create" opens a dropdown with "New product"; user menu at the bottom shows the signed-in admin's name, email, and avatar fallback.
- Header: page title updates with the route; theme toggle swaps light/dark.
- Theme: dark mode still works; preset color matches the existing teal/emerald; `dir="ltr"` and `dir="rtl"` both readable; mobile 375px collapses sidebar to offcanvas; the system reminder's pointer style (DESIGN.md `--pointer`) still applies on every interactive element.
- Accessibility: keyboard tab through every table row, drag handle, and bulk-action toolbar; visible focus rings; bulk-action toolbar reachable via screen reader; column-visibility menu has correct `aria-label`s.
- CodeRabbit: no new critical-severity findings (the preset apply may surface a comment nit — accept or reject with rationale in the PR body).

---

## 12. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| `shadcn apply` introduces a token change that drifts from the current teal/emerald | Diff `globals.css` immediately, revert any non-style line, and re-run `format:check`. The project was init'd with this preset, so the diff should be empty. |
| Adding new props to `<DataTable>` breaks the four existing per-page callers | All new props are optional and additive. Typecheck is the gate. |
| Drag-to-reorder interferes with row-click navigation | Click and drag are mutually exclusive at the gesture level; the drag handle is a separate `<Button>` so `onClick` on the row body still navigates. |
| Re-using `<OrdersTableClient />` inside the dashboard tab causes a double-render of the `useQuery` | `useQuery` is per-hook-call, not per-page, so each instance subscribes independently. The `tableId` collides only if both instances are mounted at once — they are, but `tableId` is also the localStorage key for column visibility, and the dashboard's instance intentionally shares the same column-visibility state with the dedicated page. Documented in the prop doc. |
| `useStoredRowOrder` returns stale data when the underlying `items` change | The hook re-sorts on every `items` change via `useMemo`. The `reorder` callback is stable via `useCallback`. No new query subscriptions. |
| `AppSidebar` from `packages/ui` uses a different icon set (tabler) than the admin's Lucide | The reference uses `@tabler/icons-react`; the project is locked to Lucide. We use the existing `packages/ui/src/components/app-sidebar.tsx` (which already uses Lucide per its current contents) — the reference's tabler imports are not copied. |
| Dashboard "Orders" / "Inventory" tabs re-trigger Convex subscriptions on every tab swap | `useQuery` is per-instance, not per-render, so swapping tabs unmounts and re-mounts the client, which is acceptable (admin rarely swaps tabs back-to-back) and matches the reference's behavior. |
| `next-themes` theme toggle hydration mismatch | Already handled by `suppressHydrationWarning` on `<html>` in `layout.tsx`. The new toggle just calls `setTheme` from `useTheme()`. |

---

## 13. What this phase ships

**Net new:** 1 hook (`useStoredRowOrder`), 2 DataTable subcomponents (`<DragHandle>`, `<DraggableRow>`), 2 dashboard tables (`RecentOrdersTable`, `LowStockTable`), 1 shared `SectionCards`, 1 user menu wiring, 1 quick-create dropdown, 1 theme toggle.

**Net deleted:** 6 files (`widget-orders-today.tsx`, `widget-pending-orders.tsx`, `widget-product-count.tsx`, `widget-recent-orders.tsx`, `widget-low-stock.tsx`, `visitors-chart.tsx`). All replaced by either the shared `DataTable` + the shared `ChartAreaInteractive` or by `SectionCards`.

**Net changed:** `DataTable` (additive), 4 per-page table clients (slim down), 4 per-page toolbars (rename → filters, lose the header), 1 sidebar, 1 header, 1 layout (style bump), 1 dashboard client, 1 dashboard skeleton, 1 i18n file.

**Net LOC delta:** roughly −150 (deletions outweigh additions; the per-page tables become much smaller once the page header is the DataTable's job).
