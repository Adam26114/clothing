'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { ChevronRightIcon, PackageIcon } from 'lucide-react';

import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { api } from '@workspace/convex/_generated/api';
import type { Doc } from '@workspace/convex/_generated/dataModel';

import { EmptyState } from '../empty-state';

function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString();
  }
}

function statusLabel(status: Doc<'orders'>['status']): string {
  switch (status) {
    case 'pending':
      return t('order.statusPending');
    case 'confirmed':
      return t('order.statusConfirmed');
    case 'processing':
      return t('order.statusProcessing');
    case 'shipped':
      return t('order.statusShipped');
    case 'delivered':
      return t('order.statusDelivered');
    case 'cancelled':
      return t('order.statusCancelled');
    default:
      return status;
  }
}

interface OrdersListProps {
  limit?: number;
  showHeader?: boolean;
  showEmpty?: boolean;
}

export function OrdersList({ limit, showHeader = true, showEmpty = true }: OrdersListProps) {
  const result = useQuery(api.orders.list, limit !== undefined ? { pageSize: limit } : {});
  const items = result?.items ?? [];
  const isLoading = result === undefined;

  if (isLoading) {
    return (
      <ul className="flex flex-col gap-2" aria-busy>
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="h-20 w-full" />
          </li>
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    if (!showEmpty) {
      return null;
    }
    return (
      <EmptyState
        icon={<PackageIcon className="size-10" aria-hidden />}
        title={t('account.ordersEmpty')}
        description={t('account.ordersEmptyDescription')}
        action={
          <Button render={<Link href="/" />} size="default" className="cursor-pointer">
            {t('account.continueShopping')}
          </Button>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((order) => (
        <li key={order._id}>
          <Link
            href={`/account/orders/${order._id}`}
            className="border-border bg-card hover:bg-muted/40 focus-visible:ring-ring/50 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-mono text-sm font-semibold tabular-nums">
                {order.orderNumber}
              </span>
              {showHeader ? (
                <span className="text-muted-foreground text-xs">
                  {formatDate(order.createdAt)} · {statusLabel(order.status)}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tabular-nums">{formatMMK(order.total)}</span>
              <span className="text-muted-foreground" aria-hidden>
                <ChevronRightIcon className="size-4 rtl:rotate-180" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
