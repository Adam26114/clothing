import { useCallback, useMemo, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

const STORAGE_KEY_PREFIX = 'khit:datatable:order:';

function readIds(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function useStoredRowOrder<T>(
  tableId: string,
  items: T[],
  getRowId: (item: T) => string
): { ordered: T[]; reorder: (oldIndex: number, newIndex: number) => void } {
  const key = `${STORAGE_KEY_PREFIX}${tableId}`;
  const [savedIds, setSavedIds] = useState<string[]>(() => readIds(key));

  const ordered = useMemo(() => {
    if (savedIds.length === 0) return items;
    const byId = new Map(items.map((item) => [getRowId(item), item]));
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
      if (!seen.has(id)) result.push(item);
    }
    return result;
  }, [items, savedIds, getRowId]);

  const reorder = useCallback(
    (oldIndex: number, newIndex: number) => {
      const next = arrayMove(items.map(getRowId), oldIndex, newIndex);
      writeIds(key, next);
      setSavedIds(next);
    },
    [items, getRowId, key]
  );

  return { ordered, reorder };
}
