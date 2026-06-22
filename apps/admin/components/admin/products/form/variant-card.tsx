'use client';

import * as React from 'react';
import { ChevronDownIcon, ChevronUpIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Badge } from '@workspace/ui/components/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { SIZE_OPTIONS } from '@workspace/lib/constants';
import { t } from '@workspace/lib/i18n';

import { ImageUploader } from './image-uploader';
import { SizeStockGrid } from './size-stock-grid';
import { MeasurementsEditor } from './measurements-editor';
import type { ColorVariantForm } from './types';

interface VariantCardProps {
  variant: ColorVariantForm;
  onChange: (next: ColorVariantForm) => void;
  onRemove: () => void;
}

export function VariantCard({ variant, onChange, onRemove }: VariantCardProps) {
  const [open, setOpen] = React.useState(true);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const update = React.useCallback(
    (patch: Partial<ColorVariantForm>) => {
      onChange({ ...variant, ...patch });
    },
    [onChange, variant]
  );

  const toggleSize = React.useCallback(
    (size: string) => {
      const has = variant.selectedSizes.includes(size);
      const nextSizes = has
        ? variant.selectedSizes.filter((s) => s !== size)
        : [...variant.selectedSizes, size];
      const nextStock: Record<string, number> = {};
      for (const s of nextSizes) {
        nextStock[s] = variant.stock[s] ?? 0;
      }
      const nextMeasurements = variant.measurements
        ? Object.fromEntries(
            Object.entries(variant.measurements).filter(([k]) => nextSizes.includes(k))
          )
        : undefined;
      onChange({
        ...variant,
        selectedSizes: nextSizes,
        stock: nextStock,
        measurements:
          nextMeasurements && Object.keys(nextMeasurements).length > 0
            ? nextMeasurements
            : undefined,
      });
    },
    [onChange, variant]
  );

  const handleRemove = React.useCallback(() => {
    if (variant.images.length > 0) {
      setConfirmOpen(true);
      return;
    }
    onRemove();
  }, [variant.images.length, onRemove]);

  const handleConfirmRemove = React.useCallback(() => {
    setConfirmOpen(false);
    onRemove();
  }, [onRemove]);

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="border-border inline-block size-5 rounded-full border"
              style={{ backgroundColor: variant.colorHex }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {variant.colorName || (
                  <span className="text-muted-foreground italic">Unnamed variant</span>
                )}
              </span>
              <span className="text-muted-foreground font-mono text-xs">
                {variant.colorHex.toUpperCase()} · {variant.selectedSizes.length} sizes ·{' '}
                {variant.images.length} images
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen((v) => !v)}
              aria-label={
                open ? t('admin.products.form.collapse') : t('admin.products.form.expand')
              }
              className="text-muted-foreground cursor-pointer"
            >
              {open ? (
                <ChevronUpIcon className="size-4" aria-hidden />
              ) : (
                <ChevronDownIcon className="size-4" aria-hidden />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleRemove}
              aria-label={t('admin.products.form.removeVariant')}
              className="text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <Trash2Icon className="size-4" aria-hidden />
            </Button>
          </div>
        </CardHeader>
        {open ? (
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${variant.id}-color-name`}>
                  {t('admin.products.form.colorName')}
                </Label>
                <Input
                  id={`${variant.id}-color-name`}
                  type="text"
                  value={variant.colorName}
                  onChange={(event) => update({ colorName: event.target.value })}
                  placeholder={t('admin.products.form.colorNamePlaceholder')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${variant.id}-color-hex`}>
                  {t('admin.products.form.colorHex')}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`${variant.id}-color-hex`}
                    type="color"
                    value={variant.colorHex}
                    onChange={(event) => update({ colorHex: event.target.value })}
                    className="h-8 w-14 cursor-pointer p-0.5"
                  />
                  <Input
                    type="text"
                    value={variant.colorHex}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(next)) {
                        update({ colorHex: next });
                      }
                    }}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <ImageUploader
              images={variant.images}
              onChange={(images) => update({ images })}
              colorHex={variant.colorHex}
            />

            <div className="flex flex-col gap-2">
              <Label>{t('admin.products.form.sizes')}</Label>
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((size) => {
                  const active = variant.selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className="cursor-pointer"
                      aria-pressed={active}
                    >
                      <Badge variant={active ? 'default' : 'outline'}>
                        <span className="font-mono text-xs">{size}</span>
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            {variant.selectedSizes.length > 0 ? (
              <div className="flex flex-col gap-2">
                <Label>{t('admin.products.form.stockPerSize')}</Label>
                <SizeStockGrid
                  sizes={variant.selectedSizes}
                  stock={variant.stock}
                  onStockChange={(size, qty) =>
                    update({ stock: { ...variant.stock, [size]: qty } })
                  }
                />
              </div>
            ) : null}

            <MeasurementsEditor
              sizes={variant.selectedSizes}
              measurements={variant.measurements}
              onMeasurementsChange={(measurements) => update({ measurements })}
            />
          </CardContent>
        ) : null}
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('admin.products.form.removeVariantConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.products.form.removeVariantConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" onClick={() => setConfirmOpen(false)}>
              {t('admin.products.form.removeVariantConfirmCancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                handleConfirmRemove();
              }}
              className="cursor-pointer"
            >
              {t('admin.products.form.removeVariantConfirmAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
