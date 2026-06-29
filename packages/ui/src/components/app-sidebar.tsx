'use client';

import * as React from 'react';
import Link from 'next/link';

import { NavDocuments } from '@workspace/ui/components/nav-documents';
import { NavMain } from '@workspace/ui/components/nav-main';
import { NavSecondary } from '@workspace/ui/components/nav-secondary';
import { NavUser } from '@workspace/ui/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar';

export type AppSidebarNavItem = {
  title: string;
  url: string;
  icon: React.ReactNode;
  isActive?: boolean;
};

export type AppSidebarDocument = {
  name: string;
  url: string;
  icon: React.ReactNode;
};

export type AppSidebarUser = {
  name: string;
  email: string;
  avatar?: string | null;
};

export type AppSidebarBrand = {
  name: string;
  href: string;
  icon?: React.ReactNode;
};

export type AppSidebarData = {
  brand: AppSidebarBrand;
  user: AppSidebarUser;
  navMain: AppSidebarNavItem[];
  documents: AppSidebarDocument[];
  navSecondary: AppSidebarNavItem[];
};

type AppSidebarProps = {
  data: AppSidebarData;
  quickCreateMenu?: React.ReactNode;
  quickCreateLabel?: string;
  onSignOut?: () => void;
  signOutLabel?: string;
} & React.ComponentProps<typeof Sidebar>;

export function AppSidebar({
  data,
  quickCreateMenu,
  quickCreateLabel,
  onSignOut,
  signOutLabel,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href={data.brand.href} />}
            >
              {data.brand.icon}
              <span className="text-base font-semibold">{data.brand.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain}
          quickCreateLabel={quickCreateLabel}
          quickCreateMenu={quickCreateMenu}
        />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} onSignOut={onSignOut} signOutLabel={signOutLabel} />
      </SidebarFooter>
    </Sidebar>
  );
}
