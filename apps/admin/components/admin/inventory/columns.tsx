'use client';

import Link from 'next/link';
import type { Id } from '@workspace/convex/_generated/dataModel';

import { RowActions, type ColumnDef } from '@workspace/ui/components/data-table';
import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import { t } from '@workspace/lib/i18n';

import { StockCellEditor } from './stock-cell-editor';

export interface InventoryRow {
  _id: string;
  productId: Id<'products'>;
  productName: string;
  productSlug: string;
  categoryId: Id<'categories'>;
  variantId: string;
  colorName: string;
  colorHex: string;
  size: string;
  stock: number;
  updatedAt: number;
}

export function getInventorySearchableText(row: InventoryRow): string {
  return [row.productName, row.colorName].join(' ');
}

export function makeInventoryColumns(): ColumnDef<InventoryRow, unknown>[] {
  return [
    {
      accessorKey: 'productName',
      header: () => <span className="font-medium">{t('admin.inventory.columns.product')}</span>,
      cell: ({ row }) => (
        <Link
          href={`/products/${row.original.productSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer font-medium hover:underline"
        >
          {row.original.productName}
        </Link>
      ),
      enableSorting: false,
    },
    {
      id: 'variant',
      header: () => <span className="font-medium">{t('admin.inventory.columns.variant')}</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="border-border inline-block size-3.5 shrink-0 rounded-full border"
            style={{ backgroundColor: row.original.colorHex }}
          />
          <span className="text-sm">{row.original.colorName}</span>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'size',
      header: () => <span className="font-medium">{t('admin.inventory.columns.size')}</span>,
      cell: ({ row }) => (
        <span className="font-mono text-sm tabular-nums">{row.original.size}</span>
      ),
    },
    {
      id: 'stock',
      accessorKey: 'stock',
      header: () => (
        <div className="text-end font-medium">{t('admin.inventory.columns.stock')}</div>
      ),
      cell: ({ row }) => <StockCellEditor row={row.original} />,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('admin.inventory.columns.actions')}</span>,
      cell: ({ row }) => <InventoryRowActions productId={row.original.productId} />,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

interface InventoryRowActionsProps {
  productId: Id<'products'>;
}

function InventoryRowActions({ productId }: InventoryRowActionsProps) {
  return (
    <RowActions>
      <DropdownMenuItem
        className="cursor-pointer"
        render={<Link href={`/products/${productId}/edit`} />}
      >
        {t('admin.inventory.viewProduct')}
      </DropdownMenuItem>
    </RowActions>
  );
}
