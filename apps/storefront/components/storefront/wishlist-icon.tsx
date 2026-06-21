'use client';

import Link from 'next/link';
import { HeartIcon } from 'lucide-react';

import { cn } from '@workspace/lib/cn';
import { useWishlist } from '@workspace/lib/wishlist';
import { t } from '@workspace/lib/i18n';

interface WishlistIconProps {
  className?: string;
}

export function WishlistIcon({ className }: WishlistIconProps) {
  const { count } = useWishlist();

  return (
    <Link
      href="/account/wishlist"
      aria-label={t('wishlist.title')}
      className={cn(
        'hover:bg-muted focus-visible:ring-ring/50 relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
    >
      <HeartIcon className="size-5" aria-hidden />
      {count > 0 ? (
        <span
          aria-hidden
          className="bg-primary text-primary-foreground absolute -end-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold tabular-nums"
        >
          {count > 99 ? t('header.cartCountOver99') : count}
        </span>
      ) : null}
    </Link>
  );
}
