'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { AuthForm } from '@/components/storefront/auth/auth-form';
import { VerifyEmailForm } from '@/components/storefront/auth/verify-email-form';
import { useAuth } from '@workspace/lib/auth/use-auth';
import { t } from '@workspace/lib/i18n';

export const dynamic = 'force-dynamic';

export function VerifyEmailFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, isAuthenticated, isLoading } = useAuth();
  const token = searchParams.get('token') ?? '';
  const next = searchParams.get('next') ?? '/account';
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (isAuthenticated) {
      router.replace(next);
      return;
    }
    if (!token || verifying) {
      return;
    }
    let cancelled = false;
    setVerifying(true);
    void (async () => {
      const result = await verifyEmail({ token });
      if (cancelled) {
        return;
      }
      setVerifying(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, isLoading, isAuthenticated, next, router, verifyEmail, verifying]);

  if (!token) {
    return (
      <AuthForm
        title={t('auth.verifyEmailTitle')}
        description={t('auth.checkEmailInterstitialHint')}
      >
        <p className="text-muted-foreground text-sm">{t('auth.checkEmailInterstitial')}</p>
      </AuthForm>
    );
  }

  if (error) {
    return (
      <AuthForm title={t('auth.verifyEmailTitle')} description={t('auth.verifyEmailDescription')}>
        <p className="text-destructive text-sm">{t(error)}</p>
      </AuthForm>
    );
  }

  return (
    <AuthForm title={t('auth.verifyEmailTitle')} description={t('auth.verifyEmailDescription')}>
      <VerifyEmailForm />
    </AuthForm>
  );
}
