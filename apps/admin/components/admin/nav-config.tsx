'use client';

import {
  LayoutDashboardIcon,
  ShoppingBagIcon,
  ShirtIcon,
  PackageIcon,
  UsersIcon,
  SettingsIcon,
  PlusIcon,
} from 'lucide-react';
import * as React from 'react';

export interface AdminNavItem {
  titleKey: string;
  url: string;
  icon: React.ReactNode;
}

export const adminNavItems: ReadonlyArray<AdminNavItem> = [
  { titleKey: 'nav.dashboard', url: '/', icon: <LayoutDashboardIcon /> },
  { titleKey: 'nav.orders', url: '/orders', icon: <ShoppingBagIcon /> },
  { titleKey: 'nav.products', url: '/products', icon: <ShirtIcon /> },
  { titleKey: 'nav.inventory', url: '/inventory', icon: <PackageIcon /> },
  { titleKey: 'nav.users', url: '/users', icon: <UsersIcon /> },
  { titleKey: 'nav.settings', url: '/settings', icon: <SettingsIcon /> },
];

export const quickCreateItems: ReadonlyArray<AdminNavItem> = [
  { titleKey: 'admin.sidebar.quickCreateProduct', url: '/products/new', icon: <PlusIcon /> },
];
