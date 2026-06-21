'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';

import { cn } from '@workspace/lib/cn';
import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';
import type { UnifiedCartItem } from '@workspace/lib/cart/merge';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';

import { PlaceholderImage } from '../placeholder-image';

interface CartItemRowProps {
  item: UnifiedCartItem;
  productSlug?: string;
  onUpdateQty: (item: UnifiedCartItem, nextQty: number) => void;
  onRemove: (item: UnifiedCartItem) => void;
  className?: string;
}

function buildLineKey(item: UnifiedCartItem): string {
  return `${item.productId}-${item.colorVariantId}-${item.size}`;
}

export function CartItemRow({
  item,
  productSlug,
  onUpdateQty,
  onRemove,
  className,
}: CartItemRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const lineTotal = (item.unitPrice ?? 0) * item.quantity;
  const productHref = productSlug ? `/products/${productSlug}` : '#';
  const minQty = 1;
  const canDecrement = item.quantity > minQty;
  const canIncrement = true;

  return (
    <article
      data-slot="cart-item-row"
      data-line-key={buildLineKey(item)}
      className={cn(
        'border-border flex flex-col gap-3 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-4',
        className
      )}
    >
      <Link
        href={productHref}
        aria-label={item.productName ?? t('a11y.productImage')}
        className="bg-muted focus-visible:ring-ring/50 relative block h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-md focus-visible:ring-[3px] focus-visible:outline-none sm:h-28 sm:w-28"
      >
        <PlaceholderImage
          colorHex={item.colorHex ?? null}
          aspectRatio="square"
          label={item.productName ?? t('a11y.productImage')}
          className="h-full w-full"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={productHref}
          className="text-foreground cursor-pointer text-sm font-medium hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {item.productName ?? t('cart.itemName')}
        </Link>
        <dl className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {item.colorName ? (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">{t('cart.color')}</dt>
              <dd className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="border-border inline-block size-3 rounded-full border"
                  style={{ backgroundColor: item.colorHex ?? undefined }}
                />
                <span>{item.colorName}</span>
              </dd>
            </div>
          ) : null}
          {item.size ? (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">{t('cart.size')}</dt>
              <dd>
                <span className="text-foreground/70">{t('cart.size')}:</span> {item.size}
              </dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-1 flex items-center justify-between gap-2 sm:hidden">
          <span className="text-sm font-semibold tabular-nums">{formatMMK(lineTotal)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div
          className="border-border bg-card inline-flex items-center rounded-md border"
          role="group"
          aria-label={t('cart.quantity')}
        >
          <button
            type="button"
            onClick={() => onUpdateQty(item, item.quantity - 1)}
            disabled={!canDecrement}
            aria-label={t('a11y.decreaseQuantity')}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="size-3.5" />
          </button>
          <span aria-live="polite" className="min-w-6 text-center text-sm font-medium tabular-nums">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQty(item, item.quantity + 1)}
            disabled={!canIncrement}
            aria-label={t('a11y.increaseQuantity')}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <span className="hidden text-sm font-semibold tabular-nums sm:inline">
          {formatMMK(lineTotal)}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setConfirmOpen(true)}
          aria-label={t('cart.remove')}
          className="text-muted-foreground hover:text-destructive cursor-pointer"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cart.removeConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('cart.removeConfirmDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t('cart.removeCancelAction')}
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                onRemove(item);
                setConfirmOpen(false);
              }}
            >
              {t('cart.removeConfirmAction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
