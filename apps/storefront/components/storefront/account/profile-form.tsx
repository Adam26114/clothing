'use client';

import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { useAuth } from '@workspace/lib/auth/use-auth';
import { t } from '@workspace/lib/i18n';
import { api } from '@workspace/convex/_generated/api';
import { cn } from '@workspace/ui/lib/utils';

const profileSchema = z.object({
  name: z.string({ message: 'Please enter your name' }).trim().min(1, 'Please enter your name'),
  phone: z.string().trim().max(40, 'Phone is too long').optional().or(z.literal('')),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

const defaults: ProfileFormValues = { name: '', phone: '' };

interface ProfileFormProps {
  className?: string;
}

export function ProfileForm({ className }: ProfileFormProps) {
  const id = useId();
  const { user, isLoading } = useAuth();
  const updateProfile = useMutation(api.users.updateProfile);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!isLoading && user) {
      reset({
        name: user.name ?? '',
        phone: '',
      });
    }
  }, [isLoading, user, reset]);

  if (isLoading) {
    return (
      <div className="bg-muted/40 border-border h-32 animate-pulse rounded-xl border" aria-busy />
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await updateProfile({
        name: values.name.trim(),
        phone: values.phone?.trim() ? values.phone.trim() : undefined,
      });
      toast.success(t('account.profileSaved'));
      reset({ name: values.name.trim(), phone: values.phone?.trim() ?? '' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.errorGeneric');
      setServerError(message);
      toast.error(message);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className={cn('flex flex-col gap-5', className)}>
      {serverError ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {serverError}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-email`}>{t('account.profileEmail')}</Label>
        <Input id={`${id}-email`} type="email" value={user?.email ?? ''} readOnly disabled />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-name`}>{t('account.profileName')}</Label>
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
        <Label htmlFor={`${id}-phone`}>{t('account.profilePhone')}</Label>
        <Input
          id={`${id}-phone`}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={errors.phone ? 'true' : 'false'}
          aria-describedby={errors.phone ? `${id}-phone-error` : undefined}
          {...register('phone')}
        />
        {errors.phone ? (
          <p id={`${id}-phone-error`} className="text-destructive text-xs">
            {errors.phone.message}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="default"
          disabled={isSubmitting || !isDirty}
          className="cursor-pointer"
        >
          {isSubmitting ? t('account.profileSaving') : t('account.profileSaveButton')}
        </Button>
      </div>
    </form>
  );
}
