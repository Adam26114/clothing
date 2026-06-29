'use client';

import { createAuthClient } from 'better-auth/react';
import { convexClient } from '@convex-dev/better-auth/client/plugins';

export const authClient = createAuthClient({ plugins: [convexClient()] });

// useSession lives on the BA auth client (nanostore-backed). Re-export so
// consumers don't import better-auth directly.
export const useSession = () => authClient.useSession();

export function useIsAuthenticated(): boolean {
  return Boolean(useSession().data);
}
