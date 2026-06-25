# Sentry alerts

- **Status:** Active
- **Phase:** 4e (production hardening)
- **Source:** PRD §11.1 (Sentry integration), `phase-4-plan.md` §3.4e.2
- **Owner:** Release captain + on-call rotation

---

This document is the runbook for the Sentry alerts that the platform commits to. It is short on purpose: configure the alerts once, then refer back to the runbook when one fires.

The Sentry SDK is wired in both apps — `apps/storefront/sentry.{client,server,edge}.config.ts` and `apps/admin/sentry.{client,server,edge}.config.ts` — and source map upload runs from the CI step added in 4e.2. Convex exception capture is wired in `packages/convex/orders.ts`, `storage.ts`, and `users.ts` (also 4e.2).

## Required alerts

The PRD §11.1 contract. These four alerts must be live before the production deploy.

| #   | Name                           | Condition                                             | Threshold         | Channel                              |
| --- | ------------------------------ | ----------------------------------------------------- | ----------------- | ------------------------------------ |
| 1   | **New issue created**          | `level:error` first seen in the last 5 min            | any               | Slack `#alerts`                      |
| 2   | **Error rate spike**           | `events:error / events:total` over 5 min              | > 1%              | Slack `#alerts` + email to `admin@…` |
| 3   | **P0 regression**              | release error rate                                    | 2× 7-day baseline | PagerDuty / SMS                      |
| 4   | **Convex unhandled exception** | issue tagged `transaction:convex` or `source:backend` | any               | Slack `#backend`                     |

Adjust the project name in the conditions to `khit-storefront` and `khit-admin` as needed; both projects share the same Sentry org and on-call rotation.

## Recommended alert rules

These are not PRD-mandated but are good defaults — add them in the same Sentry UI session.

| Name                        | Condition                                        | Threshold             | Channel                            |
| --------------------------- | ------------------------------------------------ | --------------------- | ---------------------------------- |
| **Sustained 5xx**           | HTTP 5xx on `/api/**` or `/admin/**`             | > 10 in 5 min         | Slack `#alerts`                    |
| **Release health crash**    | `crashFreeSessions`                              | < 99.5%               | Slack `#alerts`                    |
| **High-volume warning**     | same issue, same fingerprint                     | > 100 events in 5 min | Slack `#alerts`                    |
| **Browser regression**      | new `level:error` first seen in the last release | any                   | Slack `#frontend`                  |
| **Order placement failure** | issue title matches `orders.create`              | any                   | Slack `#backend` + email `admin@…` |

## Setup steps

Sentry's alert builder is the right tool; the official docs cover the UI in detail (https://docs.sentry.io/product/alerts/). The short version:

1. **Sentry → Alerts → Create Alert**.
2. Pick **Issues** for the new-issue and Convex-exception alerts; pick **Metrics** for the rate-spike and P0-regression alerts.
3. Set the **environment** to `production` (the env tag is set automatically by `Sentry.withSentryConfig` based on Vercel's `VERCEL_ENV`).
4. Set the **project** to `khit-storefront` or `khit-admin` as needed. The Convex alert is org-wide.
5. Pick the action (Slack, email, PagerDuty) and paste the integration URL.
6. **Save**, then **Test Alert** from the alert detail page to confirm the channel is wired.

## Runbook

When an alert fires, the on-call follows this script:

1. **Open the Sentry issue** from the Slack/email link.
2. **Look at the stack trace** and the release tag. If the release tag is the latest production release, the regression is in code; if it is older, it is environment.
3. **Search the issue title** in the repo (`grep -r "Error message" packages/ apps/`) to find the call site.
4. **Ack** the alert in Slack to stop the auto-paging timer.
5. **Fix forward** by opening a `fix/…` PR with the targeted change, **or revert** the offending commit via Vercel → Deployments → Promote prior.
6. **Post-mortem** any P0 (alert #3) in `#ops` within 24 hours, including the trace, the fix, and any new regression test that would have caught it.

If the alert is the **Convex unhandled exception** (#4), the same script applies but the fix is almost always in `packages/convex/`. The dashboard for Convex errors is the same Sentry project — look for events tagged with `transaction:convex` or `server_name:convex`.

## Source maps + release tracking

`Sentry.withSentryConfig` in `apps/storefront/next.config.ts:14` and `apps/admin/next.config.ts` (same shape) uploads source maps during `next build`. The new `sentry-release` job in `.github/workflows/ci.yml` (added in 4e.2) creates a Sentry release per `main` push with the format `<repo-short-sha>` and sets `SENTRY_RELEASE` to that SHA at build time, so events are auto-grouped under the release.

For this to work, the Vercel environment must include `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` (see [`docs/operations/production-deploy.md`](production-deploy.md)).

To verify the wiring after a deploy:

1. Find the Sentry release with the production deployment SHA: **Releases → `kebab-sha`** (the SHA is the short git SHA).
2. Open any issue from the release and check that the stack frame shows `apps/storefront/...` or `apps/admin/...` (mapped), not a minified bundle path.
3. If frames are minified, the source map upload did not run — check the CI logs for the `sentry-release` step and the Vercel build log for `withSentryConfig`.

## Test alerts

You should fire a test alert end-to-end before the first production deploy and once per quarter.

**From a Convex action** (any non-prod deployment):

```ts
// packages/convex/scripts/test-alert.ts (Phase 5 follow-up — for now, paste
// the line into an existing action and remove it after the alert fires).
Sentry.captureMessage('test alert from production', 'info');
```

**From the storefront or admin** (any non-prod deployment): add a deliberate throw inside a button onClick and click it. The error should appear in Sentry within ~10 s tagged with the correct release.

After the alert fires:

1. Confirm the Slack/email channel received the notification.
2. Resolve the test issue in Sentry so the alert does not re-fire.
3. Revert the test throw.

## Related

- `docs/operations/production-deploy.md`
- `docs/cross-browser-test-plan.md` (Sentry errors found during the cross-browser pass should be wired in here)
- PRD §11.1
- `.github/workflows/ci.yml` (the `sentry-release` job)
- `packages/convex/sentry.ts` (the `sentryStats` admin widget backing the dashboard)
