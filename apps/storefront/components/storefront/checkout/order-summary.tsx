'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { useCartItems } from '@workspace/lib/cart/merge';
import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/ui/lib/utils';

import { CartSummaryBlock } from '../cart/cart-summary-block';

interface OrderSummaryProps {
  className?: string;
}

export function OrderSummary({ className }: OrderSummaryProps) {
  const { items } = useCartItems();

  const summaryItems = items.map((it) => ({
    unitPrice: it.unitPrice ?? 0,
    quantity: it.quantity,
  }));

  return (
    <Card className={cn('sticky top-24', className)}>
      <CardHeader>
        <CardTitle>{t('checkout.orderSummary')}</CardTitle>
      </CardHeader>
      <CardContent>
        <CartSummaryBlock items={summaryItems} />
      </CardContent>
    </Card>
  );
}
