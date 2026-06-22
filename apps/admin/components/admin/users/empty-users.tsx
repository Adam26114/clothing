'use client';

import { UsersIcon } from 'lucide-react';

import { EmptyState } from '@workspace/ui/components/empty-state';
import { t } from '@workspace/lib/i18n';

export function EmptyUsers() {
  return (
    <EmptyState
      icon={<UsersIcon className="size-10" strokeWidth={1.5} />}
      title={t('admin.users.noResultsEmpty')}
      description={t('admin.users.noResultsEmptyDescription')}
    />
  );
}
