'use client';

import { Combobox, type ComboboxOption } from '@workspace/ui/components/combobox';
import { t } from '@workspace/lib/i18n';
import type { OrderStatus } from '@workspace/ui/components/admin/status-badge';

import { DateRangePicker, type DateRangeValue } from '@/components/admin/orders/date-range-picker';

const STATUS_VALUES: ReadonlyArray<OrderStatus> = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

const STATUS_OPTIONS: ReadonlyArray<ComboboxOption<OrderStatus>> = STATUS_VALUES.map((value) => ({
  value,
  label: t(`order.status${value.charAt(0).toUpperCase()}${value.slice(1)}`),
}));

interface OrdersFiltersProps {
  status: ReadonlyArray<OrderStatus>;
  onStatusChange: (next: ReadonlyArray<OrderStatus>) => void;
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
      <Combobox
        options={STATUS_OPTIONS}
        value={status}
        onChange={onStatusChange}
        placeholder={t('admin.orders.statusFilter')}
        searchPlaceholder={t('admin.orders.statusFilterSearch')}
        emptyMessage={t('admin.orders.statusFilterEmpty')}
        maxLabelCount={1}
      />

      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
}
