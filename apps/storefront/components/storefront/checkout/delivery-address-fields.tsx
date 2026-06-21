'use client';

import { useId } from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';

import { Textarea } from '@workspace/ui/components/textarea';
import { Label } from '@workspace/ui/components/label';
import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';

import type { CheckoutFormValues } from './schema';

interface DeliveryAddressFieldsProps {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  className?: string;
}

export function DeliveryAddressFields({ register, errors, className }: DeliveryAddressFieldsProps) {
  const addressId = useId();
  const error = errors.address;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={addressId}>{t('checkout.address')}</Label>
      <Textarea
        id={addressId}
        rows={3}
        autoComplete="street-address"
        placeholder={t('checkout.addressPlaceholder')}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${addressId}-error` : undefined}
        {...register('address')}
      />
      {error ? (
        <p id={`${addressId}-error`} className="text-destructive text-xs">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
