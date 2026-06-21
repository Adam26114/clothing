'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';
import { useCartItems } from '@workspace/lib/cart/merge';
import { useCartUIStore } from '@workspace/lib/hooks/use-cart-ui';
import type { ProductListItem } from '@workspace/convex/products';
import { SIZE_OPTIONS } from '@workspace/lib/constants';

interface QuickAddProps {
  product: ProductListItem;
}

export function QuickAdd({ product }: QuickAddProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { addItem } = useCartItems();
  const { open: openCart } = useCartUIStore();

  const firstVariant = product.colorVariants[0];
  if (!firstVariant) {
    return null;
  }

  const availableSizes = SIZE_OPTIONS.filter((size) => {
    const stock = firstVariant.stock[size] ?? 0;
    return stock > 0 && firstVariant.selectedSizes.includes(size);
  });

  if (availableSizes.length === 0) {
    return null;
  }

  const handleSelect = (size: string) => {
    setSelectedSize(size);
  };

  const handleAdd = async () => {
    if (!selectedSize) {
      return;
    }
    setSubmitting(true);
    try {
      await addItem({
        productId: product._id,
        colorVariantId: firstVariant.id,
        size: selectedSize,
        quantity: 1,
      });
      toast.success(t('pdp.addedToCart'));
      openCart();
      setSelectedSize(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('errors.tryAgain');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-[5.5rem] z-10 flex flex-col items-stretch gap-1 px-2 opacity-0 transition-opacity duration-150',
        'md:group-hover/product-card:pointer-events-auto md:group-hover/product-card:opacity-100'
      )}
    >
      <div className="bg-popover/95 border-border flex flex-wrap items-center justify-center gap-1 rounded-md border p-1.5 backdrop-blur-sm">
        {availableSizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => handleSelect(size)}
            className={cn(
              'min-w-7 cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors',
              'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
              selectedSize === size
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
            aria-label={t('a11y.selectSize', 'en', { size })}
            aria-pressed={selectedSize === size}
          >
            {size}
          </button>
        ))}
      </div>
      {selectedSize ? (
        <button
          type="button"
          onClick={handleAdd}
          disabled={submitting}
          className={cn(
            'bg-primary text-primary-foreground cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium',
            'hover:bg-primary/80 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {submitting ? t('checkout.orderProcessing') : t('pdp.addToCart')}
        </button>
      ) : null}
    </div>
  );
}
