import 'server-only';

import type { FunctionReference } from 'convex/server';
import { api } from '@workspace/convex/_generated/api';
import { convexBetterAuthNextJs } from '@convex-dev/better-auth/nextjs';

import { type CurrentUser, type UserRole, isAdminRole } from '../auth';

function assertEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

type ConvexBetterAuthNextJs = {
  getToken: () => Promise<string | undefined>;
  handler: {
    GET: (request: Request) => Promise<Response>;
    POST: (request: Request) => Promise<Response>;
  };
  isAuthenticated: () => Promise<boolean>;
  fetchAuthQuery: <Q extends FunctionReference<'query'>>(
    query: Q,
    ...args: Q['_args'] extends Record<string, never> ? [] | [Q['_args']] : [Q['_args']]
  ) => Promise<unknown>;
  fetchAuthMutation: <M extends FunctionReference<'mutation'>>(
    mutation: M,
    ...args: M['_args'] extends Record<string, never> ? [] | [M['_args']] : [M['_args']]
  ) => Promise<unknown>;
  fetchAuthAction: <A extends FunctionReference<'action'>>(
    action: A,
    ...args: A['_args'] extends Record<string, never> ? [] | [A['_args']] : [A['_args']]
  ) => Promise<unknown>;
  preloadAuthQuery: <Q extends FunctionReference<'query'>>(
    query: Q,
    ...args: Q['_args'] extends Record<string, never> ? [] | [Q['_args']] : [Q['_args']]
  ) => Promise<unknown>;
};

const {
  handler,
  isAuthenticated,
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

export async function getCurrentUserRole(): Promise<UserRole | null> {
  return (await getCurrentUser())?.role ?? null;
}

export async function isAuthenticatedUserAdmin(): Promise<boolean> {
  return isAdminRole(await getCurrentUserRole());
}

export async function getUserRoleFromToken(token: string): Promise<UserRole | null> {
  try {
    return (
      ((await fetchAuthQuery(api.users.getMe)) as { role: UserRole } | null | undefined)?.role ??
      null
    );
  } catch {
    return null;
  }
}

export async function checkAuthenticated(): Promise<boolean> {
  return isAuthenticated();
}

export { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction, preloadAuthQuery };
