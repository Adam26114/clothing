'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useCartItems } from '@workspace/lib/cart/merge';
import { cn } from '@workspace/ui/lib/utils';

import { CheckoutForm } from './checkout-form';
import { OrderSummary } from './order-summary';

interface CheckoutPageContentProps {
  className?: string;
}

export function CheckoutPageContent({ className }: CheckoutPageContentProps) {
  const router = useRouter();
  const { items, isLoading } = useCartItems();

  useEffect(() => {
    if (!isLoading && items.length === 0) {
      router.replace('/cart');
    }
  }, [items.length, isLoading, router]);

  if (isLoading) {
    return (
      <div
        className={cn('flex flex-col gap-6 py-12', className)}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted h-96 w-full animate-pulse rounded" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('grid grid-cols-1 gap-8 py-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_360px]')}>
      <div className="max-w-2xl">
        <CheckoutForm />
      </div>
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <OrderSummary />
      </aside>
    </div>
  );
}
