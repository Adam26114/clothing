'use client';

import { DataTableSkeleton } from '@workspace/ui/components/admin/data-table-skeleton';

export function InventorySkeleton() {
  return <DataTableSkeleton columnCount={7} rowCount={8} />;
}
