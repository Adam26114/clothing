'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { StatusBadge, type OrderStatus } from '@workspace/ui/components/admin/status-badge';
import { formatDateTime } from '@workspace/lib/formatDate';
import { t } from '@workspace/lib/i18n';

import { orderStatusLabel } from '@/lib/order-status-label';

interface OrderDetailHeaderProps {
  orderNumber: string;
  status: OrderStatus;
  createdAt: number;
}

export function OrderDetailHeader({ orderNumber, status, createdAt }: OrderDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button
          render={<Link href="/orders" />}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ms-2 cursor-pointer"
        >
          <ArrowLeftIcon className="me-1.5 size-4 rtl:rotate-180" aria-hidden />
          {t('admin.orders.backToOrders')}
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
            {orderNumber}
          </h1>
          <p className="text-muted-foreground text-sm tabular-nums">
            {t('admin.orders.detail.placedOn', 'en', { date: formatDateTime(createdAt) })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} label={orderStatusLabel(status)} />
        </div>
      </div>
    </div>
  );
}
