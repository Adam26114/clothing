import { Suspense } from 'react';

import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { t } from '@workspace/lib/i18n';

import { UsersTableClient } from './users-table-client';
import { UsersSkeleton } from '@/components/admin/users/users-skeleton';

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <AdminPageHeader title={t('admin.users.title')} />
      <Suspense fallback={<UsersSkeleton />}>
        <UsersTableClient />
      </Suspense>
    </div>
  );
}
