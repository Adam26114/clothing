'use client';

import Link from 'next/link';
import {
  LayoutDashboardIcon,
  ShoppingBagIcon,
  ShirtIcon,
  PackageIcon,
  UsersIcon,
  SettingsIcon,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar';
import { t } from '@workspace/lib/i18n';

const navItems = [
  { title: t('nav.dashboard'), url: '/', icon: LayoutDashboardIcon },
  { title: t('nav.orders'), url: '/orders', icon: ShoppingBagIcon },
  { title: t('nav.products'), url: '/products', icon: ShirtIcon },
  { title: t('nav.inventory'), url: '/inventory', icon: PackageIcon },
  { title: t('nav.users'), url: '/users', icon: UsersIcon },
  { title: t('nav.settings'), url: '/settings', icon: SettingsIcon },
];

export function AdminSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/" />} className="text-base font-semibold">
              {t('adminTitle')}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} render={<Link href={item.url} />}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
