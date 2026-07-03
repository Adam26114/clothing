'use client';

import { type ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexBetterAuthProvider, type AuthClient } from '@convex-dev/better-auth/react';
import { authClient } from '@workspace/lib/auth/client';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error('Missing env: NEXT_PUBLIC_CONVEX_URL');
}
const convex = new ConvexReactClient(convexUrl);

export function ConvexProvider({
  children,
  initialToken,
}: {
  children: ReactNode;
  initialToken?: string | null;
}) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient as unknown as AuthClient}
      initialToken={initialToken}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
