import { CircleCheckIcon } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';

export type OrderStatus =
  'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface StatusBadgeProps {
  status: OrderStatus;
  label?: string;
  className?: string;
}

function defaultLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const text = label ?? defaultLabel(status);
  switch (status) {
    case 'pending':
      return (
        <Badge variant="secondary" className={cn('cursor-default', className)}>
          {text}
        </Badge>
      );
    case 'confirmed':
      return (
        <Badge variant="default" className={cn('cursor-default', className)}>
          {text}
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="outline" className={cn('cursor-default', className)}>
          {text}
        </Badge>
      );
    case 'shipped':
      return (
        <Badge variant="default" className={cn('cursor-default', className)}>
          <CircleCheckIcon className="fill-primary text-primary" />
          {text}
        </Badge>
      );
    case 'delivered':
      return (
        <Badge variant="outline" className={cn('cursor-default', className)}>
          <CircleCheckIcon className="fill-primary text-primary" />
          {text}
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive" className={cn('cursor-default', className)}>
          {text}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className={cn('cursor-default', className)}>
          {text}
        </Badge>
      );
  }
}
