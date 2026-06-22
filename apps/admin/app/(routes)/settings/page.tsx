import { Suspense } from 'react';

import { SettingsClient } from './settings-client';
import { SettingsSkeleton } from '@/components/admin/settings/settings-skeleton';

export default function Page() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsClient />
    </Suspense>
  );
}
