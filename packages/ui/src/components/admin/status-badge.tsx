import { CircleCheckIcon } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';

import { cn } from '@workspace/ui/lib/utils';
import { Badge, badgeVariants } from '@workspace/ui/components/badge';

export type OrderStatus =
  'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

interface StatusBadgeProps {
  status: OrderStatus;
  label?: string;
  className?: string;
}

const STATUS_MAP: Record<OrderStatus, { variant: BadgeVariant; icon?: 'check' }> = {
  pending: { variant: 'secondary' },
  confirmed: { variant: 'default' },
  processing: { variant: 'outline' },
  shipped: { variant: 'default', icon: 'check' },
  delivered: { variant: 'outline', icon: 'check' },
  cancelled: { variant: 'destructive' },
};

function defaultLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const { variant, icon } = STATUS_MAP[status];
  const text = label ?? defaultLabel(status);
  return (
    <Badge variant={variant} className={cn('cursor-default', className)}>
      {icon === 'check' ? <CircleCheckIcon className="fill-primary text-primary" /> : null}
      {text}
    </Badge>
  );
}
