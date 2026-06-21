'use client';

import { useAuth } from '@workspace/lib/auth/use-auth';
import { t } from '@workspace/lib/i18n';

export function AccountHeader() {
  const { user, isLoading } = useAuth();
  const name = user?.name?.trim() || user?.email || '';
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        {t('account.dashboardTitle')}
      </h1>
      {isLoading ? null : name ? (
        <p className="text-muted-foreground text-sm">
          {t('account.dashboardWelcome', 'en', { name })}
        </p>
      ) : null}
    </header>
  );
}
