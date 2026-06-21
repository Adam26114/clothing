import path from 'node:path';

import type { NextConfig } from 'next';

import { Sentry } from '@workspace/lib/sentry';

const nextConfig: NextConfig = {
  transpilePackages: ['@workspace/ui'],
  turbopack: {
    root: path.resolve(import.meta.dirname, '../..'),
  },
};

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? Sentry.withSentryConfig(nextConfig)
  : nextConfig;
