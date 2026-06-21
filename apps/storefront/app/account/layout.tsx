import type { ReactNode } from 'react';

import { t } from '@workspace/lib/i18n';

import { AccountSidebar } from '@/components/storefront/account/account-sidebar';
import { AccountHeader } from '@/components/storefront/account/account-header';

interface AccountLayoutProps {
  children: ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <div className="bg-background text-foreground min-h-svh">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        <AccountHeader />
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[16rem_1fr]">
          <aside aria-label={t('account.dashboardTitle')}>
            <AccountSidebar />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
