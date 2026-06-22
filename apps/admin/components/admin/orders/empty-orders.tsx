'use client';

import { InboxIcon } from 'lucide-react';

import { EmptyState } from '@workspace/ui/components/empty-state';
import { t } from '@workspace/lib/i18n';

export function EmptyOrders() {
  return (
    <EmptyState
      icon={<InboxIcon className="size-10" strokeWidth={1.5} />}
      title={t('admin.orders.noResultsEmpty')}
      description={t('admin.orders.noResultsEmptyDescription')}
    />
  );
}
