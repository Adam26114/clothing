import { NextResponse } from 'next/server';
import { getToken, getUserRoleFromToken } from '@/lib/auth-server';
import { isAdminRole } from '@workspace/lib/auth';

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000';

function redirectToStorefrontLogin(): NextResponse {
  const res = NextResponse.redirect(new URL('/auth/login', STOREFRONT_URL));
  res.cookies.delete('__convexAuth');
  return res;
}

export async function proxy() {
  const token = await getToken();
  if (!token) return redirectToStorefrontLogin();
  const role = await getUserRoleFromToken(token);
  if (!isAdminRole(role)) return redirectToStorefrontLogin();
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'] };
