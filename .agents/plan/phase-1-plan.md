# Phase 1 — Storefront MVP

**Status:** Locked — awaiting execution approval
**Date:** June 2026
**Author:** Implementation planning pass
**Source docs:** `PRD.md` §7, §8, §9.1 · `PROMPT.md` §5 Phase 1 · `DESIGN.md` · `AGENTS.md`

---

## 1. Scope

Build the customer-facing storefront end-to-end: a guest can browse the catalog, configure a product variant (color + size), add to cart, and check out via Cash on Delivery. Auth, account pages, wishlist, and admin are **out of scope** for Phase 1 (those are Phase 2 / Phase 3).

### Routes to build (PRD §9.1)

| Route | Page | Auth |
|---|---|---|
| `/` | Homepage | No |
| `/[category]` | PLP | No |
| `/[category]/[subcategory]` | Filtered PLP | No |
| `/products/[slug]` | PDP | No |
| `/cart` | Cart page | No |
| `/checkout` | Checkout (COD only) | Guest allowed |
| `/order-confirmation/[id]` | Order success | No |

### Explicitly deferred
- All auth pages → Phase 2
- All `/account/*` pages → Phase 2
- Wishlist → Phase 2
- Newsletter subscriber storage → post-MVP (form UI still included, writes to console for now)
- Real product image uploads → Phase 3 (admin); Phase 1 uses gradient placeholders driven by `colorHex`
- Related products (PDP "You may also like") → P1 stub block, no data wiring
- Social link targets → footer UI only, links to `#`

---

## 2. Locked decisions (from this planning pass)

| # | Question | Decision |
|---|---|---|
| 1 | Auth scope in Phase 1? | **Defer to Phase 2.** Storefront works with guest checkout only. |
| 2 | Image strategy? | **Option A: gradient placeholders** driven by `colorHex`. No storage setup. Admin upload in Phase 3 will fill real images. |
| 3 | Guest cart merge on sign-in? | **Auto-merge silently on auth state flip** with a success toast. (Phase 2 wires the trigger; Phase 1 ships the function + hook + drawer banner.) |
| 4 | Pagination style? | **Load-more button** (per PRD §7.3). |
| 5 | Search overlay trigger? | **⌘K keyboard shortcut** opens it anywhere, plus click on the search icon. |
| 6 | Mega menu on desktop? | **Hover with click fallback** (and a touch-friendly variant for tablet). |
| 7 | PDP "free delivery to store" callout? | **Always show "Free in-store pickup" badge** on PDP. |
| 8 | Order notes textarea? | **Include in Phase 1** (one extra field on the checkout form). |
| 9 | Currency formatting? | **No decimals.** MMK smallest unit is 100; round to nearest 100 in `formatMMK()`. (Also accept any positive integer, but never display `.00`.) |
| 10 | i18n key extraction? | **Add all P0 keys to `en.json` up front** in a single batch. |

---

## 3. Architecture & data flow

### Server vs client components
- **Server components (default):** page shells, product card skeleton, breadcrumbs, order confirmation read, homepage hero text
- **Client components:** everything that uses `useQuery`/`useMutation`/forms/cart drawer state/search overlay/filters/sort

### Cart state
- **Authed user:** cart lives in Convex `cartItems` table. Drawer queries `api.cart.list`. Writes go through `api.cart.add` / `updateQty` / `remove`.
- **Guest user:** cart lives in `localStorage` under key `khit:guest-cart` (versioned JSON: `{ v: 1, items: CartItem[] }`). Drawer reads via custom hook. Writes update the local array.
- **On sign-in (Phase 2 trigger, Phase 1 wires):** `useCartMergeOnAuth` hook calls `api.cart.mergeGuest` with the current localStorage items, then clears localStorage. A toast confirms.

### Checkout
- React Hook Form + Zod schema
- Submits to `useMutation(api.orders.create)` (already implemented with atomic stock decrement and cart cleanup for authed users)
- Guest: `customerId` is `undefined`; cart cleanup skipped
- On `ConvexError`: parse message → toast + scroll to invalid cart items + refresh

### Search
- `useQuery(api.products.list, { search: debouncedQuery, isPublished: true, pageSize: 8 })` inside a `<Command>` palette triggered by ⌘K

### RTL
- Default `dir="ltr"` (Burmese is LTR; Arabic support comes later)
- All layouts use logical properties (`ms-*`/`me-*`/`ps-*`/`pe-*`/`start`/`end`)
- Directional icons get `rtl:rotate-180`
- Manual test pass with `<html dir="rtl">` temporarily flipped in dev

---

## 4. New code needed

### 4.1 Backend (`packages/convex`, `packages/lib`)

**Schema additions (`packages/convex/schema.ts` → `storeSettings`):**
- `pickupStoreName: v.optional(v.string())`
- `pickupStoreAddress: v.optional(v.string())`
- `pickupStoreHours: v.optional(v.string())`

**Seed update (`packages/convex/seed.ts`):** set defaults like "Khit Yangon Flagship", "No. 12, Shwedagon Pagoda Road, Yangon", "Mon–Sun, 10:00–20:00".

**New Convex function (`packages/convex/cart.ts`):**
- `mergeGuest` — args: `{ items: v.array(v.object({ productId, colorVariantId, size, quantity })) }`. Authed user only. Validates stock, dedupes with existing cart, upserts. Returns count merged.

**New Convex function (`packages/convex/storeSettings.ts`):** add `pickupStore*` fields to the `update` mutation args.

**New Convex query (`packages/convex/categories.ts`):** already has `listAsTree` ✅

**Constants (`packages/lib/src/constants.ts`):**
- `LOW_STOCK_THRESHOLD = 5`
- `SHIPPING_DELIVERY_DAYS = '1–3 business days'`
- `GUEST_CART_STORAGE_KEY = 'khit:guest-cart'`
- `GUEST_CART_VERSION = 1`

**Currency (`packages/lib/src/formatMMK.ts`):** update to round to nearest 100. Example: `formatMMK(2473) → "2,500 Ks"`. Strip trailing zeros if amount is exact multiple.

**Guest cart helpers (`packages/lib/src/cart/guest.ts`):**
- `readGuestCart(): GuestCartItem[]` — parses localStorage, returns `[]` on parse failure
- `writeGuestCart(items): void` — JSON-serializes with `{ v: 1, items }`
- `clearGuestCart(): void`
- All operations wrapped in try/catch (PRD §11.3)

**Merge hook (`packages/lib/src/cart/merge.ts`):**
- `useCartMergeOnAuth(): void` — uses `useConvexAuth` + `useEffect`; when `isAuthenticated` flips true and there are guest items, calls `useMutation(api.cart.mergeGuest)` then `clearGuestCart()` and shows a toast
- `useGuestCart(): [items, setItems]` — localStorage-backed state with `useSyncExternalStore`
- `useCartItems()` — unified hook that returns either Convex items (authed) or guest items (guest), plus the right mutators

**Cart UI store (`packages/lib/src/hooks/use-cart-ui.ts`):**
- `useCartUIStore()` — `{ isOpen, open, close, toggle }` via `useSyncExternalStore`
- No external state library

**i18n (`packages/lib/src/locales/en.json`):** one large batch of P0 keys (see §5).

**Shared cart-summary helper (`packages/lib/src/cart/summary.ts`):**
- `computeCartSummary(items, deliveryMethod): { subtotal, shippingFee, total }`
- Used by drawer, cart page, checkout, order confirmation

### 4.2 Storefront components

**Shell (`apps/storefront/app/layout.tsx`):** wrap children with `<CartUIProvider>`, `<CartMergeOnAuth>`, render `<StorefrontHeader />`, `<StorefrontFooter />`, `<CartDrawer />`, `<SearchOverlay />`.

**Components (`apps/storefront/components/storefront/`):**
- `header.tsx` — logo (centered), primary nav, search icon, account, bag with badge
- `footer.tsx` — 4-col links, social icons, COD badge
- `mega-menu.tsx` — uses `useQuery(api.categories.listAsTree)`, hover + click trigger
- `sale-banner.tsx` — driven by `storeSettings.get`, dismissible via localStorage
- `cart-icon.tsx` — bag icon with count badge (uses unified cart hook)
- `cart-drawer.tsx` — `<Sheet side="right">` with items, qty stepper, totals, "Checkout" CTA
- `cart-merge-on-auth.tsx` — mounts the merge hook
- `mobile-nav.tsx` — hamburger → full-screen `<Sheet>`
- `search-overlay.tsx` — ⌘K-triggered `<Command>` palette
- `product-card.tsx` — image (gradient placeholder + hover swap), name, prices, OOS overlay, color swatches
- `quick-add.tsx` — hover-revealed size selector
- `product-filters.tsx` — size, color, price range, category
- `sort-select.tsx`
- `pagination-load-more.tsx`
- `hero-banner.tsx` — driven by `storeSettings.get.hero*`
- `category-pills.tsx`
- `featured-products.tsx`
- `image-gallery.tsx` — 2-col grid desktop, swipeable mobile (use `embla-carousel-react`)
- `color-selector.tsx` — swatch buttons
- `size-selector.tsx` — horizontal buttons, OOS grayed, "Size Guide" dialog
- `stock-indicator.tsx` — "Only N left" / "Out of stock"
- `breadcrumb.tsx`
- `related-products.tsx` — P1 stub
- `placeholder-image.tsx` — gradient driven by `colorHex`
- `free-pickup-badge.tsx`
- `newsletter-signup.tsx` — P1, posts to a no-op handler for now

**Checkout (`apps/storefront/components/storefront/checkout/`):**
- `checkout-form.tsx` — RHF + Zod
- `contact-fields.tsx`
- `delivery-address-fields.tsx`
- `delivery-method-radio.tsx` — Shipping (2,500 MMK) | Pickup (free)
- `pickup-info-card.tsx` — name/address/hours from `storeSettings.get`
- `payment-callout.tsx` — "Cash on Delivery only"
- `order-summary.tsx` — items, subtotal, shipping, total
- `place-order-button.tsx` — submit with loading state

**Cart page (`apps/storefront/app/cart/page.tsx`):** reuses drawer layout in a full-page shell, same summary.

**Order confirmation (`apps/storefront/app/order-confirmation/[id]/page.tsx`):**
- `confirmation-card.tsx`
- `order-items-table.tsx`
- "Continue shopping" → `/`

**PDP (`apps/storefront/app/products/[slug]/page.tsx`):** server component fetches `getBySlug`, renders gallery + selectors + accordion + breadcrumb + free-pickup badge.

**PLP (`apps/storefront/app/[category]/page.tsx` + `[category]/[subcategory]/page.tsx`):** server component reads category from URL slug, passes to client `ProductGrid` that handles filters/sort/pagination via `useQuery`.

**Homepage (`apps/storefront/app/page.tsx`):** server component fetches `storeSettings.get` + `products.list({ isFeatured: true })`, renders hero + category pills + featured grid.

---

## 5. i18n key list (to be added to `en.json` in one batch)

Namespaces (all flat within their namespace):
- `nav.*` — `women`, `men`, `new`, `sale`, `cart`, `account`, `signIn`, `signOut`, `search`
- `header.*` — `tagline`, `searchPlaceholder`, `openMenu`, `closeMenu`, `viewBag`
- `footer.*` — `shop`, `about`, `help`, `contact`, `rights`, `followUs`, `payment.cod`
- `homepage.*` — `heroEyebrow`, `heroCta`, `categoryHeading`, `featuredHeading`, `newsletterHeading`, `newsletterDescription`, `newsletterCta`, `newsletterSuccess`
- `plp.*` — `count` (with `{count}` and `{total}` placeholders), `sortLabel`, `sort.newest`, `sort.oldest`, `sort.priceAsc`, `sort.priceDesc`, `sort.nameAsc`, `sort.nameDesc`, `filtersHeading`, `filterSize`, `filterColor`, `filterPrice`, `filterCategory`, `clearFilters`, `loadMore`, `noResults`, `noResultsDescription`
- `pdp.*` — `addToCart`, `addedToCart`, `selectSize`, `selectColor`, `sizeGuide`, `sizeGuideTitle`, `sizeGuideDescription`, `outOfStock`, `lowStock` (with `{count}`), `inStock`, `freePickup`, `accordionDescription`, `accordionCare`, `accordionFit`, `relatedHeading`, `breadcrumbHome`
- `cart.*` — `title`, `empty`, `emptyDescription`, `continueShopping`, `subtotal`, `shipping`, `shippingNote`, `total`, `checkout`, `remove`, `quantity`, `signInToSync`, `removeConfirmTitle`, `removeConfirmDescription`
- `checkout.*` — `title`, `contactHeading`, `name`, `email`, `phone`, `deliveryHeading`, `address`, `deliveryMethodHeading`, `shippingLabel`, `shippingDescription`, `pickupLabel`, `pickupDescription`, `paymentHeading`, `paymentCodBadge`, `notesHeading`, `notesPlaceholder`, `placeOrder`, `orderSummary`, `orderProcessing`, `errorGeneric`, `errorStock`, `errorStockToast`
- `order.*` — `confirmationTitle`, `confirmationSubtitle`, `orderNumber` (with `{number}`), `placedOn`, `itemsHeading`, `subtotal`, `shipping`, `total`, `deliveryMethod.shipping`, `deliveryMethod.pickup`, `paymentMethod.cod`, `continueShopping`, `viewAccount`
- `search.*` — `placeholder`, `noResults`, `recentSearches` (P1 stub), `typeToSearch`
- `errors.*` — `networkOffline`, `productSoldOut`, `tryAgain`
- `brand.*` — `name` (alias to `brandName`)

Implementation note: `t('key')` already supports dot notation (`packages/lib/src/i18n.ts`). Format with placeholders via `t('plp.count', locale).replace('{count}', n).replace('{total}', t)` — or extend the helper to support a second arg `t('plp.count', 'en', { count: 12, total: 80 })`. **Prefer the second-arg form** for cleanliness.

---

## 6. Critical-rule compliance checklist

- [ ] All user-facing strings via `t('key')` from `@workspace/lib/i18n`
- [ ] All money via `formatMMK()` (rounds to nearest 100, no decimals)
- [ ] All design tokens from `DESIGN.md`, no hardcoded hex/oklch/font
- [ ] Variants stay embedded — never split (Phase 1 only reads, doesn't change schema, but enforces it in PDP/PLP)
- [ ] `colorVariantId` is a string key in cart/wishlist/orders
- [ ] Orders snapshot product data (already done in `orders.create`)
- [ ] RTL-ready: logical properties only; directional icons get `rtl:rotate-180`
- [ ] Bun only — never `npm`/`yarn`/`pnpm`
- [ ] No `any` in TypeScript; `unknown` + type guards
- [ ] `cursor-pointer` on all interactive elements
- [ ] Typed Convex hooks only — no direct client calls outside `_generated`
- [ ] No duplicate components — promote shared patterns to `packages/ui` or `packages/lib`
- [ ] Never edit `packages/ui/src/components/*` directly
- [ ] `bun run lint && bun run build && bun run format:check && bun run typecheck` all green before "done"
- [ ] Sentry stays conditional on `NEXT_PUBLIC_SENTRY_DSN`
- [ ] Placeholder images are gradient + `colorHex`, no fake URLs

---

## 7. Execution plan (4 sub-agents, 1 prerequisite)

### Sub-agent 0 — Prerequisites (small, must run first)
1. Add new constants to `packages/lib/src/constants.ts` (`LOW_STOCK_THRESHOLD`, etc.)
2. Add `pickupStoreName/Address/Hours` to `packages/convex/schema.ts` `storeSettings` + `storeSettings.update` args
3. Update `packages/convex/seed.ts` to set these defaults
4. Add `cart.mergeGuest` mutation in `packages/convex/cart.ts`
5. Update `packages/lib/src/formatMMK.ts` to round to nearest 100, no decimals
6. Extend `packages/lib/src/i18n.ts` to support placeholders as a second arg
7. Add all §5 P0 i18n keys to `packages/lib/src/locales/en.json`
8. Create `packages/lib/src/cart/guest.ts` (localStorage helpers)
9. Create `packages/lib/src/cart/merge.ts` (hooks)
10. Create `packages/lib/src/cart/summary.ts` (totals helper)
11. Create `packages/lib/src/hooks/use-cart-ui.ts` (drawer open/close)
12. Run `bunx convex codegen` to refresh types
13. Run `bun run lint && bun run build && bun run typecheck && bun run format:check`

### Sub-agent 1 — Layout shell, header, footer, cart drawer (medium)
- `apps/storefront/app/layout.tsx` — wire CartUIProvider, CartMergeOnAuth, render header/footer/drawer/search-overlay
- `components/storefront/header.tsx`
- `components/storefront/footer.tsx`
- `components/storefront/mega-menu.tsx`
- `components/storefront/sale-banner.tsx`
- `components/storefront/cart-icon.tsx`
- `components/storefront/cart-drawer.tsx`
- `components/storefront/cart-merge-on-auth.tsx`
- `components/storefront/mobile-nav.tsx`
- `components/storefront/search-overlay.tsx`
- `components/storefront/free-pickup-badge.tsx`
- `components/storefront/placeholder-image.tsx`
- `components/storefront/empty-cart.tsx`
- All client components where state is needed
- All use `t('key')`, tokens, logical properties

### Sub-agent 2 — Catalog pages (large)
- `apps/storefront/app/page.tsx` — homepage
- `apps/storefront/app/[category]/page.tsx` — PLP top level
- `apps/storefront/app/[category]/[subcategory]/page.tsx` — PLP sub
- `apps/storefront/app/products/[slug]/page.tsx` — PDP
- Components:
  - `product-card.tsx`, `quick-add.tsx`
  - `product-filters.tsx`, `sort-select.tsx`, `pagination-load-more.tsx`
  - `hero-banner.tsx`, `category-pills.tsx`, `featured-products.tsx`
  - `image-gallery.tsx` (embla-carousel-react)
  - `color-selector.tsx`, `size-selector.tsx`, `stock-indicator.tsx`
  - `breadcrumb.tsx`
  - `related-products.tsx` (P1 stub)
  - `newsletter-signup.tsx` (P1 stub)
- Server components for shells, client components for interactivity
- `useQuery(api.products.list, ...)` for live data

### Sub-agent 3 — Cart page, checkout, order confirmation (medium)
- `apps/storefront/app/cart/page.tsx`
- `apps/storefront/app/checkout/page.tsx`
- `apps/storefront/app/order-confirmation/[id]/page.tsx`
- Components:
  - `checkout/checkout-form.tsx` (RHF + Zod)
  - `checkout/contact-fields.tsx`
  - `checkout/delivery-address-fields.tsx`
  - `checkout/delivery-method-radio.tsx`
  - `checkout/pickup-info-card.tsx`
  - `checkout/payment-callout.tsx`
  - `checkout/order-summary.tsx`
  - `checkout/place-order-button.tsx`
  - `order-confirmation/confirmation-card.tsx`
  - `order-confirmation/order-items-table.tsx`
- Guest cart: PDP "Add to cart" for guests writes to localStorage via the unified hook
- On `orders.create` success → `router.push('/order-confirmation/' + orderId)`
- On `ConvexError` → toast with message + scroll to cart

### Sub-agent 4 — Polish, RTL, responsive, verification (small)
- Sweep every new component:
  - No hardcoded hex/oklch/font/strings
  - No `ml-*`/`mr-*`/`pl-*`/`pr-*` (use logical)
  - All icons directional-aware
- Test `dir="rtl"` by toggling `<html dir>` in dev — fix icon rotations
- Test 375 / 768 / 1280+ widths
- Lighthouse mobile ≥ 90 on `/`, `/men`, `/products/{slug}`, `/checkout`, `/order-confirmation/{id}`
- `axe-core` accessibility audit — keyboard, focus rings, labels, alt text
- Run all CI gates green

---

## 8. Verification checklist (Definition of Done)

- [ ] `bun install --frozen-lockfile` succeeds
- [ ] `bun run lint` passes
- [ ] `bun run typecheck` passes (5/5 packages)
- [ ] `bun run build` passes (2/2 apps)
- [ ] `bun run format:check` passes
- [ ] Lighthouse mobile ≥ 90 on homepage, PLP, PDP, checkout, confirmation
- [ ] Keyboard navigation works end-to-end (tab through header → search → product → add → checkout)
- [ ] Color contrast passes WCAG 2.1 AA
- [ ] Placeholder images render via `colorHex` (no broken images)
- [ ] Stock race: place order with last item → second concurrent order gets `ConvexError` "out of stock" → toast + cart refresh
- [ ] Cart drawer opens/closes correctly on bag icon click
- [ ] ⌘K opens search overlay anywhere
- [ ] Mobile hamburger → full-screen nav
- [ ] `dir="rtl"` toggle doesn't break layout (icons mirror, alignment flips)
- [ ] Guest can add to cart, see drawer, navigate to checkout, place order, see confirmation
- [ ] No hardcoded currency symbols — `formatMMK` rounds to nearest 100
- [ ] No hardcoded user-facing strings — all via `t('key')`
- [ ] `bun.lockb` committed
- [ ] README updated with storefront dev flow

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Convex `orders.create` requires auth, but guest checkout is required | `orders.create` already supports `customerId: undefined` ✅ — no change needed |
| Guest cart merge on sign-in requires auth | Hook fires on auth state flip; if unauthenticated, it's a no-op |
| `embla-carousel-react` adds bundle weight (~10KB) | Lazy-load the gallery component; only the PDP pulls it in |
| Hydration mismatch from `localStorage` cart | Use `useSyncExternalStore` + `useEffect` mount gate; render skeleton during SSR |
| Image storage IDs in seed point to non-existent files | Use gradient placeholders by `colorHex` — never reference `imageId` for display in Phase 1 |
| `formatMMK` rounding 2473 → 2,500 may surprise users | Show original price in admin tools; this is a display-only concern for Phase 1 |
| Search returns many results in overlay | Limit to 8; show "See all results →" link to `/search?q=` (Phase 1 can route to a stub page or to PLP with query) |
| PDP "low stock" badge can flicker as stock changes | Use `useQuery` for live count; Reactively updates via Convex |

---

## 10. Out of scope (explicitly)

- Sign-in / sign-up / forgot password forms (Phase 2)
- Customer account pages, order history (Phase 2)
- Wishlist (Phase 2)
- Real product image uploads (Phase 3 admin)
- Related products data wiring (P1, stub only)
- Newsletter subscriber storage backend (P1, UI only)
- Real "search results" page (overlay only; results in overlay)
- Discount % display on PDP (price comparison is enough for now)
- Sentry alerts testing (Phase 4)
- Internationalization to Burmese (only structure is ready)
- Admin pages (Phase 3)

---

**Ready to execute on your approval.** Sub-agent 0 will run first; then 1, 2, 3 in parallel; then 4 for polish.
