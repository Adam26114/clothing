'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { useAuth } from '@workspace/lib/auth/use-auth';
import { GUEST_WISHLIST_STORAGE_KEY, GUEST_WISHLIST_VERSION } from './constants';

export interface GuestWishlistItem {
  productId: string;
  colorVariantId: string;
  size: string;
}

interface GuestWishlistPayload {
  v: number;
  items: GuestWishlistItem[];
}

const EMPTY: GuestWishlistItem[] = [];

function isPayload(value: unknown): value is GuestWishlistPayload {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const v = value as Record<string, unknown>;
  if (v.v !== GUEST_WISHLIST_VERSION) {
    return false;
  }
  if (!Array.isArray(v.items)) {
    return false;
  }
  return v.items.every((item) => {
    if (item === null || typeof item !== 'object') {
      return false;
    }
    const it = item as Record<string, unknown>;
    return (
      typeof it.productId === 'string' &&
      typeof it.colorVariantId === 'string' &&
      typeof it.size === 'string'
    );
  });
}

function hasStorage(): boolean {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined';
}

export function readGuestWishlist(): GuestWishlistItem[] {
  if (!hasStorage()) {
    return [];
  }
  try {
    const raw = globalThis.localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isPayload(parsed)) {
      return [];
    }
    return parsed.items.map((item) => ({ ...item }));
  } catch {
    return [];
  }
}

export function writeGuestWishlist(items: GuestWishlistItem[]): void {
  if (!hasStorage()) {
    return;
  }
  try {
    const payload: GuestWishlistPayload = { v: GUEST_WISHLIST_VERSION, items };
    globalThis.localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / serialization errors
  }
}

export function clearGuestWishlist(): void {
  if (!hasStorage()) {
    return;
  }
  try {
    globalThis.localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
  } catch {
    // ignore storage access errors
  }
}

type Listener = () => void;
type Updater = GuestWishlistItem[] | ((prev: GuestWishlistItem[]) => GuestWishlistItem[]);

const listeners = new Set<Listener>();
let snapshot: GuestWishlistItem[] = readGuestWishlist();

function setSnapshot(next: GuestWishlistItem[]): void {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

function getServerSnapshot(): GuestWishlistItem[] {
  return EMPTY;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
  globalThis.addEventListener('storage', (event: StorageEvent) => {
    if (event.key !== null && event.key !== GUEST_WISHLIST_STORAGE_KEY) {
      return;
    }
    setSnapshot(readGuestWishlist());
  });
}

function sameItem(a: GuestWishlistItem, b: GuestWishlistItem): boolean {
  return a.productId === b.productId && a.colorVariantId === b.colorVariantId && a.size === b.size;
}

function upsertGuest(items: GuestWishlistItem[], next: GuestWishlistItem): GuestWishlistItem[] {
  const idx = items.findIndex((i) => sameItem(i, next));
  if (idx === -1) {
    return [...items, next];
  }
  const existing = items[idx];
  if (!existing) {
    return items;
  }
  const updated = items.slice();
  updated[idx] = { ...existing };
  return updated;
}

export function useGuestWishlist(): {
  items: GuestWishlistItem[];
  setItems: (next: Updater) => void;
  hydrated: boolean;
} {
  const items = useSyncExternalStore(subscribe, () => snapshot, getServerSnapshot);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const setItems = useCallback((next: Updater) => {
    const resolved =
      typeof next === 'function'
        ? (next as (p: GuestWishlistItem[]) => GuestWishlistItem[])(snapshot)
        : next;
    setSnapshot(resolved);
    writeGuestWishlist(resolved);
  }, []);

  return { items, setItems, hydrated };
}

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
  const guest = useGuestWishlist();
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
        if (!args._id) {
          return;
        }
        return removeAuthed({ id: args._id as Id<'wishlistItems'> });
      }
      guest.setItems((prev) => prev.filter((it) => !sameItem(it, args)));
    },
    [isAuthenticated, removeAuthed, guest]
  );

  const clear = useCallback(() => {
    if (isAuthenticated) {
      return clearAuthed({});
    }
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
    if (isLoading || !isAuthenticated || inFlight.current) {
      return;
    }
    const guestItems = readGuestWishlist();
    if (guestItems.length === 0) {
      return;
    }
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
        clearGuestWishlist();
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
