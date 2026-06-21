import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server';

import { isAdminRole } from '@workspace/lib/auth';
import { getUserRoleFromToken } from '@workspace/lib/auth/server';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000';

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const token = await convexAuth.getToken();

  if (!token || !CONVEX_URL) {
    return nextjsMiddlewareRedirect(request, `${STOREFRONT_URL}/auth/login`);
  }

  const role = await getUserRoleFromToken(token, CONVEX_URL);

  if (!isAdminRole(role)) {
    return nextjsMiddlewareRedirect(request, `${STOREFRONT_URL}/auth/login`);
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
