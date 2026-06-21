import Link from 'next/link';
import type { Id } from '@workspace/convex/_generated/dataModel';

import { cn } from '@workspace/lib/cn';
import { t } from '@workspace/lib/i18n';

import { PlaceholderImage } from './placeholder-image';

export interface CategoryPillItem {
  _id: Id<'categories'>;
  name: string;
  slug: string;
  colorHex?: string;
}

interface CategoryPillsProps {
  items: CategoryPillItem[];
  className?: string;
}

export function CategoryPills({ items, className }: CategoryPillsProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        {t('homepage.categoryHeading')}
      </h2>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-6">
        {items.map((item) => (
          <Link
            key={item._id}
            href={`/${item.slug}`}
            className={cn(
              'group/category-pill border-border bg-card text-card-foreground flex w-40 shrink-0 snap-start flex-col gap-3 overflow-hidden rounded-xl border p-3 transition-colors',
              'md:w-auto',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
              'cursor-pointer'
            )}
          >
            <PlaceholderImage
              colorHex={item.colorHex ?? '#4A4A4A'}
              aspectRatio="square"
              label={item.name}
            />
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
