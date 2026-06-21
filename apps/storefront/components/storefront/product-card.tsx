'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { cn } from '@workspace/lib/cn';
import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';
import type { ProductListItem } from '@workspace/convex/products';
import { Badge } from '@workspace/ui/components/badge';

import { PlaceholderImage } from './placeholder-image';
import { QuickAdd } from './quick-add';

interface ProductCardProps {
  product: ProductListItem;
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority, className }: ProductCardProps) {
  const [hoverColorHex, setHoverColorHex] = useState<string | null>(null);
  const router = useRouter();

  const firstVariant = product.colorVariants[0];
  const secondVariant = product.colorVariants[1];
  const restingHex = firstVariant?.colorHex ?? null;
  const hoverHex = secondVariant?.colorHex ?? restingHex;
  const onSale =
    product.salePrice !== undefined &&
    product.basePrice !== undefined &&
    product.salePrice < product.basePrice;
  const isOos = product.totalStock === 0;

  const handleCardClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) {
      return;
    }
    router.prefetch(`/products/${product.slug}`);
  };

  return (
    <div
      className={cn('group/product-card relative flex flex-col gap-3', className)}
      onMouseEnter={() => {
        if (hoverHex) {
          setHoverColorHex(hoverHex);
        }
      }}
      onMouseLeave={() => setHoverColorHex(null)}
    >
      <Link
        href={`/products/${product.slug}`}
        onClick={handleCardClick}
        prefetch={priority ? true : undefined}
        className="focus-visible:ring-ring/50 relative block cursor-pointer focus-visible:ring-[3px] focus-visible:outline-none"
      >
        <PlaceholderImage
          colorHex={hoverColorHex ?? restingHex}
          aspectRatio="portrait"
          label={product.name}
        />
        {isOos ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Badge variant="destructive">{t('pdp.outOfStock')}</Badge>
          </div>
        ) : null}
        {onSale && !isOos ? (
          <Badge className="absolute start-3 top-3" variant="default">
            {t('pdp.saleBadge')}
          </Badge>
        ) : null}
      </Link>
      <div className="flex flex-col gap-1">
        <Link
          href={`/products/${product.slug}`}
          className="cursor-pointer text-sm font-medium hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2">
          {onSale && product.basePrice !== undefined ? (
            <span className="text-muted-foreground text-sm tabular-nums line-through">
              {formatMMK(product.basePrice)}
            </span>
          ) : null}
          <span className="text-sm font-semibold tabular-nums">
            {formatMMK(product.salePrice ?? product.basePrice ?? 0)}
          </span>
        </div>
        {product.colorVariants.length > 0 ? (
          <div className="mt-1 flex items-center gap-1.5">
            {product.colorVariants.slice(0, 5).map((variant) => (
              <span
                key={variant.id}
                aria-hidden
                className="border-border inline-block size-3 rounded-full border"
                style={{ backgroundColor: variant.colorHex }}
              />
            ))}
            {product.colorVariants.length > 5 ? (
              <span className="text-muted-foreground text-xs">
                +{product.colorVariants.length - 5}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      {!isOos ? <QuickAdd product={product} /> : null}
    </div>
  );
}
