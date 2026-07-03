'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

interface Payload<T> {
  v: number;
  items: T[];
}

function hasStorage(): boolean {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined';
}

export interface GuestStore<T> {
  read: () => T[];
  write: (items: T[]) => void;
  clear: () => void;
  use: () => {
    items: T[];
    setItems: (next: T[] | ((prev: T[]) => T[])) => void;
    hydrated: boolean;
  };
}

export function createGuestStore<T>(
  storageKey: string,
  version: number,
  validateItem: (value: unknown) => value is T
): GuestStore<T> {
  const isPayload = (value: unknown): value is Payload<T> => {
    if (value === null || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    if (v.v !== version || !Array.isArray(v.items)) return false;
    return v.items.every(validateItem);
  };

  const read = (): T[] => {
    if (!hasStorage()) return [];
    try {
      const raw = globalThis.localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return isPayload(parsed) ? parsed.items.map((item) => ({ ...item }) as T) : [];
    } catch {
      return [];
    }
  };

  const write = (items: T[]): void => {
    if (!hasStorage()) return;
    try {
      const payload: Payload<T> = { v: version, items };
      globalThis.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
  };

  const clear = (): void => {
    if (!hasStorage()) return;
    try {
      globalThis.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const EMPTY: T[] = [];
  const listeners = new Set<() => void>();
  let snapshot: T[] = read();

  const setSnapshot = (next: T[]): void => {
    snapshot = next;
    for (const l of listeners) l();
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  if (typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('storage', (event: StorageEvent) => {
      if (event.key !== null && event.key !== storageKey) return;
      setSnapshot(read());
    });
  }

  const use = () => {
    const items = useSyncExternalStore(
      subscribe,
      () => snapshot,
      () => EMPTY
    );
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => {
      setHydrated(true);
    }, []);
    const setItems = useCallback((next: T[] | ((prev: T[]) => T[])) => {
      const resolved = typeof next === 'function' ? (next as (p: T[]) => T[])(snapshot) : next;
      setSnapshot(resolved);
      write(resolved);
    }, []);
    return { items, setItems, hydrated };
  };

  return { read, write, clear, use };
}
