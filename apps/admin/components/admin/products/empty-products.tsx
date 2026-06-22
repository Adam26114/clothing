'use client';

import { PackageIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { EmptyState } from '@workspace/ui/components/empty-state';
import { t } from '@workspace/lib/i18n';

interface EmptyProductsProps {
  hasFilters?: boolean;
  onAdd?: () => void;
}

export function EmptyProducts({ hasFilters = false, onAdd }: EmptyProductsProps) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={<PackageIcon className="size-10" strokeWidth={1.5} />}
        title={t('admin.products.noResults')}
        description={t('admin.products.noResultsDescription')}
      />
    );
  }

  return (
    <EmptyState
      icon={<PackageIcon className="size-10" strokeWidth={1.5} />}
      title={t('admin.products.noResultsEmpty')}
      description={t('admin.products.noResultsEmptyDescription')}
      action={
        onAdd ? (
          <Button type="button" size="sm" onClick={onAdd} className="cursor-pointer">
            {t('admin.products.addProduct')}
          </Button>
        ) : null
      }
    />
  );
}
