import { NextResponse } from 'next/server';
import { getCurrentUser } from '@workspace/lib/auth/server';
import { isAdminRole } from '@workspace/lib/auth';

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000';

function redirectToStorefrontLogin(): NextResponse {
  const res = NextResponse.redirect(new URL('/auth/login', STOREFRONT_URL));
  res.cookies.delete('__convexAuth');
  return res;
}

export async function proxy() {
  const user = await getCurrentUser();
  if (!isAdminRole(user?.role)) return redirectToStorefrontLogin();
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'] };
