'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/lib/cn';

interface PlaceOrderButtonProps {
  isSubmitting: boolean;
  disabled?: boolean;
  className?: string;
}

export function PlaceOrderButton({ isSubmitting, disabled, className }: PlaceOrderButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={isSubmitting || disabled}
      className={cn('w-full cursor-pointer', className)}
    >
      {isSubmitting ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>{t('checkout.orderProcessing')}</span>
        </span>
      ) : (
        <span>{t('checkout.placeOrder')}</span>
      )}
    </Button>
  );
}
