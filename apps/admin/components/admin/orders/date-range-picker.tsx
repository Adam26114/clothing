'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { Calendar } from '@workspace/ui/components/calendar';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { t } from '@workspace/lib/i18n';

export type DateRangePreset = 'all' | 'today' | '7d' | '30d' | '90d' | 'custom';

export type DateRangeValue =
  | { preset: Exclude<DateRangePreset, 'custom'> }
  | { preset: 'custom'; from: number; to: number };

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function subDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

export function dateRangeToBounds(
  value: DateRangeValue,
  now: Date = new Date()
): { dateFrom?: number; dateTo?: number } {
  switch (value.preset) {
    case 'all':
      return {};
    case 'today':
      return {
        dateFrom: startOfDay(now).getTime(),
        dateTo: endOfDay(now).getTime(),
      };
    case '7d':
      return {
        dateFrom: startOfDay(subDays(now, 7)).getTime(),
        dateTo: endOfDay(now).getTime(),
      };
    case '30d':
      return {
        dateFrom: startOfDay(subDays(now, 30)).getTime(),
        dateTo: endOfDay(now).getTime(),
      };
    case '90d':
      return {
        dateFrom: startOfDay(subDays(now, 90)).getTime(),
        dateTo: endOfDay(now).getTime(),
      };
    case 'custom':
      return { dateFrom: value.from, dateTo: value.to };
  }
}

const PRESET_OPTIONS: ReadonlyArray<{ value: DateRangePreset; labelKey: string }> = [
  { value: 'all', labelKey: 'admin.orders.dateRange.all' },
  { value: 'today', labelKey: 'admin.orders.dateRange.today' },
  { value: '7d', labelKey: 'admin.orders.dateRange.7d' },
  { value: '30d', labelKey: 'admin.orders.dateRange.30d' },
  { value: '90d', labelKey: 'admin.orders.dateRange.90d' },
  { value: 'custom', labelKey: 'admin.orders.dateRange.custom' },
];

function isDateRangePreset(value: string): value is DateRangePreset {
  return PRESET_OPTIONS.some((option) => option.value === value);
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatTimestamp(ms: number): string {
  return DATE_FORMAT.format(new Date(ms));
}

function defaultCustomRange(now: Date = new Date()): { from: number; to: number } {
  return {
    from: startOfDay(subDays(now, 30)).getTime(),
    to: endOfDay(now).getTime(),
  };
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={value.preset}
        onValueChange={(next) => {
          if (next === null || !isDateRangePreset(next)) {
            return;
          }
          if (next === 'custom') {
            const seed = defaultCustomRange();
            onChange({ preset: 'custom', from: seed.from, to: seed.to });
          } else {
            onChange({ preset: next });
          }
        }}
      >
        <SelectTrigger
          size="sm"
          className="min-w-40 cursor-pointer"
          aria-label={t('admin.orders.dateRange.label')}
        >
          <SelectValue placeholder={t('admin.orders.dateRange.label')} />
        </SelectTrigger>
        <SelectContent>
          {PRESET_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="cursor-pointer">
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.preset === 'custom' ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer font-normal"
                aria-label={t('admin.orders.dateRange.custom')}
              />
            }
          >
            <CalendarIcon className="me-1.5 size-4" aria-hidden />
            {value.preset === 'custom' ? formatRange(value.from, value.to) : null}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-3">
            <CustomRangeEditor
              key={`${value.from}-${value.to}`}
              initialFrom={value.from}
              initialTo={value.to}
              onApply={(next) => {
                onChange({ preset: 'custom', from: next.from, to: next.to });
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}

interface CustomRangeEditorProps {
  initialFrom: number;
  initialTo: number;
  onApply: (next: { from: number; to: number }) => void;
}

function CustomRangeEditor({ initialFrom, initialTo, onApply }: CustomRangeEditorProps) {
  const [fromDate, setFromDate] = React.useState<Date | undefined>(() => new Date(initialFrom));
  const [toDate, setToDate] = React.useState<Date | undefined>(() => new Date(initialTo));

  const canApply =
    fromDate !== undefined && toDate !== undefined && fromDate.getTime() <= toDate.getTime();

  return (
    <div>
      <PopoverHeader className="px-1 pb-2">
        <PopoverTitle>{t('admin.orders.dateRange.custom')}</PopoverTitle>
      </PopoverHeader>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            {t('admin.orders.dateRange.from')}
          </span>
          <Calendar
            mode="single"
            selected={fromDate}
            onSelect={setFromDate}
            defaultMonth={fromDate}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            {t('admin.orders.dateRange.to')}
          </span>
          <Calendar mode="single" selected={toDate} onSelect={setToDate} defaultMonth={toDate} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 border-t pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const seed = defaultCustomRange();
            setFromDate(new Date(seed.from));
            setToDate(new Date(seed.to));
          }}
          className="cursor-pointer"
        >
          {t('admin.orders.dateRange.clear')}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canApply}
          onClick={() => {
            if (!canApply) {
              return;
            }
            onApply({
              from: startOfDay(fromDate!).getTime(),
              to: endOfDay(toDate!).getTime(),
            });
          }}
          className="cursor-pointer"
        >
          {t('admin.orders.dateRange.apply')}
        </Button>
      </div>
    </div>
  );
}

function formatRange(from: number, to: number): string {
  if (from === to) {
    return formatTimestamp(from);
  }
  return `${formatTimestamp(from)} – ${formatTimestamp(to)}`;
}
