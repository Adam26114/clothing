'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';
import { useCartItems, type UnifiedCartItem } from '@workspace/lib/cart/merge';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';

import { CartItemRow } from './cart-item-row';
import { CartSummaryBlock } from './cart-summary-block';
import { EmptyCart } from './empty-cart';

interface CartPageContentProps {
  className?: string;
}

export function CartPageContent({ className }: CartPageContentProps) {
  const router = useRouter();
  const { items, isLoading, updateQty, remove } = useCartItems();

  const summaryItems = items.map((it) => ({
    unitPrice: it.unitPrice ?? 0,
    quantity: it.quantity,
  }));

  const handleUpdateQty = (item: UnifiedCartItem, nextQty: number) => {
    if (nextQty < 1) {
      return;
    }
    void updateQty({
      productId: item.productId,
      colorVariantId: item.colorVariantId,
      size: item.size,
      quantity: nextQty,
      _id: item._id,
    });
  };

  const handleRemove = (item: UnifiedCartItem) => {
    void remove({
      productId: item.productId,
      colorVariantId: item.colorVariantId,
      size: item.size,
      quantity: item.quantity,
      _id: item._id,
    });
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (isLoading) {
    return (
      <div
        className={cn('flex flex-col gap-6 py-12', className)}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="bg-muted h-6 w-40 animate-pulse rounded" />
        <div className="bg-muted h-32 w-full animate-pulse rounded" />
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyCart className={className} />;
  }

  return (
    <div className={cn('flex flex-col gap-8 py-8 md:py-12', className)}>
      <header className="flex items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t('cart.title')}</h1>
        <span className="text-muted-foreground text-sm tabular-nums">
          {t('order.itemsCount', 'en', { count: items.length })}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_360px]">
        <section
          aria-label={t('cart.title')}
          className="border-border bg-card rounded-xl border p-4 sm:p-6"
        >
          {items.map((item) => (
            <CartItemRow
              key={`${item.productId}-${item.colorVariantId}-${item.size}`}
              item={item}
              onUpdateQty={handleUpdateQty}
              onRemove={handleRemove}
            />
          ))}
        </section>

        <aside
          aria-label={t('checkout.orderSummary')}
          className="border-border bg-card sticky top-24 h-fit rounded-xl border p-4 sm:p-6"
        >
          <h2 className="mb-4 text-base font-semibold">{t('checkout.orderSummary')}</h2>
          <CartSummaryBlock items={summaryItems} showShippingLabel={false} />
          <p className="text-muted-foreground mt-2 text-xs">{t('cart.shippingNote')}</p>
          <Separator className="my-4" />
          <Button
            type="button"
            size="lg"
            onClick={handleCheckout}
            className="w-full cursor-pointer"
          >
            <span>{t('cart.checkout')}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            render={<Link href="/" />}
            className="mt-2 w-full cursor-pointer"
          >
            {t('cart.continueShopping')}
          </Button>
        </aside>
      </div>
    </div>
  );
}
