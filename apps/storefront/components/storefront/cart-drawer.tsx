'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { ShoppingBagIcon, XIcon } from 'lucide-react';

import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/lib/cn';
import { formatMMK } from '@workspace/lib/formatMMK';
import { computeCartSummary } from '@workspace/lib/cart/summary';
import { useCartItems, type UnifiedCartItem } from '@workspace/lib/cart/merge';
import { useCartUIStore } from '@workspace/lib/hooks/use-cart-ui';
import { useIsAuthenticated } from '@workspace/lib/auth/client';
import { api } from '@workspace/convex/_generated/api';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@workspace/ui/components/sheet';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { ScrollArea } from '@workspace/ui/components/scroll-area';

import { EmptyCart } from './empty-cart';
import { PlaceholderImage } from './placeholder-image';

interface DisplayLine {
  key: string;
  productId: string;
  productSlug: string | null;
  productName: string;
  colorName: string | null;
  colorHex: string | null;
  size: string;
  unitPrice: number;
  quantity: number;
  raw: UnifiedCartItem;
}

const PRODUCT_LOOKUP_PAGE_SIZE = 100;

export function CartDrawer() {
  const { isOpen, close } = useCartUIStore();
  const isAuthed = useIsAuthenticated();
  const { items, updateQty, remove } = useCartItems();
  const [pendingRemoveKey, setPendingRemoveKey] = useState<string | null>(null);

  const productIds = useMemo(() => Array.from(new Set(items.map((it) => it.productId))), [items]);
  const needsLookup = !isAuthed && productIds.length > 0;
  const productLookup = useQuery(
    api.products.list,
    needsLookup ? { isPublished: true, pageSize: PRODUCT_LOOKUP_PAGE_SIZE } : 'skip'
  );

  const productById = useMemo(() => {
    const map = new Map<string, NonNullable<typeof productLookup>['items'][number]>();
    if (productLookup) {
      for (const product of productLookup.items) {
        map.set(product._id, product);
      }
    }
    return map;
  }, [productLookup]);

  const lines: DisplayLine[] = useMemo(() => {
    return items.map((item) => {
      const product = !isAuthed ? productById.get(item.productId) : null;
      const variant = product?.colorVariants.find((v) => v.id === item.colorVariantId) ?? null;
      const fallbackProduct = product as {
        name?: string;
        slug?: string;
        salePrice?: number;
        basePrice?: number;
      } | null;
      const productName = item.productName ?? fallbackProduct?.name ?? t('pdp.addToCart');
      const productSlug = fallbackProduct?.slug ?? null;
      const colorName = item.colorName ?? variant?.colorName ?? null;
      const colorHex = item.colorHex ?? variant?.colorHex ?? null;
      const unitPrice =
        item.unitPrice ?? fallbackProduct?.salePrice ?? fallbackProduct?.basePrice ?? 0;
      return {
        key: makeLineKey(item),
        productId: item.productId,
        productSlug,
        productName,
        colorName,
        colorHex,
        size: item.size,
        unitPrice,
        quantity: item.quantity,
        raw: item,
      };
    });
  }, [items, isAuthed, productById]);

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const summary = computeCartSummary(
    lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
    'pickup'
  );
  const displaySubtotal = summary.subtotal || subtotal;

  const handleQty = async (line: DisplayLine, delta: number) => {
    const next = Math.max(0, line.quantity + delta);
    if (next === 0) {
      setPendingRemoveKey(line.key);
      return;
    }
    await Promise.resolve(
      updateQty({
        productId: line.productId,
        colorVariantId: line.raw.colorVariantId,
        size: line.size,
        quantity: next,
        _id: line.raw._id,
      })
    );
  };

  const confirmRemove = async (line: DisplayLine) => {
    await Promise.resolve(
      remove({
        productId: line.productId,
        colorVariantId: line.raw.colorVariantId,
        size: line.size,
        quantity: line.quantity,
        _id: line.raw._id,
      })
    );
    setPendingRemoveKey(null);
  };

  const cancelRemove = () => setPendingRemoveKey(null);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setPendingRemoveKey(null);
          close();
        }
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full max-w-full flex-col gap-0 p-0 sm:max-w-md"
        showCloseButton={false}
      >
        <SheetHeader className="flex-row items-center justify-between border-b">
          <div className="flex flex-col gap-0.5">
            <SheetTitle>{t('cart.title')}</SheetTitle>
            <SheetDescription className="sr-only">{t('cart.title')}</SheetDescription>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={close}
            aria-label={t('header.closeMenu')}
            className="cursor-pointer"
          >
            <XIcon className="size-4" />
          </Button>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex-1 px-4 py-6">
            <EmptyCart />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <ul className="flex flex-col gap-4 px-4 py-4">
                {lines.map((line) => {
                  const isPendingRemove = pendingRemoveKey === line.key;
                  return (
                    <li
                      key={line.key}
                      className="border-border flex gap-3 border-b pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="w-20 shrink-0">
                        <PlaceholderImage
                          colorHex={line.colorHex}
                          aspectRatio="portrait"
                          label={line.productName}
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-1.5">
                        <Link
                          href={line.productSlug ? `/products/${line.productSlug}` : '#'}
                          onClick={close}
                          className="cursor-pointer text-sm font-medium hover:underline focus-visible:underline focus-visible:outline-none"
                        >
                          {line.productName}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {[line.colorName, line.size].filter(Boolean).join(' · ')}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <QtyStepper
                            value={line.quantity}
                            onDecrease={() => handleQty(line, -1)}
                            onIncrease={() => handleQty(line, 1)}
                            label={t('cart.quantity')}
                          />
                          <span className="text-sm font-semibold tabular-nums">
                            {formatMMK(line.unitPrice * line.quantity)}
                          </span>
                        </div>
                        {isPendingRemove ? (
                          <div className="border-border bg-muted/40 mt-2 flex flex-col gap-2 rounded-md border p-2 text-xs">
                            <p className="text-foreground">{t('cart.removeConfirmTitle')}</p>
                            <p className="text-muted-foreground">
                              {t('cart.removeConfirmDescription')}
                            </p>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={cancelRemove}
                                className="cursor-pointer"
                              >
                                {t('actions.continue')}
                              </Button>
                              <Button
                                variant="destructive"
                                size="xs"
                                onClick={() => confirmRemove(line)}
                                className="cursor-pointer"
                              >
                                {t('cart.remove')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingRemoveKey(line.key)}
                            className={cn(
                              'text-muted-foreground hover:text-foreground mt-1 self-start text-xs underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none'
                            )}
                          >
                            {t('cart.remove')}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>

            <div className="border-t px-4 py-4">
              {!isAuthed ? (
                <Link
                  href="/auth/login"
                  onClick={close}
                  className="border-border bg-muted/50 hover:bg-muted focus-visible:ring-ring/50 mb-3 block cursor-pointer rounded-md border px-3 py-2 text-center text-xs focus-visible:ring-2 focus-visible:outline-none"
                >
                  {t('cart.signInToSync')}
                </Link>
              ) : null}
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                  <span className="font-medium tabular-nums">{formatMMK(displaySubtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('cart.shipping')}</span>
                  <span className="text-muted-foreground text-xs">{t('cart.shippingNote')}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex items-center justify-between font-semibold">
                  <span>{t('cart.total')}</span>
                  <span className="tabular-nums">{formatMMK(displaySubtotal)}</span>
                </div>
              </div>
              <Button
                render={<Link href="/checkout" onClick={close} />}
                size="lg"
                className="mt-4 w-full cursor-pointer"
              >
                <ShoppingBagIcon className="size-4" />
                {t('cart.checkout')}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface QtyStepperProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  label: string;
}

function QtyStepper({ value, onDecrease, onIncrease, label }: QtyStepperProps) {
  return (
    <div
      className="border-border inline-flex items-center rounded-md border"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={onDecrease}
        aria-label={t('a11y.decreaseQuantity')}
        className="hover:bg-muted focus-visible:ring-ring/50 h-7 w-7 cursor-pointer rounded-s-md text-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        disabled={value <= 1}
      >
        −
      </button>
      <span aria-live="polite" className="min-w-7 px-1 text-center text-sm tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={t('a11y.increaseQuantity')}
        className="hover:bg-muted focus-visible:ring-ring/50 h-7 w-7 cursor-pointer rounded-e-md text-sm focus-visible:ring-2 focus-visible:outline-none"
      >
        +
      </button>
    </div>
  );
}

function makeLineKey(item: UnifiedCartItem): string {
  if (item._id) {
    return item._id;
  }
  return `${item.productId}:${item.colorVariantId}:${item.size}`;
}
