'use client';

import { type ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider as ConvexAuthCoreProvider } from '@convex-dev/auth/react';

const PLACEHOLDER_CONVEX_URL = 'https://unconfigured-khit-000.convex.cloud';
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? PLACEHOLDER_CONVEX_URL;
const convex = new ConvexReactClient(convexUrl);

export function ConvexProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthCoreProvider client={convex}>{children}</ConvexAuthCoreProvider>;
}
