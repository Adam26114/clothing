'use client';

import { SearchIcon, XIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { t } from '@workspace/lib/i18n';

import type { OrderStatus } from '@workspace/ui/components/admin/status-badge';

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

interface OrdersTableToolbarProps {
  search: string;
  onSearchChange: (next: string) => void;
  status: OrderStatusFilter;
  onStatusChange: (next: OrderStatusFilter) => void;
  onClear: () => void;
  shown: number;
  total: number;
}

export function OrdersTableToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onClear,
  shown,
  total,
}: OrdersTableToolbarProps) {
  const hasActive = search.length > 0 || status !== 'all';
  const hasSearch = search.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon
            className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('admin.orders.searchPlaceholder')}
            className="h-8 w-full ps-8 pe-8"
            aria-label={t('admin.orders.searchPlaceholder')}
          />
          {hasSearch ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-muted-foreground hover:text-foreground absolute end-2 top-1/2 inline-flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm transition-colors"
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>

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

        {hasActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="cursor-pointer"
          >
            <XIcon className="me-1.5 size-4" aria-hidden />
            {t('admin.orders.clearFilters')}
          </Button>
        ) : null}
      </div>

      <div className="text-muted-foreground text-xs tabular-nums">
        {t('admin.orders.showingOf', 'en', { shown, total })}
      </div>
    </div>
  );
}
