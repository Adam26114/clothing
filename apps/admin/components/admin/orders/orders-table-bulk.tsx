'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { toast } from 'sonner';

import { Button } from '@workspace/ui/components/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { t } from '@workspace/lib/i18n';
import { formatMMK } from '@workspace/lib/formatMMK';
import { api } from '@workspace/convex/_generated/api';
import type { OrderStatus } from '@workspace/ui/components/admin/status-badge';

import { orderStatusLabel } from '@/lib/order-status-label';
import type { OrderRow } from '@/components/admin/orders/columns';

const STATUS_OPTIONS: ReadonlyArray<{ value: OrderStatus; labelKey: string }> = [
  { value: 'pending', labelKey: 'order.statusPending' },
  { value: 'confirmed', labelKey: 'order.statusConfirmed' },
  { value: 'processing', labelKey: 'order.statusProcessing' },
  { value: 'shipped', labelKey: 'order.statusShipped' },
  { value: 'delivered', labelKey: 'order.statusDelivered' },
  { value: 'cancelled', labelKey: 'order.statusCancelled' },
];

function isOrderStatus(value: string): value is OrderStatus {
  return STATUS_OPTIONS.some((option) => option.value === value);
}

interface OrdersTableBulkStatusProps {
  selectedRows: OrderRow[];
}

export function OrdersTableBulkStatus({ selectedRows }: OrdersTableBulkStatusProps) {
  const bulkUpdateStatus = useMutation(api.orders.bulkUpdateStatus);
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<OrderStatus | null>(null);
  const [pending, setPending] = React.useState(false);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (pending) {
        return;
      }
      setOpen(next);
      if (!next) {
        setStatus(null);
      }
    },
    [pending]
  );

  const handleConfirm = React.useCallback(async () => {
    if (!status) {
      return;
    }
    setPending(true);
    try {
      const result = await bulkUpdateStatus({
        ids: selectedRows.map((row) => row._id as Id<'orders'>),
        status,
      });
      if (result.skipped === 0) {
        toast.success(
          t('admin.orders.bulk.statusUpdatedAll', 'en', {
            count: result.updated,
            status: orderStatusLabel(status),
          })
        );
      } else {
        toast.success(
          t('admin.orders.bulk.statusUpdatedPartial', 'en', {
            updated: result.updated,
            total: result.updated + result.skipped,
            skipped: result.skipped,
          })
        );
      }
      setOpen(false);
      setStatus(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('admin.orders.error.bulkUpdateStatus');
      toast.error(message);
    } finally {
      setPending(false);
    }
  }, [bulkUpdateStatus, selectedRows, status]);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="cursor-pointer"
      >
        {t('admin.orders.bulk.statusUpdate')}
      </Button>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('admin.orders.bulk.statusUpdateTitle', 'en', { count: selectedRows.length })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {status ? (
              t('admin.orders.bulk.statusUpdateDescription', 'en', {
                status: orderStatusLabel(status),
              })
            ) : (
              <span className="text-muted-foreground">
                {t('admin.orders.bulk.statusUpdateNoneSelected')}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Select
            value={status ?? undefined}
            onValueChange={(value) => {
              if (value !== null && isOrderStatus(value)) {
                setStatus(value);
              }
            }}
            disabled={pending}
          >
            <SelectTrigger
              size="sm"
              className="w-full cursor-pointer"
              aria-label={t('admin.orders.bulk.statusUpdate')}
            >
              <SelectValue placeholder={t('admin.orders.bulk.statusUpdate')} />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="cursor-pointer">
            {t('admin.orders.bulk.statusUpdateCancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending || status === null}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            className="cursor-pointer"
          >
            {t('admin.orders.bulk.statusUpdateConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const EXPORT_DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const EXPORT_COLUMNS: ReadonlyArray<{
  header: string;
  value: (row: OrderRow) => string;
}> = [
  { header: 'Order #', value: (row) => row.orderNumber },
  { header: 'Customer', value: (row) => row.customerInfo.name },
  { header: 'Email', value: (row) => row.customerInfo.email },
  { header: 'Phone', value: (row) => row.customerInfo.phone },
  { header: 'Total', value: (row) => formatMMK(row.total) },
  { header: 'Delivery', value: (row) => row.deliveryMethod },
  { header: 'Status', value: (row) => row.status },
  { header: 'Date', value: (row) => EXPORT_DATE_FORMAT.format(new Date(row.createdAt)) },
];

function escapeCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv<T>(
  rows: readonly T[],
  columns: ReadonlyArray<{ header: string; value: (row: T) => string }>
): string {
  const lines = [
    columns.map((column) => escapeCell(column.header)).join(','),
    ...rows.map((row) => columns.map((column) => escapeCell(column.value(row))).join(',')),
  ];
  return '\ufeff' + lines.join('\r\n');
}

interface OrdersTableBulkExportProps {
  selectedRows: OrderRow[];
}

export function OrdersTableBulkExport({ selectedRows }: OrdersTableBulkExportProps) {
  const handleExport = React.useCallback(() => {
    if (selectedRows.length === 0) {
      return;
    }
    const csv = toCsv(selectedRows, EXPORT_COLUMNS);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(t('admin.orders.bulk.exportComplete', 'en', { count: selectedRows.length }));
  }, [selectedRows]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="cursor-pointer"
    >
      {t('admin.orders.bulk.export')}
    </Button>
  );
}
