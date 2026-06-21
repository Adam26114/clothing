'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import type { Doc, Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
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

type OrderStatus = Doc<'orders'>['status'];

const STATUS_OPTIONS: ReadonlyArray<{ value: OrderStatus; labelKey: string }> = [
  { value: 'pending', labelKey: 'order.statusPending' },
  { value: 'confirmed', labelKey: 'order.statusConfirmed' },
  { value: 'processing', labelKey: 'order.statusProcessing' },
  { value: 'shipped', labelKey: 'order.statusShipped' },
  { value: 'delivered', labelKey: 'order.statusDelivered' },
  { value: 'cancelled', labelKey: 'order.statusCancelled' },
];

function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString();
  }
}

interface WidgetRecentOrdersProps {
  orders: Doc<'orders'>[];
}

export function WidgetRecentOrders({ orders }: WidgetRecentOrdersProps) {
  const updateStatus = useMutation(api.orders.updateStatus);
  const [pendingId, setPendingId] = useState<Id<'orders'> | null>(null);

  const hasOrders = orders.length > 0;

  const handleStatusChange = useMemo(
    () => async (orderId: Id<'orders'>, next: OrderStatus) => {
      setPendingId(orderId);
      try {
        await updateStatus({ id: orderId, status: next });
        toast.success(t('admin.dashboard.statusUpdated'));
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : t('admin.dashboard.statusUpdateFailed');
        toast.error(message);
      } finally {
        setPendingId(null);
      }
    },
    [updateStatus]
  );

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardDescription>{t('admin.dashboard.recentOrders')}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {orders.length.toLocaleString('en-US')}
        </CardTitle>
        <CardAction>
          <Button
            render={<Link href="/orders" />}
            variant="ghost"
            size="sm"
            className="cursor-pointer"
          >
            {t('admin.dashboard.viewAll')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {!hasOrders ? (
          <div className="text-muted-foreground px-(--card-spacing) text-sm">
            {t('admin.dashboard.noRecentOrders')}
          </div>
        ) : (
          <div className="border-border overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>{t('admin.dashboard.recentOrders')}</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-end">Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const orderId = order._id;
                  return (
                    <TableRow key={orderId}>
                      <TableCell>
                        <Link
                          href={`/orders/${orderId}`}
                          className="cursor-pointer font-mono text-sm tabular-nums hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[12ch] truncate">
                        {order.customerInfo.name}
                      </TableCell>
                      <TableCell className="text-end font-medium tabular-nums">
                        {formatMMK(order.total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => {
                            if (value !== null) {
                              void handleStatusChange(orderId, value as OrderStatus);
                            }
                          }}
                          disabled={pendingId === orderId}
                        >
                          <SelectTrigger
                            size="sm"
                            className="min-w-32 cursor-pointer"
                            aria-label="Change order status"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="cursor-pointer"
                              >
                                {t(option.labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
