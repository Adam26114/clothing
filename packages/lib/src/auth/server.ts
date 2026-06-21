import 'server-only';

import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { convexAuthNextjsToken, isAuthenticatedNextjs } from '@convex-dev/auth/nextjs/server';

import { type CurrentUser, type UserRole, isAdminRole } from '../auth';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

const GET_ME_REF = makeFunctionReference<'query', Record<string, unknown>, CurrentUser | null>(
  'users/getMe'
);

function createClient(token: string, convexUrl: string): ConvexHttpClient {
  const client = new ConvexHttpClient(convexUrl);
  client.setAuth(token);
  return client;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!CONVEX_URL) {
    return null;
  }

  const token = await convexAuthNextjsToken();
  if (!token) {
    return null;
  }

  try {
    const client = createClient(token, CONVEX_URL);
    return await client.query(GET_ME_REF, {});
  } catch {
    return null;
  }
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

export async function isAuthenticatedUserAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return isAdminRole(role);
}

export async function getUserRoleFromToken(
  token: string,
  convexUrl = CONVEX_URL
): Promise<UserRole | null> {
  if (!convexUrl) {
    return null;
  }

  try {
    const client = createClient(token, convexUrl);
    const user = await client.query(GET_ME_REF, {});
    return user?.role ?? null;
  } catch {
    return null;
  }
}

export async function checkAuthenticated(): Promise<boolean> {
  return isAuthenticatedNextjs();
}
