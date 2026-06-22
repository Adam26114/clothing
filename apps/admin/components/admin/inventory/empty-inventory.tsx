'use client';

import { BoxesIcon } from 'lucide-react';

import { EmptyState } from '@workspace/ui/components/empty-state';
import { t } from '@workspace/lib/i18n';

interface EmptyInventoryProps {
  hasFilters?: boolean;
}

export function EmptyInventory({ hasFilters = false }: EmptyInventoryProps) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={<BoxesIcon className="size-10" strokeWidth={1.5} />}
        title={t('admin.inventory.noResults')}
        description={t('admin.inventory.noResultsDescription')}
      />
    );
  }

  return (
    <EmptyState
      icon={<BoxesIcon className="size-10" strokeWidth={1.5} />}
      title={t('admin.inventory.noResultsEmpty')}
      description={t('admin.inventory.noResultsEmptyDescription')}
    />
  );
}
