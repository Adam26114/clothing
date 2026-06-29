import * as Sentry from '@sentry/browser';

const dsn = process.env.SENTRY_DSN;
const environment = process.env.CONVEX_DEPLOY_TYPE === 'production' ? 'production' : 'development';

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0.1,
  });
}

export { Sentry };
