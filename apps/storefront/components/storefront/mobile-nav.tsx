'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { ChevronRightIcon, XIcon } from 'lucide-react';

import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/lib/cn';
import { useAuth } from '@workspace/lib/auth/use-auth';
import { api } from '@workspace/convex/_generated/api';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@workspace/ui/components/sheet';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const tree = useQuery(api.categories.listAsTree);
  const { isAuthenticated, isLoading } = useAuth();
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const handleClose = () => {
    onOpenChange(false);
    setExpandedSlug(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-full max-w-full flex-col gap-0 p-0 sm:max-w-sm"
        showCloseButton={false}
      >
        <SheetHeader className="flex-row items-center justify-between border-b">
          <SheetTitle>{t('header.openMenu')}</SheetTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            aria-label={t('header.closeMenu')}
            className="cursor-pointer"
          >
            <XIcon className="size-4" />
          </Button>
        </SheetHeader>
        <nav aria-label={t('header.openMenu')} className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col">
            {(tree ?? []).map((root) => {
              const hasChildren = root.children.length > 0;
              const isExpanded = expandedSlug === root.slug;
              return (
                <li key={root._id} className="border-border border-b last:border-b-0">
                  <div className="flex items-stretch">
                    <Link
                      href={`/${root.slug}`}
                      onClick={handleClose}
                      className="hover:bg-muted focus-visible:bg-muted flex-1 cursor-pointer px-3 py-3 text-sm font-medium tracking-widest uppercase focus-visible:outline-none"
                    >
                      {root.name}
                    </Link>
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSlug((prev) => (prev === root.slug ? null : root.slug))
                        }
                        aria-expanded={isExpanded}
                        aria-controls={`mobile-nav-children-${root.slug}`}
                        className="hover:bg-muted focus-visible:ring-ring/50 cursor-pointer px-3 focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <ChevronRightIcon
                          aria-hidden
                          className={cn(
                            'size-4 transition-transform rtl:rotate-180',
                            isExpanded && 'rotate-90 rtl:rotate-90'
                          )}
                        />
                        <span className="sr-only">
                          {isExpanded ? t('header.closeMenu') : t('header.openMenu')}
                        </span>
                      </button>
                    ) : null}
                  </div>
                  {hasChildren && isExpanded ? (
                    <ul
                      id={`mobile-nav-children-${root.slug}`}
                      className="bg-muted/30 flex flex-col pb-2"
                    >
                      {root.children.map((child) => (
                        <li key={child._id}>
                          <Link
                            href={`/${root.slug}/${child.slug}`}
                            onClick={handleClose}
                            className="hover:bg-muted focus-visible:bg-muted text-muted-foreground block cursor-pointer px-6 py-2 text-sm focus-visible:outline-none"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <Separator className="my-3" />
          <ul className="flex flex-col">
            <li>
              <Link
                href="/new"
                onClick={handleClose}
                className="hover:bg-muted focus-visible:bg-muted block cursor-pointer px-3 py-2 text-sm focus-visible:outline-none"
              >
                {t('nav.new')}
              </Link>
            </li>
            <li>
              <Link
                href="/sale"
                onClick={handleClose}
                className="hover:bg-muted focus-visible:bg-muted block cursor-pointer px-3 py-2 text-sm focus-visible:outline-none"
              >
                {t('nav.sale')}
              </Link>
            </li>
            <li>
              <Link
                href={isAuthenticated ? '/account' : '/auth/login'}
                onClick={handleClose}
                className="hover:bg-muted focus-visible:bg-muted block cursor-pointer px-3 py-2 text-sm focus-visible:outline-none"
              >
                {isLoading ? t('nav.signIn') : isAuthenticated ? t('nav.account') : t('nav.signIn')}
              </Link>
            </li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
