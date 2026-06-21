'use client';

import { useId } from 'react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { Truck, Store } from 'lucide-react';

import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { Label } from '@workspace/ui/components/label';
import { cn } from '@workspace/lib/cn';
import { formatMMK } from '@workspace/lib/formatMMK';
import { SHIPPING_FEE, SHIPPING_DELIVERY_DAYS } from '@workspace/lib/constants';
import { t } from '@workspace/lib/i18n';

import type { CheckoutFormValues } from './schema';

interface DeliveryMethodRadioProps {
  control: Control<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  className?: string;
}

export function DeliveryMethodRadio({ control, errors, className }: DeliveryMethodRadioProps) {
  const groupId = useId();
  const error = errors.deliveryMethod;

  return (
    <fieldset className={cn('flex flex-col gap-3', className)}>
      <legend className="text-base font-semibold">{t('checkout.deliveryMethodHeading')}</legend>
      <Controller
        control={control}
        name="deliveryMethod"
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onValueChange={(value) => {
              if (value === 'shipping' || value === 'pickup') {
                field.onChange(value);
              }
            }}
            aria-labelledby={groupId}
            aria-invalid={error ? 'true' : 'false'}
            className="grid grid-cols-1 gap-2"
          >
            <Label
              htmlFor={`${groupId}-shipping`}
              className="border-border bg-card hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer flex-col gap-1 rounded-md border p-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem id={`${groupId}-shipping`} value="shipping" />
                <Truck className="text-muted-foreground size-4" />
                <span className="text-sm font-medium">{t('checkout.shippingLabel')}</span>
                <span className="ms-auto text-xs font-semibold tabular-nums">
                  {formatMMK(SHIPPING_FEE)}
                </span>
              </div>
              <p className="text-muted-foreground ps-7 text-xs">
                {t('checkout.shippingDescription')} · {SHIPPING_DELIVERY_DAYS}
              </p>
            </Label>
            <Label
              htmlFor={`${groupId}-pickup`}
              className="border-border bg-card hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer flex-col gap-1 rounded-md border p-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem id={`${groupId}-pickup`} value="pickup" />
                <Store className="text-muted-foreground size-4" />
                <span className="text-sm font-medium">{t('checkout.pickupLabel')}</span>
                <span className="ms-auto text-xs font-semibold tabular-nums">
                  {t('checkout.pickupFree')}
                </span>
              </div>
              <p className="text-muted-foreground ps-7 text-xs">
                {t('checkout.pickupDescription')}
              </p>
            </Label>
          </RadioGroup>
        )}
      />
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error.message}
        </p>
      ) : null}
    </fieldset>
  );
}
