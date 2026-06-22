'use client';

import Link from 'next/link';
import { ShoppingBagIcon } from 'lucide-react';
import type { Doc, Id } from '@workspace/convex/_generated/dataModel';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { EmptyState } from '@workspace/ui/components/empty-state';
import { StatusBadge, type OrderStatus } from '@workspace/ui/components/admin/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';

import { orderStatusLabel } from '@/lib/order-status-label';

interface UserOrderHistoryProps {
  orders: Doc<'orders'>[];
}

function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString();
  }
}

function deliveryLabel(method: 'shipping' | 'pickup'): string {
  return method === 'shipping'
    ? t('admin.users.detail.deliveryShipping')
    : t('admin.users.detail.deliveryPickup');
}

export function UserOrderHistory({ orders }: UserOrderHistoryProps) {
  const count = orders.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.users.detail.orderHistory', 'en', { count })}</CardTitle>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <EmptyState
            icon={<ShoppingBagIcon className="size-10" strokeWidth={1.5} />}
            title={t('admin.users.detail.noOrders')}
            description={t('admin.users.detail.noOrdersDescription')}
            className="border-0 py-10"
          />
        ) : (
          <div className="border-border overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>{t('admin.users.detail.orderNumber')}</TableHead>
                  <TableHead>{t('admin.users.detail.date')}</TableHead>
                  <TableHead className="text-end">{t('admin.users.detail.total')}</TableHead>
                  <TableHead>{t('admin.users.detail.status')}</TableHead>
                  <TableHead>{t('admin.users.detail.delivery')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <Link
                        href={`/orders/${order._id as Id<'orders'>}`}
                        className="cursor-pointer font-mono text-sm tabular-nums hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-end font-medium tabular-nums">
                      {formatMMK(order.total)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={order.status as OrderStatus}
                        label={orderStatusLabel(order.status as OrderStatus)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {deliveryLabel(order.deliveryMethod)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
