'use client';

import Link from 'next/link';
import { HeartIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { t } from '@workspace/lib/i18n';

import { EmptyState } from '@workspace/ui/components/empty-state';

export function EmptyWishlist() {
  return (
    <EmptyState
      icon={<HeartIcon className="size-10" aria-hidden />}
      title={t('wishlist.empty')}
      description={t('wishlist.emptyDescription')}
      action={
        <Button render={<Link href="/" />} size="default" className="cursor-pointer">
          {t('wishlist.browseCta')}
        </Button>
      }
    />
  );
}
