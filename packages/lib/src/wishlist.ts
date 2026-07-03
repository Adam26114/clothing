'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { useAuth } from '@workspace/lib/auth/use-auth';
import { createGuestStore } from '@workspace/lib/cart/guest-store';

export interface GuestWishlistItem {
  productId: string;
  colorVariantId: string;
  size: string;
}

const STORAGE_KEY = 'khit:guest-wishlist';
const VERSION = 1;

function isWishlistItem(value: unknown): value is GuestWishlistItem {
  if (value === null || typeof value !== 'object') return false;
  const it = value as Record<string, unknown>;
  return (
    typeof it.productId === 'string' &&
    typeof it.colorVariantId === 'string' &&
    typeof it.size === 'string'
  );
}

const guestStore = createGuestStore<GuestWishlistItem>(STORAGE_KEY, VERSION, isWishlistItem);

export interface UnifiedWishlistItem {
  _id?: string;
  productId: string;
  productSlug?: string;
  productName?: string;
  colorVariantId: string | null;
  colorName?: string | null;
  colorHex?: string | null;
  size: string | null;
  imageId?: string | null;
  unitPrice?: number;
  addedAt?: number;
}

export interface WishlistMutatorArgs {
  productId: string;
  colorVariantId: string;
  size: string;
}

function sameItem(a: GuestWishlistItem, b: GuestWishlistItem): boolean {
  return a.productId === b.productId && a.colorVariantId === b.colorVariantId && a.size === b.size;
}

function upsertGuest(items: GuestWishlistItem[], next: GuestWishlistItem): GuestWishlistItem[] {
  const idx = items.findIndex((i) => sameItem(i, next));
  if (idx === -1) return [...items, next];
  const updated = items.slice();
  updated[idx] = { ...items[idx]! };
  return updated;
}

export function useWishlist(): {
  items: UnifiedWishlistItem[];
  count: number;
  isLoading: boolean;
  isAuthed: boolean;
  add: (args: WishlistMutatorArgs) => Promise<unknown> | void;
  remove: (args: WishlistMutatorArgs & { _id?: string }) => Promise<unknown> | void;
  clear: () => Promise<unknown> | void;
  isInWishlist: (args: WishlistMutatorArgs) => boolean;
} {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const guest = guestStore.use();
  const authedItems = useQuery(api.wishlistItems.list, isAuthenticated ? {} : 'skip');
  const addAuthed = useMutation(api.wishlistItems.add);
  const removeAuthed = useMutation(api.wishlistItems.remove);
  const clearAuthed = useMutation(api.wishlistItems.clear);

  const items: UnifiedWishlistItem[] = useMemo(() => {
    if (isAuthenticated) {
      return (authedItems?.items ?? []).map((it) => ({
        _id: it._id,
        productId: it.productId,
        productSlug: it.productSlug,
        productName: it.productName,
        colorVariantId: it.colorVariantId,
        colorName: it.colorName,
        colorHex: it.colorHex,
        size: it.size,
        imageId: it.imageId,
        unitPrice: it.unitPrice,
        addedAt: it.addedAt,
      }));
    }
    return guest.items.map((it) => ({ ...it }));
  }, [isAuthenticated, authedItems, guest.items]);

  const isLoading = isAuthenticated ? authLoading || authedItems === undefined : !guest.hydrated;

  const add = useCallback(
    (args: WishlistMutatorArgs) => {
      if (isAuthenticated) {
        return addAuthed({
          productId: args.productId as Id<'products'>,
          colorVariantId: args.colorVariantId,
          size: args.size,
        });
      }
      guest.setItems((prev) => upsertGuest(prev, { ...args }));
    },
    [isAuthenticated, addAuthed, guest]
  );

  const remove = useCallback(
    (args: WishlistMutatorArgs & { _id?: string }) => {
      if (isAuthenticated) {
        if (!args._id) return;
        return removeAuthed({ id: args._id as Id<'wishlistItems'> });
      }
      guest.setItems((prev) => prev.filter((it) => !sameItem(it, args)));
    },
    [isAuthenticated, removeAuthed, guest]
  );

  const clear = useCallback(() => {
    if (isAuthenticated) return clearAuthed({});
    guest.setItems(() => []);
  }, [isAuthenticated, clearAuthed, guest]);

  const isInWishlist = useCallback(
    (args: WishlistMutatorArgs) =>
      items.some(
        (it) =>
          it.productId === args.productId &&
          it.colorVariantId === args.colorVariantId &&
          it.size === args.size
      ),
    [items]
  );

  return {
    items,
    count: items.length,
    isLoading,
    isAuthed: isAuthenticated,
    add,
    remove,
    clear,
    isInWishlist,
  };
}

export interface UseWishlistMergeOnAuthOptions {
  onShowToast?: (msg: string) => void;
}

export function useWishlistMergeOnAuth(options?: UseWishlistMergeOnAuthOptions): void {
  const { isAuthenticated, isLoading } = useAuth();
  const addAuthed = useMutation(api.wishlistItems.add);
  const inFlight = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || inFlight.current) return;
    const guestItems = guestStore.read();
    if (guestItems.length === 0) return;
    inFlight.current = true;
    let merged = 0;
    let skipped = 0;
    Promise.all(
      guestItems.map((item) =>
        addAuthed({
          productId: item.productId as Id<'products'>,
          colorVariantId: item.colorVariantId,
          size: item.size,
        })
          .then(() => {
            merged++;
          })
          .catch((err: unknown) => {
            skipped++;
            console.warn('Wishlist merge: skipping item', err);
          })
      )
    )
      .then(() => {
        guestStore.clear();
        if (merged > 0) {
          const msg =
            skipped > 0
              ? `Saved ${merged} item${merged === 1 ? '' : 's'} to wishlist (${skipped} unavailable)`
              : `Saved ${merged} item${merged === 1 ? '' : 's'} to your wishlist`;
          options?.onShowToast?.(msg);
        }
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, [isAuthenticated, isLoading, addAuthed, options]);
}
