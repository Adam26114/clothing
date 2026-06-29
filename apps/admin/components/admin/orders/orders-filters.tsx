'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { t } from '@workspace/lib/i18n';
import type { OrderStatus } from '@workspace/ui/components/admin/status-badge';

import { DateRangePicker, type DateRangeValue } from '@/components/admin/orders/date-range-picker';

export type OrderStatusFilter = OrderStatus | 'all';

const STATUS_OPTIONS: ReadonlyArray<{ value: OrderStatusFilter; labelKey: string }> = [
  { value: 'all', labelKey: 'admin.orders.statusFilterAll' },
  { value: 'pending', labelKey: 'order.statusPending' },
  { value: 'confirmed', labelKey: 'order.statusConfirmed' },
  { value: 'processing', labelKey: 'order.statusProcessing' },
  { value: 'shipped', labelKey: 'order.statusShipped' },
  { value: 'delivered', labelKey: 'order.statusDelivered' },
  { value: 'cancelled', labelKey: 'order.statusCancelled' },
];

export const ORDER_STATUS_FILTER_VALUES = STATUS_OPTIONS.map((option) => option.value);

function isOrderStatusFilter(value: string): value is OrderStatusFilter {
  return ORDER_STATUS_FILTER_VALUES.includes(value as OrderStatusFilter);
}

interface OrdersFiltersProps {
  status: OrderStatusFilter;
  onStatusChange: (next: OrderStatusFilter) => void;
  dateRange: DateRangeValue;
  onDateRangeChange: (next: DateRangeValue) => void;
}

export function OrdersFilters({
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
}: OrdersFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={status}
        onValueChange={(value) => {
          if (value !== null && isOrderStatusFilter(value)) {
            onStatusChange(value);
          }
        }}
      >
        <SelectTrigger size="sm" className="min-w-40 cursor-pointer">
          <SelectValue placeholder={t('admin.orders.statusFilter')} />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="cursor-pointer">
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
}
