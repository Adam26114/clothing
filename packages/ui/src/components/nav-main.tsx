'use client';

import * as React from 'react';
import Link from 'next/link';

import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@workspace/ui/components/sidebar';
import { CirclePlusIcon, MailIcon } from 'lucide-react';

type NavMainItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
  isActive?: boolean;
};

export function NavMain({
  items,
  quickCreateMenu,
  quickCreateLabel,
}: {
  items: NavMainItem[];
  quickCreateMenu?: React.ReactNode;
  quickCreateLabel?: string;
}) {
  const { isMobile } = useSidebar();
  const quickCreateButton = (
    <SidebarMenuButton
      tooltip={quickCreateLabel ?? 'Quick Create'}
      className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 cursor-pointer duration-200 ease-linear"
    >
      <CirclePlusIcon />
      <span>{quickCreateLabel ?? 'Quick Create'}</span>
    </SidebarMenuButton>
  );

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            {quickCreateMenu ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={quickCreateButton} />
                <DropdownMenuContent
                  className="min-w-48"
                  side={isMobile ? 'bottom' : 'right'}
                  align="start"
                  sideOffset={6}
                >
                  {quickCreateMenu}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              quickCreateButton
            )}
            <Button
              size="icon"
              className="size-8 cursor-pointer group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <MailIcon />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={item.isActive}
                tooltip={item.title}
                render={<Link href={item.url} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
