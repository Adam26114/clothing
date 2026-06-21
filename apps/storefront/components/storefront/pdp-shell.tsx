'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';
import { formatMMK } from '@workspace/lib/formatMMK';
import { useCartItems } from '@workspace/lib/cart/merge';
import { useCartUIStore } from '@workspace/lib/hooks/use-cart-ui';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';

import { FreePickupBadge } from './free-pickup-badge';
import { StockIndicator } from './stock-indicator';
import { ColorSelector, type ColorSwatch } from './color-selector';
import { SizeSelector } from './size-selector';
import type { ProductListItem } from '@workspace/convex/products';
import type { GalleryColorVariant } from './image-gallery';

const ImageGallery = dynamic(
  () => import('./image-gallery').then((mod) => ({ default: mod.ImageGallery })),
  {
    ssr: false,
    loading: () => <div className="bg-muted aspect-3/4 w-full animate-pulse rounded-md" />,
  }
);

interface PdpShellProps {
  product: ProductListItem;
}

export function PdpShell({ product }: PdpShellProps) {
  const colorVariants = product.colorVariants;
  const firstVariant = colorVariants[0];
  const [selectedColorId, setSelectedColorId] = useState<string>(firstVariant?.id ?? '');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { addItem } = useCartItems();
  const { open: openCart } = useCartUIStore();

  const selectedColor = useMemo(
    () => colorVariants.find((variant) => variant.id === selectedColorId) ?? firstVariant,
    [colorVariants, selectedColorId, firstVariant]
  );

  if (!selectedColor || !firstVariant) {
    return null;
  }

  const stockBySize: Record<string, number> = selectedColor.stock;
  const totalForSelectedColor = Object.values(stockBySize).reduce((sum, qty) => sum + qty, 0);
  const isOos = totalForSelectedColor === 0;
  const canAdd = !isOos && selectedSize !== null && !submitting;

  const galleryVariants: GalleryColorVariant[] = colorVariants.map((variant) => ({
    id: variant.id,
    colorName: variant.colorName,
    colorHex: variant.colorHex,
  }));

  const swatches: ColorSwatch[] = colorVariants.map((variant) => ({
    id: variant.id,
    colorName: variant.colorName,
    colorHex: variant.colorHex,
  }));

  const handleAdd = async () => {
    if (!canAdd) {
      return;
    }
    setSubmitting(true);
    try {
      await addItem({
        productId: product._id,
        colorVariantId: selectedColor.id,
        size: selectedSize as string,
        quantity: 1,
      });
      toast.success(t('pdp.addedToCart'));
      openCart();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('errors.tryAgain');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
      <div>
        <ImageGallery colorVariants={galleryVariants} selectedVariantId={selectedColor.id} />
      </div>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{product.name}</h1>
          <PriceBlock basePrice={product.basePrice} salePrice={product.salePrice} />
          <StockIndicator totalStock={totalForSelectedColor} />
        </div>
        <Separator />
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">{t('pdp.selectColor')}</h2>
          <ColorSelector
            swatches={swatches}
            selectedId={selectedColor.id}
            onSelect={setSelectedColorId}
          />
        </div>
        <Separator />
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">{t('pdp.selectSize')}</h2>
          <SizeSelector
            selectedSizes={selectedColor.selectedSizes}
            stockBySize={stockBySize}
            selectedSize={selectedSize}
            onSelect={setSelectedSize}
          />
        </div>
        <Separator />
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={handleAdd}
            disabled={!canAdd}
            className={cn('w-full cursor-pointer')}
          >
            {submitting ? t('checkout.orderProcessing') : t('pdp.addToCart')}
          </Button>
          <FreePickupBadge className="self-start" />
        </div>
        <Separator />
        <Accordion>
          <AccordionItem value="description">
            <AccordionTrigger>{t('pdp.accordionDescription')}</AccordionTrigger>
            <AccordionContent>
              <p className="leading-7">{product.description}</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="care">
            <AccordionTrigger>{t('pdp.accordionCare')}</AccordionTrigger>
            <AccordionContent>
              <p className="leading-7">{t('pdp.accordionCareBody')}</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="fit">
            <AccordionTrigger>{t('pdp.accordionFit')}</AccordionTrigger>
            <AccordionContent>
              <p className="leading-7">{t('pdp.accordionFitBody')}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

function PriceBlock({ basePrice, salePrice }: { basePrice?: number; salePrice?: number }) {
  const onSale = salePrice !== undefined && basePrice !== undefined && salePrice < basePrice;
  if (onSale && basePrice !== undefined && salePrice !== undefined) {
    return (
      <div className="flex items-baseline gap-3">
        <span className="text-muted-foreground text-base tabular-nums line-through">
          {formatMMK(basePrice)}
        </span>
        <span className="text-foreground text-xl font-semibold tabular-nums">
          {formatMMK(salePrice)}
        </span>
      </div>
    );
  }
  return (
    <span className="text-foreground text-xl font-semibold tabular-nums">
      {formatMMK(salePrice ?? basePrice ?? 0)}
    </span>
  );
}
