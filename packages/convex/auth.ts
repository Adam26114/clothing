import { Password } from '@convex-dev/auth/providers/Password';
import Resend from '@auth/core/providers/resend';
import type { Value } from 'convex/values';
import { convexAuth } from '@convex-dev/auth/server';

const RESEND_FROM = process.env.RESEND_FROM_EMAIL;
const hasResend = !!RESEND_FROM;

// `hasResend` guards the dev server so it still boots when `RESEND_FROM_EMAIL`
// (and the matching `RESEND_API_KEY`) are not set. With the guard off, sign-up
// and sign-in still work — but `verify` and `reset` are no-ops, so the auth
// pages should show a "Resend not configured" banner (see
// `auth.errorNoResend`). Configure both envs to enable end-to-end email
// verification and password reset. See README "Resend setup".

function buildProfile(params: Record<string, Value | undefined>) {
  const email = String(params.email ?? '');
  const profile = {
    email,
    role: 'customer' as const,
    isActive: true as const,
    createdAt: Date.now(),
  };
  if (params.name !== undefined) {
    return { ...profile, name: String(params.name) };
  }
  return profile;
}

const passwordConfig = hasResend
  ? {
      profile: buildProfile,
      verify: Resend({ from: RESEND_FROM! }),
      reset: Resend({ from: RESEND_FROM! }),
    }
  : {
      profile: buildProfile,
    };

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password(passwordConfig)],
});
