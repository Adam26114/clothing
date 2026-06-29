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
  // ponytail: clear the legacy Convex Auth cookie so signed-out users with
  // stale cookies don't see flicker on the first request after deploy.
  res.cookies.delete('__convexAuth');
  return res;
}

export async function proxy(request: NextRequest) {
  const token = await getToken();
  if (token) return NextResponse.next();
  return redirectToLogin(request);
}

export const config = { matcher: ['/account/:path*'] };
