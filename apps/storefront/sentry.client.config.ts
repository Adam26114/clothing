import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    release: process.env.SENTRY_RELEASE,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? process.env.VERCEL_ENV ?? 'development',
    tunnel: '/sentry-tunnel',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    beforeSendTransaction(event) {
      if (event.transaction === '/sentry-tunnel') {
        return null;
      }
      return event;
    },
  });
}
