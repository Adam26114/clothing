'use client';

import { useAuthActions } from '@convex-dev/auth/react';

export type AuthFlowResult = { ok: true } | { ok: false; error: string };

export type SignUpInput = { email: string; password: string; name: string };
export type SignInInput = { email: string; password: string };
export type RequestPasswordResetInput = { email: string };
export type ConfirmPasswordResetInput = { email: string; code: string; newPassword: string };
export type VerifyEmailInput = { email: string; code: string };

export function useAuthFlows() {
  const { signIn, signOut } = useAuthActions();

  const signUp = async (input: SignUpInput): Promise<AuthFlowResult> => {
    try {
      await signIn('password', { flow: 'signUp', ...input });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: humanizeError(e) };
    }
  };

  const signInWithPassword = async (input: SignInInput): Promise<AuthFlowResult> => {
    try {
      await signIn('password', { flow: 'signIn', ...input });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: humanizeError(e) };
    }
  };

  const signOutCurrent = async (): Promise<AuthFlowResult> => {
    try {
      await signOut();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: humanizeError(e) };
    }
  };

  const requestPasswordReset = async (
    input: RequestPasswordResetInput
  ): Promise<AuthFlowResult> => {
    try {
      await signIn('password', { flow: 'reset', ...input });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: humanizeError(e) };
    }
  };

  const confirmPasswordReset = async (
    input: ConfirmPasswordResetInput
  ): Promise<AuthFlowResult> => {
    try {
      await signIn('password', { flow: 'reset-verification', ...input });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: humanizeError(e) };
    }
  };

  const verifyEmail = async (input: VerifyEmailInput): Promise<AuthFlowResult> => {
    try {
      await signIn('password', { flow: 'email-verification', ...input });
      return { ok: true };
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

function humanizeError(e: unknown): string {
  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    if (msg.includes('invalid')) return 'auth.errorInvalidCredentials';
    if (msg.includes('exists')) return 'auth.errorUserExists';
    if (msg.includes('verify')) return 'auth.errorEmailNotVerified';
    if (msg.includes('weak') || msg.includes('password')) return 'auth.errorWeakPassword';
    if (msg.includes('code')) return 'auth.errorInvalidCode';
    return 'auth.errorGeneric';
  }
  return 'auth.errorGeneric';
}
