'use client';

import { formatMMK } from '@workspace/lib/formatMMK';
import { computeCartSummary, type CartSummaryItem } from '@workspace/lib/cart/summary';
import { t } from '@workspace/lib/i18n';
import type { DeliveryMethod } from '@workspace/lib/constants';
import { cn } from '@workspace/ui/lib/utils';

interface CartSummaryBlockProps {
  items: CartSummaryItem[];
  deliveryMethod?: DeliveryMethod;
  className?: string;
  showShippingLabel?: boolean;
}

export function CartSummaryBlock({
  items,
  deliveryMethod,
  className,
  showShippingLabel = true,
}: CartSummaryBlockProps) {
  const effectiveMethod: DeliveryMethod = deliveryMethod ?? 'shipping';
  const summary = computeCartSummary(items, effectiveMethod);
  const hasItems = items.length > 0;

  return (
    <dl data-slot="cart-summary" className={cn('flex flex-col gap-2 text-sm', className)}>
      <div className="flex items-center justify-between">
        <dt className="text-muted-foreground">{t('cart.subtotal')}</dt>
        <dd className="font-medium tabular-nums">{formatMMK(summary.subtotal)}</dd>
      </div>
      {showShippingLabel ? (
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('cart.shipping')}</dt>
          <dd className="font-medium tabular-nums">
            {hasItems ? (
              effectiveMethod === 'shipping' ? (
                summary.shippingFee > 0 ? (
                  formatMMK(summary.shippingFee)
                ) : (
                  t('cart.shippingFree')
                )
              ) : (
                t('cart.shippingFree')
              )
            ) : (
              <span className="text-muted-foreground">{t('cart.shippingAddAtCheckout')}</span>
            )}
          </dd>
        </div>
      ) : null}
      <div className="border-border mt-1 flex items-center justify-between border-t pt-2">
        <dt className="text-base font-semibold">{t('cart.total')}</dt>
        <dd className="text-base font-semibold tabular-nums">{formatMMK(summary.total)}</dd>
      </div>
    </dl>
  );
}
