import { createGuestStore } from './guest-store';

export interface GuestCartItem {
  productId: string;
  colorVariantId: string;
  size: string;
  quantity: number;
}

const STORAGE_KEY = 'khit:guest-cart';
const VERSION = 1;

function isCartItem(value: unknown): value is GuestCartItem {
  if (value === null || typeof value !== 'object') return false;
  const it = value as Record<string, unknown>;
  return (
    typeof it.productId === 'string' &&
    typeof it.colorVariantId === 'string' &&
    typeof it.size === 'string' &&
    typeof it.quantity === 'number' &&
    Number.isFinite(it.quantity)
  );
}

const store = createGuestStore<GuestCartItem>(STORAGE_KEY, VERSION, isCartItem);

export const readGuestCart = store.read;
export const clearGuestCart = store.clear;
export const useGuestCart = store.use;
