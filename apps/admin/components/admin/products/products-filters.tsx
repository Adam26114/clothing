'use client';

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

interface ProductsFiltersProps {
  category: Id<'categories'> | 'all';
  onCategoryChange: (next: Id<'categories'> | 'all') => void;
  active: ActiveFilter;
  onActiveChange: (next: ActiveFilter) => void;
  featured: FeaturedFilter;
  onFeaturedChange: (next: FeaturedFilter) => void;
  categories: ReadonlyArray<Doc<'categories'>>;
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

export function ProductsFilters({
  category,
  onCategoryChange,
  active,
  onActiveChange,
  featured,
  onFeaturedChange,
  categories,
}: ProductsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
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
    </div>
  );
}
