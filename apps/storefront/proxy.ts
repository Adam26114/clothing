import { NextResponse } from 'next/server';
import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server';

function safeNextPath(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (!value.startsWith('/') || value.startsWith('//')) {
    return null;
  }
  if (value.startsWith('/auth/')) {
    return null;
  }
  return value;
}

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await convexAuth.isAuthenticated();

  if (isAuthenticated) {
    return;
  }

  const next = safeNextPath(request.nextUrl.searchParams.get('next'));
  const loginUrl = new URL('/auth/login', request.url);
  if (next) {
    loginUrl.searchParams.set('next', next);
  }
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ['/account/:path*'],
};
