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

const registerSchema = z
  .object({
    name: z.string({ message: 'Please enter your name' }).trim().min(1, 'Please enter your name'),
    email: z
      .string({ message: 'Please enter your email' })
      .trim()
      .min(1, 'Please enter your email')
      .email('Please enter a valid email'),
    password: z
      .string({ message: 'Please enter a password' })
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string({ message: 'Please confirm your password' })
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

const defaults: RegisterFormValues = { name: '', email: '', password: '', confirmPassword: '' };

export function RegisterForm() {
  const id = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/account';
  const { signUp, isAuthenticated } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await signUp({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    });
    if (!result.ok) {
      setServerError(t(result.error));
      toast.error(t(result.error));
      return;
    }
    if (isAuthenticated) {
      router.push(nextPath);
      router.refresh();
      return;
    }
    const params = new URLSearchParams({ email: values.email.trim() });
    if (nextPath !== '/account') {
      params.set('next', nextPath);
    }
    router.push(`/auth/verify?${params.toString()}`);
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
        <Label htmlFor={`${id}-name`}>{t('auth.nameLabel')}</Label>
        <Input
          id={`${id}-name`}
          type="text"
          autoComplete="name"
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? `${id}-name-error` : undefined}
          {...register('name')}
        />
        {errors.name ? (
          <p id={`${id}-name-error`} className="text-destructive text-xs">
            {errors.name.message}
          </p>
        ) : null}
      </div>

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
        <Label htmlFor={`${id}-password`}>{t('auth.passwordLabel')}</Label>
        <PasswordInput
          id={`${id}-password`}
          autoComplete="new-password"
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-confirm-password`}>{t('auth.confirmPasswordLabel')}</Label>
        <PasswordInput
          id={`${id}-confirm-password`}
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? 'true' : 'false'}
          aria-describedby={errors.confirmPassword ? `${id}-confirm-password-error` : undefined}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword ? (
          <p id={`${id}-confirm-password-error`} className="text-destructive text-xs">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full cursor-pointer">
        {isSubmitting ? t('auth.signUpLoading') : t('auth.signUpButton')}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {t('auth.haveAccount')}{' '}
        <Link
          href="/auth/login"
          className="text-foreground cursor-pointer font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {t('auth.signInLink')}
        </Link>
      </p>
    </form>
  );
}
