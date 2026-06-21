'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HeartIcon, LogOutIcon, PackageIcon, UserIcon, ShoppingBagIcon } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@workspace/lib/cn';
import { useAuth } from '@workspace/lib/auth/use-auth';
import { t } from '@workspace/lib/i18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';

interface NavItem {
  href: string;
  labelKey: 'account.profileHeading' | 'account.ordersHeading' | 'account.wishlistHeading';
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/account', labelKey: 'account.profileHeading', icon: <UserIcon className="size-4" /> },
  {
    href: '/account/orders',
    labelKey: 'account.ordersHeading',
    icon: <PackageIcon className="size-4" />,
  },
  {
    href: '/account/wishlist',
    labelKey: 'account.wishlistHeading',
    icon: <HeartIcon className="size-4" />,
  },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/account') {
      return pathname === '/account';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const result = await signOut();
    setSigningOut(false);
    if (!result.ok) {
      toast.error(t(result.error));
      return;
    }
    setOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav
      aria-label={t('account.dashboardTitle')}
      className="border-border bg-card flex flex-col gap-2 rounded-xl border p-3"
    >
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'hover:bg-muted focus-visible:ring-ring/50 inline-flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none',
                  active
                    ? 'bg-secondary text-secondary-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                <span aria-hidden className="text-current">
                  {item.icon}
                </span>
                <span>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href="/"
            className="text-muted-foreground hover:bg-muted focus-visible:ring-ring/50 inline-flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <ShoppingBagIcon className="size-4" aria-hidden />
            <span>{t('account.continueShopping')}</span>
          </Link>
        </li>
      </ul>

      <div className="mt-2 border-t pt-2">
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger
            render={
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive hover:bg-muted focus-visible:ring-ring/50 inline-flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
              />
            }
          >
            <LogOutIcon className="size-4" aria-hidden />
            <span>{t('account.signOutButton')}</span>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('account.signOutConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('account.signOutConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={signingOut} className="cursor-pointer">
                {t('account.signOutCancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSignOut}
                disabled={signingOut}
                className="cursor-pointer"
              >
                {t('account.signOutConfirmAction')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </nav>
  );
}
