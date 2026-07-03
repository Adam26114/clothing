import { Suspense } from 'react';
import Link from 'next/link';
import { PlusIcon } from 'lucide-react';

import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { Button } from '@workspace/ui/components/button';
import { DataTableSkeleton } from '@workspace/ui/components/admin/data-table-skeleton';
import { t } from '@workspace/lib/i18n';

import { ProductsTableClient } from './products-table-client';

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <AdminPageHeader
        title={t('admin.products.title')}
        actions={
          <Button render={<Link href="/products/new" />} className="cursor-pointer">
            <PlusIcon className="me-1.5 size-4" aria-hidden />
            {t('admin.products.addProduct')}
          </Button>
        }
      />
      <Suspense fallback={<DataTableSkeleton columnCount={9} rowCount={8} />}>
        <ProductsTableClient />
      </Suspense>
    </div>
  );
}
