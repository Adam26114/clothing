'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';
import { useDebouncedValue } from '@workspace/lib/hooks/use-debounced-value';
import { DEFAULT_INVENTORY_PAGE_SIZE } from '@workspace/lib/constants';

import { DataTable, type ColumnDef } from '@workspace/ui/components/data-table';
import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { t } from '@workspace/lib/i18n';

import {
  getInventorySearchableText,
  makeInventoryColumns,
  type InventoryRow,
} from '@/components/admin/inventory/columns';
import {
  InventoryTableToolbar,
  type StockFilter,
} from '@/components/admin/inventory/inventory-table-toolbar';
import { EmptyInventory } from '@/components/admin/inventory/empty-inventory';

export function InventoryTableClient() {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<Id<'categories'> | 'all'>('all');
  const [stockFilter, setStockFilter] = React.useState<StockFilter>('none');

  const debouncedSearch = useDebouncedValue(search, 300);
  const trimmedSearch = debouncedSearch.trim();

  const lowStockArg = stockFilter === 'low' ? true : undefined;
  const outOfStockArg = stockFilter === 'out' ? true : undefined;
  const categoryArg = category === 'all' ? undefined : category;

  const result = useQuery(api.inventory.list, {
    lowStock: lowStockArg,
    outOfStock: outOfStockArg,
    categoryId: categoryArg,
    search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    pageSize: DEFAULT_INVENTORY_PAGE_SIZE,
  });
  const categoriesResult = useQuery(api.categories.listActive, {});

  const columns = React.useMemo<ColumnDef<InventoryRow, unknown>[]>(
    () => makeInventoryColumns(),
    []
  );

  const rows = React.useMemo<InventoryRow[]>(() => result?.items ?? [], [result]);
  const total = result?.total ?? 0;
  const shown = rows.length;

  const hasActiveFilter = search.length > 0 || category !== 'all' || stockFilter !== 'none';

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t('admin.inventory.title')} />
      <InventoryTableToolbar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        categories={categoriesResult ?? []}
        onClear={() => {
          setSearch('');
          setCategory('all');
          setStockFilter('none');
        }}
        shown={shown}
        total={total}
      />
      {result === undefined || categoriesResult === undefined ? (
        <DataTable<InventoryRow>
          tableId="admin-inventory"
          columns={columns}
          data={[]}
          isLoading
          defaultPageSize={DEFAULT_INVENTORY_PAGE_SIZE}
          getSearchableText={getInventorySearchableText}
          getRowId={(row) => row._id}
        />
      ) : rows.length === 0 ? (
        <EmptyInventory hasFilters={hasActiveFilter} />
      ) : (
        <DataTable<InventoryRow>
          tableId="admin-inventory"
          columns={columns}
          data={rows}
          defaultPageSize={DEFAULT_INVENTORY_PAGE_SIZE}
          getSearchableText={getInventorySearchableText}
          getRowId={(row) => row._id}
          emptyTitle={t('admin.inventory.noResults')}
          emptyDescription={t('admin.inventory.noResultsDescription')}
        />
      )}
    </div>
  );
}
