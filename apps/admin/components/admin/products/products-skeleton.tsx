'use client';

import { DataTableSkeleton } from '@workspace/ui/components/admin/data-table-skeleton';

export function ProductsSkeleton() {
  return <DataTableSkeleton columnCount={9} rowCount={8} />;
}
