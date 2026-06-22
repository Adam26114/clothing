'use client';

import * as React from 'react';
import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { Loader2Icon, MinusIcon, PlusIcon, SearchIcon, StarIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Doc, Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { useDebouncedValue } from '@workspace/lib/hooks/use-debounced-value';
import { t } from '@workspace/lib/i18n';

const DEFAULT_PAGE_SIZE = 20;

interface FeaturedProduct {
  _id: Id<'products'>;
  name: string;
  sku?: string;
  slug: string;
  firstImageId: Id<'_storage'> | null;
  firstImageColorHex: string;
}

function toFeaturedProduct(product: Doc<'products'>): FeaturedProduct {
  const firstVariant = product.colorVariants[0];
  return {
    _id: product._id,
    name: product.name,
    sku: product.sku,
    slug: product.slug,
    firstImageId: firstVariant?.images[0] ?? null,
    firstImageColorHex: firstVariant?.colorHex ?? '#E5E7EB',
  };
}

function ThumbnailCell({
  storageId,
  colorHex,
  alt,
}: {
  storageId: Id<'_storage'> | null;
  colorHex: string;
  alt: string;
}) {
  const url = useQuery(api.storage.getUrl, storageId ? { storageId } : 'skip');

  if (!storageId || url === undefined || url === null) {
    return (
      <div
        className="border-border size-9 shrink-0 rounded-md border"
        style={{ backgroundColor: colorHex }}
        aria-label="No image"
      />
    );
  }

  return (
    <div className="border-border size-9 shrink-0 overflow-hidden rounded-md border">
      <Image
        src={url}
        alt={alt}
        width={36}
        height={36}
        unoptimized
        className="size-full object-cover"
      />
    </div>
  );
}

export function FeaturedProductsManager() {
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [pendingId, setPendingId] = React.useState<Id<'products'> | null>(null);

  const featured = useQuery(api.products.adminList, {
    isFeatured: true,
    isPublished: true,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const available = useQuery(api.products.adminList, {
    isFeatured: false,
    isPublished: true,
    search: debouncedSearch.trim() === '' ? undefined : debouncedSearch.trim(),
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const toggleFeatured = useMutation(api.products.toggleFeatured);

  const featuredRows = React.useMemo<FeaturedProduct[]>(
    () => (featured?.items ?? []).map((p) => toFeaturedProduct(p)),
    [featured]
  );
  const availableRows = React.useMemo<FeaturedProduct[]>(
    () => (available?.items ?? []).map((p) => toFeaturedProduct(p)),
    [available]
  );

  const isFeaturedLoading = featured === undefined;
  const isAvailableLoading = available === undefined;

  const handleToggle = React.useCallback(
    async (productId: Id<'products'>) => {
      if (pendingId) {
        return;
      }
      setPendingId(productId);
      try {
        const result = await toggleFeatured({ id: productId });
        toast.success(
          result.isFeatured
            ? t('admin.settings.success.featuredAdded')
            : t('admin.settings.success.featuredRemoved')
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('admin.settings.error.update');
        toast.error(message);
      } finally {
        setPendingId(null);
      }
    },
    [pendingId, toggleFeatured]
  );

  return (
    <div className="flex flex-col gap-6">
      <FeaturedList
        heading={t('admin.settings.featured.currentlyFeatured')}
        rows={featuredRows}
        isLoading={isFeaturedLoading}
        actionLabel={t('admin.settings.featured.removeFromFeatured')}
        actionIcon={<MinusIcon className="size-3.5" aria-hidden />}
        emptyTitle={t('admin.settings.featured.noFeatured')}
        pendingId={pendingId}
        onAction={(id) => void handleToggle(id)}
        actionTestId="remove"
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-medium">{t('admin.settings.featured.addNew')}</h3>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon
            className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('admin.settings.featured.searchPlaceholder')}
            className="h-8 w-full ps-8 pe-8"
            aria-label={t('admin.settings.featured.searchPlaceholder')}
          />
          {search.length > 0 ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-muted-foreground hover:text-foreground absolute end-2 top-1/2 inline-flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm transition-colors"
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
        <FeaturedList
          heading={null}
          rows={availableRows}
          isLoading={isAvailableLoading}
          actionLabel={t('admin.settings.featured.addToFeatured')}
          actionIcon={<PlusIcon className="size-3.5" aria-hidden />}
          emptyTitle={t('admin.common.noResults')}
          pendingId={pendingId}
          onAction={(id) => void handleToggle(id)}
          actionTestId="add"
        />
      </div>
    </div>
  );
}

interface FeaturedListProps {
  heading: string | null;
  rows: FeaturedProduct[];
  isLoading: boolean;
  actionLabel: string;
  actionIcon: React.ReactNode;
  emptyTitle: string;
  pendingId: Id<'products'> | null;
  onAction: (id: Id<'products'>) => void;
  actionTestId: 'add' | 'remove';
}

function FeaturedList({
  heading,
  rows,
  isLoading,
  actionLabel,
  actionIcon,
  emptyTitle,
  pendingId,
  onAction,
  actionTestId,
}: FeaturedListProps) {
  return (
    <div className="flex flex-col gap-3">
      {heading ? (
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium">{heading}</h3>
          <Badge variant="secondary" className="font-normal tabular-nums">
            {rows.length}
          </Badge>
        </div>
      ) : null}
      {isLoading ? (
        <div className="border-border flex items-center justify-center rounded-lg border py-8">
          <Loader2Icon className="text-muted-foreground size-5 animate-spin" aria-hidden />
        </div>
      ) : rows.length === 0 ? (
        <div className="border-border flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
          <StarIcon className="text-muted-foreground size-5" aria-hidden />
          <p className="text-muted-foreground text-sm">{emptyTitle}</p>
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-14">
                  <span className="sr-only">{t('admin.settings.featured.thumbnail')}</span>
                </TableHead>
                <TableHead>{t('admin.settings.featured.name')}</TableHead>
                <TableHead className="w-32">{t('admin.settings.featured.sku')}</TableHead>
                <TableHead className="w-32 text-end">
                  <span className="sr-only">{t('admin.settings.featured.action')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isPending = pendingId === row._id;
                return (
                  <TableRow key={row._id}>
                    <TableCell>
                      <ThumbnailCell
                        storageId={row.firstImageId}
                        colorHex={row.firstImageColorHex}
                        alt={row.name}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      {row.sku ? (
                        <span className="font-mono text-xs tabular-nums">{row.sku}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        type="button"
                        size="sm"
                        variant={actionTestId === 'remove' ? 'outline' : 'default'}
                        onClick={() => onAction(row._id)}
                        disabled={isPending}
                        data-testid={`featured-${actionTestId}-${row._id}`}
                        className="cursor-pointer"
                      >
                        {isPending ? (
                          <Loader2Icon className="me-1.5 size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <span className="me-1.5 inline-flex items-center">{actionIcon}</span>
                        )}
                        {actionLabel}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
