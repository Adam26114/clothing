import { useCallback, useMemo, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

const STORAGE_KEY_PREFIX = 'khit:datatable:order:';

function readSavedIds(storageKey: string): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

function writeSavedIds(storageKey: string, ids: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function useStoredRowOrder<T>(
  tableId: string,
  items: T[],
  getRowId: (item: T) => string
): { ordered: T[]; reorder: (oldIndex: number, newIndex: number) => void } {
  const storageKey = `${STORAGE_KEY_PREFIX}${tableId}`;

  const [savedIds, setSavedIds] = useState<string[]>(() => readSavedIds(storageKey));

  const ordered = useMemo(() => {
    if (savedIds.length === 0) {
      return items;
    }
    const byId = new Map<string, T>();
    for (const item of items) {
      byId.set(getRowId(item), item);
    }
    const seen = new Set<string>();
    const result: T[] = [];
    for (const id of savedIds) {
      const item = byId.get(id);
      if (item !== undefined && !seen.has(id)) {
        result.push(item);
        seen.add(id);
      }
    }
    for (const item of items) {
      const id = getRowId(item);
      if (!seen.has(id)) {
        result.push(item);
        seen.add(id);
      }
    }
    return result;
  }, [items, savedIds, getRowId]);

  const reorder = useCallback(
    (oldIndex: number, newIndex: number) => {
      const ids = items.map(getRowId);
      const next = arrayMove(ids, oldIndex, newIndex);
      writeSavedIds(storageKey, next);
      setSavedIds(next);
    },
    [items, getRowId, storageKey]
  );

  return { ordered, reorder };
}
