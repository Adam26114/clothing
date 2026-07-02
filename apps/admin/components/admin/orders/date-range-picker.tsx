'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { Calendar } from '@workspace/ui/components/calendar';
import { Combobox, type ComboboxOption } from '@workspace/ui/components/combobox';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import { cn } from '@workspace/ui/lib/utils';
import { t } from '@workspace/lib/i18n';

export type DateRangePreset = 'all' | 'today' | '7d' | '30d' | '90d' | 'custom';

export type DateRangeValue =
  { preset: Exclude<DateRangePreset, 'custom'> } | { preset: 'custom'; from: number; to: number };

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

const PRESET_VALUES: ReadonlyArray<DateRangePreset> = [
  'all',
  'today',
  '7d',
  '30d',
  '90d',
  'custom',
];

const PRESET_OPTIONS: ReadonlyArray<ComboboxOption<DateRangePreset>> = PRESET_VALUES.map(
  (value) => ({
    value,
    label: t(`admin.orders.dateRange.${value}`),
  })
);

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
  const [customOpen, setCustomOpen] = React.useState(false);
  const [pendingPreset, setPendingPreset] = React.useState<DateRangePreset | null>(null);

  const handlePresetChange = React.useCallback(
    (next: DateRangePreset | null) => {
      if (next === null || next === 'all') {
        onChange({ preset: 'all' });
        return;
      }
      if (next === 'custom') {
        setPendingPreset('custom');
        setCustomOpen(true);
        return;
      }
      onChange({ preset: next });
    },
    [onChange]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Combobox<DateRangePreset>
        multiple={false}
        options={PRESET_OPTIONS}
        value={pendingPreset ?? value.preset}
        onChange={handlePresetChange}
        placeholder={t('admin.orders.dateRange.label')}
        searchPlaceholder={t('admin.orders.dateRange.search')}
        emptyMessage={t('admin.orders.dateRange.empty')}
        clearable={false}
      />

      {value.preset === 'custom' ? (
        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('h-7 cursor-pointer font-normal')}
                aria-label={t('admin.orders.dateRange.custom')}
              />
            }
          >
            <CalendarIcon className="me-1.5 size-4" aria-hidden />
            {formatRange(value.from, value.to)}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-3">
            <CustomRangeEditor
              key={`${value.from}-${value.to}`}
              initialFrom={value.from}
              initialTo={value.to}
              onApply={(next) => {
                onChange({ preset: 'custom', from: next.from, to: next.to });
                setCustomOpen(false);
                setPendingPreset(null);
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
