'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import type { Doc } from '@workspace/convex/_generated/dataModel';

import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { Button } from '@workspace/ui/components/button';
import { DataTable, type ColumnDef } from '@workspace/ui/components/data-table';
import { t } from '@workspace/lib/i18n';

import {
  makeOrderColumns,
  orderSearchableText,
  type OrderRow,
} from '@/components/admin/orders/columns';
import {
  OrdersTableToolbar,
  type OrderStatusFilter,
} from '@/components/admin/orders/orders-table-toolbar';
import { EmptyOrders } from '@/components/admin/orders/empty-orders';

const DEFAULT_PAGE_SIZE = 20;

function toOrderRow(order: Doc<'orders'>): OrderRow {
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    customerInfo: order.customerInfo,
    total: order.total,
    deliveryMethod: order.deliveryMethod,
    status: order.status,
    createdAt: order.createdAt,
  };
}

export function OrdersTableClient() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<OrderStatusFilter>('all');

  const debouncedSearch = useDebouncedSearch(search, 300);

  const statusArg = status === 'all' ? undefined : status;
  const searchArg = debouncedSearch.trim() === '' ? undefined : debouncedSearch.trim();

  const result = useQuery(api.orders.adminList, {
    status: statusArg,
    search: searchArg,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const columns = React.useMemo<ColumnDef<OrderRow, unknown>[]>(() => makeOrderColumns(), []);

  const rows = React.useMemo<OrderRow[]>(
    () => (result?.items ?? []).map((order) => toOrderRow(order)),
    [result]
  );

  const total = result?.total ?? 0;
  const shown = rows.length;

  const hasActiveFilter = search.length > 0 || status !== 'all';

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t('admin.orders.title')} />
      <OrdersTableToolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        onClear={() => {
          setSearch('');
          setStatus('all');
        }}
        shown={shown}
        total={total}
      />
      {result === undefined ? (
        <DataTable<OrderRow>
          tableId="admin-orders"
          columns={columns}
          data={[]}
          isLoading
          defaultPageSize={DEFAULT_PAGE_SIZE}
          globalSearchPlaceholder={t('admin.orders.searchPlaceholder')}
          getSearchableText={orderSearchableText}
          getRowId={(row) => row._id}
        />
      ) : rows.length === 0 ? (
        <div className="flex flex-col gap-4">
          {hasActiveFilter ? (
            <DataTable<OrderRow>
              tableId="admin-orders"
              columns={columns}
              data={rows}
              defaultPageSize={DEFAULT_PAGE_SIZE}
              globalSearchPlaceholder={t('admin.orders.searchPlaceholder')}
              getSearchableText={orderSearchableText}
              getRowId={(row) => row._id}
              emptyTitle={t('admin.orders.noResults')}
              emptyDescription={t('admin.orders.noResultsDescription')}
            />
          ) : (
            <EmptyOrders />
          )}
        </div>
      ) : (
        <DataTable<OrderRow>
          tableId="admin-orders"
          columns={columns}
          data={rows}
          defaultPageSize={DEFAULT_PAGE_SIZE}
          globalSearchPlaceholder={t('admin.orders.searchPlaceholder')}
          getSearchableText={orderSearchableText}
          getRowId={(row) => row._id}
          emptyTitle={t('admin.orders.noResults')}
          emptyDescription={t('admin.orders.noResultsDescription')}
          emptyAction={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatus('all');
              }}
              className="cursor-pointer"
            >
              {t('admin.orders.clearFilters')}
            </Button>
          }
        />
      )}
    </div>
  );
}

function useDebouncedSearch(value: string, delayMs: number): string {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
