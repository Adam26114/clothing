'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';
import { useStoredRowOrder } from '@workspace/lib/hooks/use-stored-row-order';
import { DEFAULT_INVENTORY_PAGE_SIZE, LOW_STOCK_THRESHOLD } from '@workspace/lib/constants';

import { DataTable, type ColumnDef } from '@workspace/ui/components/data-table';
import { t } from '@workspace/lib/i18n';

import {
  getInventorySearchableText,
  makeInventoryColumns,
  type InventoryRow,
} from '@/components/admin/inventory/columns';
import { InventoryFilters, type StockFilter } from '@/components/admin/inventory/inventory-filters';
import { EmptyInventory } from '@/components/admin/inventory/empty-inventory';

const TABLE_ID = 'admin-inventory';

interface InventoryTableClientProps {
  hideHeader?: boolean;
}

export function InventoryTableClient({ hideHeader = false }: InventoryTableClientProps = {}) {
  const [category, setCategory] = React.useState<Id<'categories'> | 'all'>('all');
  const [stockFilter, setStockFilter] = React.useState<StockFilter>('none');

  const lowStockArg = stockFilter === 'low' ? true : undefined;
  const outOfStockArg = stockFilter === 'out' ? true : undefined;
  const categoryArg = category === 'all' ? undefined : category;

  const settings = useQuery(api.storeSettings.get, {});
  const lowStockThreshold = resolveLowStockThreshold(settings);

  const result = useQuery(api.inventory.list, {
    lowStock: lowStockArg,
    outOfStock: outOfStockArg,
    categoryId: categoryArg,
    threshold: lowStockThreshold,
    pageSize: DEFAULT_INVENTORY_PAGE_SIZE,
  });
  const categoriesResult = useQuery(api.categories.listActive, {});

  const columns = React.useMemo<ColumnDef<InventoryRow, unknown>[]>(
    () => makeInventoryColumns(),
    []
  );

  const rows = React.useMemo<InventoryRow[]>(() => result?.items ?? [], [result]);

  const { ordered, reorder } = useStoredRowOrder<InventoryRow>(TABLE_ID, rows, (row) => row._id);

  const total = result?.total ?? 0;
  const hasActiveFilter = category !== 'all' || stockFilter !== 'none';

  return (
    <DataTable<InventoryRow>
      tableId={TABLE_ID}
      columns={columns}
      data={ordered}
      isLoading={result === undefined || categoriesResult === undefined}
      defaultPageSize={DEFAULT_INVENTORY_PAGE_SIZE}
      getSearchableText={getInventorySearchableText}
      getRowId={(row) => row._id}
      toolbarTitle={hideHeader ? undefined : t('admin.inventory.title')}
      hideToolbarHeader={hideHeader}
      toolbarFilters={
        <InventoryFilters
          category={category}
          onCategoryChange={setCategory}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          categories={categoriesResult ?? []}
        />
      }
      toolbarSummary={
        <span className="text-muted-foreground text-xs tabular-nums">
          {t('admin.inventory.showingOf', 'en', { shown: ordered.length, total })}
        </span>
      }
      emptyState={<EmptyInventory hasFilters={hasActiveFilter} />}
      enableRowReorder
      onReorder={reorder}
    />
  );
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
