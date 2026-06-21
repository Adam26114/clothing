import { AuthForm } from '@/components/storefront/auth/auth-form';
import { RegisterForm } from '@/components/storefront/auth/register-form';
import { t } from '@workspace/lib/i18n';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <AuthForm title={t('auth.signUpTitle')} description={t('auth.signUpDescription')}>
      <RegisterForm />
    </AuthForm>
  );
}
