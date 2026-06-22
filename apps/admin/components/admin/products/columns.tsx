'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Doc, Id } from '@workspace/convex/_generated/dataModel';
import { api } from '@workspace/convex/_generated/api';

import {
  RowActions,
  RowCheckbox,
  SelectionCheckbox,
  SortableHeader,
  type ColumnDef,
} from '@workspace/ui/components/data-table';
import { Badge } from '@workspace/ui/components/badge';
import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import { formatMMK } from '@workspace/lib/formatMMK';
import { t } from '@workspace/lib/i18n';

import { ActiveToggle } from './active-toggle';
import { FeaturedToggle } from './featured-toggle';
import { SoftDeleteAction } from './soft-delete-action';

export interface ProductRow {
  _id: Id<'products'>;
  name: string;
  slug: string;
  sku: string | null;
  categoryId: Id<'categories'>;
  isPublished: boolean;
  isFeatured: boolean;
  basePrice: number | null;
  salePrice: number | null;
  totalStock: number;
  firstImageId: Id<'_storage'> | null;
  firstImageColorHex: string;
}

export function toProductRow(product: Doc<'products'>): ProductRow {
  const firstVariant = product.colorVariants[0];
  return {
    _id: product._id,
    name: product.name,
    slug: product.slug,
    sku: product.sku ?? null,
    categoryId: product.categoryId,
    isPublished: product.isPublished,
    isFeatured: product.isFeatured,
    basePrice: product.basePrice ?? null,
    salePrice: product.salePrice ?? null,
    totalStock: product.colorVariants.reduce(
      (sum, v) => sum + Object.values(v.stock).reduce((s, q) => s + q, 0),
      0
    ),
    firstImageId: firstVariant?.images[0] ?? null,
    firstImageColorHex: firstVariant?.colorHex ?? '#E5E7EB',
  };
}

export function getProductSearchableText(row: ProductRow): string {
  return [row.name, row.sku ?? '', row.slug].join(' ');
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
        className="border-border size-10 shrink-0 rounded-md border"
        style={{ backgroundColor: colorHex }}
        aria-label="No image"
      />
    );
  }

  return (
    <div className="border-border size-10 shrink-0 overflow-hidden rounded-md border">
      <Image
        src={url}
        alt={alt}
        width={40}
        height={40}
        unoptimized
        className="size-full object-cover"
      />
    </div>
  );
}

export function makeProductColumns(
  categories: ReadonlyArray<Doc<'categories'>>
): ColumnDef<ProductRow, unknown>[] {
  const categoryMap = new Map(categories.map((c) => [c._id, c.name]));

  return [
    {
      id: 'select',
      header: ({ table }) => <SelectionCheckbox table={table} />,
      cell: ({ row }) => <RowCheckbox row={row} />,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'thumbnail',
      header: () => <span className="sr-only">{t('admin.products.columns.thumbnail')}</span>,
      cell: ({ row }) => (
        <ThumbnailCell
          storageId={row.original.firstImageId}
          colorHex={row.original.firstImageColorHex}
          alt={row.original.name}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <SortableHeader
          label={t('admin.products.columns.name')}
          sorted={column.getIsSorted()}
          onToggle={column.getToggleSortingHandler()}
        />
      ),
      cell: ({ row }) => (
        <Link
          href={`/products/${row.original._id}/edit`}
          className="cursor-pointer font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: 'sku',
      accessorKey: 'sku',
      header: t('admin.products.columns.sku'),
      cell: ({ row }) =>
        row.original.sku ? (
          <span className="font-mono text-sm tabular-nums">{row.original.sku}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'category',
      accessorKey: 'categoryId',
      header: t('admin.products.columns.category'),
      cell: ({ row }) => {
        const name = categoryMap.get(row.original.categoryId);
        return (
          <Badge variant="outline" className="cursor-default font-normal">
            {name ?? t('admin.products.uncategorized')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'basePrice',
      header: ({ column }) => (
        <SortableHeader
          label={t('admin.products.columns.basePrice')}
          sorted={column.getIsSorted()}
          onToggle={column.getToggleSortingHandler()}
        />
      ),
      cell: ({ row }) =>
        row.original.basePrice !== null ? (
          <div className="text-end tabular-nums">{formatMMK(row.original.basePrice)}</div>
        ) : (
          <div className="text-muted-foreground text-end">—</div>
        ),
    },
    {
      id: 'salePrice',
      accessorKey: 'salePrice',
      header: () => <div className="text-end">{t('admin.products.columns.salePrice')}</div>,
      cell: ({ row }) =>
        row.original.salePrice !== null ? (
          <div className="text-end font-medium tabular-nums">
            {formatMMK(row.original.salePrice)}
          </div>
        ) : (
          <div className="text-muted-foreground text-end">—</div>
        ),
    },
    {
      accessorKey: 'totalStock',
      header: ({ column }) => (
        <div className="text-end">
          <SortableHeader
            label={t('admin.products.columns.totalStock')}
            sorted={column.getIsSorted()}
            onToggle={column.getToggleSortingHandler()}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-end tabular-nums">
          {row.original.totalStock.toLocaleString('en-US')}
        </div>
      ),
    },
    {
      id: 'active',
      accessorKey: 'isPublished',
      header: () => <div className="text-center">{t('admin.products.columns.active')}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <ActiveToggle productId={row.original._id} isPublished={row.original.isPublished} />
        </div>
      ),
    },
    {
      id: 'featured',
      accessorKey: 'isFeatured',
      header: () => <div className="text-center">{t('admin.products.columns.featured')}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <FeaturedToggle productId={row.original._id} isFeatured={row.original.isFeatured} />
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('admin.products.columns.actions')}</span>,
      cell: ({ row }) => (
        <ProductRowActions productId={row.original._id} productName={row.original.name} />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

interface ProductRowActionsProps {
  productId: Id<'products'>;
  productName: string;
}

function ProductRowActions({ productId, productName }: ProductRowActionsProps) {
  const router = useRouter();
  const togglePublished = useMutation(api.products.togglePublished);
  const [pending, setPending] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleToggle = React.useCallback(async () => {
    setPending(true);
    try {
      await togglePublished({ id: productId });
      toast.success(t('admin.products.success.softDelete'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('admin.products.error.softDelete');
      toast.error(message);
    } finally {
      setPending(false);
    }
  }, [productId, togglePublished]);

  return (
    <>
      <RowActions>
        <DropdownMenuItem
          className="cursor-pointer"
          render={<Link href={`/products/${productId}/edit`} />}
        >
          {t('admin.common.actions.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          disabled={pending}
          onClick={() => {
            void handleToggle();
          }}
        >
          {t('admin.products.columns.active')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={() => setDeleteOpen(true)}
        >
          {t('admin.common.actions.delete')}
        </DropdownMenuItem>
      </RowActions>
      <SoftDeleteAction
        productId={productId}
        productName={productName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          router.refresh();
        }}
        renderTrigger={false}
      />
    </>
  );
}

export type { ProductRowActionsProps };
