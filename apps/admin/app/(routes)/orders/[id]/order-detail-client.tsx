'use client';

import { useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import type { Id } from '@workspace/convex/_generated/dataModel';

import { Card, CardContent } from '@workspace/ui/components/card';
import { DataTableSkeleton } from '@workspace/ui/components/admin/data-table-skeleton';
import { t } from '@workspace/lib/i18n';

import { OrderDetailHeader } from '@/components/admin/orders/order-detail-header';
import { OrderDetailInfo } from '@/components/admin/orders/order-detail-info';
import { OrderItemsTable } from '@/components/admin/orders/order-items-table';
import { OrderStatusControl } from '@/components/admin/orders/order-status-control';
import { OrderCancelButton } from '@/components/admin/orders/order-cancel-button';
import { OrderRestoreButton } from '@/components/admin/orders/order-restore-button';

interface OrderDetailClientProps {
  orderId: string;
}

function OrderDetailError() {
  return (
    <Card>
      <CardContent className="py-6">
        <p className="text-destructive text-sm">{t('admin.orders.error.loadDetail')}</p>
      </CardContent>
    </Card>
  );
}

export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const order = useQuery(api.orders.getById, { id: orderId as Id<'orders'> });

  if (order === undefined) {
    return (
      <div className="flex flex-col gap-6" aria-busy>
        <DataTableSkeleton columnCount={5} rowCount={4} />
      </div>
    );
  }

  if (order === null) {
    return <OrderDetailError />;
  }

  const isCancelled = order.status === 'cancelled';

  return (
    <div className="flex flex-col gap-6">
      <OrderDetailHeader
        orderNumber={order.orderNumber}
        status={order.status}
        createdAt={order.createdAt}
      />

      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusControl orderId={order._id} status={order.status} />
        {isCancelled ? (
          <OrderRestoreButton orderId={order._id} />
        ) : (
          <OrderCancelButton orderId={order._id} />
        )}
      </div>

      <OrderDetailInfo
        customer={order.customerInfo}
        deliveryMethod={order.deliveryMethod}
        paymentMethod={order.paymentMethod}
        notes={order.notes ?? null}
      />

      <OrderItemsTable items={order.items} />
    </div>
  );
}
