'use client';

import { authClient } from './client';

export type AuthFlowResult = { ok: true } | { ok: false; error: string };

export type SignUpInput = { email: string; password: string; name: string };
export type SignInInput = { email: string; password: string };
export type RequestPasswordResetInput = { email: string };
export type ConfirmPasswordResetInput = { token: string; newPassword: string };
export type VerifyEmailInput = { token: string };

export function useAuthFlows() {
  const signUp = async (input: SignUpInput): Promise<AuthFlowResult> => {
    try {
      const { error } = await authClient.signUp.email({ ...input, callbackURL: '/account' });
      return error ? { ok: false, error: humanizeError(error) } : { ok: true };
    } catch (e) {
      return { ok: false, error: humanizeError(e) };
    }
  };

  const signInWithPassword = async (input: SignInInput): Promise<AuthFlowResult> => {
    try {
      const { error } = await authClient.signIn.email({ ...input, callbackURL: '/account' });
      return error ? { ok: false, error: humanizeError(error) } : { ok: true };
    } catch (e) {
      return { ok: false, error: humanizeError(e) };
    }
  };

  const signOutCurrent = async (): Promise<AuthFlowResult> => {
    try {
      await authClient.signOut();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: humanizeError(e) };
    }
  };

  const requestPasswordReset = async (
    input: RequestPasswordResetInput
  ): Promise<AuthFlowResult> => {
    try {
      const { error } = await authClient.requestPasswordReset({
        email: input.email,
        redirectTo: '/auth/reset-password',
      });
      return error ? { ok: false, error: humanizeError(error) } : { ok: true };
    } catch (e) {
      return { ok: false, error: humanizeError(e) };
    }
  };

  const confirmPasswordReset = async (
    input: ConfirmPasswordResetInput
  ): Promise<AuthFlowResult> => {
    try {
      const { error } = await authClient.resetPassword({
        newPassword: input.newPassword,
        token: input.token,
      });
      return error ? { ok: false, error: humanizeError(error) } : { ok: true };
    } catch (e) {
      return { ok: false, error: humanizeError(e) };
    }
  };

  const verifyEmail = async (input: VerifyEmailInput): Promise<AuthFlowResult> => {
    try {
      const { error } = await authClient.verifyEmail({ query: { token: input.token } });
      return error ? { ok: false, error: humanizeError(error) } : { ok: true };
    } catch (e) {
      return { ok: false, error: humanizeError(e) };
    }
  };

  return {
    signUp,
    signIn: signInWithPassword,
    signOut: signOutCurrent,
    requestPasswordReset,
    confirmPasswordReset,
    verifyEmail,
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
