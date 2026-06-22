'use client';

import * as React from 'react';
import { CheckIcon, Loader2Icon, AlertCircleIcon } from 'lucide-react';
import { useQuery } from 'convex/react';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { t } from '@workspace/lib/i18n';
import { useDebouncedValue } from '@workspace/lib/hooks/use-debounced-value';

interface SlugFieldProps {
  value: string;
  onChange: (next: string) => void;
  onValidityChange?: (valid: boolean) => void;
  excludeProductId?: Id<'products'> | null;
  id?: string;
  disabled?: boolean;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function SlugField({
  value,
  onChange,
  onValidityChange,
  excludeProductId,
  id = 'product-slug',
  disabled = false,
}: SlugFieldProps) {
  const debouncedSlug = useDebouncedValue(value, 300);
  const trimmed = debouncedSlug.trim();
  const isWellFormed = trimmed.length > 0 && SLUG_PATTERN.test(trimmed);

  const checkQuery = useQuery(
    api.products.adminList,
    isWellFormed ? { search: trimmed, pageSize: 1 } : 'skip'
  );

  const takenByOther =
    isWellFormed &&
    checkQuery !== undefined &&
    checkQuery.items.some((item) => item.slug === trimmed) &&
    (excludeProductId === null ||
      excludeProductId === undefined ||
      checkQuery.items[0]?._id !== excludeProductId);

  const isAvailable = isWellFormed && checkQuery !== undefined && !takenByOther;

  const isInvalid = trimmed.length === 0 ? null : isWellFormed ? !isAvailable : true;

  React.useEffect(() => {
    if (!onValidityChange) {
      return;
    }
    if (trimmed.length === 0) {
      onValidityChange(false);
      return;
    }
    if (!isWellFormed) {
      onValidityChange(false);
      return;
    }
    if (checkQuery === undefined) {
      onValidityChange(false);
      return;
    }
    onValidityChange(!takenByOther);
  }, [checkQuery, isWellFormed, onValidityChange, takenByOther, trimmed.length]);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{t('admin.products.form.slug')}</Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="my-product-slug"
          disabled={disabled}
          aria-invalid={isInvalid === true}
          className="pe-9 font-mono"
        />
        <div className="text-muted-foreground pointer-events-none absolute end-2 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center">
          {checkQuery === undefined && isWellFormed ? (
            <Loader2Icon
              className="size-4 animate-spin"
              aria-label={t('admin.products.form.slugChecking')}
            />
          ) : isAvailable ? (
            <CheckIcon
              className="text-primary size-4"
              aria-label={t('admin.products.form.slugAvailable')}
            />
          ) : isInvalid ? (
            <AlertCircleIcon
              className="text-destructive size-4"
              aria-label={t('admin.products.form.slugTaken')}
            />
          ) : null}
        </div>
      </div>
      <p className="text-muted-foreground text-xs">{t('admin.products.form.slugHint')}</p>
      {isInvalid === true && trimmed.length > 0 ? (
        <p className="text-destructive text-xs">
          {!isWellFormed
            ? t('admin.products.error.invalidSlug')
            : t('admin.products.form.slugTaken')}
        </p>
      ) : null}
    </div>
  );
}
