'use client';

import { useConvexAuth, useAuthActions } from '@convex-dev/auth/react';

export { useConvexAuth, useAuthActions };

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useConvexAuth();
  return isAuthenticated;
}
