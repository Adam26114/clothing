'use client';

import { useConvexAuth } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import { useAuthFlows } from './flows';

export function useAuth() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.users.getMe, isAuthenticated ? {} : 'skip');
  const flows = useAuthFlows();
  return {
    user: user ?? null,
    isAuthenticated,
    isLoading: authLoading || (isAuthenticated && user === undefined),
    isAdmin: user?.role === 'admin' || user?.role === 'super-admin',
    ...flows,
  };
}
