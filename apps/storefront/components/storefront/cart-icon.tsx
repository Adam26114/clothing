'use client';

import { ShoppingBagIcon } from 'lucide-react';

import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/ui/lib/utils';
import { useCartItems } from '@workspace/lib/cart/merge';
import { useCartUIStore } from '@workspace/lib/hooks/use-cart-ui';

interface CartIconProps {
  className?: string;
}

export function CartIcon({ className }: CartIconProps) {
  const open = useCartUIStore().open;
  const { items } = useCartItems();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      type="button"
      onClick={open}
      aria-label={t('header.viewBag')}
      className={cn(
        'hover:bg-muted focus-visible:ring-ring/50 relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
    >
      <ShoppingBagIcon className="size-5" aria-hidden />
      {count > 0 ? (
        <span
          aria-hidden
          className="bg-primary text-primary-foreground absolute -end-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold tabular-nums"
        >
          {count > 99 ? t('header.cartCountOver99') : count}
        </span>
      ) : null}
    </button>
  );
}
