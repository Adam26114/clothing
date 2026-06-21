import { Suspense } from 'react';

import { AuthForm } from '@/components/storefront/auth/auth-form';
import { ResetPasswordForm } from '@/components/storefront/auth/reset-password-form';
import { t } from '@workspace/lib/i18n';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense>
      <AuthForm
        title={t('auth.resetPasswordTitle')}
        description={t('auth.resetPasswordDescription')}
      >
        <ResetPasswordForm />
      </AuthForm>
    </Suspense>
  );
}
