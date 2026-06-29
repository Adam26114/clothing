'use client';

import { type ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexBetterAuthProvider, type AuthClient } from '@convex-dev/better-auth/react';
import { authClient } from '@workspace/lib/auth/client';

const PLACEHOLDER_CONVEX_URL = 'https://unconfigured-khit-000.convex.cloud';
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? PLACEHOLDER_CONVEX_URL;
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
      initialToken={initialToken ?? null}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
