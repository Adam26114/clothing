'use client';

import { useQuery } from 'convex/react';
import { useSearchParams } from 'next/navigation';
import { PackageXIcon } from 'lucide-react';

import { cn } from '@workspace/lib/cn';
import { api } from '@workspace/convex/_generated/api';
import { t } from '@workspace/lib/i18n';
import type { ProductListItem } from '@workspace/convex/products';

import { ProductCard } from './product-card';
import { ProductFilters } from './product-filters';
import { SortSelect } from './sort-select';
import { PaginationLoadMore } from './pagination-load-more';
import { EmptyState } from '@workspace/ui/components/empty-state';
import { Skeleton } from '@workspace/ui/components/skeleton';

type SortValue = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

const VALID_SORTS: SortValue[] = [
  'newest',
  'oldest',
  'price-asc',
  'price-desc',
  'name-asc',
  'name-desc',
];

function parseListParam(value: string | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function parseNumberParam(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

interface ProductGridProps {
  categorySlug: string;
  subcategorySlug?: string;
  className?: string;
}

export function ProductGrid({ categorySlug, subcategorySlug, className }: ProductGridProps) {
  const searchParams = useSearchParams();
  const sortParam = searchParams.get('sort');
  const sort: SortValue = VALID_SORTS.includes(sortParam as SortValue)
    ? (sortParam as SortValue)
    : 'newest';
  const size = parseListParam(searchParams.get('size'));
  const color = parseListParam(searchParams.get('color'));
  const minPrice = parseNumberParam(searchParams.get('min'));
  const maxPrice = parseNumberParam(searchParams.get('max'));
  const page = parseNumberParam(searchParams.get('page')) ?? 0;
  const pageSize = 20;

  const result = useQuery(api.products.list, {
    categorySlug: subcategorySlug ?? categorySlug,
    isPublished: true,
    sort,
    page,
    pageSize,
  });

  const allItems: ProductListItem[] = result?.items ?? [];
  const total: number = result?.total ?? 0;
  const isLoading = result === undefined;

  const sizeFiltered = size.length > 0 ? allItems.filter(applySizeFilter(size)) : allItems;
  const colorFiltered =
    color.length > 0 ? sizeFiltered.filter(applyColorFilter(color)) : sizeFiltered;
  const priceFiltered =
    minPrice !== undefined || maxPrice !== undefined
      ? colorFiltered.filter(applyPriceFilter(minPrice, maxPrice))
      : colorFiltered;

  const distinctColors = collectDistinctColors(allItems);

  return (
    <div className={cn('flex flex-col gap-8 lg:flex-row', className)}>
      <div className="lg:w-64 lg:shrink-0">
        <ProductFilters distinctColors={distinctColors} categoryOptions={undefined} />
      </div>
      <div className="flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            {t('plp.count', 'en', {
              count: isLoading ? 0 : priceFiltered.length,
              total: isLoading ? 0 : total,
            })}
          </p>
          <SortSelect />
        </div>
        {isLoading ? (
          <GridSkeleton />
        ) : priceFiltered.length === 0 ? (
          <EmptyState
            icon={<PackageXIcon className="size-10" />}
            title={t('plp.noResults')}
            description={t('plp.noResultsDescription')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {priceFiltered.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
        <PaginationLoadMore total={total} page={page} pageSize={pageSize} />
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-3/4 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function applySizeFilter(sizes: string[]) {
  return (product: ProductListItem): boolean => {
    for (const variant of product.colorVariants) {
      for (const size of sizes) {
        if (variant.selectedSizes.includes(size) && (variant.stock[size] ?? 0) > 0) {
          return true;
        }
      }
    }
    return false;
  };
}

function applyColorFilter(colors: string[]) {
  return (product: ProductListItem): boolean => {
    return product.colorVariants.some((variant) => colors.includes(variant.colorHex));
  };
}

function applyPriceFilter(minPrice?: number, maxPrice?: number) {
  return (product: ProductListItem): boolean => {
    const price = product.salePrice ?? product.basePrice ?? 0;
    if (minPrice !== undefined && price < minPrice) {
      return false;
    }
    if (maxPrice !== undefined && price > maxPrice) {
      return false;
    }
    return true;
  };
}

function collectDistinctColors(items: ProductListItem[]): string[] {
  const seen = new Set<string>();
  for (const product of items) {
    for (const variant of product.colorVariants) {
      seen.add(variant.colorHex);
    }
  }
  return Array.from(seen);
}
