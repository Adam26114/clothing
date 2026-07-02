import { cn } from '@workspace/ui/lib/utils';
import { t } from '@workspace/lib/i18n';
import type { ProductListItem } from '@workspace/convex/products';

import { ProductCard } from './product-card';

interface FeaturedProductsProps {
  items: ProductListItem[];
  className?: string;
}

export function FeaturedProducts({ items, className }: FeaturedProductsProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <section className={cn('flex flex-col gap-6', className)}>
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        {t('homepage.featuredHeading')}
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
