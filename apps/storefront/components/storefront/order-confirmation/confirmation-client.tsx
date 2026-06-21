'use client';

import { useQuery } from 'convex/react';
import Link from 'next/link';
import { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';
import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { ArrowRight, Loader2 } from 'lucide-react';

import { ConfirmationCard } from './confirmation-card';
import { OrderItemsTable } from './order-items-table';

interface ConfirmationClientProps {
  orderId: string;
}

export function ConfirmationClient({ orderId }: ConfirmationClientProps) {
  const order = useQuery(api.orders.getById, { id: orderId as Id<'orders'> });

  if (order === undefined) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-24"
        aria-busy="true"
        aria-live="polite"
      >
        <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden />
        <p className="text-muted-foreground text-sm">{t('order.loading')}</p>
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('order.notFoundTitle')}</h1>
        <p className="text-muted-foreground text-sm">{t('order.notFoundDescription')}</p>
        <Button render={<Link href="/" />} className="mt-4 cursor-pointer">
          <span>{t('order.continueShopping')}</span>
          <ArrowRight className="rtl:rotate-180" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-8 md:py-12">
      <ConfirmationCard order={order} />
      <div className="mx-auto w-full max-w-3xl">
        <OrderItemsTable items={order.items} />
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <div className="border-border bg-card rounded-xl border p-4 sm:p-6">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t('order.subtotal')}</dt>
              <dd className="tabular-nums">{formatMMK(order.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t('order.shipping')}</dt>
              <dd className="tabular-nums">
                {order.shippingFee > 0 ? formatMMK(order.shippingFee) : t('cart.shippingFree')}
              </dd>
            </div>
            <Separator className="my-1" />
            <div className="flex items-center justify-between">
              <dt className="text-base font-semibold">{t('order.total')}</dt>
              <dd className="text-base font-semibold tabular-nums">{formatMMK(order.total)}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
        <Button render={<Link href="/" />} className="cursor-pointer" size="lg">
          <span>{t('order.continueShopping')}</span>
        </Button>
      </div>
    </div>
  );
}
