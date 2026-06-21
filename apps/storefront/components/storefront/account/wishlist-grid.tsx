'use client';

import Link from 'next/link';
import { useState } from 'react';
import { HeartOffIcon, ShoppingBagIcon } from 'lucide-react';
import { toast } from 'sonner';

import { formatMMK } from '@workspace/lib/formatMMK';
import { useWishlist } from '@workspace/lib/wishlist';
import { useCartItems } from '@workspace/lib/cart/merge';
import { useCartUIStore } from '@workspace/lib/hooks/use-cart-ui';
import { t } from '@workspace/lib/i18n';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';

import { EmptyWishlist } from './empty-wishlist';
import { PlaceholderImage } from '../placeholder-image';

export function WishlistGrid() {
  const { items, count, isLoading, isAuthed, remove, clear } = useWishlist();
  const { addItem } = useCartItems();
  const { open: openCart } = useCartUIStore();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    );
  }

  if (count === 0) {
    return <EmptyWishlist />;
  }

  const handleMove = async (args: {
    productId: string;
    colorVariantId: string;
    size: string;
    _id?: string;
  }) => {
    setBusyId(args._id ?? `${args.productId}:${args.colorVariantId}:${args.size}`);
    try {
      await addItem({
        productId: args.productId,
        colorVariantId: args.colorVariantId,
        size: args.size,
        quantity: 1,
      });
      await remove(args);
      toast.success(t('wishlist.addedToWishlist'));
      if (isAuthed) {
        openCart();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.errorGeneric');
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (args: {
    productId: string;
    colorVariantId: string;
    size: string;
    _id?: string;
  }) => {
    setBusyId(args._id ?? `${args.productId}:${args.colorVariantId}:${args.size}`);
    try {
      await remove(args);
      toast.success(t('wishlist.removedFromWishlist'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.errorGeneric');
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleClear = async () => {
    await clear();
    toast.success(t('wishlist.removedFromWishlist'));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">{t('wishlist.itemsCount', 'en', { count })}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="cursor-pointer"
        >
          {t('cart.clearAll')}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const key = item._id ?? `${item.productId}:${item.colorVariantId}:${item.size}`;
          const href = item.productSlug ? `/products/${item.productSlug}` : '#';
          const busy = busyId === key || busyId === item._id;
          return (
            <div key={key} className="group/wishlist-item flex flex-col gap-2">
              <Link
                href={href}
                className="focus-visible:ring-ring/50 relative block cursor-pointer focus-visible:ring-2 focus-visible:outline-none"
              >
                <PlaceholderImage
                  colorHex={item.colorHex ?? null}
                  aspectRatio="portrait"
                  label={item.productName ?? t('a11y.productImage')}
                />
              </Link>
              <div className="flex flex-col gap-1 text-sm">
                <Link
                  href={href}
                  className="cursor-pointer font-medium hover:underline focus-visible:underline focus-visible:outline-none"
                >
                  {item.productName ?? t('pdp.addToCart')}
                </Link>
                <p className="text-muted-foreground text-xs">
                  {[item.colorName, item.size].filter(Boolean).join(' · ')}
                </p>
                {item.unitPrice !== undefined ? (
                  <p className="text-sm font-semibold tabular-nums">{formatMMK(item.unitPrice)}</p>
                ) : null}
              </div>
              <div className="mt-1 flex flex-col gap-1">
                {item.size && item.colorVariantId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleMove({
                        productId: item.productId,
                        colorVariantId: item.colorVariantId as string,
                        size: item.size as string,
                        _id: item._id,
                      })
                    }
                    disabled={busy}
                    className="w-full cursor-pointer"
                  >
                    <ShoppingBagIcon className="size-3.5" aria-hidden />
                    {t('wishlist.moveToBag')}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleRemove({
                      productId: item.productId,
                      colorVariantId: (item.colorVariantId as string) ?? '',
                      size: (item.size as string) ?? '',
                      _id: item._id,
                    })
                  }
                  disabled={busy}
                  className="text-muted-foreground hover:text-destructive w-full cursor-pointer"
                >
                  <HeartOffIcon className="size-3.5" aria-hidden />
                  {t('cart.remove')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
