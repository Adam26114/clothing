'use client';

import { useState } from 'react';
import { HeartIcon } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';
import { useWishlist, type WishlistMutatorArgs } from '@workspace/lib/wishlist';

interface PdpWishlistButtonProps {
  productId: string;
  colorVariantId: string;
  size: string;
  className?: string;
}

export function PdpWishlistButton({
  productId,
  colorVariantId,
  size,
  className,
}: PdpWishlistButtonProps) {
  const { add, remove, isInWishlist, isAuthed, items, isLoading } = useWishlist();
  const [busy, setBusy] = useState(false);

  const args: WishlistMutatorArgs = { productId, colorVariantId, size };
  const filled = !isLoading && isInWishlist(args);

  const handleToggle = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      if (filled) {
        const existing = items.find(
          (it) =>
            it.productId === productId && it.colorVariantId === colorVariantId && it.size === size
        );
        await remove({ ...args, _id: existing?._id });
        toast.success(t('wishlist.removedFromWishlist'));
      } else {
        await add(args);
        toast.success(isAuthed ? t('wishlist.addedToWishlist') : t('wishlist.signInToSync'));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.errorGeneric');
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={busy}
      aria-label={filled ? t('wishlist.removedFromWishlist') : t('wishlist.addedToWishlist')}
      aria-pressed={filled}
      className={cn(
        'border-border hover:bg-muted focus-visible:ring-ring/50 inline-flex size-12 cursor-pointer items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
        filled && 'border-foreground/30',
        className
      )}
    >
      <HeartIcon
        className={cn('size-5', filled ? 'text-foreground fill-current' : '')}
        aria-hidden
      />
    </button>
  );
}
