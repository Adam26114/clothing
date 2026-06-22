'use client';

import * as React from 'react';
import { ChevronDownIcon, ChevronUpIcon, XIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { t } from '@workspace/lib/i18n';

import type { Measurements } from './types';

interface MeasurementsEditorProps {
  sizes: string[];
  measurements: Record<string, Measurements> | undefined;
  onMeasurementsChange: (next: Record<string, Measurements> | undefined) => void;
}

const MEASUREMENT_FIELDS: Array<{ key: keyof Measurements; labelKey: string }> = [
  { key: 'shoulder', labelKey: 'admin.products.form.shoulder' },
  { key: 'chest', labelKey: 'admin.products.form.chest' },
  { key: 'sleeve', labelKey: 'admin.products.form.sleeve' },
  { key: 'waist', labelKey: 'admin.products.form.waist' },
  { key: 'length', labelKey: 'admin.products.form.length' },
];

const EMPTY_MEASUREMENT: Measurements = {
  shoulder: 0,
  chest: 0,
  sleeve: 0,
  waist: 0,
  length: 0,
};

export function MeasurementsEditor({
  sizes,
  measurements,
  onMeasurementsChange,
}: MeasurementsEditorProps) {
  const hasMeasurements = measurements !== undefined;
  const [openSizes, setOpenSizes] = React.useState<Set<string>>(() => new Set());

  const handleAdd = React.useCallback(() => {
    const next: Record<string, Measurements> = {};
    for (const size of sizes) {
      next[size] = measurements?.[size] ?? { ...EMPTY_MEASUREMENT };
    }
    onMeasurementsChange(next);
    setOpenSizes((prev) => {
      const set = new Set(prev);
      set.add(sizes[0] ?? '');
      return set;
    });
  }, [measurements, onMeasurementsChange, sizes]);

  const handleRemove = React.useCallback(() => {
    onMeasurementsChange(undefined);
    setOpenSizes(new Set());
  }, [onMeasurementsChange]);

  const updateMeasurement = React.useCallback(
    (size: string, key: keyof Measurements, value: number) => {
      if (!measurements) {
        return;
      }
      const current = measurements[size] ?? { ...EMPTY_MEASUREMENT };
      onMeasurementsChange({
        ...measurements,
        [size]: { ...current, [key]: value },
      });
    },
    [measurements, onMeasurementsChange]
  );

  const toggleOpen = React.useCallback((size: string) => {
    setOpenSizes((prev) => {
      const set = new Set(prev);
      if (set.has(size)) {
        set.delete(size);
      } else {
        set.add(size);
      }
      return set;
    });
  }, []);

  if (!hasMeasurements) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="cursor-pointer"
      >
        {t('admin.products.form.addMeasurements')}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t('admin.products.form.measurements')}</p>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleRemove}
          className="text-muted-foreground cursor-pointer"
        >
          <XIcon className="me-1.5 size-3" aria-hidden />
          {t('admin.products.form.removeMeasurements')}
        </Button>
      </div>
      <div className="flex flex-col divide-y rounded-lg border">
        {sizes.map((size) => {
          const isOpen = openSizes.has(size);
          const data = measurements[size] ?? { ...EMPTY_MEASUREMENT };
          return (
            <div key={size}>
              <button
                type="button"
                onClick={() => toggleOpen(size)}
                className="hover:bg-muted/50 flex w-full items-center justify-between px-3 py-2 text-left transition-colors"
              >
                <span className="font-mono text-sm font-medium uppercase">{size}</span>
                {isOpen ? (
                  <ChevronUpIcon className="text-muted-foreground size-4" aria-hidden />
                ) : (
                  <ChevronDownIcon className="text-muted-foreground size-4" aria-hidden />
                )}
              </button>
              {isOpen ? (
                <div className="grid grid-cols-2 gap-3 px-3 pb-3 sm:grid-cols-5">
                  {MEASUREMENT_FIELDS.map((field) => (
                    <div key={field.key} className="flex flex-col gap-1">
                      <Label htmlFor={`meas-${size}-${field.key}`} className="text-xs">
                        {t(field.labelKey)}
                      </Label>
                      <Input
                        id={`meas-${size}-${field.key}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={data[field.key] === 0 ? '' : data[field.key]}
                        onChange={(event) => {
                          const num = Number(event.target.value);
                          updateMeasurement(
                            size,
                            field.key,
                            Number.isFinite(num) ? Math.max(0, num) : 0
                          );
                        }}
                        className="tabular-nums"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
