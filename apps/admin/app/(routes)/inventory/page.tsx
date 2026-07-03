import { Suspense } from 'react';

import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { DataTableSkeleton } from '@workspace/ui/components/admin/data-table-skeleton';
import { t } from '@workspace/lib/i18n';

import { InventoryTableClient } from './inventory-table-client';

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <AdminPageHeader title={t('admin.inventory.title')} />
      <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={8} />}>
        <InventoryTableClient />
      </Suspense>
    </div>
  );
}
