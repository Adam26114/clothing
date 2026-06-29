import { Suspense } from 'react';

import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { t } from '@workspace/lib/i18n';

import { OrdersTableClient } from './orders-table-client';
import { OrdersSkeleton } from '@/components/admin/orders/orders-skeleton';

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <AdminPageHeader title={t('admin.orders.title')} />
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersTableClient />
      </Suspense>
    </div>
  );
}
