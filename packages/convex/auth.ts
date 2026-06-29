/**
 * Better Auth setup for the parent Convex app.
 *
 * This file follows the canonical Convex + Better Auth pattern from
 * https://labs.convex.dev/better-auth/framework-guides/next — the BA component
 * is registered directly from the package (no local-install / custom schema),
 * and `createAuth` is exposed for use inside Convex functions.
 *
 * Env vars:
 *   - `SITE_URL` (set on the deployment via `bunx convex env set`) — base URL
 *     for the BA issuer / callbacks.
 *   - `BETTER_AUTH_SECRET` (set on the deployment) — secret for signing JWTs.
 *   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL` (set on the deployment) — used
 *     by the custom `sendVerificationEmail` / `sendResetPassword` hooks in
 *     `authResend.ts`.
 */
import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth';
import type { BetterAuthOptions } from 'better-auth';
import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import authConfig from './auth.config';
import { resetPasswordHtml, sendResendEmail, verifyEmailHtml } from './authResend';

const APP_NAME = 'Khit';
const siteUrl = process.env.SITE_URL ?? 'http://localhost:3000';
const secret = process.env.BETTER_AUTH_SECRET ?? 'dev-secret-replace-in-production';

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuthOptions = (ctx: GenericCtx<DataModel>): BetterAuthOptions => ({
  appName: APP_NAME,
  baseURL: siteUrl,
  secret,
  database: authComponent.adapter(ctx),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendResendEmail({
        to: user.email,
        subject: 'Reset your Khit password',
        html: resetPasswordHtml(url),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendResendEmail({
        to: user.email,
        subject: 'Verify your Khit email',
        html: verifyEmailHtml(url),
      });
    },
  },
  trustedOrigins: [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_STOREFRONT_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
  ].filter((u): u is string => Boolean(u)),
  plugins: [convex({ authConfig })],
});

export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth(createAuthOptions(ctx));
