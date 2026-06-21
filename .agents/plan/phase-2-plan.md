# Phase 2 — Auth and Accounts

**Status:** Draft plan — awaiting execution approval
**Date:** June 2026
**Author:** Implementation planning pass
**Source docs:** `PRD.md` §7.6, §9.1 · `PROMPT.md` §5 Phase 2 · `DESIGN.md` · `AGENTS.md`
**Phase 1 status:** Complete and verified (CI gates green, dev server clean)

---

## 1. Scope

Build the customer-facing authentication system and account dashboard. Phase 1 wired the auth hooks (`useCartMergeOnAuth`, `useCartItems`, `useIsAuthenticated`) and added a "Sign in to sync" CTA in the cart drawer — all of that finally becomes useful in this phase.

### Routes to build (PRD §9.1)

| Route | Page | Auth |
|---|---|---|
| `/auth/login` | Sign in form (replace placeholder) | No |
| `/auth/register` | Sign up form (replace placeholder) | No |
| `/auth/forgot-password` | Reset request form (replace placeholder) | No |
| `/auth/reset-password` | Reset with code (new route) | No |
| `/account` | Customer dashboard (replace placeholder) | Customer |
| `/account/orders` | Order history list | Customer |
| `/account/orders/[id]` | Order detail (reuses existing `/order-confirmation/[id]` visual) | Customer |
| `/account/profile` | Profile edit (name, phone) | Customer |
| `/account/wishlist` | Wishlist (PRD P1; PROMPT says Phase 2) | Customer |

### Explicitly out of scope

- **Social auth (Google OAuth)** — PRD §7.6 P2 (deferred to a later phase)
- **Saved addresses** — PRD §7.6 P1 but no schema yet; will fold into profile edit
- **Email verification flow** — would require an email provider (Resend) configured for the `verify` option of the Password provider. Phase 2 ships **email verification off**; the `Password` provider already accepts it later via `verify: EmailConfig`. (You can choose to set it up now — see open decisions below.)
- **Email notifications** (order confirmations, status updates) — no email provider configured yet
- **Admin pages** — Phase 3
- **Real product images** — Phase 3

---

## 2. Key facts about the existing setup

These shape the plan:

1. **Auth provider is already configured** — `packages/convex/auth.ts` exports `convexAuth({ providers: [Password({...})] })`. The `Password` provider is the no-verification variant (no `verify` config). Supports 5 flows: `signUp`, `signIn`, `reset`, `reset-verification`, `email-verification`.

2. **`useAuthActions()` from `@convex-dev/auth/react`** gives `{ signIn, signOut }`. `signIn` takes `(provider: 'password', params: { flow, email, password, name? })`. For reset flow: `signIn('password', { flow: 'reset', email })`; for reset-verification: `signIn('password', { flow: 'reset-verification', email, code, newPassword })`.

3. **Client hooks already in `packages/lib/src/auth/client.ts`**: `useConvexAuth`, `useAuthActions`, `useIsAuthenticated`. The middleware is wired (`apps/storefront/middleware.ts` protects `/account/*`).

4. **Server helpers in `packages/lib/src/auth/server.ts`**: `getCurrentUser`, `getCurrentUserRole`, `isAuthenticatedUserAdmin`, `getUserRoleFromToken`, `checkAuthenticated`. All use `convexAuthNextjsToken` from `@convex-dev/auth/nextjs/server`.

5. **Convex `users.getMe`** exists. The `users` table has `role`, `isActive`, `createdAt` columns already. The `profile()` callback in the Password provider already sets `role: 'customer'`, `isActive: true` on sign up.

6. **Cart merge on auth is already wired** (Phase 1): `useCartMergeOnAuth` in `packages/lib/src/cart/merge.ts`. The hook fires when `isAuthenticated` flips to `true` and there are guest items in localStorage; calls `api.cart.mergeGuest`; shows a toast.

7. **No wishlist functions exist yet** — schema has the table (`packages/convex/schema.ts:87` defines `wishlistItems`) but no queries/mutations and no UI.

8. **Header already shows `Log In` / `My Account`** based on auth state (Phase 1 work in sub-agent 1). It currently points at `/auth/login` and `/account` placeholders.

9. **i18n coverage for `auth.*` and `account.*`** is minimal (placeholder strings only). Will need a much larger batch.

10. **Email provider (Resend) is not configured** — no `RESEND_API_KEY` in `.env.example`. So we can ship flows that don't require email (sign up, sign in, sign out), but **password reset is gated on an email provider**.

---

## 3. The plan

### 3.1 Backend additions (`packages/convex`)

**`packages/convex/auth.ts`** — no changes (already set up).

**`packages/convex/users.ts`** — add functions:
- `updateProfile` mutation — authed, updates `name` and `phone` for the current user
- `updatePassword` mutation — authed, uses Convex Auth internals (the recommended way is `signIn('password', { flow: 'reset-verification', email, code, newPassword })` from the client, OR we add a server-side helper). For Phase 2, **password change from `/account/profile` is deferred** — it requires either email-verification code flow or a new server-side mutation. We'll note this in the UI as "Coming soon" if email isn't set up.

**`packages/convex/orders.ts`** — already has `list`, `getById`, `create`, `updateStatus`, `cancel`. The `list` query is already scoped to the current user when not admin. **No changes needed**.

**`packages/convex/wishlistItems.ts`** (NEW) — add functions:
- `list` query — authed, current user's wishlist with joined product/variant data
- `add` mutation — authed, dedupe by `userId + productId + colorVariantId + size`
- `remove` mutation — authed, by `id`
- `clear` mutation — authed, clear current user's wishlist
- `count` query — authed, for the wishlist icon badge

**`packages/convex/storeSettings.ts`** — no changes (already has `get`/`update`).

**`packages/convex/seed.ts`** — no schema changes needed; admin seed already exists. Could optionally seed a sample customer account for dev (e.g., `customer@example.com` / `password`); recommend **skip** — too much risk of leaking test data.

**No new Convex env vars needed for Phase 2** unless we add email verification.

### 3.2 Shared library additions (`packages/lib`)

**`packages/lib/src/auth/flows.ts`** (NEW) — typed wrappers around the `signIn`/`signOut` actions for each flow. Pure functions returning promises:
- `signUpWithPassword({ email, password, name })` → calls `signIn('password', { flow: 'signUp', email, password, name })`
- `signInWithPassword({ email, password })` → calls `signIn('password', { flow: 'signIn', email, password })`
- `requestPasswordReset({ email })` → calls `signIn('password', { flow: 'reset', email })`
- `confirmPasswordReset({ email, code, newPassword })` → calls `signIn('password', { flow: 'reset-verification', email, code, newPassword })`
- `signOutCurrent()` → calls `signOut()`

Each returns `{ ok: true } | { ok: false, error: string }` for typed error handling.

**`packages/lib/src/auth/use-auth.ts`** (NEW) — composite client hook:
- `useAuth()` — returns `{ user, isAuthenticated, isLoading, isAdmin, signIn, signUp, signOut, requestPasswordReset, confirmPasswordReset, updateProfile }`
- Wraps `useConvexAuth` + `useQuery(api.users.getMe)` + the `signIn`/`signOut` flow helpers
- Provides loading + error states

**`packages/lib/src/wishlist.ts`** (NEW) — typed wishlist helpers:
- `useWishlist()` — returns `{ items, isLoading, add, remove, clear, count }` based on auth state
- For guests, wishlist is localStorage-backed (similar to cart)
- `useWishlistMergeOnAuth()` — mirrors `useCartMergeOnAuth`, merges local wishlist into Convex on sign-in

**`packages/lib/src/cart/merge.ts`** — no changes (already handles cart merge on sign-in).

**`packages/lib/src/locales/en.json`** — add the following namespaces (the Phase 1 batch was minimal in this area):
- `auth.emailLabel`, `auth.passwordLabel`, `auth.nameLabel`, `auth.confirmPasswordLabel`
- `auth.signInTitle`, `auth.signInDescription`, `auth.signInButton`, `auth.signInLoading`
- `auth.signUpTitle`, `auth.signUpDescription`, `auth.signUpButton`, `auth.signUpLoading`
- `auth.forgotPasswordTitle`, `auth.forgotPasswordDescription`, `auth.forgotPasswordButton`
- `auth.resetPasswordTitle`, `auth.resetPasswordDescription`, `auth.codeLabel`, `auth.newPasswordLabel`, `auth.resetPasswordButton`
- `auth.signInWithEmail`, `auth.noAccount`, `auth.haveAccount`, `auth.forgotPasswordLink`, `auth.signUpLink`, `auth.signInLink`
- `auth.errorInvalidCredentials`, `auth.errorUserExists`, `auth.errorEmailNotVerified`, `auth.errorWeakPassword`, `auth.errorGeneric`, `auth.errorInvalidCode`
- `auth.checkEmailTitle`, `auth.checkEmailDescription` (shown after sign-up or password-reset)
- `account.dashboardTitle`, `account.dashboardWelcome` (with `{name}` placeholder), `account.profileHeading`, `account.ordersHeading`, `account.wishlistHeading`, `account.signOutButton`
- `account.profileName`, `account.profilePhone`, `account.profileEmail`, `account.profileSaveButton`, `account.profileSaved`
- `account.ordersEmpty`, `account.ordersEmptyDescription`, `account.ordersView`
- `account.continueShopping`
- `wishlist.title`, `wishlist.empty`, `wishlist.emptyDescription`, `wishlist.addedToWishlist`, `wishlist.removedFromWishlist`, `wishlist.moveToBag`, `wishlist.signInToSync`
- `a11y.passwordHidden`, `a11y.passwordShown`, `a11y.togglePasswordVisibility`

Total new keys: ~50.

**`packages/lib/package.json` exports** — add `./auth/flows`, `./auth/use-auth`, `./wishlist`.

### 3.3 Storefront routes

**Replace placeholders** in `apps/storefront/app/auth/`:
- `login/page.tsx` — real form, RHF + Zod
- `register/page.tsx` — real form, RHF + Zod
- `forgot-password/page.tsx` — email-only form, calls `requestPasswordReset`
- `reset-password/page.tsx` (NEW) — code + new password form

**`apps/storefront/app/account/`**:
- `page.tsx` (replace) — dashboard with sidebar nav: Profile, Orders, Wishlist, Sign out
- `layout.tsx` (NEW) — shared sidebar layout for `/account/*` with active link highlighting
- `profile/page.tsx` (NEW) — name + phone edit form
- `orders/page.tsx` (NEW) — list of customer's orders (reuse DataTable or a simple list)
- `orders/[id]/page.tsx` (NEW) — order detail (reuse existing confirmation client)
- `wishlist/page.tsx` (NEW) — wishlist grid

**`apps/storefront/components/storefront/auth/`** (NEW):
- `auth-form.tsx` — shared layout for the four auth pages (logo header, card body, footer link)
- `login-form.tsx` — email + password + "Sign in" button + "Forgot password?" link
- `register-form.tsx` — name + email + password + confirm password + "Create account" button
- `forgot-password-form.tsx` — email + "Send reset link" + "Back to sign in"
- `reset-password-form.tsx` — code + new password + confirm new password + "Reset password" button
- `check-email-card.tsx` — "Check your email" confirmation card (shown after sign-up or reset request)
- `password-input.tsx` — shadcn `<Input>` with show/hide toggle (eye icon from lucide-react)

**`apps/storefront/components/storefront/account/`** (NEW):
- `account-sidebar.tsx` — left nav with Profile, Orders, Wishlist, Sign out
- `account-header.tsx` — page title + greeting
- `profile-form.tsx` — name + phone, RHF + Zod, calls `useAuth().updateProfile`
- `orders-list.tsx` — list of orders (table or cards) with link to detail
- `order-detail-card.tsx` — wraps the existing confirmation client
- `wishlist-grid.tsx` — grid of `<ProductCard>` with "Move to bag" / "Remove" actions
- `empty-wishlist.tsx` — empty state

**`apps/storefront/components/storefront/header.tsx`** — wire up:
- Show user name in account dropdown when signed in
- Wire sign-out button to `useAuth().signOut`
- Update cart icon area to show wishlist count too (optional — could be on a separate heart icon)

**`apps/storefront/components/storefront/cart-drawer.tsx`** — when user is signed in, replace the "Sign in to sync" banner with a "Move to wishlist" link per item (optional, may defer).

### 3.4 Critical-rule compliance

- ✅ All strings via `t('key')` (50+ new keys)
- ✅ All money via `formatMMK()` (no money in this phase, but order history will need it)
- ✅ Design tokens (no hardcoded hex/oklch/font)
- ✅ `useQuery`/`useMutation` via `api` from `@workspace/convex`
- ✅ No `any`
- ✅ RHF + Zod for all forms
- ✅ `cursor-pointer` on all interactive elements
- ✅ Logical CSS properties for RTL
- ✅ No new dependencies needed (RHF and zod already in `apps/storefront/package.json` from Phase 1)
- ✅ Never edit `packages/ui/src/components/*` directly (button shim preserved)
- ✅ `bun run lint && bun run build && bun run typecheck && bun run format:check` all green

### 3.5 Execution plan (sub-agents)

#### Sub-agent 0 — Prerequisites (small, must run first)

1. Add `packages/lib/src/auth/flows.ts` with the 5 flow wrappers.
2. Add `packages/lib/src/auth/use-auth.ts` with the composite `useAuth()` hook.
3. Add `packages/lib/src/wishlist.ts` with `useWishlist()` + `useWishlistMergeOnAuth()`.
4. Add `packages/convex/wishlistItems.ts` with `list`, `add`, `remove`, `clear`, `count`.
5. Add `packages/convex/users.ts#updateProfile` mutation.
6. Update `packages/lib/src/locales/en.json` with the ~50 new keys.
7. Update `packages/lib/package.json` exports.
8. Run `bunx convex codegen` to refresh types.
9. Run all CI gates.

#### Sub-agent 1 — Auth pages (medium, parallel after 0)

- Replace placeholders in `apps/storefront/app/auth/{login,register,forgot-password}/page.tsx`
- Create `apps/storefront/app/auth/reset-password/page.tsx`
- Components in `apps/storefront/components/storefront/auth/`: `auth-form`, `login-form`, `register-form`, `forgot-password-form`, `reset-password-form`, `check-email-card`, `password-input`
- Wire redirect logic: after successful sign-in, redirect to `?next=` query param or `/account`
- All forms use RHF + Zod, all copy via `t()`, all design tokens, all logical properties

#### Sub-agent 2 — Account pages (medium, parallel after 0)

- Create `apps/storefront/app/account/layout.tsx` with sidebar
- Replace `apps/storefront/app/account/page.tsx` dashboard
- Create `apps/storefront/app/account/{profile,orders,orders/[id],wishlist}/page.tsx`
- Components in `apps/storefront/components/storefront/account/`: `account-sidebar`, `account-header`, `profile-form`, `orders-list`, `order-detail-card`, `wishlist-grid`, `empty-wishlist`
- Wire sign-out from sidebar
- Wire wishlist "Move to bag" → calls cart's `addItem`

#### Sub-agent 3 — Header auth wiring + product PDP wishlist button (small, parallel after 0)

- Update `apps/storefront/components/storefront/header.tsx`: account menu shows user name when signed in, sign-out button works
- Update `apps/storefront/components/storefront/pdp-shell.tsx` (or wherever the PDP heart button is) — wire to `useWishlist().add/remove` when authed, localStorage when guest
- Add wishlist icon to header (heart with count badge from `useWishlist().count`)

#### Sub-agent 4 — Polish, RTL, responsive, verification (small, last)

- Sweep for hardcoded values
- Test `dir="rtl"` parity
- Test 375 / 768 / 1280+
- Manual flow test: sign up → sign in → forgot password → sign out
- Run all CI gates
- Update README with the auth flow

### 3.6 Verification (Definition of Done)

- [ ] `bun install --frozen-lockfile` succeeds
- [ ] `bun run lint` passes
- [ ] `bun run typecheck` passes (5/5)
- [ ] `bun run build` passes (2/2)
- [ ] `bun run format:check` passes
- [ ] **Auth flow works end-to-end against a real Convex dev deployment**:
  - [ ] Sign up creates a `users` row with `role: 'customer'`
  - [ ] Sign in returns a session token
  - [ ] Sign out clears the session
  - [ ] Forgot password → reset → sign in with new password works
  - [ ] `/account/*` redirects to `/auth/login?next=/account/profile` when not authed
  - [ ] After sign-in, user is redirected to `next` or `/account`
  - [ ] Cart merge fires silently on sign-in (already wired in Phase 1)
  - [ ] Wishlist merge fires silently on sign-in (new in Phase 2)
  - [ ] Profile edit saves to `users.name` / `users.phone`
  - [ ] Order history shows only the current user's orders
- [ ] WCAG 2.1 AA: keyboard nav, focus rings, labels, alt text
- [ ] No hardcoded currency symbols (no money in this phase beyond order history)
- [ ] No hardcoded user-facing strings — all via `t('key')`
- [ ] `bun.lockb` committed
- [ ] README updated

### 3.7 Risks

| Risk | Mitigation |
|---|---|
| **Email verification off** — accounts can be created with any email; no ownership proof. For Phase 2 with no email provider, this is the only option. **Mitigation**: limit dev sign-ups via a clear `coming soon` notice on `/auth/register`; add `verify: Resend({...})` later in a sub-phase once RESEND_API_KEY is configured. |
| **Password reset without email** — can't actually deliver the code. **Mitigation**: keep `/auth/forgot-password` in the UI but show a dev-mode banner: "Email delivery is not configured. Check the Convex dashboard for your reset code." OR disable the route entirely until email is set up. |
| **`useAuth()` SSR safety** — hooks that read `useQuery` need to handle the case where the user is not signed in (return `null`). Sub-agent 0's `useAuth()` already gates on `useConvexAuth()`. |
| **Wishlist on PDP** — PDP is a server component, so the heart button needs to be a client island. We can wrap just the button. |
| **Wishlist count badge hydration** — use `useSyncExternalStore` for guest localStorage; gate render on `hydrated` flag to avoid mismatch. |
| **Order detail reuse** — the existing `/order-confirmation/[id]` is server-rendered. For `/account/orders/[id]`, the page is auth-gated. We can reuse the `ConfirmationClient` component by mounting it inside `/account/orders/[id]/page.tsx`. |
| **Session persistence** — Convex Auth uses localStorage by default. The `disableHotkey` flag in the theme provider has no effect on auth. |
| **CSRF / form security** — Convex Auth handles CSRF via tokens. Forms are fine. |

### 3.8 Out of scope (explicitly)

- Social auth (Google OAuth) — PRD P2
- Email verification (Resend integration) — depends on email provider
- SMS notifications — PRD out of scope
- Saved addresses (separate schema table) — PRD P1, deferred
- Password change from `/account/profile` (not from reset email) — needs email verification
- Two-factor auth — out of scope
- Admin auth flows — Phase 3
- Order email confirmations — needs email provider
- Burmese translation — only structure

---

## 4. Open decisions (locked)

1. **Email verification / password reset** — **(B) Add Resend as the email provider now.** User has Resend CLI; create a new API key and add Resend as a dependency. Configure `verify` and `reset` on the Password provider so email verification and password reset both work end-to-end. Add `RESEND_API_KEY` to `.env.example`. Phase 1 plan already lists Resend as a future dep — promoting it to Phase 2.
2. **Account dashboard default tab** — **(A) Overview.** Profile preview + recent orders + wishlist count.
3. **Wishlist placement on PDP** — **(A) Next to "Add to bag" button.**
4. **Wishlist count badge in header** — **(A) Heart icon next to the bag icon, for authed users only** (guests see no heart).
5. **Saved addresses in `/account/profile`** — **Skip for Phase 2.** Profile edits name + phone only.
6. **Order detail page reuse** — **Reuse** the existing `/order-confirmation/[id]` client component for `/account/orders/[id]`. Add a "Cancel" button when status is `pending` (uses `orders.cancel` mutation).
7. **Sign-out confirmation** — **Confirm dialog** (`<AlertDialog>`) before signing out.
8. **New password visibility toggle** — **Yes** (eye icon in `<PasswordInput>`).
9. **Form errors** — **Inline under each field** (red text + `aria-describedby`) + top-of-form toast for server errors.
10. **i18n key strategy** — **Add all up front in sub-agent 0** (matches Phase 1 convention).

## 5. Phase 2 delta (per decisions above)

- **New dependency:** `@auth/core` (peer of `@convex-dev/auth`'s email providers) + `resend` package, both added to `packages/convex`.
- **Env vars to add to `.env.example`:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (e.g. `Khit <hello@khit.com>`).
- **Auth provider changes (`packages/convex/auth.ts`):**
  - Import `Resend` from `@auth/core/providers/resend` and wrap via Convex Auth's email config shape.
  - Pass `verify: Resend({ from: process.env.RESEND_FROM_EMAIL! })` and `reset: Resend({ from: process.env.RESEND_FROM_EMAIL! })` to the `Password` provider.
  - Note: the Resend API key is read by the `Resend` provider from `RESEND_API_KEY` env (handled by `@auth/core`).
- **Documentation:** README gains a "Resend setup" section — get an API key from `https://resend.com/api-keys`, set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env`.
- **Sub-agent 0 additions:** also wire `verify` and `reset` flows; add new i18n keys for the `Check your email` card and reset code/verification code inputs.
- **Sub-agent 1 (auth pages) additions:**
  - `/auth/verify` route (NEW) — shown after sign-up if `emailVerificationTime` is missing; user pastes the code from email. Uses `signIn('password', { flow: 'email-verification', email, code })`.
  - `/auth/reset-password` page now actually works (the reset email is delivered via Resend with a code; user lands on this page from the link in the email).
- **Sign-out confirmation:** `<AlertDialog>` wrapping the "Sign out" sidebar button. Confirm triggers `useAuth().signOut()`.
- **No saved-addresses work in Phase 2** (decision 5).

---

## 6. Final summary of what changes

- **New files (~28):** 4 auth pages (login, register, forgot-password, reset-password) + verify-email page + 6 auth components + 1 account layout + 4 account pages + 7 account components + 1 wishlist hook file + 1 auth flows file + 1 use-auth hook + 1 wishlistItems Convex module + 1 Resend email config helper
- **Modified files (~12):** `packages/convex/auth.ts` (add Resend), `packages/convex/users.ts` (add `updateProfile`), `packages/convex/package.json` (add Resend deps), `.env.example` (add Resend vars), `en.json` (+~55 keys including new verify/reset keys), `header.tsx` (auth wiring + heart icon), `cart-drawer.tsx` (no changes unless we add "Move to wishlist"), `wishlistItems` Convex module, `package.json` exports, README (Resend setup section)
- **Lines of code (estimate):** ~2500–3500 new lines
- **New external dependencies:** `@auth/core`, `resend` (both added to `packages/convex` only)

---

**Ready to execute.** Sub-agent 0 first, then 1/2/3 in parallel, then 4 for polish.

---

## 5. Summary of what changes

- **New files (~25):** 4 auth pages (login, register, forgot-password, reset-password) + reset-password form + 6 auth components + 1 account layout + 4 account pages + 7 account components + 1 wishlist hook file + 1 auth flows file + 1 use-auth hook + 1 wishlistItems Convex module
- **Modified files (~10):** auth placeholders → real pages, account placeholder → real page, header.tsx (auth wiring), cart-drawer.tsx (optional wishlist link), cart hooks already done, en.json (+~50 keys), package.json exports, wishlist items Convex functions added
- **Lines of code (estimate):** ~2000–3000 new lines
- **No new external dependencies required** (unless you choose option 1B for email)

---

**Ready to execute on your approval.** Sub-agent 0 first, then 1/2/3 in parallel, then 4 for polish.
