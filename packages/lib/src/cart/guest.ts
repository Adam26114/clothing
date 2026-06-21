import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { GUEST_CART_STORAGE_KEY, GUEST_CART_VERSION } from '../constants';

export interface GuestCartItem {
  productId: string;
  colorVariantId: string;
  size: string;
  quantity: number;
}

interface GuestCartPayload {
  v: number;
  items: GuestCartItem[];
}

const EMPTY: GuestCartItem[] = [];

function isPayload(value: unknown): value is GuestCartPayload {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const v = value as Record<string, unknown>;
  if (v.v !== GUEST_CART_VERSION) {
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
      typeof it.size === 'string' &&
      typeof it.quantity === 'number' &&
      Number.isFinite(it.quantity)
    );
  });
}

function hasStorage(): boolean {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined';
}

export function readGuestCart(): GuestCartItem[] {
  if (!hasStorage()) {
    return [];
  }
  try {
    const raw = globalThis.localStorage.getItem(GUEST_CART_STORAGE_KEY);
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

export function writeGuestCart(items: GuestCartItem[]): void {
  if (!hasStorage()) {
    return;
  }
  try {
    const payload: GuestCartPayload = { v: GUEST_CART_VERSION, items };
    globalThis.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / serialization errors
  }
}

export function clearGuestCart(): void {
  if (!hasStorage()) {
    return;
  }
  try {
    globalThis.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  } catch {
    // ignore storage access errors
  }
}

type Listener = () => void;
type Updater = GuestCartItem[] | ((prev: GuestCartItem[]) => GuestCartItem[]);

const listeners = new Set<Listener>();
let snapshot: GuestCartItem[] = readGuestCart();

function setSnapshot(next: GuestCartItem[]): void {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

function getServerSnapshot(): GuestCartItem[] {
  return EMPTY;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
  globalThis.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== GUEST_CART_STORAGE_KEY) {
      return;
    }
    setSnapshot(readGuestCart());
  });
}

export function useGuestCart(): {
  items: GuestCartItem[];
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
        ? (next as (p: GuestCartItem[]) => GuestCartItem[])(snapshot)
        : next;
    setSnapshot(resolved);
    writeGuestCart(resolved);
  }, []);

  return { items, setItems, hydrated };
}
