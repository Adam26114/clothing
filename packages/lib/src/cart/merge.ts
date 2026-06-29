'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ConvexError } from 'convex/values';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api.js';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { useAuth } from '@workspace/lib/auth/use-auth';
import { clearGuestCart, readGuestCart, useGuestCart } from './guest';
import type { GuestCartItem } from './guest';

export interface UnifiedCartItem {
  productId: string;
  colorVariantId: string;
  size: string;
  quantity: number;
  productName?: string;
  colorName?: string | null;
  colorHex?: string | null;
  imageId?: string | null;
  unitPrice?: number;
  _id?: string;
}

export interface CartMutatorArgs {
  productId: string;
  colorVariantId: string;
  size: string;
  quantity: number;
  _id?: string;
}

interface MergeGuestResponse {
  merged: number;
  skipped: Array<{
    productId: Id<'products'>;
    colorVariantId: string;
    size: string;
    reason: string;
  }>;
}

function isConvexError(err: unknown): err is ConvexError<string> {
  return err instanceof ConvexError;
}

function sameItem(a: GuestCartItem, b: GuestCartItem): boolean {
  return a.productId === b.productId && a.colorVariantId === b.colorVariantId && a.size === b.size;
}

function upsertGuest(items: GuestCartItem[], next: GuestCartItem): GuestCartItem[] {
  const idx = items.findIndex((i) => sameItem(i, next));
  if (idx === -1) {
    return [...items, next];
  }
  const existing = items[idx];
  if (!existing) {
    return items;
  }
  const mergedQty = existing.quantity + next.quantity;
  const updated = items.slice();
  updated[idx] = { ...existing, quantity: mergedQty };
  return updated;
}

export interface UseCartMergeOnAuthOptions {
  onShowToast?: (msg: string) => void;
}

export function useCartMergeOnAuth(options?: UseCartMergeOnAuthOptions): void {
  const { isAuthenticated, isLoading } = useAuth();
  const mergeGuest = useMutation(api.cart.mergeGuest);
  const inFlight = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || inFlight.current) {
      return;
    }
    const guestItems = readGuestCart();
    if (guestItems.length === 0) {
      return;
    }
    inFlight.current = true;
    const payload = guestItems.map((i) => ({
      productId: i.productId as Id<'products'>,
      colorVariantId: i.colorVariantId,
      size: i.size,
      quantity: i.quantity,
    }));
    mergeGuest({ items: payload })
      .then((result: MergeGuestResponse) => {
        clearGuestCart();
        const msg =
          result.skipped.length > 0
            ? `Merged ${result.merged} item${result.merged === 1 ? '' : 's'} (${result.skipped.length} unavailable)`
            : `Merged ${result.merged} item${result.merged === 1 ? '' : 's'} from your bag`;
        options?.onShowToast?.(msg);
      })
      .catch((err: unknown) => {
        if (isConvexError(err)) {
          console.warn('Cart merge failed (ConvexError), keeping guest cart for retry', err.data);
        } else {
          console.warn('Cart merge failed, keeping guest cart for retry', err);
        }
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, [isAuthenticated, isLoading, mergeGuest, options]);
}

export function useCartItems(): {
  items: UnifiedCartItem[];
  isLoading: boolean;
  isAuthed: boolean;
  addItem: (args: CartMutatorArgs) => Promise<unknown> | void;
  updateQty: (args: CartMutatorArgs) => Promise<unknown> | void;
  remove: (args: CartMutatorArgs) => Promise<unknown> | void;
} {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const guest = useGuestCart();
  const authedItems = useQuery(api.cart.list, isAuthenticated ? {} : 'skip');
  const addAuthed = useMutation(api.cart.add);
  const updateQtyAuthed = useMutation(api.cart.updateQty);
  const removeAuthed = useMutation(api.cart.remove);

  const items: UnifiedCartItem[] = isAuthenticated
    ? (authedItems ?? []).map((it) => ({
        productId: it.productId,
        colorVariantId: it.colorVariantId,
        size: it.size,
        quantity: it.quantity,
        productName: it.product?.name,
        colorName: it.colorName,
        colorHex: it.colorHex,
        imageId: it.imageId ?? undefined,
        unitPrice: it.product?.salePrice ?? it.product?.basePrice ?? 0,
        _id: it._id,
      }))
    : guest.items.map((it) => ({ ...it }));

  const isLoading = isAuthenticated ? authLoading || authedItems === undefined : !guest.hydrated;

  const addItem = useCallback(
    (args: CartMutatorArgs) => {
      if (isAuthenticated) {
        return addAuthed({
          productId: args.productId as Id<'products'>,
          colorVariantId: args.colorVariantId,
          size: args.size,
          quantity: args.quantity,
        });
      }
      guest.setItems((prev) =>
        upsertGuest(prev, {
          productId: args.productId,
          colorVariantId: args.colorVariantId,
          size: args.size,
          quantity: args.quantity,
        })
      );
    },
    [isAuthenticated, addAuthed, guest]
  );

  const updateQty = useCallback(
    (args: CartMutatorArgs) => {
      if (isAuthenticated) {
        if (!args._id) {
          return;
        }
        return updateQtyAuthed({
          id: args._id as Id<'cartItems'>,
          quantity: args.quantity,
        });
      }
      guest.setItems((prev) =>
        prev.map((it) =>
          sameItem(it, {
            productId: args.productId,
            colorVariantId: args.colorVariantId,
            size: args.size,
            quantity: args.quantity,
          })
            ? { ...it, quantity: args.quantity }
            : it
        )
      );
    },
    [isAuthenticated, updateQtyAuthed, guest]
  );

  const remove = useCallback(
    (args: CartMutatorArgs) => {
      if (isAuthenticated) {
        if (!args._id) {
          return;
        }
        return removeAuthed({ id: args._id as Id<'cartItems'> });
      }
      guest.setItems((prev) =>
        prev.filter(
          (it) =>
            !sameItem(it, {
              productId: args.productId,
              colorVariantId: args.colorVariantId,
              size: args.size,
              quantity: args.quantity,
            })
        )
      );
    },
    [isAuthenticated, removeAuthed, guest]
  );

  return { items, isLoading, isAuthed: isAuthenticated, addItem, updateQty, remove };
}
