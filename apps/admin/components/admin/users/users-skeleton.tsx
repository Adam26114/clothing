'use client';

import { DataTableSkeleton } from '@workspace/ui/components/admin/data-table-skeleton';

export function UsersSkeleton() {
  return <DataTableSkeleton columnCount={7} rowCount={8} />;
}
