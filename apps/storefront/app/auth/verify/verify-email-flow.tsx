'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConvexAuth } from '@convex-dev/auth/react';

import { AuthForm } from '@/components/storefront/auth/auth-form';
import { VerifyEmailForm } from '@/components/storefront/auth/verify-email-form';
import { t } from '@workspace/lib/i18n';

export const dynamic = 'force-dynamic';

export function VerifyEmailFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const email = searchParams.get('email') ?? '';

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (isAuthenticated) {
      const next = searchParams.get('next') || '/account';
      router.replace(next);
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  if (!email) {
    return (
      <AuthForm
        title={t('auth.verifyEmailTitle')}
        description={t('auth.checkEmailDescription', 'en', { email: 'your email' })}
      >
        <p className="text-muted-foreground text-sm">{t('auth.errorInvalidCode')}</p>
      </AuthForm>
    );
  }

  return (
    <AuthForm title={t('auth.verifyEmailTitle')} description={t('auth.verifyEmailDescription')}>
      <VerifyEmailForm email={email} />
    </AuthForm>
  );
}
