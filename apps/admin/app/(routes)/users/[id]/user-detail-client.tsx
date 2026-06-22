'use client';

import { useQuery } from 'convex/react';
import { api } from '@workspace/convex/_generated/api';
import type { Id } from '@workspace/convex/_generated/dataModel';

import { Card, CardContent } from '@workspace/ui/components/card';
import { DataTableSkeleton } from '@workspace/ui/components/admin/data-table-skeleton';
import { t } from '@workspace/lib/i18n';

import { UserDetailHeader } from '@/components/admin/users/user-detail-header';
import { UserOrderHistory } from '@/components/admin/users/user-order-history';

const ORDER_HISTORY_PAGE_SIZE = 50;

interface UserDetailClientProps {
  userId: string;
}

function UserDetailError() {
  return (
    <Card>
      <CardContent className="py-6">
        <p className="text-destructive text-sm">{t('admin.users.error.loadDetail')}</p>
      </CardContent>
    </Card>
  );
}

export function UserDetailClient({ userId }: UserDetailClientProps) {
  const history = useQuery(api.users.getCustomerHistory, { id: userId as Id<'users'> });
  const ordersResult = useQuery(api.orders.list, {
    customerId: userId as Id<'users'>,
    pageSize: ORDER_HISTORY_PAGE_SIZE,
  });

  if (history === undefined) {
    return (
      <div className="flex flex-col gap-6" aria-busy>
        <DataTableSkeleton columnCount={4} rowCount={3} />
      </div>
    );
  }

  if (history === null) {
    return <UserDetailError />;
  }

  const orders = ordersResult?.items ?? history.orders;

  return (
    <div className="flex flex-col gap-6">
      <UserDetailHeader user={history.user} stats={history.stats} />
      <UserOrderHistory orders={orders} />
    </div>
  );
}
