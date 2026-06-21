'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { MenuIcon, SearchIcon, UserIcon } from 'lucide-react';

import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/lib/cn';

import { Button } from '@workspace/ui/components/button';
import { CartIcon } from './cart-icon';
import { MobileNav } from './mobile-nav';
import { SearchOverlay } from './search-overlay';
import { MegaMenu } from './mega-menu';
import { SaleBanner } from './sale-banner';

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

  return (
    <header className="bg-background sticky top-0 z-40 w-full border-b">
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
          <Link
            href="/auth/login"
            aria-label={t('nav.account')}
            className="hover:bg-muted focus-visible:ring-ring/50 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
          >
            <UserIcon className="size-5" aria-hidden />
          </Link>
          <CartIcon />
        </div>
      </div>
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
