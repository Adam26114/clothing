'use client';

import { Combobox, type ComboboxOption } from '@workspace/ui/components/combobox';
import { t } from '@workspace/lib/i18n';
import type { Doc, Id } from '@workspace/convex/_generated/dataModel';

export type ActiveFilter = 'all' | 'active' | 'inactive';
export type FeaturedFilter = 'all' | 'featured' | 'unfeatured';

type CategoryFilter = Id<'categories'> | 'all';

interface ProductsFiltersProps {
  category: CategoryFilter;
  onCategoryChange: (next: CategoryFilter) => void;
  active: ActiveFilter;
  onActiveChange: (next: ActiveFilter) => void;
  featured: FeaturedFilter;
  onFeaturedChange: (next: FeaturedFilter) => void;
  categories: ReadonlyArray<Doc<'categories'>>;
}

const ACTIVE_VALUES: ReadonlyArray<ActiveFilter> = ['all', 'active', 'inactive'];
const FEATURED_VALUES: ReadonlyArray<FeaturedFilter> = ['all', 'featured', 'unfeatured'];

const ACTIVE_LABEL_KEYS: Record<ActiveFilter, string> = {
  all: 'admin.products.filterAll',
  active: 'admin.products.filterActiveOnly',
  inactive: 'admin.products.filterInactiveOnly',
};

const FEATURED_LABEL_KEYS: Record<FeaturedFilter, string> = {
  all: 'admin.products.filterFeaturedAll',
  featured: 'admin.products.filterFeaturedYes',
  unfeatured: 'admin.products.filterFeaturedNo',
};

export function ProductsFilters({
  category,
  onCategoryChange,
  active,
  onActiveChange,
  featured,
  onFeaturedChange,
  categories,
}: ProductsFiltersProps) {
  const categoryOptions: ReadonlyArray<ComboboxOption<CategoryFilter>> = [
    { value: 'all', label: t('admin.products.filterCategoryAll') },
    ...categories.map((cat) => ({
      value: cat._id as CategoryFilter,
      label: cat.name,
    })),
  ];

  const activeOptions: ReadonlyArray<ComboboxOption<ActiveFilter>> = ACTIVE_VALUES.map((value) => ({
    value,
    label: t(ACTIVE_LABEL_KEYS[value]),
  }));

  const featuredOptions: ReadonlyArray<ComboboxOption<FeaturedFilter>> = FEATURED_VALUES.map(
    (value) => ({ value, label: t(FEATURED_LABEL_KEYS[value]) })
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Combobox<CategoryFilter>
        multiple={false}
        options={categoryOptions}
        value={category}
        onChange={(next) => {
          onCategoryChange(next ?? 'all');
        }}
        placeholder={t('admin.products.filterCategory')}
        searchPlaceholder={t('admin.products.filterCategorySearch')}
        emptyMessage={t('admin.products.filterCategoryEmpty')}
        clearable={false}
      />

      <Combobox<ActiveFilter>
        multiple={false}
        options={activeOptions}
        value={active}
        onChange={(next) => {
          onActiveChange(next ?? 'all');
        }}
        placeholder={t('admin.products.filterActive')}
        searchPlaceholder={t('admin.products.filterActiveSearch')}
        emptyMessage={t('admin.products.filterActiveEmpty')}
        clearable={false}
        triggerClassName="min-w-32"
      />

      <Combobox<FeaturedFilter>
        multiple={false}
        options={featuredOptions}
        value={featured}
        onChange={(next) => {
          onFeaturedChange(next ?? 'all');
        }}
        placeholder={t('admin.products.filterFeatured')}
        searchPlaceholder={t('admin.products.filterFeaturedSearch')}
        emptyMessage={t('admin.products.filterFeaturedEmpty')}
        clearable={false}
        triggerClassName="min-w-32"
      />
    </div>
  );
}
