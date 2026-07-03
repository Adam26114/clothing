import 'server-only';

import type { FunctionReference } from 'convex/server';
import { api } from '@workspace/convex/_generated/api';
import { convexBetterAuthNextJs } from '@convex-dev/better-auth/nextjs';

import { type CurrentUser } from '../auth';

function assertEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

// The inferred type of convexBetterAuthNextJs references convex-helpers
// which isn't portable across typecheck contexts, so we re-state the shape
// we actually consume.
type ConvexBetterAuthNextJs = {
  handler: { GET: (req: Request) => Promise<Response>; POST: (req: Request) => Promise<Response> };
  getToken: () => Promise<string | undefined>;
  fetchAuthQuery: <Q extends FunctionReference<'query'>>(
    q: Q,
    ...a: Q['_args'] extends Record<string, never> ? [] | [Q['_args']] : [Q['_args']]
  ) => Promise<unknown>;
  fetchAuthMutation: <M extends FunctionReference<'mutation'>>(
    m: M,
    ...a: M['_args'] extends Record<string, never> ? [] | [M['_args']] : [M['_args']]
  ) => Promise<unknown>;
  fetchAuthAction: <A extends FunctionReference<'action'>>(
    a: A,
    ...args: A['_args'] extends Record<string, never> ? [] | [A['_args']] : [A['_args']]
  ) => Promise<unknown>;
  preloadAuthQuery: <Q extends FunctionReference<'query'>>(
    q: Q,
    ...a: Q['_args'] extends Record<string, never> ? [] | [Q['_args']] : [Q['_args']]
  ) => Promise<unknown>;
};

const {
  handler,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
  preloadAuthQuery,
}: ConvexBetterAuthNextJs = convexBetterAuthNextJs({
  convexUrl: assertEnv('NEXT_PUBLIC_CONVEX_URL', process.env.NEXT_PUBLIC_CONVEX_URL),
  convexSiteUrl: assertEnv('NEXT_PUBLIC_CONVEX_SITE_URL', process.env.NEXT_PUBLIC_CONVEX_SITE_URL),
});

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    return ((await fetchAuthQuery(api.users.getMe)) as CurrentUser | null | undefined) ?? null;
  } catch {
    return null;
  }
}

export { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction, preloadAuthQuery };
