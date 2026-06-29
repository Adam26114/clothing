'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { t } from '@workspace/lib/i18n';
import type { Doc, Id } from '@workspace/convex/_generated/dataModel';

export type StockFilter = 'none' | 'low' | 'out';

interface InventoryFiltersProps {
  category: Id<'categories'> | 'all';
  onCategoryChange: (next: Id<'categories'> | 'all') => void;
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
    </div>
  );
}
