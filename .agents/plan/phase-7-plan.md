# Phase 7 — Finish the Convex + Better Auth migration

**Status:** Planned (not implemented)
**Branch:** `feature/finish-better-auth-migration` (from `develop`; no GitHub Issue yet — see §10)
**PR target:** `develop`
**Owner:** TBD
**Trigger:** Cloud dev deployment is mid-migration — Convex side is done, `packages/lib` + both apps still import the legacy `@convex-dev/auth`, so sign-in is broken.
**Source docs:** `AGENTS.md`, `PRD.md`, `DESIGN.md`, `PROMPT.md`, current `packages/convex/{auth.config,http,betterAuth/*,users,authHelpers,seed}.ts`.
**Reviewers:** research sub-agent (current state), compliance sub-agent (vs AGENTS.md), tech-correctness sub-agent (vs BA docs + actual repo), completeness sub-agent (structure, docs, gates). Findings applied below.

---

## Contents

0. Context · 1. Goals & non-goals · 2. Architecture · 3. Detailed change set (§3.1–3.14) · 4. Implementation order · 5. Risks & mitigations (12 rows) · 6. Out of scope · 7. Verification plan · 8. Decisions · 9. Rollback · 10. Commit & PR template

---

## 0. Context

### 0.1 What is already done
Sub-agent survey of the repo confirms the Convex side of the migration is in place:
- `packages/convex/convex.config.ts` registers the `betterAuth` component.
- `packages/convex/auth.config.ts` uses `getAuthConfigProvider()` from `@convex-dev/better-auth/auth-config`.
- `packages/convex/http.ts` mounts BA routes via `authComponent.registerRoutes(http, createAuth)`.
- `packages/convex/betterAuth/{auth,resend,schema,convex.config}.ts` define the BA options, Resend hooks, internal schema, and component marker.
- `packages/convex/schema.ts` dropped `authTables`; the `users` table carries `betterAuthUserId` as the join key.
- `packages/convex/users.ts` and `packages/convex/authHelpers.ts`:
  - Convex-side identity → `ctx.auth.getUserIdentity().subject` (core Convex).
  - BA-side identity → `authComponent.safeGetAuthUser(ctx)` (BA component client).
  - Join on `users.betterAuthUserId === subject`.
- `packages/convex/seed.ts` signs up the admin via `auth.api.signUpEmail` + `users.upsertFromBetterAuth`.
- `packages/lib/package.json`, `packages/convex/package.json`, root `package.json` already declare `better-auth@^1.6.22` and `@convex-dev/better-auth@^0.12.5`.

### 0.2 What is still broken
Five categories, twelve items:
- **`packages/lib`** (5 files): `auth/{client,flows,use-auth,server}.ts` import the legacy `@convex-dev/auth`; `providers/convex.tsx` wraps in `ConvexAuthProvider` from the legacy lib.
- **Both apps** (4 files + 2 shims): `proxy.ts` use `convexAuthNextjsMiddleware`; `app/layout.tsx` pass no `initialToken`; no `app/api/auth/[...all]/route.ts` in either app.
- **`packages/lib/src/{cart/merge,wishlist}.ts`** (2 files): both still import `useConvexAuth` from the legacy lib re-export — would break at typecheck after the new `client.ts` lands.
- **Env** (3 files): `.env.example` lists `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`; deployment lacks `BETTER_AUTH_SECRET` / `SITE_URL` / `RESEND_*`.
- **Docs** (6 files): `AGENTS.md:49` and `:99`, `PRD.md:54`, `PROMPT.md:22`, `docs/operations/production-admin-seed.md`, `docs/operations/backup-and-export.md`, `docs/operations/production-deploy.md` still say "Convex Auth" — drift.

### 0.3 Why this is a small PR
BA's component client does the heavy lifting. The remaining work is wiring the existing Convex backend into the Next.js apps through the official `convexBetterAuthNextJs` helper and `ConvexBetterAuthProvider`. No new Convex functions, no new BA plugins, no schema changes.

---

## 1. Goals & non-goals

### 1.1 Goals
- Land the 12 remaining items in 0.2.
- Add `auth.errorRateLimited` to `packages/lib/src/locales/en.json` (and `my.json` if it exists).
- Add one lib test (`humanizeError.test.ts`); skip the Convex-side `auth.signup.test.ts` (see §3.13).
- Update the 6 docs in lockstep.
- Preserve the existing user-visible flow surface (sign up, sign in, forgot/reset, verify, admin guard, session persistence, cart/wishlist merge). The verify-email form changes from `{ email, code }` to `{ token }` — see §3.11.
- Keep MMK formatting, RTL, pointer cursor, Sentry, and design tokens untouched.

### 1.2 Non-goals
- New social / 2FA / magic-link / org plugins.
- Migrating orphan Convex Auth `users` rows in the dev deployment.
- Touching product, cart, order, wishlist, or category schema.
- Production deployment (only `dev:zealous-poodle-544` is touched).
- `authComponent.registerRoutesLazy` — start with `registerRoutes`; swap to lazy only if `bunx convex dev` OOMs (concrete trigger in §5).
- `authComponent.triggers.user.onCreate` (revisit in Phase 8 if a race surfaces).
- `packages/lib/src/auth/client.ts` `useSession` re-export is kept (harmless, future-proofs BA-style consumers).

---

## 2. Architecture

### 2.1 File-level change map

```text
packages/lib/src/auth/
  client.ts                 REWRITE
  flows.ts                  REWRITE
  use-auth.ts               REWRITE
  server.ts                 REWRITE
packages/lib/src/cart/merge.ts               UPDATE (drop useConvexAuth; use useAuth())
packages/lib/src/wishlist.ts                 UPDATE (drop useConvexAuth; use useAuth())
packages/lib/src/locales/en.json             UPDATE (add auth.errorRateLimited)
packages/lib/src/providers/convex.tsx        REWRITE

apps/storefront/
  app/api/auth/[...all]/route.ts  NEW
  lib/auth-server.ts              NEW  (root lib/, not app/lib/ — matches @/* tsconfig alias)
  proxy.ts                        REWRITE
  app/layout.tsx                  UPDATE (getToken, initialToken)
  app/auth/verify/verify-email-flow.tsx        UPDATE (useAuth() + ?token= search param)
  components/storefront/auth/verify-email-form.tsx  UPDATE (drop code; show "click the link" interstitial)
  components/storefront/auth/forgot-password-form.tsx  UPDATE (requestPasswordReset flow)
  components/storefront/auth/reset-password-form.tsx    UPDATE (token-based; read ?token=)
  components/storefront/auth/register-form.tsx          UPDATE (drop useConvexAuth)
  components/storefront/cart-drawer.tsx  NO-OP (consumer of useIsAuthenticated; new client.ts keeps the export)
apps/admin/
  app/api/auth/[...all]/route.ts  NEW
  lib/auth-server.ts              NEW  (root lib/, not app/lib/)
  proxy.ts                        REWRITE
  app/layout.tsx                  UPDATE

.env.example                remove: JWT_PRIVATE_KEY, JWT_PUBLIC_KEY;
                            add: BETTER_AUTH_SECRET, NEXT_PUBLIC_CONVEX_SITE_URL,
                                NEXT_PUBLIC_STOREFRONT_URL, RESEND_API_KEY, RESEND_FROM_EMAIL
apps/storefront/.env.local  +  apps/admin/.env.local
                            remove: JWT_PRIVATE_KEY, JWT_PUBLIC_KEY;
                            add: NEXT_PUBLIC_CONVEX_SITE_URL=https://zealous-poodle-544.convex.site
                            (NEXT_PUBLIC_CONVEX_URL stays put)

packages/lib/src/auth/__tests__/humanizeError.test.ts  NEW

AGENTS.md                              UPDATE (auth stack line, PII rule)
PRD.md                                 UPDATE (§2 Tech Stack table)
PROMPT.md                              UPDATE (auth stack line)
docs/operations/production-admin-seed.md   UPDATE (drop authAccounts / signIn('password', { flow: 'signUp' }); document auth.api.signUpEmail → upsertFromBetterAuth)
docs/operations/backup-and-export.md        UPDATE (replace authTables references with BA internal tables)
docs/operations/production-deploy.md        UPDATE (replace CONVEX_AUTH_PRIVATE_KEY / CONVEX_AUTH_ADAPTER_SECRET with BETTER_AUTH_SECRET)

bun.lockb                              No change expected (no new deps); commit any drift.
```

### 2.2 Why no `userProfiles` table
`users` already exists with `betterAuthUserId` as the join key. Renaming to `userProfiles` would churn every call site of `requireUserId` / `getInternalUserId` (70+ in `packages/convex`) and buy nothing. Keep the name, add the join field. (The original plan's `userProfiles` name is a YAGNI rebrand — dropped.)

### 2.3 Why no `adapter.ts`
`@convex-dev/better-auth`'s `createApi` is only required when writing Convex functions that read/write BA's internal tables from inside the component directory. The current code reads the BA `user` row via `authComponent.safeGetAuthUser(ctx)`, which does not need `adapter.ts`. Drop the file from the plan.

### 2.4 Why `registerRoutes` over `registerRoutesLazy`
Eager registration keeps the wiring small. If `bunx convex dev` OOMs the 64 MB isolate, swap one line in `packages/convex/http.ts` to `authComponent.registerRoutesLazy(http, createAuth, { basePath: '/api/auth', cors: { credentials: true }, trustedOrigins })` (see §5).

### 2.5 Why `apps/{x}/lib/auth-server.ts` (root), not `app/lib/auth-server.ts`
The `tsconfig.json` `@/*` path alias in both apps resolves to the app root (`./*`), not to `app/`. So `@/lib/auth-server` resolves to `apps/storefront/lib/auth-server.ts`. The existing convention uses root `lib/` (e.g. `apps/storefront/lib/convex-ssr.ts`, `apps/admin/lib/order-status-label.ts`). Use the same convention.

---

## 3. Detailed change set

### 3.1 `packages/lib/src/auth/client.ts`

```ts
'use client';

import { createAuthClient } from 'better-auth/react';
import { convexClient } from '@convex-dev/better-auth/client/plugins';

export const authClient = createAuthClient({ plugins: [convexClient()] });

// useSession lives on the BA auth client (nanostore-backed). Re-export so
// consumers don't import better-auth directly.
export const useSession = () => authClient.useSession();

export function useIsAuthenticated(): boolean {
  return Boolean(useSession().data);
}
```

`useIsAuthenticated` is preserved verbatim — `apps/storefront/components/storefront/cart-drawer.tsx:15` consumes it. Drop the old `useAuthActions` re-export (it doesn't exist in `@convex-dev/better-auth/react`; flows call `authClient.*` directly).

### 3.2 `packages/lib/src/auth/flows.ts`

```ts
'use client';

import { authClient } from './client';

export type AuthFlowResult = { ok: true } | { ok: false; error: string };
export type SignUpInput = { email: string; password: string; name: string };
export type SignInInput = { email: string; password: string };
export type RequestPasswordResetInput = { email: string };
export type ConfirmPasswordResetInput = { token: string; newPassword: string };
export type VerifyEmailInput = { token: string };

export function useAuthFlows() {
  const signUp = async (input: SignUpInput): Promise<AuthFlowResult> => {
    try {
      const { error } = await authClient.signUp.email({ ...input, callbackURL: '/account' });
      return error ? { ok: false, error: humanizeError(error) } : { ok: true };
    } catch (e) { return { ok: false, error: humanizeError(e) }; }
  };

  const signIn = async (input: SignInInput): Promise<AuthFlowResult> => {
    try {
      const { error } = await authClient.signIn.email({ ...input, callbackURL: '/account' });
      return error ? { ok: false, error: humanizeError(error) } : { ok: true };
    } catch (e) { return { ok: false, error: humanizeError(e) }; }
  };

  const signOut = async (): Promise<AuthFlowResult> => {
    try { await authClient.signOut(); return { ok: true }; }
    catch (e) { return { ok: false, error: humanizeError(e) }; }
  };

  const requestPasswordReset = async (input: RequestPasswordResetInput): Promise<AuthFlowResult> => {
    try {
      const { error } = await authClient.requestPasswordReset({
        email: input.email,
        redirectTo: '/auth/reset-password',
      });
      return error ? { ok: false, error: humanizeError(error) } : { ok: true };
    } catch (e) { return { ok: false, error: humanizeError(e) }; }
  };

  const confirmPasswordReset = async (input: ConfirmPasswordResetInput): Promise<AuthFlowResult> => {
    try {
      const { error } = await authClient.resetPassword({ newPassword: input.newPassword, token: input.token });
      return error ? { ok: false, error: humanizeError(error) } : { ok: true };
    } catch (e) { return { ok: false, error: humanizeError(e) }; }
  };

  const verifyEmail = async (input: VerifyEmailInput): Promise<AuthFlowResult> => {
    try {
      const { error } = await authClient.verifyEmail({ query: { token: input.token } });
      return error ? { ok: false, error: humanizeError(error) } : { ok: true };
    } catch (e) { return { ok: false, error: humanizeError(e) }; }
  };

  return { signUp, signIn, signOut, requestPasswordReset, confirmPasswordReset, verifyEmail };
}

export function humanizeError(e: unknown): string {
  if (typeof e === 'object' && e !== null) {
    const code = (e as { code?: string }).code;
    if (code) {
      switch (code) {
        case 'USER_ALREADY_EXISTS': return 'auth.errorUserExists';
        case 'INVALID_EMAIL_OR_PASSWORD':
        case 'INVALID_EMAIL': return 'auth.errorInvalidCredentials';
        case 'EMAIL_NOT_VERIFIED': return 'auth.errorEmailNotVerified';
        case 'PASSWORD_TOO_SHORT':
        case 'PASSWORD_TOO_LONG': return 'auth.errorWeakPassword';
        case 'INVALID_TOKEN': return 'auth.errorInvalidCode';
        case 'RATE_LIMITED': return 'auth.errorRateLimited';
        default: break;
      }
    }
    if ('message' in e && typeof e.message === 'string') {
      const msg = e.message.toLowerCase();
      if (msg.includes('invalid')) return 'auth.errorInvalidCredentials';
      if (msg.includes('exists')) return 'auth.errorUserExists';
      if (msg.includes('verify')) return 'auth.errorEmailNotVerified';
      if (msg.includes('weak') || msg.includes('password')) return 'auth.errorWeakPassword';
    }
  }
  return 'auth.errorGeneric';
}
```

i18n keys: all but `auth.errorRateLimited` exist in `packages/lib/src/locales/en.json`. `auth.errorRateLimited` is added in this PR (one line). `humanizeError` is exported (not private) so the test in §3.13 can target it.

**Behavior change to flag:** `VerifyEmailInput` and `ConfirmPasswordResetInput` swap from `{ email, code }` / `{ email, code, newPassword }` (legacy Convex Auth shape) to `{ token }` / `{ token, newPassword }` (BA shape). The verify-email and reset-password forms are updated in §3.11 to match.

### 3.3 `packages/lib/src/auth/use-auth.ts`

```ts
'use client';

import { useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import { isAdminRole } from '../auth';
import { useSession } from './client';
import { useAuthFlows } from './flows';

export function useAuth() {
  const { data: session, isPending } = useSession();
  const isAuthenticated = Boolean(session);
  const user = useQuery(api.users.getMe, isAuthenticated ? {} : 'skip');
  const flows = useAuthFlows();
  return {
    user: user ?? null,
    isAuthenticated,
    isLoading: isPending || (isAuthenticated && user === undefined),
    isAdmin: isAdminRole(user?.role ?? null),
    ...flows,
  };
}
```

`isAdminRole` is the existing helper from `packages/lib/src/auth.ts` — reuse it (NEVER DO #14 spirit).

### 3.4 `packages/lib/src/auth/server.ts`

```ts
import 'server-only';

import { api } from '@workspace/convex/_generated/api';
import { convexBetterAuthNextJs } from '@convex-dev/better-auth/nextjs';

import { type CurrentUser, type UserRole } from '../auth';

function assertEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

const { handler, isAuthenticated, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction, preloadAuthQuery } =
  convexBetterAuthNextJs({
    convexUrl: assertEnv('NEXT_PUBLIC_CONVEX_URL', process.env.NEXT_PUBLIC_CONVEX_URL),
    convexSiteUrl: assertEnv('NEXT_PUBLIC_CONVEX_SITE_URL', process.env.NEXT_PUBLIC_CONVEX_SITE_URL),
  });

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getToken();
  if (!token) return null;
  try { return (await fetchAuthQuery(api.users.getMe)) ?? null; } catch { return null; }
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  return (await getCurrentUser())?.role ?? null;
}

export async function isAuthenticatedUserAdmin(): Promise<boolean> {
  return isAdminRole(await getCurrentUserRole());
}

export async function getUserRoleFromToken(token: string): Promise<UserRole | null> {
  try { return ((await fetchAuthQuery(api.users.getMe))?.role) ?? null; }
  catch { return null; }
}

export async function checkAuthenticated(): Promise<boolean> {
  return isAuthenticated();
}

export { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction, preloadAuthQuery };
```

`fetchAuthQuery(query)` takes only `(query, ...args)` — the library injects the token via its internal `client.setAuth(token)` call; passing a `{ token }` arg is a no-op (and was misleading). `api.users.getMe` comes from the generated `_generated/api` — no `makeFunctionReference` cast required (the prior draft's `Record<string, unknown>` generic failed TS strict mode + didn't match `getMe`'s return shape).

`assertEnv` only checks presence. The library separately throws if `NEXT_PUBLIC_CONVEX_SITE_URL` ends in `.convex.cloud` — that's a different check, not duplicated.

### 3.5 `packages/lib/src/providers/convex.tsx`

```tsx
'use client';

import { type ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { authClient } from '@workspace/lib/auth/client';

const PLACEHOLDER_CONVEX_URL = 'https://unconfigured-khit-000.convex.cloud';
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? PLACEHOLDER_CONVEX_URL;
const convex = new ConvexReactClient(convexUrl);

export function ConvexProvider({
  children,
  initialToken,
}: {
  children: ReactNode;
  initialToken?: string | null;
}) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient} initialToken={initialToken ?? null}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
```

`'use client'` is preserved — `ConvexBetterAuthProvider` is a client component. `authClient` is a stable module-level singleton.

### 3.6 `apps/{storefront,admin}/app/api/auth/[...all]/route.ts` (NEW, both apps)

```ts
import { handler } from '@/lib/auth-server';

export const { GET, POST } = handler;
```

### 3.7 `apps/{storefront,admin}/lib/auth-server.ts` (NEW, both apps — root `lib/`, not `app/lib/`)

```ts
export { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction, preloadAuthQuery } from '@workspace/lib/auth/server';
```

Note: `isAuthenticated` is not re-exported — it's only used internally by `checkAuthenticated` in `packages/lib/src/auth/server.ts`. The `proxy.ts` rewrites call `getToken` directly, which is sufficient.

### 3.8 `apps/storefront/proxy.ts` (REWRITE)

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from '@/lib/auth-server';

function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (value.startsWith('/auth/')) return null;
  return value;
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/auth/login', request.url);
  const next = safeNextPath(request.nextUrl.searchParams.get('next'));
  if (next) loginUrl.searchParams.set('next', next);
  const res = NextResponse.redirect(loginUrl);
  // Clear the legacy Convex Auth cookie so signed-out users with stale
  // cookies don't see flicker on the first request after deploy.
  res.cookies.delete('__convexAuth');
  return res;
}

export async function proxy(request: NextRequest) {
  const token = await getToken();
  if (token) return NextResponse.next();
  return redirectToLogin(request);
}

export const config = { matcher: ['/account/:path*'] };
```

### 3.9 `apps/admin/proxy.ts` (REWRITE)

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { getToken, getUserRoleFromToken } from '@/lib/auth-server';
import { isAdminRole } from '@workspace/lib/auth';

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000';

function redirectToStorefrontLogin(): NextResponse {
  const res = NextResponse.redirect(new URL('/auth/login', STOREFRONT_URL));
  res.cookies.delete('__convexAuth');
  return res;
}

export async function proxy(_request: NextRequest) {
  const token = await getToken();
  if (!token) return redirectToStorefrontLogin();
  const role = await getUserRoleFromToken(token);
  if (!isAdminRole(role)) return redirectToStorefrontLogin();
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'] };
```

`getToken` and `getUserRoleFromToken` are pulled from the app-local shim for consistency; both go through the same code path as the storefront.

### 3.10 `apps/{storefront,admin}/app/layout.tsx` (UPDATE, both apps)

```tsx
import { getToken } from '@/lib/auth-server';
// ...
const token = await getToken();
return <ConvexProvider initialToken={token}>{children}</ConvexProvider>;
```

### 3.11 Five files using `useConvexAuth` (or the legacy email/code form)

| File | Line(s) | Change |
|---|---|---|
| `apps/storefront/app/auth/verify/verify-email-flow.tsx` | `:5, :16` | Drop `useConvexAuth` from `@convex-dev/auth/react`; use `useAuth()` from `@workspace/lib/auth/use-auth`. Read `?token=` from search params (not `?email=`). On success, `router.replace(searchParams.get('next') ?? '/account')`. |
| `apps/storefront/components/storefront/auth/register-form.tsx` | `:16, :50` | Drop `useConvexAuth`; `useAuth().isLoading` is sufficient. |
| `apps/storefront/components/storefront/auth/verify-email-form.tsx` | full file | Replace the code-entry form with a "click the link in your email" interstitial. The form is no longer the verification surface — BA verifies via the link. |
| `apps/storefront/components/storefront/auth/forgot-password-form.tsx` | full file | Flow body unchanged; the surface is `requestPasswordReset({ email })` instead of `signIn('password', { flow: 'reset' })`. |
| `apps/storefront/components/storefront/auth/reset-password-form.tsx` | full file | Read `?token=` from search params; submit `confirmPasswordReset({ token, newPassword })`. |
| `packages/lib/src/cart/merge.ts` | `:8, :71, :120` | Drop `useConvexAuth` import; use `useAuth()` from `./auth/use-auth` for `isAuthenticated` / `isLoading`. |
| `packages/lib/src/wishlist.ts` | `:7, :198, :288` | Same as `cart/merge.ts`. |
| `apps/storefront/components/storefront/cart-drawer.tsx` | `:15, :49` | NO-OP — `useIsAuthenticated` from the new `client.ts` keeps the same export. |

### 3.12 Env vars

`.env.example` (root):
- **remove** `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`
- **add** `BETTER_AUTH_SECRET=` (with comment `# generated: openssl rand -base64 32`), `NEXT_PUBLIC_CONVEX_SITE_URL=https://zealous-poodle-544.convex.site`, `NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3000`, `RESEND_API_KEY=`, `RESEND_FROM_EMAIL=`

`SITE_URL` is **not** added to `.env.example` — it's a Convex deployment env (read by `packages/convex/betterAuth/auth.ts:29`), not an app env. Setting it in app `.env.local` would mislead.

`apps/storefront/.env.local` + `apps/admin/.env.local`:
- **remove** `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`
- **add** `NEXT_PUBLIC_CONVEX_SITE_URL=https://zealous-poodle-544.convex.site`
- (`NEXT_PUBLIC_CONVEX_URL` stays put.)

Deployment envs (set on `dev:zealous-poodle-544` via `bunx convex env set`, not in any `.env`):
```
bunx convex env set BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
bunx convex env set SITE_URL=http://localhost:3000
bunx convex env set RESEND_API_KEY=...      # from existing .env.local
bunx convex env set RESEND_FROM_EMAIL=...   # from existing .env.local
```

`SITE_URL` holds the storefront URL; the admin app at `:3001` is covered by the `trustedOrigins` list in `packages/convex/betterAuth/auth.ts:55-59` (which already includes `NEXT_PUBLIC_ADMIN_URL`). After this PR, verify that list includes both `http://localhost:3000` and `http://localhost:3001`; add them if missing.

`$(openssl ...)` is host-shell expansion; `bunx` receives the literal value. `openssl rand -base64 32` produces no whitespace, so quoting is optional but safe.

### 3.13 Tests

`packages/lib/src/auth/__tests__/humanizeError.test.ts` (NEW, vitest):
- Table-driven: each BA error code → expected i18n key.
- Cover both branches: `{ code: 'RATE_LIMITED' }` (code-matching) and `new Error('invalid email or password')` (substring fallthrough).
- Cover the `unknown`/non-object fallthrough → `'auth.errorGeneric'`.
- Import `humanizeError` from `@workspace/lib/auth/flows` (exported in §3.2).

**No `auth.signup.test.ts`.** The Convex BA component is a Convex component, and `convex-test` does not host Convex components — it only handles plain Convex tables. Bootstrapping the BA component inside `convex-test` requires `@convex-dev/better-auth`'s test fixtures (which don't ship as a public helper) plus a `__tests__/setup.ts` for env defaults. Defer the Convex-side test to Phase 8; track in `.agents/plan/phase-8-followups.md` (or inline here in §6).

`packages/convex/__tests__/orders.*.test.ts` should pass unchanged after the import rewrites (no auth interactions in those tests).

### 3.14 Doc updates (lockstep with code)

`AGENTS.md:49` — replace the auth line with:
```
- Auth: Convex + Better Auth (`@convex-dev/better-auth` + `better-auth`) with `customer`, `admin`, and `super-admin` roles
```
`AGENTS.md:99` — replace the PII rule's "Convex Auth" with "Better Auth".
`PRD.md:54` — same Tech Stack table swap.
`PROMPT.md:22` — same.
`docs/operations/production-admin-seed.md` — drop every reference to `authAccounts`, `JWT_PRIVATE_KEY`, `signIn('password', { flow: 'signUp' })`; document the new flow (`auth.api.signUpEmail` → `users.upsertFromBetterAuth`).
`docs/operations/backup-and-export.md` — replace `authTables` references with the BA internal tables (`user`, `session`, `account`, `verification`, `jwks`, `rateLimit`, `twoFactor`); update the recovery procedure.
`docs/operations/production-deploy.md` — replace `CONVEX_AUTH_PRIVATE_KEY` / `CONVEX_AUTH_ADAPTER_SECRET` with `BETTER_AUTH_SECRET` in the seed env block.

---

## 4. Implementation order

Each step ends with the listed exit gate. Steps run sequentially; within a step, sub-agents run in parallel.

1. **Cleanup + env** — single sub-agent, mid-tier model. **Work:** remove `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` from `.env.example` and `.env.local` files (no secret values in diff). Add `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_CONVEX_SITE_URL`, `NEXT_PUBLIC_STOREFRONT_URL`, `RESEND_*`. `bunx convex env set BETTER_AUTH_SECRET="$(openssl rand -base64 32)"` and the other deployment envs on `dev:zealous-poodle-544`. **Exit gate:** `bunx convex dev --once` pushes the new env; `curl -i https://zealous-poodle-544.convex.site/api/auth/get-session` returns 200 (with `{ user: null }`) or 401 — NOT 404.

2. **Shared lib rewrite** — single sub-agent, premium model. **Work:** rewrite `packages/lib/src/auth/{client,flows,use-auth,server}.ts` and `packages/lib/src/providers/convex.tsx`; rewrite `packages/lib/src/cart/merge.ts` and `packages/lib/src/wishlist.ts`; add `auth.errorRateLimited` to `packages/lib/src/locales/en.json`. **Exit gate:** `bun run --filter @workspace/lib typecheck && bun run --filter @workspace/lib lint && bun run --filter @workspace/lib build && bun run format:check`.

3. **Apps rewrite (parallel)** — two sub-agents (one per app), premium model. **Depends on:** step 2's `use-auth.ts` / `server.ts` rewrite landing first. **Work per sub-agent:** add `lib/auth-server.ts` (root, not `app/lib/`), add `app/api/auth/[...all]/route.ts`, rewrite `proxy.ts`, update `app/layout.tsx` to pass `initialToken`, patch the auth flow components per §3.11. **Exit gate per sub-agent:** `bun run --filter @workspace/<app> typecheck && bun run --filter @workspace/<app> lint && bun run --filter @workspace/<app> build`.

4. **Docs sync** — single sub-agent, mid-tier model. **Work:** update the 6 docs in §3.14. **Exit gate:** `bun run format:check` + visual diff of each doc.

5. **Tests** — single sub-agent, premium model. **Work:** write `packages/lib/src/auth/__tests__/humanizeError.test.ts` per §3.13. **Exit gate:** `bun run test:convex && bun run test`.

6. **Smoke verification** — coordinator (me). **Work:** `bun run seed`, boot both apps, sign in at `:3000/auth/login`, sign up at `:3000/auth/register`, click the verification link, visit `:3001/admin`, confirm signed-out visit to `:3001/admin` redirects. **Exit gate:** all four manual checks pass.

7. **Graph update** — single sub-agent, mid-tier model. **Work:** `graphify update .` from repo root, commit if dirty. **Exit gate:** `git status` shows no uncommitted `graphify-out/*` changes.

8. **CodeRabbit + PR** — coordinator. **Work:** push the branch, open the PR against `develop`, wait for CodeRabbit, resolve critical-severity findings. **Exit gate:** CodeRabbit approval with no critical-severity issues (AGENTS.md line 102).

Sub-agents must NOT hand-edit `packages/convex/_generated/*` (auto-generated by `bunx convex dev`). If a sub-agent needs a regenerated type, run `bunx convex dev --once` and commit the result as part of the same PR.

---

## 5. Risks & mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | `bunx convex dev` OOMs the 64 MB isolate bundling `better-auth` | Trigger: `JavaScript heap out of memory` or exit code 137. Swap one line in `packages/convex/http.ts:5` to `authComponent.registerRoutesLazy(http, createAuth, { basePath: '/api/auth', cors: { credentials: true }, trustedOrigins })`. Add a `ponytail:` comment naming the trigger. |
| 2 | `authClient.useSession()` returns `isPending: true` on first render | `useAuth().isLoading = isPending || (isAuthenticated && user === undefined)`. Matches the existing `isLoading` shape consumed by `apps/admin/users-table-client.tsx:38` and `header.tsx:50`. |
| 3 | `humanizeError` substring fallback misses new BA error codes | Switch to `error.code` matching where BA provides a code; substring fallback otherwise. Add a new i18n key per case (only `auth.errorRateLimited` ships in this PR). |
| 4 | Race between BA signup and the `users` row insert in seed | Seed pattern stays: `auth.api.signUpEmail` → `users.upsertFromBetterAuth`. Customer signups via `authClient.signUp.email` create the `users` row lazily on first `getMe`. Documented in `docs/operations/production-admin-seed.md`. Triggers API is intentionally out of scope. |
| 5 | Stale `__convexAuth` cookie in browsers after deploy | `apps/storefront/proxy.ts:14-19` and `apps/admin/proxy.ts:8-12` delete the legacy cookie on the first redirect. |
| 6 | `BETTER_AUTH_SECRET` / `NEXT_PUBLIC_CONVEX_SITE_URL` missing on app boot | `assertEnv` in `packages/lib/src/auth/server.ts:9-12` throws on import with a clear message. No silent fallback. |
| 7 | Re-running `bun run seed` triggers BA's `signUpEmail` rate limit | Seed action already handles failure (logs + returns `{ created: false, reason }`); if rate-limited, wait 60 s and re-run, or pre-promote via `users.setRole` on the existing user. |
| 8 | TS strict mode rejects a generic `Record<string, unknown>` for `makeFunctionReference` args | Use `api.users.getMe` from `packages/convex/_generated/api` (already typed by codegen) — no manual cast. |
| 9 | `convexBetterAuthNextJs` requires `NEXT_PUBLIC_CONVEX_SITE_URL` to end in `.convex.site` | Already enforced by the library (`dist/nextjs/index.js:10-25`). `assertEnv` only checks presence. |
| 10 | `apps/storefront/components/storefront/auth/register-form.tsx` still imports `useConvexAuth` from the new `client.ts` | The new `client.ts` no longer exports `useConvexAuth`; sub-agent must rewrite to `useAuth()`. `bun run build` on the storefront flags the import error if it slips. |
| 11 | `SITE_URL` set on the Convex deployment can only hold one value (admin app is on a different port) | `SITE_URL=http://localhost:3000` (storefront). Admin is covered by `trustedOrigins` in `packages/convex/betterAuth/auth.ts:55-59`, which already lists `NEXT_PUBLIC_ADMIN_URL`. Verify both `http://localhost:3000` and `http://localhost:3001` are in the list after this PR. |
| 12 | Rollback after merge | Tag the merge commit. `git revert` of the merge restores every changed file to pre-migration. Convex schema is forward-only — after revert, run `bunx convex dev --once` to push the previous `auth.config.ts` (which still used `getAuthConfigProvider()` for BA — so forward-compatible). The legacy Convex Auth seed is not preserved on disk; pre-Phase-6 commit in `git log` is the archive. See §9. |

---

## 6. Out of scope

- Design tokens, MMK formatting, theme provider, RTL config.
- `colorVariants` / product / cart / order / wishlist schema.
- Social / 2FA / magic-link / org BA plugins.
- Production deployment (only `dev:zealous-poodle-544`).
- Orphan Convex Auth `users` rows in dev (harmless — never queried).
- `authComponent.registerRoutesLazy` unless `bunx convex dev` OOMs (see §5 #1).
- `authComponent.triggers.user.onCreate` (revisit in Phase 8 if a race surfaces).
- `packages/convex/__tests__/auth.signup.test.ts` (Convex BA + `convex-test` not compatible; defer to Phase 8).
- `packages/convex/seedInternal.ts` doc-comment cleanup (mention of "Convex Auth migration" — non-user-facing, can wait).

---

## 7. Verification plan

Each gate runs in order; a failure blocks the next step.

1. `bun run format:check` — passes.
2. `bun run lint` — passes for both apps and shared packages.
3. `bun run typecheck` — passes for both apps and shared packages.
4. `bun run build` — passes for both apps and shared packages.
5. `bunx convex dev --once` — pushes current Convex state; codegen diff (if any) committed.
6. `bun run test:convex` — passes (zero new failures vs `develop` baseline).
7. `bun run test` — passes, including the new `humanizeError.test.ts`.
8. `bun run seed` — `zweaungnaing.info@gmail.com` is reseeded as `super-admin`.
9. `bun run dev` (background) + `curl -fsS http://localhost:3000/` and `http://localhost:3001/` both return 200.
10. Manual smoke (per `docs/operations/production-admin-seed.md`):
    - `http://localhost:3000/auth/login` with seeded credentials → `/account`.
    - `http://localhost:3000/auth/register` for a new customer → verification email sent (or "Resend not configured" banner).
    - Click the verification link in the email → `authClient.verifyEmail` resolves; redirect to `/account`.
    - `http://localhost:3000/auth/forgot-password` → email with `?token=…` link arrives.
    - Click the link → `http://localhost:3000/auth/reset-password?token=…` → set new password → redirect to `/auth/login`.
    - `http://localhost:3001/admin` with admin user → dashboard.
    - `http://localhost:3001/admin` signed out → redirects to storefront login.
11. CodeRabbit on the PR — no new critical-severity findings (AGENTS.md line 102).
12. `graphify update .` — committed if dirty.

---

## 8. Decisions (locked in this revision)

1. **Eager `registerRoutes`, lazy as fallback** — only swap to `registerRoutesLazy` on the concrete OOM trigger in §5 #1.
2. **No `adapter.ts`** — YAGNI; `authComponent.safeGetAuthUser(ctx)` covers the current code.
3. **Keep `users` table name** — adds `betterAuthUserId` join field; don't rename to `userProfiles`.
4. **Drop `auth.signup.test.ts`** — `convex-test` doesn't host Convex components. Defer to Phase 8.
5. **Reuse `isAdminRole` helper** — in `useAuth().isAdmin` and the admin proxy.
6. **Use `app/lib/` → no, use `lib/`** — both apps' `tsconfig.json` `@/*` resolves to app root, not `app/`. The shim lives at `apps/{x}/lib/auth-server.ts`.
7. **Drop the `useSession` re-export consideration** — kept (harmless, future-proofs BA-style consumers).
8. **Verify-email form changes** — from `{ email, code }` to `{ token }` (BA's GET `/verify-email?token=` shape). Forms are updated in lockstep in §3.11.
9. **Cookie cleanup in proxies** — `__convexAuth` is deleted on the first redirect; no separate "cleanup PR" needed.
10. **Scope: `dev:zealous-poodle-544` only** — no production deploy changes.

---

## 9. Rollback plan

1. `git revert` of the merge commit restores every changed file: `packages/lib/src/auth/*`, `packages/lib/src/{cart/merge,wishlist,providers,locales/en.json}/*.ts(x)`, both `proxy.ts`, both `app/layout.tsx`, both `app/api/auth/[...all]/route.ts`, both `lib/auth-server.ts`, the 5 patched auth flow files, `.env.example`, `humanizeError.test.ts`, and the 6 docs.
2. Convex-side changes (`packages/convex/auth.config.ts`, `http.ts`, `betterAuth/*`, `users.ts`, `schema.ts`, `authHelpers.ts`, `seed.ts`) are forward-only — `git revert` does not rewind the cloud schema. To roll those back: `git checkout <pre-Phase-6-sha> -- packages/convex/auth.config.ts packages/convex/http.ts packages/convex/users.ts packages/convex/authHelpers.ts packages/convex/seed.ts packages/convex/schema.ts packages/convex/betterAuth` and re-deploy via `bunx convex dev --once`. The pre-Phase-6 commit hash is in the `git log` on `develop` (before this branch was cut).
3. Re-seed via `bun run seed` — creates a new `super-admin` user via the new path; orphan Convex Auth `users` rows are silently ignored.
4. Browsers still holding a `__convexAuth` cookie will see one stale 401 on the first request after revert; the cookie-clearing branch in `proxy.ts` deletes it on the first redirect (or the user can hard-refresh).
5. **Truly destructive action to avoid:** editing `packages/convex/schema.ts` to remove the `users` table or drop the `betterAuthUserId` index without first dumping a backup. The new `users` table is the only join surface between the BA `user` table and our cart/wishlist/order tables; dropping it breaks every order query.

---

## 10. Commit & PR template

### Branch
`feature/finish-better-auth-migration` (no issue number — the repo has no Linear/GitHub Issues setup; if/when one is filed, rename to `feature/#<n>-finish-better-auth-migration` per AGENTS.md §Workflow).

### Commit message
```
feat(auth): finish Convex + Better Auth migration

Swap legacy @convex-dev/auth for @convex-dev/better-auth in
packages/lib and both apps. Convex side was already in place; this
lands the remaining 12 items (lib rewrite, app proxies, route
handlers, env vars, doc updates, one lib test).
```

Format follows AGENTS.md §Workflow: `<type>: #<issue> — <summary>`. With no issue number, the format is `<type>: <summary>`.

### PR body
```markdown
## Summary
Finishes the Convex + Better Auth migration that was started in Phase 0–6.
The Convex side is already wired (auth.config.ts, http.ts, betterAuth/*,
schema, seed). This PR lands the remaining 12 items in packages/lib,
both apps, the env files, and the docs.

## What changed
- packages/lib: rewrote auth/{client,flows,use-auth,server}.ts,
  providers/convex.tsx; patched cart/merge.ts and wishlist.ts; added
  auth.errorRateLimited i18n key.
- apps/{storefront,admin}: added lib/auth-server.ts (root, not app/lib/),
  app/api/auth/[...all]/route.ts; rewrote proxy.ts; updated
  app/layout.tsx to pass initialToken; patched 5 auth-flow components.
- Env: removed JWT_PRIVATE_KEY/JWT_PUBLIC_KEY; added BETTER_AUTH_SECRET,
  SITE_URL, NEXT_PUBLIC_CONVEX_SITE_URL, NEXT_PUBLIC_STOREFRONT_URL,
  RESEND_* to the right scopes (Convex deployment vs app .env.local).
- Docs: AGENTS.md, PRD.md, PROMPT.md, docs/operations/{production-admin-seed,
  backup-and-export,production-deploy}.md all updated for the BA stack.

## How to verify
- bun run format:check && bun run lint && bun run typecheck && bun run build
- bun run test:convex && bun run test
- bun run seed
- Manual smoke per phase-7-plan.md §7 step 10.

## Risk
- 12-row risk table in phase-7-plan.md §5. Highest-impact: OOM on
  bunx convex dev (mitigation: swap to registerRoutesLazy; concrete
  trigger documented).

## Rollback
Single git revert + bunx convex dev --once against the pre-Phase-6
commit's Convex files. Full steps in phase-7-plan.md §9.

## Out of scope
- No new social/2FA/magic-link/org plugins.
- No production deploy (dev:zealous-poodle-544 only).
- No Convex schema changes; no product/cart/order/wishlist schema changes.
- No auth.signup.test.ts (deferred to Phase 8 — convex-test doesn't
  host Convex components).
```
