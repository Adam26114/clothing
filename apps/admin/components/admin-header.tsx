'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from 'lucide-react';

import { Separator } from '@workspace/ui/components/separator';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { Button } from '@workspace/ui/components/button';
import { t } from '@workspace/lib/i18n';

const titleRoutes: Array<{ match: (pathname: string) => boolean; key: string }> = [
  { match: (p) => p === '/', key: 'admin.header.title.dashboard' },
  { match: (p) => p === '/orders' || p.startsWith('/orders/'), key: 'admin.header.title.orders' },
  {
    match: (p) => p === '/products' || p.startsWith('/products/'),
    key: 'admin.header.title.products',
  },
  {
    match: (p) => p === '/inventory' || p.startsWith('/inventory/'),
    key: 'admin.header.title.inventory',
  },
  { match: (p) => p === '/users' || p.startsWith('/users/'), key: 'admin.header.title.users' },
  {
    match: (p) => p === '/settings' || p.startsWith('/settings/'),
    key: 'admin.header.title.settings',
  },
];

function resolveTitle(pathname: string | null): string {
  const target = pathname ?? '/';
  for (const route of titleRoutes) {
    if (route.match(target)) {
      return t(route.key);
    }
  }
  return t('adminTitle');
}

export function AdminHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const title = resolveTitle(pathname);
  const isDark = resolvedTheme === 'dark';
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1 cursor-pointer" />
        <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ms-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer"
            onClick={() => {
              setTheme(isDark ? 'light' : 'dark');
            }}
            aria-label={t('admin.header.theme.toggle')}
            title={isDark ? t('admin.header.theme.light') : t('admin.header.theme.dark')}
            suppressHydrationWarning
          >
            {mounted && isDark ? <SunIcon /> : <MoonIcon />}
            <span className="sr-only">{t('admin.header.theme.toggle')}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
