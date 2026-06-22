'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import { PencilIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { Input } from '@workspace/ui/components/input';
import { cn } from '@workspace/ui/lib/utils';
import { t } from '@workspace/lib/i18n';

import type { InventoryRow } from './columns';

interface StockCellEditorProps {
  row: InventoryRow;
}

function validateQty(raw: string): { ok: true; value: number } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: true, value: 0 };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false };
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return { ok: false };
  }
  return { ok: true, value: parsed };
}

function stockTextClass(stock: number): string {
  if (stock === 0) {
    return 'text-destructive';
  }
  if (stock < 5) {
    return 'text-amber-600 dark:text-amber-400';
  }
  return 'text-foreground';
}

export function StockCellEditor({ row }: StockCellEditorProps) {
  const setStock = useMutation(api.inventory.setStock);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<string>(String(row.stock));
  const [pending, setPending] = React.useState(false);
  const [optimisticStock, setOptimisticStock] = React.useState<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [prevRowStock, setPrevRowStock] = React.useState<number>(row.stock);

  const displayStock = optimisticStock ?? row.stock;

  if (row.stock !== prevRowStock) {
    setPrevRowStock(row.stock);
    if (!editing && optimisticStock === null) {
      setDraft(String(row.stock));
    }
  }

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const beginEdit = React.useCallback(() => {
    setDraft(String(displayStock));
    setEditing(true);
  }, [displayStock]);

  const commit = React.useCallback(
    async (raw: string) => {
      const result = validateQty(raw);
      if (!result.ok) {
        toast.error(t('admin.inventory.errorInvalid'));
        setDraft(String(displayStock));
        setEditing(false);
        return;
      }
      const newQty = result.value;
      if (newQty === row.stock) {
        setEditing(false);
        return;
      }
      setPending(true);
      const previousStock = displayStock;
      setOptimisticStock(newQty);
      try {
        await setStock({
          productId: row.productId as Id<'products'>,
          variantId: row.variantId,
          size: row.size,
          qty: newQty,
        });
        toast.success(t('admin.inventory.stockUpdated'));
        setEditing(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('admin.inventory.errorUpdate');
        toast.error(message);
        setOptimisticStock(previousStock);
        setDraft(String(previousStock));
        setEditing(false);
      } finally {
        setPending(false);
        window.setTimeout(() => setOptimisticStock(null), 300);
      }
    },
    [displayStock, row.productId, row.size, row.stock, row.variantId, setStock]
  );

  const cancel = React.useCallback(() => {
    setDraft(String(displayStock));
    setEditing(false);
  }, [displayStock]);

  if (editing) {
    return (
      <div className="flex items-center justify-end">
        <Input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={draft}
          disabled={pending}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            void commit(draft);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void commit(draft);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              cancel();
            }
          }}
          className="h-7 w-20 text-end tabular-nums"
          aria-label={t('admin.inventory.editStock')}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={beginEdit}
        disabled={pending}
        className={cn(
          'hover:bg-muted focus-visible:ring-ring/50 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm tabular-nums transition-colors focus-visible:ring-3 focus-visible:outline-none',
          stockTextClass(displayStock)
        )}
        aria-label={`${t('admin.inventory.editStock')}: ${displayStock}`}
      >
        <span className="font-medium">{displayStock.toLocaleString('en-US')}</span>
        <PencilIcon className="text-muted-foreground size-3.5" aria-hidden />
      </button>
    </div>
  );
}
