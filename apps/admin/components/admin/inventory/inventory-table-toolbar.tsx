'use client';

import * as React from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import type { Doc, Id } from '@workspace/convex/_generated/dataModel';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { t } from '@workspace/lib/i18n';

export type StockFilter = 'none' | 'low' | 'out';

interface InventoryTableToolbarProps {
  search: string;
  onSearchChange: (next: string) => void;
  category: Id<'categories'> | 'all';
  onCategoryChange: (next: Id<'categories'> | 'all') => void;
  stockFilter: StockFilter;
  onStockFilterChange: (next: StockFilter) => void;
  categories: ReadonlyArray<Doc<'categories'>>;
  onClear: () => void;
  shown: number;
  total: number;
}

export function InventoryTableToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  stockFilter,
  onStockFilterChange,
  categories,
  onClear,
  shown,
  total,
}: InventoryTableToolbarProps) {
  const hasSearch = search.length > 0;
  const hasCategory = category !== 'all';
  const hasStockFilter = stockFilter !== 'none';
  const hasActive = hasSearch || hasCategory || hasStockFilter;

  const handleLowStockToggle = React.useCallback(
    (next: boolean) => {
      onStockFilterChange(next ? 'low' : 'none');
    },
    [onStockFilterChange]
  );

  const handleOutOfStockToggle = React.useCallback(
    (next: boolean) => {
      onStockFilterChange(next ? 'out' : 'none');
    },
    [onStockFilterChange]
  );

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
            placeholder={t('admin.inventory.searchPlaceholder')}
            className="h-8 w-full ps-8 pe-8"
            aria-label={t('admin.inventory.searchPlaceholder')}
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

        <Select<string>
          value={category}
          onValueChange={(value) => {
            if (value === null) {
              return;
            }
            if (value === 'all') {
              onCategoryChange('all');
              return;
            }
            onCategoryChange(value as Id<'categories'>);
          }}
        >
          <SelectTrigger size="sm" className="min-w-40 cursor-pointer">
            <SelectValue placeholder={t('admin.inventory.filterCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              {t('admin.inventory.filterCategoryAll')}
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={String(cat._id)} className="cursor-pointer">
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch
            size="sm"
            checked={stockFilter === 'low'}
            onCheckedChange={handleLowStockToggle}
            aria-label={t('admin.inventory.filterLowStock')}
            className="cursor-pointer"
          />
          <span className="text-sm">{t('admin.inventory.filterLowStock')}</span>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            size="sm"
            checked={stockFilter === 'out'}
            onCheckedChange={handleOutOfStockToggle}
            aria-label={t('admin.inventory.filterOutOfStock')}
            className="cursor-pointer"
          />
          <span className="text-sm">{t('admin.inventory.filterOutOfStock')}</span>
        </div>

        {hasActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="cursor-pointer"
          >
            <XIcon className="me-1.5 size-4" aria-hidden />
            {t('admin.inventory.clearFilters')}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {hasStockFilter ? (
          <Badge variant="secondary" className="gap-1.5">
            <span className="text-xs">
              {stockFilter === 'low'
                ? t('admin.inventory.filterLowStock')
                : t('admin.inventory.filterOutOfStock')}
            </span>
            <button
              type="button"
              onClick={() => onStockFilterChange('none')}
              className="text-muted-foreground hover:text-foreground inline-flex size-4 cursor-pointer items-center justify-center rounded-sm transition-colors"
              aria-label={`Clear filter: ${
                stockFilter === 'low'
                  ? t('admin.inventory.filterLowStock')
                  : t('admin.inventory.filterOutOfStock')
              }`}
            >
              <XIcon className="size-3" aria-hidden />
            </button>
          </Badge>
        ) : null}
        {hasCategory ? (
          <Badge variant="secondary" className="gap-1.5">
            <span className="text-xs">{t('admin.inventory.filterCategory')}</span>
            <button
              type="button"
              onClick={() => onCategoryChange('all')}
              className="text-muted-foreground hover:text-foreground inline-flex size-4 cursor-pointer items-center justify-center rounded-sm transition-colors"
              aria-label={`Clear filter: ${t('admin.inventory.filterCategory')}`}
            >
              <XIcon className="size-3" aria-hidden />
            </button>
          </Badge>
        ) : null}
        <span className="text-muted-foreground text-xs tabular-nums">
          {t('admin.inventory.showingOf', 'en', { shown, total })}
        </span>
      </div>
    </div>
  );
}
