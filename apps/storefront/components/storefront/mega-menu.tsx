'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { ChevronDownIcon } from 'lucide-react';

import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/lib/cn';
import { api } from '@workspace/convex/_generated/api';
import type { Doc } from '@workspace/convex/_generated/dataModel';

interface MegaMenuProps {
  label: string;
  /** Top-level slug (e.g. "men") — when hovered, also opens submenu items of this root. */
  rootSlug: string;
  /** Optional explicit children to render — defaults to the root from `listAsTree`. */
  rootOverride?: CategoryTreeNode | null;
  onNavigate?: () => void;
}

export interface CategoryTreeNode {
  _id: Doc<'categories'>['_id'];
  name: string;
  slug: string;
  children: Doc<'categories'>[];
}

const HOVER_OPEN_DELAY = 120;
const HOVER_CLOSE_DELAY = 200;

export function MegaMenu({ label, rootSlug, rootOverride, onNavigate }: MegaMenuProps) {
  const tree = useQuery(api.categories.listAsTree);
  const resolvedRoot = rootOverride ?? tree?.find((c) => c.slug === rootSlug) ?? null;

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openTimer.current) {
        clearTimeout(openTimer.current);
      }
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  const handleOpen = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (openTimer.current) {
      clearTimeout(openTimer.current);
    }
    openTimer.current = setTimeout(() => setOpen(true), HOVER_OPEN_DELAY);
  };

  const handleClose = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const rootHref = `/${resolvedRoot?.slug ?? rootSlug}`;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'hover:text-foreground focus-visible:ring-ring/50 text-muted-foreground inline-flex h-9 items-center gap-1 px-2 text-xs font-medium tracking-widest uppercase transition-colors hover:bg-transparent focus-visible:ring-2 focus-visible:outline-none',
          open && 'text-foreground'
        )}
      >
        {label}
        <ChevronDownIcon
          aria-hidden
          className={cn('size-3.5 transition-transform', open && 'rotate-180')}
        />
      </button>
      <div
        role="menu"
        aria-label={label}
        hidden={!open}
        className={cn(
          'bg-popover text-popover-foreground ring-foreground/10 absolute start-0 top-full z-40 mt-2 min-w-56 rounded-lg p-3 text-sm shadow-lg ring-1',
          !open && 'pointer-events-none'
        )}
      >
        <Link
          href={rootHref}
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onNavigate?.();
          }}
          className="hover:bg-muted focus-visible:bg-muted block cursor-pointer rounded-md px-2 py-1.5 text-sm font-medium focus-visible:outline-none"
        >
          {t('actions.continue')} {label.toLowerCase()}
        </Link>
        {resolvedRoot && resolvedRoot.children.length > 0 ? (
          <ul className="mt-1 flex flex-col">
            {resolvedRoot.children.map((child) => (
              <li key={child._id}>
                <Link
                  href={`/${resolvedRoot.slug}/${child.slug}`}
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="hover:bg-muted focus-visible:bg-muted block cursor-pointer rounded-md px-2 py-1.5 text-sm focus-visible:outline-none"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
