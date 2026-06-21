'use client';

import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { useAuth } from '@workspace/lib/auth/use-auth';
import { t } from '@workspace/lib/i18n';

import { PasswordInput } from './password-input';

const resetSchema = z
  .object({
    code: z
      .string({ message: 'Please enter the verification code' })
      .trim()
      .min(4, 'Please enter the verification code'),
    newPassword: z
      .string({ message: 'Please enter a new password' })
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string({ message: 'Please confirm your new password' })
      .min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type ResetPasswordFormValues = z.infer<typeof resetSchema>;

const defaults: ResetPasswordFormValues = { code: '', newPassword: '', confirmPassword: '' };

export function ResetPasswordForm() {
  const id = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get('email') ?? '';
  const { confirmPasswordReset } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    if (!prefilledEmail) {
      setServerError(t('auth.errorInvalidCode'));
      return;
    }
    const result = await confirmPasswordReset({
      email: prefilledEmail,
      code: values.code.trim(),
      newPassword: values.newPassword,
    });
    if (!result.ok) {
      setServerError(t(result.error));
      toast.error(t(result.error));
      return;
    }
    toast.success(t('auth.resetPasswordSuccess'));
    router.push('/auth/login');
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
        <Label htmlFor={`${id}-code`}>{t('auth.codeLabel')}</Label>
        <Input
          id={`${id}-code`}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-invalid={errors.code ? 'true' : 'false'}
          aria-describedby={errors.code ? `${id}-code-error` : undefined}
          {...register('code')}
        />
        {errors.code ? (
          <p id={`${id}-code-error`} className="text-destructive text-xs">
            {errors.code.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-new`}>{t('auth.newPasswordLabel')}</Label>
        <PasswordInput
          id={`${id}-new`}
          autoComplete="new-password"
          aria-invalid={errors.newPassword ? 'true' : 'false'}
          aria-describedby={errors.newPassword ? `${id}-new-error` : undefined}
          {...register('newPassword')}
        />
        {errors.newPassword ? (
          <p id={`${id}-new-error`} className="text-destructive text-xs">
            {errors.newPassword.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-confirm`}>{t('auth.confirmNewPasswordLabel')}</Label>
        <PasswordInput
          id={`${id}-confirm`}
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? 'true' : 'false'}
          aria-describedby={errors.confirmPassword ? `${id}-confirm-error` : undefined}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword ? (
          <p id={`${id}-confirm-error`} className="text-destructive text-xs">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full cursor-pointer">
        {isSubmitting ? t('auth.resetPasswordLoading') : t('auth.resetPasswordButton')}
      </Button>
    </form>
  );
}
