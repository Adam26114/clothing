import { NextResponse } from 'next/server';
import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server';

import { isAdminRole } from '@workspace/lib/auth';
import { getUserRoleFromToken } from '@workspace/lib/auth/server';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000';

function redirectToStorefrontLogin(): NextResponse {
  return NextResponse.redirect(new URL('/auth/login', STOREFRONT_URL));
}

export default convexAuthNextjsMiddleware(async (_request, { convexAuth }) => {
  const token = await convexAuth.getToken();

  if (!token || !CONVEX_URL) {
    return redirectToStorefrontLogin();
  }

  const role = await getUserRoleFromToken(token, CONVEX_URL);

  if (!isAdminRole(role)) {
    return redirectToStorefrontLogin();
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
