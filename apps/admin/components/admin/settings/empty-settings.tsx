'use client';

import { SettingsIcon } from 'lucide-react';

import { Card, CardContent } from '@workspace/ui/components/card';
import { EmptyState } from '@workspace/ui/components/empty-state';
import { t } from '@workspace/lib/i18n';

export function EmptySettings() {
  return (
    <Card>
      <CardContent className="py-6">
        <EmptyState
          icon={<SettingsIcon className="size-10" strokeWidth={1.5} />}
          title={t('admin.common.noResults')}
        />
      </CardContent>
    </Card>
  );
}
