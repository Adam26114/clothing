'use client';

import { Combobox, type ComboboxOption } from '@workspace/ui/components/combobox';
import { Switch } from '@workspace/ui/components/switch';
import { t } from '@workspace/lib/i18n';
import type { Doc, Id } from '@workspace/convex/_generated/dataModel';

export type StockFilter = 'none' | 'low' | 'out';

type CategoryFilter = Id<'categories'> | 'all';

interface InventoryFiltersProps {
  category: CategoryFilter;
  onCategoryChange: (next: CategoryFilter) => void;
  stockFilter: StockFilter;
  onStockFilterChange: (next: StockFilter) => void;
  categories: ReadonlyArray<Doc<'categories'>>;
}

export function InventoryFilters({
  category,
  onCategoryChange,
  stockFilter,
  onStockFilterChange,
  categories,
}: InventoryFiltersProps) {
  const handleLowStockToggle = (next: boolean) => {
    onStockFilterChange(next ? 'low' : 'none');
  };

  const handleOutOfStockToggle = (next: boolean) => {
    onStockFilterChange(next ? 'out' : 'none');
  };

  const categoryOptions: ReadonlyArray<ComboboxOption<CategoryFilter>> = [
    { value: 'all', label: t('admin.inventory.filterCategoryAll') },
    ...categories.map((cat) => ({
      value: cat._id as CategoryFilter,
      label: cat.name,
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Combobox<CategoryFilter>
        multiple={false}
        options={categoryOptions}
        value={category}
        onChange={(next) => {
          onCategoryChange(next ?? 'all');
        }}
        placeholder={t('admin.inventory.filterCategory')}
        searchPlaceholder={t('admin.inventory.filterCategorySearch')}
        emptyMessage={t('admin.inventory.filterCategoryEmpty')}
        clearable={false}
      />

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
    </div>
  );
}
