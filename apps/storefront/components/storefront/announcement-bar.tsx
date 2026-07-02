'use client';

import { useSyncExternalStore } from 'react';

import { XIcon } from 'lucide-react';
import { useQuery } from 'convex/react';

import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/ui/lib/utils';
import { api } from '@workspace/convex/_generated/api';
import { Button } from '@workspace/ui/components/button';

const STORAGE_KEY = 'khit:announcement-dismissed';

function subscribeToFlag(callback: () => void): () => void {
  if (typeof globalThis === 'undefined') {
    return () => undefined;
  }
  globalThis.addEventListener('storage', callback);
  return () => globalThis.removeEventListener('storage', callback);
}

function getDismissedSnapshot(): boolean {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
    return false;
  }
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function getDismissedServerSnapshot(): boolean {
  return false;
}

export function AnnouncementBar() {
  const settings = useQuery(api.storeSettings.get);
  const dismissed = useSyncExternalStore(
    subscribeToFlag,
    getDismissedSnapshot,
    getDismissedServerSnapshot
  );

  if (dismissed) {
    return null;
  }

  const text = settings?.announcementBar?.trim();
  if (!text) {
    return null;
  }

  const handleDismiss = () => {
    try {
      if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
        globalThis.localStorage.setItem(STORAGE_KEY, '1');
        globalThis.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="region"
      aria-label={t('a11y.promotion')}
      className={cn(
        'bg-muted text-muted-foreground relative flex items-center justify-center gap-3 border-b px-4 py-1.5 text-center text-xs sm:text-sm'
      )}
    >
      <span>{text}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleDismiss}
        aria-label={t('a11y.dismissPromotion')}
        className="hover:bg-muted/60 absolute end-2 top-1/2 -translate-y-1/2 cursor-pointer"
      >
        <XIcon className="size-3.5" />
      </Button>
    </div>
  );
}
