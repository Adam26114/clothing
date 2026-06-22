'use client';

import { PlusIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { t } from '@workspace/lib/i18n';

import { VariantCard } from './variant-card';
import { createEmptyColorVariant } from './types';
import type { ColorVariantForm } from './types';

interface VariantsTabProps {
  variants: ColorVariantForm[];
  onChange: (next: ColorVariantForm[]) => void;
}

export function VariantsTab({ variants, onChange }: VariantsTabProps) {
  const handleAdd = () => {
    onChange([...variants, createEmptyColorVariant()]);
  };

  const handleUpdate = (index: number, next: ColorVariantForm) => {
    onChange(variants.map((v, i) => (i === index ? next : v)));
  };

  const handleRemove = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-4">
      {variants.map((variant, index) => (
        <VariantCard
          key={variant.id}
          variant={variant}
          onChange={(next) => handleUpdate(index, next)}
          onRemove={() => handleRemove(index)}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="cursor-pointer self-start"
      >
        <PlusIcon className="me-1.5 size-4" aria-hidden />
        {t('admin.products.form.addVariant')}
      </Button>
    </div>
  );
}
