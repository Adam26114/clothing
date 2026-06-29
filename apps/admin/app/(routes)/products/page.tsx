import { Suspense } from 'react';

import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { t } from '@workspace/lib/i18n';

import { ProductsTableClient } from './products-table-client';
import { ProductsSkeleton } from '@/components/admin/products/products-skeleton';

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <AdminPageHeader title={t('admin.products.title')} />
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsTableClient />
      </Suspense>
    </div>
  );
}
