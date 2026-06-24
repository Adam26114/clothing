import path from 'node:path';

import type { NextConfig } from 'next';

import { Sentry } from '@workspace/lib/sentry';

const nextConfig: NextConfig = {
  transpilePackages: ['@workspace/ui', '@workspace/lib', '@workspace/convex'],
  turbopack: {
    root: path.resolve(import.meta.dirname, '../..'),
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.convex.cloud' },
      { protocol: 'https', hostname: '**.convex.services' },
    ],
  },
};

const sentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  release: {
    name: process.env.SENTRY_RELEASE,
  },
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? process.env.VERCEL_ENV ?? 'development',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  tunnelRoute: '/sentry-tunnel',
};

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? Sentry.withSentryConfig(nextConfig, sentryBuildOptions)
  : nextConfig;
