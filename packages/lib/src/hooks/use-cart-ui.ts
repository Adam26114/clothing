'use client';

import { createElement, Fragment, useSyncExternalStore, type ReactNode } from 'react';

interface CartUIState {
  isOpen: boolean;
}

type Listener = () => void;

const SERVER_STATE: CartUIState = { isOpen: false };
const listeners = new Set<Listener>();
let state: CartUIState = SERVER_STATE;

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CartUIState {
  return state;
}

function getServerSnapshot(): CartUIState {
  return SERVER_STATE;
}

function setState(next: CartUIState): void {
  if (next === state) {
    return;
  }
  state = next;
  emit();
}

export function useCartUIStore(): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
} {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    isOpen: snapshot.isOpen,
    open: () => setState({ isOpen: true }),
    close: () => setState({ isOpen: false }),
    toggle: () => setState({ isOpen: !state.isOpen }),
  };
}

/**
 * Shim provider kept for forward-compat. The store is module-scope today,
 * but having a Provider in the tree makes a future migration to context
 * straightforward. Renders its children unchanged.
 */
export function CartUIProvider({ children }: { children: ReactNode }): ReactNode {
  return createElement(Fragment, null, children);
}
