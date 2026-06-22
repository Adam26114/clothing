'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { t } from '@workspace/lib/i18n';

import { EmptyState } from '@workspace/ui/components/empty-state';

interface EmptyCartProps {
  className?: string;
}

export function EmptyCart({ className }: EmptyCartProps) {
  return (
    <EmptyState
      className={className}
      icon={<ShoppingBag className="size-10" strokeWidth={1.5} />}
      title={t('cart.empty')}
      description={t('cart.emptyDescription')}
      action={
        <Button render={<Link href="/" />}>
          <span>{t('cart.continueShopping')}</span>
        </Button>
      }
    />
  );
}
