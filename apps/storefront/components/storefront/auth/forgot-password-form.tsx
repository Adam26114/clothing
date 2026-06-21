'use client';

import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { useAuth } from '@workspace/lib/auth/use-auth';
import { t } from '@workspace/lib/i18n';

const forgotSchema = z.object({
  email: z
    .string({ message: 'Please enter your email' })
    .trim()
    .min(1, 'Please enter your email')
    .email('Please enter a valid email'),
});

export type ForgotFormValues = z.infer<typeof forgotSchema>;

const defaults: ForgotFormValues = { email: '' };

interface ForgotPasswordFormProps {
  onSent: (email: string) => void;
}

export function ForgotPasswordForm({ onSent }: ForgotPasswordFormProps) {
  const id = useId();
  const { requestPasswordReset } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await requestPasswordReset({ email: values.email.trim() });
    if (!result.ok) {
      setServerError(t(result.error));
      toast.error(t(result.error));
      return;
    }
    onSent(values.email.trim());
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

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full cursor-pointer">
        {isSubmitting ? t('auth.forgotPasswordLoading') : t('auth.forgotPasswordButton')}
      </Button>
    </form>
  );
}
