# Cross-browser test plan

- **Status:** Active
- **Phase:** 4e (production hardening)
- **Source:** PRD §12 (non-functional requirements — browser support), `phase-4-plan.md` §3.4e.3
- **Owner:** Release captain per release

---

## Scope

The platform commits to a fixed browser matrix in `PRD.md:724`. Anything outside that matrix is best-effort and not a release blocker. This plan describes how to verify the customer storefront and admin panel against that matrix before each release.

Two surfaces to verify:

- **Storefront** — `apps/storefront` (port 3000, deployed at `shop.example.com` in production).
- **Admin** — `apps/admin` (port 3001, deployed at `admin.example.com` in production).

## Matrix

| Browser                    | Minimum version | OS                                  | Engine        |
| -------------------------- | --------------- | ----------------------------------- | ------------- |
| Chrome (desktop + Android) | 100+            | Windows 10+, macOS 12+, Android 10+ | Blink         |
| Safari (desktop + iOS)     | 15+             | macOS 12+, iOS 15+                  | WebKit        |
| Firefox (desktop)          | 100+            | Windows 10+, macOS 12+              | Gecko         |
| Samsung Internet           | 18+             | Android 10+                         | Chromium fork |

**Why the floors:** Safari 15 is required for `:has()`, `aspect-ratio`, and grid-gap support used in the product card grid and PDP gallery (`apps/storefront/components/product/*`); Chrome 100 for container queries in the admin sidebar layout (`apps/admin/app/(routes)/layout.tsx`); Samsung Internet 18 for One UI 5 parity with Chromium 100. Edge ships with the platform's engine and is not separately tested; IE / legacy Edge are explicitly out of scope.

## Per-app checklist

### Storefront flow

Run on **Chrome desktop** (reference), then re-run on the matrix minimums (Safari 15, Firefox 100, Samsung Internet 18). Mobile Safari and Chrome Android are covered once each.

| #   | Flow                 | URL                              | What to look for                                                                  |
| --- | -------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| 1   | Homepage             | `/`                              | Hero, category pills, featured grid, newsletter. LCP < 2.5s on throttled mobile.  |
| 2   | PLP — category       | `/men`, `/men/shirts`            | Filter by size, color, price. Sort newest / price / name. Load more button.       |
| 3   | PLP — empty          | `/sale` after a forced empty     | Empty state copy and CTA.                                                         |
| 4   | PDP                  | `/products/oxford-classic-white` | Gallery, color and size pickers, stock indicator, accordion.                      |
| 5   | Cart (drawer + page) | `/cart` + Add to bag drawer      | Drawer slides in, qty stepper, totals. Remove confirmation dialog, totals recalc. |
| 6   | Checkout             | `/checkout`                      | Form validation, delivery method toggle, COD only.                                |
| 7   | Order confirmation   | `/order-confirmation/[id]`       | Order number, summary, "Continue shopping" CTA.                                   |
| 8   | Account              | `/account/orders`                | Sign-in gate, order history, cancel-pending action.                               |
| 9   | Wishlist             | `/account/wishlist`              | Saved items, "Move to bag" action.                                                |
| 10  | Sign-in              | `/auth/login`                    | Form, forgot link, register link.                                                 |
| 11  | Sign-up              | `/auth/register`                 | Email verification banner if `RESEND_FROM_EMAIL` missing.                         |
| 12  | Forgot / reset       | `/auth/forgot-password`          | Code request, reset form, redirect to login.                                      |
| 13  | Mobile menu          | open hamburger                   | All links reachable, focus trap, esc closes.                                      |
| 14  | RTL                  | toggle `dir="rtl"` in devtools   | Logical properties only, no flipped logos, mirrored chevrons.                     |

### Admin flow

Run on Chrome desktop and Safari desktop minimum. Admin is desktop-only (`PRD.md:728`), so mobile browsers are not in scope for admin.

| #   | Flow              | URL                                                | What to look for                                                            |
| --- | ----------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Login redirect    | `/admin` signed out                                | Redirects to storefront login.                                              |
| 2   | Dashboard         | `/admin`                                           | KPI cards, visitor chart, recent orders, low-stock feed.                    |
| 3   | Orders list       | `/admin/orders`                                    | Filters, search, pagination, status workflow.                               |
| 4   | Order detail      | `/admin/orders/[id]`                               | Snapshot items, status dropdown, cancel/restore.                            |
| 5   | Bulk update       | select rows, change status                         | Toast feedback, optimistic update.                                          |
| 6   | Products list     | `/admin/products`                                  | Featured / published toggles, filter, search.                               |
| 7   | Product form      | `/admin/products/new`, `/admin/products/[id]/edit` | Two tabs, embedded variant editor, image upload.                            |
| 8   | Duplicate product | action menu on a row                               | Clones to new draft slug, lands on edit.                                    |
| 9   | Inventory         | `/admin/inventory`                                 | Flat grid, inline stock edit, low-stock highlight.                          |
| 10  | Users             | `/admin/users`                                     | Role pill, active toggle, search.                                           |
| 11  | User detail       | `/admin/users/[id]`                                | Profile, role select, order history, lifetime months.                       |
| 12  | Settings          | `/admin/settings`                                  | Hero, sale banner, announcement, contact, social, pickup, featured reorder. |
| 13  | Dark mode         | theme toggle in top bar                            | Tokens swap, no contrast loss on tables.                                    |
| 14  | Logout            | user menu → Sign out                               | Confirms, returns to storefront login.                                      |

## Tools

- **Baseline — local manual testing.** A QA pass on the four matrix minimums is the default for every release.
- **Recommended — BrowserStack Live** (https://www.browserstack.com) for Samsung Internet 18 on a real Android device; Samsung's Chromium fork has subtle differences from stock Chrome that emulators miss. One 1–2 hour session per release is enough.
- **CI signal** — `.github/workflows/ci.yml` does not run cross-browser tests; it runs `bun run lint`, `bun run typecheck`, `bun run build`, and `bun run format:check` on Ubuntu Chromium only. Treat CI green as a precondition, not a substitute for the manual pass.

## Process

Run the full checklist once per release, before tagging. The release captain owns scheduling and sign-off.

1. **Setup** — `bun install`, then `bunx convex dev` and `bun run dev` in the background. Smoke-test on Chrome desktop first.
2. **Per-browser** — Pick the matrix minimum for each engine. Test the storefront at mobile (390 × 844) and desktop (1440 × 900); test the admin at desktop only.
3. **Per-flow** — Tick the box only if the flow completes without console errors and no visual regression versus Chrome desktop.
4. **Log results** — Append a section to the release PR body:

   ```
   ## Cross-browser sign-off
   - Chrome 100 (Win 11):  storefront ✓  admin ✓
   - Safari 15 (macOS 12): storefront ✓  admin ✓
   - Firefox 100 (Win 11): storefront ✓  admin — n/a (no time)
   - Samsung Internet 18:  storefront ✓  admin n/a
   ```

5. **Blockers** — anything that fails the storefront or admin list on a supported minimum is a P0 and blocks the release. File a GitHub issue and link it from the PR.

## Sign-off

Per release, the release captain ticks the boxes below in the PR description.

```markdown
## Cross-browser sign-off (4e plan)

- [ ] Storefront: Chrome 100 reference pass
- [ ] Storefront: Safari 15 (desktop + iOS) pass
- [ ] Storefront: Firefox 100 pass
- [ ] Storefront: Samsung Internet 18 (BrowserStack) pass
- [ ] Admin: Chrome 100 + dark mode + Safari 15 pass
- [ ] RTL: storefront and admin pass
- [ ] Console clean (no unhandled rejections, no Sentry errors) on every pass
- [ ] No open P0 browser issues from this release
```

## Related

- PRD §12 (non-functional requirements)
- [`docs/operations/production-deploy.md`](operations/production-deploy.md) — post-deploy smoke test complements this plan
- [`docs/operations/sentry-alerts.md`](operations/sentry-alerts.md) — Sentry errors found here should be wired into alerts
