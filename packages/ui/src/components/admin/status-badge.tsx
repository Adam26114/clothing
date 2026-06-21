import { CircleCheckIcon } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';
import { t } from '@workspace/lib/i18n';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

const STATUS_KEY: Record<OrderStatus, string> = {
  pending: 'order.statusPending',
  confirmed: 'order.statusConfirmed',
  processing: 'order.statusProcessing',
  shipped: 'order.statusShipped',
  delivered: 'order.statusDelivered',
  cancelled: 'order.statusCancelled',
};

function statusLabel(status: OrderStatus): string {
  return t(STATUS_KEY[status]);
}

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="secondary" className={cn('cursor-default', className)}>
          {statusLabel(status)}
        </Badge>
      );
    case 'confirmed':
      return (
        <Badge variant="default" className={cn('cursor-default', className)}>
          {statusLabel(status)}
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="outline" className={cn('cursor-default', className)}>
          {statusLabel(status)}
        </Badge>
      );
    case 'shipped':
      return (
        <Badge variant="default" className={cn('cursor-default', className)}>
          <CircleCheckIcon className="fill-primary text-primary" />
          {statusLabel(status)}
        </Badge>
      );
    case 'delivered':
      return (
        <Badge variant="outline" className={cn('cursor-default', className)}>
          <CircleCheckIcon className="fill-primary text-primary" />
          {statusLabel(status)}
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive" className={cn('cursor-default', className)}>
          {statusLabel(status)}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className={cn('cursor-default', className)}>
          {status}
        </Badge>
      );
  }
}
