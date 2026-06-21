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

const verifySchema = z.object({
  code: z
    .string({ message: 'Please enter the verification code' })
    .trim()
    .min(4, 'Please enter the verification code'),
});

export type VerifyEmailFormValues = z.infer<typeof verifySchema>;

const defaults: VerifyEmailFormValues = { code: '' };

interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const id = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/account';
  const { verifyEmail, requestPasswordReset, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: defaults,
    mode: 'onBlur',
  });

  if (isLoading) {
    return null;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await verifyEmail({ email, code: values.code.trim() });
    if (!result.ok) {
      setServerError(t(result.error));
      toast.error(t(result.error));
      return;
    }
    toast.success(t('auth.verifyEmailSuccess'));
    router.push(nextPath);
    router.refresh();
  });

  const onResend = async () => {
    setResending(true);
    const result = await requestPasswordReset({ email });
    setResending(false);
    if (result.ok) {
      toast.success(t('auth.verifyEmailResent'));
    } else {
      toast.error(t(result.error));
    }
  };

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

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full cursor-pointer">
        {isSubmitting ? t('auth.verifyEmailLoading') : t('auth.verifyEmailButton')}
      </Button>

      <button
        type="button"
        onClick={onResend}
        disabled={resending}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 cursor-pointer self-center text-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {resending ? t('auth.verifyEmailResending') : t('auth.verifyEmailResend')}
      </button>
    </form>
  );
}
