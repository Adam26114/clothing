'use client';

import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { useAuth } from '@workspace/lib/auth/use-auth';
import { t } from '@workspace/lib/i18n';

import { PasswordInput } from './password-input';

const loginSchema = z.object({
  email: z
    .string({ message: 'Please enter your email' })
    .trim()
    .min(1, 'Please enter your email')
    .email('Please enter a valid email'),
  password: z
    .string({ message: 'Please enter your password' })
    .min(1, 'Please enter your password'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const defaults: LoginFormValues = { email: '', password: '' };

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const id = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/account';
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await signIn({
      email: values.email.trim(),
      password: values.password,
    });
    if (!result.ok) {
      setServerError(t(result.error));
      toast.error(t(result.error));
      return;
    }
    router.push(nextPath);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {serverError ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {serverError}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-email`}>{t('auth.emailLabel')}</Label>
        <Input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? `${id}-email-error` : undefined}
          {...register('email')}
        />
        {errors.email ? (
          <p id={`${id}-email-error`} className="text-destructive text-xs">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${id}-password`}>{t('auth.passwordLabel')}</Label>
          <Link
            href="/auth/forgot-password"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 text-xs underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            {t('auth.forgotPasswordLink')}
          </Link>
        </div>
        <PasswordInput
          id={`${id}-password`}
          autoComplete="current-password"
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? `${id}-password-error` : undefined}
          {...register('password')}
        />
        {errors.password ? (
          <p id={`${id}-password-error`} className="text-destructive text-xs">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full cursor-pointer">
        {isSubmitting ? t('auth.signInLoading') : t('auth.signInButton')}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {t('auth.noAccount')}{' '}
        {onSwitchToRegister ? (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-foreground cursor-pointer font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {t('auth.signUpLink')}
          </button>
        ) : (
          <Link
            href="/auth/register"
            className="text-foreground cursor-pointer font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {t('auth.signUpLink')}
          </Link>
        )}
      </p>
    </form>
  );
}
