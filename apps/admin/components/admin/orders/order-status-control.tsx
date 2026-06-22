'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { toast } from 'sonner';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { t } from '@workspace/lib/i18n';
import type { OrderStatus } from '@workspace/ui/components/admin/status-badge';

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

interface OrderStatusControlProps {
  orderId: Id<'orders'>;
  status: OrderStatus;
}

export function OrderStatusControl({ orderId, status }: OrderStatusControlProps) {
  const updateStatus = useMutation(api.orders.updateStatus);
  const [pending, setPending] = React.useState(false);
  const isCancelled = status === 'cancelled';

  const handleChange = React.useCallback(
    async (next: string) => {
      if (!isOrderStatus(next) || next === status) {
        return;
      }
      setPending(true);
      try {
        await updateStatus({ id: orderId, status: next });
        toast.success(t('admin.orders.success.updateStatus'));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('admin.orders.error.updateStatus');
        toast.error(message);
      } finally {
        setPending(false);
      }
    },
    [orderId, status, updateStatus]
  );

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={status}
        onValueChange={(value) => {
          if (value !== null) {
            void handleChange(value);
          }
        }}
        disabled={pending}
      >
        <SelectTrigger
          size="sm"
          className="min-w-40 cursor-pointer"
          aria-label={t('admin.orders.detail.statusUpdate')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => {
            const disabled = isCancelled && option.value !== 'cancelled';
            return (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={disabled}
                className="cursor-pointer"
              >
                {t(option.labelKey)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {isCancelled ? (
        <p className="text-muted-foreground text-xs">
          {t('admin.orders.detail.statusRestoreNote')}
        </p>
      ) : null}
    </div>
  );
}
