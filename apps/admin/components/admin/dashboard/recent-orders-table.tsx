'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import type { Doc } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { Button } from '@workspace/ui/components/button';
import { Card } from '@workspace/ui/components/card';
import { DataTable, type ColumnDef } from '@workspace/ui/components/data-table';
import { StatusBadge, type OrderStatus } from '@workspace/ui/components/admin/status-badge';
import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';

import { orderStatusLabel } from '@/lib/order-status-label';

interface RecentOrderRow {
  _id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  createdAt: number;
  status: OrderStatus;
}

type RecentOrder = Doc<'orders'>;

function toRow(order: RecentOrder): RecentOrderRow {
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    customerName: order.customerInfo.name,
    total: order.total,
    createdAt: order.createdAt,
    status: order.status,
  };
}

function formatDateTime(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString();
  }
}

interface RecentOrdersTableProps {
  className?: string;
}

export function RecentOrdersTable({ className }: RecentOrdersTableProps = {}) {
  const stats = useQuery(api.orders.dashboardStats, {});
  const fallback = useQuery(api.orders.adminList, { pageSize: 10 });

  const orders: ReadonlyArray<RecentOrder> = React.useMemo(() => {
    if (stats && stats.recentOrders.length > 0) {
      return stats.recentOrders;
    }
    return fallback?.items ?? [];
  }, [stats, fallback]);

  const columns = React.useMemo<ColumnDef<RecentOrderRow, unknown>[]>(() => {
    return [
      {
        accessorKey: 'orderNumber',
        header: t('admin.orders.columns.orderNumber'),
        cell: ({ row }) => (
          <Link
            href={`/orders/${row.original._id}`}
            className="cursor-pointer font-mono text-sm tabular-nums hover:underline"
          >
            {row.original.orderNumber}
          </Link>
        ),
      },
      {
        id: 'customer',
        header: t('admin.orders.columns.customer'),
        cell: ({ row }) => row.original.customerName,
      },
      {
        accessorKey: 'total',
        header: () => <div className="text-end">{t('admin.orders.columns.total')}</div>,
        cell: ({ row }) => (
          <div className="text-end font-medium tabular-nums">{formatMMK(row.original.total)}</div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('admin.orders.columns.date'),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('admin.orders.columns.status'),
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} label={orderStatusLabel(row.original.status)} />
        ),
      },
    ];
  }, []);

  const rows = React.useMemo(() => orders.map(toRow), [orders]);

  return (
    <Card className={className}>
      <DataTable<RecentOrderRow>
        tableId="dashboard-recent-orders"
        columns={columns}
        data={rows}
        getRowId={(row) => row._id}
        enableRowReorder
        defaultPageSize={10}
        toolbarTitle={t('admin.dashboard.recentOrders')}
        toolbarActions={
          <Button
            render={<Link href="/orders" />}
            variant="ghost"
            size="sm"
            className="cursor-pointer"
          >
            {t('admin.dashboard.viewAll')}
          </Button>
        }
        emptyTitle={t('admin.dashboard.noRecentOrders')}
      />
    </Card>
  );
}
