'use client';

import Link from 'next/link';
import {
  RowActions,
  RowCheckbox,
  SelectionCheckbox,
  SortableHeader,
  type ColumnDef,
} from '@workspace/ui/components/data-table';
import { Badge } from '@workspace/ui/components/badge';
import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import { StatusBadge, type OrderStatus } from '@workspace/ui/components/admin/status-badge';
import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';

export interface OrderRow {
  _id: string;
  orderNumber: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  total: number;
  deliveryMethod: 'shipping' | 'pickup';
  status: OrderStatus;
  createdAt: number;
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

function deliveryLabel(method: 'shipping' | 'pickup'): string {
  return method === 'shipping'
    ? t('admin.orders.deliveryShipping')
    : t('admin.orders.deliveryPickup');
}

function getOrderSearchableText(row: OrderRow): string {
  return [
    row.orderNumber,
    row.customerInfo.name,
    row.customerInfo.email,
    row.customerInfo.phone,
  ].join(' ');
}

export const orderSearchableText = getOrderSearchableText;

export function makeOrderColumns(): ColumnDef<OrderRow, unknown>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => <SelectionCheckbox table={table} />,
      cell: ({ row }) => <RowCheckbox row={row} />,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'orderNumber',
      header: ({ column }) => (
        <SortableHeader
          label={t('admin.orders.columns.orderNumber')}
          sorted={column.getIsSorted()}
          onToggle={column.getToggleSortingHandler()}
        />
      ),
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
      header: ({ column }) => (
        <SortableHeader
          label={t('admin.orders.columns.customer')}
          sorted={column.getIsSorted()}
          onToggle={column.getToggleSortingHandler()}
        />
      ),
      accessorFn: (row) => row.customerInfo.name,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.customerInfo.name}</span>
          <span className="text-muted-foreground text-xs">{row.original.customerInfo.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <SortableHeader
          label={t('admin.orders.columns.date')}
          sorted={column.getIsSorted()}
          onToggle={column.getToggleSortingHandler()}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: 'total',
      header: () => <div className="text-end">{t('admin.orders.columns.total')}</div>,
      cell: ({ row }) => (
        <div className="text-end font-medium tabular-nums">{formatMMK(row.original.total)}</div>
      ),
    },
    {
      accessorKey: 'deliveryMethod',
      header: t('admin.orders.columns.delivery'),
      cell: ({ row }) => (
        <Badge variant="outline" className="cursor-default">
          {deliveryLabel(row.original.deliveryMethod)}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: t('admin.orders.columns.status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('admin.orders.columns.actions')}</span>,
      cell: ({ row }) => (
        <RowActions>
          <DropdownMenuItem
            className="cursor-pointer"
            render={<Link href={`/orders/${row.original._id}`} />}
          >
            {t('admin.orders.viewDetails')}
          </DropdownMenuItem>
        </RowActions>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
