'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from 'lucide-react';

import { Separator } from '@workspace/ui/components/separator';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { Button } from '@workspace/ui/components/button';
import { t } from '@workspace/lib/i18n';

import { CommandPalette } from '@/components/admin/command-palette';

export function AdminHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <SidebarTrigger className="-ms-1 cursor-pointer" />
        <Separator orientation="vertical" className="mx-1 h-4 data-vertical:self-auto" />
        <CommandPalette className="max-w-md min-w-0 flex-1" />
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
