'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { CheckCircle2Icon } from 'lucide-react';
import { api } from '@workspace/convex/_generated/api';
import { LOW_STOCK_THRESHOLD } from '@workspace/lib/constants';

import { Button } from '@workspace/ui/components/button';
import { Card } from '@workspace/ui/components/card';
import { DataTable, type ColumnDef } from '@workspace/ui/components/data-table';
import { t } from '@workspace/lib/i18n';

interface LowStockRow {
  productId: string;
  variantId: string;
  productName: string;
  colorName: string;
  colorHex: string;
  size: string;
  stock: number;
}

interface LowStockItemRaw {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  colorName: string;
  colorHex: string;
  size: string;
  stock: number;
}

function resolveLowStockThreshold(
  settings: { lowStockThreshold?: number } | null | undefined
): number {
  if (settings && typeof settings === 'object' && 'lowStockThreshold' in settings) {
    const value = settings.lowStockThreshold;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return LOW_STOCK_THRESHOLD;
}

interface LowStockTableProps {
  className?: string;
}

export function LowStockTable({ className }: LowStockTableProps = {}) {
  const settings = useQuery(api.storeSettings.get, {});
  const lowStock = useQuery(api.products.lowStockCount, {
    limit: 10,
    threshold: resolveLowStockThreshold(settings),
  });

  const items: ReadonlyArray<LowStockItemRaw> = lowStock ?? [];

  const columns = React.useMemo<ColumnDef<LowStockRow, unknown>[]>(() => {
    return [
      {
        id: 'product',
        header: t('admin.dashboard.lowStockColumn.product'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="border-border inline-block size-3.5 shrink-0 rounded-full border"
              style={{ backgroundColor: row.original.colorHex }}
            />
            <span className="text-sm">{row.original.productName}</span>
          </div>
        ),
      },
      {
        id: 'variant',
        header: t('admin.dashboard.lowStockColumn.variant'),
        cell: ({ row }) => row.original.colorName,
      },
      {
        accessorKey: 'size',
        header: t('admin.dashboard.lowStockColumn.size'),
        cell: ({ row }) => (
          <span className="font-mono text-sm tabular-nums">{row.original.size}</span>
        ),
      },
      {
        accessorKey: 'stock',
        header: () => <div className="text-end">{t('admin.dashboard.lowStockColumn.stock')}</div>,
        cell: ({ row }) => (
          <div
            className={
              row.original.stock === 0
                ? 'text-destructive text-end font-medium tabular-nums'
                : 'text-end font-medium tabular-nums'
            }
          >
            {row.original.stock}
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">{t('admin.dashboard.lowStockColumn.actions')}</span>
        ),
        cell: () => (
          <Button
            render={<Link href="/inventory" />}
            variant="ghost"
            size="sm"
            className="cursor-pointer"
          >
            {t('admin.dashboard.restock')}
          </Button>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ];
  }, []);

  const rows: LowStockRow[] = [...items];

  return (
    <Card className={className}>
      <DataTable<LowStockRow>
        tableId="dashboard-low-stock"
        columns={columns}
        data={rows}
        getRowId={(row) => `${row.productId}-${row.variantId}-${row.size}`}
        enableRowReorder
        defaultPageSize={10}
        toolbarTitle={t('admin.dashboard.lowStockAlert')}
        toolbarActions={
          <Button
            render={<Link href="/inventory" />}
            variant="ghost"
            size="sm"
            className="cursor-pointer"
          >
            {t('admin.dashboard.manageInventory')}
          </Button>
        }
        emptyState={
          <div className="text-muted-foreground flex items-center gap-2 p-6 text-sm">
            <CheckCircle2Icon className="text-primary size-4" aria-hidden />
            <span>{t('admin.dashboard.noLowStock')}</span>
          </div>
        }
      />
    </Card>
  );
}
