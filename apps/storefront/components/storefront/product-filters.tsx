'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XIcon } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { t } from '@workspace/lib/i18n';
import { SIZE_OPTIONS, type SizeOption } from '@workspace/lib/constants';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Separator } from '@workspace/ui/components/separator';

interface ProductFiltersProps {
  distinctColors: string[];
  categoryOptions?: Array<{ label: string; value: string }>;
  className?: string;
}

function parseListParam(value: string | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ProductFilters({
  distinctColors,
  categoryOptions,
  className,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const selectedSizes = parseListParam(searchParams.get('size')) as SizeOption[];
  const selectedColors = parseListParam(searchParams.get('color'));
  const minPrice = searchParams.get('min') ?? '';
  const maxPrice = searchParams.get('max') ?? '';
  const selectedCategory = searchParams.get('category') ?? '';

  const updateParams = (mutator: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    params.delete('page');
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  const handleSizeToggle = (size: SizeOption) => {
    updateParams((params) => {
      const next = toggleInList(selectedSizes, size);
      if (next.length === 0) {
        params.delete('size');
      } else {
        params.set('size', next.join(','));
      }
    });
  };

  const handleColorToggle = (color: string) => {
    updateParams((params) => {
      const next = toggleInList(selectedColors, color);
      if (next.length === 0) {
        params.delete('color');
      } else {
        params.set('color', next.join(','));
      }
    });
  };

  const handlePriceChange = (key: 'min' | 'max', value: string) => {
    updateParams((params) => {
      if (value.trim() === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
  };

  const handleCategoryChange = (value: string) => {
    updateParams((params) => {
      if (!value) {
        params.delete('category');
      } else {
        params.set('category', value);
      }
    });
  };

  const handleClear = () => {
    updateParams((params) => {
      params.delete('size');
      params.delete('color');
      params.delete('min');
      params.delete('max');
      params.delete('category');
    });
  };

  return (
    <aside
      aria-busy={pending || undefined}
      className={cn('flex flex-col gap-6 text-sm', className)}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t('plp.filtersHeading')}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-muted-foreground cursor-pointer"
        >
          <XIcon aria-hidden className="size-3.5" />
          {t('plp.clearFilters')}
        </Button>
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t('plp.filterSize')}</h3>
        <div className="flex flex-wrap gap-1.5">
          {SIZE_OPTIONS.map((size) => {
            const isSelected = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeToggle(size)}
                aria-pressed={isSelected}
                className={cn(
                  'inline-flex h-8 min-w-9 cursor-pointer items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors',
                  'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t('plp.filterColor')}</h3>
        {distinctColors.length === 0 ? (
          <p className="text-muted-foreground text-xs">—</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {distinctColors.map((hex) => {
              const isSelected = selectedColors.includes(hex);
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => handleColorToggle(hex)}
                  aria-pressed={isSelected}
                  aria-label={t('a11y.colorSwatch', 'en', { hex })}
                  className={cn(
                    'cursor-pointer rounded-full border-2 p-0.5 transition-all',
                    'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
                    isSelected ? 'border-foreground' : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <span
                    aria-hidden
                    className="block size-5 rounded-full border border-black/10"
                    style={{ backgroundColor: hex }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t('plp.filterPrice')}</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={t('a11y.minimumPrice')}
            value={minPrice}
            onChange={(event) => handlePriceChange('min', event.target.value)}
            className="cursor-pointer"
            aria-label={t('a11y.minimumPrice')}
          />
          <span aria-hidden className="text-muted-foreground">
            –
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={t('a11y.maximumPrice')}
            value={maxPrice}
            onChange={(event) => handlePriceChange('max', event.target.value)}
            className="cursor-pointer"
            aria-label={t('a11y.maximumPrice')}
          />
        </div>
      </div>
      {categoryOptions && categoryOptions.length > 0 ? (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t('plp.filterCategory')}</h3>
            <div className="flex flex-col gap-1">
              {categoryOptions.map((option) => {
                const isSelected = selectedCategory === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleCategoryChange(isSelected ? '' : option.value)}
                    className={cn(
                      'cursor-pointer rounded-md px-2 py-1.5 text-start text-sm transition-colors',
                      'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
                      isSelected
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'hover:bg-accent/50 hover:text-accent-foreground'
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </aside>
  );
}
