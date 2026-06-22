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
import type { Doc, Id } from '@workspace/convex/_generated/dataModel';

export type ActiveFilter = 'all' | 'active' | 'inactive';
export type FeaturedFilter = 'all' | 'featured' | 'unfeatured';

interface ProductsTableToolbarProps {
  search: string;
  onSearchChange: (next: string) => void;
  category: Id<'categories'> | 'all';
  onCategoryChange: (next: Id<'categories'> | 'all') => void;
  active: ActiveFilter;
  onActiveChange: (next: ActiveFilter) => void;
  featured: FeaturedFilter;
  onFeaturedChange: (next: FeaturedFilter) => void;
  categories: ReadonlyArray<Doc<'categories'>>;
  onClear: () => void;
  shown: number;
  total: number;
}

const ACTIVE_OPTIONS: ReadonlyArray<{ value: ActiveFilter; labelKey: string }> = [
  { value: 'all', labelKey: 'admin.products.filterAll' },
  { value: 'active', labelKey: 'admin.products.filterActiveOnly' },
  { value: 'inactive', labelKey: 'admin.products.filterInactiveOnly' },
];

const FEATURED_OPTIONS: ReadonlyArray<{ value: FeaturedFilter; labelKey: string }> = [
  { value: 'all', labelKey: 'admin.products.filterFeaturedAll' },
  { value: 'featured', labelKey: 'admin.products.filterFeaturedYes' },
  { value: 'unfeatured', labelKey: 'admin.products.filterFeaturedNo' },
];

function isActiveFilter(value: string): value is ActiveFilter {
  return ACTIVE_OPTIONS.some((option) => option.value === value);
}

function isFeaturedFilter(value: string): value is FeaturedFilter {
  return FEATURED_OPTIONS.some((option) => option.value === value);
}

export function ProductsTableToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  active,
  onActiveChange,
  featured,
  onFeaturedChange,
  categories,
  onClear,
  shown,
  total,
}: ProductsTableToolbarProps) {
  const hasSearch = search.length > 0;
  const hasActive = hasSearch || category !== 'all' || active !== 'all' || featured !== 'all';

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
            placeholder={t('admin.products.searchPlaceholder')}
            className="h-8 w-full ps-8 pe-8"
            aria-label={t('admin.products.searchPlaceholder')}
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
            <SelectValue placeholder={t('admin.products.filterCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              {t('admin.products.filterCategoryAll')}
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={String(cat._id)} className="cursor-pointer">
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={active}
          onValueChange={(value) => {
            if (value === null) {
              return;
            }
            if (isActiveFilter(value)) {
              onActiveChange(value);
            }
          }}
        >
          <SelectTrigger size="sm" className="min-w-32 cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={featured}
          onValueChange={(value) => {
            if (value === null) {
              return;
            }
            if (isFeaturedFilter(value)) {
              onFeaturedChange(value);
            }
          }}
        >
          <SelectTrigger size="sm" className="min-w-32 cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FEATURED_OPTIONS.map((option) => (
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
            {t('admin.products.clearFilters')}
          </Button>
        ) : null}
      </div>

      <div className="text-muted-foreground text-xs tabular-nums">
        {t('admin.products.showingOf', 'en', { shown, total })}
      </div>
    </div>
  );
}
