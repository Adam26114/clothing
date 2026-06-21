'use client';

import { useId } from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';

import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';

import type { CheckoutFormValues } from './schema';

interface ContactFieldsProps {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  className?: string;
}

export function ContactFields({ register, errors, className }: ContactFieldsProps) {
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();

  return (
    <fieldset className={cn('flex flex-col gap-4', className)}>
      <legend className="text-base font-semibold">{t('checkout.contactHeading')}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor={nameId}>{t('checkout.name')}</Label>
          <Input
            id={nameId}
            type="text"
            autoComplete="name"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
            {...register('name')}
          />
          {errors.name ? (
            <p id={`${nameId}-error`} className="text-destructive text-xs">
              {errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={emailId}>{t('checkout.email')}</Label>
          <Input
            id={emailId}
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id={`${emailId}-error`} className="text-destructive text-xs">
              {errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={phoneId}>{t('checkout.phone')}</Label>
          <Input
            id={phoneId}
            type="tel"
            autoComplete="tel"
            aria-invalid={errors.phone ? 'true' : 'false'}
            aria-describedby={errors.phone ? `${phoneId}-error` : undefined}
            {...register('phone')}
          />
          {errors.phone ? (
            <p id={`${phoneId}-error`} className="text-destructive text-xs">
              {errors.phone.message}
            </p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
