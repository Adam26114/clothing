'use client';

import * as React from 'react';
import { useQuery } from 'convex/react';
import type { Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { t } from '@workspace/lib/i18n';

import { SlugField } from './slug-field';
import type { ProductFormState } from './types';

interface DetailsTabProps {
  state: ProductFormState;
  onStateChange: (next: ProductFormState) => void;
  excludeProductId: Id<'products'> | null;
  onNameChange: (name: string) => void;
  onSlugValidityChange: (valid: boolean) => void;
}

export function DetailsTab({
  state,
  onStateChange,
  excludeProductId,
  onNameChange,
  onSlugValidityChange,
}: DetailsTabProps) {
  const categories = useQuery(api.categories.listActive, {});

  const update = React.useCallback(
    (patch: Partial<ProductFormState>) => {
      onStateChange({ ...state, ...patch });
    },
    [onStateChange, state]
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-name">{t('admin.products.form.name')}</Label>
        <Input
          id="product-name"
          type="text"
          value={state.name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={t('admin.products.form.namePlaceholder')}
          required
        />
      </div>

      <SlugField
        value={state.slug}
        onChange={(slug) => update({ slug })}
        onValidityChange={onSlugValidityChange}
        excludeProductId={excludeProductId}
        id="product-slug"
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-sku">{t('admin.products.form.sku')}</Label>
        <Input
          id="product-sku"
          type="text"
          value={state.sku}
          onChange={(event) => update({ sku: event.target.value })}
          placeholder={t('admin.products.form.skuPlaceholder')}
          className="font-mono"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-category">{t('admin.products.form.category')}</Label>
        <Select
          value={state.categoryId ?? 'none'}
          onValueChange={(value) => {
            if (value === null) {
              return;
            }
            if (value === 'none') {
              update({ categoryId: null });
              return;
            }
            update({ categoryId: value as Id<'categories'> });
          }}
        >
          <SelectTrigger id="product-category" size="sm" className="w-full cursor-pointer">
            <SelectValue placeholder={t('admin.products.form.categoryPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {categories === undefined ? (
              <SelectItem value="none" disabled>
                …
              </SelectItem>
            ) : (
              <>
                <SelectItem value="none" className="cursor-pointer">
                  —
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={String(cat._id)} className="cursor-pointer">
                    {cat.name}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="product-description">{t('admin.products.form.description')}</Label>
        <Textarea
          id="product-description"
          rows={4}
          value={state.description}
          onChange={(event) => update({ description: event.target.value })}
          placeholder={t('admin.products.form.descriptionPlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-base-price">{t('admin.products.form.basePrice')}</Label>
        <Input
          id="product-base-price"
          type="number"
          inputMode="decimal"
          min="0"
          step="100"
          value={state.basePrice}
          onChange={(event) => update({ basePrice: event.target.value })}
          placeholder={t('admin.products.form.basePricePlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-sale-price">{t('admin.products.form.salePrice')}</Label>
        <Input
          id="product-sale-price"
          type="number"
          inputMode="decimal"
          min="0"
          step="100"
          value={state.salePrice}
          onChange={(event) => update({ salePrice: event.target.value })}
          placeholder={t('admin.products.form.salePricePlaceholder')}
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <Label htmlFor="product-featured" className="cursor-pointer">
          {t('admin.products.form.featured')}
        </Label>
        <Switch
          id="product-featured"
          size="sm"
          checked={state.isFeatured}
          onCheckedChange={(value) => update({ isFeatured: value })}
          className="cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <Label htmlFor="product-published" className="cursor-pointer">
          {t('admin.products.form.published')}
        </Label>
        <Switch
          id="product-published"
          size="sm"
          checked={state.isPublished}
          onCheckedChange={(value) => update({ isPublished: value })}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
}
