'use client';

import { useState } from 'react';

import { AuthForm } from './auth-form';
import { CheckEmailCard } from './check-email-card';
import { ForgotPasswordForm } from './forgot-password-form';
import { t } from '@workspace/lib/i18n';

interface ForgotPasswordCardProps {
  email: string | null;
  setEmail: (value: string | null) => void;
}

export function ForgotPasswordCard({ email, setEmail }: ForgotPasswordCardProps) {
  if (email) {
    return <CheckEmailCard email={email} backHref="/auth/login" />;
  }
  return (
    <AuthForm
      title={t('auth.forgotPasswordTitle')}
      description={t('auth.forgotPasswordDescription')}
    >
      <ForgotPasswordForm onSent={(sent) => setEmail(sent)} />
    </AuthForm>
  );
}

export function ForgotPasswordFlow() {
  const [email, setEmail] = useState<string | null>(null);
  return <ForgotPasswordCard email={email} setEmail={setEmail} />;
}
