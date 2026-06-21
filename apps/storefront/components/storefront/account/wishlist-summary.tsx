'use client';

import Link from 'next/link';
import { HeartIcon } from 'lucide-react';

import { useWishlist } from '@workspace/lib/wishlist';
import { t } from '@workspace/lib/i18n';
import { Button } from '@workspace/ui/components/button';

export function WishlistSummary() {
  const { count, isLoading } = useWishlist();

  if (isLoading) {
    return <div className="bg-muted/40 border-border h-20 animate-pulse rounded-xl border" />;
  }

  return (
    <div className="border-border bg-card flex items-center justify-between gap-4 rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div
          className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md"
          aria-hidden
        >
          <HeartIcon className="size-5" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-medium">{t('wishlist.itemsCount', 'en', { count })}</p>
          <p className="text-muted-foreground text-xs">{t('wishlist.title')}</p>
        </div>
      </div>
      <Button
        render={<Link href="/account/wishlist" />}
        variant="outline"
        size="sm"
        className="cursor-pointer"
      >
        {t('account.ordersView')}
      </Button>
    </div>
  );
}
