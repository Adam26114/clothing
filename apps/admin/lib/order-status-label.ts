import type { OrderStatus } from '@workspace/ui/components/admin/status-badge';
import { t } from '@workspace/lib/i18n';

const STATUS_LABEL_KEY: Record<OrderStatus, string> = {
  pending: 'order.statusPending',
  confirmed: 'order.statusConfirmed',
  processing: 'order.statusProcessing',
  shipped: 'order.statusShipped',
  delivered: 'order.statusDelivered',
  cancelled: 'order.statusCancelled',
};

export function orderStatusLabel(status: OrderStatus): string {
  return t(STATUS_LABEL_KEY[status]);
}
