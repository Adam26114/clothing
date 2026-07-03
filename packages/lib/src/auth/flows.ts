'use client';

import { authClient } from './client';

export type AuthFlowResult = { ok: true } | { ok: false; error: string };

export type SignUpInput = { email: string; password: string; name: string };
export type SignInInput = { email: string; password: string };
export type RequestPasswordResetInput = { email: string };
export type ConfirmPasswordResetInput = { token: string; newPassword: string };
export type VerifyEmailInput = { token: string };

const flowWrap =
  <TArgs extends unknown[]>(fn: (...args: TArgs) => Promise<{ error?: unknown } | void>) =>
  async (...args: TArgs): Promise<AuthFlowResult> => {
    try {
      const result = await fn(...args);
      return result?.error ? { ok: false, error: humanizeError(result.error) } : { ok: true };
    } catch (e) {
      return { ok: false, error: humanizeError(e) };
    }
  };

export function useAuthFlows() {
  return {
    signUp: flowWrap((input: SignUpInput) =>
      authClient.signUp.email({ ...input, callbackURL: '/account' })
    ),
    signIn: flowWrap((input: SignInInput) =>
      authClient.signIn.email({ ...input, callbackURL: '/account' })
    ),
    signOut: flowWrap(() => authClient.signOut()),
    requestPasswordReset: flowWrap((input: RequestPasswordResetInput) =>
      authClient.requestPasswordReset({
        email: input.email,
        redirectTo: '/auth/reset-password',
      })
    ),
    confirmPasswordReset: flowWrap((input: ConfirmPasswordResetInput) =>
      authClient.resetPassword({ newPassword: input.newPassword, token: input.token })
    ),
    verifyEmail: flowWrap((input: VerifyEmailInput) =>
      authClient.verifyEmail({ query: { token: input.token } })
    ),
  };
}

export function humanizeError(e: unknown): string {
  if (typeof e !== 'object' || e === null) {
    return 'auth.errorGeneric';
  }
  const code = (e as { code?: string }).code;
  if (!code) {
    return 'auth.errorGeneric';
  }
  switch (code) {
    case 'USER_ALREADY_EXISTS':
      return 'auth.errorUserExists';
    case 'INVALID_EMAIL_OR_PASSWORD':
    case 'INVALID_EMAIL':
      return 'auth.errorInvalidCredentials';
    case 'EMAIL_NOT_VERIFIED':
      return 'auth.errorEmailNotVerified';
    case 'PASSWORD_TOO_SHORT':
    case 'PASSWORD_TOO_LONG':
      return 'auth.errorWeakPassword';
    case 'INVALID_TOKEN':
      return 'auth.errorInvalidCode';
    case 'RATE_LIMITED':
      return 'auth.errorRateLimited';
    default:
      return 'auth.errorGeneric';
  }
}
