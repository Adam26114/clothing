import Link from 'next/link';
import { ShoppingBagIcon } from 'lucide-react';

import { t } from '@workspace/lib/i18n';
import { Button } from '@workspace/ui/components/button';
import { EmptyState } from '@workspace/ui/components/empty-state';

interface EmptyCartProps {
  className?: string;
}

export function EmptyCart({ className }: EmptyCartProps = {}) {
  return (
    <EmptyState
      className={className}
      icon={<ShoppingBagIcon className="size-10" aria-hidden />}
      title={t('cart.empty')}
      description={t('cart.emptyDescription')}
      action={
        <Button
          render={<Link href="/" />}
          size="default"
          variant="default"
          className="cursor-pointer"
        >
          {t('cart.continueShopping')}
        </Button>
      }
    />
  );
}
