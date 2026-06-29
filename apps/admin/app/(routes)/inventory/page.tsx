import { Suspense } from 'react';

import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { t } from '@workspace/lib/i18n';

import { InventoryTableClient } from './inventory-table-client';
import { InventorySkeleton } from '@/components/admin/inventory/inventory-skeleton';

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <AdminPageHeader title={t('admin.inventory.title')} />
      <Suspense fallback={<InventorySkeleton />}>
        <InventoryTableClient />
      </Suspense>
    </div>
  );
}
