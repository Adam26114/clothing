'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartIcon, LogOutIcon, MenuIcon, PackageIcon, SearchIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';

import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/lib/cn';
import { useAuth } from '@workspace/lib/auth/use-auth';

import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';

import { CartIcon } from './cart-icon';
import { MobileNav } from './mobile-nav';
import { SearchOverlay } from './search-overlay';
import { MegaMenu } from './mega-menu';
import { SaleBanner } from './sale-banner';
import { AnnouncementBar } from './announcement-bar';
import { WishlistIcon } from './wishlist-icon';

interface NavSpec {
  key: 'women' | 'men' | 'new' | 'sale';
  slug: string;
  isMega?: boolean;
}

const NAV_ITEMS: NavSpec[] = [
  { key: 'women', slug: 'women', isMega: true },
  { key: 'men', slug: 'men', isMega: true },
  { key: 'new', slug: 'new' },
  { key: 'sale', slug: 'sale' },
];

export function StorefrontHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey;
      if (isModifier && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const result = await signOut();
    setSigningOut(false);
    if (!result.ok) {
      toast.error(t(result.error));
      return;
    }
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-background sticky top-0 z-40 w-full border-b">
      <AnnouncementBar />
      <SaleBanner />
      <div className="flex h-16 items-center justify-between gap-2 px-4 sm:px-6">
        <div className="flex flex-1 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t('header.openMenu')}
          >
            <MenuIcon className="size-5" />
          </Button>
          <nav aria-label={t('a11y.primaryNav')} className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <div key={item.key}>
                {item.isMega ? (
                  <MegaMenu label={t(`nav.${item.key}`)} rootSlug={item.slug} />
                ) : (
                  <Link
                    href={`/${item.slug}`}
                    className={cn(
                      'hover:text-foreground focus-visible:ring-ring/50 text-muted-foreground inline-flex h-9 items-center px-2 text-xs font-medium tracking-widest uppercase transition-colors hover:bg-transparent focus-visible:ring-2 focus-visible:outline-none'
                    )}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Link
            href="/"
            className="focus-visible:ring-ring/50 cursor-pointer text-xl font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
          >
            {t('brandName')}
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSearchOpen(true)}
            aria-label={t('nav.search')}
            className="cursor-pointer"
          >
            <SearchIcon className="size-5" />
          </Button>
          {isAuthenticated && !isLoading ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('nav.account')}
                    className="cursor-pointer"
                  />
                }
              >
                <UserIcon className="size-5" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{user?.name ?? t('nav.account')}</span>
                      {user?.email ? (
                        <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                      ) : null}
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href="/account" />} className="cursor-pointer">
                    <UserIcon className="size-4" aria-hidden />
                    {t('account.profileHeading')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<Link href="/account/orders" />}
                    className="cursor-pointer"
                  >
                    <ShoppingBagIcon className="size-4" aria-hidden />
                    {t('account.ordersHeading')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<Link href="/account/wishlist" />}
                    className="cursor-pointer"
                  >
                    <HeartIcon className="size-4" aria-hidden />
                    {t('account.wishlistHeading')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={signOut}
                    variant="destructive"
                    className="cursor-pointer"
                  >
                    <LogOutIcon className="size-4" aria-hidden />
                    {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href={isLoading ? '#' : '/auth/login'}
              aria-label={t('nav.account')}
              className="hover:bg-muted focus-visible:ring-ring/50 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
            >
              <UserIcon className="size-5" aria-hidden />
            </Link>
          )}
          <WishlistIcon />
          <CartIcon />
        </div>
      </div>
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
