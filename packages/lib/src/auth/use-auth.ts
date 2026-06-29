'use client';

import { useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import { isAdminRole } from '../auth';
import { useSession } from './client';
import { useAuthFlows } from './flows';

export function useAuth() {
  const { data: session, isPending } = useSession();
  const isAuthenticated = Boolean(session);
  const user = useQuery(api.users.getMe, isAuthenticated ? {} : 'skip');
  const flows = useAuthFlows();
  return {
    user: user ?? null,
    isAuthenticated,
    isLoading: isPending || (isAuthenticated && user === undefined),
    isAdmin: isAdminRole(user?.role ?? null),
    ...flows,
  };
}
