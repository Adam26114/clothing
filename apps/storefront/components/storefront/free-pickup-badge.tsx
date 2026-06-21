import { TruckIcon } from 'lucide-react';

import { t } from '@workspace/lib/i18n';
import { cn } from '@workspace/lib/cn';

interface FreePickupBadgeProps {
  className?: string;
}

export function FreePickupBadge({ className }: FreePickupBadgeProps) {
  return (
    <div
      className={cn(
        'border-border bg-secondary text-secondary-foreground inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
        className
      )}
    >
      <TruckIcon aria-hidden className="size-4" />
      <span>{t('pdp.freePickup')}</span>
    </div>
  );
}
