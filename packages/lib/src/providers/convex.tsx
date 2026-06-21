'use client';

import { type ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthNextjsProvider } from '@convex-dev/auth/nextjs';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return children;
  }

  return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>;
}
