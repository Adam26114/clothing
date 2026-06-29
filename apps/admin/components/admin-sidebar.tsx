'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboardIcon,
  ShoppingBagIcon,
  ShirtIcon,
  PackageIcon,
  UsersIcon,
  SettingsIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileTextIcon,
  CircleHelpIcon,
  SearchIcon,
  PlusIcon,
  CommandIcon,
} from 'lucide-react';

import {
  AppSidebar,
  type AppSidebarData,
  type AppSidebarNavItem,
} from '@workspace/ui/components/app-sidebar';
import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import { useAuth } from '@workspace/lib/auth/use-auth';
import { t } from '@workspace/lib/i18n';

const navConfig: Array<{ titleKey: string; url: string; icon: React.ReactNode }> = [
  { titleKey: 'nav.dashboard', url: '/', icon: <LayoutDashboardIcon /> },
  { titleKey: 'nav.orders', url: '/orders', icon: <ShoppingBagIcon /> },
  { titleKey: 'nav.products', url: '/products', icon: <ShirtIcon /> },
  { titleKey: 'nav.inventory', url: '/inventory', icon: <PackageIcon /> },
  { titleKey: 'nav.users', url: '/users', icon: <UsersIcon /> },
  { titleKey: 'nav.settings', url: '/settings', icon: <SettingsIcon /> },
];

function isPathActive(pathname: string, url: string): boolean {
  if (url === '/') {
    return pathname === '/';
  }
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const navMain: AppSidebarNavItem[] = React.useMemo(
    () =>
      navConfig.map((item) => ({
        title: t(item.titleKey),
        url: item.url,
        icon: item.icon,
        isActive: isPathActive(pathname ?? '/', item.url),
      })),
    [pathname]
  );

  const data: AppSidebarData = React.useMemo(
    () => ({
      brand: {
        name: t('adminTitle'),
        href: '/',
        icon: <CommandIcon className="size-5!" />,
      },
      user: {
        name: user?.name ?? t('admin.sidebar.navUserFallback'),
        email: user?.email ?? '',
        avatar: null,
      },
      navMain,
      documents: [
        {
          name: t('admin.sidebar.documents.dataLibrary'),
          url: '#',
          icon: <DatabaseIcon />,
        },
        {
          name: t('admin.sidebar.documents.reports'),
          url: '#',
          icon: <FileChartColumnIcon />,
        },
        {
          name: t('admin.sidebar.documents.wordAssistant'),
          url: '#',
          icon: <FileTextIcon />,
        },
      ],
      navSecondary: [
        {
          title: t('admin.sidebar.secondary.help'),
          url: '#',
          icon: <CircleHelpIcon />,
          isActive: false,
        },
        {
          title: t('admin.sidebar.secondary.search'),
          url: '#',
          icon: <SearchIcon />,
          isActive: false,
        },
      ],
    }),
    [navMain, user]
  );

  const quickCreateMenu = (
    <DropdownMenuItem
      onClick={() => {
        router.push('/products/new');
      }}
      className="cursor-pointer"
    >
      <PlusIcon />
      {t('admin.sidebar.quickCreateProduct')}
    </DropdownMenuItem>
  );

  const handleSignOut = React.useCallback(() => {
    void signOut();
  }, [signOut]);

  return (
    <AppSidebar
      variant="inset"
      data={data}
      quickCreateLabel={t('admin.sidebar.quickCreate')}
      quickCreateMenu={quickCreateMenu}
      onSignOut={handleSignOut}
      signOutLabel={t('nav.signOut')}
    />
  );
}
