import { Suspense } from 'react';

import { AdminPageHeader } from '@workspace/ui/components/admin/page-header';
import { t } from '@workspace/lib/i18n';

import { DashboardClient } from '@/components/admin/dashboard/dashboard-client';
import { DashboardSkeleton } from '@/components/admin/dashboard/dashboard-skeleton';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <AdminPageHeader title={t('admin.dashboard.title')} />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClient />
      </Suspense>
    </div>
  );
}
