import { Suspense } from 'react';

import { AuthForm } from '@/components/storefront/auth/auth-form';
import { LoginForm } from '@/components/storefront/auth/login-form';
import { t } from '@workspace/lib/i18n';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense>
      <AuthForm title={t('auth.signInTitle')} description={t('auth.signInDescription')}>
        <LoginForm />
      </AuthForm>
    </Suspense>
  );
}
