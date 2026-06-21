import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server';

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await convexAuth.isAuthenticated();

  if (!isAuthenticated) {
    return nextjsMiddlewareRedirect(request, '/auth/login');
  }
});

export const config = {
  matcher: ['/account/:path*'],
};
