'use client';

import Link from 'next/link';
import { ExternalLinkIcon, HistoryIcon } from 'lucide-react';
import type { Id } from '@workspace/convex/_generated/dataModel';

import { type ColumnDef } from '@workspace/ui/components/data-table';
import { Button } from '@workspace/ui/components/button';
import { t } from '@workspace/lib/i18n';

import { StockCellEditor } from './stock-cell-editor';
import { InventoryAuditLog } from './inventory-audit-log';

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
      cell: ({ row }) => <InventoryRowActions row={row.original} />,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

interface InventoryRowActionsProps {
  row: InventoryRow;
}

function InventoryRowActions({ row }: InventoryRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <InventoryAuditLog
        productId={row.productId}
        productName={row.productName}
        trigger={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('admin.inventory.audit.title')}
            className="cursor-pointer"
          >
            <HistoryIcon aria-hidden />
          </Button>
        }
      />
      <Button
        render={<Link href={`/products/${row.productId}/edit`} />}
        variant="ghost"
        size="icon-sm"
        aria-label={t('admin.inventory.viewProduct')}
        className="cursor-pointer"
      >
        <ExternalLinkIcon aria-hidden />
      </Button>
    </div>
  );
}
