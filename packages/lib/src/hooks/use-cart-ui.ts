'use client';

import { useSyncExternalStore } from 'react';

let isOpen = false;
const listeners = new Set<() => void>();

const cartUI = {
  open: () => update(true),
  close: () => update(false),
  toggle: () => update(!isOpen),
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  getSnapshot: () => isOpen,
};

function update(next: boolean): void {
  if (isOpen === next) return;
  isOpen = next;
  for (const l of listeners) l();
}

export function useCartUIStore() {
  const open = useSyncExternalStore(cartUI.subscribe, cartUI.getSnapshot, () => false);
  return { isOpen: open, open: cartUI.open, close: cartUI.close, toggle: cartUI.toggle };
}
