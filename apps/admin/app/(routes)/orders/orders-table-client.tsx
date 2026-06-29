'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import type { Doc } from '@workspace/convex/_generated/dataModel';
import { useStoredRowOrder } from '@workspace/lib/hooks/use-stored-row-order';

import { DataTable, type ColumnDef } from '@workspace/ui/components/data-table';
import { t } from '@workspace/lib/i18n';

import {
  makeOrderColumns,
  orderSearchableText,
  type OrderRow,
} from '@/components/admin/orders/columns';
import { OrdersFilters, type OrderStatusFilter } from '@/components/admin/orders/orders-filters';
import {
  dateRangeToBounds,
  type DateRangeValue,
} from '@/components/admin/orders/date-range-picker';
import { EmptyOrders } from '@/components/admin/orders/empty-orders';
import {
  OrdersTableBulkExport,
  OrdersTableBulkStatus,
} from '@/components/admin/orders/orders-table-bulk';

const DEFAULT_PAGE_SIZE = 20;
const TABLE_ID = 'admin-orders';

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

interface OrdersTableClientProps {
  hideHeader?: boolean;
}

export function OrdersTableClient({ hideHeader = false }: OrdersTableClientProps = {}) {
  const [status, setStatus] = React.useState<OrderStatusFilter>('all');
  const [dateRange, setDateRange] = React.useState<DateRangeValue>({ preset: 'all' });

  const statusArg = status === 'all' ? undefined : status;
  const { dateFrom, dateTo } = React.useMemo(() => dateRangeToBounds(dateRange), [dateRange]);

  const result = useQuery(api.orders.adminList, {
    status: statusArg,
    dateFrom,
    dateTo,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const columns = React.useMemo<ColumnDef<OrderRow, unknown>[]>(() => makeOrderColumns(), []);

  const rows = React.useMemo<OrderRow[]>(
    () => (result?.items ?? []).map((order) => toOrderRow(order)),
    [result]
  );

  const { ordered, reorder } = useStoredRowOrder<OrderRow>(TABLE_ID, rows, (row) => row._id);

  const total = result?.total ?? 0;

  return (
    <DataTable<OrderRow>
      tableId={TABLE_ID}
      columns={columns}
      data={ordered}
      isLoading={result === undefined}
      defaultPageSize={DEFAULT_PAGE_SIZE}
      globalSearchPlaceholder={t('admin.orders.searchPlaceholder')}
      getSearchableText={orderSearchableText}
      getRowId={(row) => row._id}
      toolbarTitle={hideHeader ? undefined : t('admin.orders.title')}
      hideToolbarHeader={hideHeader}
      toolbarFilters={
        <OrdersFilters
          status={status}
          onStatusChange={setStatus}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      }
      toolbarSummary={
        <span className="text-muted-foreground text-xs tabular-nums">
          {t('admin.orders.showingOf', 'en', { shown: ordered.length, total })}
        </span>
      }
      emptyState={<EmptyOrders />}
      bulkActions={(selected) => (
        <>
          <OrdersTableBulkStatus selectedRows={selected} />
          <OrdersTableBulkExport selectedRows={selected} />
        </>
      )}
      enableRowReorder
      onReorder={reorder}
    />
  );
}
